/**
 * Airport Intelligence Service
 * Generates comprehensive jetlag recovery facility data using AI
 */

import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { AirportIntelligence, calculateCompletenessScore } from '@/lib/types/airport-intelligence';
import { db } from '@/lib/db';
import { airports, airportIntelligence } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Direct OpenAI configuration for bulk processing
if (!process.env.OPENAI_API_KEY) {
  throw new Error('CRITICAL: OPENAI_API_KEY environment variable is required');
}

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============= Zod Schemas for Structured Output =============

const FacilityLocationSchema = z.object({
  terminal: z.string(),
  area: z.string(),
  postSecurity: z.boolean(),
}).passthrough();

const PricingInfoSchema = z.object({
  hourly: z.number().nullable(),
  overnight: z.number().nullable(),
  currency: z.string(),
});

const SleepPodSchema = z.object({
  name: z.string(),
  location: FacilityLocationSchema,
  provider: z.string(),
  features: z.array(z.string()),
  pricing: PricingInfoSchema,
  availability: z.string(),
  bookingRequired: z.boolean(),
  bookingUrl: z.string().optional(),
  jetlagBenefit: z.string(),
});

const QuietZoneSchema = z.object({
  location: FacilityLocationSchema,
  features: z.array(z.string()),
  capacity: z.enum(['small', 'medium', 'large']),
  jetlagBenefit: z.string(),
});

const ShowerFacilitySchema = z.object({
  name: z.string(),
  location: FacilityLocationSchema,
  pricing: z.object({
    amount: z.number().nullable(),
    currency: z.string(),
    included: z.array(z.string()),
  }),
  hours: z.string(),
  bookingRequired: z.boolean(),
  jetlagBenefit: z.string(),
});

const GymFacilitySchema = z.object({
  name: z.string(),
  location: FacilityLocationSchema,
  equipment: z.array(z.string()),
  hours: z.string(),
  access: z.enum(['free', 'paid', 'lounge-members']),
  pricing: z.object({
    dayPass: z.number().nullable(),
    currency: z.string(),
  }).optional(),
  showers: z.boolean(),
  jetlagBenefit: z.string(),
});

const SpaFacilitySchema = z.object({
  name: z.string(),
  location: FacilityLocationSchema,
  services: z.array(z.string()),
  hours: z.string(),
  bookingRecommended: z.boolean(),
  priceRange: z.string(),
  jetlagBenefit: z.string(),
});

const MeditationRoomSchema = z.object({
  location: FacilityLocationSchema,
  denomination: z.string().optional(),
  features: z.array(z.string()),
  hours: z.string(),
  jetlagBenefit: z.string(),
});

const OutdoorAreaSchema = z.object({
  name: z.string(),
  location: FacilityLocationSchema,
  features: z.array(z.string()),
  jetlagBenefit: z.string(),
});

const NaturalLightAreaSchema = z.object({
  location: FacilityLocationSchema,
  description: z.string(),
  bestTimeForSunlight: z.string(),
  seatingAvailable: z.boolean(),
}).passthrough();

const RestaurantSchema = z.object({
  name: z.string(),
  location: FacilityLocationSchema,
  cuisine: z.array(z.string()),
  hours: z.string(),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']),
  healthyOptions: z.boolean(),
  jetlagRelevance: z.string().optional(),
});

const HealthyDiningSchema = z.object({
  name: z.string(),
  location: FacilityLocationSchema,
  specialties: z.array(z.string()),
  hours: z.string(),
  jetlagBenefit: z.string(),
});

const LoungeSchema = z.object({
  name: z.string(),
  location: FacilityLocationSchema,
  access: z.array(z.string()),
  features: z.array(z.string()),
  hours: z.string(),
  jetlagAmenities: z.array(z.string()),
});

