# Route Database Architecture - FlightConnections Style

## Overview

FlightOptima uses a FlightConnections-inspired relational database optimized for:
- Route visualization on interactive maps
- Bidirectional queries (flights from/to airports)
- Alliance network filtering
- Seasonal route handling
- 12-month forward schedules

---

## Database Schema

### Core Tables

1. **alliances** - Star Alliance, OneWorld, SkyTeam
2. **airports_enhanced** - 10,000+ airports with geographic data
3. **airlines_enhanced** - Airlines with alliance memberships
4. **routes_enhanced** - Route connectivity (core table)
5. **flight_schedules** - Temporal availability
6. **route_aircraft_types** - Aircraft type mappings

See: `src/lib/db/schema-routes.ts` for complete Drizzle schema

---

## Key Features

### 1. Seasonal Routes

Routes can be:
- **Year-round**: `isSeasonal = false`
- **Seasonal**: `isSeasonal = true` with `seasonalStartMonth` and `seasonalEndMonth`

**Examples:**
- Santiago-Bariloche: December-March (ski season)
- Greek Islands: May-September (tourism season)
- Handles year boundary (Dec-March)

**Logic:**
```typescript
import { isRouteActiveInMonth } from '@/lib/routes/route-queries';

const active = isRouteActiveInMonth(route, currentMonth);
```

### 2. Alliance Filtering

Query all routes for specific alliance:

```typescript
import { getRoutesByAlliance } from '@/lib/routes/route-queries';

const starAllianceRoutes = await getRoutesByAlliance('Star Alliance');
const oneworldRoutes = await getRoutesByAlliance('Oneworld');
const skyteamRoutes = await getRoutesByAlliance('SkyTeam');
```

### 3. Bidirectional Queries

**Flights FROM an airport:**
```typescript
import { getRoutesFromAirport } from '@/lib/routes/route-queries';

const routes = await getRoutesFromAirport('JFK');
// Returns: JFK → all destinations
```

**Flights TO an airport:**
```typescript
import { getRoutesToAirport } from '@/lib/routes/route-queries';

const routes = await getRoutesToAirport('JFK');
// Returns: all origins → JFK
```

### 4. Direct Routes Between Airports

```typescript
import { getRoutesBetweenAirports } from '@/lib/routes/route-queries';

const routes = await getRoutesBetweenAirports('SFO', 'LHR');
// Returns: all airlines flying SFO-LHR
```

### 5. Regional Routes

```typescript
import { getRoutesBetweenRegions } from '@/lib/routes/route-queries';

// All routes from North America to Europe
const routes = await getRoutesBetweenRegions(
  ['US', 'CA'], // Origins
  ['GB', 'FR', 'DE'] // Destinations
);
```

---

## Performance Optimizations

### Database Indexes

Critical for sub-second queries on 60K-100K routes:

```sql
-- Composite index for direct route lookups
INDEX idx_origin_dest (origin_airport_id, destination_airport_id)

-- Individual indexes for bidirectional queries
INDEX idx_origin (origin_airport_id)
INDEX idx_destination (destination_airport_id)

-- Alliance filtering
INDEX idx_airline (airline_id)

-- Seasonal filtering
INDEX idx_seasonal (is_seasonal)
```

### Caching Strategy

**Redis TTLs:**
- Airport data: 24 hours (rarely changes)
- Routes: 24 hours (daily updates)
- Schedules: 12 hours (twice daily updates)
- Seasonal status: 1 hour (for current month checks)

### Denormalization

**Airports table includes:**
- `totalDestinationsCount` - Pre-calculated for map marker sizing
- Updated daily via scheduled job

---

## Map Visualization

### Airport Markers

**Size by destination count:**
```typescript
import { getAirportSizeCategory } from '@/lib/routes/route-queries';

const category = getAirportSizeCategory(airport.totalDestinationsCount);
// 'large' (100+ destinations)
// 'medium' (30-99 destinations)
// 'small' (<30 destinations)
```

**Color by size:**
```typescript
import { getAirportMarkerColor } from '@/lib/routes/route-queries';

const color = getAirportMarkerColor('large');
// 'large' → Blue (#0066CC)
// 'medium' → Yellow (#FFB800)
// 'small' → Red (#FF0000)
```

### Route Lines

