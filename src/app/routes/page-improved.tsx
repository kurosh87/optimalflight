/**
 * Route Visualization Page with Map Integration
 * Airbnb-style design with interactive map
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Map, Globe, Route, Plane, Info } from 'lucide-react';

export default function RoutesPage() {
  // Sample data for demonstration
  const sampleRoutes = [
    { origin: 'JFK', destination: 'LHR', airlines: 'AA, BA, DL', jetlag: 6 },
    { origin: 'SFO', destination: 'NRT', airlines: 'UA, NH, AA', jetlag: 8 },
    { origin: 'LAX', destination: 'SYD', airlines: 'QF, UA, AA', jetlag: 7 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Globe className="h-10 w-10 text-primary-500" />
              Route Visualization
            </h1>
            <p className="text-lg text-gray-600">
              Explore flight routes worldwide with jetlag optimization
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Info Banner */}
          <Card className="mb-8 border-blue-200 bg-blue-50 shadow-airbnb">
            <CardHeader>
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <CardTitle className="text-blue-900">Interactive Map Coming Soon</CardTitle>
                  <CardDescription className="text-blue-700 mt-2">
                    The Deck.gl + Mapbox map component is built and ready.
                    Just needs Mapbox token and route data to display.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-blue-800">
                <p className="flex items-center gap-2">
                  <Route className="h-4 w-4" />
                  Add <code className="bg-blue-100 px-2 py-1 rounded">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> to .env
                </p>
                <p className="flex items-center gap-2">
                  <Map className="h-4 w-4" />
                  Import route data with: <code className="bg-blue-100 px-2 py-1 rounded">npm run import:routes</code>
                </p>
                <p className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Then the map will render with 60K-100K routes!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Map Placeholder (will become actual map) */}
          <Card className="shadow-airbnb-hover overflow-hidden mb-8">
            <div className="bg-gradient-to-br from-blue-100 via-cyan-50 to-teal-50 h-[500px] flex items-center justify-center">
              <div className="text-center">
                <Globe className="h-24 w-24 text-blue-300 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-700 mb-2">
                  Interactive Map
                </h3>
                <p className="text-gray-600 mb-4">
                  Add Mapbox token to see the full route visualization
                </p>
                <div className="inline-block bg-white px-4 py-2 rounded-lg shadow-md">
                  <code className="text-sm text-gray-700">
                    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="..."
                  </code>
                </div>
              </div>
            </div>
          </Card>

          {/* Sample Routes */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Popular Routes</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {sampleRoutes.map((route) => (
                <Card
                  key={`${route.origin}-${route.destination}`}
                  className="shadow-airbnb hover:shadow-airbnb-hover transition-all cursor-pointer"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{route.origin} → {route.destination}</span>
                      <Badge className={`
                        ${route.jetlag <= 5 ? 'bg-green-100 text-green-800' : ''}
                        ${route.jetlag > 5 && route.jetlag <= 7 ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${route.jetlag > 7 ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        Jetlag: {route.jetlag}/10
                      </Badge>
                    </CardTitle>
                    <CardDescription>{route.airlines}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full bg-primary-500 hover:bg-primary-600 text-white" asChild>
                      <a href={`/flights-from-${route.origin.toLowerCase()}-to-${route.destination.toLowerCase()}`}>
                        View Route Details
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="shadow-airbnb">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Map className="h-5 w-5 text-primary-500" />
                  Great Circle Routes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Accurate geodesic flight paths showing the actual route aircraft take across the globe
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-airbnb">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Route className="h-5 w-5 text-primary-500" />
                  Multi-Stop Planning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Plan complex itineraries with multiple destinations optimized for minimal cumulative jetlag
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-airbnb">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary-500" />
                  Alliance Networks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Visualize Star Alliance, OneWorld, and SkyTeam route networks with color coding
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Airport Marker Legend */}
          <Card className="mt-8 shadow-airbnb">
            <CardHeader>
              <CardTitle>Airport Size Categories</CardTitle>
              <CardDescription>
                Airports are color-coded by number of destinations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#2196F3] flex-shrink-0"></div>
                  <div>
                    <div className="font-semibold text-gray-900">Major Hubs</div>
                    <div className="text-sm text-gray-600">30+ destinations</div>
                    <div className="text-xs text-gray-500">ATL, JFK, LHR, DXB</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#FFC107] flex-shrink-0"></div>
                  <div>
                    <div className="font-semibold text-gray-900">Regional Hubs</div>
                    <div className="text-sm text-gray-600">7-30 destinations</div>
                    <div className="text-xs text-gray-500">Secondary airports</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#F44336] flex-shrink-0"></div>
                  <div>
                    <div className="font-semibold text-gray-900">Small Airports</div>
                    <div className="text-sm text-gray-600">Under 7 destinations</div>
                    <div className="text-xs text-gray-500">Regional/local</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