const CityTransportSchema = z.object({
  type: z.enum(['train', 'bus', 'taxi', 'shuttle', 'metro', 'bus/shuttle']), // Allow combinations
  name: z.string(),
  toCityCenter: z.object({
    duration: z.number(),
    frequency: z.string(),
    hours: z.string(),
    pricing: z.object({
      amount: z.number().nullable(), // Allow null for variable pricing
      currency: z.string(),
    }),
  }),
  location: z.string(),
}).passthrough(); // Allow extra fields like "notes"

const NearbyHotelSchema = z.object({
  name: z.string(),
  distance: z.object({
    walking: z.number().nullable(),
    shuttle: z.boolean(),
  }),
  dayRooms: z.boolean(),
  transitHotel: z.boolean(),
  features: z.array(z.string()),
  priceRange: z.string(),
  jetlagRelevance: z.string(),
});

const PharmacyInfoSchema = z.object({
  name: z.string(),
  location: FacilityLocationSchema,
  hours: z.string(),
  sellsMelatonin: z.boolean(),
  sellsCaffeine: z.boolean(),
});

const WifiInfoSchema = z.object({
  free: z.boolean(),
  timeLimit: z.number().optional(),
  registrationRequired: z.boolean(),
  speed: z.enum(['slow', 'moderate', 'fast']),
  coverage: z.enum(['full', 'partial']),
});

// Combined schema for AI generation
const AirportIntelligenceSchema = z.object({
  recovery: z.object({
    sleepPods: z.array(SleepPodSchema),
    quietZones: z.array(QuietZoneSchema),
    showers: z.array(ShowerFacilitySchema),
    gyms: z.array(GymFacilitySchema),
    spas: z.array(SpaFacilitySchema),
    meditationRooms: z.array(MeditationRoomSchema),
    outdoorAreas: z.array(OutdoorAreaSchema),
  }),
  lightExposure: z.object({
    naturalLightAreas: z.array(NaturalLightAreaSchema),
    outdoorTerraces: z.array(OutdoorAreaSchema),
    windowSeating: z.array(z.object({
      location: FacilityLocationSchema,
      orientation: z.string(),
      description: z.string(),
    }).passthrough()),
  }).passthrough(),
  dining: z.object({
    restaurants: z.array(RestaurantSchema.passthrough()),
    cafes: z.array(z.object({
      name: z.string(),
      location: FacilityLocationSchema,
      offerings: z.array(z.string()),
      hours: z.string(),
      priceRange: z.enum(['$', '$$']).optional(),
    }).passthrough()).optional().default([]),
    healthyOptions: z.array(HealthyDiningSchema.passthrough()).optional().default([]),
    twentyFourHourOptions: z.array(z.object({
      name: z.string(),
      location: FacilityLocationSchema,
      type: z.enum(['restaurant', 'cafe', 'food-court', 'convenience']),
      offerings: z.array(z.string()),
      hours: z.string().optional(),
    }).passthrough()).optional().default([]),
  }).passthrough(),
  lounges: z.array(LoungeSchema),
  transportation: z.object({
    toCity: z.array(CityTransportSchema),
    nearbyHotels: z.array(NearbyHotelSchema).optional().default([]),
  }),
  services: z.object({
    pharmacy: z.array(PharmacyInfoSchema),
    wifi: WifiInfoSchema,
  }),
  sources: z.array(z.string()),
}).passthrough(); // Allow extra fields that AI might generate

// ============= Service Class =============

export class AirportIntelligenceService {
  private model = openai('gpt-5-mini-2025-08-07'); // Using GPT-5-mini for generation

