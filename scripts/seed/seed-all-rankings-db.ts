/**
 * Master Jetlag Rankings Seeding Script (Database-Driven)
 *
 * Orchestrates seeding of all jetlag intelligence data from existing database tables
 * Reads ALL entities from database - no hardcoded lists
 *
 * Run with: npx tsx scripts/seed/seed-all-rankings-db.ts
 *
 * Options:
 *   --only-missing       Seed only entities without rankings
 *   --dry-run            Show what would be processed without making changes
 *   --aircraft-only      Seed only aircraft rankings
 *   --airlines-only      Seed only airline rankings
 *   --airports-only      Seed only airport facilities
 *   --skip-aircraft      Skip aircraft seeding
 *   --skip-airlines      Skip airline seeding
 *   --skip-airports      Skip airport seeding
 *   --limit=N            Process only first N of each entity type
 *   --country=XX         Filter by country code
 */

import { DatabaseReader } from '../../lib/database-reader';

// Parse command-line arguments
const args = process.argv.slice(2);
const onlyMissing = args.includes('--only-missing');
const dryRun = args.includes('--dry-run');
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? ` --limit=${limitArg.split('=')[1]}` : '';
const countryArg = args.find(arg => arg.startsWith('--country='));
const country = countryArg ? ` ${countryArg}` : '';

const shouldSeedAircraft = !args.includes('--skip-aircraft') && (args.includes('--aircraft-only') || !args.includes('--airlines-only') && !args.includes('--airports-only'));
const shouldSeedAirlines = !args.includes('--skip-airlines') && (args.includes('--airlines-only') || !args.includes('--aircraft-only') && !args.includes('--airports-only'));
const shouldSeedAirports = !args.includes('--skip-airports') && (args.includes('--airports-only') || !args.includes('--aircraft-only') && !args.includes('--airlines-only'));

