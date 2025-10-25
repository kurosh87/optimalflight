import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plane,
  Moon,
  DollarSign,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
  Check
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Find Flights That Fit Your
            <br />
            <span className="text-blue-200">Body Clock</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            The first flight search platform that optimizes for your health,
            not just your wallet. Minimize jetlag, maximize productivity.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/search">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Search Flights
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/routes">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent text-white border-white hover:bg-white/10">
                Explore Routes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why FlightOptima?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Business travelers lose <strong>1-2 productive days per trip</strong> to jetlag.
              We help you choose flights that minimize recovery time.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 bg-red-50 rounded-lg border border-red-200">
                <h3 className="font-bold text-lg mb-2 text-red-900">The Problem</h3>
                <p className="text-sm text-red-800">
                  Standard flight search ignores health impact entirely
                </p>
              </div>
              <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-bold text-lg mb-2 text-blue-900">Our Solution</h3>
                <p className="text-sm text-blue-800">
                  Every flight ranked by jetlag impact + arrival time optimization
                </p>
              </div>
              <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-bold text-lg mb-2 text-green-900">The Result</h3>
                <p className="text-sm text-green-800">
                  Arrive refreshed, recover faster, stay productive
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              How It Works
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <Card>
                <CardHeader>
                  <Moon className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle>Jetlag Scoring</CardTitle>
                  <CardDescription>
                    Every flight gets a 1-10 jetlag impact score
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  Based on time zones crossed, direction of travel, arrival time,
                  and flight duration. Science-backed algorithm.
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card>
                <CardHeader>
                  <Plane className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle>Aircraft Quality</CardTitle>
                  <CardDescription>
                    Newer aircraft = better cabin conditions
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  Modern aircraft have better cabin pressure and humidity,
                  reducing jetlag by up to 30%.
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card>
                <CardHeader>
                  <TrendingUp className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle>Optimal Arrival Times</CardTitle>
                  <CardDescription>
                    Arrive when your body is ready
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  Morning arrivals (6-11 AM) help your circadian rhythm adjust faster.
                  We rank flights by arrival time optimality.
                </CardContent>
              </Card>

              {/* Feature 4 */}
              <Card>
                <CardHeader>
                  <DollarSign className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle>Price vs Health</CardTitle>
                  <CardDescription>
                    See the tradeoff clearly
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  Visualize if spending $200 more saves you 1.5 days of recovery.
                  Make informed decisions.
                </CardContent>
              </Card>

              {/* Feature 5 */}
              <Card>
                <CardHeader>
                  <Shield className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle>Transparent Pricing</CardTitle>
                  <CardDescription>
                    No hidden fees, no ghost fares
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  Real-time pricing from trusted sources. What you see is what you pay.
                </CardContent>
              </Card>

              {/* Feature 6 */}
              <Card>
                <CardHeader>
                  <Zap className="h-8 w-8 text-blue-600 mb-2" />
                  <CardTitle>Multi-City Optimization</CardTitle>
                  <CardDescription>
                    Optimize entire trip jetlag
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  Plan SF → London → Paris → Tokyo with minimal cumulative jetlag impact.
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              FlightOptima vs Traditional Search
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Traditional */}
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-900">Google Flights / Skyscanner</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-red-500">✗</span>
                    <span>Sorts by price only</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-red-500">✗</span>
                    <span>Ignores health impact</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-red-500">✗</span>
                    <span>No jetlag consideration</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-red-500">✗</span>
                    <span>No aircraft quality info</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-red-500">✗</span>
                    <span>List view only</span>
                  </div>
                </CardContent>
              </Card>

              {/* FlightOptima */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-900">FlightOptima</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Sort by price, jetlag, or balance</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Health-optimized results</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Jetlag score for every flight</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Aircraft generation + comfort data</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Interactive route map visualization</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Fly Smarter?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Start finding health-optimized flights in seconds
          </p>
          <Link href="/search">
            <Button size="lg" variant="secondary" className="text-lg px-10 py-6">
              Start Searching
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">7,000+</div>
              <div className="text-sm text-gray-600">Airports</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">900+</div>
              <div className="text-sm text-gray-600">Airlines</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">1-10</div>
              <div className="text-sm text-gray-600">Jetlag Score</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">Free</div>
              <div className="text-sm text-gray-600">Beta Access</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
