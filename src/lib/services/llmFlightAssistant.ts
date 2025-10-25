/**
 * LLM-Powered Flight Assistant
 *
 * Conversational interface for flight search and optimization using GPT-5
 * Integrates with Kiwi and Amadeus search services
 */

import { createOpenAI } from '@ai-sdk/openai';
import { generateText, generateObject, streamText } from 'ai';
import { z } from 'zod';

// Configure OpenAI with Vercel AI Gateway
const openai = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY!,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});

// Schema for flight search intent extraction
const FlightSearchIntentSchema = z.object({
  searchType: z.enum(['one-way', 'round-trip', 'multi-city', 'flexible']).describe('Type of flight search'),
  origin: z.string().describe('Origin airport code or city name'),
  destination: z.string().describe('Destination airport code or city name'),
  departureDate: z.string().describe('Departure date in YYYY-MM-DD format'),
  returnDate: z.string().optional().describe('Return date for round trips'),
  passengers: z.number().default(1).describe('Number of passengers'),
  cabinClass: z.enum(['economy', 'premium_economy', 'business', 'first']).default('economy'),
  maxStops: z.number().optional().describe('Maximum number of stops'),
  maxPrice: z.number().optional().describe('Maximum price in USD'),
  flexibleDates: z.boolean().default(false).describe('Whether user wants flexible dates'),
  optimizeFor: z.enum(['price', 'jetlag', 'duration', 'comfort']).default('jetlag').describe('Primary optimization goal'),
});

export type FlightSearchIntent = z.infer<typeof FlightSearchIntentSchema>;

// Schema for flight recommendation explanation
const FlightRecommendationSchema = z.object({
  summary: z.string().describe('Brief summary of the recommendation'),
  topChoice: z.object({
    flightId: z.string(),
    reasoning: z.string().describe('Why this flight is recommended'),
    jetlagScore: z.number(),
    price: z.number(),
  }),
  alternatives: z.array(z.object({
    flightId: z.string(),
    reasoning: z.string(),
    tradeoffs: z.string().describe('What you gain/lose vs top choice'),
  })),
  personalizedTips: z.array(z.string()).describe('3-5 personalized tips for this journey'),
});

export type FlightRecommendation = z.infer<typeof FlightRecommendationSchema>;

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Extract flight search intent from natural language query
 */
export async function extractFlightSearchIntent(
  userMessage: string,
  conversationHistory: ConversationMessage[] = []
): Promise<FlightSearchIntent> {
  const currentDate = new Date().toISOString().split('T')[0];
  const systemPrompt = `You are a flight search assistant. Extract structured flight search parameters from the user's natural language query.

Current date: ${currentDate}

Be smart about:
- Date parsing: "next Friday", "in 2 weeks", "December 15th"
- Location parsing: city names, airport codes, country names
- Implicit preferences: business travelers prefer direct flights, leisure travelers are price-sensitive
- Jet lag optimization: eastbound flights are harder, suggest daytime arrivals when possible

If information is missing, use reasonable defaults based on context.`;

  const conversationContext = conversationHistory.length > 0
    ? `Previous conversation:\n${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}\n\n`
    : '';

  try {
    const { object } = await generateObject({
      model: openai(process.env.OPENAI_MODEL || 'gpt-5-mini-2025-08-07'),
      schema: FlightSearchIntentSchema,
      system: systemPrompt,
      prompt: `${conversationContext}User query: ${userMessage}`,
    });

    return object;
  } catch (error) {
    console.error('Error extracting flight search intent:', error);
    throw new Error('Failed to understand flight search request');
  }
}

/**
 * Generate personalized flight recommendations with explanations
 */
export async function generateFlightRecommendations(
  searchResults: any[],
  userPreferences: {
    optimizeFor: 'price' | 'jetlag' | 'duration' | 'comfort';
    sleepQuality?: string;
    adaptabilityLevel?: string;
    travelFrequency?: string;
  },
  userQuery: string
): Promise<FlightRecommendation> {
  const flightsContext = searchResults.slice(0, 5).map((flight, idx) => ({
    id: `flight-${idx + 1}`,
    route: `${flight.flyFrom} → ${flight.flyTo}`,
    price: flight.price,
    duration: `${Math.floor(flight.duration / 60)}h ${flight.duration % 60}m`,
    stops: flight.routes?.length - 1 || 0,
    jetlagScore: flight.jetlagScore || 5.0,
    departure: flight.local_departure,
    arrival: flight.local_arrival,
    airlines: flight.airlines || [],
    aircraft: flight.route?.[0]?.equipment || 'Unknown',
  }));

  const optimizeGoal = userPreferences.optimizeFor;
  const sleepQual = userPreferences.sleepQuality || 'average';
  const adaptLevel = userPreferences.adaptabilityLevel || 'medium';

  const systemPrompt = `You are an expert flight advisor specializing in jet lag optimization and travel wellness.

User's optimization goal: ${optimizeGoal}
User's sleep quality: ${sleepQual}
User's adaptability: ${adaptLevel}

Recommend the best flight considering:
1. Jet lag impact (circadian disruption, arrival time, flight duration)
2. Price-value balance
3. Comfort factors (aircraft type, airline service, layover quality)
4. User's stated preferences

Be conversational, helpful, and explain trade-offs clearly.`;

  const prompt = `Based on these flight options:

${JSON.stringify(flightsContext, null, 2)}

User asked: "${userQuery}"

Recommend the best flight and explain why. Include alternatives with clear trade-offs.`;

  try {
    const { object } = await generateObject({
      model: openai(process.env.OPENAI_MODEL || 'gpt-5-mini-2025-08-07'),
      schema: FlightRecommendationSchema,
      system: systemPrompt,
      prompt,
    });

    return object;
  } catch (error) {
    console.error('Error generating flight recommendations:', error);
    throw new Error('Failed to generate flight recommendations');
  }
}

