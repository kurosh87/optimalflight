# FlightOptima

> Smart flight search and route visualization platform with jetlag optimization

## Overview

FlightOptima combines the best of FlightConnections-style route visualization with scientifically-backed jetlag optimization. This is a complementary app to an existing jetlag recovery platform, focusing on helping users **find and book optimal flights** rather than post-arrival recovery protocols.

**Core Value Proposition**: Show users not just WHERE they can fly, but WHERE they SHOULD fly based on health optimization, pricing, and routing efficiency.

## Project Status

🚧 **In Active Development** - Foundation complete, building core features

### ✅ Completed
- ✓ Next.js 15 + TypeScript + Tailwind CSS setup
- ✓ Drizzle ORM database schema (Airports, Airlines, Aircraft, Routes)
- ✓ Aviation knowledge graph type definitions
- ✓ Jetlag scoring algorithm (for future integration)
- ✓ Project structure and configuration

### 🔨 Next Steps
- Flight search API integration (Amadeus/Duffel)
- Interactive map with Leaflet/Mapbox
- Redis caching layer
- Airport/airline seed data import

### 📋 Planned
- Route visualization with great circle paths
- Multi-city trip optimization
- User authentication and saved routes
- Price alerts system
- Premium subscription features

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS with custom jetlag color scheme
- **Database**: PostgreSQL with Drizzle ORM
- **Caching**: Redis (ioredis)
- **Maps**: Leaflet → Mapbox GL JS (production)
- **State Management**: React Query (@tanstack/react-query)
- **Forms**: React Hook Form + Zod validation
- **Deployment**: Vercel

## Getting Started

### Prerequisites

```bash
# Required
Node.js 20+
PostgreSQL 15+

# Recommended
Neon PostgreSQL account (free tier)
Upstash Redis account (free tier)
```

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Generate database schema
npm run db:generate

# Push schema to database
npm run db:push

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the app.

### Environment Variables

Key variables (see `.env.example` for full list):

```env
DATABASE_URL="postgresql://..."           # PostgreSQL connection
REDIS_URL="redis://..."                   # Redis cache
AMADEUS_API_KEY="..."                     # Flight data API
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="..."     # Maps
```

## Project Structure

```
flight-optima/
├── src/
│   ├── app/                      # Next.js 15 App Router
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Homepage
│   │   └── globals.css           # Global styles + Tailwind
│   ├── components/               # React components (coming soon)
│   ├── lib/
│   │   ├── db/                   # Database layer
│   │   │   ├── schema.ts         # Drizzle schema (Airports, Airlines, Routes, etc.)
│   │   │   └── index.ts          # DB connection and exports
│   │   ├── types/                # TypeScript type definitions
│   │   │   └── aviation.ts       # Aviation data types (Airport, Flight, Route, etc.)
│   │   ├── aviation/             # Aviation-specific logic
│   │   │   └── jetlag-calculator.ts  # Jetlag algorithms
│   │   ├── api/                  # API integrations (coming soon)
│   │   └── utils/                # Utility functions
├── docs/                         # Documentation
│   ├── business/                 # Market analysis, competitive research
│   │   └── market-analysis.md    # Comprehensive market research
│   └── technical/                # Technical specifications
│       └── getting-started.md    # Implementation guide
├── drizzle/                      # Database migrations (auto-generated)
├── drizzle.config.ts             # Drizzle ORM configuration
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind + jetlag color scheme
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies and scripts
└── .env.example                  # Environment variables template
```

## Core Features Roadmap

### Phase 1: MVP (Months 1-4)

**Route Visualization**
- [ ] Interactive world map with airport markers
- [ ] Great circle route paths between airports
- [ ] Color-coded by jetlag score
- [ ] Alliance network overlays
- [ ] Click airports to see all connections

**Flight Search**
- [ ] Multi-city itinerary builder
- [ ] Real-time pricing from Amadeus/Duffel
- [ ] Standard filters (price, stops, airlines, times)
- [ ] Jetlag scoring for every route option

**Jetlag Integration**
- [ ] 1-10 jetlag impact score for each flight
- [ ] Arrival time optimality rating
- [ ] Recovery time estimates
- [ ] Direction-specific recommendations

### Phase 2: Premium Features (Months 5-8)

- [ ] Personalized circadian profiling
- [ ] Multi-city trip optimization (minimize cumulative jetlag)
- [ ] Price drop alerts
- [ ] Saved routes and favorites
- [ ] User accounts and authentication
- [ ] Premium subscription ($39-49/year)

### Phase 3: Advanced Features (Months 9-12)

