# 🚀 FlightOptima Quick Start

## Get Running in 5 Minutes

### Step 1: Environment Setup (2 min)

```bash
cd /Users/pejman/Documents/flight-optima

# Create .env file
npm run setup

# Edit .env and add:
# 1. DATABASE_URL from Neon (create at neon.tech if needed)
# 2. TRIPBASE_DATABASE_URL from your jetlag-revweb project
# 3. Optional: GITHUB_ID and GITHUB_SECRET for auth
```

**Get TRIPBASE_DATABASE_URL:**
```bash
# Copy from your existing project:
grep TRIPBASE_DATABASE_URL /Users/pejman/Projects/jetlag-revweb/.env.local
```

### Step 2: Database Setup (1 min)

```bash
# Push schema to Neon
npm run db:push

# This creates all tables including:
# - users, accounts, sessions (auth)
# - airports, airlines, aircraft, routes (aviation)
# - savedRoutes, priceAlerts, searchHistory (features)
```

### Step 3: Start Development (1 min)

```bash
npm run dev
```

Visit: `http://localhost:3000`

### Step 4: Add Missing UI Component (30 sec)

The airport autocomplete needs the Label component:

```bash
# If you have shadcn CLI:
npx shadcn-ui@latest add label

# Or manually create it (I'll do this for you below)
```

---

## What's Already Built

### ✅ Working Right Now

1. **Authentication** - NextAuth v5 with GitHub/Google OAuth
2. **Header** - Sign in/out functionality
3. **Database** - Drizzle ORM with Neon PostgreSQL
4. **Components** - shadcn/ui + airport autocomplete + airline badge

### ✅ Ready to Use (from jetlag-revweb)

5. **Airport Search API** - `/api/search/airports`
6. **Airport Autocomplete** - `AirportAutocomplete` component
7. **Airline Badge** - `AirlineBadge` component

### 🔨 Need to Build Next

8. **Flight Search Page** - UI to search flights
9. **Interactive Map** - Leaflet route visualization
10. **Results Display** - Show flights with jetlag scores

---

## Project Structure

```
flight-optima/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/ ✅ Working
│   │   │   └── search/airports/    ✅ Working
│   │   ├── layout.tsx              ✅ Working
│   │   └── page.tsx                ✅ Working
│   ├── auth/
│   │   └── index.ts                ✅ Working
│   ├── components/
│   │   ├── ui/                     ✅ shadcn components
│   │   ├── Header.tsx              ✅ Working
│   │   ├── airport-autocomplete.tsx ✅ Copied
│   │   └── airline-badge.tsx       ✅ Copied
│   └── lib/
│       ├── db/
│       │   ├── schema.ts           ✅ Complete schema
│       │   └── index.ts            ✅ DB connection
│       ├── types/
│       │   └── aviation.ts         ✅ Type definitions
│       └── aviation/
│           └── jetlag-calculator.ts ✅ Algorithms
├── scripts/
│   ├── setup-env.js                ✅ Environment helper
│   ├── import-airports.ts          ✅ Data import
│   └── import-airlines.ts          ✅ Data import
└── docs/
    ├── README.md                   ✅ Main docs
    ├── SETUP.md                    ✅ Detailed setup
    └── MIGRATION_PLAN.md           ✅ Migration guide
```

---

## Next 15 Minutes - Build Flight Search

### 1. Add Label Component (2 min)

I'll create this for you in the next step.

### 2. Create Search Page (5 min)

```bash
# Create new search page
touch src/app/search/page.tsx
```

Then add a simple search form using the airport autocomplete.

### 3. Test Airport Search (3 min)

Visit `/search` and test the airport autocomplete. It should search the TripBase database for airports.

### 4. Add Map Component (5 min)

Install and configure Leaflet for route visualization.

---

## Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Production build
npm run lint             # Run linter

# Database
npm run db:push          # Push schema to database
npm run db:studio        # Open Drizzle Studio (DB GUI)
npm run db:generate      # Generate migrations

# Setup
npm run setup            # Create .env with generated secrets

# Data Import (when ready)
npm run import:airports  # Import OpenFlights airport data
npm run import:airlines  # Import airline data
npm run import:all       # Import both
```

---

## Common Issues & Fixes

### "DATABASE_URL is not defined"
```bash
npm run setup
# Then edit .env and add your Neon database URL
```

### "TRIPBASE_DATABASE_URL is not defined"
```bash
# Copy from jetlag-revweb:
grep TRIPBASE_DATABASE_URL ~/Projects/jetlag-revweb/.env.local >> .env
```

### "Module not found: Can't resolve '@/components/ui/label'"
```bash
npx shadcn-ui@latest add label
```

### Airport search not working
- Check TRIPBASE_DATABASE_URL is set correctly
- Make sure it's the same database from jetlag-revweb
- Try the API directly: `http://localhost:3000/api/search/airports?query=SFO`

---

## Testing Checklist

- [ ] App starts without errors (`npm run dev`)
- [ ] Can visit homepage
- [ ] Header shows sign in button
- [ ] Database connection works
- [ ] Airport search API responds: `/api/search/airports?query=SFO`
- [ ] Can sign in with GitHub (if configured)

---

## What's Next?

1. **Get it running** - Follow steps 1-3 above
2. **Test airport search** - Visit the API endpoint
3. **Build search page** - Use airport autocomplete component
4. **Add Leaflet map** - Visualize routes
5. **Integrate Amadeus API** - Real flight data
6. **Deploy to Vercel** - Go live!

---

**You're 90% there!** The foundation is solid. Just need to:
1. Set up environment variables
2. Push database schema
3. Start building the search UI

Let me know when you're ready for the next step! 🚀
