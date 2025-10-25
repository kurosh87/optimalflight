/**
 * Airline Service Rankings Seeding Script (Database-Driven)
 *
 * Generates and seeds airline service quality and jetlag awareness rankings
 * Reads ALL airlines from database - no hardcoded lists
 *
 * Run with: npx tsx scripts/seed/seed-airline-rankings-db.ts
 * Options:
 *   --only-missing    Only process airlines without rankings
 *   --dry-run         Show what would be processed without making changes
 *   --limit=N         Process only first N airlines
 *   --country=XX      Filter by country code (e.g., --country=US)
 */

import { getDb } from '../../lib/db';
import { airlineServiceRankings } from '../../app/schema/schema';
import { generateBatchAirlines } from '../../lib/ai/data-generator';
import { calculateAirlineScore } from '../../lib/ai/score-calculator';
import { DatabaseReader } from '../../lib/database-reader';
import { eq } from 'drizzle-orm';

// Parse command-line arguments
const args = process.argv.slice(2);
const onlyMissing = args.includes('--only-missing');
const dryRun = args.includes('--dry-run');
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;
const countryArg = args.find(arg => arg.startsWith('--country='));
const countryFilter = countryArg ? countryArg.split('=')[1] : undefined;

async function seedAirlineRankings() {
  console.log('');
  console.log('═'.repeat(70));
  console.log('🛫 AIRLINE SERVICE RANKINGS SEEDING SCRIPT (DATABASE-DRIVEN)');
  if (onlyMissing) console.log('   Mode: Only Missing Rankings');
  if (dryRun) console.log('   Mode: Dry Run (No Changes)');
  if (limit) console.log(`   Limit: First ${limit} airlines`);
  if (countryFilter) console.log(`   Filter: Country ${countryFilter}`);
  console.log('═'.repeat(70));
  console.log('');

  const db = getDb();
  const reader = new DatabaseReader();
  const startTime = Date.now();

  try {
    // Step 1: Read airlines from database
    console.log('📖 Reading airlines from database...');

    let airlinesFromDb = await reader.readAllAirlines();
    console.log(`   Found ${airlinesFromDb.length} active airlines in database`);
    console.log('');

    // Apply country filter if specified
    if (countryFilter) {
      airlinesFromDb = airlinesFromDb.filter(a => a.countryIso2 === countryFilter);
      console.log(`   Filtered to ${airlinesFromDb.length} airlines in ${countryFilter}`);
      console.log('');
    }

    // Filter out airlines without IATA codes
    let airlinesToProcess = airlinesFromDb.filter(airline => airline.iataCode);
    console.log(`   ${airlinesToProcess.length} have IATA codes (required for ranking)`);
    console.log('');

    // Step 2: If --only-missing, filter out already-ranked airlines
    if (onlyMissing) {
      console.log('🔍 Checking for existing rankings...');

      const existingRankings = await db
        .select({ iataCode: airlineServiceRankings.iataCode })
        .from(airlineServiceRankings);

      const existingCodes = new Set(existingRankings.map(r => r.iataCode));

      airlinesToProcess = airlinesToProcess.filter(airline => !existingCodes.has(airline.iataCode!));

      console.log(`   ${existingCodes.size} already have rankings`);
      console.log(`   ${airlinesToProcess.length} need rankings`);
      console.log('');
    }

    // Step 3: Apply limit if specified
    if (limit && airlinesToProcess.length > limit) {
      console.log(`🎯 Limiting to first ${limit} airlines...`);
      airlinesToProcess = airlinesToProcess.slice(0, limit);
      console.log('');
    }

    if (airlinesToProcess.length === 0) {
      console.log('✅ No airlines to process!');
      console.log('');
      console.log('   All airlines already have rankings.');
      console.log('   Run without --only-missing to regenerate all rankings.');
      console.log('');
      return;
    }

    // Step 4: Dry run - just show what would be processed
    if (dryRun) {
      console.log('🔍 DRY RUN - Would process these airlines:');
      console.log('');
      airlinesToProcess.slice(0, 20).forEach(airline => {
        console.log(`   ${airline.iataCode?.padEnd(3)} - ${airline.airlineName} (${airline.countryIso2 || 'N/A'})`);
      });
      if (airlinesToProcess.length > 20) {
        console.log(`   ... and ${airlinesToProcess.length - 20} more`);
      }
      console.log('');
      console.log(`   Total: ${airlinesToProcess.length} airlines`);
      console.log('');
      console.log('   Remove --dry-run to actually process these airlines.');
      console.log('');
      return;
    }

    // Step 5: Generate LLM data
    console.log(`📊 Generating service data for ${airlinesToProcess.length} airlines...`);
    console.log('   This will analyze jetlag programs, reliability, and service quality');
    console.log('');

    // Extract IATA codes for batch processing
    const airlineCodes = airlinesToProcess
      .map(a => a.iataCode)
      .filter((code): code is string => code !== null);

    const results = await generateBatchAirlines(airlineCodes);

    // Step 6: Process and insert into database
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
          airlineId: null,
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

          console.log(`   ✏️  Updated: ${airlineData.iataCode.padEnd(3)} - ${airlineData.airlineName.substring(0, 30).padEnd(30)} (Score: ${scores.overallScore}/10)`);
          updatedCount++;
        } else {
          // Insert new
          await db.insert(airlineServiceRankings).values(rankingRecord);

          console.log(`   ✅ Inserted: ${airlineData.iataCode.padEnd(3)} - ${airlineData.airlineName.substring(0, 30).padEnd(30)} (Score: ${scores.overallScore}/10)`);
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
    console.log(`   📦 Total:     ${airlinesToProcess.length}`);
    console.log('');
    console.log(`⏱️  Duration:  ${duration}s`);
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Run: npx tsx scripts/seed/seed-airport-facilities-db.ts');
    console.log('   2. Or run all: npx tsx scripts/seed/seed-all-rankings-db.ts');
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
