/**
 * FlightMonitorService - Service for monitoring flights in real-time (Premium feature)
 */

import { getDb } from '@/lib/db';
import { flightMonitors, flights } from '@/lib/db/schema';
import { eq, and, lte, gte, or, isNull } from 'drizzle-orm';
import { getFlightStatus } from '@/lib/amadeus';
import { notificationService } from './NotificationService';
import { hasFlightMonitoring, hasRealtimeFlightTracking } from '@/lib/billing/clerk-billing';

export interface FlightChanges {
  hasChanges: boolean;
  delayMinutes?: number;
  gateChange?: { old: string | null; new: string };
  statusChange?: string;
  departureTimeChange?: Date;
  cancellation?: boolean;
}

export class FlightMonitorService {
  private db = getDb();

  /**
   * Create a new flight monitor (Pro/Business only)
   */
  async createMonitor(
    userId: string,
    flightId: bigint,
    flightNumber: string,
    carrierCode: string,
    departureDate: Date
  ) {
    // Check if user has flight monitoring feature (Pro or Business plan)
    const canMonitor = await hasFlightMonitoring();
    if (!canMonitor) {
      throw new Error('Flight monitoring requires a Pro or Business subscription');
    }

    // Check if monitor already exists for this flight
    const existing = await this.db
      .select()
      .from(flightMonitors)
      .where(
        and(eq(flightMonitors.ownerId, userId), eq(flightMonitors.flightId, flightId))
      )
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const [monitor] = await this.db
      .insert(flightMonitors)
      .values({
        ownerId: userId,
        flightId,
        flightNumber,
        carrierCode,
        departureDate,
        isActive: true,
        checkIntervalMinutes: 30,
      })
      .returning();

    console.log(`Created flight monitor for user ${userId}, flight ${flightNumber}`);
    return this.serializeMonitor(monitor);
  }

  /**
   * Get all active monitors for a user
   */
  async getUserMonitors(userId: string) {
    const monitors = await this.db
      .select()
      .from(flightMonitors)
      .where(and(eq(flightMonitors.ownerId, userId), eq(flightMonitors.isActive, true)));

    return monitors.map(this.serializeMonitor);
  }

  /**
   * Get active monitors for flights departing within a specific time range
   */
  async getMonitorsForTimeRange(startTime: Date, endTime: Date) {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60000);

    const monitors = await this.db
      .select()
      .from(flightMonitors)
      .where(
        and(
          eq(flightMonitors.isActive, true),
          gte(flightMonitors.departureDate, startTime),
          lte(flightMonitors.departureDate, endTime),
          // Only include monitors that haven't been checked in the last 15 minutes
          // or have never been checked (prevents duplicate checks)
          or(
            lte(flightMonitors.lastCheckedAt, fifteenMinutesAgo),
            isNull(flightMonitors.lastCheckedAt)
          )
        )
      );

