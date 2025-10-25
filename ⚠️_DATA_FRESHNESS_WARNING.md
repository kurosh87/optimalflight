# ⚠️ DATA FRESHNESS WARNING

## 🚨 CRITICAL: OpenFlights Route Data is OUTDATED

**OpenFlights Routes:** Last updated **June 2014** (10+ years old!)

**DO NOT USE for production** without supplementing with current data sources.

---

## ✅ What's Still Valid from OpenFlights

**GOOD (Still Accurate):**
- ✅ **Airports** - Airport locations don't change much
  - 10,000+ airports with coordinates
  - IATA/ICAO codes
  - Geographic data
  - **USE THIS:** `npm run import:airports`

- ✅ **Airlines** - Airline names/codes relatively stable
  - 5,888 airlines (filter for active ones)
  - IATA/ICAO codes
  - Country data
  - **USE THIS:** `npm run import:airlines`

**BAD (Severely Outdated):**
- ❌ **Routes** - 2014 data (many routes ended, many new routes started)
  - ❌ Missing 10 years of new routes
  - ❌ Includes defunct airlines (e.g., Air Berlin, WOW air)
  - ❌ Missing COVID-19 route changes
  - ❌ Missing post-pandemic routes
  - **DON'T USE for production**

---

## 🎯 How to Get CURRENT Route Data

### Option 1: Aviation Edge API ($49/month) ✅ RECOMMENDED

**Status:** ✅ Already integrated in FlightOptima!

**What You Get:**
- Current airline routes (updated daily)
- 6-month forward schedules
- Aircraft types
- Codeshare data

**How to Use:**
```bash
# 1. Sign up at https://aviation-edge.com
# Developer tier: $49/month

# 2. Add to .env
AVIATION_EDGE_API_KEY="your_key_here"

# 3. Sync current routes
npm run update:daily

# This pulls CURRENT routes from Aviation Edge!
```

**File:** `src/lib/api/aviation-edge.ts` ✅ Already built

---

### Option 2: Manual Curation (FREE but Labor-Intensive)

**Manually add top routes from airline websites:**

```bash
# Example: United Airlines route map
# Visit: https://www.united.com/en/us/fly/travel/where-we-fly.html
# Extract routes manually

# Add to database via SQL or admin panel
```

**Time Required:** 10-20 hours/month for top 200-500 routes

**Best For:** MVP with limited budget

---

### Option 3: TripBase Database (Already Have This!)

**You already have current airport data in jetlag-revweb!**

**Use TRIPBASE_DATABASE_URL for:**
- Current airport data ✓
- Airport intelligence ✓
- Already configured in FlightOptima ✓

```env
# Already in .env.example:
TRIPBASE_DATABASE_URL="postgresql://..."
```

This gives you airport search that works TODAY!

---

### Option 4: Kiwi.com API (For Real-Time Flight Search)

**Your jetlag-revweb already uses Kiwi!**

Check if you have:
```env
KIWI_API_KEY="..."
```

Kiwi gives you:
- Real-time flight availability ✓
- Current pricing ✓
- Multi-city routes ✓
- Actual bookable flights ✓

---

### Option 5: Amadeus API (FREE Tier Available)

**Status:** ✅ Already integrated in FlightOptima!

**Free Tier:**
- 10,000 requests/month FREE
- Real-time flight search
- Current routes

**How to Use:**
```bash
# 1. Sign up at https://developers.amadeus.com
# Self-service tier: FREE (10K requests/month)

# 2. Add to .env
AMADEUS_API_KEY="your_key"
AMADEUS_API_SECRET="your_secret"

# 3. FlightOptima already has integration:
# File: src/lib/amadeus.ts ✅
```

---

## 🎯 RECOMMENDED IMMEDIATE STRATEGY

### For MVP (This Week):

**DON'T import OpenFlights routes** (too old)

**DO THIS instead:**

**1. Use TRIPBASE for airports (✅ Current data):**
```env
TRIPBASE_DATABASE_URL="postgresql://..."  # From jetlag-revweb
```

**2. Use Amadeus for flight search (✅ FREE tier):**
```env
AMADEUS_API_KEY="..."
AMADEUS_API_SECRET="..."
```

