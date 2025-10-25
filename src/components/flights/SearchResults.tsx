'use client';

/**
 * Flight Search Results Display
 * Airbnb-style design with jetlag optimization
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plane, Clock, DollarSign, Heart, TrendingUp, Filter } from 'lucide-react';

interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  duration: number; // minutes
  price: number;
  currency: string;
  stops: number;
  jetlagScore: number; // 1-10
  aircraftType?: string;
  alliance?: string;
}

interface SearchResultsProps {
  flights: Flight[];
  isLoading?: boolean;
  origin: string;
  destination: string;
}

export default function SearchResults({
  flights,
  isLoading = false,
  origin,
  destination,
}: SearchResultsProps) {
  const [sortBy, setSortBy] = useState<'price' | 'jetlag' | 'duration' | 'best'>('best');
  const [showFilters, setShowFilters] = useState(false);

  // Sort flights
  const sortedFlights = [...flights].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price;
      case 'jetlag':
        return a.jetlagScore - b.jetlagScore;
      case 'duration':
        return a.duration - b.duration;
      case 'best':
        // Balance price and jetlag
        const scoreA = a.price / 100 + a.jetlagScore;
        const scoreB = b.price / 100 + b.jetlagScore;
        return scoreA - scoreB;
      default:
        return 0;
    }
  });

  // Get jetlag color
  const getJetlagColor = (score: number) => {
    if (score <= 3) return 'bg-green-100 text-green-800 border-green-200';
    if (score <= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (score <= 7) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getJetlagLabel = (score: number) => {
    if (score <= 3) return 'Minimal Jetlag';
    if (score <= 5) return 'Moderate';
    if (score <= 7) return 'Significant';
    return 'Severe';
  };

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <Plane className="h-16 w-16 text-gray-300 mx-auto mb-4 animate-bounce" />
        <p className="text-gray-600">Searching flights...</p>
      </div>
    );
  }

  if (flights.length === 0) {
    return (
      <Card className="shadow-airbnb">
        <CardContent className="py-20 text-center">
          <Plane className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No flights found</h3>
          <p className="text-gray-600">Try different dates or airports</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {flights.length} flights from {origin} to {destination}
          </h2>
          <p className="text-gray-600 mt-1">
            Sorted by {sortBy === 'best' ? 'best value (price + health)' : sortBy}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Sort & Filter Bar */}
      <Card className="shadow-airbnb">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="best">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Best Value
                    </div>
                  </SelectItem>
                  <SelectItem value="price">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Lowest Price
                    </div>
                  </SelectItem>
                  <SelectItem value="jetlag">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Lowest Jetlag
                    </div>
                  </SelectItem>
                  <SelectItem value="duration">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Shortest Duration
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Filter Pills */}
            <div className="flex gap-2">
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                Direct only
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                Morning arrival
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                Low jetlag
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {sortedFlights.map((flight, index) => (
          <Card
            key={flight.id}
            className="shadow-airbnb hover:shadow-airbnb-hover transition-all cursor-pointer"
          >
            <CardContent className="p-6">
              <div className="grid md:grid-cols-[1fr,auto,1fr,auto] gap-6 items-center">
                {/* Departure */}
                <div>
                  <div className="text-3xl font-bold text-gray-900">
                    {new Date(flight.departure).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{flight.origin}</div>
                </div>

                {/* Flight Info */}
                <div className="text-center px-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Clock className="h-4 w-4" />
                    {Math.floor(flight.duration / 60)}h {flight.duration % 60}m
                  </div>
                  <div className="relative">
                    <div className="border-t-2 border-gray-300 w-24"></div>
                    <Plane className="h-4 w-4 text-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white" />
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                  </div>
                </div>

                {/* Arrival */}
                <div>
                  <div className="text-3xl font-bold text-gray-900">
                    {new Date(flight.arrival).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{flight.destination}</div>
                </div>

                {/* Price & Jetlag */}
                <div className="text-right space-y-3">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      ${flight.price}
                    </div>
                    <div className="text-xs text-gray-500">per person</div>
                  </div>

                  <Badge className={`${getJetlagColor(flight.jetlagScore)} border px-3 py-1`}>
                    <Heart className="h-3 w-3 inline mr-1" />
                    Jetlag: {flight.jetlagScore}/10
                  </Badge>

                  <div className="text-xs text-gray-500">
                    {getJetlagLabel(flight.jetlagScore)}
                  </div>
                </div>
              </div>

              {/* Airline & Aircraft Info */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-gray-700">{flight.airline}</div>
                  {flight.flightNumber && (
                    <span className="text-xs text-gray-500">{flight.flightNumber}</span>
                  )}
                </div>

                {flight.aircraftType && (
                  <div className="text-xs text-gray-500">
                    {flight.aircraftType}
                  </div>
                )}

                {flight.alliance && (
                  <Badge variant="secondary" className="text-xs">
                    {flight.alliance}
                  </Badge>
                )}

                <div className="ml-auto">
                  <Button className="bg-primary-500 hover:bg-primary-600 text-white">
                    Select Flight
                  </Button>
                </div>
              </div>

              {/* Best Deal Badge */}
              {index === 0 && sortBy === 'best' && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-green-600 text-white">
                    ⭐ Best Value
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      {flights.length >= 20 && (
        <div className="text-center py-8">
          <Button variant="outline" size="lg">
            Load More Flights
          </Button>
        </div>
      )}
    </div>
  );
}
