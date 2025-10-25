/**
 * Airport Jetlag Facilities Seeding Script
 *
 * Generates and seeds airport recovery facilities and stress factor data
 * Run with: npx tsx scripts/seed/seed-airport-facilities.ts
 */

import { getDb } from '../../lib/db';
import { airportJetlagFacilities } from '../../app/schema/schema';
import { generateBatchAirports } from '../../lib/ai/data-generator';
import { calculateAirportScore } from '../../lib/ai/score-calculator';
import { eq } from 'drizzle-orm';

// Major international airports to seed
const MAJOR_AIRPORTS = [
  // Asia-Pacific Hubs (typically best facilities)
  'SIN', // Singapore Changi - Best in world
  'ICN', // Seoul Incheon
  'HND', // Tokyo Haneda
  'NRT', // Tokyo Narita
  'HKG', // Hong Kong
  'KIX', // Osaka Kansai
  'DOH', // Doha Hamad
  'DXB', // Dubai International
  'AUH', // Abu Dhabi
  'BKK', // Bangkok Suvarnabhumi
  'KUL', // Kuala Lumpur
  'CGK', // Jakarta
  'MNL', // Manila
  'SYD', // Sydney
  'MEL', // Melbourne
  'AKL', // Auckland

  // North America
  'JFK', // New York JFK
  'EWR', // Newark
  'LAX', // Los Angeles
  'SFO', // San Francisco
  'SEA', // Seattle
  'ORD', // Chicago O'Hare
  'DFW', // Dallas Fort Worth
  'MIA', // Miami
  'ATL', // Atlanta
  'DEN', // Denver
  'LAS', // Las Vegas
  'MCO', // Orlando
  'PHX', // Phoenix
  'IAH', // Houston
  'BOS', // Boston
  'YVR', // Vancouver
  'YYZ', // Toronto Pearson
  'YUL', // Montreal

  // Europe
  'LHR', // London Heathrow
  'LGW', // London Gatwick
  'CDG', // Paris Charles de Gaulle
  'AMS', // Amsterdam Schiphol
  'FRA', // Frankfurt
  'MUC', // Munich
  'ZRH', // Zurich
  'VIE', // Vienna
  'IST', // Istanbul
  'MAD', // Madrid
  'BCN', // Barcelona
  'FCO', // Rome Fiumicino
  'MXP', // Milan Malpensa
  'CPH', // Copenhagen
  'ARN', // Stockholm Arlanda
  'OSL', // Oslo
  'HEL', // Helsinki

  // Middle East
  'CAI', // Cairo
  'AMM', // Amman
  'TLV', // Tel Aviv

  // Africa
  'JNB', // Johannesburg
  'CPT', // Cape Town
  'ADD', // Addis Ababa
  'NBO', // Nairobi

  // South America
  'GRU', // São Paulo Guarulhos
  'GIG', // Rio de Janeiro
  'EZE', // Buenos Aires
  'BOG', // Bogotá
  'LIM', // Lima
  'SCL', // Santiago
  'MEX', // Mexico City
];

async function seedAirportFacilities() {
  console.log('');
  console.log('═'.repeat(70));
  console.log('🏢 AIRPORT JETLAG FACILITIES SEEDING SCRIPT');
  console.log('═'.repeat(70));
  console.log('');

  const db = getDb();
  const startTime = Date.now();

  try {
    // Step 1: Generate LLM data for all airports
    console.log(`📊 Generating facilities data for ${MAJOR_AIRPORTS.length} airports...`);
    console.log('   This will analyze recovery amenities and stress factors');
    console.log('');

    const results = await generateBatchAirports(MAJOR_AIRPORTS);

    // Step 2: Process and insert into database
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
          airportId: null, // Will be linked if airport exists in airports table
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
    console.log(`   📦 Total:     ${MAJOR_AIRPORTS.length}`);
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
