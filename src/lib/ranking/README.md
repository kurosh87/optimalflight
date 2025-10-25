# NoJetlag Flight Ranking System

Scores individual flights from the Kiwi API based on jetlag recovery science.

## Features

- **Science-based scoring**: Uses the same jetlag calculator logic (0.9 days/hour east, 0.6 days/hour west)
- **Multi-factor analysis**: Timezone shift, flight timing, duration, and routing
- **Direction-aware**: Eastward flights scored differently than westward
- **Optimal timing detection**: Identifies overnight vs day flights for each direction
- **Recovery estimation**: Calculates expected recovery days for each flight

## Usage

### Basic Flight Scoring

```typescript
import { scoreFlightForJetlag, FlightOption } from '@/lib/ranking';

const flight: FlightOption = {
  id: 'flight-123',
  originIata: 'JFK',
  destinationIata: 'LHR',
  originCity: 'New York',
  destinationCity: 'London',
  originTimezone: 'America/New_York',
  destinationTimezone: 'Europe/London',
  departureTime: new Date('2025-06-15T19:00:00-04:00'),
  arrivalTime: new Date('2025-06-16T07:00:00+01:00'),
  durationMinutes: 420,
  stops: 0,
};

const score = scoreFlightForJetlag(flight);

console.log({
  overallScore: score.overallScore,            // 8.5 (0-10 scale)
  estimatedRecoveryDays: score.estimatedRecoveryDays,  // 5 days
  recommendation: score.recommendation,         // 'excellent' | 'good' | 'fair' | 'poor'
  reasoning: score.reasoning,                   // Array of reasons
  warnings: score.warnings,                     // Array of warnings
});
```

### Scoring Kiwi API Results

```typescript
import { scoreKiwiResults } from '@/lib/ranking';

// After fetching from Kiwi API
const kiwiResponse = await fetch('https://api.tequila.kiwi.com/v2/search?...');
const kiwiData = await kiwiResponse.json();

// Score all flights
const scoredFlights = scoreKiwiResults(kiwiData);

// Results sorted by overall score (best first)
scoredFlights.forEach(result => {
  console.log({
    flight: `${result.flight.originIata} → ${result.flight.destinationIata}`,
    score: result.score.overallScore,
    recoveryDays: result.score.estimatedRecoveryDays,
    recommendation: result.score.recommendation,
  });
});
```

### Get Top Flights

```typescript
import { getTopFlightsByJetlagScore } from '@/lib/ranking';

// Get top 5 flights with best jetlag scores
const topFlights = getTopFlightsByJetlagScore(kiwiData, 5);
```

### Filter by Minimum Score

```typescript
import { filterByMinimumScore } from '@/lib/ranking';

// Only show flights with score >= 7.0
const goodFlights = filterByMinimumScore(kiwiData, 7.0);
```

### Group by Recommendation

```typescript
import { groupByRecommendation } from '@/lib/ranking';

const grouped = groupByRecommendation(kiwiData);

console.log(`Excellent options: ${grouped.excellent.length}`);
console.log(`Good options: ${grouped.good.length}`);
console.log(`Fair options: ${grouped.fair.length}`);
console.log(`Poor options: ${grouped.poor.length}`);
```

## Score Components

Each flight receives scores on a 0-10 scale:

### Overall Score
Weighted combination of all component scores:
- Timezone score: 35% weight
- Timing score: 35% weight
- Duration score: 20% weight
- Route score: 10% weight

### Timezone Score
Based on timezone shift magnitude and direction:
- No shift (0-1 hours): 10
- Small shift (2-3 hours): 7-9
- Medium shift (4-6 hours): 4-7
- Large shift (7+ hours): 1-4
- **15% penalty for eastward travel** (harder to adjust)

### Timing Score
Evaluates departure/arrival times:

**Eastward travel:**
- Overnight flight (depart 6-10 PM, arrive 6-10 AM): 10
- Other overnight: 8
- Day flight arriving evening: 3
- Other day flight: 5

**Westward travel:**
- Day flight (depart 8 AM-2 PM, arrive 2-8 PM): 10
- Other day flight: 6-8
- Overnight flight: 4

### Duration Score
Compares actual duration to expected:
- At or below expected: 10
- Up to 30% longer: 8
- Up to 60% longer: 6
- Up to 100% longer: 4
- More than 100% longer: 2

### Route Score
Based on number of stops:
- Direct: 10
- 1 stop: 7
- 2 stops: 4
- 3+ stops: 2

## Recommendation Levels

- **Excellent** (8.0-10.0): Optimal timing, minimal jetlag
- **Good** (6.5-7.9): Well-timed, manageable jetlag
- **Fair** (5.0-6.4): Acceptable but not ideal
- **Poor** (0-4.9): Difficult timing, significant jetlag

## Integration with Kiwi API Endpoint

```typescript
// app/api/flight-search/route.ts
import { scoreKiwiResults } from '@/lib/ranking';

export async function POST(request: Request) {
  const { origin, destination, date } = await request.json();

  // 1. Search Kiwi API
  const kiwiResults = await searchKiwiAPI(origin, destination, date);

  // 2. Score for jetlag
  const scoredFlights = scoreKiwiResults(kiwiResults);

  // 3. Return with scores
  return Response.json({
    flights: scoredFlights,
    summary: {
      total: scoredFlights.length,
      excellent: scoredFlights.filter(f => f.score.recommendation === 'excellent').length,
      good: scoredFlights.filter(f => f.score.recommendation === 'good').length,
    }
  });
}
```

## Airport Timezone Lookup

The system includes timezones for major airports. For airports not in the hardcoded list, it falls back to UTC and logs a warning. You can:

1. Add more airports to `AIRPORT_TIMEZONES` in `kiwi-adapter.ts`
2. Query the `airports` database table for timezone data
3. Use a timezone lookup service

## Science Background

Based on:
- **Recovery rates**: 0.9 days/hour eastward, 0.6 days/hour westward
- **Direction matters**: Advancing circadian rhythm (east) is harder than delaying (west)
- **Flight timing**: Overnight flights help eastward, day flights help westward
- **Duration impact**: Longer time in cabin = more fatigue
- **Connection penalty**: Layovers add travel fatigue

See [apps/web/lib/jetlag/calculator.ts](../jetlag/calculator.ts) for detailed algorithm.
