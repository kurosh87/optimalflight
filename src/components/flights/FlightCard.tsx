"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  Heart,
  Share2,
  ExternalLink,
  Wifi,
  Zap,
  Coffee,
  Leaf,
  Info,
} from 'lucide-react';
import { ScoredFlight } from '@/types/flight';
import { format } from 'date-fns';
import { AircraftBadge } from './aircraft-badge';
import { AirlineBadge } from './airline-badge';
import { AirlineImage } from '@/components/ui/entity-image';

interface FlightCardProps {
  flight: ScoredFlight;
  rank: number;
  isTopPick?: boolean;
  onSelectForComparison?: (flightId: string, selected: boolean) => void;
  onViewRecoveryPlan?: (flight: ScoredFlight) => void;
  selectedForComparison?: boolean;
}

export default function FlightCard({
  flight,
  rank,
  isTopPick = false,
  onSelectForComparison,
  onViewRecoveryPlan,
  selectedForComparison = false,
}: FlightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const firstSegment = flight.segments[0];
  const lastSegment = flight.segments[flight.segments.length - 1];
  const mainAirline = firstSegment.airline;

  // Calculate score color
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'from-green-500 to-emerald-600';
    if (score >= 5) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 8) return 'bg-green-50 dark:bg-green-900/20';
    if (score >= 5) return 'bg-yellow-50 dark:bg-yellow-900/20';
    return 'bg-red-50 dark:bg-red-900/20';
  };

  const getBadgeStyles = (badge: string) => {
    const styles: Record<string, string> = {
      best_jetlag: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400',
      best_price: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
      fastest: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
      perfect_timing: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400',
      recommended: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
    };
    return styles[badge] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getBadgeLabel = (badge: string) => {
    const labels: Record<string, string> = {
      best_jetlag: '🏆 Best for Jetlag',
      best_price: '💰 Best Price',
      fastest: '⚡ Fastest',
      perfect_timing: '⏰ Perfect Timing',
      recommended: '✨ Recommended',
    };
    return labels[badge] || badge;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={`
        relative bg-white dark:bg-gray-800 rounded-2xl border-2 overflow-hidden
        transition-all duration-300 hover:shadow-xl
        ${isTopPick ? 'border-indigo-500 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'}
        ${selectedForComparison ? 'ring-2 ring-indigo-500' : ''}
      `}
    >
      {/* Top Pick Banner */}
      {isTopPick && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-1.5 text-sm font-semibold">
          🏆 Our Top Pick - Best Jetlag Optimization
        </div>
      )}

      <div className={`p-6 ${isTopPick ? 'pt-10' : ''}`}>
        {/* Header Section */}
        <div className="flex items-start justify-between mb-6">
          {/* Airline Info */}
          <div className="flex items-center gap-4">
            {mainAirline.logo ? (
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center overflow-hidden">
                <img
                  src={mainAirline.logo}
                  alt={mainAirline.name}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <AirlineImage
                code={mainAirline.code || mainAirline.name.substring(0, 2).toUpperCase()}
                name={mainAirline.name}
                size="lg"
                rounded="lg"
              />
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                  {mainAirline.name}
                </h3>
                <AirlineBadge
                  iataCode={mainAirline.code || mainAirline.name.substring(0, 2).toUpperCase()}
                  name={mainAirline.name}
                  size="sm"
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {flight.segments.length === 1 ? 'Direct Flight' : `${flight.segments.length - 1} Stop${flight.segments.length > 2 ? 's' : ''}`}
              </p>
              {mainAirline.alliance && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {mainAirline.alliance}
                </p>
              )}
            </div>
          </div>

          {/* Jetlag Score */}
          <div className="relative">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={`
                relative w-24 h-24 rounded-2xl ${getScoreBgColor(flight.jetlagScore.overall)}
                flex flex-col items-center justify-center cursor-pointer
                ${isTopPick ? 'animate-pulse' : ''}
              `}
            >
              <div className={`text-3xl font-bold bg-gradient-to-br ${getScoreColor(flight.jetlagScore.overall)} bg-clip-text text-transparent`}>
                {flight.jetlagScore.overall.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                /10 Jetlag
              </div>
            </motion.div>

            {/* Rank Badge */}
            {rank <= 3 && !isTopPick && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                #{rank}
              </div>
            )}
          </div>
        </div>

        {/* Badges */}
        {flight.badges.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {flight.badges.map((badge) => (
              <span
                key={badge}
                className={`px-3 py-1 rounded-full text-xs font-medium border ${getBadgeStyles(badge)}`}
              >
                {getBadgeLabel(badge)}
              </span>
            ))}
          </div>
        )}

        {/* Flight Timeline */}
        <div className="relative mb-6">
          {/* Route Line */}
          <div className="flex items-center gap-4">
            {/* Departure */}
            <div className="flex-shrink-0 text-left">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatTime(firstSegment.departure.time)}
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {firstSegment.departure.airport.code}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {firstSegment.departure.airport.city}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">
                {formatDate(firstSegment.departure.time)}
              </div>
            </div>

            {/* Journey Line */}
            <div className="flex-1 relative">
              <div className="relative h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full">
                <div className="absolute left-0 top-1/2 -translate-y-1/2">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                </div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                  <div className="w-3 h-3 bg-pink-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                </div>

                {/* Layover Dots */}
                {flight.layovers.map((layover, index) => (
                  <div
                    key={index}
                    className="absolute top-1/2 -translate-y-1/2 group"
                    style={{ left: `${((index + 1) * 100) / (flight.segments.length)}%` }}
                  >
                    <div className="w-3 h-3 bg-yellow-500 rounded-full border-2 border-white dark:border-gray-800 cursor-pointer"></div>
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {layover.airport.code} • {formatDuration(layover.duration)}
                    </div>
                  </div>
                ))}

                {/* Plane Icon */}
                <motion.div
                  animate={{ x: ['-10%', '110%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
                >
                  <Plane className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </motion.div>
              </div>

              {/* Duration */}
              <div className="text-center mt-2">
                <div className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  {formatDuration(flight.totalDuration)}
                </div>
              </div>
            </div>

            {/* Arrival */}
            <div className="flex-shrink-0 text-right">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatTime(lastSegment.arrival.time)}
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {lastSegment.arrival.airport.code}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {lastSegment.arrival.airport.city}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">
                {formatDate(lastSegment.arrival.time)}
                {flight.dayChange > 0 && (
                  <span className="ml-1 text-orange-500">+{flight.dayChange}</span>
                )}
              </div>
            </div>
          </div>

          {/* Timezone Indicators */}
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
            <div>{firstSegment.departure.airport.timezone}</div>
            <div>{lastSegment.arrival.airport.timezone}</div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          {/* Price */}
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Price</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${flight.price}
            </div>
            {flight.pricePerHour && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                ${flight.pricePerHour.toFixed(0)}/hr
              </div>
            )}
          </div>

          {/* Cabin */}
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cabin</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
              {firstSegment.cabinClass.replace('_', ' ')}
            </div>
            {firstSegment.aircraft && (
              <div className="mt-1">
                <AircraftBadge
                  iataCode={firstSegment.aircraft.code || firstSegment.aircraft.name.split(' ')[0]}
                  name={firstSegment.aircraft.name}
                  size="sm"
                />
              </div>
            )}
          </div>

          {/* Departure */}
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Flight No.</div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {firstSegment.flightNumber}
            </div>
            {flight.seatsLeft && flight.seatsLeft < 5 && (
              <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                Only {flight.seatsLeft} seats left!
              </div>
            )}
          </div>
        </div>

        {/* Amenities Icons */}
        {firstSegment.aircraft && (
          <div className="flex items-center gap-4 mb-6 text-gray-600 dark:text-gray-400">
            {firstSegment.aircraft.wifi && (
              <div className="flex items-center gap-1 text-sm">
                <Wifi className="w-4 h-4" />
                <span className="text-xs">WiFi</span>
              </div>
            )}
            {firstSegment.aircraft.power && (
              <div className="flex items-center gap-1 text-sm">
                <Zap className="w-4 h-4" />
                <span className="text-xs">Power</span>
              </div>
            )}
            {firstSegment.aircraft.entertainment && (
              <div className="flex items-center gap-1 text-sm">
                <Coffee className="w-4 h-4" />
                <span className="text-xs">IFE</span>
              </div>
            )}
            {flight.carbonFootprint && (
              <div className="flex items-center gap-1 text-sm">
                <Leaf className="w-4 h-4 text-green-600" />
                <span className="text-xs">{flight.carbonFootprint}kg CO₂</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onViewRecoveryPlan?.(flight)}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30"
          >
            View Recovery Plan
          </button>

          {onSelectForComparison && (
            <button
              onClick={() => onSelectForComparison(flight.id, !selectedForComparison)}
              className={`
                px-4 py-3 rounded-xl border-2 font-medium transition-all
                ${selectedForComparison
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-indigo-500'
                }
              `}
            >
              {selectedForComparison ? '✓' : 'Compare'}
            </button>
          )}

          <button
            onClick={() => setIsFavorited(!isFavorited)}
            className="p-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:border-pink-500 transition-all"
          >
            <Heart className={`w-5 h-5 ${isFavorited ? 'fill-pink-500 text-pink-500' : 'text-gray-400'}`} />
          </button>

          <button className="p-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:border-indigo-500 transition-all">
            <Share2 className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:border-indigo-500 transition-all"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 overflow-hidden"
          >
            <div className="p-6 space-y-6">
              {/* Jetlag Score Explanation */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5 text-indigo-600" />
                  Why This Jetlag Score?
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {flight.jetlagScore.explanation}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Timing</div>
                    <div className="text-lg font-bold text-indigo-600">{flight.jetlagScore.timingScore}/10</div>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Direction</div>
                    <div className="text-lg font-bold text-purple-600">{flight.jetlagScore.directionScore}/10</div>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Duration</div>
                    <div className="text-lg font-bold text-pink-600">{flight.jetlagScore.durationScore}/10</div>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Light</div>
                    <div className="text-lg font-bold text-amber-600">{flight.jetlagScore.lightExposureScore}/10</div>
                  </div>
                </div>
              </div>

              {/* Segment Breakdown */}
              {flight.segments.length > 1 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Flight Segments
                  </h4>
                  <div className="space-y-3">
                    {flight.segments.map((segment, index) => (
                      <div key={segment.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg space-y-3">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white mb-1">
                              {segment.departure.airport.code} → {segment.arrival.airport.code}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {segment.flightNumber} • {formatDuration(segment.duration)}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {formatTime(segment.departure.time)} - {formatTime(segment.arrival.time)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap pl-12">
                          <AirlineBadge
                            iataCode={segment.airline.code || segment.airline.name.substring(0, 2).toUpperCase()}
                            name={segment.airline.name}
                            size="sm"
                          />
                          {segment.aircraft && (
                            <AircraftBadge
                              iataCode={segment.aircraft.code || segment.aircraft.name.split(' ')[0]}
                              name={segment.aircraft.name}
                              size="sm"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Layover Details */}
              {flight.layovers.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Layover Facilities
                  </h4>
                  <div className="space-y-3">
                    {flight.layovers.map((layover, index) => (
                      <div key={index} className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {layover.airport.code} - {layover.airport.name}
                          </div>
                          <div className="text-sm font-semibold text-indigo-600">
                            {formatDuration(layover.duration)} layover
                          </div>
                        </div>
                        {layover.facilities && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {layover.facilities.lounges && (
                              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                                ✓ Lounges
                              </span>
                            )}
                            {layover.facilities.showers && (
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                                ✓ Showers
                              </span>
                            )}
                            {layover.facilities.sleepPods && (
                              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded">
                                ✓ Sleep Pods
                              </span>
                            )}
                          </div>
                        )}
                        {layover.sightseeingPossible && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            💡 Long enough for quick city tour!
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Book Now Button */}
              {flight.bookingLink && (
                <button
                  onClick={() => window.open(flight.bookingLink, '_blank')}
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 px-6 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  Book Now
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
