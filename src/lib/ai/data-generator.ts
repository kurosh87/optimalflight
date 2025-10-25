/**
 * LLM-Powered Data Generation System
 *
 * Generates comprehensive jetlag-optimized data for:
 * - Aircraft rankings (cabin specs, comfort factors)
 * - Airline service rankings (jetlag programs, reliability)
 * - Airport facilities (recovery amenities, stress factors)
 * - Route optimization (timing, layover recommendations)
 * - Knowledge graph facts
 *
 * Works with any LLM: GPT-5 Nano, Claude, Gemini, etc.
 */

import OpenAI from 'openai';

// Configuration for GPT-5 Mini - optimized for speed and cost
const MODEL_CONFIG = {
  model: process.env.OPENAI_MODEL || 'gpt-5-mini-2025-08-07', // GPT-5 Mini
  temperature: 1,  // GPT-5 Mini only supports temperature=1 (default)
  maxTokens: 2000,   // Sufficient for structured data
  maxConcurrent: 5,  // Parallel processing limit
  retryAttempts: 3,  // Number of retries on failure
};

// Lazy-initialized LLM client (avoids build-time initialization)
let llm: OpenAI | null = null;

function getLLM(): OpenAI {
  if (!llm) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    llm = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      // For GPT-5 Nano or other providers, just change baseURL:
      // baseURL: 'https://api.openai.com/v1',
    });
  }
  return llm;
}

/**
 * Generate with retry logic and exponential backoff
 */
async function generateWithRetry(
  messages: Array<{ role: string; content: string }>,
  maxRetries = 3
): Promise<any> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await getLLM().chat.completions.create({
        model: MODEL_CONFIG.model,
        messages,
        response_format: { type: 'json_object' },
        temperature: MODEL_CONFIG.temperature,
        max_tokens: MODEL_CONFIG.maxTokens,
      });

      return JSON.parse(response.choices[0].message.content!);
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      if (isLastAttempt) {
        console.error(`Failed after ${maxRetries} attempts:`, error);
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delayMs = 1000 * Math.pow(2, attempt);
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw new Error('Should not reach here');
}

/**
 * AIRCRAFT DATA GENERATION
 *
 * Generates complete aircraft specifications with jetlag factors
 */
export async function generateAircraftData(aircraftCode: string) {
  const prompt = `
You are an aviation expert specializing in aircraft cabin specifications and passenger comfort.

Generate comprehensive jetlag-related data for aircraft: ${aircraftCode}

Provide the following in JSON format:

{
  "iataCode": "${aircraftCode}",
  "name": "Full aircraft name",
  "manufacturer": "Boeing or Airbus",
  "model": "Specific model/variant",

  "jetlagFactors": {
    "cabinPressureAltitudeFeet": <number 6000-8500>,
    "humidityPercent": <number 10-20>,
    "noiseLevelDb": <number 70-85>,
    "cabinAirRefreshRateMinutes": <number 2-4>
  },

  "comfortFactors": {
    "typicalSeatPitchInches": <number 28-34>,
    "windowSizeSqIn": <number 150-300>,
    "overheadBinSpaceCuFt": <number 100-160>
  },

  "metadata": {
    "firstFlightYear": <year>,
    "isActive": <boolean>,
    "generation": "nextgen|modern|legacy"
  },

  "sources": ["Source 1", "Source 2"]
}

AIRCRAFT GENERATION (CRITICAL - 15-20 point scoring impact):
- "nextgen": Modern low-fatigue aircraft (2010+) - 787, A350, A220, A321neo, 737 MAX, A330neo
- "modern": 2000-2010 aircraft - 777, A330, 737NG, A380
- "legacy": Pre-2000 aircraft - 747-400, MD-80, DC-10, older 737/A320

IMPORTANT SPECIFICATIONS:
- Cabin pressure altitude: Lower is better (787: 6000ft, older: 8000ft)
- Humidity: Higher is better (787: 15-16%, older: 10-12%)
- Noise: Lower is better (modern: 72-74dB, older: 76-80dB)
- Air refresh: Faster is better (modern: 2-3min, older: 3-4min)

Base your response on real specifications. If exact data is unknown, provide reasonable estimates based on aircraft generation and class.
`;

  const response = await getLLM().chat.completions.create({
    model: MODEL_CONFIG.model,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: MODEL_CONFIG.temperature,
  });

  const data = JSON.parse(response.choices[0].message.content!);
  return data;
}

/**
 * AIRLINE DATA GENERATION
 *
 * Generates airline service quality and jetlag awareness data
 */
