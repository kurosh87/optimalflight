import { flights, userPreferences } from "@/lib/db/schema";
import { getDb } from "@/lib/db";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCachedUserFlights, cacheUserFlights, invalidateUserFlights } from "@/lib/redis";
import { calculateJetlagPlan } from "@/lib/jetlag/calculator";
import { adaptUserPreferences } from "@/lib/jetlag/preferences-adapter";
// import { getFlightLimit, hasFlightMonitoring } from "@/lib/billing/clerk-billing"; // Using NextAuth instead


export async function GET(request: Request) {
  const db = getDb();
  // const { requireAuth } = await import('@/lib/auth/clerk'); // Using NextAuth instead

  let userId: string;
  try {
    // userId = await requireAuth(); // Using NextAuth instead
    userId = 'temp-user-id'; // TODO: Replace with NextAuth session
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse pagination parameters
    const { searchParams } = new URL(request.url);
    const DEFAULT_LIMIT = 100;
    const MAX_LIMIT = 500;

    const limit = Math.min(
      parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT)),
      MAX_LIMIT
    );
    const offset = parseInt(searchParams.get('offset') || '0');

    // Try to get from cache first (only if no pagination params)
    if (!searchParams.has('limit') && !searchParams.has('offset')) {
      const cachedFlights = await getCachedUserFlights(userId);
      if (cachedFlights) {
        // Apply default limit to cached results
        return NextResponse.json(cachedFlights.slice(0, DEFAULT_LIMIT));
      }
    }

    // If not in cache, fetch from database with LIMITS
    // Only select needed columns (not jetlagPlan which can be large)
    const userFlights = await db
      .select({
        id: flights.id,
        ownerId: flights.ownerId,
        flightNumber: flights.flightNumber,
        airline: flights.airline,
        originAirportCode: flights.originAirportCode,
        originCity: flights.originCity,
        originTimezone: flights.originTimezone,
        destinationAirportCode: flights.destinationAirportCode,
        destinationCity: flights.destinationCity,
        destinationTimezone: flights.destinationTimezone,
        departureTime: flights.departureTime,
        arrivalTime: flights.arrivalTime,
        duration: flights.duration,
        status: flights.status,
        tripId: flights.tripId,
        sequenceOrder: flights.sequenceOrder,
        isPremiumTrial: flights.isPremiumTrial,
        // Exclude large jetlagPlan JSON from list view
        insertedAt: flights.insertedAt,
        updatedAt: flights.updatedAt,
      })
      .from(flights)
      .where(eq(flights.ownerId, userId))
      .orderBy(desc(flights.departureTime))
      .limit(limit)
      .offset(offset);

    // Convert BigInt fields to strings for JSON serialization and parse jetlagPlan
    const serializedFlights = userFlights.map((flight) => ({
      ...flight,
      id: flight.id.toString(),
      duration: flight.duration ? Number(flight.duration) : null,
      jetlagPlan: flight.jetlagPlan ? JSON.parse(flight.jetlagPlan) : null,
    }));

    // Cache the results
    await cacheUserFlights(userId, serializedFlights);

    return NextResponse.json(serializedFlights);
  } catch (error) {
    console.error("Error fetching flights:", error);
    return NextResponse.json(
      { error: "Failed to fetch flights" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const db = getDb();
  // const { requireAuth } = await import('@/lib/auth/clerk'); // Using NextAuth instead

  let userId: string;
  try {
    // userId = await requireAuth(); // Using NextAuth instead
    userId = 'temp-user-id'; // TODO: Replace with NextAuth session
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // CRITICAL: Validate and sanitize ALL input to prevent XSS and data corruption
    const { validateFlightInput, FlightCreateSchema } = await import('@/lib/validation/flight-input-schema');

    const validation = validateFlightInput(body, FlightCreateSchema);

    if (!validation.success) {
      console.warn('Flight validation failed:', validation.errors);
      return NextResponse.json(
        {
          error: 'Invalid flight data',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Use validated data (safe from XSS, size attacks, etc.)
    const {
      flightNumber,
      airline,
      originAirportCode,
      originCity,
      originTimezone,
      destinationAirportCode,
      destinationCity,
      destinationTimezone,
      departureTime,
      arrivalTime,
      duration,
      sleepQualityOverride,
      adaptabilityOverride,
    } = validation.data;

    // Check flight limit based on user's plan
    // const flightLimit = await getFlightLimit(); // Using NextAuth instead
    const flightLimit = 100; // TODO: Replace with proper plan limit from NextAuth

    // Count existing flights for this user
    const existingFlightCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(flights)
      .where(eq(flights.ownerId, userId));

    const flightCount = Number(existingFlightCount[0]?.count || 0);

    // Check if user has reached their limit
    if (flightCount >= flightLimit) {
      const limitMessage = flightLimit === 3
        ? "Free plan is limited to 3 flights per year. Upgrade to Pro for 50 flights or Business for unlimited."
        : flightLimit === 50
        ? "Pro plan is limited to 50 flights per year. Upgrade to Business for unlimited flights."
        : "You have reached your flight limit.";

      return NextResponse.json(
        {
          error: limitMessage,
          code: "FLIGHT_LIMIT_REACHED",
          currentCount: flightCount,
          limit: flightLimit
        },
        { status: 403 }
      );
    }

    // Check for duplicate flights (same origin, destination, and departure date)
    const departureDate = new Date(departureTime);
    const startOfDay = new Date(departureDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(departureDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const existingFlights = await db
      .select()
      .from(flights)
      .where(
        and(
          eq(flights.ownerId, userId),
          eq(flights.originAirportCode, originAirportCode),
          eq(flights.destinationAirportCode, destinationAirportCode),
          gte(flights.departureTime, startOfDay),
          lte(flights.departureTime, endOfDay)
        )
      );

    if (existingFlights.length > 0) {
      return NextResponse.json(
        { error: "You already have a flight with the same origin, destination, and departure date" },
        { status: 409 }
      );
    }

    // Fetch user preferences for personalized jetlag plan
    const [dbPreferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.ownerId, userId))
      .limit(1);

    // Convert database preferences to calculator format
    const calculatorPreferences = adaptUserPreferences(dbPreferences);

    // Calculate jetlag recovery plan with user preferences
    const flightDurationHours = duration ? duration / 60 : 8; // Default to 8 hours if not provided
    const jetlagPlan = calculateJetlagPlan({
      originTimezone,
      destinationTimezone,
      departureTime: new Date(departureTime),
      arrivalTime: new Date(arrivalTime),
      flightDuration: flightDurationHours,
      userPreferences: calculatorPreferences,
    });

    const [newFlight] = await db
      .insert(flights)
      .values({
        ownerId: userId,
        flightNumber: flightNumber || null,
        airline: airline || null,
        originAirportCode,
        originCity,
        originTimezone,
        destinationAirportCode,
        destinationCity,
        destinationTimezone,
        departureTime: new Date(departureTime),
        arrivalTime: new Date(arrivalTime),
        duration: duration || null,
        jetlagPlan: JSON.stringify(jetlagPlan),
        sleepQualityOverride: sleepQualityOverride || null,
        adaptabilityOverride: adaptabilityOverride || null,
        status: "upcoming",
      })
      .returning();

    // Convert BigInt fields to strings for JSON serialization and parse jetlagPlan
    const serializedFlight = {
      ...newFlight,
      id: newFlight.id.toString(),
      duration: newFlight.duration ? Number(newFlight.duration) : null,
      jetlagPlan: newFlight.jetlagPlan ? JSON.parse(newFlight.jetlagPlan) : null,
    };

    // Invalidate cache after creating new flight
    await invalidateUserFlights(userId);

    // Schedule notifications for the new flight
    try {
      const { notificationService } = await import('@/lib/services/NotificationService');
      const { flightMonitorService } = await import('@/lib/services/FlightMonitorService');

      const departureTime = new Date(newFlight.departureTime);
      const now = new Date();

      // Schedule 24-hour pre-flight reminder
      const twentyFourHoursBefore = new Date(departureTime.getTime() - 24 * 60 * 60 * 1000);
      if (twentyFourHoursBefore > now) {
        await notificationService.create({
          userId: userId,
          flightId: newFlight.id,
          type: 'pre_flight',
          title: '✈️ Flight Tomorrow!',
          message: `Your flight from ${newFlight.originCity} to ${newFlight.destinationCity} departs in 24 hours. Start preparing for your trip!`,
          priority: 'normal',
          channels: ['in_app', 'email'],
          scheduledFor: twentyFourHoursBefore,
          metadata: {
            flightNumber: newFlight.flightNumber || 'N/A',
            origin: newFlight.originCity,
            destination: newFlight.destinationCity,
            departureTime: departureTime.toISOString(),
          },
        });
      }

      // Schedule 6-hour pre-flight reminder
      const sixHoursBefore = new Date(departureTime.getTime() - 6 * 60 * 60 * 1000);
      if (sixHoursBefore > now) {
        await notificationService.create({
          userId: userId,
          flightId: newFlight.id,
          type: 'pre_flight',
          title: '🛫 Time to Head to Airport',
          message: `Your flight ${newFlight.flightNumber || ''} departs in 6 hours! Make sure you're ready to leave soon.`,
          priority: 'high',
          channels: ['in_app', 'email'],
          scheduledFor: sixHoursBefore,
          metadata: {
            flightNumber: newFlight.flightNumber || 'N/A',
            origin: newFlight.originCity,
            destination: newFlight.destinationCity,
            departureTime: departureTime.toISOString(),
          },
        });
      }

      // Create flight monitor for Pro/Business users
      // const canMonitor = await hasFlightMonitoring(); // Using NextAuth instead
      const canMonitor = true; // TODO: Replace with proper plan check from NextAuth
      if (canMonitor && newFlight.flightNumber && newFlight.airline) {
        try {
          await flightMonitorService.createMonitor(
            userId,
            newFlight.id,
            newFlight.flightNumber,
            newFlight.airline,
            departureTime
          );
          console.log(`Created flight monitor for user ${userId}, flight ${newFlight.flightNumber}`);
        } catch (monitorError) {
          console.error('Failed to create flight monitor:', monitorError);
          // Don't fail the flight creation if monitor creation fails
        }
      }

      // Send immediate welcome notification
      await notificationService.create({
        userId: userId,
        flightId: newFlight.id,
        type: 'jetlag_recovery',
        title: '🎉 Flight Added Successfully!',
        message: `We've added your flight from ${newFlight.originCity} to ${newFlight.destinationCity}. Start your jet lag recovery plan now!`,
        priority: 'normal',
        channels: ['in_app'],
      });

      console.log(`Scheduled notifications for flight ${newFlight.id}`);
    } catch (notifError) {
      console.error('Error scheduling notifications:', notifError);
      // Don't fail the flight creation if notification scheduling fails
    }

    return NextResponse.json(serializedFlight);
  } catch (error) {
    console.error("Error creating flight:", error);
    return NextResponse.json(
      { error: "Failed to create flight" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const db = getDb();
  // const { requireAuth } = await import('@/lib/auth/clerk'); // Using NextAuth instead

  let userId: string;
  try {
    // userId = await requireAuth(); // Using NextAuth instead
    userId = 'temp-user-id'; // TODO: Replace with NextAuth session
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Flight ID required" },
        { status: 400 }
      );
    }

    await db
      .delete(flights)
      .where(and(eq(flights.id, BigInt(id)), eq(flights.ownerId, userId)));

    // Invalidate cache after deleting flight
    await invalidateUserFlights(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting flight:", error);
    return NextResponse.json(
      { error: "Failed to delete flight" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const db = getDb();
  // const { requireAuth } = await import('@/lib/auth/clerk'); // Using NextAuth instead

  let userId: string;
  try {
    // userId = await requireAuth(); // Using NextAuth instead
    userId = 'temp-user-id'; // TODO: Replace with NextAuth session
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Flight ID required" },
        { status: 400 }
      );
    }

    // Build update object, converting dates if provided
    const updateValues: any = {
      ...updateData,
      updatedAt: new Date(),
    };

    if (updateData.departureTime) {
      updateValues.departureTime = new Date(updateData.departureTime);
    }
    if (updateData.arrivalTime) {
      updateValues.arrivalTime = new Date(updateData.arrivalTime);
    }

    const [updatedFlight] = await db
      .update(flights)
      .set(updateValues)
      .where(and(eq(flights.id, BigInt(id)), eq(flights.ownerId, userId)))
      .returning();

    if (!updatedFlight) {
      return NextResponse.json(
        { error: "Flight not found" },
        { status: 404 }
      );
    }

    // Convert BigInt fields to strings for JSON serialization and parse jetlagPlan
    const serializedFlight = {
      ...updatedFlight,
      id: updatedFlight.id.toString(),
      duration: updatedFlight.duration ? Number(updatedFlight.duration) : null,
      jetlagPlan: updatedFlight.jetlagPlan ? JSON.parse(updatedFlight.jetlagPlan) : null,
    };

    // Invalidate cache after updating flight
    await invalidateUserFlights(userId);

    return NextResponse.json(serializedFlight);
  } catch (error) {
    console.error("Error updating flight:", error);
    return NextResponse.json(
      { error: "Failed to update flight" },
      { status: 500 }
    );
  }
}
