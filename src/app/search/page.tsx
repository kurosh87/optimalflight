'use client';

import { useState } from 'react';
import { AirportAutocomplete } from '@/components/flights/airport-autocomplete';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Plane, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  latitude: number;
  longitude: number;
}

export default function SearchPage() {
  const [origin, setOrigin] = useState<Airport | null>(null);
  const [destination, setDestination] = useState<Airport | null>(null);
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!origin || !destination || !departureDate) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSearching(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch('/api/flights/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: origin.code || origin,
          destination: destination.code || destination,
          departureDate,
          returnDate,
          adults: passengers,
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results || []);

      if (data.results?.length === 0) {
        setError('No flights found. Try different dates or airports.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed. Please try again or check your internet connection.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Find Your Perfect Flight
          </h1>
          <p className="text-lg text-gray-600">
            Search flights optimized for minimal jetlag and maximum comfort
          </p>
        </div>

        {/* Search Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-blue-600" />
              Flight Search
            </CardTitle>
            <CardDescription>
              Enter your travel details to find health-optimized flights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Route */}
            <div className="grid md:grid-cols-2 gap-4">
              <AirportAutocomplete
                label="From"
                value={origin ? `${origin.code} - ${origin.city}` : ''}
                onSelect={setOrigin}
                required
                placeholder="Origin airport..."
              />

              <AirportAutocomplete
                label="To"
                value={destination ? `${destination.code} - ${destination.city}` : ''}
                onSelect={setDestination}
                required
                placeholder="Destination airport..."
              />
            </div>

            {/* Dates */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departure">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Departure Date *
                </Label>
                <Input
                  id="departure"
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="return">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Return Date
                </Label>
                <Input
                  id="return"
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  min={departureDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Passengers */}
            <div className="space-y-2">
              <Label htmlFor="passengers">
                <Users className="inline h-4 w-4 mr-1" />
                Passengers
              </Label>
              <Input
                id="passengers"
                type="number"
                min="1"
                max="9"
                value={passengers}
                onChange={(e) => setPassengers(parseInt(e.target.value) || 1)}
              />
            </div>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              disabled={isSearching || !origin || !destination || !departureDate}
              className="w-full py-6 text-lg"
              size="lg"
            >
              {isSearching ? (
                'Searching...'
              ) : (
                <>
                  Search Flights
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">😴 Jetlag Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Every flight ranked by jetlag impact based on arrival time, direction, and duration
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">✈️ Aircraft Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Newer aircraft with better cabin pressure and humidity for reduced jetlag
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💰 Price vs Health</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                See the tradeoff between flight price and jetlag impact to make informed decisions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Popular Routes */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Popular Routes</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { from: 'SFO', to: 'LHR', route: 'San Francisco → London' },
              { from: 'JFK', to: 'NRT', route: 'New York → Tokyo' },
              { from: 'LAX', to: 'SYD', route: 'Los Angeles → Sydney' },
              { from: 'ORD', to: 'CDG', route: 'Chicago → Paris' },
            ].map((route) => (
              <Button
                key={route.route}
                variant="outline"
                className="justify-start"
                onClick={() => {
                  // Pre-fill search form
                  alert(`Loading ${route.route}...`);
                }}
              >
                {route.route}
              </Button>
            ))}
          </div>
        </div>

        {/* Search Results */}
        {error && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {results.length} flights found
            </h2>

            {results.map((flight, index) => (
              <Card key={flight.id || index} className="shadow-lg hover:shadow-xl transition">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        ${flight.price}
                      </div>
                      <div className="text-sm text-gray-600">
                        {flight.airline} • {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                      </div>
                    </div>

                    <Button className="bg-primary-500 hover:bg-primary-600 text-white">
                      Select Flight
                    </Button>
                  </div>

                  <div className="mt-4 text-sm text-gray-600">
                    {flight.segments.map((seg: any, i: number) => (
                      <div key={i}>
                        {seg.departure} → {seg.arrival} ({seg.airline} {seg.flightNumber})
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