- [ ] Wearables integration (Oura, Whoop, Apple Health)
- [ ] Historical learning from past trips
- [ ] Award travel optimization tools
- [ ] Native mobile apps (iOS/Android)
- [ ] Corporate/enterprise features
- [ ] API for third-party developers

## Database Schema

### Core Tables (Implemented)

**airports** - 7,000+ airports worldwide
- IATA/ICAO codes, geolocation, timezone
- Jetlag facilities (sleep pods, quiet zones, showers, spas)
- Connectivity metrics

**airlines** - 900+ airlines
- Alliance memberships (Star Alliance, OneWorld, SkyTeam)
- Service ratings and on-time performance

**aircraft** - Aircraft types with comfort metrics
- Cabin pressure, humidity, seat pitch by class
- Jetlag comfort scores

**routes** - Pre-calculated route data
- Distance, duration, frequency
- Time zones crossed, direction, jetlag scores

**searchHistory** - User search analytics

**savedRoutes** - User bookmarks

**priceAlerts** - Price monitoring

## API Integrations (Planned)

### Flight Data

**Primary**: [Amadeus Self-Service API](https://developers.amadeus.com/)
- 400+ airlines, free tier: 10K requests/month
- Real-time pricing and availability
- GDS coverage

**Alternative**: [Duffel API](https://duffel.com/)
- Modern NDC connections (20+ airlines)
- Pay-as-you-go pricing
- Easier integration

**Schedule Data**: [OAG](https://www.oag.com/)
- Accurate flight schedules
- 12-month forward visibility
- 900+ airlines

### Maps

**MVP**: [Leaflet](https://leafletjs.com/) (open source)
**Production**: [Mapbox GL JS](https://www.mapbox.com/) (vector tiles, 3D routes, deck.gl for 100K+ routes)

### Caching Strategy

Redis for three-tier caching:
- **L1**: Airport/airline reference (cache indefinitely)
- **L2**: Routes (24-hour TTL)
- **L3**: Prices/availability (5-15 min TTL)

**Target**: 95% cache hit rate → 70-80% reduction in API costs

## Development Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint

# Database (Drizzle ORM)
npm run db:generate      # Generate migrations from schema
npm run db:push          # Push schema to database (dev)
npm run db:studio        # Open Drizzle Studio (database GUI)
npm run db:migrate       # Run migrations (production)
```

## Key Differentiators

### vs. FlightConnections
- ✅ Jetlag optimization (they don't have this)
- ✅ Transparent billing (no surprise renewals)
- ✅ Responsive customer service
- ✅ Mobile-optimized performance
- ✅ Monthly subscription option

### vs. Google Flights / Skyscanner
- ✅ Visual route planning (they show lists only)
- ✅ Alliance network visualization
- ✅ Jetlag impact scoring
- ✅ Complex multi-city optimization
- ✅ Health-first flight selection

### vs. Jetlag Apps (Timeshifter, StopJetlag)
- ✅ Integrated into flight search (not post-booking)
- ✅ Compare flights by jetlag impact
- ✅ Route optimization before booking
- ✅ Combined with pricing/routing data

## Business Model

### Revenue Streams

**Primary (60-70%)**: Premium Subscriptions
- Individual: $49/year or $9.99/month
- Business: $49/user + $299 org fee
- Enterprise: Custom pricing

**Secondary (20-30%)**: Affiliate Commissions
- Flight bookings: 2-3%
- Hotels: 15-30%
- Travel insurance: 5-10%

**Tertiary (5-10%)**: API Licensing
- Developers: $99/month
- Businesses: $499/month
- Enterprise: Custom

### Target Metrics
- Free-to-paid conversion: 5-8%
- ARPU: $40-60/year
- CAC: <$50 (B2C), <$500 (B2B)

## Market Opportunity

- **FlightConnections**: 3.5M monthly users (validated demand)
- **Business Travel**: $258B market, 8% annual growth
- **Flight Search**: $14.32B by 2032
- **Jetlag Apps**: $24.99-$78 per user (proven willingness to pay)

**Gap**: Zero flight search engines integrate jetlag optimization

See [docs/business/market-analysis.md](docs/business/market-analysis.md) for full competitive analysis.

## Documentation

- [Market Analysis](docs/business/market-analysis.md) - Comprehensive competitive research
- [Getting Started Guide](docs/technical/getting-started.md) - Step-by-step implementation
- API Documentation - Coming soon
- Design System - Coming soon

## Contributing

Contribution guidelines coming soon.

## License

TBD

---

**Built with ❤️ using Next.js 15, TypeScript, and Drizzle ORM**

**Version**: 0.1.0-alpha
**Last Updated**: 2025-10-24
**Status**: Active development - foundation complete
