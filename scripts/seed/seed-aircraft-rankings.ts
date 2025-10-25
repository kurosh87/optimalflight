/**
 * Aircraft Rankings Seeding Script
 *
 * Generates and seeds aircraft jetlag rankings using LLM-powered data generator
 * Run with: npx tsx scripts/seed/seed-aircraft-rankings.ts
 */

import { getDb } from '../../lib/db';
import { aircraftRankings } from '../../app/schema/schema';
import { generateBatchAircraft } from '../../lib/ai/data-generator';
import { calculateAircraftScore } from '../../lib/ai/score-calculator';
import { eq } from 'drizzle-orm';

// Common aircraft types to seed with jetlag rankings
const COMMON_AIRCRAFT = [
  // Boeing 787 Family (Best-in-class for jetlag)
  '789', // 787-9 Dreamliner
  '788', // 787-8 Dreamliner
  '781', // 787-10 Dreamliner

  // Boeing 777 Family (Excellent long-haul)
  '77W', // 777-300ER
  '772', // 777-200
  '773', // 777-300
  '77L', // 777-200LR
  '779', // 777-9X

  // Airbus A350 Family (Excellent for jetlag)
  '359', // A350-900
  '35K', // A350-1000

  // Airbus A380 (Spacious, moderate jetlag impact)
  '388', // A380-800

  // Airbus A330 Family (Good long-haul)
  '333', // A330-300
  '332', // A330-200
  '339', // A330-900neo
  '338', // A330-800neo

  // Boeing 767 (Moderate)
  '763', // 767-300
  '764', // 767-400
  '76W', // 767-300ER

  // Airbus A321 Family (Narrow-body long-range)
  '321', // A321
  '32N', // A321neo
  '32Q', // A321neo LR
  '32B', // A321neo XLR

  // Airbus A320 Family (Short/medium-haul)
  '320', // A320
  '20N', // A320neo

  // Boeing 737 Family (Narrow-body)
  '738', // 737-800
  '739', // 737-900
  '73J', // 737 MAX 8
  '7M8', // 737 MAX 8
  '7M9', // 737 MAX 9
  '7M7', // 737 MAX 7

  // Boeing 747 (Retiring but still in service)
  '744', // 747-400
  '748', // 747-8

  // Airbus A340 (Retiring)
  '343', // A340-300
  '346', // A340-600
];

async function seedAircraftRankings() {
  console.log('');
  console.log('═'.repeat(70));
  console.log('✈️  AIRCRAFT JETLAG RANKINGS SEEDING SCRIPT');
  console.log('═'.repeat(70));
  console.log('');

  const db = getDb();
  const startTime = Date.now();

  try {
    // Step 1: Generate LLM data for all aircraft
    console.log(`📊 Generating jetlag data for ${COMMON_AIRCRAFT.length} aircraft types...`);
    console.log('   This will use AI to determine cabin specs and comfort factors');
    console.log('');

    const results = await generateBatchAircraft(COMMON_AIRCRAFT);

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
        const aircraftData = result.data;

        // Calculate scores using our algorithm
        const scores = calculateAircraftScore({
          cabinPressureAltitudeFeet: aircraftData.jetlagFactors.cabinPressureAltitudeFeet,
          humidityPercent: aircraftData.jetlagFactors.humidityPercent,
          noiseLevelDb: aircraftData.jetlagFactors.noiseLevelDb,
          cabinAirRefreshRateMinutes: aircraftData.jetlagFactors.cabinAirRefreshRateMinutes,
          typicalSeatPitchInches: aircraftData.comfortFactors.typicalSeatPitchInches,
          windowSizeSqIn: aircraftData.comfortFactors.windowSizeSqIn,
          overheadBinSpaceCuFt: aircraftData.comfortFactors.overheadBinSpaceCuFt,
        });

        // Prepare database record
        const rankingRecord = {
          id: `aircraft_${aircraftData.iataCode.toLowerCase()}`,
          iataCode: aircraftData.iataCode,
          name: aircraftData.name,
          manufacturer: aircraftData.manufacturer,
          model: aircraftData.model,
          cabinPressureAltitudeFeet: aircraftData.jetlagFactors.cabinPressureAltitudeFeet,
          humidityPercent: aircraftData.jetlagFactors.humidityPercent,
          noiseLevelDb: aircraftData.jetlagFactors.noiseLevelDb,
          cabinAirRefreshRateMinutes: aircraftData.jetlagFactors.cabinAirRefreshRateMinutes,
          typicalSeatPitchInches: aircraftData.comfortFactors.typicalSeatPitchInches,
          windowSizeSqIn: aircraftData.comfortFactors.windowSizeSqIn,
          overheadBinSpaceCuFt: aircraftData.comfortFactors.overheadBinSpaceCuFt,
          jetlagBaseScore: scores.jetlagBaseScore,
          comfortScore: scores.comfortScore,
          overallScore: scores.overallScore,
          firstFlightYear: aircraftData.metadata.firstFlightYear,
          isActive: aircraftData.metadata.isActive,
          dataSource: aircraftData.sources?.join(', ') || 'AI-generated',
          lastVerified: new Date(),
          updatedAt: new Date(),
        };

        // Check if record exists
        const existing = await db
          .select()
          .from(aircraftRankings)
          .where(eq(aircraftRankings.iataCode, aircraftData.iataCode))
          .limit(1);

        if (existing.length > 0) {
          // Update existing
          await db
            .update(aircraftRankings)
            .set(rankingRecord)
            .where(eq(aircraftRankings.iataCode, aircraftData.iataCode));

          console.log(`   ✏️  Updated: ${aircraftData.iataCode.padEnd(4)} - ${aircraftData.name} (Score: ${scores.overallScore}/10)`);
          updatedCount++;
        } else {
          // Insert new
          await db.insert(aircraftRankings).values(rankingRecord);

          console.log(`   ✅ Inserted: ${aircraftData.iataCode.padEnd(4)} - ${aircraftData.name} (Score: ${scores.overallScore}/10)`);
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
    console.log(`   📦 Total:     ${COMMON_AIRCRAFT.length}`);
    console.log('');
    console.log(`⏱️  Duration:  ${duration}s`);
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Run: npx tsx scripts/seed/seed-airline-rankings.ts');
    console.log('   2. Run: npx tsx scripts/seed/seed-airport-facilities.ts');
    console.log('   3. Or run all: npx tsx scripts/seed/seed-all-rankings.ts');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Fatal error during seeding:', error);
    console.error('');
    process.exit(1);
  }
}

// Run the script
seedAircraftRankings()
  .then(() => {
    console.log('✨ Done!');
    console.log('');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
