/**
 * Import airport data from OpenFlights
 * Data source: https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat
 *
 * Run: npx tsx scripts/import-airports.ts
 */

import { db } from '../src/lib/db';
import { airports } from '../src/lib/db/schema';

interface OpenFlightsAirport {
  id: string;
  name: string;
  city: string;
  country: string;
  iata: string;
  icao: string;
  latitude: number;
  longitude: number;
  altitude: number;
  timezone: string;
  dst: string;
  tzDatabase: string;
}

async function importAirports() {
  console.log('📥 Downloading airport data from OpenFlights...\n');

  const response = await fetch(
    'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat'
  );
  const csvData = await response.text();

  const lines = csvData.trim().split('\n');
  const airportsToImport = [];

  console.log(`📊 Processing ${lines.length} airports...\n`);

  for (const line of lines) {
    const fields = line.split(',').map(f => f.replace(/^"|"$/g, ''));

    const [
      id, name, city, country, iata, icao,
      lat, lon, alt, tzOffset, dst, tzDatabase
    ] = fields;

    // Skip if no IATA code (we need it for flight search)
    if (!iata || iata === '\\N') continue;

    // Skip if invalid coordinates
    if (!lat || !lon || lat === '\\N' || lon === '\\N') continue;

    airportsToImport.push({
      iata: iata.toUpperCase(),
      icao: icao === '\\N' ? iata.toUpperCase() : icao.toUpperCase(),
      name,
      city,
      country,
      timezone: tzDatabase === '\\N' ? 'UTC' : tzDatabase,
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      altitude: parseFloat(alt) || 0,
      connectivity: 0,
      jetlagFacilities: {
        sleepPods: false,
        quietZones: false,
        showers: false,
        spas: false,
      },
    });
  }

  console.log(`✅ Filtered to ${airportsToImport.length} airports with valid IATA codes\n`);
  console.log('💾 Importing into database...\n');

  // Batch insert (PostgreSQL can handle large inserts)
  const batchSize = 500;
  for (let i = 0; i < airportsToImport.length; i += batchSize) {
    const batch = airportsToImport.slice(i, i + batchSize);
    await db.insert(airports).values(batch).onConflictDoNothing();
    console.log(`   Imported ${Math.min(i + batchSize, airportsToImport.length)} / ${airportsToImport.length}`);
  }

  console.log('\n✨ Airport import complete!');
  console.log(`📍 Total airports: ${airportsToImport.length}\n`);

  // Show some sample airports
  const samples = airportsToImport.slice(0, 5);
  console.log('Sample airports:');
  samples.forEach(apt => {
    console.log(`   ${apt.iata} - ${apt.name}, ${apt.city}`);
  });

  process.exit(0);
}

importAirports().catch(error => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});
