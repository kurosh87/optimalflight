/**
 * Example: Score sample flights with the ranking system
 * Run with: npx tsx lib/ranking/example.ts
 */

import { scoreFlightForJetlag, scoreAndRankFlights, FlightOption } from './flight-scorer';

// Sample flights: JFK → Tokyo (significant eastward travel)
const sampleFlights: FlightOption[] = [
  {
    id: 'flight-1',
    originIata: 'JFK',
    destinationIata: 'NRT',
    originCity: 'New York',
    destinationCity: 'Tokyo',
    originTimezone: 'America/New_York',
    destinationTimezone: 'Asia/Tokyo',
    departureTime: new Date('2025-06-15T18:30:00-04:00'), // 6:30 PM departure
    arrivalTime: new Date('2025-06-16T21:45:00+09:00'),   // 9:45 PM arrival next day
    durationMinutes: 815, // 13h 15m
    airline: 'ANA',
    aircraftType: '787',
    stops: 0,
  },
  {
    id: 'flight-2',
    originIata: 'JFK',
    destinationIata: 'NRT',
    originCity: 'New York',
    destinationCity: 'Tokyo',
    originTimezone: 'America/New_York',
    destinationTimezone: 'Asia/Tokyo',
    departureTime: new Date('2025-06-15T11:00:00-04:00'), // 11:00 AM departure
    arrivalTime: new Date('2025-06-16T14:30:00+09:00'),   // 2:30 PM arrival next day
    durationMinutes: 810, // 13h 30m
    airline: 'JAL',
    aircraftType: '777',
    stops: 0,
  },
  {
    id: 'flight-3',
    originIata: 'JFK',
    destinationIata: 'NRT',
    originCity: 'New York',
    destinationCity: 'Tokyo',
    originTimezone: 'America/New_York',
    destinationTimezone: 'Asia/Tokyo',
    departureTime: new Date('2025-06-15T13:00:00-04:00'), // 1:00 PM departure
    arrivalTime: new Date('2025-06-16T20:30:00+09:00'),   // 8:30 PM arrival next day (with layover)
    durationMinutes: 1050, // 17h 30m (long connection)
    airline: 'United',
    aircraftType: '737',
    stops: 1,
  },
];

// Westbound sample: Tokyo → San Francisco
const westboundFlights: FlightOption[] = [
  {
    id: 'flight-4',
    originIata: 'NRT',
    destinationIata: 'SFO',
    originCity: 'Tokyo',
    destinationCity: 'San Francisco',
    originTimezone: 'Asia/Tokyo',
    destinationTimezone: 'America/Los_Angeles',
    departureTime: new Date('2025-06-20T10:30:00+09:00'), // 10:30 AM departure
    arrivalTime: new Date('2025-06-20T04:15:00-07:00'),   // 4:15 AM same day (crosses dateline)
    durationMinutes: 585, // 9h 45m
    airline: 'United',
    aircraftType: '787',
    stops: 0,
  },
  {
    id: 'flight-5',
    originIata: 'NRT',
    destinationIata: 'SFO',
    originCity: 'Tokyo',
    destinationCity: 'San Francisco',
    originTimezone: 'Asia/Tokyo',
    destinationTimezone: 'America/Los_Angeles',
    departureTime: new Date('2025-06-20T17:00:00+09:00'), // 5:00 PM departure (overnight)
    arrivalTime: new Date('2025-06-20T10:45:00-07:00'),   // 10:45 AM same day
    durationMinutes: 585, // 9h 45m
    airline: 'ANA',
    aircraftType: '777',
    stops: 0,
  },
];

console.log('='.repeat(80));
console.log('NOJETLAG FLIGHT RANKING SYSTEM - SAMPLE RESULTS');
console.log('='.repeat(80));
console.log();

// Eastbound example
console.log('📍 ROUTE 1: New York (JFK) → Tokyo (NRT) - EASTBOUND');
console.log('   Direction: EASTWARD (harder to adjust)');
console.log('   Expected: Overnight flights score better');
console.log();

const rankedEastbound = scoreAndRankFlights(sampleFlights);

