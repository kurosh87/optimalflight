/**
 * Hour-by-hour jet lag recovery recommendations
 * Based on circadian rhythm science and chronobiology
 */

export interface HourlyRecommendation {
  hour: number; // 0-23
  time: string; // "6:00 AM"
  activity: string;
  lightExposure: 'bright' | 'moderate' | 'dim' | 'dark' | 'avoid';
  supplements?: string[];
  mealGuidance?: string;
  sleepGuidance?: string;
  priority: 'critical' | 'important' | 'optional';
  description: string;
}

export interface DayPlan {
  dayNumber: number;
  date: Date;
  phase: string;
  hourlyPlan: HourlyRecommendation[];
  keyGoals: string[];
}

/**
 * Generate hour-by-hour recovery plan for a specific day
 */
export function generateHourlyPlan(
  dayNumber: number,
  date: Date,
  direction: 'east' | 'west',
  timezonesDiff: number,
  destinationTz: string
): DayPlan {
  const hourlyPlan: HourlyRecommendation[] = [];

  // Day 0: Arrival Day
  if (dayNumber === 0) {
    const arrivalHour = date.getHours();

    for (let hour = arrivalHour; hour < 24; hour++) {
      const time = formatHour(hour);

      if (hour >= 6 && hour < 9) {
        // Early morning
        hourlyPlan.push({
          hour,
          time,
          activity: 'Wake up / Arrival activities',
          lightExposure: direction === 'east' ? 'bright' : 'moderate',
          supplements: direction === 'east' ? ['Consider 0.5mg melatonin tonight'] : undefined,
          mealGuidance: 'Light protein-rich breakfast',
          priority: 'critical',
          description:
            direction === 'east'
              ? 'Get bright light exposure to help advance your clock'
              : 'Moderate light, avoid intense bright light yet',
        });
      } else if (hour >= 9 && hour < 12) {
        hourlyPlan.push({
          hour,
          time,
          activity: 'Morning activity',
          lightExposure: 'bright',
          mealGuidance: 'Stay hydrated',
          priority: 'important',
          description: 'Stay active, resist urge to nap',
        });
      } else if (hour >= 12 && hour < 14) {
        hourlyPlan.push({
          hour,
          time,
          activity: 'Lunch time',
          lightExposure: 'bright',
          mealGuidance: 'Balanced lunch with lean protein',
          priority: 'important',
          description: 'Eat according to local meal times',
        });
      } else if (hour >= 14 && hour < 17) {
        hourlyPlan.push({
          hour,
          time,
          activity: 'Afternoon activity',
          lightExposure: direction === 'east' ? 'bright' : 'moderate',
          priority: 'critical',
          description:
            direction === 'east'
              ? 'Critical light exposure period - spend time outdoors'
              : 'Stay active but moderate light exposure',
        });
      } else if (hour >= 17 && hour < 19) {
        hourlyPlan.push({
          hour,
          time,
          activity: 'Early evening',
          lightExposure: 'moderate',
          mealGuidance: 'Light dinner, avoid heavy meals',
          priority: 'important',
          description: 'Start winding down',
        });
      } else if (hour >= 19 && hour < 21) {
        hourlyPlan.push({
          hour,
          time,
          activity: 'Evening wind-down',
          lightExposure: 'dim',
          supplements: direction === 'east' ? ['0.5-3mg melatonin 30min before bed'] : undefined,
          priority: 'critical',
          description: 'Reduce light exposure, prepare for sleep',
        });
      } else if (hour >= 21) {
        hourlyPlan.push({
          hour,
          time,
          activity: 'Sleep preparation',
          lightExposure: 'dark',
          sleepGuidance: 'Aim for 22:00-23:00 bedtime',
          priority: 'critical',
          description: 'Dark environment, cool room (65-68°F)',
        });
      }
    }

    return {
      dayNumber: 0,
      date,
      phase: 'Arrival & Anchoring',
      hourlyPlan,
      keyGoals: [
        'Stay awake until local bedtime (9-10 PM)',
        direction === 'east'
          ? 'Get afternoon light exposure (3-7 PM)'
          : 'Get morning light exposure (7-11 AM)',
        'Eat meals at local times',
        'Stay hydrated',
      ],
    };
  }

  // Day 1+: Adjustment Days
  for (let hour = 0; hour < 24; hour++) {
    const time = formatHour(hour);

    if (hour >= 0 && hour < 6) {
      // Night/Early morning
      hourlyPlan.push({
        hour,
        time,
        activity: 'Sleep',
        lightExposure: 'dark',
        sleepGuidance: 'Continue sleeping in dark, cool environment',
        priority: 'critical',
        description: 'Maintain sleep - avoid light exposure',
      });
    } else if (hour === 6 || hour === 7) {
      // Wake time
      hourlyPlan.push({
        hour,
        time,
        activity: 'Wake up',
        lightExposure: direction === 'east' ? 'bright' : 'moderate',
        supplements: ['Vitamin D if morning light limited'],
        priority: 'critical',
        description:
          direction === 'east'
            ? 'Immediate bright light exposure upon waking'
            : 'Gradual light exposure',
      });
    } else if (hour >= 8 && hour < 9) {
      hourlyPlan.push({
        hour,
        time,
        activity: 'Breakfast',
        lightExposure: 'bright',
        mealGuidance: 'Protein-rich breakfast within 1 hour of waking',
        priority: 'critical',
        description: 'Eating helps anchor circadian rhythm',
      });
    } else if (hour >= 9 && hour < 12) {
      hourlyPlan.push({
        hour,
        time,
        activity: 'Morning productivity',
        lightExposure: 'bright',
        priority: 'important',
        description: 'Peak alertness period - best for important tasks',
      });
    } else if (hour === 12 || hour === 13) {
      hourlyPlan.push({
        hour,
        time,
        activity: 'Lunch',
        lightExposure: 'bright',
        mealGuidance: 'Balanced meal with vegetables and lean protein',
        priority: 'important',
        description: 'Consistent meal timing helps adaptation',
      });
    } else if (hour >= 14 && hour < 15 && dayNumber <= 2) {
      // Strategic nap window (only first few days)
      hourlyPlan.push({
        hour,
        time,
        activity: 'Optional short nap',
        lightExposure: 'dim',
        sleepGuidance: 'Max 20-30 minutes, no later than 3 PM',
        priority: 'optional',
        description: 'Brief nap if needed, but avoid sleeping too long',
      });
    } else if (hour >= 15 && hour < 18) {
      hourlyPlan.push({
        hour,
        time,
        activity: 'Afternoon activity',
        lightExposure: direction === 'west' ? 'bright' : 'moderate',
        priority: 'important',
        description:
          direction === 'west'
            ? 'Critical afternoon light exposure for westward travel'
            : 'Stay active',
      });
    } else if (hour >= 18 && hour < 19) {
      hourlyPlan.push({
        hour,
        time,
        activity: 'Dinner',
        lightExposure: 'moderate',
        mealGuidance: 'Light dinner, avoid heavy/spicy foods',
        priority: 'important',
        description: 'Eat at least 3 hours before bed',
      });
    } else if (hour >= 19 && hour < 21) {
      hourlyPlan.push({
        hour,
        time,
        activity: 'Evening relaxation',
        lightExposure: 'dim',
        supplements: ['Magnesium glycinate (optional for sleep quality)'],
        priority: 'important',
        description: 'Wind down activities, avoid screens if possible',
      });
    } else if (hour >= 21 && hour < 23) {
      hourlyPlan.push({
        hour,
        time,
        activity: 'Sleep preparation',
        lightExposure: 'dark',
        sleepGuidance: 'Prepare for 22:00-23:00 bedtime',
        supplements:
          direction === 'east' && dayNumber <= 3
            ? ['0.5-1mg melatonin 30min before bed']
            : undefined,
        priority: 'critical',
        description: 'Complete darkness, cool room, no screens',
      });
    } else {
      // 23:00
      hourlyPlan.push({
        hour,
        time,
        activity: 'Sleep',
        lightExposure: 'dark',
        sleepGuidance: 'Sleeping - maintain dark environment',
        priority: 'critical',
        description: 'Quality sleep is essential for recovery',
      });
    }
  }

  let phase = 'Adjustment';
  const keyGoals: string[] = [];

  if (dayNumber === 1) {
    phase = 'Initial Adjustment';
    keyGoals.push(
      'Wake at consistent time (7 AM local)',
      direction === 'east'
        ? 'Morning light (6-9 AM)'
        : 'Afternoon light (3-6 PM)',
      'No caffeine after 2 PM',
      'Maintain meal schedule'
    );
  } else if (dayNumber <= 3) {
    phase = 'Early Adaptation';
    keyGoals.push(
      'Strict sleep-wake schedule',
      '30-60min outdoor light',
      'Exercise in morning',
      'Limit blue light before bed'
    );
  } else if (dayNumber <= 6) {
    phase = 'Progressive Adaptation';
    keyGoals.push(
      'Consistent wake time',
      'Increase exercise intensity',
      'Social activities',
      'Good sleep hygiene'
    );
  } else {
    phase = 'Final Adjustment';
    keyGoals.push(
      'Nearly adjusted',
      'Normal routine',
      'Maintain consistency',
      'Focus on sleep quality'
    );
  }

  return {
    dayNumber,
    date,
    phase,
    hourlyPlan,
    keyGoals,
  };
}

/**
 * Generate full multi-day recovery plan with hour-by-hour guidance
 */
export function generateFullRecoveryPlan(
  arrivalTime: Date,
  timezonesDiff: number,
  direction: 'east' | 'west',
  destinationTz: string,
  recoveryDays: number
): DayPlan[] {
  const plans: DayPlan[] = [];

  for (let day = 0; day <= recoveryDays; day++) {
    const date = new Date(arrivalTime.getTime() + day * 24 * 60 * 60 * 1000);
    const dayPlan = generateHourlyPlan(day, date, direction, timezonesDiff, destinationTz);
    plans.push(dayPlan);
  }

  return plans;
}

function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${period}`;
}
