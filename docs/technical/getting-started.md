# Getting Started - FlightConnections Competitor

## Project Overview

This is a FlightConnections alternative focused on:
1. Visual route planning and mapping
2. Better UX and performance
3. Fair billing practices
4. Accurate pricing integration

## Next Steps

### 1. Choose Your Tech Stack

**Frontend Options:**
- React + Next.js (recommended for SEO + performance)
- Vue + Nuxt.js
- Svelte/SvelteKit

**Backend Options:**
- Node.js + Express
- Python + FastAPI (recommended for data processing)
- Go (for maximum performance)

**Database:**
- PostgreSQL (recommended for relational route data)
- MongoDB (for flexible schema)

### 2. Set Up Flight Data APIs

**Priority 1: Flight Schedules**
- Sign up for Amadeus Self-Service (free tier: 10,000 requests/month)
  - https://developers.amadeus.com/register
- Alternative: Duffel (easier integration)
  - https://duffel.com

**Priority 2: Airport Data**
- OurAirports (free, open data)
  - https://ourairports.com/data/
- OpenFlights (free database)
  - https://openflights.org/data.html

**Priority 3: Route Visualization**
- Mapbox (free tier: 50,000 loads/month)
  - https://account.mapbox.com/auth/signup/
- Alternative: Leaflet (fully open source)

### 3. Build MVP Features

**Week 1-2: Basic Map**
- Interactive world map with Mapbox/Leaflet
- Click to select departure/arrival airports
- Draw flight path between two points

**Week 3-4: Route Planning**
- Multi-city itinerary builder
- Calculate great circle distances
- Show layover options

**Week 5-6: Flight Data Integration**
- Integrate Amadeus/Duffel API
- Display real flight schedules
- Show available airlines

**Week 7-8: Polish & Deploy**
- Mobile responsive design
- Performance optimization
- Deploy to Vercel/Netlify

### 4. Validate with Users

Before building premium features:
- Share with 50-100 beta testers
- Collect feedback on core route planning
- Measure: Are people using it? What features do they request?

### 5. Add Premium Features

Only after MVP validation:
- Price integration
- Price alerts
- Advanced filters
- Save/share routes

## Key Decisions to Make

1. **Jetlag features: Yes or No?**
   - The research shows it's a differentiator
   - But adds complexity to MVP
   - Suggestion: Add later as premium feature

2. **Direct booking vs. affiliate links?**
   - Direct booking = more complex, payment processing
   - Affiliate links = simpler, lower revenue per user
   - Suggestion: Start with affiliate, add booking later

3. **Free tier limits?**
   - Searches per day?
   - Number of saved routes?
   - Suggestion: Be generous at first, restrict later if needed

4. **Target market first?**
   - Award travel enthusiasts (higher willingness to pay)
   - Business travelers (larger market)
   - Budget travelers (more price sensitive)
   - Suggestion: Award travel enthusiasts for initial traction

## Resources

**Airport/Route Data:**
- OurAirports: https://ourairports.com/data/
- OpenFlights: https://openflights.org/data.html
- Wikipedia Lists: https://en.wikipedia.org/wiki/List_of_airlines

**Flight APIs:**
- Amadeus Docs: https://developers.amadeus.com/
- Duffel Docs: https://duffel.com/docs
- Aviation Edge (backup): https://aviation-edge.com/

**Map Libraries:**
- Mapbox GL JS: https://docs.mapbox.com/mapbox-gl-js/
- Leaflet: https://leafletjs.com/
- D3.js (for custom viz): https://d3js.org/

**Travel APIs Comparison:**
- https://www.altexsoft.com/blog/travel-and-booking-apis-for-online-travel-and-tourism-service-providers/

## Estimated Timeline

**MVP (Months 1-3):**
- Month 1: Map + basic route planning
- Month 2: Flight data integration
- Month 3: Polish + beta testing

**Premium Launch (Months 4-6):**
- Month 4: Pricing integration
- Month 5: User accounts + saved routes
- Month 6: Premium subscription launch

**Growth (Months 7-12):**
- Months 7-8: Mobile apps
- Months 9-10: Advanced features (award search, etc.)
- Months 11-12: B2B features

## Estimated Costs

**Month 1-3 (MVP):**
- APIs: $0 (free tiers)
- Hosting: $0-20 (Vercel/Netlify free tier)
- Domain: $12/year
- **Total: ~$50**

**Month 4-6 (Premium Launch):**
- APIs: $50-200 (as usage grows)
- Hosting: $20-50
- Email service: $15
- Payment processing: $29/month (Stripe)
- **Total: ~$100-300/month**

**Month 7-12 (Growth):**
- APIs: $500-2,000 (based on user growth)
- Hosting: $100-500
- Marketing: $500-2,000
- Tools: $100-200
- **Total: ~$1,200-4,700/month**

## Success Metrics

**MVP Success:**
- 500+ users try the tool
- 50+ users use it 3+ times
- 10+ users provide detailed feedback
- Average session time >3 minutes

**Premium Launch Success:**
- 5,000+ total users
- 5-8% conversion to paid
- 250-400 paying subscribers
- <$50 CAC

**Growth Success:**
- 50,000+ total users
- 2,500-4,000 paying subscribers
- $10-20k MRR
- Positive unit economics
