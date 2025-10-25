# FlightOptima Migration Plan from jetlag-revweb

## What to Copy from Existing Project

### ✅ Priority 1: Core Components (COPY NOW)

**From `/Users/pejman/Projects/jetlag-revweb/apps/web/`:**

1. **Database Schema**
   - `app/schema/schema.ts` (lines 176-335):
     - `airports` table
     - `airlines` table
     - `aircraftTypes` table (with jetlag scores!)
     - `airplanes` table
     - `cities` table
     - `airportIntelligence` table

2. **Components**
   - `components/flights/airport-autocomplete.tsx` ✓
   - `components/flights/airline-badge.tsx`
   - `components/flights/airport-tier-badge.tsx`
   - `components/ui/*` (all shadcn components)

3. **API Routes**
   - `app/api/geo/airports/search/route.ts` (adapt for our DB)
   - `app/api/search/airports/route.ts` (if exists)

4. **Seed Scripts**
   - `scripts/seed/seed-airline-rankings-db.ts`
   - `scripts/seed/seed-airport-facilities-db.ts`
   - `scripts/populate-airport-intelligence.ts`

### ✅ Priority 2: Flight Search Logic

5. **Flight Search APIs**
   - `app/api/flights/search/route.ts`
   - `app/api/search/flights-optimized/route.ts`
   - `app/api/v1/flights/search-optimized/route.ts`

6. **Jetlag Algorithm**
   - Look for jetlag calculation logic
   - Aircraft jetlag scoring integration

### ✅ Priority 3: UI/UX

7. **Flight Components**
   - Flight cards
   - Search forms
   - Results display

## Execution Plan

### Step 1: Update Our Schema (5 min)
Merge their aviation tables into our `src/lib/db/schema.ts`

### Step 2: Copy Components (10 min)
Copy working components to our `/src/components` folder

### Step 3: Create API Routes (10 min)
Adapt their API routes for our structure

### Step 4: Test Integration (5 min)
Make sure everything compiles and runs

## Database Strategy

**Option A: Use TripBase DB (FASTEST)**
- Copy their TRIPBASE_DATABASE_URL approach
- Use their enhanced airports table
- Ready-made data, zero import needed

**Option B: Import to Our Neon DB**
- Run their seed scripts against our database
- More control, but takes time

**DECISION: Use Option A for speed, migrate to Option B later**

## Next 30 Minutes

1. **[5 min]** Copy aviation schema tables
2. **[5 min]** Copy airport autocomplete component
3. **[5 min]** Create airport search API using their logic
4. **[5 min]** Copy airline badge component
5. **[10 min]** Create basic flight search form

## Commands to Execute

```bash
# Already in: /Users/pejman/Documents/flight-optima

# We'll copy files from:
JETLAG_WEB="/Users/pejman/Projects/jetlag-revweb/apps/web"

# Target locations:
# - src/components/flights/
# - src/app/api/search/
# - src/lib/db/schema.ts (merge)
```

## Environment Variables Needed

```env
# Add to .env:
TRIPBASE_DATABASE_URL="postgresql://..." # From jetlag-revweb
```

---

**STATUS**: Ready to execute. Waiting for go-ahead to start copying.