rankedEastbound.forEach((flight, index) => {
  const score = flight.score;
  console.log(`${index + 1}. Flight ${flight.id} - Overall Score: ${score.overallScore}/10`);
  console.log(`   ${flight.airline} | Depart: ${flight.departureTime.toLocaleString()}`);
  console.log(`   Arrive: ${flight.arrivalTime.toLocaleString()}`);
  console.log(`   Duration: ${Math.floor(flight.durationMinutes / 60)}h ${flight.durationMinutes % 60}m | Stops: ${flight.stops}`);
  console.log();
  console.log(`   📊 Score Breakdown:`);
  console.log(`      • Timezone:  ${score.timezoneScore.toFixed(1)}/10`);
  console.log(`      • Timing:    ${score.timingScore.toFixed(1)}/10 ${score.isOptimalTiming ? '✓ Optimal' : ''}`);
  console.log(`      • Duration:  ${score.durationScore.toFixed(1)}/10`);
  console.log(`      • Route:     ${score.routeScore.toFixed(1)}/10`);
  console.log();
  console.log(`   🏷️  Recommendation: ${score.recommendation.toUpperCase()}`);
  console.log(`   ⏱️  Recovery Time: ~${score.estimatedRecoveryDays} days`);
  console.log(`   🧭 Direction: ${score.direction} (${score.timezoneShiftHours}h timezone shift)`);
  console.log(`   ${score.isOvernightFlight ? '🌙' : '☀️'} ${score.isOvernightFlight ? 'Overnight flight' : 'Day flight'}`);
  console.log();
  console.log(`   💡 Reasoning:`);
  score.reasoning.forEach(reason => console.log(`      • ${reason}`));
  if (score.warnings.length > 0) {
    console.log();
    console.log(`   ⚠️  Warnings:`);
    score.warnings.forEach(warning => console.log(`      • ${warning}`));
  }
  console.log();
  console.log('-'.repeat(80));
  console.log();
});

// Westbound example
console.log();
console.log('📍 ROUTE 2: Tokyo (NRT) → San Francisco (SFO) - WESTBOUND');
console.log('   Direction: WESTWARD (easier to adjust)');
console.log('   Expected: Day flights score better');
console.log();

const rankedWestbound = scoreAndRankFlights(westboundFlights);

rankedWestbound.forEach((flight, index) => {
  const score = flight.score;
  console.log(`${index + 1}. Flight ${flight.id} - Overall Score: ${score.overallScore}/10`);
  console.log(`   ${flight.airline} | Depart: ${flight.departureTime.toLocaleString()}`);
  console.log(`   Arrive: ${flight.arrivalTime.toLocaleString()}`);
  console.log(`   Duration: ${Math.floor(flight.durationMinutes / 60)}h ${flight.durationMinutes % 60}m | Stops: ${flight.stops}`);
  console.log();
  console.log(`   📊 Score Breakdown:`);
  console.log(`      • Timezone:  ${score.timezoneScore.toFixed(1)}/10`);
  console.log(`      • Timing:    ${score.timingScore.toFixed(1)}/10 ${score.isOptimalTiming ? '✓ Optimal' : ''}`);
  console.log(`      • Duration:  ${score.durationScore.toFixed(1)}/10`);
  console.log(`      • Route:     ${score.routeScore.toFixed(1)}/10`);
  console.log();
  console.log(`   🏷️  Recommendation: ${score.recommendation.toUpperCase()}`);
  console.log(`   ⏱️  Recovery Time: ~${score.estimatedRecoveryDays} days`);
  console.log(`   🧭 Direction: ${score.direction} (${score.timezoneShiftHours}h timezone shift)`);
  console.log(`   ${score.isOvernightFlight ? '🌙' : '☀️'} ${score.isOvernightFlight ? 'Overnight flight' : 'Day flight'}`);
  console.log();
  console.log(`   💡 Reasoning:`);
  score.reasoning.forEach(reason => console.log(`      • ${reason}`));
  if (score.warnings.length > 0) {
    console.log();
    console.log(`   ⚠️  Warnings:`);
    score.warnings.forEach(warning => console.log(`      • ${warning}`));
  }
  console.log();
  console.log('-'.repeat(80));
  console.log();
});

console.log();
console.log('='.repeat(80));
console.log('KEY INSIGHTS');
console.log('='.repeat(80));
console.log();
console.log('• Eastbound (JFK→NRT): Evening departures (Flight 1) score highest');
console.log('  - Overnight flights align with natural sleep, arrive morning');
console.log('  - Recovery: ~4-5 days expected');
console.log();
console.log('• Westbound (NRT→SFO): Morning departures (Flight 4) score highest');
console.log('  - Day flights help delay circadian rhythm');
console.log('  - Recovery: ~3-4 days expected (easier than eastward)');
console.log();
console.log('• Direct flights always preferred over connections');
console.log('• Larger timezone shifts = longer recovery regardless of timing');
console.log();
