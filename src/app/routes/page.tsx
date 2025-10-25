import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Map, Globe, Route } from 'lucide-react';

export default function RoutesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Globe className="h-10 w-10 text-blue-600" />
              Route Visualization
            </h1>
            <p className="text-lg text-gray-600">
              Explore flight routes worldwide with jetlag optimization insights
            </p>
          </div>

          {/* Coming Soon Notice */}
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">Interactive Map Coming Soon</CardTitle>
              <CardDescription className="text-blue-700">
                We're building an interactive world map with Leaflet/Mapbox to visualize routes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-blue-800">
                <p className="flex items-center gap-2">
                  <Route className="h-4 w-4" />
                  Click any airport to see all available connections
                </p>
                <p className="flex items-center gap-2">
                  <Map className="h-4 w-4" />
                  Routes color-coded by jetlag score (green = low, red = high)
                </p>
                <p className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Alliance network visualization (Star Alliance, OneWorld, SkyTeam)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Great Circle Routes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Accurate geodesic flight paths showing the actual route aircraft take
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Multi-Stop Planning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Plan complex itineraries with multiple destinations optimized for minimal jetlag
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Alliance Networks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Visualize Star Alliance, OneWorld, and SkyTeam route networks
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
