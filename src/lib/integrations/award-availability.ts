/**
 * Award Availability Integration Planning
 * The KILLER FEATURE FlightConnections lacks
 *
 * Potential Partners:
 * - Seats.aero ($partnership or API)
 * - AwardFares (data feed)
 * - ExpertFlyer (API if available)
 * - Direct GDS connections (expensive)
 *
 * This shows REAL-TIME award seat availability on routes
 */

export interface AwardSeat {
  routeId: string;
  airline: string;
  origin: string;
  destination: string;
  date: string;
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
  milesRequired: number;
  taxesFees: number;
  availability: number; // Number of seats available
  source: 'seats_aero' | 'award_fares' | 'manual' | 'gds';
  lastChecked: string; // ISO timestamp
}

/**
 * Check award availability for a route
 * PREMIUM FEATURE (Expert tier and above)
 */
export async function getAwardAvailability(
  origin: string,
  destination: string,
  date: string,
  cabinClass: string
): Promise<AwardSeat[]> {
  // TODO: Integrate with Seats.aero API or similar
  // For now, return empty array

  // This would be the killer feature:
  // Shows "2 Business Saver seats available Nov 15" on the map

  return [];
}

/**
 * Subscribe to award availability alerts
 * PREMIUM FEATURE
 */
export async function createAwardAlert(
  userId: string,
  route: {
    origin: string;
    destination: string;
    alliance?: string;
    cabinClass: string;
    maxMiles?: number;
  }
): Promise<{ alertId: string }> {
  // TODO: Create alert in database
  // TODO: Set up monitoring job
  // TODO: Send notification when seats become available

  return { alertId: 'alert_123' };
}

/**
 * Format award availability for display
 */
export function formatAwardAvailability(seats: AwardSeat[]): string {
  if (seats.length === 0) {
    return 'No award seats available';
  }

  // Group by cabin class
  const byCabin = seats.reduce((acc, seat) => {
    if (!acc[seat.cabinClass]) acc[seat.cabinClass] = [];
    acc[seat.cabinClass].push(seat);
    return acc;
  }, {} as Record<string, AwardSeat[]>);

  const summary = Object.entries(byCabin)
    .map(([cabin, seats]) => {
      const total = seats.reduce((sum, s) => sum + s.availability, 0);
      const cabinName = cabin.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      return `${total} ${cabinName} seat${total > 1 ? 's' : ''}`;
    })
    .join(', ');

  return summary;
}

/**
 * Integration roadmap
 */
export const AWARD_AVAILABILITY_ROADMAP = {
  phase1: {
    name: 'Manual Curation',
    cost: 0,
    coverage: '10%',
    description: 'Manually check top 50 routes, update weekly',
  },
  phase2: {
    name: 'Seats.aero Partnership',
    cost: 'Revenue share or $299-499/month',
    coverage: '40%',
    description: 'API integration for major routes',
  },
  phase3: {
    name: 'GDS Integration',
    cost: '$2,000-5,000/month',
    coverage: '90%+',
    description: 'Direct GDS connections for real-time data',
  },
};

/**
 * Pricing justification for users
 */
export const AWARD_AVAILABILITY_VALUE_PROP = `
Finding ONE First Class award ticket can save $5,000-8,000.

Expert tier ($149/year) pays for itself if you find:
- 1 Business Class award (saves $2,000-4,000)
- 2 Economy awards to Europe (saves $500-1,000 each)
- Any First Class award (saves $5,000-10,000)

ROI: 10x-50x on subscription cost.
`;
