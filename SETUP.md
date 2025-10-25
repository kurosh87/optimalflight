# FlightOptima Setup Guide

Complete setup instructions for FlightOptima with Neon PostgreSQL, NextAuth v5, and Drizzle ORM.

## Quick Start

```bash
# 1. Clone or navigate to project
cd flight-optima

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your credentials (see below)

# 4. Push database schema to Neon
npm run db:push

# 5. Start development server
npm run dev
```

Visit `http://localhost:3000`

---

## Environment Setup

### 1. Neon PostgreSQL Database

**Get your DATABASE_URL:**

1. Sign up at [neon.tech](https://neon.tech) (free tier available)
2. Create a new project
3. Copy the connection string from the dashboard
4. Add to `.env`:

```env
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require"
```

### 2. NextAuth Configuration

**Generate AUTH_SECRET:**

```bash
openssl rand -base64 32
```

Add to `.env`:

```env
AUTH_SECRET="your_generated_secret_here"
```

**GitHub OAuth (Optional but Recommended):**

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: FlightOptima Local
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and generate Client Secret
5. Add to `.env`:

```env
GITHUB_ID="your_github_client_id"
GITHUB_SECRET="your_github_client_secret"
```

**Google OAuth (Optional):**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Add to `.env`:

```env
GOOGLE_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_SECRET="your_google_client_secret"
```

### 3. Flight APIs (Coming Soon)

```env
# Amadeus Self-Service API (https://developers.amadeus.com)
AMADEUS_API_KEY="your_amadeus_key"
AMADEUS_API_SECRET="your_amadeus_secret"

# Mapbox for maps (https://mapbox.com)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="pk.your_mapbox_token"
```

### 4. Redis Cache (Optional for Development)

```env
# Local Redis
REDIS_URL="redis://localhost:6379"

# Or use Upstash Redis (free tier)
REDIS_URL="redis://default:password@xxx.upstash.io:6379"
```

---

## Database Schema Management

### Push Schema Changes (Development)

```bash
npm run db:push
```

This pushes your Drizzle schema directly to the database without creating migrations. Perfect for rapid development.

### Generate Migrations (Production)

```bash
npm run db:generate
npm run db:migrate
```

Creates migration files and applies them. Use this for production deployments.

### Explore Database

```bash
npm run db:studio
```

Opens Drizzle Studio - a beautiful database GUI at `https://local.drizzle.studio`

---

## Database Schema Overview

### Authentication Tables (NextAuth)

- **users** - User accounts
- **accounts** - OAuth provider accounts (GitHub, Google)
- **sessions** - User sessions
- **verificationTokens** - Email verification tokens

### FlightOptima Core Tables

- **airports** - 7,000+ airports worldwide (IATA/ICAO codes, coordinates, timezone, facilities)
- **airlines** - 900+ airlines (alliances, service ratings, on-time performance)
- **aircraft** - Aircraft types with comfort metrics (cabin pressure, humidity, jetlag scores)
- **routes** - Pre-calculated routes with jetlag scoring
- **searchHistory** - User search analytics
- **savedRoutes** - User's bookmarked routes
- **priceAlerts** - Price monitoring and notifications

---

## Authentication Flow

FlightOptima uses **NextAuth v5** with the **Drizzle adapter**.

### Sign In

Users can sign in with:
- **GitHub** (recommended for development)
- **Google**
- **Email/Password** (can be added later)

### Protected Routes

```typescript
// Server Component
import { auth } from '@/auth';

export default async function ProtectedPage() {
  const session = await auth();

  if (!session) {
    redirect('/');
  }

  return <div>Welcome {session.user.email}</div>;
}
```

### Client Component Auth

```typescript
'use client';
import { useSession } from 'next-auth/react';

export default function ClientComponent() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div>Loading...</div>;
  if (!session) return <div>Not signed in</div>;

  return <div>Signed in as {session.user.email}</div>;
}
```

---

## Project Structure

```
flight-optima/
├── src/
│   ├── app/                          # Next.js 15 App Router
│   │   ├── api/
│   │   │   └── auth/[...nextauth]/   # NextAuth API routes
│   │   ├── layout.tsx                # Root layout with Header
│   │   ├── page.tsx                  # Homepage
│   │   └── globals.css               # Tailwind CSS
│   ├── auth/
│   │   └── index.ts                  # NextAuth configuration
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   └── Header.tsx                # Site header with auth
│   └── lib/
│       ├── db/
│       │   ├── schema.ts             # Drizzle schema (auth + aviation)
│       │   └── index.ts              # Database connection
│       ├── types/
│       │   └── aviation.ts           # TypeScript types
│       ├── aviation/
│       │   └── jetlag-calculator.ts  # Jetlag algorithms
│       └── utils.ts                  # Utility functions
├── drizzle/                          # Generated migrations
├── docs/                             # Documentation
├── drizzle.config.ts                 # Drizzle configuration
├── components.json                   # shadcn/ui configuration
├── .env.example                      # Environment template
└── README.md                         # Main documentation
```

---

## Development Workflow

### 1. Start Development Server

```bash
npm run dev
```

App runs at `http://localhost:3000`

### 2. Make Schema Changes

Edit `src/lib/db/schema.ts`, then:

```bash
npm run db:push
```

### 3. Add New Components

```bash
npx shadcn-ui@latest add [component-name]
```

Examples:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
```

### 4. Type Safety

The project uses **strict TypeScript**. All database types are auto-generated from the Drizzle schema:

```typescript
import type { Airport, Airline, User } from '@/lib/db/schema';
```

---

## Common Tasks

### Add a New Page

```bash
# Create new route
touch src/app/search/page.tsx
```

```typescript
// src/app/search/page.tsx
export default function SearchPage() {
  return <div>Flight Search</div>;
}
```

### Add a Protected Page

```typescript
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function SavedRoutesPage() {
  const session = await auth();

  if (!session) {
    redirect('/');
  }

  // Page content here
}
```

### Query the Database

```typescript
import { db } from '@/lib/db';
import { airports } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Get airport by IATA code
const airport = await db
  .select()
  .from(airports)
  .where(eq(airports.iata, 'SFO'))
  .limit(1);
```

---

## Troubleshooting

### "Database connection failed"

- Check your `DATABASE_URL` is correct
- Ensure Neon project is active (free tier sleeps after inactivity)
- Verify SSL mode is included: `?sslmode=require`

### "AUTH_SECRET is not defined"

Generate one:
```bash
openssl rand -base64 32
```

Add to `.env`

### "GitHub/Google OAuth not working"

- Verify redirect URIs match exactly
- Check client ID and secret are correct
- Ensure you're using the right callback URL: `http://localhost:3000/api/auth/callback/[provider]`

### Database schema out of sync

```bash
# Reset and push fresh schema
npm run db:push
```

---

## Next Steps

1. **Set up flight search API** - Integrate Amadeus or Duffel
2. **Build interactive map** - Add Leaflet/Mapbox for route visualization
3. **Import airport data** - Seed database with OpenFlights data
4. **Add Redis caching** - Reduce API costs by 70-80%
5. **Create search UI** - Flight search form with filters

---

## Resources

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [NextAuth v5 Docs](https://authjs.dev)
- [Neon Docs](https://neon.tech/docs)
- [shadcn/ui Components](https://ui.shadcn.com)

---

**Questions?** Check the main [README.md](./README.md) or open an issue.
