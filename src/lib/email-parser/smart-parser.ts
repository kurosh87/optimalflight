/**
 * Smart Flight Parser
 * Multi-strategy flight extraction from emails
 */

import type {
  ExtractedFlight,
  EmailContent,
  Attachment,
} from '@/lib/email-import/types';
import { extractFromStructuredData } from './structured-data';
import { extractFromPDF } from './pdf-parser';
import { extractWithLLM } from './llm-parser';

export class SmartFlightParser {
  async extractFlights(content: EmailContent): Promise<ExtractedFlight[]> {
    const allFlights: ExtractedFlight[] = [];

    console.log('🔍 Starting smart flight extraction...');

    // Strategy 1: Structured Data (JSON-LD, microdata in HTML)
    // This is fastest and most reliable when available
    if (content.html) {
      try {
        const structuredFlights = extractFromStructuredData(content.html);
        if (structuredFlights.length > 0) {
          console.log(
            `✅ Found ${structuredFlights.length} flight(s) via structured data`
          );
          allFlights.push(...structuredFlights);
        }
      } catch (error) {
        console.error('Structured data extraction failed:', error);
      }
    }

    // Strategy 2: PDF Attachments
    // Extract from PDF boarding passes or confirmations
    if (content.attachments && content.attachments.length > 0) {
      try {
        const pdfAttachments = content.attachments.filter(
          (att) =>
            att.contentType === 'application/pdf' ||
            att.filename?.toLowerCase().endsWith('.pdf')
        );

        if (pdfAttachments.length > 0) {
          const pdfFlights = await extractFromPDF(pdfAttachments);
          if (pdfFlights.length > 0) {
            console.log(`✅ Found ${pdfFlights.length} flight(s) in PDF attachments`);
            allFlights.push(...pdfFlights);
          }
        }
      } catch (error) {
        console.error('PDF extraction failed:', error);
      }
    }

    // Strategy 3: LLM Parsing (Claude)
    // Most flexible - can handle any format
    // Only use if we haven't found flights yet (to save costs)
    if (allFlights.length === 0) {
      try {
        const llmFlights = await extractWithLLM(content);
        if (llmFlights.length > 0) {
          console.log(`✅ Found ${llmFlights.length} flight(s) via LLM`);
          allFlights.push(...llmFlights);
        }
      } catch (error) {
        console.error('LLM extraction failed:', error);
      }
    }

    // Deduplicate flights found by multiple methods
    const deduplicatedFlights = this.deduplicateExtractedFlights(allFlights);

    console.log(`📊 Total unique flights extracted: ${deduplicatedFlights.length}`);

    return deduplicatedFlights;
  }

  /**
   * Remove duplicate flights found by multiple extraction methods
   * Keep the one with highest confidence or most complete data
   */
  private deduplicateExtractedFlights(
    flights: ExtractedFlight[]
  ): ExtractedFlight[] {
    if (flights.length <= 1) return flights;

    const uniqueFlights = new Map<string, ExtractedFlight>();

    for (const flight of flights) {
      // Create a key from flight details
      const key = [
        flight.flightNumber?.toUpperCase(),
        flight.origin?.toUpperCase(),
        flight.destination?.toUpperCase(),
        flight.departureDate,
        flight.departureTime,
      ]
        .filter(Boolean)
        .join('|');

      const existing = uniqueFlights.get(key);

      if (!existing) {
        uniqueFlights.set(key, flight);
      } else {
        // Merge: keep highest confidence fields
        const merged = this.mergeFlights(existing, flight);
        uniqueFlights.set(key, merged);
      }
    }

    return Array.from(uniqueFlights.values());
  }

  /**
   * Merge two flight objects, keeping highest confidence values
   */
  private mergeFlights(
    a: ExtractedFlight,
    b: ExtractedFlight
  ): ExtractedFlight {
    const merged = { ...a };

    // For each field in flight b
    for (const [key, value] of Object.entries(b)) {
      if (!value) continue;

      const aValue = a[key as keyof ExtractedFlight];
      const aConfidence = a.confidenceBreakdown?.[key] || (aValue ? 1 : 0);
      const bConfidence = b.confidenceBreakdown?.[key] || (value ? 1 : 0);

      // If b has higher confidence, use its value
      if (bConfidence > aConfidence) {
        (merged as any)[key] = value;
      }
    }

    // Merge confidence breakdowns
    if (b.confidenceBreakdown) {
      merged.confidenceBreakdown = {
        ...a.confidenceBreakdown,
        ...b.confidenceBreakdown,
      };
    }

    // Update overall confidence
    merged.confidence = Math.max(a.confidence, b.confidence);

    // Combine extraction methods
    if (a.extractionMethod !== b.extractionMethod) {
      merged.extractionMethod = 'hybrid';
    }

    return merged;
  }

  /**
   * Calculate overall confidence from field-level confidences
   */
  private calculateConfidence(flight: ExtractedFlight): number {
    const requiredFields = [
      'origin',
      'destination',
      'departureDate',
      'departureTime',
    ];

    const breakdown = flight.confidenceBreakdown || {};
    let totalConfidence = 0;
    let fieldCount = 0;

    for (const field of requiredFields) {
      const fieldValue = flight[field as keyof ExtractedFlight];
      const confidence = breakdown[field] ?? (fieldValue ? 1 : 0);
      totalConfidence += confidence;
      fieldCount++;
    }

    return fieldCount > 0 ? totalConfidence / fieldCount : 0;
  }
}
