/**
 * Aircraft Rankings Seeding Script (Database-Driven)
 *
 * Generates and seeds aircraft jetlag rankings using LLM-powered data generator
 * Reads ALL aircraft types from database - no hardcoded lists
 *
 * Run with: npx tsx scripts/seed/seed-aircraft-rankings-db.ts
 * Options:
 *   --only-missing    Only process aircraft without rankings
 *   --dry-run         Show what would be processed without making changes
 *   --limit=N         Process only first N aircraft
 */

import { getDb } from '../../lib/db';
import { aircraftRankings } from '../../app/schema/schema';
import { generateBatchAircraft } from '../../lib/ai/data-generator';
import { calculateAircraftScore } from '../../lib/ai/score-calculator';
import { DatabaseReader } from '../../lib/database-reader';
import { eq } from 'drizzle-orm';

// Parse command-line arguments
const args = process.argv.slice(2);
const onlyMissing = args.includes('--only-missing');
const dryRun = args.includes('--dry-run');
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;

async function seedAircraftRankings() {
  console.log('');
  console.log('═'.repeat(70));
  console.log('✈️  AIRCRAFT JETLAG RANKINGS SEEDING SCRIPT (DATABASE-DRIVEN)');
  if (onlyMissing) console.log('   Mode: Only Missing Rankings');
  if (dryRun) console.log('   Mode: Dry Run (No Changes)');
  if (limit) console.log(`   Limit: First ${limit} aircraft`);
  console.log('═'.repeat(70));
  console.log('');

  const db = getDb();
  const reader = new DatabaseReader();
  const startTime = Date.now();

  try {
    // Step 1: Read ALL aircraft types from database
    console.log('📖 Reading aircraft types from database...');
    const allAircraftTypes = await reader.readAllAircraftTypes();
    console.log(`   Found ${allAircraftTypes.length} aircraft types in database`);
    console.log('');

    // Filter out aircraft without IATA codes
    let aircraftToProcess = allAircraftTypes.filter(aircraft => aircraft.iataCode);
    console.log(`   ${aircraftToProcess.length} have IATA codes (required for ranking)`);
    console.log('');

    // Step 2: If --only-missing, filter out already-ranked aircraft
    if (onlyMissing) {
      console.log('🔍 Checking for existing rankings...');

      const existingRankings = await db
        .select({ iataCode: aircraftRankings.iataCode })
        .from(aircraftRankings);

      const existingCodes = new Set(existingRankings.map(r => r.iataCode));

      aircraftToProcess = aircraftToProcess.filter(aircraft => !existingCodes.has(aircraft.iataCode!));

      console.log(`   ${existingCodes.size} already have rankings`);
      console.log(`   ${aircraftToProcess.length} need rankings`);
      console.log('');
    }

    // Step 3: Apply limit if specified
    if (limit && aircraftToProcess.length > limit) {
      console.log(`🎯 Limiting to first ${limit} aircraft...`);
      aircraftToProcess = aircraftToProcess.slice(0, limit);
      console.log('');
    }

    if (aircraftToProcess.length === 0) {
      console.log('✅ No aircraft to process!');
      console.log('');
      console.log('   All aircraft types already have rankings.');
      console.log('   Run without --only-missing to regenerate all rankings.');
      console.log('');
      return;
    }

    // Step 4: Dry run - just show what would be processed
    if (dryRun) {
      console.log('🔍 DRY RUN - Would process these aircraft:');
      console.log('');
      aircraftToProcess.slice(0, 20).forEach(aircraft => {
        console.log(`   ${aircraft.iataCode?.padEnd(4)} - ${aircraft.aircraftName}`);
      });
      if (aircraftToProcess.length > 20) {
        console.log(`   ... and ${aircraftToProcess.length - 20} more`);
      }
      console.log('');
      console.log(`   Total: ${aircraftToProcess.length} aircraft`);
      console.log('');
      console.log('   Remove --dry-run to actually process these aircraft.');
      console.log('');
      return;
    }

    // Step 5: Generate LLM data for aircraft
    console.log(`📊 Generating jetlag data for ${aircraftToProcess.length} aircraft types...`);
    console.log('   This will use AI to determine cabin specs and comfort factors');
    console.log('');

    // Extract IATA codes for batch processing
    const aircraftCodes = aircraftToProcess
      .map(a => a.iataCode)
      .filter((code): code is string => code !== null);

    const results = await generateBatchAircraft(aircraftCodes);

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
    console.log(`   📦 Total:     ${aircraftToProcess.length}`);
    console.log('');
    console.log(`⏱️  Duration:  ${duration}s`);
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Run: npx tsx scripts/seed/seed-airline-rankings-db.ts');
    console.log('   2. Run: npx tsx scripts/seed/seed-airport-facilities-db.ts');
    console.log('   3. Or run all: npx tsx scripts/seed/seed-all-rankings-db.ts');
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