export async function generateAirlineData(airlineCode: string, realAirlineName?: string, isActive?: boolean) {
  // If airline name not provided, use code as fallback
  const airlineName = realAirlineName || airlineCode;

  // Skip generation if airline is defunct - waste of API credits
  if (isActive === false) {
    console.log(`⏭️  Skipping defunct airline: ${airlineName}`);
    return null;
  }

  const prompt = `
You are an airline industry analyst specializing in passenger services and jetlag recovery programs.

Generate comprehensive service data for airline: ${airlineName} (IATA: ${airlineCode})

CRITICAL: Use EXACTLY this airline name in your response: "${airlineName}"
DO NOT invent or modify the airline name. Use it exactly as provided.

Provide the following in JSON format:

{
  "iataCode": "${airlineCode}",
  "airlineName": "${airlineName}",

  "serviceQuality": {
    "mealQualityRating": <number 1-5>,
    "mealTimingFlexibility": <boolean>,
    "providesSleepKits": <boolean>,
    "sleepKitQuality": "basic|standard|premium",
    "cabinCrewTrainingScore": <number 0-100>
  },

  "reliability": {
    "onTimePerformancePercent": <number 75-95>,
    "delayMinutesAvg": <number 10-60>,
    "cancellationRatePercent": <number 0.5-5>
  },

  "jetlagPrograms": {
    "offersJetlagMenu": <boolean>,
    "lightManagementStrategy": <boolean>,
    "sleepOptimizationPrograms": <boolean>,
    "melatoninAvailable": <boolean>
  },

  "amenities": {
    "seatComfortRating": <number 1-5>,
    "entertainmentQuality": <number 1-5>,
    "providesBlanket": <boolean>,
    "providesPillow": <boolean>,
    "providesEyeMask": <boolean>,
    "providesEarplugs": <boolean>,
    "providesAmenityKit": <boolean>
  },

  "notablePrograms": ["program1", "program2"],
  "sources": ["Source 1", "Source 2"]
}

DETAILED AMENITIES (CRITICAL for comfort scoring - economy class baseline):
- Blanket: Standard for most airlines (true for full-service, false for ultra-low-cost)
- Pillow: Standard for most airlines (true for full-service, false for ultra-low-cost)
- Eye mask: Premium airlines + long-haul flights (Singapore, Qatar, Emirates, ANA, JAL)
- Earplugs: Premium airlines + long-haul flights
- Amenity kit (toothbrush/socks/etc): Premium airlines only

AIRLINE TIERS:
- Premium (SQ, QR, EK, CX, AY, NH, TG, JL): All amenities true
- Full-service (AA, DL, UA, BA, LH, AF, KL): Blanket+pillow true, masks/plugs false
- Low-cost (WN, FR, U2, B6): Only blanket, rest false
- Ultra-low-cost (NK, F9, G4): All false

Base on real airline reputations and published statistics when available.
`;

  const response = await getLLM().chat.completions.create({
    model: MODEL_CONFIG.model,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const data = JSON.parse(response.choices[0].message.content!);
  return data;
}

/**
 * AIRPORT DATA GENERATION
 *
 * Generates airport facilities and jetlag recovery amenities
 */
export async function generateAirportData(airportCode: string, realAirportName?: string) {
  // If airport name not provided, use code as fallback
  const airportName = realAirportName || airportCode;

  const prompt = `
You are an airport facilities expert specializing in passenger wellness and jetlag recovery.

Generate comprehensive facility data for airport: ${airportName} (IATA: ${airportCode})

CRITICAL: Use EXACTLY this airport name in your response: "${airportName}"
DO NOT invent or modify the airport name. Use it exactly as provided.

Provide the following in JSON format:

{
  "iataCode": "${airportCode}",
  "airportName": "${airportName}",

  "recoveryFacilities": {
    "hasSleepPods": <boolean>,
    "sleepPodProvider": "Provider name or null",
    "sleepPodLocations": "Terminal locations or null",

    "hasQuietZones": <boolean>,
    "quietZoneLocations": "Locations or null",

    "hasShowerFacilities": <boolean>,
    "showerLocations": "Locations or null",

    "hasNaturalLightAreas": <boolean>,
    "naturalLightDescription": "Description or null",

    "hasHealthyFoodOptions": <boolean>,
    "healthyFoodVendors": ["Vendor1", "Vendor2"],

    "hasExerciseFacilities": <boolean>,
    "exerciseFacilitiesDescription": "Description or null",

    "hasSpaServices": <boolean>,
    "spaServiceProviders": ["Provider1"],

    "hasMeditationRooms": <boolean>,
    "meditationRoomLocations": "Locations or null",

    "hasOutdoorAccess": <boolean>,
    "outdoorAccessType": "rooftop|terrace|garden|deck|null",
    "outdoorAccessRequiresResecurity": <boolean>,

    "loungeCount": <number 0-20>
  },

  "stressFactors": {
    "averageSecurityWaitMinutes": <number 5-60>,
    "averageImmigrationWaitMinutes": <number 10-90>,
    "terminalWalkingDistanceAvgMeters": <number 200-1500>,
    "signageClarityScore": <number 0-100>,
    "wifiQualityScore": <number 0-100>,
    "noiseLevel": "quiet|moderate|loud"
  },

  "peakHours": [
    {"hour": 6, "congestionLevel": "high"},
    {"hour": 8, "congestionLevel": "high"}
  ],

  "facilityHours": {
    "sleepPods": {"open": "HH:MM", "close": "HH:MM"},
    "showers": {"open": "HH:MM", "close": "HH:MM"},
    "gym": {"open": "HH:MM", "close": "HH:MM"}
  },

  "notableFeatures": ["feature1", "feature2"],
  "sources": ["Source 1"]
}

IMPORTANT:
- Major hubs (SIN, DOH, ICN, DXB): Excellent facilities
- Large US/EU airports (JFK, LAX, LHR, CDG): Good to excellent
- Regional airports: Basic facilities
- Consider airport's reputation for passenger experience

FACILITY HOURS GUIDELINES:
- 24/7 international hubs: "00:00" to "23:59" for all facilities
- Large airports: Sleep pods/showers 05:00-23:00, gym 06:00-22:00
- Regional airports: Sleep pods/showers 06:00-22:00, gym 07:00-21:00
- If facility doesn't exist (has=false), use null for open/close times
- Use 24-hour format (e.g., "06:00", "18:30")

Base on real airport amenities when available.
`;

  const response = await getLLM().chat.completions.create({
    model: MODEL_CONFIG.model,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const data = JSON.parse(response.choices[0].message.content!);
  return data;
}

/**
 * ROUTE OPTIMIZATION DATA GENERATION
 *
 * Generates route-specific jetlag optimization data
 */
export async function generateRouteData(originCode: string, destCode: string) {
  const prompt = `
You are a circadian rhythm specialist and aviation route analyst.

Generate jetlag optimization data for route: ${originCode} → ${destCode}

Provide the following in JSON format:

{
  "originIataCode": "${originCode}",
  "destinationIataCode": "${destCode}",

  "routeCharacteristics": {
    "distanceKm": <number>,
    "typicalDurationMinutes": <number>,
    "direction": "eastbound|westbound|north-south",
    "crossesDateline": <boolean>,
    "crossesEquator": <boolean>
  },

  "optimalTiming": {
    "bestDepartureTimes": [
      {"localHour": 14, "score": 9.5, "reason": "Afternoon departure enables overnight sleep during flight"},
      {"localHour": 16, "score": 9.0, "reason": "Evening departure aligns with natural sleep cycle"}
    ],
    "worstDepartureTimes": [
      {"localHour": 2, "score": 3.0, "reason": "Red-eye disrupts sleep debt"}
    ]
  },

  "layoverRecommendations": {
    "recommendedLayoverDurationHours": <number 0-24>,
    "commonLayoverAirports": [
      {"iataCode": "DXB", "score": 8.5, "reason": "Excellent facilities"}
    ]
  },

  "primaryCarriers": [
    {"iataCode": "AA", "frequency": "daily", "score": 7.5}
  ]
}

IMPORTANT:
- Eastbound: Recommend afternoon/evening departures (14:00-18:00)
- Westbound: Recommend morning departures (8:00-11:00)
- Long-haul (>8hr TZ diff): Suggest strategic layovers
- Consider prevailing winds and typical routing

Base on geography and circadian science.
`;

  const response = await getLLM().chat.completions.create({
    model: MODEL_CONFIG.model,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const data = JSON.parse(response.choices[0].message.content!);
  return data;
}

/**
 * KNOWLEDGE GRAPH FACT GENERATION
 *
 * Extracts jetlag-relevant facts from text or generates new insights
 */
export async function generateKnowledgeFacts(
  entityType: 'aircraft' | 'airline' | 'airport' | 'route',
  entityId: string,
  context?: string
) {
  const prompt = `
You are an aviation intelligence system extracting jetlag-relevant facts.

Entity Type: ${entityType}
Entity ID: ${entityId}
${context ? `Context: ${context}` : ''}

Extract or generate 5-10 jetlag-relevant facts in JSON format:

{
  "facts": [
    {
      "propertyName": "has_circadian_lighting",
      "propertyValue": true,
      "propertyType": "boolean",
      "source": "Airline website 2024",
      "confidenceScore": 0.95,
      "description": "Aircraft features dynamic LED lighting to support circadian adjustment"
    },
    {
      "propertyName": "sleep_pod_hourly_rate",
      "propertyValue": 45,
      "propertyType": "number",
      "source": "Airport website",
      "confidenceScore": 1.0,
      "description": "Cost per hour for sleep pod rental"
    }
  ]
}

Focus on facts that help travelers minimize jetlag:
- Aircraft: Cabin features, lighting, air quality
- Airline: Jetlag programs, meal timing, sleep support
- Airport: Recovery facilities, quiet zones, wellness amenities
- Route: Optimal timing, layover strategies

Confidence score: 0.0-1.0 based on source reliability.
`;

  const response = await getLLM().chat.completions.create({
    model: MODEL_CONFIG.model,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.5,
  });

  const data = JSON.parse(response.choices[0].message.content!);
  return data.facts;
}

/**
 * BATCH GENERATION UTILITIES WITH PARALLEL PROCESSING
 */

/**
 * Process items in parallel batches with concurrency limit
 */
async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: {
    concurrency?: number;
    onProgress?: (completed: number, total: number) => void;
    delayMs?: number;
  } = {}
): Promise<Array<{ item: T; result?: R; error?: any; success: boolean }>> {
  const {
    concurrency = MODEL_CONFIG.maxConcurrent,
    onProgress,
    delayMs = 500,
  } = options;

  const results: Array<{ item: T; result?: R; error?: any; success: boolean }> = [];
  const queue = [...items];
  let completed = 0;

  // Process items with concurrency limit
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;

      try {
        const result = await processor(item);
        results.push({ item, result, success: true });
      } catch (error) {
        console.error(`Error processing item:`, error);
        results.push({ item, error, success: false });
      }

      completed++;
      onProgress?.(completed, items.length);

      // Rate limiting delay
      if (queue.length > 0 && delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  });

  await Promise.all(workers);
  return results;
}

export async function generateBatchAircraft(
  aircraftCodes: string[],
  options?: { onProgress?: (completed: number, total: number) => void }
) {
  console.log(`\n🚀 Starting batch generation for ${aircraftCodes.length} aircraft`);

  const results = await processBatch(
    aircraftCodes,
    async (code) => {
      console.log(`  Generating: ${code}`);
      const data = await generateAircraftData(code);
      return data;
    },
    {
      concurrency: MODEL_CONFIG.maxConcurrent,
      onProgress: options?.onProgress || ((completed, total) => {
        const pct = ((completed / total) * 100).toFixed(0);
        console.log(`  Progress: ${completed}/${total} (${pct}%)`);
      }),
    }
  );

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n✅ Aircraft generation complete:`);
  console.log(`   Success: ${successful.length}/${aircraftCodes.length}`);
  if (failed.length > 0) {
    console.log(`   Failed: ${failed.length}`);
    console.log(`   Failed codes:`, failed.map(f => (f.item as string)).join(', '));
  }

  return results.map(r => ({
    code: r.item as string,
    data: r.result,
    error: r.error,
    success: r.success
  }));
}

export async function generateBatchAirlines(
  airlineCodes: string[],
  options?: { onProgress?: (completed: number, total: number) => void }
) {
  console.log(`\n🚀 Starting batch generation for ${airlineCodes.length} airlines`);

  const results = await processBatch(
    airlineCodes,
    async (code) => {
      console.log(`  Generating: ${code}`);
      const data = await generateAirlineData(code);
      return data;
    },
    {
      concurrency: MODEL_CONFIG.maxConcurrent,
      onProgress: options?.onProgress || ((completed, total) => {
        const pct = ((completed / total) * 100).toFixed(0);
        console.log(`  Progress: ${completed}/${total} (${pct}%)`);
      }),
    }
  );

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n✅ Airline generation complete:`);
  console.log(`   Success: ${successful.length}/${airlineCodes.length}`);
  if (failed.length > 0) {
    console.log(`   Failed: ${failed.length}`);
    console.log(`   Failed codes:`, failed.map(f => (f.item as string)).join(', '));
  }

  return results.map(r => ({
    code: r.item as string,
    data: r.result,
    error: r.error,
    success: r.success
  }));
}

export async function generateBatchAirports(
  airportCodes: string[],
  options?: { onProgress?: (completed: number, total: number) => void }
) {
  console.log(`\n🚀 Starting batch generation for ${airportCodes.length} airports`);

  const results = await processBatch(
    airportCodes,
    async (code) => {
      console.log(`  Generating: ${code}`);
      const data = await generateAirportData(code);
      return data;
    },
    {
      concurrency: MODEL_CONFIG.maxConcurrent,
      onProgress: options?.onProgress || ((completed, total) => {
        const pct = ((completed / total) * 100).toFixed(0);
        console.log(`  Progress: ${completed}/${total} (${pct}%)`);
      }),
    }
  );

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n✅ Airport generation complete:`);
  console.log(`   Success: ${successful.length}/${airportCodes.length}`);
  if (failed.length > 0) {
    console.log(`   Failed: ${failed.length}`);
    console.log(`   Failed codes:`, failed.map(f => (f.item as string)).join(', '));
  }

  return results.map(r => ({
    code: r.item as string,
    data: r.result,
    error: r.error,
    success: r.success
  }));
}
