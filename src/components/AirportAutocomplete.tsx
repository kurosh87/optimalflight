'use client';

import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from './ui/input';

interface Airport {
  iata: string;
  name: string;
  city: string;
  country: string;
}

interface AirportAutocompleteProps {
  value: string;
  onChange: (iata: string, airport: Airport | null) => void;
  placeholder?: string;
  label?: string;
}

export default function AirportAutocomplete({
  value,
  onChange,
  placeholder = 'Search airport...',
  label,
}: AirportAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Airport[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search airports
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const searchAirports = async () => {
      try {
        const res = await fetch(`/api/airports/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.airports || []);
        setIsOpen(true);
      } catch (error) {
        console.error('Failed to search airports:', error);
      }
    };

    const debounce = setTimeout(searchAirports, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (airport: Airport) => {
    setSelectedAirport(airport);
    setQuery(`${airport.iata} - ${airport.name}, ${airport.city}`);
    setIsOpen(false);
    onChange(airport.iata, airport);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // Clear selection if user modifies the input
    if (selectedAirport) {
      setSelectedAirport(null);
      onChange('', null);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pl-10"
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
          {results.map((airport) => (
            <button
              key={airport.iata}
              onClick={() => handleSelect(airport)}
              className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center justify-between transition"
            >
              <div>
                <div className="font-medium text-gray-900">
                  {airport.iata} - {airport.city}
                </div>
                <div className="text-sm text-gray-500">
                  {airport.name}
                </div>
              </div>
              <div className="text-xs text-gray-400">
                {airport.country}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
