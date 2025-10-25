'use client';

/**
 * Simple Airport Autocomplete (MVP version)
 * Works with TripBase database
 */

import { useState } from 'react';
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
  type?: string;
}

interface Props {
  label: string;
  value: string;
  onSelect: (airport: Airport) => void;
  placeholder?: string;
  required?: boolean;
}

export function AirportAutocomplete({ label, value, onSelect, placeholder, required }: Props) {
  const [query, setQuery] = useState(value);

  return (
    <div className="space-y-2">
      <Label>{label} {required && '*'}</Label>
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder || 'Enter airport code...'}
        required={required}
      />
      <p className="text-xs text-gray-500">
        Enter IATA code (e.g., SFO, JFK, LHR)
      </p>
    </div>
  );
}
