"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, DollarSign, Clock, Zap, Plane } from 'lucide-react';
import { ScoredFlight } from '@/types/flight';

interface FlightComparisonProps {
  flights: ScoredFlight[];
  onClose: () => void;
}

export default function FlightComparison({ flights, onClose }: FlightComparisonProps) {
  if (flights.length === 0) return null;

  const metrics = [
    { key: 'jetlagScore', label: 'Jetlag Score', format: (v: number) => `${v}/10` },
    { key: 'price', label: 'Price', format: (v: number) => `$${v}` },
    { key: 'totalDuration', label: 'Duration', format: (v: number) => `${Math.floor(v / 60)}h ${v % 60}m` },
    { key: 'stops', label: 'Stops', format: (v: number) => v === 0 ? 'Direct' : v },
  ];

  const findBest = (key: string) => {
    const values = flights.map((f: any) =>
      key === 'jetlagScore' ? f.jetlagScore.overall : f[key]
    );

    if (key === 'price' || key === 'totalDuration' || key === 'stops') {
      return Math.min(...values);
    }
    return Math.max(...values);
  };

  const isBest = (flight: ScoredFlight, key: string) => {
    const value = key === 'jetlagScore' ? flight.jetlagScore.overall : (flight as any)[key];
    return value === findBest(key);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Compare Flights ({flights.length})
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Comparison Table */}
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {flights.map((flight, index) => (
                <div
                  key={flight.id}
                  className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-4"
                >
                  {/* Flight Header */}
                  <div className="text-center pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Option {index + 1}
                    </div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {flight.segments[0].airline.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {flight.segments[0].departure.airport.code} → {flight.segments[flight.segments.length - 1].arrival.airport.code}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="space-y-3">
                    {/* Jetlag Score */}
                    <div className={`p-4 rounded-lg ${isBest(flight, 'jetlagScore') ? 'bg-green-100 dark:bg-green-900/30 ring-2 ring-green-500' : 'bg-white dark:bg-gray-700'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Jetlag Score</span>
                        {isBest(flight, 'jetlagScore') && (
                          <Trophy className="w-4 h-4 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {flight.jetlagScore.overall.toFixed(1)}/10
                      </div>
                      <div className="mt-2 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Timing:</span>
                          <span className="font-medium">{flight.jetlagScore.timingScore}/10</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Direction:</span>
                          <span className="font-medium">{flight.jetlagScore.directionScore}/10</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Duration:</span>
                          <span className="font-medium">{flight.jetlagScore.durationScore}/10</span>
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className={`p-4 rounded-lg ${isBest(flight, 'price') ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500' : 'bg-white dark:bg-gray-700'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Price</span>
                        {isBest(flight, 'price') && (
                          <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        ${flight.price}
                      </div>
                      {flight.pricePerHour && (
                        <div className="text-xs text-gray-500 mt-1">
                          ${flight.pricePerHour.toFixed(0)}/hour
                        </div>
                      )}
                    </div>

                    {/* Duration */}
                    <div className={`p-4 rounded-lg ${isBest(flight, 'totalDuration') ? 'bg-purple-100 dark:bg-purple-900/30 ring-2 ring-purple-500' : 'bg-white dark:bg-gray-700'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Duration</span>
                        {isBest(flight, 'totalDuration') && (
                          <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        )}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {Math.floor(flight.totalDuration / 60)}h {flight.totalDuration % 60}m
                      </div>
                    </div>

                    {/* Stops */}
                    <div className={`p-4 rounded-lg ${isBest(flight, 'stops') ? 'bg-indigo-100 dark:bg-indigo-900/30 ring-2 ring-indigo-500' : 'bg-white dark:bg-gray-700'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Stops</span>
                        {isBest(flight, 'stops') && (
                          <Plane className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        )}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {flight.layovers.length === 0 ? 'Direct' : `${flight.layovers.length} stop${flight.layovers.length > 1 ? 's' : ''}`}
                      </div>
                    </div>

                    {/* Aircraft */}
                    <div className="p-4 rounded-lg bg-white dark:bg-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Aircraft</span>
                      <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                        {flight.segments[0].aircraft?.name || 'Unknown'}
                      </div>
                      {flight.segments[0].aircraft && (
                        <div className="flex gap-2 mt-2 text-xs">
                          {flight.segments[0].aircraft.wifi && (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">WiFi</span>
                          )}
                          {flight.segments[0].aircraft.power && (
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">Power</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Cabin Class */}
                    <div className="p-4 rounded-lg bg-white dark:bg-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Cabin</span>
                      <div className="text-sm font-medium text-gray-900 dark:text-white mt-1 capitalize">
                        {flight.segments[0].cabinClass.replace('_', ' ')}
                      </div>
                    </div>

                    {/* Carbon Footprint */}
                    {flight.carbonFootprint && (
                      <div className="p-4 rounded-lg bg-white dark:bg-gray-700">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Carbon</span>
                        <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                          {flight.carbonFootprint}kg CO₂
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                🏆 Best in Each Category
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Best Jetlag Score</div>
                  <div className="font-semibold text-green-600 dark:text-green-400 mt-1">
                    Flight {flights.findIndex(f => isBest(f, 'jetlagScore')) + 1}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Cheapest</div>
                  <div className="font-semibold text-blue-600 dark:text-blue-400 mt-1">
                    Flight {flights.findIndex(f => isBest(f, 'price')) + 1}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Fastest</div>
                  <div className="font-semibold text-purple-600 dark:text-purple-400 mt-1">
                    Flight {flights.findIndex(f => isBest(f, 'totalDuration')) + 1}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Fewest Stops</div>
                  <div className="font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                    Flight {flights.findIndex(f => isBest(f, 'stops')) + 1}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
