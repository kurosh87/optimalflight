/**
 * Airport Departure Page (Programmatic SEO)
 * Pattern: /flights-from-{city-name}-{iata-code}
 *
 * Examples:
 * - /flights-from-new-york-city-jfk
 * - /flights-from-dubai-dxb
 * - /flights-from-london-lhr
 *
 * This generates 10,000+ SEO-optimized pages automatically
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { parseAirportDepartureURL, generateAirportDepartureMetadata } from '@/lib/seo/metadata-generator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plane, MapPin } from 'lucide-react';

// This would come from database in production
async function getAirportData(iataCode: string) {
  // TODO: Query database for airport and routes
  // For now, return mock data
  return {
    iataCode: iataCode.toUpperCase(),
    cityName: 'City Name',
    airportName: 'Airport Name',
    destinationCount: 0,
    routes: [],
  };
}

export async function generateMetadata(
  { params }: { params: { city: string } }
): Promise<Metadata> {
  const parsed = parseAirportDepartureURL(`/flights-from-${params.city}`);

  if (!parsed) {
    return { title: 'Airport Not Found' };
  }

  const airportData = await getAirportData(parsed.iataCode);

  return generateAirportDepartureMetadata(
    airportData.cityName,
    airportData.iataCode,
    airportData.airportName,
    airportData.destinationCount
  );
}

export default async function AirportDeparturePage({
  params,
}: {
  params: { city: string };
}) {
  const parsed = parseAirportDepartureURL(`/flights-from-${params.city}`);

  if (!parsed) {
    notFound();
  }

  const airportData = await getAirportData(parsed.iataCode);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <MapPin className="h-10 w-10 text-primary-500" />
              Flights from {airportData.cityName} ({airportData.iataCode})
            </h1>
            <p className="text-lg text-gray-600">
              {airportData.airportName} - {airportData.destinationCount} destinations
            </p>
          </div>

          {/* Coming Soon */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Route Visualization Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Plane className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  We're building an interactive map showing all routes from {airportData.iataCode}
                </p>
                <p className="text-sm text-gray-500">
                  Each route will be color-coded by jetlag impact and show:
                </p>
                <ul className="text-sm text-gray-500 mt-2 space-y-1">
                  <li>• Airlines operating the route</li>
                  <li>• Flight frequency (daily/weekly)</li>
                  <li>• Aircraft types</li>
                  <li>• Jetlag score (1-10)</li>
                  <li>• Distance and duration</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Jetlag Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Every route ranked by jetlag impact based on direction, time zones, and arrival times
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Alliance Filter</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Filter by Star Alliance, OneWorld, or SkyTeam to find partner airline routes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Seasonal Routes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  See which routes operate year-round vs. seasonally (summer tourism, winter ski routes)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Generate static params for static site generation
 * This would generate 10,000+ pages at build time
 */
export async function generateStaticParams() {
  // TODO: Query database for all airports with routes
  // For now, return sample airports
  const sampleAirports = [
    { city: 'new-york-city-jfk' },
    { city: 'los-angeles-lax' },
    { city: 'chicago-ord' },
    { city: 'san-francisco-sfo' },
    { city: 'london-lhr' },
  ];

  return sampleAirports;

  // In production:
  // const airports = await db.select().from(airportsEnhanced).where(gt(airportsEnhanced.totalDestinationsCount, 0));
  // return airports.map(airport => ({
  //   city: `${generateSlug(airport.cityName)}-${airport.iataCode.toLowerCase()}`
  // }));
}
