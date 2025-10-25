/**
 * Route-Specific Page (Bidirectional Programmatic SEO)
 * Pattern: /flights-from-{origin-code}-to-{destination-code}
 *
 * Examples:
 * - /flights-from-jfk-to-lhr (New York to London)
 * - /flights-from-lhr-to-jfk (London to New York) - SEPARATE PAGE
 * - /flights-from-sfo-to-nrt (San Francisco to Tokyo)
 *
 * This generates 150,000+ SEO-optimized pages (bidirectional)
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { generateRouteMetadata, generateRouteStructuredData, generateRouteFAQStructuredData } from '@/lib/seo/metadata-generator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plane, ArrowRight, Clock, Gauge } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

async function getRouteData(originIata: string, destinationIata: string) {
  // TODO: Query database for route details
  // For now, return mock data
  return {
    origin: {
      iataCode: originIata.toUpperCase(),
      cityName: 'Origin City',
      airportName: 'Origin Airport',
    },
    destination: {
      iataCode: destinationIata.toUpperCase(),
      cityName: 'Destination City',
      airportName: 'Destination Airport',
    },
    flightCount: 30,
    distance: { miles: 3000, km: 4828 },
    duration: { hours: 6, minutes: 30 },
    airlines: [],
  };
}

export async function generateMetadata(
  { params }: { params: { origin: string; destination: string } }
): Promise<Metadata> {
  const originIata = params.origin.toUpperCase();
  const destIata = params.destination.toUpperCase();

  const routeData = await getRouteData(originIata, destIata);

  return generateRouteMetadata(
    routeData.origin.cityName,
    routeData.origin.iataCode,
    routeData.destination.cityName,
    routeData.destination.iataCode,
    routeData.flightCount,
    routeData.distance,
    routeData.duration
  );
}

export default async function RoutePage({
  params,
}: {
  params: { origin: string; destination: string };
}) {
  const originIata = params.origin.toUpperCase();
  const destIata = params.destination.toUpperCase();

  if (originIata.length !== 3 || destIata.length !== 3) {
    notFound();
  }

  const routeData = await getRouteData(originIata, destIata);

  // Generate structured data
  const structuredData = generateRouteStructuredData(
    routeData.origin,
    routeData.destination,
    routeData.distance
  );

  const faqData = generateRouteFAQStructuredData(
    originIata,
    destIata,
    routeData.origin.cityName,
    routeData.destination.cityName,
    routeData.flightCount,
    routeData.airlines.map(a => a.airlineName)
  );

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-4xl font-bold text-gray-900">
                  {routeData.origin.cityName} to {routeData.destination.cityName}
                </h1>
              </div>

              <div className="flex items-center gap-6 text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {originIata} <ArrowRight className="h-4 w-4" /> {destIata}
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  {routeData.distance.miles} miles ({routeData.distance.km} km)
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {routeData.duration.hours}h {routeData.duration.minutes}m
                </div>
              </div>
            </div>

            {/* Route Info Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Flight Frequency</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary-500">
                    {routeData.flightCount}
                  </p>
                  <p className="text-sm text-gray-600">flights per month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Jetlag Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className="bg-jetlag-moderate text-white">
                    Moderate
                  </Badge>
                  <p className="text-sm text-gray-600 mt-2">
                    Eastbound crossing 5 time zones
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Best Arrival Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">
                    6-11 AM
                  </p>
                  <p className="text-sm text-gray-600">
                    For minimal jetlag
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Airlines Operating This Route */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Airlines Operating This Route</CardTitle>
                <CardDescription>
                  Compare airlines by jetlag score, aircraft type, and schedule
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Route data will appear here once connected to database.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Coming soon: Real-time flight schedules, aircraft types, jetlag scores
                </p>
              </CardContent>
            </Card>

            {/* Flight Search CTA */}
            <Card className="bg-primary-50 border-primary-200">
              <CardHeader>
                <CardTitle>Search Flights on This Route</CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={`/search?origin=${originIata}&destination=${destIata}`}
                  className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                >
                  Search {originIata} → {destIata} Flights
                  <ArrowRight className="inline ml-2 h-4 w-4" />
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Generate static params for most popular routes
 * Full generation would create 150,000+ pages
 */
export async function generateStaticParams() {
  // Sample routes for initial deployment
  const popularRoutes = [
    { origin: 'jfk', destination: 'lhr' },
    { origin: 'lhr', destination: 'jfk' },
    { origin: 'sfo', destination: 'nrt' },
    { origin: 'nrt', destination: 'sfo' },
    { origin: 'lax', destination: 'syd' },
  ];

  return popularRoutes;

  // In production with full database:
  // const routes = await db.select().from(routesEnhanced);
  // return routes.flatMap(route => [
  //   { origin: route.originIata.toLowerCase(), destination: route.destIata.toLowerCase() },
  //   { origin: route.destIata.toLowerCase(), destination: route.originIata.toLowerCase() }
  // ]);
}
