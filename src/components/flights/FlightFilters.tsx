"use client";

import { useState } from 'react';
import { Sliders, X } from 'lucide-react';
import { FlightFilters as Filters } from '@/types/flight';

interface FlightFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onClose?: () => void;
  isMobile?: boolean;
}

export default function FlightFilters({
  filters,
  onFilterChange,
  onClose,
  isMobile = false,
}: FlightFiltersProps) {
  const [localFilters, setLocalFilters] = useState<Filters>(filters);

  const handleApply = () => {
    onFilterChange(localFilters);
    onClose?.();
  };

  const handleReset = () => {
    const defaultFilters: Filters = {
      priceRange: [0, 5000],
      departureTimeSlots: [],
      maxStops: 3,
      airlines: [],
      minJetlagScore: 0,
      directOnly: false,
    };
    setLocalFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const timeSlots = [
    { value: 'early_morning', label: 'Early Morning', time: '00:00 - 06:00' },
    { value: 'morning', label: 'Morning', time: '06:00 - 12:00' },
    { value: 'afternoon', label: 'Afternoon', time: '12:00 - 18:00' },
    { value: 'evening', label: 'Evening', time: '18:00 - 00:00' },
  ];

  const Container = isMobile ? 'div' : 'div';

  return (
    <Container className={`
      ${isMobile ? 'fixed inset-0 bg-white dark:bg-gray-900 z-50' : 'sticky top-4'}
      ${isMobile ? 'flex flex-col' : 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700'}
      ${isMobile ? '' : 'p-6'}
    `}>
      {/* Mobile Header */}
      {isMobile && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <div className="flex items-center gap-2 mb-6">
          <Sliders className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
        </div>
      )}

      {/* Filter Content */}
      <div className={`${isMobile ? 'flex-1 overflow-y-auto px-6 py-4' : ''} space-y-6`}>
        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Price Range
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="5000"
              step="50"
              value={localFilters.priceRange[1]}
              onChange={(e) => setLocalFilters({
                ...localFilters,
                priceRange: [0, parseInt(e.target.value)]
              })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>$0</span>
              <span className="font-semibold text-indigo-600">${localFilters.priceRange[1]}+</span>
            </div>
          </div>
        </div>

        {/* Departure Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Departure Time
          </label>
          <div className="space-y-2">
            {timeSlots.map((slot) => (
              <label
                key={slot.value}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={localFilters.departureTimeSlots.includes(slot.value as any)}
                  onChange={(e) => {
                    const newSlots = e.target.checked
                      ? [...localFilters.departureTimeSlots, slot.value as any]
                      : localFilters.departureTimeSlots.filter(s => s !== slot.value);
                    setLocalFilters({ ...localFilters, departureTimeSlots: newSlots });
                  }}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{slot.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{slot.time}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Max Stops */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Maximum Stops
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((stops) => (
              <button
                key={stops}
                onClick={() => setLocalFilters({ ...localFilters, maxStops: stops })}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${localFilters.maxStops === stops
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                {stops === 0 ? 'Direct' : stops === 3 ? 'Any' : stops}
              </button>
            ))}
          </div>
        </div>

        {/* Direct Only Toggle */}
        <div>
          <label className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <input
              type="checkbox"
              checked={localFilters.directOnly || false}
              onChange={(e) => setLocalFilters({ ...localFilters, directOnly: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">Direct Flights Only</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Show only non-stop flights</div>
            </div>
          </label>
        </div>

        {/* Minimum Jetlag Score */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Minimum Jetlag Score
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={localFilters.minJetlagScore || 0}
              onChange={(e) => setLocalFilters({
                ...localFilters,
                minJetlagScore: parseFloat(e.target.value)
              })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
            />
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Any</span>
              <span className="font-semibold text-green-600">
                {localFilters.minJetlagScore || 0}/10+
              </span>
            </div>
          </div>
        </div>

        {/* Max Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Maximum Duration
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="120"
              max="1440"
              step="30"
              value={localFilters.maxDuration || 1440}
              onChange={(e) => setLocalFilters({
                ...localFilters,
                maxDuration: parseInt(e.target.value)
              })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">2h</span>
              <span className="font-semibold text-purple-600">
                {localFilters.maxDuration
                  ? `${Math.floor(localFilters.maxDuration / 60)}h ${localFilters.maxDuration % 60}m`
                  : 'Any'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={`${isMobile ? 'border-t border-gray-200 dark:border-gray-700 p-6' : 'mt-6 pt-6 border-t border-gray-200 dark:border-gray-700'} flex gap-3`}>
        <button
          onClick={handleReset}
          className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={handleApply}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </Container>
  );
}
