import { createOpenAI } from '@ai-sdk/openai';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';

// Configure Vercel AI Gateway with OpenAI
const openai = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY!,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});

// Schema for AI-generated recovery recommendations
const RecoveryRecommendationSchema = z.object({
  summary: z.string().describe('Brief summary of the personalized recovery plan'),
  lightTherapy: z.array(z.object({
    time: z.string().describe('Time in HH:MM format'),
    duration: z.number().describe('Duration in minutes'),
    intensity: z.enum(['low', 'medium', 'high']),
    reasoning: z.string().describe('Why this timing is optimal'),
  })),
  sleepSchedule: z.object({
    bedtime: z.string().describe('Recommended bedtime in HH:MM format'),
    wakeTime: z.string().describe('Recommended wake time in HH:MM format'),
    napTimes: z.array(z.object({
      time: z.string(),
      duration: z.number(),
    })),
    reasoning: z.string(),
  }),
  supplements: z.array(z.object({
    name: z.enum(['melatonin', 'caffeine', 'vitamin-d', 'magnesium']),
    time: z.string().describe('Time in HH:MM format'),
    dosage: z.string(),
    reasoning: z.string(),
  })),
  activities: z.array(z.object({
    time: z.string(),
    activity: z.string().describe('Activity recommendation (exercise, meal, outdoor time)'),
    reasoning: z.string(),
  })),
  keyInsights: z.array(z.string()).describe('Top 3-5 personalized insights'),
});

export type RecoveryRecommendation = z.infer<typeof RecoveryRecommendationSchema>;

interface FlightData {
  originTimezone: string;
  destinationTimezone: string;
  departureTime: Date;
  arrivalTime: Date;
  timezonesDiff: number;
  direction: 'east' | 'west';
}

interface UserProfile {
  sleepQuality?: string;
  adaptabilityLevel?: string;
  ageRange?: string;
  exerciseFrequency?: string;
  caffeineConsumption?: string;
  melatoninUse?: boolean;
  lightTherapyAccess?: boolean;
  bedtime?: string;
  wakeTime?: string;
}

export async function generatePersonalizedRecoveryPlan(
  flight: FlightData,
  userProfile: UserProfile
): Promise<RecoveryRecommendation> {
  const prompt = `Generate a personalized jet lag recovery plan for a traveler with the following details:

FLIGHT INFORMATION:
- Origin Timezone: ${flight.originTimezone}
- Destination Timezone: ${flight.destinationTimezone}
- Departure: ${flight.departureTime.toISOString()}
- Arrival: ${flight.arrivalTime.toISOString()}
- Timezone Difference: ${flight.timezonesDiff} hours
- Travel Direction: ${flight.direction} (${flight.direction === 'east' ? 'harder to adjust' : 'easier to adjust'})

USER PROFILE:
- Sleep Quality: ${userProfile.sleepQuality || 'average'}
- Adaptability: ${userProfile.adaptabilityLevel || 'medium'}
- Age Range: ${userProfile.ageRange || 'not specified'}
- Exercise Frequency: ${userProfile.exerciseFrequency || 'moderate'}
- Caffeine Use: ${userProfile.caffeineConsumption || 'moderate'}
- Melatonin Use: ${userProfile.melatoninUse ? 'yes' : 'no'}
- Light Therapy Access: ${userProfile.lightTherapyAccess ? 'yes' : 'no'}
- Typical Bedtime: ${userProfile.bedtime || '22:00'}
- Typical Wake Time: ${userProfile.wakeTime || '07:00'}

Create a science-based recovery plan that considers:
1. Circadian rhythm adjustment based on travel direction
2. Strategic light exposure timing
3. Sleep schedule optimization
4. Supplement timing (if user is open to it)
5. Activity recommendations

Focus on practical, actionable advice tailored to this specific user and flight.`;

  try {
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: RecoveryRecommendationSchema,
      prompt,
    });

    return object;
  } catch (error) {
    console.error('Error generating AI recovery plan:', error);
    throw error;
  }
}

export async function extractFlightDetailsFromImage(imageUrl: string) {
  const prompt = `Analyze this boarding pass or flight screenshot and extract the following information:
- Flight number
- Airline
- Departure airport code and city
- Arrival airport code and city
- Departure date and time
- Arrival date and time

Return the information in a structured format. If any information is not clearly visible, indicate it as "not found".`;

  try {
    const { text } = await generateText({
      model: openai('gpt-4o'),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image', image: imageUrl },
          ],
        },
      ],
    });

    return text;
  } catch (error) {
    console.error('Error extracting flight details:', error);
    throw error;
  }
}

export async function generateTravelInsights(
  flightHistory: FlightData[],
  userProfile: UserProfile
): Promise<string[]> {
  const prompt = `Based on the following travel history and user profile, generate 3-5 personalized insights about their jet lag patterns and recovery:

TRAVEL HISTORY:
${flightHistory.map((f, i) => `
Flight ${i + 1}:
- Route: ${f.originTimezone} → ${f.destinationTimezone}
- Timezone Difference: ${f.timezonesDiff} hours
- Direction: ${f.direction}
`).join('\n')}

USER PROFILE:
- Sleep Quality: ${userProfile.sleepQuality || 'average'}
- Adaptability: ${userProfile.adaptabilityLevel || 'medium'}
- Exercise: ${userProfile.exerciseFrequency || 'moderate'}

Generate actionable insights that help the user understand their jet lag patterns and how to improve recovery.`;

  try {
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt,
    });

    // Split insights into array (assuming AI returns numbered or bulleted list)
    const insights = text
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^[\d\-\*\•]+\.?\s*/, '').trim())
      .filter(line => line.length > 20);

    return insights.slice(0, 5);
  } catch (error) {
    console.error('Error generating travel insights:', error);
    return [];
  }
}
