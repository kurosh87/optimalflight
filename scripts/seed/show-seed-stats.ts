/**
 * Show Seeding Statistics
 *
 * Display what will be augmented from the database
 * Run with: npx tsx scripts/seed/show-seed-stats.ts
 */

import { DatabaseReader } from '../../lib/database-reader';
import { getDb } from '../../lib/db';
import { aircraftRankings, airlineServiceRankings, airportJetlagFacilities } from '../../app/schema/schema';
import { sql } from 'drizzle-orm';

async function showStats() {
  console.log('');
  console.log('═'.repeat(80));
  console.log('📊 JETLAG RANKINGS SEEDING STATISTICS');
  console.log('═'.repeat(80));
  console.log('');

  const reader = new DatabaseReader();
  const db = getDb();

  try {
    // Get source data statistics
    console.log('📖 SOURCE DATA (What exists in your database):');
    console.log('');
    const stats = await reader.getStatistics();

    const totalSourceEntities = stats.airlines + stats.airports + stats.aircraftTypes;

    console.log(`   Total entities to augment: ${totalSourceEntities.toLocaleString()}`);
    console.log('');

    // Get existing rankings statistics
    console.log('─'.repeat(80));
    console.log('');
    console.log('✅ EXISTING RANKINGS (Already augmented):');
    console.log('');

    const [existingAircraft] = await db
      .select({ count: sql<number>`count(*)` })
      .from(aircraftRankings);

    const [existingAirlines] = await db
      .select({ count: sql<number>`count(*)` })
      .from(airlineServiceRankings);

    const [existingAirports] = await db
      .select({ count: sql<number>`count(*)` })
      .from(airportJetlagFacilities);

    const aircraftCount = Number(existingAircraft?.count || 0);
    const airlinesCount = Number(existingAirlines?.count || 0);
    const airportsCount = Number(existingAirports?.count || 0);

    console.log(`   Aircraft Rankings:     ${aircraftCount.toLocaleString()}`);
    console.log(`   Airline Rankings:      ${airlinesCount.toLocaleString()}`);
    console.log(`   Airport Facilities:    ${airportsCount.toLocaleString()}`);
    console.log('');

    const totalExistingRankings = aircraftCount + airlinesCount + airportsCount;
    console.log(`   Total rankings exist:  ${totalExistingRankings.toLocaleString()}`);
    console.log('');

    // Calculate what's missing
    console.log('─'.repeat(80));
    console.log('');
    console.log('❌ MISSING RANKINGS (Need to be generated):');
    console.log('');

    const missingAircraft = Math.max(0, stats.aircraftTypes - aircraftCount);
    const missingAirlines = Math.max(0, stats.airlines - airlinesCount);
    const missingAirports = Math.max(0, stats.airports - airportsCount);

    console.log(`   Aircraft Rankings:     ${missingAircraft.toLocaleString()} missing`);
    console.log(`   Airline Rankings:      ${missingAirlines.toLocaleString()} missing`);
    console.log(`   Airport Facilities:    ${missingAirports.toLocaleString()} missing`);
    console.log('');

    const totalMissing = missingAircraft + missingAirlines + missingAirports;
    console.log(`   Total to generate:     ${totalMissing.toLocaleString()}`);
    console.log('');

    // Estimate costs and time
    console.log('─'.repeat(80));
    console.log('');
    console.log('💰 COST & TIME ESTIMATES:');
    console.log('');

    // Assume 500 tokens per entity, $0.150 per 1M input tokens, $0.600 per 1M output tokens (GPT-4o-mini)
    const tokensPerEntity = 500;
    const costPerToken = 0.00000075; // Average of input/output
    const entitiesPerMinute = 25; // With 5 concurrent workers

    const estimatedCost = (totalMissing * tokensPerEntity * costPerToken);
    const estimatedMinutes = Math.ceil(totalMissing / entitiesPerMinute);

    console.log(`   Model:                 GPT-4o-mini`);
    console.log(`   Entities to process:   ${totalMissing.toLocaleString()}`);
    console.log(`   Estimated time:        ${estimatedMinutes} minutes`);
    console.log(`   Estimated cost:        $${estimatedCost.toFixed(2)} USD`);
    console.log('');

    if (totalMissing === 0) {
      console.log('─'.repeat(80));
      console.log('');
      console.log('🎉 ALL RANKINGS ARE COMPLETE!');
      console.log('');
      console.log('   Your database is fully augmented with jetlag intelligence.');
      console.log('   No additional seeding needed.');
      console.log('');
    } else {
      console.log('─'.repeat(80));
      console.log('');
      console.log('🚀 NEXT STEPS:');
      console.log('');
      console.log('   To generate missing rankings, run:');
      console.log('');
      console.log('   # Generate all missing rankings');
      console.log('   npx tsx scripts/seed/seed-all-rankings.ts --only-missing');
      console.log('');
      console.log('   # Or generate specific categories:');
      console.log('   npx tsx scripts/seed/seed-aircraft-rankings.ts --only-missing');
      console.log('   npx tsx scripts/seed/seed-airline-rankings.ts --only-missing');
      console.log('   npx tsx scripts/seed/seed-airport-facilities.ts --only-missing');
      console.log('');
      console.log('   # Dry run (see what would be processed):');
      console.log('   npx tsx scripts/seed/seed-all-rankings.ts --dry-run');
      console.log('');
    }

    // Show coverage percentage
    if (totalSourceEntities > 0) {
      const coveragePercent = (totalExistingRankings / totalSourceEntities * 100);
      console.log('─'.repeat(80));
      console.log('');
      console.log('📈 COVERAGE:');
      console.log('');
      console.log(`   ${coveragePercent.toFixed(1)}% of your aviation data has jetlag rankings`);
      console.log('');

      // Show progress bar
      const barLength = 60;
      const filledLength = Math.round((coveragePercent / 100) * barLength);
      const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
      console.log(`   [${bar}] ${coveragePercent.toFixed(1)}%`);
      console.log('');
    }

    console.log('═'.repeat(80));
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Error:', error);
    console.error('');
    process.exit(1);
  }
}

// Run the stats script
showStats()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
