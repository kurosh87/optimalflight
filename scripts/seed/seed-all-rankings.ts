/**
 * Master Jetlag Rankings Seeding Script
 *
 * Orchestrates seeding of all jetlag intelligence data:
 * - Aircraft rankings (cabin specs, comfort)
 * - Airline service rankings (jetlag programs, reliability)
 * - Airport facilities (recovery amenities, stress factors)
 *
 * Run with: npx tsx scripts/seed/seed-all-rankings.ts
 *
 * Options:
 *   --aircraft-only    Seed only aircraft rankings
 *   --airlines-only    Seed only airline rankings
 *   --airports-only    Seed only airport facilities
 *   --skip-aircraft    Skip aircraft seeding
 *   --skip-airlines    Skip airline seeding
 *   --skip-airports    Skip airport seeding
 */

import { getDb } from '../../lib/db';
import { aircraftRankings, airlineServiceRankings, airportJetlagFacilities } from '../../app/schema/schema';
import { generateBatchAircraft, generateBatchAirlines, generateBatchAirports } from '../../lib/ai/data-generator';
import { calculateAircraftScore, calculateAirlineScore, calculateAirportScore } from '../../lib/ai/score-calculator';
import { eq } from 'drizzle-orm';

// Import aircraft codes
const AIRCRAFT_CODES = [
  '789', '788', '781', '77W', '772', '773', '77L', '779',
  '359', '35K', '388', '333', '332', '339', '338',
  '763', '764', '76W', '321', '32N', '32Q', '32B', '320', '20N',
  '738', '739', '73J', '7M8', '7M9', '7M7', '744', '748', '343', '346'
];

// Import airline codes
const AIRLINE_CODES = [
  'SQ', 'QR', 'EK', 'NH', 'CX', 'EY', 'TG', 'KE', 'OZ', 'JL',
  'AA', 'DL', 'UA', 'AS', 'B6', 'WN',
  'LH', 'BA', 'AF', 'KL', 'LX', 'OS', 'AZ', 'IB', 'TP', 'SK', 'AY',
  'CA', 'MU', 'CZ', 'CI', 'BR', 'QF', 'NZ', 'GA', 'MH', 'PR',
  'MS', 'ET', 'SA', 'AT', 'LA', 'AM', 'AV', 'CM',
  'FR', 'U2', 'F9', 'NK'
];

// Import airport codes
const AIRPORT_CODES = [
  'SIN', 'ICN', 'HND', 'NRT', 'HKG', 'KIX', 'DOH', 'DXB', 'AUH', 'BKK', 'KUL', 'CGK', 'MNL', 'SYD', 'MEL', 'AKL',
  'JFK', 'EWR', 'LAX', 'SFO', 'SEA', 'ORD', 'DFW', 'MIA', 'ATL', 'DEN', 'LAS', 'MCO', 'PHX', 'IAH', 'BOS', 'YVR', 'YYZ', 'YUL',
  'LHR', 'LGW', 'CDG', 'AMS', 'FRA', 'MUC', 'ZRH', 'VIE', 'IST', 'MAD', 'BCN', 'FCO', 'MXP', 'CPH', 'ARN', 'OSL', 'HEL',
  'CAI', 'AMM', 'TLV', 'JNB', 'CPT', 'ADD', 'NBO',
  'GRU', 'GIG', 'EZE', 'BOG', 'LIM', 'SCL', 'MEX'
];

// Parse command-line arguments
const args = process.argv.slice(2);
const shouldSeedAircraft = !args.includes('--skip-aircraft') && (args.includes('--aircraft-only') || !args.includes('--airlines-only') && !args.includes('--airports-only'));
const shouldSeedAirlines = !args.includes('--skip-airlines') && (args.includes('--airlines-only') || !args.includes('--aircraft-only') && !args.includes('--airports-only'));
const shouldSeedAirports = !args.includes('--skip-airports') && (args.includes('--airports-only') || !args.includes('--aircraft-only') && !args.includes('--airlines-only'));

