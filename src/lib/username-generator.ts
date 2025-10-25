/**
 * Username Generator Utility
 * Generates unique, travel-themed usernames for new users
 */

const adjectives = [
  'global', 'flying', 'roaming', 'wandering', 'jetting', 'soaring',
  'cruising', 'exploring', 'voyaging', 'traveling', 'nomadic', 'adventurous',
  'daring', 'bold', 'brave', 'fearless', 'intrepid', 'swift',
  'rapid', 'speedy', 'quick', 'agile', 'nimble', 'dynamic',
  'cosmic', 'stellar', 'celestial', 'skyward', 'aerial', 'elevated'
];

const nouns = [
  'pilot', 'traveler', 'explorer', 'nomad', 'wanderer', 'voyager',
  'adventurer', 'globetrotter', 'jet', 'falcon', 'eagle', 'hawk',
  'phoenix', 'comet', 'meteor', 'star', 'orbit', 'horizon',
  'compass', 'navigator', 'pathfinder', 'trailblazer', 'pioneer', 'wayfarer',
  'journeyer', 'rover', 'rambler', 'trekker', 'flyer', 'sojourner'
];

/**
 * Generates a random username with format: adjective + noun + number
 * @param includeNumber Whether to include a random number suffix
 * @returns Generated username string
 */
export function generateUsername(includeNumber: boolean = true): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = includeNumber ? Math.floor(Math.random() * 999) + 1 : '';

  return `${adjective}_${noun}${number ? `_${number}` : ''}`;
}

/**
 * Generates multiple unique username options
 * @param count Number of usernames to generate
 * @returns Array of generated usernames
 */
export function generateUsernameOptions(count: number = 5): string[] {
  const usernames = new Set<string>();

  while (usernames.size < count) {
    usernames.add(generateUsername());
  }

  return Array.from(usernames);
}

/**
 * Validates username format and length
 * @param username Username to validate
 * @returns Validation result with errors if any
 */
export function validateUsername(username: string): {
  valid: boolean;
  error?: string
} {
  // Check length (3-30 characters)
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters long' };
  }
  if (username.length > 30) {
    return { valid: false, error: 'Username must be 30 characters or less' };
  }

  // Check format (alphanumeric, underscores, hyphens only)
  const validFormat = /^[a-z0-9_-]+$/i.test(username);
  if (!validFormat) {
    return {
      valid: false,
      error: 'Username can only contain letters, numbers, underscores, and hyphens'
    };
  }

  // Check for reserved words
  const reservedWords = [
    'admin', 'api', 'root', 'system', 'nojetlag', 'jetlag',
    'settings', 'profile', 'account', 'help', 'support'
  ];
  if (reservedWords.includes(username.toLowerCase())) {
    return { valid: false, error: 'This username is reserved' };
  }

  return { valid: true };
}

/**
 * Sanitizes username input
 * @param username Raw username input
 * @returns Sanitized username
 */
export function sanitizeUsername(username: string): string {
  return username
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/[^a-z0-9_-]/g, '') // Remove invalid characters
    .substring(0, 30); // Enforce max length
}

/**
 * Generates username from user's name (if provided by Clerk)
 * @param firstName User's first name
 * @param lastName User's last name
 * @returns Generated username based on name
 */
export function generateUsernameFromName(
  firstName?: string,
  lastName?: string
): string {
  if (!firstName && !lastName) {
    return generateUsername();
  }

  const first = firstName ? sanitizeUsername(firstName) : '';
  const last = lastName ? sanitizeUsername(lastName) : '';
  const number = Math.floor(Math.random() * 999) + 1;

  if (first && last) {
    return `${first}_${last}_${number}`;
  } else if (first) {
    return `${first}_traveler_${number}`;
  } else {
    return `${last}_explorer_${number}`;
  }
}