  /**
   * Generate comprehensive airport intelligence data for jetlag recovery
   */
  async generateAirportIntelligence(airportCode: string): Promise<AirportIntelligence | null> {
    try {
      // First, get airport basic info from database
      const airportData = await db
        .select()
        .from(airports)
        .where(eq(airports.iataCode, airportCode))
        .limit(1);

      if (airportData.length === 0) {
        console.error(`Airport ${airportCode} not found in database`);
        return null;
      }

      const airport = airportData[0];

      const prompt = this.buildPrompt(airportCode, airport.airportName, airport.cityId || 'Unknown');

      // Generate structured output using Vercel AI SDK
      const { object } = await generateObject({
        model: this.model,
        schema: AirportIntelligenceSchema,
        prompt,
      });

      // Build complete AirportIntelligence object
      const intelligence: AirportIntelligence = {
        code: airportCode,
        name: airport.airportName,
        city: airport.cityId || 'Unknown',
        country: airport.countryName || 'Unknown',
        timezone: airport.timezone || 'UTC',
        terminals: [], // Will be populated from terminal info
        recovery: object.recovery as any,
        lightExposure: object.lightExposure as any,
        dining: object.dining as any,
        lounges: object.lounges as any,
        transportation: {
          interTerminal: [],
          toCity: object.transportation.toCity as any,
          nearbyHotels: object.transportation.nearbyHotels as any,
          rentalCars: [],
        } as any,
        services: {
          pharmacy: object.services.pharmacy,
          medical: [],
          wifi: object.services.wifi,
          chargingStations: [],
          baggageStorage: [],
          infoCenter: [],
        },
        navigation: {
          walkingTimesBetweenTerminals: [],
          securityWaitTimes: [],
          immigrationFacilities: [],
        },
        dataQuality: this.assessDataQuality(object),
        tierPriority: this.determineTier(airportCode),
        lastUpdated: new Date().toISOString(),
        sources: object.sources,
      };

      // Calculate completeness score
      const completenessScore = calculateCompletenessScore(intelligence);

      // Save to database
      await this.saveToDatabase(airportCode, intelligence, completenessScore);

      return intelligence;
    } catch (error) {
      console.error(`Error generating intelligence for ${airportCode}:`, error);
      return null;
    }
  }

  /**
   * Build the AI prompt for comprehensive data generation
   */
  private buildPrompt(code: string, name: string, city: string): string {
    return `You are an expert travel researcher specializing in airport facilities for jetlag recovery.

Research and provide comprehensive, FACTUAL data about ${name} (${code}) in ${city}.

CRITICAL REQUIREMENTS:
1. **Jetlag Recovery Focus**: Prioritize facilities that help travelers recover from jetlag:
   - Sleep pods, nap rooms, quiet zones
   - Gyms and exercise facilities (exercise helps reset circadian rhythm)
   - Natural light exposure areas (critical for circadian adjustment)
   - Healthy dining options (nutrition timing affects recovery)
   - Showers and refresh facilities
   - Meditation/prayer rooms for stress reduction

2. **Accuracy**: Only include facilities that ACTUALLY EXIST at this airport. If you're unsure, leave the array empty. Do NOT invent facilities.

3. **Practical Details**: Include:
   - Exact terminal locations (e.g., "Terminal 3, Gate A15, near restrooms")
   - Whether facilities are pre or post-security (crucial for transit passengers)
   - Operating hours (especially 24-hour options)
   - Pricing in local currency
   - Booking requirements and URLs

4. **Jetlag Benefits**: For each facility, explain WHY it helps with jetlag recovery. Examples:
   - "Power nap facility for 20-90 min sleep cycles to reduce homeostatic sleep pressure"
   - "Exercise in morning local time helps advance circadian phase for eastward travel"
   - "Direct sunlight exposure at strategic times shifts circadian clock faster than indoor light"

5. **Sources**: List all sources used (official airport website, lounge databases, recent reviews).

6. **Data Quality**: Be honest about data quality:
   - Use official airport websites and terminal maps as primary sources
   - Cross-reference with lounge databases (Priority Pass, LoungeKey)
   - Check recent traveler reviews (2024-2025)
   - If info is limited, return fewer items with high confidence

Focus especially on:
- Sleep facilities (highest priority for jetlag)
- Light exposure opportunities
- 24-hour food options
- Transportation to city/hotels
- Pharmacy availability (for melatonin/caffeine)

Return structured data with ALL required fields filled in accurately.`;
  }

