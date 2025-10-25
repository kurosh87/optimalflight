# ✈️ FLIGHTOPTIMA - OFFLINE DEVELOPMENT MODE

**Status:** ✅ RUNNING LOCALLY ON YOUR MACHINE
**Database:** Local PostgreSQL (flight_optima)
**URL:** http://localhost:3003

---

## 🎉 YOU'RE RUNNING!

FlightOptima is **LIVE on your local machine** with a local PostgreSQL database!

**Access your app:** http://localhost:3003

(Port 3003 because 3000 was in use)

---

## ✅ What's Working NOW (Offline)

- ✅ **Local PostgreSQL database** created: `flight_optima`
- ✅ **All database tables** created via Drizzle schema
- ✅ **Dev server running** on port 3003
- ✅ **Homepage** accessible
- ✅ **Search page** accessible
- ✅ **All pages** loading

### You Can Access:
- http://localhost:3003 - Homepage
- http://localhost:3003/search - Flight search
- http://localhost:3003/routes - Route visualization
- http://localhost:3003/saved - Saved routes

---

## 🔧 Your Local Setup

**Database:**
```
Name: flight_optima
Type: PostgreSQL 14.19
Location: Local machine (localhost:5432)
Connection: postgresql://pejman@localhost:5432/flight_optima
```

**Environment:**
```
.env file created with:
- DATABASE_URL (local PostgreSQL)
- AUTH_SECRET (auto-generated)
```

**Server:**
```
Framework: Next.js 15.5.6
Port: 3003
Status: Running
```

---

## 💻 Development Commands

### Server Control

```bash
# Server is already running in background!
# Access at: http://localhost:3003

# To stop server:
# Find process: ps aux | grep "next dev"
# Kill it: kill [PID]

# Or restart:
npm run dev
```

### Database Commands

```bash
# View database in GUI
npm run db:studio

# Connect to database via psql
psql flight_optima

# View all tables
psql flight_optima -c "\dt"

# Drop and recreate (if needed)
dropdb flight_optima
createdb flight_optima
npm run db:push
```

### Import Data (When Ready)

```bash
# Import airports (OpenFlights - works offline if you download CSV first)
npm run import:airports

# Import airlines
npm run import:airlines
```

---

## 🌐 What Works Offline vs Online

### ✅ Works OFFLINE (No Internet Needed)
- Local dev server
- All pages and UI
- Local database
- Component development
- Schema changes
- Git commits

### ⏳ Needs Internet
- Airport search API (needs TRIPBASE_DATABASE_URL or local data)
- GitHub OAuth sign in
- Real flight search (Amadeus API)
- Mapbox maps
- Deploying to Vercel

---

## 🎯 What You Can Do RIGHT NOW (Offline)

### 1. Browse the App
```
http://localhost:3003           - Homepage
http://localhost:3003/search    - Search page
http://localhost:3003/routes    - Routes
http://localhost:3003/saved     - Saved routes
```

### 2. Develop Features
- Edit any file in `src/`
- Changes auto-reload (hot reload)
- Test components
- Build new pages

### 3. Modify Database
- Edit `src/lib/db/schema.ts`
- Run `npm run db:push`
- Changes applied instantly

### 4. Test Components
- All 55+ components available
- FlightCard, AirportAutocomplete, etc.
- Test with mock data

### 5. Commit Changes
```bash
git add .
git commit -m "Your changes"
# Push when you have internet
```

---

## 📦 Import Sample Data (Offline)

You can create sample data for testing:

```bash
# Create a sample airports script
cat > scripts/add-sample-airports.ts << 'EOF'
import { db } from '../src/lib/db';
import { airports } from '../src/lib/db/schema';

const sampleAirports = [
  {
    id: '1',
    airportName: 'San Francisco International Airport',
    iataCode: 'SFO',
    icaoCode: 'KSFO',
    latitude: 37.6213,
    longitude: -122.3790,
    timezone: 'America/Los_Angeles',
    countryName: 'United States',
    countryIso2: 'US',
    cityId: 'San Francisco',
    isActive: true,
  },
  {
    id: '2',
    airportName: 'John F. Kennedy International Airport',
    iataCode: 'JFK',
    icaoCode: 'KJFK',
    latitude: 40.6413,
    longitude: -73.7781,
    timezone: 'America/New_York',
    countryName: 'United States',
    countryIso2: 'US',
    cityId: 'New York',
    isActive: true,
  },
];

await db.insert(airports).values(sampleAirports);
console.log('Sample airports added!');
EOF

# Run it
npx tsx scripts/add-sample-airports.ts
```

---

## 🔄 When You Get Internet

### 1. Create Neon Database (2 min)
```bash
# Go to https://neon.tech
# Create project "optimalflight"
# Copy connection string
```

### 2. Update .env (1 min)
```bash
# Replace DATABASE_URL with Neon URL
nano .env
```

### 3. Migrate Data (if needed)
```bash
# Export from local
pg_dump flight_optima > backup.sql

# Import to Neon (when you have the URL)
psql [NEON_DATABASE_URL] < backup.sql
```

### 4. Deploy to Vercel
```bash
vercel env add DATABASE_URL production preview development --token 85CRjW6q2BObZRo7YIUYAOzg
vercel --prod --token 85CRjW6q2BObZRo7YIUYAOzg
```

---

## 🎯 Current Development Status

**✅ What's Running:**
- Next.js dev server: http://localhost:3003
- Local PostgreSQL: localhost:5432
- All pages loading
- All components available

**⏳ What Needs Internet:**
- Airport search (needs data)
- GitHub OAuth
- Deployment to Vercel
- Real flight search (Amadeus)

---

## 📋 Offline Development Workflow

```bash
# 1. Make changes
code src/app/search/page.tsx

# 2. Auto-reload in browser
# Visit: http://localhost:3003/search

# 3. Test changes
# Click around, test UI

# 4. Commit when ready
git add .
git commit -m "Your changes"

# 5. Push when you have internet
git push
```

---

## 🎊 SUCCESS - YOU'RE FULLY OPERATIONAL OFFLINE!

**Status:**
- ✅ Local database running
- ✅ Dev server running (port 3003)
- ✅ All pages accessible
- ✅ All components available
- ✅ Schema deployed
- ✅ Ready for development

**You can now:**
- Build features offline
- Test components
- Develop UI
- Commit changes
- Deploy later when you have internet

---

## 📞 Quick Commands

```bash
# View app
open http://localhost:3003

# View database
npm run db:studio

# Stop server (if needed)
# Use Activity Monitor or kill the process

# Restart server
npm run dev
```

---

**YOU'RE UP AND RUNNING!** 🚀

Work on FlightOptima while on the plane, then deploy to Vercel when you land!

---

**Local URL:** http://localhost:3003
**Database:** flight_optima (PostgreSQL)
**Status:** RUNNING ✅
