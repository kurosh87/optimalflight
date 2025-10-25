/**
 * Airport Jetlag Facilities Seeding Script (Database-Driven)
 *
 * Generates and seeds airport recovery facilities and stress factor data
 * Reads ALL airports from database - no hardcoded lists
 *
 * Run with: npx tsx scripts/seed/seed-airport-facilities-db.ts
 * Options:
 *   --only-missing    Only process airports without facilities data
 *   --dry-run         Show what would be processed without making changes
 *   --limit=N         Process only first N airports
 *   --country=XX      Filter by country code (e.g., --country=US)
 */

// Load environment variables FIRST
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local first (higher priority), then .env
dotenv.config({ path: path.join(__dirname, '../../.env.local') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { getDb } from '../../lib/db';
import { airportJetlagFacilities } from '../../app/schema/schema';
import { generateBatchAirports } from '../../lib/ai/data-generator';
import { calculateAirportScore } from '../../lib/ai/score-calculator';
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

async function seedAirportFacilities() {
  console.log('');
  console.log('═'.repeat(70));
  console.log('🏢 AIRPORT JETLAG FACILITIES SEEDING SCRIPT (DATABASE-DRIVEN)');
  if (onlyMissing) console.log('   Mode: Only Missing Facilities');
  if (dryRun) console.log('   Mode: Dry Run (No Changes)');
  if (limit) console.log(`   Limit: First ${limit} airports`);
  if (countryFilter) console.log(`   Filter: Country ${countryFilter}`);
  console.log('═'.repeat(70));
  console.log('');

  const db = getDb();
  const reader = new DatabaseReader();
  const startTime = Date.now();

  try {
    // Step 1: Read airports from database
    console.log('📖 Reading airports from database...');

    let airportsFromDb = await reader.readAllAirports();
    console.log(`   Found ${airportsFromDb.length} active airports in database`);
    console.log('');

    // Apply country filter if specified
    if (countryFilter) {
      airportsFromDb = airportsFromDb.filter(a => a.countryIso2 === countryFilter);
      console.log(`   Filtered to ${airportsFromDb.length} airports in ${countryFilter}`);
      console.log('');
    }

    // Filter out airports without IATA codes
    let airportsToProcess = airportsFromDb.filter(airport => airport.iataCode);
    console.log(`   ${airportsToProcess.length} have IATA codes (required for facilities data)`);
    console.log('');

    // Step 2: If --only-missing, filter out already-processed airports
    if (onlyMissing) {
      console.log('🔍 Checking for existing facilities data...');

      const existingFacilities = await db
        .select({ iataCode: airportJetlagFacilities.iataCode })
        .from(airportJetlagFacilities);

      const existingCodes = new Set(existingFacilities.map(f => f.iataCode));

      airportsToProcess = airportsToProcess.filter(airport => !existingCodes.has(airport.iataCode!));

      console.log(`   ${existingCodes.size} already have facilities data`);
      console.log(`   ${airportsToProcess.length} need facilities data`);
      console.log('');
    }

    // Step 3: Apply limit if specified
    if (limit && airportsToProcess.length > limit) {
      console.log(`🎯 Limiting to first ${limit} airports...`);
      airportsToProcess = airportsToProcess.slice(0, limit);
      console.log('');
    }

    if (airportsToProcess.length === 0) {
      console.log('✅ No airports to process!');
      console.log('');
      console.log('   All airports already have facilities data.');
      console.log('   Run without --only-missing to regenerate all data.');
      console.log('');
      return;
    }

    // Step 4: Dry run - just show what would be processed
    if (dryRun) {
      console.log('🔍 DRY RUN - Would process these airports:');
      console.log('');
      airportsToProcess.slice(0, 20).forEach(airport => {
        console.log(`   ${airport.iataCode?.padEnd(4)} - ${airport.name} (${airport.cityName}, ${airport.countryIso2 || 'N/A'})`);
      });
      if (airportsToProcess.length > 20) {
        console.log(`   ... and ${airportsToProcess.length - 20} more`);
      }
      console.log('');
      console.log(`   Total: ${airportsToProcess.length} airports`);
      console.log('');
      console.log('   Remove --dry-run to actually process these airports.');
      console.log('');
      return;
    }

    // Step 5: Generate LLM data
    console.log(`📊 Generating facilities data for ${airportsToProcess.length} airports...`);
    console.log('   This will analyze recovery amenities and stress factors');
    console.log('');

    // Extract IATA codes for batch processing
    const airportCodes = airportsToProcess
      .map(a => a.iataCode)
      .filter((code): code is string => code !== null);

    const results = await generateBatchAirports(airportCodes);

    // Step 6: Process and insert into database
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    console.log('');
    console.log('💾 Inserting facilities data into database...');
    console.log('');

    for (const result of results) {
      if (!result.success || !result.data) {
        console.log(`   ❌ Skipping ${result.code} - generation failed`);
        skippedCount++;
        continue;
      }

      try {
        const airportData = result.data;

        // Calculate scores using our algorithm
        const scores = calculateAirportScore({
          hasSleepPods: airportData.recoveryFacilities.hasSleepPods,
          hasQuietZones: airportData.recoveryFacilities.hasQuietZones,
          hasShowerFacilities: airportData.recoveryFacilities.hasShowerFacilities,
          hasNaturalLightAreas: airportData.recoveryFacilities.hasNaturalLightAreas,
          hasHealthyFoodOptions: airportData.recoveryFacilities.hasHealthyFoodOptions,
          hasExerciseFacilities: airportData.recoveryFacilities.hasExerciseFacilities,
          hasSpaServices: airportData.recoveryFacilities.hasSpaServices,
          hasMeditationRooms: airportData.recoveryFacilities.hasMeditationRooms,
          averageSecurityWaitMinutes: airportData.stressFactors.averageSecurityWaitMinutes,
          averageImmigrationWaitMinutes: airportData.stressFactors.averageImmigrationWaitMinutes,
          terminalWalkingDistanceAvgMeters: airportData.stressFactors.terminalWalkingDistanceAvgMeters,
          signageClarityScore: airportData.stressFactors.signageClarityScore,
          wifiQualityScore: airportData.stressFactors.wifiQualityScore,
          noiseLevel: airportData.stressFactors.noiseLevel as 'quiet' | 'moderate' | 'loud',
        });

        // Prepare database record
        const facilityRecord = {
          id: `airport_${airportData.iataCode.toLowerCase()}`,
          airportId: null,
          iataCode: airportData.iataCode,
          hasSleepPods: airportData.recoveryFacilities.hasSleepPods,
          sleepPodProvider: airportData.recoveryFacilities.sleepPodProvider,
          sleepPodLocations: airportData.recoveryFacilities.sleepPodLocations,
          hasQuietZones: airportData.recoveryFacilities.hasQuietZones,
          quietZoneLocations: airportData.recoveryFacilities.quietZoneLocations,
          hasShowerFacilities: airportData.recoveryFacilities.hasShowerFacilities,
          showerLocations: airportData.recoveryFacilities.showerLocations,
          hasNaturalLightAreas: airportData.recoveryFacilities.hasNaturalLightAreas,
          naturalLightDescription: airportData.recoveryFacilities.naturalLightDescription,
          hasHealthyFoodOptions: airportData.recoveryFacilities.hasHealthyFoodOptions,
          healthyFoodVendors: airportData.recoveryFacilities.healthyFoodVendors
            ? JSON.stringify(airportData.recoveryFacilities.healthyFoodVendors)
            : null,
          hasExerciseFacilities: airportData.recoveryFacilities.hasExerciseFacilities,
          exerciseFacilitiesDescription: airportData.recoveryFacilities.exerciseFacilitiesDescription,
          hasSpaServices: airportData.recoveryFacilities.hasSpaServices,
          spaServiceProviders: airportData.recoveryFacilities.spaServiceProviders
            ? JSON.stringify(airportData.recoveryFacilities.spaServiceProviders)
            : null,
          hasMeditationRooms: airportData.recoveryFacilities.hasMeditationRooms,
          meditationRoomLocations: airportData.recoveryFacilities.meditationRoomLocations,
          averageSecurityWaitMinutes: airportData.stressFactors.averageSecurityWaitMinutes,
          averageImmigrationWaitMinutes: airportData.stressFactors.averageImmigrationWaitMinutes,
          terminalWalkingDistanceAvgMeters: airportData.stressFactors.terminalWalkingDistanceAvgMeters,
          signageClarityScore: airportData.stressFactors.signageClarityScore,
          wifiQualityScore: airportData.stressFactors.wifiQualityScore,
          noiseLevel: airportData.stressFactors.noiseLevel,
          peakCongestionHours: airportData.peakHours
            ? JSON.stringify(airportData.peakHours)
            : null,
          facilityHours: airportData.facilityHours
            ? JSON.stringify(airportData.facilityHours)
            : null,
          comfortScore: scores.comfortScore,
          stressScore: scores.stressScore,
          jetlagSupportScore: scores.jetlagSupportScore,
          overallScore: scores.overallScore,
          dataSource: airportData.sources?.join(', ') || 'AI-generated',
          lastVerified: new Date(),
          updatedAt: new Date(),
        };

        // Check if record exists
        const existing = await db
          .select()
          .from(airportJetlagFacilities)
          .where(eq(airportJetlagFacilities.iataCode, airportData.iataCode))
          .limit(1);

        if (existing.length > 0) {
          // Update existing
          await db
            .update(airportJetlagFacilities)
            .set(facilityRecord)
            .where(eq(airportJetlagFacilities.iataCode, airportData.iataCode));

          console.log(`   ✏️  Updated: ${airportData.iataCode.padEnd(4)} - ${airportData.airportName.substring(0, 35).padEnd(35)} (Score: ${scores.overallScore}/10)`);
          updatedCount++;
        } else {
          // Insert new
          await db.insert(airportJetlagFacilities).values(facilityRecord);

          console.log(`   ✅ Inserted: ${airportData.iataCode.padEnd(4)} - ${airportData.airportName.substring(0, 35).padEnd(35)} (Score: ${scores.overallScore}/10)`);
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
    console.log(`   📦 Total:     ${airportsToProcess.length}`);
    console.log('');
    console.log(`⏱️  Duration:  ${duration}s`);
    console.log('');
    console.log('✨ All ranking data seeded! Your jetlag intelligence system is ready.');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Fatal error during seeding:', error);
    console.error('');
    process.exit(1);
  }
}

// Run the script
seedAirportFacilities()
  .then(() => {
    console.log('✨ Done!');
    console.log('');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
