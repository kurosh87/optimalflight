"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin } from "lucide-react";
import { debounce } from "@/lib/utils";

interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  latitude: number;
  longitude: number;
  type?: string;
}

interface AirportAutocompleteProps {
  label: string;
  value: string;
  onSelect: (airport: Airport) => void;
  required?: boolean;
  placeholder?: string;
}

export function AirportAutocomplete({
  label,
  value,
  onSelect,
  required,
  placeholder = "Search airports...",
}: AirportAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);

  const searchAirports = useCallback(
    debounce(async (keyword: string) => {
      if (keyword.length < 2) {
        setAirports([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/search/airports?q=${encodeURIComponent(keyword)}&limit=10`
        );
        if (response.ok) {
          const data = await response.json();
          setAirports(data.airports || []);
          setShowResults(true);
        }
      } catch (error) {
        console.error("Error searching airports:", error);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (query && !selectedAirport) {
      searchAirports(query);
    }
  }, [query, searchAirports, selectedAirport]);

  const handleSelect = (airport: Airport) => {
    setSelectedAirport(airport);
    setQuery(`${airport.code} - ${airport.city}`);
    setShowResults(false);
    onSelect(airport);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedAirport(null);
  };

  return (
    <div className="space-y-2 relative">
      <Label htmlFor={label}>{label} {required && "*"}</Label>
      <div className="relative">
        <Input
          id={label}
          value={query}
          onChange={handleInputChange}
          onFocus={() => airports.length > 0 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder={placeholder}
          required={required}
          className="pr-8"
        />
        {loading && (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showResults && airports.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {airports.map((airport) => (
            <button
              key={`${airport.code}-${airport.type}`}
              type="button"
              onClick={() => handleSelect(airport)}
              className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground flex items-start gap-2 border-b last:border-b-0"
            >
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">
                  {airport.code} - {airport.city}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {airport.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {airport.country}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
