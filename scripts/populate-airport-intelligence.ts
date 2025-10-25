/**
 * Populate Airport Intelligence with GPT-5 Assessments
 *
 * This script uses GPT-5 to assess major hub airports for jetlag recovery features
 * and connection complexity, populating the airport_intelligence table with real data.
 */

import dotenv from 'dotenv';
import path from 'path';
import OpenAI from 'openai';
import { db } from '../lib/db';
import { airportIntelligence } from '../app/schema/schema';
import { eq } from 'drizzle-orm';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Top 20 airports for initial population
const TOP_AIRPORTS = [
  // US hubs
  { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York' },
  { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles' },
  { code: 'ORD', name: "O'Hare International Airport", city: 'Chicago' },
  { code: 'DFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas' },
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta' },

  // Europe
  { code: 'LHR', name: 'London Heathrow Airport', city: 'London' },
  { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris' },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt' },
  { code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam' },
  { code: 'MAD', name: 'Adolfo Suárez Madrid-Barajas Airport', city: 'Madrid' },

  // Middle East
  { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai' },
  { code: 'DOH', name: 'Hamad International Airport', city: 'Doha' },
  { code: 'AUH', name: 'Abu Dhabi International Airport', city: 'Abu Dhabi' },

  // Asia
  { code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore' },
  { code: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong' },
  { code: 'ICN', name: 'Incheon International Airport', city: 'Seoul' },
  { code: 'NRT', name: 'Narita International Airport', city: 'Tokyo' },
  { code: 'PVG', name: 'Shanghai Pudong International Airport', city: 'Shanghai' },

  // Oceania
  { code: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney' },
  { code: 'MEL', name: 'Melbourne Airport', city: 'Melbourne' },
];

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const GPT_MODEL = process.env.OPENAI_MODEL || 'gpt-5-mini-2025-08-07';

interface AirportAssessment {
  jetlagRecoveryData: {
    loungeQualityScore: number;
    hasShowerFacilities: boolean;
    hasSleepPods: boolean;
    hasSleepSeating: boolean;
    hasHealthyFood: boolean;
    bestLounge: string;
  };
  loungesData: {
    overallQuality: number;
    hasPremiumLounges: boolean;
    hasShowers: boolean;
    lounges: Array<{
      name: string;
      terminal?: string;
      location: 'airside' | 'landside';
      access: string[];
      has_showers: boolean;
      has_sleep_areas: boolean;
      quality_rating: number;
    }>;
    notableLounges: string[];
    bestForJetlag: string;
    confidence: 'low' | 'medium' | 'high';
  };
  navigationData: {
    complexityScore: number;
    minimumConnectionTime: number;
    realisticConnectionTime: number;
    requiresSecurityRescreen: boolean;
    requiresTerminalChange: boolean;
    terminalChangeMethod?: string;
    hasFastTrack: boolean;
    challenges: string[];
    tips: string;
    confidence: 'low' | 'medium' | 'high';
  };
}

async function assessAirport(
  code: string,
  name: string,
  city: string
): Promise<AirportAssessment | null> {
  const prompt = `You are an expert on airport facilities and international travel, specializing in jetlag recovery and connection efficiency.

Assess ${name} (${code}) in ${city} for:

1. JETLAG RECOVERY & LOUNGE QUALITY (scale 0-10):
   - Lounge quality score (consider comfort, amenities, food quality)
   - Shower facilities availability
   - Sleep pods or dedicated sleep areas
   - Comfortable seating for rest
   - Healthy food options
   - Best lounge recommendation for jetlag recovery

2. LOUNGE DETAILS:
   - Overall lounge quality (0-10)
   - List of premium lounges (if any)
   - Notable lounges worth visiting
   - Which lounge is best for jetlag recovery
   - Confidence in this assessment (low/medium/high)

3. CONNECTION COMPLEXITY (scale 1-10, where 1=very easy, 10=very difficult):
   - Complexity score for making connections
   - Minimum connection time (in minutes)
   - Realistic connection time for comfort (in minutes)
   - Whether security re-screening is required
   - Whether terminal changes are required
   - Terminal change method (if applicable): shuttle, train, walk
   - Fast-track availability for connections
   - Major challenges passengers face
   - Practical tips for smooth connections
   - Confidence in this assessment (low/medium/high)

Return a JSON object with this exact structure:
{
  "jetlagRecoveryData": {
    "loungeQualityScore": 8.5,
    "hasShowerFacilities": true,
    "hasSleepPods": true,
    "hasSleepSeating": true,
    "hasHealthyFood": true,
    "bestLounge": "Specific lounge name"
  },
  "loungesData": {
    "overallQuality": 8.5,
    "hasPremiumLounges": true,
    "hasShowers": true,
    "lounges": [
      {
        "name": "Lounge Name",
        "terminal": "T3",
        "location": "airside",
        "access": ["Priority Pass", "Business Class"],
        "has_showers": true,
        "has_sleep_areas": true,
        "quality_rating": 9.0
      }
    ],
    "notableLounges": ["Lounge 1", "Lounge 2"],
    "bestForJetlag": "Specific lounge with reasons",
    "confidence": "high"
  },
  "navigationData": {
    "complexityScore": 3.5,
    "minimumConnectionTime": 60,
    "realisticConnectionTime": 90,
    "requiresSecurityRescreen": false,
    "requiresTerminalChange": true,
    "terminalChangeMethod": "train",
    "hasFastTrack": true,
    "challenges": ["Challenge 1", "Challenge 2"],
    "tips": "Specific practical advice",
    "confidence": "high"
  }
}

Be specific and accurate. Use your knowledge of this airport to provide realistic assessments. For confidence, use "high" if you have detailed knowledge, "medium" if general knowledge, "low" if uncertain.`;

  try {
    console.log(`\n🔍 Assessing ${code} (${name})...`);

    const completion = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert airport analyst with deep knowledge of international airport facilities, lounges, and connection procedures. You provide accurate, data-driven assessments in JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent, factual responses
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      console.error(`❌ No response for ${code}`);
      return null;
    }

    const assessment = JSON.parse(content) as AirportAssessment;

    console.log(`✅ ${code}: Lounge ${assessment.jetlagRecoveryData.loungeQualityScore}/10, Complexity ${assessment.navigationData.complexityScore}/10`);

    return assessment;
  } catch (error) {
    console.error(`❌ Error assessing ${code}:`, error);
    return null;
  }
}

async function updateAirportIntelligence(
  code: string,
  assessment: AirportAssessment
): Promise<boolean> {
  try {
    const result = await db
      .update(airportIntelligence)
      .set({
        jetlagRecoveryData: JSON.stringify(assessment.jetlagRecoveryData),
        loungesData: JSON.stringify(assessment.loungesData),
        navigationData: JSON.stringify(assessment.navigationData),
      })
      .where(eq(airportIntelligence.iataCode, code));

    console.log(`   💾 Updated database for ${code}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Database error for ${code}:`, error);
    return false;
  }
}

async function main() {
  console.log('================================================================================');
  console.log('AIRPORT INTELLIGENCE POPULATION');
  console.log('================================================================================');
  console.log(`Using model: ${GPT_MODEL}`);
  console.log(`Populating ${TOP_AIRPORTS.length} airports\n`);

  let successCount = 0;
  let failCount = 0;

  for (const airport of TOP_AIRPORTS) {
    const assessment = await assessAirport(airport.code, airport.name, airport.city);

    if (assessment) {
      const updated = await updateAirportIntelligence(airport.code, assessment);
      if (updated) {
        successCount++;
      } else {
        failCount++;
      }
    } else {
      failCount++;
    }

    // Rate limiting: wait 2 seconds between requests
    if (airport !== TOP_AIRPORTS[TOP_AIRPORTS.length - 1]) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n================================================================================');
  console.log('POPULATION SUMMARY');
  console.log('================================================================================');
  console.log(`✅ Successfully populated: ${successCount}/${TOP_AIRPORTS.length}`);
  console.log(`❌ Failed: ${failCount}/${TOP_AIRPORTS.length}`);

  if (successCount > 0) {
    console.log('\n✨ You can now test with real data:');
    console.log('   npm run tsx scripts/test-airport-intel-integration.ts');
  }
}

main().catch(console.error);