  /**
   * Assess data quality based on completeness and sources
   */
  private assessDataQuality(data: any): 'verified' | 'partial' | 'minimal' {
    const hasOfficialSources = data.sources.some((s: string) =>
      s.includes('.com') || s.includes('airport') || s.includes('official')
    );

    const facilityCount =
      data.recovery.sleepPods.length +
      data.recovery.gyms.length +
      data.lightExposure.naturalLightAreas.length +
      data.dining.healthyOptions.length;

    if (hasOfficialSources && facilityCount >= 5) return 'verified';
    if (facilityCount >= 3) return 'partial';
    return 'minimal';
  }

  /**
   * Determine airport tier based on passenger volume
   */
  private determineTier(code: string): 'tier_1' | 'tier_2' | 'tier_3' | 'tier_4' {
    const tier1 = ['LHR', 'LAX', 'DXB', 'HND', 'ORD', 'CDG', 'JFK', 'NRT', 'SIN', 'ICN', 'ATL', 'DEN', 'PEK', 'PVG', 'AMS', 'FRA', 'IST', 'DEL', 'BKK', 'LGW'];
    const tier2 = ['SFO', 'MIA', 'SEA', 'BOS', 'EWR', 'IAD', 'PHX', 'IAH', 'MCO', 'LAS', 'CLT', 'MSP', 'DTW', 'FCO', 'MAD', 'BCN', 'MUC', 'SYD', 'MEL', 'YYZ'];

    if (tier1.includes(code)) return 'tier_1';
    if (tier2.includes(code)) return 'tier_2';
    return 'tier_3'; // Default to tier_3 for now
  }

  /**
   * Save generated intelligence to database
   */
  private async saveToDatabase(code: string, intelligence: AirportIntelligence, completenessScore: number): Promise<void> {
    try {
      // Check if record exists
      const existing = await db
        .select()
        .from(airportIntelligence)
        .where(eq(airportIntelligence.iataCode, code))
        .limit(1);

      const dataToSave = {
        iataCode: code,
        jetlagRecoveryData: JSON.stringify(intelligence.recovery),
        lightExposureData: JSON.stringify(intelligence.lightExposure),
        diningData: JSON.stringify(intelligence.dining),
        loungesData: JSON.stringify(intelligence.lounges),
        transportationData: JSON.stringify(intelligence.transportation),
        servicesData: JSON.stringify(intelligence.services),
        navigationData: JSON.stringify(intelligence.navigation),
        dataSources: JSON.stringify(intelligence.sources),
        tierPriority: intelligence.tierPriority,
        dataQuality: intelligence.dataQuality,
        completenessScore,
        processingStatus: 'completed',
        updatedAt: new Date(),
      };

      if (existing.length > 0) {
        // Update existing record
        await db
          .update(airportIntelligence)
          .set(dataToSave)
          .where(eq(airportIntelligence.iataCode, code));
      } else {
        // Insert new record
        await db.insert(airportIntelligence).values({
          id: `${code}-${Date.now()}`,
          ...dataToSave,
          createdAt: new Date(),
        });
      }

      console.log(`✓ Saved intelligence data for ${code} (quality: ${intelligence.dataQuality}, score: ${completenessScore})`);
    } catch (error) {
      console.error(`Error saving to database for ${code}:`, error);
      throw error;
    }
  }

  /**
   * Process batch of airports with rate limiting
   */
  async processBatch(codes: string[], delayMs: number = 6000): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const code of codes) {
      console.log(`Processing ${code}...`);

      try {
        const result = await this.generateAirportIntelligence(code);
        if (result) {
          success.push(code);
        } else {
          failed.push(code);
        }
      } catch (error) {
        console.error(`Failed to process ${code}:`, error);
        failed.push(code);
      }

      // Rate limiting: wait between requests
      if (codes.indexOf(code) < codes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return { success, failed };
  }
}

// Export singleton instance
export const airportIntelligenceService = new AirportIntelligenceService();