**Great circle paths:**
```typescript
import { calculateGreatCircleDistance } from '@/lib/routes/route-queries';

const distanceKm = calculateGreatCircleDistance(
  airport1.latitude,
  airport1.longitude,
  airport2.latitude,
  airport2.longitude
);
```

**Color by jetlag score:**
```typescript
import { getJetlagColor } from '@/lib/aviation/jetlag-calculator';

const color = getJetlagColor(jetlagScore);
// 1-3 → Green (#51cf66)
// 4-5 → Yellow (#ffd43b)
// 6-7 → Orange (#ff922b)
// 8-10 → Coral (#ff6b6b)
```

---

## Data Volume

**Current estimates:**
- Airports: ~10,000
- Airlines: ~6,000 (including inactive)
- Routes: ~60,000-100,000 active
- Flight Schedules: ~500,000-1M
- Aircraft Types: ~150,000 mappings

**Storage:**
- PostgreSQL: 2-5 GB
- Indexes: 1-2 GB
- Redis cache: 500 MB - 1 GB

---

## Query Performance Targets

**With proper indexing:**
- Single airport routes: <50ms
- Alliance filtered routes: <100ms
- Regional routes: <200ms
- Seasonal route check: <10ms (with cache)

---

## Update Strategy

**Data freshness:**
- Daily: Automated route updates
- Weekly: Manual curation for high-traffic routes
- Monthly: Full data refresh
- Quarterly: Alliance membership verification

**Sources:**
- OAG Schedules API (primary)
- Airline schedule data
- OpenFlights (open source)
- Manual curation for new routes

---

## API Endpoints to Build

Based on this schema, create these routes:

### 1. Route Search
```
GET /api/routes/from/:iata
GET /api/routes/to/:iata
GET /api/routes/:origin/:destination
```

### 2. Alliance Routes
```
GET /api/routes/alliance/:allianceName
```

### 3. Seasonal Routes
```
GET /api/routes/seasonal
GET /api/routes/seasonal/:month
```

### 4. Regional Routes
```
GET /api/routes/region
  ?originCountries=US,CA
  &destCountries=GB,FR,DE
```

---

## Integration with Existing Schema

Our complete schema includes:

**From jetlag-revweb:**
- `airports` - Basic airport data
- `airlines` - Basic airline data
- `aircraftTypes` - Aircraft with jetlag scores
- `airportIntelligence` - Airport facilities

**From FlightConnections (this file):**
- `airports_enhanced` - Route-optimized airport data
- `airlines_enhanced` - Alliance-aware airlines
- `routes_enhanced` - Full route connectivity
- `alliances` - Alliance memberships
- `flight_schedules` - Temporal schedules

**FlightOptima features:**
- `savedRoutes` - User bookmarks
- `priceAlerts` - Price monitoring
- `searchHistory` - Analytics

**NextAuth:**
- `users`, `accounts`, `sessions` - Authentication

---

## Usage Example

### Build Route Map for Airport

```typescript
import { getRoutesFromAirport } from '@/lib/routes/route-queries';
import { calculateGreatCircleDistance, getAirportMarkerColor } from '@/lib/routes/route-queries';

// Get all routes from SFO
const routes = await getRoutesFromAirport('SFO');

// Draw on map
routes.forEach(({ route, destination, airline, alliance }) => {
  const distance = calculateGreatCircleDistance(
    route.origin.latitude,
    route.origin.longitude,
    destination.latitude,
    destination.longitude
  );

  const markerColor = getAirportMarkerColor(destination.airportSizeCategory);

  // Draw route line
  drawRoute(route.origin, destination, {
    color: alliance ? getAllianceColor(alliance.allianceName) : '#999',
    distance,
    airline: airline.airlineName
  });
});
```

---

## Next Steps

### 1. Merge Schemas
- Integrate `schema-routes.ts` into main `schema.ts`
- Or keep separate and import both

### 2. Seed Data
- Import airports (OpenFlights or OAG)
- Import airlines with alliances
- Import routes (OAG or manual)

### 3. Build APIs
- Create route search endpoints
- Add alliance filtering
- Implement seasonal logic

### 4. Build Map
- Add Leaflet/Mapbox
- Use route queries for data
- Visualize with great circles

---

## Files

**Schema:** `src/lib/db/schema-routes.ts`
**Queries:** `src/lib/routes/route-queries.ts`
**This Doc:** `docs/technical/route-database-architecture.md`

---

**Status:** Schema defined, queries ready, awaiting data import and map integration!
