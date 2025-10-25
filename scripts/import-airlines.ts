/**
 * Import airline data from OpenFlights
 * Data source: https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat
 *
 * Run: npx tsx scripts/import-airlines.ts
 */

import { db } from '../src/lib/db';
import { airlines } from '../src/lib/db/schema';

// Alliance memberships (you can expand this list)
const ALLIANCES: Record<string, string> = {
  // Star Alliance
  'UA': 'Star Alliance', 'LH': 'Star Alliance', 'AC': 'Star Alliance',
  'SQ': 'Star Alliance', 'TK': 'Star Alliance', 'NH': 'Star Alliance',
  'OS': 'Star Alliance', 'LX': 'Star Alliance', 'SK': 'Star Alliance',
  'TP': 'Star Alliance', 'TG': 'Star Alliance', 'MS': 'Star Alliance',

  // OneWorld
  'AA': 'OneWorld', 'BA': 'OneWorld', 'CX': 'OneWorld',
  'JL': 'OneWorld', 'QF': 'OneWorld', 'QR': 'OneWorld',
  'IB': 'OneWorld', 'AY': 'OneWorld', 'AS': 'OneWorld',

  // SkyTeam
  'DL': 'SkyTeam', 'AF': 'SkyTeam', 'KL': 'SkyTeam',
  'AZ': 'SkyTeam', 'CZ': 'SkyTeam', 'KE': 'SkyTeam',
  'VS': 'SkyTeam', 'AM': 'SkyTeam', 'SU': 'SkyTeam',
};

async function importAirlines() {
  console.log('📥 Downloading airline data from OpenFlights...\n');

  const response = await fetch(
    'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat'
  );
  const csvData = await response.text();

  const lines = csvData.trim().split('\n');
  const airlinesToImport = [];

  console.log(`📊 Processing ${lines.length} airlines...\n`);

  for (const line of lines) {
    const fields = line.split(',').map(f => f.replace(/^"|"$/g, ''));

    const [
      id, name, alias, iata, icao, callsign, country, active
    ] = fields;

    // Skip inactive airlines
    if (active === 'N') continue;

    // Skip if no IATA code
    if (!iata || iata === '-' || iata === '\\N') continue;

    const iataCode = iata.toUpperCase();

    airlinesToImport.push({
      iata: iataCode,
      icao: icao === '\\N' || !icao ? iataCode : icao.toUpperCase(),
      name,
      country,
      alliance: ALLIANCES[iataCode] || null,
      fleetSize: null,
      serviceRating: null,
      onTimePerformance: null,
    });
  }

  console.log(`✅ Filtered to ${airlinesToImport.length} active airlines with IATA codes\n`);
  console.log('💾 Importing into database...\n');

  // Batch insert
  const batchSize = 200;
  for (let i = 0; i < airlinesToImport.length; i += batchSize) {
    const batch = airlinesToImport.slice(i, i + batchSize);
    await db.insert(airlines).values(batch).onConflictDoNothing();
    console.log(`   Imported ${Math.min(i + batchSize, airlinesToImport.length)} / ${airlinesToImport.length}`);
  }

  console.log('\n✨ Airline import complete!');
  console.log(`✈️  Total airlines: ${airlinesToImport.length}\n`);

  // Show alliance breakdown
  const allianceCount = {
    'Star Alliance': 0,
    'OneWorld': 0,
    'SkyTeam': 0,
    'Independent': 0,
  };

  airlinesToImport.forEach(airline => {
    if (airline.alliance) {
      allianceCount[airline.alliance]++;
    } else {
      allianceCount['Independent']++;
    }
  });

  console.log('Alliance breakdown:');
  Object.entries(allianceCount).forEach(([alliance, count]) => {
    console.log(`   ${alliance}: ${count}`);
  });

  console.log('\nSample airlines:');
  airlinesToImport.slice(0, 10).forEach(airline => {
    const alliance = airline.alliance ? `[${airline.alliance}]` : '';
    console.log(`   ${airline.iata} - ${airline.name} ${alliance}`);
  });

  process.exit(0);
}

importAirlines().catch(error => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});
