/**
 * Email Import Processor
 * Orchestrates the complete flight extraction pipeline
 */

import { getDb } from '@/lib/db';
import { emailImports, userImportEmails, flights, trips, tripFlights } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { SmartFlightParser } from '@/lib/email-parser/smart-parser';
import { DuplicateDetector, mergeFlightData } from '@/lib/flights/duplicate-detector';
import { FlightEnricher, toFlightRecord } from '@/lib/flights/enricher';
import { sendImportConfirmation } from '@/lib/email/import-confirmation';
import type { EmailContent, ProcessingResult, ExtractedFlight, SkippedFlight } from '@/lib/email-import/types';

/**
 * Process an email import from start to finish
 * This is the main orchestration function
 */
export async function processEmailImport(
  importId: string,
  userId: string,
  content: EmailContent
): Promise<ProcessingResult> {
  const startTime = Date.now();
  const db = getDb();

  console.log('🚀 Starting email import processing:', importId);

  try {
    // Update status to processing
    await db
      .update(emailImports)
      .set({ status: 'processing' })
      .where(eq(emailImports.id, BigInt(importId)));

    // STEP 1: Extract all flights using smart parser
    console.log('📧 Step 1: Extracting flights...');
    const parser = new SmartFlightParser();
    const extractedFlights = await parser.extractFlights(content);

    if (extractedFlights.length === 0) {
      // No flights found
      await db
        .update(emailImports)
        .set({
          status: 'failed',
          flightsDetected: 0,
          errorMessage: 'No flights found in email',
          processingTimeMs: Date.now() - startTime,
          processedAt: new Date(),
        })
        .where(eq(emailImports.id, BigInt(importId)));

      return {
        success: false,
        flightsDetected: 0,
        flightsCreated: 0,
        flightsSkipped: 0,
        flightsUpdated: 0,
        createdFlights: [],
        skippedFlights: [],
        updatedFlights: [],
        errors: ['No flights found in email'],
        warnings: [],
        requiresReview: false,
        processingTimeMs: Date.now() - startTime,
      };
    }

    console.log(`✅ Found ${extractedFlights.length} flight(s)`);

    // STEP 2: Enrich and validate each flight
    console.log('🔍 Step 2: Enriching and validating...');
    const enricher = new FlightEnricher();
    const enrichedFlights = await Promise.all(
      extractedFlights.map((flight) => enricher.enrich(flight))
    );

    // STEP 3: Check for duplicates
    console.log('🔎 Step 3: Checking for duplicates...');
    const duplicateDetector = new DuplicateDetector(userId);
    const flightDecisions = await Promise.all(
      enrichedFlights.map(async (flight) => {
        const duplicateCheck = await duplicateDetector.check(flight);
        return { flight, duplicateCheck };
      })
    );

    // STEP 4: Process each flight based on duplicate check results
    console.log('⚙️ Step 4: Processing flights...');
    const results = {
      created: [] as any[],
      skipped: [] as SkippedFlight[],
      updated: [] as any[],
      errors: [] as string[],
    };

    for (const { flight, duplicateCheck } of flightDecisions) {
      try {
        if (duplicateCheck.isDuplicate) {
          if (duplicateCheck.shouldUpdate) {
            // UPDATE existing flight with new data
            const mergedData = mergeFlightData(flight, duplicateCheck.existingFlight);

            const [updatedFlight] = await db
              .update(flights)
              .set(mergedData)
              .where(eq(flights.id, BigInt(duplicateCheck.existingFlightId!)))
              .returning();

            results.updated.push(updatedFlight);
            console.log(`✅ Updated flight ${duplicateCheck.existingFlightId}`);
          } else {
            // SKIP duplicate
            results.skipped.push({
              flight,
              reason: `Duplicate of existing flight (${duplicateCheck.matchType} match)`,
              existingFlightId: duplicateCheck.existingFlightId,
            });
            console.log(`⏭️ Skipped duplicate: ${flight.flightNumber || flight.origin}-${flight.destination}`);
          }
        } else {
          // CREATE new flight
          const flightRecord = toFlightRecord(userId, flight, importId);

          // Set deduplication hash
          flightRecord.deduplicationHash = duplicateDetector.generateDeduplicationHash(flight);

          const [createdFlight] = await db.insert(flights).values(flightRecord).returning();

          results.created.push(createdFlight);
          console.log(`✅ Created flight ${createdFlight.id}: ${flight.flightNumber || 'Unknown'}`);
        }
      } catch (error: any) {
        console.error(`Failed to process flight:`, error);
        results.errors.push(`Failed to process ${flight.flightNumber || 'flight'}: ${error.message}`);
      }
    }

    // STEP 5: Group into trip if multiple related flights
    console.log('🗂️ Step 5: Grouping related flights...');
    let tripId: string | null = null;

    if (results.created.length > 1) {
      // Check if flights are related (same booking reference or sequential)
      const bookingRefs = enrichedFlights
        .map((f) => f.bookingReference)
        .filter((ref, idx, arr) => ref && arr.indexOf(ref) === idx);

      if (bookingRefs.length > 0) {
        // Create trip for related flights
        tripId = await groupFlightsIntoTrip(
          userId,
          results.created,
          enrichedFlights,
          importId
        );
        console.log(`✅ Created trip ${tripId} with ${results.created.length} flights`);
      }
    }

    const processingTime = Date.now() - startTime;
    const requiresReview = enrichedFlights.some((f) => (f.confidence || 0) < 0.7);

    // STEP 6: Update import record with results
    console.log('💾 Step 6: Saving results...');
    await db
      .update(emailImports)
      .set({
        status: requiresReview ? 'review_needed' : 'success',
        flightsDetected: extractedFlights.length,
        flightsCreated: results.created.length,
        flightsSkipped: results.skipped.length,
        flightsUpdated: results.updated.length,
        extractedFlights: JSON.stringify(enrichedFlights),
        createdFlightIds: JSON.stringify(results.created.map((f) => f.id.toString())),
        skippedFlightIds: JSON.stringify(
          results.skipped.map((s) => s.existingFlightId).filter(Boolean)
        ),
        processingMethod: extractedFlights[0]?.extractionMethod || 'llm',
        processingTimeMs: processingTime,
        processedAt: new Date(),
      })
      .where(eq(emailImports.id, BigInt(importId)));

    // Update user import email stats
    await db
      .update(userImportEmails)
      .set({
        successfulImports: db.$count(userImportEmails.successfulImports) + (results.created.length > 0 ? 1 : 0),
      })
      .where(eq(userImportEmails.ownerId, userId));

    // STEP 7: Send confirmation email
    console.log('📧 Step 7: Sending confirmation email...');
    try {
      await sendImportConfirmation(userId, {
        success: true,
        flightsDetected: extractedFlights.length,
        flightsCreated: results.created.length,
        flightsSkipped: results.skipped.length,
        flightsUpdated: results.updated.length,
        createdFlights: results.created,
        skippedFlights: results.skipped,
        updatedFlights: results.updated,
        errors: results.errors,
        warnings: [],
        requiresReview,
        reviewUrl: requiresReview ? `${process.env.NEXT_PUBLIC_APP_URL}/imports/${importId}/review` : undefined,
        processingTimeMs: processingTime,
      });
    } catch (emailError: any) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the whole import if email fails
    }

    console.log('✅ Import processing complete!');
    console.log(`   Created: ${results.created.length}`);
    console.log(`   Skipped: ${results.skipped.length}`);
    console.log(`   Updated: ${results.updated.length}`);
    console.log(`   Time: ${processingTime}ms`);

    return {
      success: true,
      flightsDetected: extractedFlights.length,
      flightsCreated: results.created.length,
      flightsSkipped: results.skipped.length,
      flightsUpdated: results.updated.length,
      createdFlights: results.created,
      skippedFlights: results.skipped,
      updatedFlights: results.updated,
      errors: results.errors,
      warnings: [],
      requiresReview,
      reviewUrl: requiresReview ? `${process.env.NEXT_PUBLIC_APP_URL}/imports/${importId}/review` : undefined,
      processingTimeMs: processingTime,
    };
  } catch (error: any) {
    console.error('❌ Import processing failed:', error);

    // Update import record with error
    await db
      .update(emailImports)
      .set({
        status: 'failed',
        errorMessage: error.message,
        errorDetails: JSON.stringify({
          stack: error.stack,
          name: error.name,
        }),
        processingTimeMs: Date.now() - startTime,
        processedAt: new Date(),
      })
      .where(eq(emailImports.id, BigInt(importId)));

    return {
      success: false,
      flightsDetected: 0,
      flightsCreated: 0,
      flightsSkipped: 0,
      flightsUpdated: 0,
      createdFlights: [],
      skippedFlights: [],
      updatedFlights: [],
      errors: [error.message],
      warnings: [],
      requiresReview: false,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Group flights into a trip
 * Links related flights (round trip, multi-city)
 */
async function groupFlightsIntoTrip(
  userId: string,
  createdFlights: any[],
  extractedFlights: ExtractedFlight[],
  emailImportId: string
): Promise<string> {
  const db = getDb();

  // Determine trip type
  let tripType: 'round-trip' | 'one-way' | 'multi-city' = 'one-way';

  if (createdFlights.length === 2) {
    // Check if it's a round trip (return to origin)
    const firstFlight = createdFlights[0];
    const secondFlight = createdFlights[1];

    if (
      firstFlight.originAirportCode === secondFlight.destinationAirportCode &&
      firstFlight.destinationAirportCode === secondFlight.originAirportCode
    ) {
      tripType = 'round-trip';
    } else {
      tripType = 'multi-city';
    }
  } else if (createdFlights.length > 2) {
    tripType = 'multi-city';
  }

  // Get first and last flight for trip dates
  const sortedFlights = [...createdFlights].sort(
    (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
  );

  const firstFlight = sortedFlights[0];
  const lastFlight = sortedFlights[sortedFlights.length - 1];

  // Extract booking reference
  const bookingReference = extractedFlights.find((f) => f.bookingReference)?.bookingReference;

  // Create trip
  const [trip] = await db
    .insert(trips)
    .values({
      ownerId: userId,
      departureTime: firstFlight.departureTime,
      arrivalTime: lastFlight.arrivalTime,
      status: 'planned',
    })
    .returning();

  // Link flights to trip
  for (let i = 0; i < createdFlights.length; i++) {
    const flight = createdFlights[i];
    const extractedFlight = extractedFlights[i];

    await db.insert(tripFlights).values({
      tripId: trip.id,
      flightId: flight.id,
      segmentOrder: i + 1,
      legType: extractedFlight?.legType || (i === 0 ? 'outbound' : i === createdFlights.length - 1 && tripType === 'round-trip' ? 'return' : 'segment'),
    });

    // Update flight with trip ID
    await db
      .update(flights)
      .set({ tripId: trip.id, sequenceOrder: i + 1 })
      .where(eq(flights.id, flight.id));
  }

  return trip.id.toString();
}