**3. Optional: Aviation Edge for route discovery ($49/month):**
```env
AVIATION_EDGE_API_KEY="..."
```

This gives you **CURRENT data** without using outdated 2014 routes!

---

## ⚡ Quick Fix for FlightOptima

### Update Import Scripts (Don't Import Old Routes)

**Modify `package.json`:**
```json
"import:all": "npm run import:airports && npm run import:airlines"
// Remove: && npm run import:routes
```

**Or better yet, use TRIPBASE:**
```env
# Just use your existing jetlag-revweb database:
TRIPBASE_DATABASE_URL="postgresql://neondb_owner:npg_xxx@ep-xxx.neon.tech/neondb?sslmode=require"
```

**This has:**
- ✅ Current airports
- ✅ Airport intelligence
- ✅ Already populated
- ✅ Already working in jetlag-revweb

---

## 📋 Data Freshness Checklist

### ✅ Use These (Current):
- [x] TripBase database (from jetlag-revweb)
- [x] Amadeus API (real-time flights)
- [x] Aviation Edge API (current routes)
- [x] Kiwi API (if you have key)
- [x] Manual curation (airline websites)

### ❌ Don't Use These (Outdated):
- [ ] OpenFlights routes (2014 - skip this!)
- [ ] Any static route CSV from 2014

### ⚠️ Use With Caution:
- [x] OpenFlights airports (mostly still valid)
- [x] OpenFlights airlines (filter for active only)

---

## 🎯 Action Plan

### RIGHT NOW (Offline on Plane):
```bash
# Skip the old route import
# Don't run: npm run import:routes
```

### WHEN YOU LAND:

**Option A: Quick Start with Amadeus (FREE)**
```bash
# 1. Sign up: https://developers.amadeus.com
# 2. Get API key (FREE tier: 10K requests/month)
# 3. Add to .env:
AMADEUS_API_KEY="..."
AMADEUS_API_SECRET="..."

# 4. FlightOptima will use Amadeus for real-time flight search
# File already exists: src/lib/amadeus.ts ✅
```

**Option B: Add Aviation Edge ($49/month)**
```bash
# 1. Sign up: https://aviation-edge.com
# 2. Get Developer tier API key
# 3. Add to .env:
AVIATION_EDGE_API_KEY="..."

# 4. Sync current routes:
npm run update:daily
```

**Option C: Use TripBase (Already Have!)**
```bash
# Just add to .env:
TRIPBASE_DATABASE_URL="..."  # From jetlag-revweb

# This gives current airport data immediately!
```

---

## 💡 Recommended Strategy

**Best Approach for FlightOptima:**

1. **For Airports:** Use TRIPBASE_DATABASE_URL (you already have this!)
2. **For Flight Search:** Use Amadeus API (FREE tier)
3. **For Route Discovery:** Use Aviation Edge ($49/month)

This gives you:
- ✅ Current airport data (TRIPBASE)
- ✅ Real-time flights (Amadeus FREE)
- ✅ Route networks (Aviation Edge $49)

**Total Cost:** $49/month (vs $0 but with 2014 data)

**Data Quality:** CURRENT vs 10 years old!

---

## 🚨 UPDATED RECOMMENDATION

**DON'T run:**
```bash
npm run import:routes  # Skip this - 2014 data!
```

**DO run:**
```bash
npm run import:airports  # Current airport locations
npm run import:airlines  # Airline names (filter for active)
```

**THEN use:**
- Amadeus API for real-time flights (FREE)
- TRIPBASE for airport data (you already have)
- Aviation Edge for route discovery ($49/month)

---

## 🎯 Bottom Line

**OpenFlights routes are from 2014 - TOO OLD!**

**FlightOptima is ready for CURRENT data via:**
- ✅ Amadeus (FREE - already integrated)
- ✅ Aviation Edge ($49/month - already integrated)
- ✅ TripBase (you already have!)

**Just add API keys when you land and you'll have CURRENT data!**

---

**Don't worry - FlightOptima is built to use current data sources. We just documented OpenFlights for completeness, but you'll use Amadeus/Aviation Edge/TripBase for production!** ✅