    return monitors;
  }

  /**
   * Delete a flight monitor
   */
  async deleteMonitor(monitorId: bigint, userId: string) {
    await this.db
      .delete(flightMonitors)
      .where(and(eq(flightMonitors.id, monitorId), eq(flightMonitors.ownerId, userId)));

    console.log(`Deleted flight monitor ${monitorId} for user ${userId}`);
  }

  /**
   * Deactivate a flight monitor
   */
  async deactivateMonitor(monitorId: bigint) {
    await this.db
      .update(flightMonitors)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(flightMonitors.id, monitorId));
  }

  /**
   * Check flight status and detect changes
   * Enhanced with proper timing qualifiers (STD/ETD/ATD) and terminal/gate detection
   */
  async checkFlightStatus(monitor: any): Promise<FlightChanges | null> {
    try {
      // Format date as YYYY-MM-DD
      const departureDate = new Date(monitor.departureDate);
      const formattedDate = departureDate.toISOString().split('T')[0];

      // Get current flight status from Amadeus (returns raw data array)
      const response = await getFlightStatus({
        carrierCode: monitor.carrierCode,
        flightNumber: monitor.flightNumber.replace(monitor.carrierCode, ''),
        scheduledDepartureDate: formattedDate,
      });

      if (!response || response.length === 0) {
        console.log(`No flight status found for ${monitor.flightNumber}`);
        return null;
      }

      const flight = response[0];
      const changes: FlightChanges = { hasChanges: false };

      // Extract departure and arrival points
      const departurePoint = flight.flightPoints?.find((p: any) => p.departure);
      const arrivalPoint = flight.flightPoints?.find((p: any) => p.arrival);

      if (!departurePoint) {
        console.warn(`No departure point for flight ${monitor.flightNumber}`);
        return null;
      }

      // GATE CHANGE DETECTION
      const currentGate = departurePoint.departure?.gate?.mainGate;
      if (monitor.lastGate && currentGate && currentGate !== monitor.lastGate) {
        changes.gateChange = {
          old: monitor.lastGate,
          new: currentGate,
        };
        changes.hasChanges = true;
        console.log(`Gate change detected: ${monitor.lastGate} → ${currentGate}`);
      }

      // DELAY DETECTION using timing qualifiers
      const timings = departurePoint.departure?.timings || [];
      const stdTiming = timings.find((t: any) => t.qualifier === 'STD'); // Scheduled
      const etdTiming = timings.find((t: any) => t.qualifier === 'ETD'); // Estimated
      const atdTiming = timings.find((t: any) => t.qualifier === 'ATD'); // Actual

      // If flight has departed (ATD exists), deactivate monitor
      if (atdTiming) {
        console.log(`Flight ${monitor.flightNumber} has departed - deactivating monitor`);
        await this.deactivateMonitor(monitor.id);
        changes.statusChange = 'departed';
        changes.hasChanges = true;
      }

      // Calculate delay if STD and ETD exist
      if (stdTiming && etdTiming) {
        const scheduled = new Date(stdTiming.value);
        const estimated = new Date(etdTiming.value);
        const delayMinutes = Math.round((estimated.getTime() - scheduled.getTime()) / 60000);

        // Only report significant delays (≥15 minutes)
        if (Math.abs(delayMinutes) >= 15) {
          // Check if this is a new delay or delay has changed
          const previousDelay = monitor.lastDepartureTime
            ? Math.round((new Date(monitor.lastDepartureTime).getTime() - scheduled.getTime()) / 60000)
            : 0;

          if (Math.abs(delayMinutes - previousDelay) >= 5) {
            // Delay changed by at least 5 minutes
            changes.delayMinutes = delayMinutes;
            changes.departureTimeChange = estimated;
            changes.hasChanges = true;
            console.log(`Delay detected: ${delayMinutes} minutes`);
          }
        }
      }

      // CANCELLATION DETECTION
      // If past scheduled time but no ETD/ATD, likely cancelled
      const now = new Date();
      const scheduledTime = stdTiming ? new Date(stdTiming.value) : null;
      if (scheduledTime && now > scheduledTime && !etdTiming && !atdTiming) {
        changes.cancellation = true;
        changes.hasChanges = true;
        console.log(`Flight ${monitor.flightNumber} likely cancelled`);
      }

      // DERIVE STATUS from timings
      let currentStatus = 'scheduled';
      if (atdTiming) {
        currentStatus = 'departed';
      } else if (changes.cancellation) {
        currentStatus = 'cancelled';
      } else if (etdTiming && changes.delayMinutes && changes.delayMinutes > 0) {
        currentStatus = 'delayed';
      }

      // STATUS CHANGE DETECTION
      if (monitor.lastStatus && currentStatus !== monitor.lastStatus) {
        changes.statusChange = currentStatus;
        changes.hasChanges = true;
        console.log(`Status change: ${monitor.lastStatus} → ${currentStatus}`);
      }

      // Update monitor with latest data
      await this.db
        .update(flightMonitors)
        .set({
          lastStatus: currentStatus,
          lastGate: currentGate || monitor.lastGate,
          lastDepartureTime: etdTiming ? new Date(etdTiming.value) : monitor.lastDepartureTime,
          lastCheckedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(flightMonitors.id, monitor.id));

      return changes;
    } catch (error: any) {
      console.error(`Error checking flight status for monitor ${monitor.id}:`, error);

      // Handle specific Amadeus errors
      const statusCode = error.response?.statusCode;
      const errorCode = error.response?.data?.errors?.[0]?.code;

      if (statusCode === 401) {
        console.error('Amadeus authentication failed - token may be expired');
      } else if (statusCode === 429) {
        console.error('Amadeus rate limit exceeded - will retry later');
      } else if (errorCode === '4926') {
        console.error('Invalid date - cannot query past dates. Deactivating monitor.');
        await this.deactivateMonitor(monitor.id);
      }

      return null;
    }
  }

  /**
   * Process all active flight monitors
   */
  async processAllMonitors() {
    // Get all active monitors that haven't been checked recently
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60000);

    const monitors = await this.db
      .select()
      .from(flightMonitors)
      .where(
        and(
          eq(flightMonitors.isActive, true),
          // Check if lastCheckedAt is null or older than 30 minutes
          lte(flightMonitors.lastCheckedAt, thirtyMinutesAgo)
        )
      )
      .limit(50); // Process max 50 per run

    console.log(`Processing ${monitors.length} active flight monitors`);

    for (const monitor of monitors) {
      try {
        // Check if user still has flight monitoring access
        const canMonitor = await hasRealtimeFlightTracking();
        if (!canMonitor) {
          console.log(`User ${monitor.ownerId} no longer has flight monitoring access, deactivating monitor`);
          await this.deactivateMonitor(monitor.id);
          continue;
        }

        // Check flight status
        const changes = await this.checkFlightStatus(monitor);

        // Create notifications if there are changes
        if (changes?.hasChanges) {
          await this.notifyChanges(monitor, changes);
        }
      } catch (error) {
        console.error(`Error processing monitor ${monitor.id}:`, error);
      }
    }

    return monitors.length;
  }

  /**
   * Create notifications for flight changes
   */
  async notifyChanges(monitor: any, changes: FlightChanges) {
    const flight = await this.db
      .select()
      .from(flights)
      .where(eq(flights.id, monitor.flightId))
      .limit(1);

    if (flight.length === 0) {
      console.error(`Flight ${monitor.flightId} not found`);
      return;
    }

    const flightData = flight[0];

    // Cancellation notification (highest priority)
    if (changes.cancellation) {
      await notificationService.create({
        userId: monitor.ownerId,
        flightId: monitor.flightId,
        type: 'flight_cancellation',
        title: '🚫 Flight Cancelled',
        message: `Your flight ${monitor.flightNumber} from ${flightData.originCity} to ${flightData.destinationCity} has been cancelled.`,
        priority: 'urgent',
        channels: ['in_app', 'email'],
        metadata: {
          flightNumber: monitor.flightNumber,
          origin: flightData.originCity,
          destination: flightData.destinationCity,
          status: 'cancelled',
        },
      });
      return;
    }

    // Delay notification
    if (changes.delayMinutes && Math.abs(changes.delayMinutes) >= 15) {
      const delayType = changes.delayMinutes > 0 ? 'delayed' : 'ahead of schedule';
      await notificationService.create({
        userId: monitor.ownerId,
        flightId: monitor.flightId,
        type: 'flight_delay',
        title: `⏰ Flight ${delayType}`,
        message: `Your flight ${monitor.flightNumber} is ${Math.abs(changes.delayMinutes)} minutes ${delayType}.`,
        priority: changes.delayMinutes > 60 ? 'high' : 'normal',
        channels: ['in_app', 'email'],
        metadata: {
          flightNumber: monitor.flightNumber,
          origin: flightData.originCity,
          destination: flightData.destinationCity,
          delayMinutes: changes.delayMinutes,
          newDepartureTime: changes.departureTimeChange?.toISOString(),
        },
      });
    }

    // Gate change notification
    if (changes.gateChange) {
      await notificationService.create({
        userId: monitor.ownerId,
        flightId: monitor.flightId,
        type: 'gate_change',
        title: '🚪 Gate Change',
        message: `Gate changed from ${changes.gateChange.old || 'TBD'} to ${changes.gateChange.new} for flight ${monitor.flightNumber}.`,
        priority: 'high',
        channels: ['in_app', 'email'],
        metadata: {
          flightNumber: monitor.flightNumber,
          origin: flightData.originCity,
          destination: flightData.destinationCity,
          oldGate: changes.gateChange.old,
          newGate: changes.gateChange.new,
        },
      });
    }

    // Status change notification (if not cancellation)
    if (changes.statusChange && !changes.cancellation) {
      await notificationService.create({
        userId: monitor.ownerId,
        flightId: monitor.flightId,
        type: 'flight_delay',
        title: '📢 Flight Status Update',
        message: `Status updated to "${changes.statusChange}" for flight ${monitor.flightNumber}.`,
        priority: 'normal',
        channels: ['in_app'],
        metadata: {
          flightNumber: monitor.flightNumber,
          origin: flightData.originCity,
          destination: flightData.destinationCity,
          status: changes.statusChange,
        },
      });
    }
  }


  /**
   * Serialize monitor for JSON response
   */
  private serializeMonitor(monitor: any) {
    return {
      ...monitor,
      id: monitor.id.toString(),
      flightId: monitor.flightId.toString(),
      checkIntervalMinutes: Number(monitor.checkIntervalMinutes),
    };
  }
}

// Export singleton instance
export const flightMonitorService = new FlightMonitorService();
