/**
 * Achievement System - Gamification for travel milestones
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "flights" | "distance" | "countries" | "streaks" | "special";
  tiers: {
    bronze: number;
    silver: number;
    gold: number;
    platinum?: number;
  };
  unit?: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Flight Count Achievements
  {
    id: "frequent_flyer",
    name: "Frequent Flyer",
    description: "Log multiple flights",
    icon: "✈️",
    category: "flights",
    tiers: {
      bronze: 10,
      silver: 50,
      gold: 100,
      platinum: 500,
    },
    unit: "flights",
  },
  {
    id: "globe_trotter",
    name: "Globe Trotter",
    description: "Visit different countries",
    icon: "🌍",
    category: "countries",
    tiers: {
      bronze: 5,
      silver: 15,
      gold: 30,
      platinum: 50,
    },
    unit: "countries",
  },
  {
    id: "city_explorer",
    name: "City Explorer",
    description: "Explore different cities",
    icon: "🏙️",
    category: "countries",
    tiers: {
      bronze: 10,
      silver: 25,
      gold: 50,
      platinum: 100,
    },
    unit: "cities",
  },
  {
    id: "distance_master",
    name: "Distance Master",
    description: "Accumulate flight kilometers",
    icon: "🚀",
    category: "distance",
    tiers: {
      bronze: 10000, // 10k km
      silver: 50000, // 50k km
      gold: 100000, // 100k km
      platinum: 500000, // 500k km
    },
    unit: "km",
  },
  {
    id: "time_traveler",
    name: "Time Traveler",
    description: "Spend hours in the air",
    icon: "⏰",
    category: "distance",
    tiers: {
      bronze: 50, // 50 hours
      silver: 200, // 200 hours
      gold: 500, // 500 hours
      platinum: 1000, // 1000 hours
    },
    unit: "hours",
  },
  {
    id: "streak_warrior",
    name: "Streak Warrior",
    description: "Build consecutive travel days",
    icon: "🔥",
    category: "streaks",
    tiers: {
      bronze: 3,
      silver: 7,
      gold: 14,
      platinum: 30,
    },
    unit: "days",
  },
  {
    id: "airport_collector",
    name: "Airport Collector",
    description: "Visit different airports",
    icon: "🛫",
    category: "flights",
    tiers: {
      bronze: 10,
      silver: 25,
      gold: 50,
      platinum: 100,
    },
    unit: "airports",
  },
  {
    id: "airline_loyalist",
    name: "Airline Loyalist",
    description: "Fly with the same airline",
    icon: "🎖️",
    category: "special",
    tiers: {
      bronze: 5,
      silver: 15,
      gold: 30,
      platinum: 50,
    },
    unit: "flights",
  },
  {
    id: "long_hauler",
    name: "Long Hauler",
    description: "Complete ultra-long flights",
    icon: "🌏",
    category: "special",
    tiers: {
      bronze: 5000, // 5000+ km
      silver: 8000, // 8000+ km
      gold: 12000, // 12000+ km
      platinum: 15000, // 15000+ km
    },
    unit: "km",
  },
  {
    id: "continent_hopper",
    name: "Continent Hopper",
    description: "Visit different continents",
    icon: "🗺️",
    category: "countries",
    tiers: {
      bronze: 2,
      silver: 3,
      gold: 5,
      platinum: 7,
    },
    unit: "continents",
  },
];

export type AchievementTier = "bronze" | "silver" | "gold" | "platinum" | "locked";

export interface UnlockedAchievement {
  achievement: Achievement;
  tier: AchievementTier;
  currentValue: number;
  nextTierValue?: number;
  progress: number; // 0-100 percentage to next tier
}

/**
 * Calculate which achievements have been unlocked based on user stats
 */