async function seedAllRankings() {
  console.log('');
  console.log('═'.repeat(80));
  console.log('🌍 JETLAG INTELLIGENCE SYSTEM - COMPLETE SEEDING (DATABASE-DRIVEN)');
  console.log('═'.repeat(80));
  console.log('');
  console.log('This script will populate your database with AI-generated jetlag rankings.');
  console.log('Reading ALL entities from your existing database tables.');
  console.log('');

  const reader = new DatabaseReader();
  const overallStartTime = Date.now();

  try {
    // Show what exists in database
    console.log('📊 Reading database statistics...');
    const stats = await reader.getStatistics();
    console.log('');

    console.log('📋 Scope:');
    console.log(`   ${shouldSeedAircraft ? '✅' : '⏭️ '} Aircraft Rankings:    ${stats.aircraftTypes.toLocaleString()} types in database`);
    console.log(`   ${shouldSeedAirlines ? '✅' : '⏭️ '} Airline Rankings:     ${stats.airlines.toLocaleString()} airlines in database`);
    console.log(`   ${shouldSeedAirports ? '✅' : '⏭️ '} Airport Facilities:   ${stats.airports.toLocaleString()} airports in database`);
    console.log('');

    if (onlyMissing) {
      console.log('   Mode: Only Missing Rankings (skips already-processed entities)');
    }
    if (dryRun) {
      console.log('   Mode: Dry Run (shows what would be processed, no changes)');
    }
    if (limit) {
      console.log(`   Limit: ${limitArg!.split('=')[1]} entities per category`);
    }
    if (country) {
      console.log(`   Filter: ${countryArg!.split('=')[1]}`);
    }
    console.log('');

    const totalEntities = stats.aircraftTypes + stats.airlines + stats.airports;
    const tokensPerEntity = 500;
    const costPerToken = 0.00000075; // GPT-4o-mini avg
    const entitiesPerMinute = 25;

    const estimatedCost = (totalEntities * tokensPerEntity * costPerToken);
    const estimatedMinutes = Math.ceil(totalEntities / entitiesPerMinute);

    console.log('⏱️  Estimates (if processing all):');
    console.log(`   Total entities:        ${totalEntities.toLocaleString()}`);
    console.log(`   Estimated time:        ${estimatedMinutes} minutes`);
    console.log(`   Estimated cost:        $${estimatedCost.toFixed(2)} USD (GPT-4o-mini)`);
    console.log('');

    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made');
      console.log('');
    }

    const stats_summary = {
      aircraft: { inserted: 0, updated: 0, skipped: 0 },
      airlines: { inserted: 0, updated: 0, skipped: 0 },
      airports: { inserted: 0, updated: 0, skipped: 0 },
    };

    // ========================================
    // SEED AIRCRAFT RANKINGS
    // ========================================
    if (shouldSeedAircraft) {
      console.log('─'.repeat(80));
      console.log('✈️  STEP 1/3: Aircraft Rankings');
      console.log('─'.repeat(80));
      console.log('');

      const { execSync } = require('child_process');
      const aircraftCmd = `npx tsx scripts/seed/seed-aircraft-rankings-db.ts${onlyMissing ? ' --only-missing' : ''}${dryRun ? ' --dry-run' : ''}${limit}${country}`;

      try {
        execSync(aircraftCmd, { stdio: 'inherit', cwd: process.cwd() });
      } catch (error: any) {
        if (error.status !== 0) {
          console.error('❌ Aircraft seeding failed');
          process.exit(1);
        }
      }

      console.log('');
    }

    // ========================================
    // SEED AIRLINE RANKINGS
    // ========================================
    if (shouldSeedAirlines) {
      console.log('─'.repeat(80));
      console.log('🛫 STEP 2/3: Airline Service Rankings');
      console.log('─'.repeat(80));
      console.log('');

      const { execSync } = require('child_process');
      const airlinesCmd = `npx tsx scripts/seed/seed-airline-rankings-db.ts${onlyMissing ? ' --only-missing' : ''}${dryRun ? ' --dry-run' : ''}${limit}${country}`;

      try {
        execSync(airlinesCmd, { stdio: 'inherit', cwd: process.cwd() });
      } catch (error: any) {
        if (error.status !== 0) {
          console.error('❌ Airline seeding failed');
          process.exit(1);
        }
      }

      console.log('');
    }

    // ========================================
    // SEED AIRPORT FACILITIES
    // ========================================
    if (shouldSeedAirports) {
      console.log('─'.repeat(80));
      console.log('🏢 STEP 3/3: Airport Jetlag Facilities');
      console.log('─'.repeat(80));
      console.log('');

      const { execSync } = require('child_process');
      const airportsCmd = `npx tsx scripts/seed/seed-airport-facilities-db.ts${onlyMissing ? ' --only-missing' : ''}${dryRun ? ' --dry-run' : ''}${limit}${country}`;

      try {
        execSync(airportsCmd, { stdio: 'inherit', cwd: process.cwd() });
      } catch (error: any) {
        if (error.status !== 0) {
          console.error('❌ Airport seeding failed');
          process.exit(1);
        }
      }

      console.log('');
    }

    // ========================================
    // FINAL SUMMARY
    // ========================================
    const totalDuration = ((Date.now() - overallStartTime) / 1000 / 60).toFixed(1);

    console.log('═'.repeat(80));
    console.log('🎉 JETLAG INTELLIGENCE SYSTEM SEEDING COMPLETE!');
    console.log('═'.repeat(80));
    console.log('');
    console.log(`⏱️  Total Duration: ${totalDuration} minutes`);
    console.log('');

    if (!dryRun) {
      console.log('✨ Your aviation database is now enriched with jetlag rankings!');
      console.log('');
      console.log('🔍 Verify rankings:');
      console.log('   npx tsx scripts/seed/show-seed-stats.ts');
      console.log('');
      console.log('📊 Query rankings:');
      console.log('   SELECT * FROM aircraft_rankings ORDER BY overall_score DESC LIMIT 10;');
      console.log('   SELECT * FROM airline_service_rankings ORDER BY overall_score DESC LIMIT 10;');
      console.log('   SELECT * FROM airport_jetlag_facilities ORDER BY overall_score DESC LIMIT 10;');
      console.log('');
    } else {
      console.log('ℹ️  This was a dry run - no changes were made.');
      console.log('');
      console.log('   Remove --dry-run to actually process and insert rankings.');
      console.log('');
    }

  } catch (error) {
    console.error('');
    console.error('❌ Fatal error during seeding:', error);
    console.error('');
    process.exit(1);
  }
}

// Run the master script
seedAllRankings()
  .then(() => {
    console.log('✨ All done!');
    console.log('');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