/**
 * Conversational flight search with streaming response
 */
export async function conversationalFlightSearch(
  userMessage: string,
  conversationHistory: ConversationMessage[] = [],
  userContext?: {
    userId?: string;
    preferences?: any;
    recentSearches?: any[];
  }
) {
  const systemPrompt = `You are NoJetlag's AI flight assistant. You help travelers find the best flights optimized for jet lag recovery.

Your capabilities:
- Search flights using Kiwi.com and Amadeus APIs
- Calculate jet lag scores based on circadian science
- Recommend optimal flight timings and airlines
- Provide personalized recovery advice

Be friendly, concise, and helpful. Always consider jet lag impact in your recommendations.`;

  const conversationContext = conversationHistory.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));

  try {
    const result = await streamText({
      model: openai(process.env.OPENAI_MODEL || 'gpt-5-mini-2025-08-07'),
      system: systemPrompt,
      messages: [
        ...conversationContext,
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.7,
      maxTokens: 1000,
    });

    return result;
  } catch (error) {
    console.error('Error in conversational flight search:', error);
    throw new Error('Failed to process conversational request');
  }
}

/**
 * Generate natural language explanation for jet lag score
 */
export async function explainJetlagScore(
  score: number,
  flightDetails: {
    timezoneShift: number;
    direction: 'eastbound' | 'westbound';
    departureTime: string;
    arrivalTime: string;
    duration: number;
  }
): Promise<string> {
  const tzShift = flightDetails.timezoneShift;
  const dir = flightDetails.direction;
  const dept = flightDetails.departureTime;
  const arr = flightDetails.arrivalTime;
  const dur = flightDetails.duration;

  const prompt = `Explain this jet lag score in simple, conversational language:

Score: ${score}/10 (10 = best for jet lag recovery)

Flight details:
- Timezone shift: ${tzShift} hours ${dir}
- Departure: ${dept}
- Arrival: ${arr}
- Duration: ${dur} hours

Explain:
1. Why the score is what it is
2. What makes this flight good/bad for jet lag
3. One practical tip to minimize jet lag on this flight

Keep it under 150 words and friendly.`;

  try {
    const { text } = await generateText({
      model: openai(process.env.OPENAI_MODEL || 'gpt-5-mini-2025-08-07'),
      prompt,
      temperature: 0.7,
      maxTokens: 300,
    });

    return text;
  } catch (error) {
    console.error('Error explaining jet lag score:', error);
    return `This flight has a jet lag score of ${score}/10. ${
      score >= 8 ? 'Excellent for recovery!' :
      score >= 6 ? 'Good for recovery with some preparation.' :
      score >= 4 ? 'Moderate jet lag expected.' :
      'Challenging for recovery - plan accordingly.'
    }`;
  }
}

/**
 * Compare multiple flights and explain differences
 */
export async function compareFlights(
  flights: Array<{
    id: string;
    route: string;
    price: number;
    jetlagScore: number;
    duration: number;
    stops: number;
  }>
): Promise<string> {
  const flightsList = flights.map((f, i) => `
Flight ${i + 1} (${f.id}):
- Route: ${f.route}
- Price: $${f.price}
- Jet lag score: ${f.jetlagScore}/10
- Duration: ${f.duration} hours
- Stops: ${f.stops}
`).join('\n');

  const prompt = `Compare these flights and explain which is best for different priorities:

${flightsList}

Create a comparison that helps the user decide based on:
- Best for jet lag recovery
- Best value for money
- Fastest option
- Most convenient (fewest stops)

Be concise and actionable.`;

  try {
    const { text } = await generateText({
      model: openai(process.env.OPENAI_MODEL || 'gpt-5-mini-2025-08-07'),
      prompt,
      temperature: 0.7,
      maxTokens: 500,
    });

    return text;
  } catch (error) {
    console.error('Error comparing flights:', error);
    throw new Error('Failed to compare flights');
  }
}