export function calculateAchievements(stats: {
  totalFlights: number;
  totalDistanceKm: number;
  totalFlightHours: number;
  countriesVisited: number;
  citiesVisited: number;
  airportsVisited: number;
  longestStreak: number;
  topAirlines: Array<{ name: string; count: number }>;
  longestFlight?: { distanceKm: number };
  topCountries: Array<{ name: string; count: number }>;
}): UnlockedAchievement[] {
  const unlocked: UnlockedAchievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    let currentValue = 0;
    let tier: AchievementTier = "locked";
    let nextTierValue: number | undefined;
    let progress = 0;

    // Determine current value based on achievement type
    switch (achievement.id) {
      case "frequent_flyer":
        currentValue = stats.totalFlights;
        break;
      case "globe_trotter":
        currentValue = stats.countriesVisited;
        break;
      case "city_explorer":
        currentValue = stats.citiesVisited;
        break;
      case "distance_master":
        currentValue = stats.totalDistanceKm;
        break;
      case "time_traveler":
        currentValue = stats.totalFlightHours;
        break;
      case "streak_warrior":
        currentValue = stats.longestStreak;
        break;
      case "airport_collector":
        currentValue = stats.airportsVisited;
        break;
      case "airline_loyalist":
        currentValue = stats.topAirlines[0]?.count || 0;
        break;
      case "long_hauler":
        currentValue = stats.longestFlight?.distanceKm || 0;
        break;
      case "continent_hopper":
        // Estimate continents from top countries (simplified)
        const continents = new Set<string>();
        const continentMap: Record<string, string> = {
          "United States": "North America",
          "Canada": "North America",
          "Mexico": "North America",
          "United Kingdom": "Europe",
          "France": "Europe",
          "Germany": "Europe",
          "Spain": "Europe",
          "Italy": "Europe",
          "Japan": "Asia",
          "China": "Asia",
          "India": "Asia",
          "Australia": "Oceania",
          "Brazil": "South America",
          "Argentina": "South America",
          "South Africa": "Africa",
          "Egypt": "Africa",
        };
        stats.topCountries.forEach((country) => {
          const continent = continentMap[country.name];
          if (continent) continents.add(continent);
        });
        currentValue = continents.size;
        break;
    }

    // Determine tier and next tier
    const tiers = achievement.tiers;
    if (currentValue >= (tiers.platinum || Infinity)) {
      tier = "platinum";
      nextTierValue = undefined;
      progress = 100;
    } else if (currentValue >= tiers.gold) {
      tier = "gold";
      nextTierValue = tiers.platinum;
      progress = tiers.platinum
        ? ((currentValue - tiers.gold) / (tiers.platinum - tiers.gold)) * 100
        : 100;
    } else if (currentValue >= tiers.silver) {
      tier = "silver";
      nextTierValue = tiers.gold;
      progress = ((currentValue - tiers.silver) / (tiers.gold - tiers.silver)) * 100;
    } else if (currentValue >= tiers.bronze) {
      tier = "bronze";
      nextTierValue = tiers.silver;
      progress = ((currentValue - tiers.bronze) / (tiers.silver - tiers.bronze)) * 100;
    } else {
      tier = "locked";
      nextTierValue = tiers.bronze;
      progress = (currentValue / tiers.bronze) * 100;
    }

    unlocked.push({
      achievement,
      tier,
      currentValue,
      nextTierValue,
      progress: Math.min(Math.max(progress, 0), 100),
    });
  }

  // Sort by tier (unlocked first, then by progress)
  return unlocked.sort((a, b) => {
    const tierOrder = { platinum: 4, gold: 3, silver: 2, bronze: 1, locked: 0 };
    const aTier = tierOrder[a.tier];
    const bTier = tierOrder[b.tier];
    if (aTier !== bTier) return bTier - aTier;
    return b.progress - a.progress;
  });
}

/**
 * Get tier color for UI display
 */
export function getTierColor(tier: AchievementTier): string {
  switch (tier) {
    case "platinum":
      return "from-cyan-500 to-blue-500";
    case "gold":
      return "from-yellow-500 to-amber-500";
    case "silver":
      return "from-gray-400 to-gray-500";
    case "bronze":
      return "from-orange-600 to-amber-700";
    default:
      return "from-gray-300 to-gray-400";
  }
}

/**
 * Get tier badge color
 */
export function getTierBadgeColor(tier: AchievementTier): string {
  switch (tier) {
    case "platinum":
      return "bg-cyan-500";
    case "gold":
      return "bg-yellow-500";
    case "silver":
      return "bg-gray-400";
    case "bronze":
      return "bg-orange-600";
    default:
      return "bg-gray-300";
  }
}
