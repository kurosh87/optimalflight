# Data Sourcing Strategy - FlightOptima

## Overview

FlightOptima uses a phased data approach to balance cost and coverage. Start with free resources, scale to commercial providers as revenue justifies.

**Key Insight:** FlightConnections has no exclusive data access. Competitive advantage comes from UX, jetlag optimization, and features—not data monopoly.

---

## Phase 1: MVP Foundation ($0-$300/month)

### Free Sources

**OpenFlights Database (FREE)**
- 10,000+ airports with coordinates ✓
- 5,888 airlines (historical + current) ✓
- 173 aircraft types ✓
- Basic route data ⚠️ (Last updated June 2014)

**License:** Open Database License (ODbL) - Commercial use allowed

**Download:**
```bash
# Already integrated in FlightOptima:
npm run import:airports  # Imports 7K+ airports
npm run import:airlines  # Imports 900+ airlines
npm run import:routes    # Imports OpenFlights routes (historical)
```

**Files:**
- `scripts/import-airports.ts` ✓
- `scripts/import-airlines.ts` ✓
- `scripts/import-openflights-routes.ts` ✓

### Aviation Edge API ($49/month Developer Tier)

**What You Get:**
- Current airline routes ✓
- 6-month forward schedules ✓
- JSON format responses ✓
- Daily updates ✓

**Integration:**
- File: `src/lib/api/aviation-edge.ts` ✓
- Functions: `getAirlineRoutes()`, `getAirportSchedules()`, `syncRoutesFromAviationEdge()`

**Usage:**
```bash
# Set env var:
AVIATION_EDGE_API_KEY="your_key_here"

# Run sync:
npm run update:daily
```

### AviationStack (FREE: 100 calls/month)

**Free Tier:**
- 100 API calls/month
- Real-time flight tracking
- Flight status updates

**Paid Tiers:**
- Basic: $49.99/month (500 requests)
- Professional: $149.99/month (5,000 requests)

**Best Use:** Real-time flight validation

### Manual Curation (10-20 hours/month, $0)

**Focus:** Top 200-500 routes by traffic

**Sources:**
- Airline route maps (official websites)
- Aviation news sites
- Press releases
- FlyerTalk forums

**Automated Monitoring:**
```bash
npm run monitor:routes
```

File: `scripts/monitor-route-changes.ts` ✓

### Phase 1 Capabilities

**✅ Can Build:**
- Basic route visualization
- Current airline data
- Airport geolocation
- Limited schedule coverage
- Real-time flight tracking (100/month)

**❌ Missing:**
- Comprehensive current routes
- Full forward schedules (6-12 months)
- Frequency data (flights/week)
- Aircraft type assignments

**Coverage:** ~70% of FlightConnections functionality
**Cost:** $49/month + 10-20 hours labor

---

## Phase 2: Growth ($500-$1,500/month)

### Aviation Edge Business ($599/month)

**Upgrade Benefits:**
- Comprehensive schedule coverage
- 12-month forward schedules
- Higher API rate limits
- Historical data access

**Unlock:**
- Alliance filtering ✓
- Connection algorithms ✓
- Better schedule coverage ✓

### AviationStack Professional ($150-300/month)

**Benefits:**
- 5,000-10,000 requests/month
- Redundancy to Aviation Edge
- Real-time updates

### Expanded Manual Curation (40 hours/month)

**Coverage:** Top 2,000 routes (vs 500 in Phase 1)

**Automation:**
```bash
npm run update:weekly   # Route validation
npm run update:monthly  # Full audit
```

### Phase 2 Capabilities

**Coverage:** ~85-90% of FlightConnections functionality
**Cost:** $750-900/month + 40 hours labor

---

## Phase 3: Enterprise ($2,000-$10,000/month)

### OAG Flight Info API

**Coverage:**
- 97% worldwide flight coverage ✓
- 12-month forward schedules ✓
- 280,000+ daily schedule changes ✓
- Historical data back to 2004 ✓
- 162,000+ minimum connection times ✓
- Codeshare relationships ✓

**Pricing:**
- Free trial: 14 days, 100 calls
- RapidAPI: $249-449/month (500-1,000 calls)
- Enterprise: $5,000-10,000/month

### Cirium SRS Analyser

**Enterprise Features:**
- 40+ years historical data
- Real-time updates
- Predictive analytics
- Market intelligence

**Pricing:** $3,000-8,000/month (enterprise only)

### Phase 3 Capabilities

**Coverage:** 100% of FlightConnections + competitive advantages
**Cost:** $5,000-10,000/month for data

---

## Critical Data Gaps

### 1. Current Route Schedules (BIGGEST GAP)

**Problem:** OpenFlights last updated June 2014

**Solutions:**
1. Aviation Edge API ($49-599/month) ✓
2. Manual curation ✓
3. Community contributions
4. Airline website monitoring

**Without this:** Platform is useless

### 2. Schedule Frequency

**Problem:** Free sources don't show flights/week or operating days

**Solutions:**
- Aviation Edge schedules
- Manual compilation
- OAG for comprehensive data

### 3. Future Schedules (6-12 months)

**Problem:** Free sources only show current operations

**Solutions:**
- Aviation Edge future schedules
- Airline schedule publications
- OAG/Cirium for 12-month visibility

### 4. Minimum Connection Times

**Problem:** FlightConnections appears to lack this too!

**Solutions:**
- Cirium: 162,000+ MCTs
- Manual research per airport
- Conservative defaults (90-120 min)

### 5. Codeshare Relationships

**Problem:** Distinguishing operating vs marketing carriers

**Solutions:**
- Manual curation from alliance pages
- Aviation Edge codeshare data
- OAG comprehensive intelligence

