/**
 * Airline Service Rankings Seeding Script
 *
 * Generates and seeds airline service quality and jetlag awareness rankings
 * Run with: npx tsx scripts/seed/seed-airline-rankings.ts
 */

import { getDb } from '../../lib/db';
import { airlineServiceRankings } from '../../app/schema/schema';
import { generateBatchAirlines } from '../../lib/ai/data-generator';
import { calculateAirlineScore } from '../../lib/ai/score-calculator';
import { eq } from 'drizzle-orm';

// Major airlines to seed with service rankings
const MAJOR_AIRLINES = [
  // Premium Full-Service Carriers
  'SQ', // Singapore Airlines
  'QR', // Qatar Airways
  'EK', // Emirates
  'NH', // ANA (All Nippon Airways)
  'CX', // Cathay Pacific
  'EY', // Etihad Airways
  'TG', // Thai Airways
  'KE', // Korean Air
  'OZ', // Asiana Airlines
  'JL', // Japan Airlines

  // US Major Carriers
  'AA', // American Airlines
  'DL', // Delta Air Lines
  'UA', // United Airlines
  'AS', // Alaska Airlines
  'B6', // JetBlue Airways
  'WN', // Southwest Airlines

  // European Carriers
  'LH', // Lufthansa
  'BA', // British Airways
  'AF', // Air France
  'KL', // KLM
  'LX', // Swiss International
  'OS', // Austrian Airlines
  'AZ', // ITA Airways
  'IB', // Iberia
  'TP', // TAP Air Portugal
  'SK', // SAS Scandinavian
  'AY', // Finnair

  // Asia-Pacific Carriers
  'CA', // Air China
  'MU', // China Eastern
  'CZ', // China Southern
  'CI', // China Airlines
  'BR', // EVA Air
  'QF', // Qantas
  'NZ', // Air New Zealand
  'GA', // Garuda Indonesia
  'MH', // Malaysia Airlines
  'PR', // Philippine Airlines

  // Middle East & Africa
  'MS', // EgyptAir
  'ET', // Ethiopian Airlines
  'SA', // South African Airways
  'AT', // Royal Air Maroc

  // Latin America
  'LA', // LATAM Airlines
  'AM', // Aeromexico
  'AV', // Avianca
  'CM', // Copa Airlines

  // Low-Cost Carriers (for comparison)
  'FR', // Ryanair
  'U2', // easyJet
  'F9', // Frontier Airlines
  'NK', // Spirit Airlines
];

