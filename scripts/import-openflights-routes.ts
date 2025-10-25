/**
 * Import OpenFlights Route Data
 * FREE data source: https://openflights.org/data/routes.dat
 *
 * WARNING: Data last updated June 2014 - historical baseline only
 * Use Aviation Edge API for current routes
 *
 * Run: npx tsx scripts/import-openflights-routes.ts
 */

import { db } from '../src/lib/db';
import { routesEnhanced, airportsEnhanced, airlinesEnhanced } from '../src/lib/db/schema-routes';
import { eq } from 'drizzle-orm';

interface OpenFlightsRoute {
  airline: string;
  airlineId: string;
  sourceAirport: string;
  sourceAirportId: string;
  destAirport: string;
  destAirportId: string;
  codeshare: string;
  stops: string;
  equipment: string; // Aircraft types
}

async function importOpenFlightsRoutes() {
  console.log('📥 Downloading OpenFlights route data...\n');

  const response = await fetch(
    'https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat'
  );
  const csvData = await response.text();

  const lines = csvData.trim().split('\n');
  const routesToImport = [];

  console.log(`📊 Processing ${lines.length} routes...\n`);

  let skipped = 0;
  let processed = 0;

  for (const line of lines) {
    const fields = line.split(',');

    const [
      airline,
      airlineId,
      sourceAirport,
      sourceAirportId,
      destAirport,
      destAirportId,
      codeshare,
      stops,
      equipment
    ] = fields;

    // Skip if missing critical data
    if (!sourceAirport || !destAirport || sourceAirport === '\\N' || destAirport === '\\N') {
      skipped++;
      continue;
    }

    // Skip if not direct flight
    if (stops !== '0') {
      skipped++;
      continue;
    }

    // Look up airport IDs from our database
    const originAirport = await db
      .select()
      .from(airportsEnhanced)
      .where(eq(airportsEnhanced.iataCode, sourceAirport))
      .limit(1);

    const destAirportData = await db
      .select()
      .from(airportsEnhanced)
      .where(eq(airportsEnhanced.iataCode, destAirport))
      .limit(1);

    if (!originAirport.length || !destAirportData.length) {
      skipped++;
      continue;
    }

    // Look up airline
    const airlineData = await db
      .select()
      .from(airlinesEnhanced)
      .where(eq(airlinesEnhanced.iataCode, airline))
      .limit(1);

    if (!airlineData.length) {
      skipped++;
      continue;
    }

    routesToImport.push({
      originAirportId: originAirport[0].airportId,
      destinationAirportId: destAirportData[0].airportId,
      airlineId: airlineData[0].airlineId,
      status: 'historical', // Mark as historical (2014 data)
      isSeasonal: false,
      frequencyPerWeek: null,
      distanceMiles: null,
      distanceKm: null,
      flightDurationMinutes: null,
    });

    processed++;

    if (processed % 1000 === 0) {
      console.log(`   Processed ${processed} routes...`);
    }
  }

  console.log(`\n✅ Filtered to ${routesToImport.length} valid direct routes`);
  console.log(`⏭️  Skipped ${skipped} routes (missing data, connections, etc.)\n`);

  console.log('💾 Importing routes into database...\n');

  // Batch insert
  const batchSize = 500;
  for (let i = 0; i < routesToImport.length; i += batchSize) {
    const batch = routesToImport.slice(i, i + batchSize);
    await db.insert(routesEnhanced).values(batch).onConflictDoNothing();
    console.log(`   Imported ${Math.min(i + batchSize, routesToImport.length)} / ${routesToImport.length}`);
  }

  console.log('\n✨ OpenFlights route import complete!');
  console.log(`📍 Total routes: ${routesToImport.length}`);
  console.log('\n⚠️  IMPORTANT: This is HISTORICAL data (June 2014)');
  console.log('   Use Aviation Edge API or manual curation for current routes\n');

  process.exit(0);
}

importOpenFlightsRoutes().catch(error => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});