async function seedAllRankings() {
  console.log('');
  console.log('═'.repeat(80));
  console.log('🌍 JETLAG INTELLIGENCE SYSTEM - COMPLETE SEEDING');
  console.log('═'.repeat(80));
  console.log('');
  console.log('This script will populate your database with AI-generated jetlag rankings.');
  console.log('');
  console.log('📊 Scope:');
  console.log(`   ${shouldSeedAircraft ? '✅' : '⏭️ '} Aircraft Rankings:    ${AIRCRAFT_CODES.length} aircraft types`);
  console.log(`   ${shouldSeedAirlines ? '✅' : '⏭️ '} Airline Rankings:     ${AIRLINE_CODES.length} airlines`);
  console.log(`   ${shouldSeedAirports ? '✅' : '⏭️ '} Airport Facilities:   ${AIRPORT_CODES.length} airports`);
  console.log('');
  console.log('⏱️  Estimated time: 5-15 minutes (depending on API speed)');
  console.log('💰 Estimated cost: $2-5 with GPT-4o-mini');
  console.log('');

  const db = getDb();
  const overallStartTime = Date.now();

  const stats = {
    aircraft: { inserted: 0, updated: 0, skipped: 0 },
    airlines: { inserted: 0, updated: 0, skipped: 0 },
    airports: { inserted: 0, updated: 0, skipped: 0 },
  };

  try {
    // ========================================
    // SEED AIRCRAFT RANKINGS
    // ========================================
    if (shouldSeedAircraft) {
      console.log('');
      console.log('─'.repeat(80));
      console.log('✈️  STEP 1/3: Aircraft Rankings');
      console.log('─'.repeat(80));
      console.log('');

      const aircraftResults = await generateBatchAircraft(AIRCRAFT_CODES);

      for (const result of aircraftResults) {
        if (!result.success || !result.data) {
          stats.aircraft.skipped++;
          continue;
        }

        try {
          const data = result.data;
          const scores = calculateAircraftScore({
            cabinPressureAltitudeFeet: data.jetlagFactors.cabinPressureAltitudeFeet,
            humidityPercent: data.jetlagFactors.humidityPercent,
            noiseLevelDb: data.jetlagFactors.noiseLevelDb,
            cabinAirRefreshRateMinutes: data.jetlagFactors.cabinAirRefreshRateMinutes,
            typicalSeatPitchInches: data.comfortFactors.typicalSeatPitchInches,
            windowSizeSqIn: data.comfortFactors.windowSizeSqIn,
            overheadBinSpaceCuFt: data.comfortFactors.overheadBinSpaceCuFt,
          });

          const record = {
            id: `aircraft_${data.iataCode.toLowerCase()}`,
            iataCode: data.iataCode,
            name: data.name,
            manufacturer: data.manufacturer,
            model: data.model,
            cabinPressureAltitudeFeet: data.jetlagFactors.cabinPressureAltitudeFeet,
            humidityPercent: data.jetlagFactors.humidityPercent,
            noiseLevelDb: data.jetlagFactors.noiseLevelDb,
            cabinAirRefreshRateMinutes: data.jetlagFactors.cabinAirRefreshRateMinutes,
            typicalSeatPitchInches: data.comfortFactors.typicalSeatPitchInches,
            windowSizeSqIn: data.comfortFactors.windowSizeSqIn,
            overheadBinSpaceCuFt: data.comfortFactors.overheadBinSpaceCuFt,
            jetlagBaseScore: scores.jetlagBaseScore,
            comfortScore: scores.comfortScore,
            overallScore: scores.overallScore,
            firstFlightYear: data.metadata.firstFlightYear,
            isActive: data.metadata.isActive,
            dataSource: data.sources?.join(', ') || 'AI-generated',
            lastVerified: new Date(),
            updatedAt: new Date(),
          };

          const existing = await db.select().from(aircraftRankings).where(eq(aircraftRankings.iataCode, data.iataCode)).limit(1);

          if (existing.length > 0) {
            await db.update(aircraftRankings).set(record).where(eq(aircraftRankings.iataCode, data.iataCode));
            stats.aircraft.updated++;
          } else {
            await db.insert(aircraftRankings).values(record);
            stats.aircraft.inserted++;
          }

          console.log(`   ✅ ${data.iataCode}: ${data.name} (Score: ${scores.overallScore}/10)`);
        } catch (error) {
          console.error(`   ❌ Error processing ${result.code}:`, error);
          stats.aircraft.skipped++;
        }
      }
    }

    // ========================================
    // SEED AIRLINE RANKINGS
    // ========================================
    if (shouldSeedAirlines) {
      console.log('');
      console.log('─'.repeat(80));
      console.log('🛫 STEP 2/3: Airline Service Rankings');
      console.log('─'.repeat(80));
      console.log('');

      const airlineResults = await generateBatchAirlines(AIRLINE_CODES);

      for (const result of airlineResults) {
        if (!result.success || !result.data) {
          stats.airlines.skipped++;
          continue;
        }

        try {
          const data = result.data;
          const scores = calculateAirlineScore({
            mealQualityRating: data.serviceQuality.mealQualityRating,
            mealTimingFlexibility: data.serviceQuality.mealTimingFlexibility,
            providesSleepKits: data.serviceQuality.providesSleepKits,
            sleepKitQuality: data.serviceQuality.sleepKitQuality as 'basic' | 'standard' | 'premium',
            cabinCrewTrainingScore: data.serviceQuality.cabinCrewTrainingScore,
            onTimePerformancePercent: data.reliability.onTimePerformancePercent,
            delayMinutesAvg: data.reliability.delayMinutesAvg,
            cancellationRatePercent: data.reliability.cancellationRatePercent,
            offersJetlagMenu: data.jetlagPrograms.offersJetlagMenu,
            lightManagementStrategy: data.jetlagPrograms.lightManagementStrategy,
            sleepOptimizationPrograms: data.jetlagPrograms.sleepOptimizationPrograms,
            melatoninAvailable: data.jetlagPrograms.melatoninAvailable,
            seatComfortRating: data.amenities.seatComfortRating,
            entertainmentQuality: data.amenities.entertainmentQuality,
          });

          const record = {
            id: `airline_${data.iataCode.toLowerCase()}`,
            airlineId: null,
            iataCode: data.iataCode,
            airlineName: data.airlineName,
            mealQualityRating: data.serviceQuality.mealQualityRating,
            mealTimingFlexibility: data.serviceQuality.mealTimingFlexibility,
            providesSleepKits: data.serviceQuality.providesSleepKits,
            sleepKitQuality: data.serviceQuality.sleepKitQuality,
            cabinCrewTrainingScore: data.serviceQuality.cabinCrewTrainingScore,
            onTimePerformancePercent: data.reliability.onTimePerformancePercent,
            delayMinutesAvg: data.reliability.delayMinutesAvg,
            cancellationRatePercent: data.reliability.cancellationRatePercent,
            offersJetlagMenu: data.jetlagPrograms.offersJetlagMenu,
            lightManagementStrategy: data.jetlagPrograms.lightManagementStrategy,
            sleepOptimizationPrograms: data.jetlagPrograms.sleepOptimizationPrograms,
            melatoninAvailable: data.jetlagPrograms.melatoninAvailable,
            seatComfortRating: data.amenities.seatComfortRating,
            entertainmentQuality: data.amenities.entertainmentQuality,
            serviceScore: scores.serviceScore,
            reliabilityScore: scores.reliabilityScore,
            jetlagAwarenessScore: scores.jetlagAwarenessScore,
            overallScore: scores.overallScore,
            dataSource: data.sources?.join(', ') || 'AI-generated',
            lastVerified: new Date(),
            updatedAt: new Date(),
          };

          const existing = await db.select().from(airlineServiceRankings).where(eq(airlineServiceRankings.iataCode, data.iataCode)).limit(1);

          if (existing.length > 0) {
            await db.update(airlineServiceRankings).set(record).where(eq(airlineServiceRankings.iataCode, data.iataCode));
            stats.airlines.updated++;
          } else {
            await db.insert(airlineServiceRankings).values(record);
            stats.airlines.inserted++;
          }

          console.log(`   ✅ ${data.iataCode}: ${data.airlineName} (Score: ${scores.overallScore}/10)`);
        } catch (error) {
          console.error(`   ❌ Error processing ${result.code}:`, error);
          stats.airlines.skipped++;
        }
      }
    }

    // ========================================
    // SEED AIRPORT FACILITIES
    // ========================================
    if (shouldSeedAirports) {
      console.log('');
      console.log('─'.repeat(80));
      console.log('🏢 STEP 3/3: Airport Jetlag Facilities');
      console.log('─'.repeat(80));
      console.log('');

      const airportResults = await generateBatchAirports(AIRPORT_CODES);

      for (const result of airportResults) {
        if (!result.success || !result.data) {
          stats.airports.skipped++;
          continue;
        }

        try {
          const data = result.data;
          const scores = calculateAirportScore({
            hasSleepPods: data.recoveryFacilities.hasSleepPods,
            hasQuietZones: data.recoveryFacilities.hasQuietZones,
            hasShowerFacilities: data.recoveryFacilities.hasShowerFacilities,
            hasNaturalLightAreas: data.recoveryFacilities.hasNaturalLightAreas,
            hasHealthyFoodOptions: data.recoveryFacilities.hasHealthyFoodOptions,
            hasExerciseFacilities: data.recoveryFacilities.hasExerciseFacilities,
            hasSpaServices: data.recoveryFacilities.hasSpaServices,
            hasMeditationRooms: data.recoveryFacilities.hasMeditationRooms,
            averageSecurityWaitMinutes: data.stressFactors.averageSecurityWaitMinutes,
            averageImmigrationWaitMinutes: data.stressFactors.averageImmigrationWaitMinutes,
            terminalWalkingDistanceAvgMeters: data.stressFactors.terminalWalkingDistanceAvgMeters,
            signageClarityScore: data.stressFactors.signageClarityScore,
            wifiQualityScore: data.stressFactors.wifiQualityScore,
            noiseLevel: data.stressFactors.noiseLevel as 'quiet' | 'moderate' | 'loud',
          });

          const record = {
            id: `airport_${data.iataCode.toLowerCase()}`,
            airportId: null,
            iataCode: data.iataCode,
            hasSleepPods: data.recoveryFacilities.hasSleepPods,
            sleepPodProvider: data.recoveryFacilities.sleepPodProvider,
            sleepPodLocations: data.recoveryFacilities.sleepPodLocations,
            hasQuietZones: data.recoveryFacilities.hasQuietZones,
            quietZoneLocations: data.recoveryFacilities.quietZoneLocations,
            hasShowerFacilities: data.recoveryFacilities.hasShowerFacilities,
            showerLocations: data.recoveryFacilities.showerLocations,
            hasNaturalLightAreas: data.recoveryFacilities.hasNaturalLightAreas,
            naturalLightDescription: data.recoveryFacilities.naturalLightDescription,
            hasHealthyFoodOptions: data.recoveryFacilities.hasHealthyFoodOptions,
            healthyFoodVendors: data.recoveryFacilities.healthyFoodVendors ? JSON.stringify(data.recoveryFacilities.healthyFoodVendors) : null,
            hasExerciseFacilities: data.recoveryFacilities.hasExerciseFacilities,
            exerciseFacilitiesDescription: data.recoveryFacilities.exerciseFacilitiesDescription,
            hasSpaServices: data.recoveryFacilities.hasSpaServices,
            spaServiceProviders: data.recoveryFacilities.spaServiceProviders ? JSON.stringify(data.recoveryFacilities.spaServiceProviders) : null,
            hasMeditationRooms: data.recoveryFacilities.hasMeditationRooms,
            meditationRoomLocations: data.recoveryFacilities.meditationRoomLocations,
            averageSecurityWaitMinutes: data.stressFactors.averageSecurityWaitMinutes,
            averageImmigrationWaitMinutes: data.stressFactors.averageImmigrationWaitMinutes,
            terminalWalkingDistanceAvgMeters: data.stressFactors.terminalWalkingDistanceAvgMeters,
            signageClarityScore: data.stressFactors.signageClarityScore,
            wifiQualityScore: data.stressFactors.wifiQualityScore,
            noiseLevel: data.stressFactors.noiseLevel,
            peakCongestionHours: data.peakHours ? JSON.stringify(data.peakHours) : null,
            facilityHours: data.facilityHours ? JSON.stringify(data.facilityHours) : null,
            comfortScore: scores.comfortScore,
            stressScore: scores.stressScore,
            jetlagSupportScore: scores.jetlagSupportScore,
            overallScore: scores.overallScore,
            dataSource: data.sources?.join(', ') || 'AI-generated',
            lastVerified: new Date(),
            updatedAt: new Date(),
          };

          const existing = await db.select().from(airportJetlagFacilities).where(eq(airportJetlagFacilities.iataCode, data.iataCode)).limit(1);

          if (existing.length > 0) {
            await db.update(airportJetlagFacilities).set(record).where(eq(airportJetlagFacilities.iataCode, data.iataCode));
            stats.airports.updated++;
          } else {
            await db.insert(airportJetlagFacilities).values(record);
            stats.airports.inserted++;
          }

          console.log(`   ✅ ${data.iataCode}: ${data.airportName.substring(0, 40)} (Score: ${scores.overallScore}/10)`);
        } catch (error) {
          console.error(`   ❌ Error processing ${result.code}:`, error);
          stats.airports.skipped++;
        }
      }
    }

    // ========================================
    // FINAL SUMMARY
    // ========================================
    const totalDuration = ((Date.now() - overallStartTime) / 1000).toFixed(1);

    console.log('');
    console.log('═'.repeat(80));
    console.log('🎉 JETLAG INTELLIGENCE SYSTEM SEEDING COMPLETE!');
    console.log('═'.repeat(80));
    console.log('');
    console.log('📊 Final Summary:');
    console.log('');

    if (shouldSeedAircraft) {
      console.log(`   ✈️  Aircraft Rankings:`);
      console.log(`       ✅ Inserted: ${stats.aircraft.inserted}`);
      console.log(`       ✏️  Updated:  ${stats.aircraft.updated}`);
      console.log(`       ❌ Skipped:  ${stats.aircraft.skipped}`);
      console.log('');
    }

    if (shouldSeedAirlines) {
      console.log(`   🛫 Airline Rankings:`);
      console.log(`       ✅ Inserted: ${stats.airlines.inserted}`);
      console.log(`       ✏️  Updated:  ${stats.airlines.updated}`);
      console.log(`       ❌ Skipped:  ${stats.airlines.skipped}`);
      console.log('');
    }

    if (shouldSeedAirports) {
      console.log(`   🏢 Airport Facilities:`);
      console.log(`       ✅ Inserted: ${stats.airports.inserted}`);
      console.log(`       ✏️  Updated:  ${stats.airports.updated}`);
      console.log(`       ❌ Skipped:  ${stats.airports.skipped}`);
      console.log('');
    }

    const totalProcessed =
      stats.aircraft.inserted + stats.aircraft.updated +
      stats.airlines.inserted + stats.airlines.updated +
      stats.airports.inserted + stats.airports.updated;

    console.log(`   📦 Total Processed: ${totalProcessed} records`);
    console.log(`   ⏱️  Total Duration:  ${totalDuration}s`);
    console.log('');
    console.log('✨ Your jetlag intelligence system is now fully operational!');
    console.log('');
    console.log('🚀 Test your rankings:');
    console.log('   - View aircraft: SELECT * FROM aircraft_rankings ORDER BY overall_score DESC;');
    console.log('   - View airlines: SELECT * FROM airline_service_rankings ORDER BY overall_score DESC;');
    console.log('   - View airports: SELECT * FROM airport_jetlag_facilities ORDER BY overall_score DESC;');
    console.log('');

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