async function seedAirlineRankings() {
  console.log('');
  console.log('═'.repeat(70));
  console.log('🛫 AIRLINE SERVICE RANKINGS SEEDING SCRIPT');
  console.log('═'.repeat(70));
  console.log('');

  const db = getDb();
  const startTime = Date.now();

  try {
    // Step 1: Generate LLM data for all airlines
    console.log(`📊 Generating service data for ${MAJOR_AIRLINES.length} airlines...`);
    console.log('   This will analyze jetlag programs, reliability, and service quality');
    console.log('');

    const results = await generateBatchAirlines(MAJOR_AIRLINES);

    // Step 2: Process and insert into database
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    console.log('');
    console.log('💾 Inserting rankings into database...');
    console.log('');

    for (const result of results) {
      if (!result.success || !result.data) {
        console.log(`   ❌ Skipping ${result.code} - generation failed`);
        skippedCount++;
        continue;
      }

      try {
        const airlineData = result.data;

        // Calculate scores using our algorithm
        const scores = calculateAirlineScore({
          mealQualityRating: airlineData.serviceQuality.mealQualityRating,
          mealTimingFlexibility: airlineData.serviceQuality.mealTimingFlexibility,
          providesSleepKits: airlineData.serviceQuality.providesSleepKits,
          sleepKitQuality: airlineData.serviceQuality.sleepKitQuality as 'basic' | 'standard' | 'premium',
          cabinCrewTrainingScore: airlineData.serviceQuality.cabinCrewTrainingScore,
          onTimePerformancePercent: airlineData.reliability.onTimePerformancePercent,
          delayMinutesAvg: airlineData.reliability.delayMinutesAvg,
          cancellationRatePercent: airlineData.reliability.cancellationRatePercent,
          offersJetlagMenu: airlineData.jetlagPrograms.offersJetlagMenu,
          lightManagementStrategy: airlineData.jetlagPrograms.lightManagementStrategy,
          sleepOptimizationPrograms: airlineData.jetlagPrograms.sleepOptimizationPrograms,
          melatoninAvailable: airlineData.jetlagPrograms.melatoninAvailable,
          seatComfortRating: airlineData.amenities.seatComfortRating,
          entertainmentQuality: airlineData.amenities.entertainmentQuality,
        });

        // Prepare database record
        const rankingRecord = {
          id: `airline_${airlineData.iataCode.toLowerCase()}`,
          airlineId: null, // Will be linked if airline exists in airlines table
          iataCode: airlineData.iataCode,
          airlineName: airlineData.airlineName,
          mealQualityRating: airlineData.serviceQuality.mealQualityRating,
          mealTimingFlexibility: airlineData.serviceQuality.mealTimingFlexibility,
          providesSleepKits: airlineData.serviceQuality.providesSleepKits,
          sleepKitQuality: airlineData.serviceQuality.sleepKitQuality,
          cabinCrewTrainingScore: airlineData.serviceQuality.cabinCrewTrainingScore,
          onTimePerformancePercent: airlineData.reliability.onTimePerformancePercent,
          delayMinutesAvg: airlineData.reliability.delayMinutesAvg,
          cancellationRatePercent: airlineData.reliability.cancellationRatePercent,
          offersJetlagMenu: airlineData.jetlagPrograms.offersJetlagMenu,
          lightManagementStrategy: airlineData.jetlagPrograms.lightManagementStrategy,
          sleepOptimizationPrograms: airlineData.jetlagPrograms.sleepOptimizationPrograms,
          melatoninAvailable: airlineData.jetlagPrograms.melatoninAvailable,
          seatComfortRating: airlineData.amenities.seatComfortRating,
          entertainmentQuality: airlineData.amenities.entertainmentQuality,
          serviceScore: scores.serviceScore,
          reliabilityScore: scores.reliabilityScore,
          jetlagAwarenessScore: scores.jetlagAwarenessScore,
          overallScore: scores.overallScore,
          dataSource: airlineData.sources?.join(', ') || 'AI-generated',
          lastVerified: new Date(),
          updatedAt: new Date(),
        };

        // Check if record exists
        const existing = await db
          .select()
          .from(airlineServiceRankings)
          .where(eq(airlineServiceRankings.iataCode, airlineData.iataCode))
          .limit(1);

        if (existing.length > 0) {
          // Update existing
          await db
            .update(airlineServiceRankings)
            .set(rankingRecord)
            .where(eq(airlineServiceRankings.iataCode, airlineData.iataCode));

          console.log(`   ✏️  Updated: ${airlineData.iataCode.padEnd(3)} - ${airlineData.airlineName.padEnd(30)} (Score: ${scores.overallScore}/10)`);
          updatedCount++;
        } else {
          // Insert new
          await db.insert(airlineServiceRankings).values(rankingRecord);

          console.log(`   ✅ Inserted: ${airlineData.iataCode.padEnd(3)} - ${airlineData.airlineName.padEnd(30)} (Score: ${scores.overallScore}/10)`);
          insertedCount++;
        }
      } catch (dbError) {
        console.error(`   ❌ Database error for ${result.code}:`, dbError);
        skippedCount++;
      }
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('');
    console.log('═'.repeat(70));
    console.log('🎉 SEEDING COMPLETE!');
    console.log('═'.repeat(70));
    console.log('');
    console.log('📊 Summary:');
    console.log(`   ✅ Inserted:  ${insertedCount}`);
    console.log(`   ✏️  Updated:   ${updatedCount}`);
    console.log(`   ❌ Skipped:   ${skippedCount}`);
    console.log(`   📦 Total:     ${MAJOR_AIRLINES.length}`);
    console.log('');
    console.log(`⏱️  Duration:  ${duration}s`);
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Run: npx tsx scripts/seed/seed-airport-facilities.ts');
    console.log('   2. Or run all: npx tsx scripts/seed/seed-all-rankings.ts');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Fatal error during seeding:', error);
    console.error('');
    process.exit(1);
  }
}

// Run the script
seedAirlineRankings()
  .then(() => {
    console.log('✨ Done!');
    console.log('');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
