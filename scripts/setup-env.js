#!/usr/bin/env node

/**
 * Interactive environment setup for FlightOptima
 * Run: node scripts/setup-env.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 FlightOptima Environment Setup\n');

// Generate AUTH_SECRET
const authSecret = crypto.randomBytes(32).toString('base64');

const envContent = `# Database (Neon PostgreSQL)
# Get from: https://neon.tech
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require"

# Auth (NextAuth v5)
AUTH_SECRET="${authSecret}"

# GitHub OAuth (Optional)
# Get from: https://github.com/settings/developers
# Callback URL: http://localhost:3000/api/auth/callback/github
GITHUB_ID=""
GITHUB_SECRET=""

# Google OAuth (Optional)
# Get from: https://console.cloud.google.com
# Callback URL: http://localhost:3000/api/auth/callback/google
GOOGLE_ID=""
GOOGLE_SECRET=""

# Redis Cache (Optional for development)
REDIS_URL="redis://localhost:6379"

# Flight APIs
# Amadeus: https://developers.amadeus.com
AMADEUS_API_KEY=""
AMADEUS_API_SECRET=""

# Mapbox (for maps)
# Get from: https://mapbox.com
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=""

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
`;

const envPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists!');
  console.log('   Delete it first or edit manually.\n');
  process.exit(0);
}

fs.writeFileSync(envPath, envContent);

console.log('✅ Created .env file with AUTH_SECRET');
console.log('🔑 Generated AUTH_SECRET:', authSecret);
console.log('\n📝 Next steps:');
console.log('1. Sign up for Neon: https://neon.tech');
console.log('2. Copy DATABASE_URL to .env');
console.log('3. Run: npm run db:push');
console.log('4. Run: npm run dev\n');
console.log('📖 See SETUP.md for detailed instructions\n');