---

## Automation Schedule

**FlightOptima includes automated update scripts:**

### Daily (2 AM)
```bash
npm run update:daily
```
- Sync Aviation Edge API
- Monitor aviation news
- Update destination counts

### Weekly (Sunday 3 AM)
```bash
npm run update:weekly
```
- Validate top 1,000 routes
- Check seasonal transitions
- Clean up inactive routes

### Monthly (1st, 4 AM)
```bash
npm run update:monthly
```
- Full database validation
- Alliance membership updates
- Data quality checks
- Generate admin report

**Files:**
- `scripts/automate-updates.ts` ✓
- `scripts/monitor-route-changes.ts` ✓

---

## Cost-Benefit Decision Framework

```
MRR < $3,000:     Use Phase 1 (free + $49/month)
MRR $3K-$30K:     Upgrade to Phase 2 ($500-1,500/month)
MRR > $30K:       Consider Phase 3 ($5K-10K/month)
```

### Break-Even Analysis

**Phase 1 → Phase 2 Upgrade ($49 → $599):**
- Additional cost: $550/month
- Need: 11-14 new premium users ($49/year = $4.08/month)
- Worth it if: Adding 20+ users/month

**Phase 2 → Phase 3 Upgrade ($900 → $5,000):**
- Additional cost: $4,100/month
- Need: 84 new premium users
- Worth it if: Targeting enterprise (higher ARPU)

---

## Recommended Starting Stack (Month 1)

### FREE Setup
```bash
# 1. Import OpenFlights foundation
npm run import:all

# This gives you:
# - 7,000+ airports
# - 900+ airlines
# - Historical route baseline
```

### $49/month Setup
```bash
# 2. Sign up for Aviation Edge Developer
# Get API key from: https://aviation-edge.com

# 3. Add to .env
AVIATION_EDGE_API_KEY="your_key_here"

# 4. Sync current routes
npm run update:daily
```

### Manual Curation (10-20 hrs/month)

**Focus on top routes:**
- NYC-London (all variants)
- LAX-Tokyo
- SFO-Hong Kong
- Major US domestic routes
- Popular European routes

**Tools created:**
- `npm run monitor:routes` - Automated news monitoring

---

## Data Quality Metrics

**Track these KPIs:**

```sql
-- Route coverage
SELECT COUNT(*) as total_routes FROM routes_enhanced;
SELECT COUNT(*) as active_routes FROM routes_enhanced WHERE status = 'operational';
SELECT COUNT(*) as historical_routes FROM routes_enhanced WHERE status = 'historical';

-- Data freshness
SELECT
  COUNT(*) as stale_routes,
  AVG(EXTRACT(EPOCH FROM (NOW() - last_updated)) / 86400) as avg_days_old
FROM routes_enhanced
WHERE last_updated < NOW() - INTERVAL '30 days';

-- Coverage by region
SELECT
  o.country_code,
  COUNT(*) as route_count
FROM routes_enhanced r
JOIN airports_enhanced o ON r.origin_airport_id = o.airport_id
GROUP BY o.country_code
ORDER BY route_count DESC
LIMIT 20;
```

---

## Web Scraping Guidelines

### Legal Considerations

**✅ SAFE (9th Circuit 2019):**
- Publicly accessible data (no login)
- Respect robots.txt
- Rate limiting
- Proper attribution

**⚠️ GRAY AREA:**
- Airline route maps (public but may violate TOS)
- Schedule data (public but may violate TOS)

**❌ RISKY:**
- Booking engines
- Password-protected data
- High-volume automated requests
- Bypassing rate limits

### Recommended Approach

**DO:**
- Use official APIs (Aviation Edge, OAG)
- Manual compilation from public sources
- Community contributions
- News monitoring (automated + respectful)

**DON'T:**
- Scrape airline booking systems
- Violate robots.txt
- Make excessive requests
- Bypass authentication

---

## Files Created

**Import Scripts:**
- `scripts/import-airports.ts` ✓
- `scripts/import-airlines.ts` ✓
- `scripts/import-openflights-routes.ts` ✓

**API Integrations:**
- `src/lib/api/aviation-edge.ts` ✓
- `src/lib/api/aviationstack.ts` (coming soon)

**Automation:**
- `scripts/automate-updates.ts` ✓
- `scripts/monitor-route-changes.ts` ✓

**Documentation:**
- `docs/technical/data-sourcing-strategy.md` (this file)

---

## Next Steps

### Immediate (Offline on Plane)
- [x] Import OpenFlights airports
- [x] Import OpenFlights airlines
- [ ] Import OpenFlights routes (historical baseline)

### When You Land
1. Sign up for Aviation Edge Developer ($49/month)
2. Add API key to Vercel
3. Run `npm run update:daily` to sync current routes
4. Set up automated updates (cron jobs)

### Month 2-3
1. Manual curate top 500 routes
2. Set up `npm run monitor:routes` automation
3. Validate data quality weekly

### Month 4-6 (If Growing)
1. Upgrade to Aviation Edge Business ($599/month)
2. Expand to 2,000+ routes
3. Add comprehensive schedules

---

## Cost Summary

| Phase | Monthly Cost | Coverage | Revenue Needed |
|-------|-------------|----------|----------------|
| MVP | $49 | 70% | $0 (bootstrap) |
| Growth | $750-900 | 85-90% | $3,000 MRR |
| Enterprise | $5,000-10,000 | 100% | $30,000 MRR |

**Start with Phase 1, scale as you grow!**

---

**Status:** Data pipeline complete, ready to import OpenFlights and integrate Aviation Edge API!
