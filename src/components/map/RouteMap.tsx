'use client';

/**
 * Interactive Route Map Component
 * FlightConnections-style visualization with Deck.gl + Mapbox
 *
 * Features:
 * - Great circle arc rendering for routes
 * - 3-tier airport markers (blue/yellow/red)
 * - Click airports to see all routes
 * - Alliance filtering
 * - Jetlag score color-coding
 * - Performance optimized for 60K+ routes
 */

import { useState, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { ArcLayer } from '@deck.gl/layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import { Map } from 'react-map-gl';
import type { MapViewState } from '@deck.gl/core';
import { getAirportMarkerColor, getAirportCategory } from '@/lib/map/airport-markers';
import { getRouteLineColor } from '@/lib/map/route-renderer';

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

export interface Airport {
  iataCode: string;
  airportName: string;
  cityName: string;
  latitude: number;
  longitude: number;
  totalDestinationsCount: number;
}

export interface Route {
  routeId: string;
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
  airline?: string;
  alliance?: string;
  jetlagScore?: number;
  frequencyPerWeek?: number;
}

interface RouteMapProps {
  airports: Airport[];
  routes: Route[];
  selectedAirport?: string | null;
  onAirportClick?: (airport: Airport) => void;
  onRouteClick?: (route: Route) => void;
  colorMode?: 'alliance' | 'jetlag' | 'default';
}

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: 0,
  latitude: 20,
  zoom: 2,
  pitch: 0,
  bearing: 0,
};

export default function RouteMap({
  airports,
  routes,
  selectedAirport,
  onAirportClick,
  onRouteClick,
  colorMode = 'default',
}: RouteMapProps) {
  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);
  const [hoveredAirport, setHoveredAirport] = useState<string | null>(null);

  // Airport markers layer (ScatterplotLayer)
  const airportLayer = useMemo(
    () =>
      new ScatterplotLayer({
        id: 'airports-layer',
        data: airports,
        getPosition: (d: Airport) => [d.longitude, d.latitude],
        getRadius: (d: Airport) => {
          const category = getAirportCategory(d.totalDestinationsCount);
          if (category === 'large') return 80000; // meters
          if (category === 'medium') return 50000;
          return 30000;
        },
        getFillColor: (d: Airport) => {
          const color = getAirportMarkerColor(getAirportCategory(d.totalDestinationsCount));
          // Convert hex to RGB
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          return [r, g, b, 200]; // RGBA
        },
        getLineColor: [255, 255, 255, 255],
        getLineWidth: 1,
        pickable: true,
        onHover: (info) => {
          if (info.object) {
            setHoveredAirport(info.object.iataCode);
          } else {
            setHoveredAirport(null);
          }
        },
        onClick: (info) => {
          if (info.object && onAirportClick) {
            onAirportClick(info.object);
          }
        },
        updateTriggers: {
          getFillColor: [selectedAirport, hoveredAirport],
          getRadius: [selectedAirport],
        },
      }),
    [airports, selectedAirport, hoveredAirport, onAirportClick]
  );

  // Route arcs layer (ArcLayer)
  const routesLayer = useMemo(
    () =>
      new ArcLayer({
        id: 'routes-layer',
        data: routes,
        getSourcePosition: (d: Route) => [d.origin.longitude, d.origin.latitude],
        getTargetPosition: (d: Route) => [d.destination.longitude, d.destination.latitude],
        getSourceColor: (d: Route) => {
          const color = getRouteLineColor({
            alliance: colorMode === 'alliance' ? d.alliance : undefined,
            jetlagScore: colorMode === 'jetlag' ? d.jetlagScore : undefined,
          });
          // Convert hex to RGBA
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          return [r, g, b, 100];
        },
        getTargetColor: (d: Route) => {
          const color = getRouteLineColor({
            alliance: colorMode === 'alliance' ? d.alliance : undefined,
            jetlagScore: colorMode === 'jetlag' ? d.jetlagScore : undefined,
          });
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          return [r, g, b, 100];
        },
        getWidth: (d: Route) => {
          // Thicker lines for more frequent routes
          if (d.frequencyPerWeek && d.frequencyPerWeek >= 14) return 2;
          return 1.5;
        },
        pickable: true,
        onClick: (info) => {
          if (info.object && onRouteClick) {
            onRouteClick(info.object);
          }
        },
        greatCircle: true, // Enable great circle rendering
      }),
    [routes, colorMode, onRouteClick]
  );

  const layers = [routesLayer, airportLayer];

  return (
    <div className="relative w-full h-full">
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState as MapViewState)}
        controller={true}
        layers={layers}
        getCursor={({ isDragging, isHovering }) =>
          isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab'
        }
      >
        <Map
          mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
          mapStyle="mapbox://styles/mapbox/light-v11"
          attributionControl={false}
        />
      </DeckGL>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg">
        <div className="text-sm font-semibold mb-2">Airport Size</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#2196F3]"></div>
            <span className="text-xs">Major Hub (30+ destinations)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FFC107]"></div>
            <span className="text-xs">Regional Hub (7-30 destinations)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#F44336]"></div>
            <span className="text-xs">Small Airport (&lt;7 destinations)</span>
          </div>
        </div>

        {colorMode === 'jetlag' && (
          <>
            <div className="text-sm font-semibold mt-4 mb-2">Jetlag Score</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-[#51cf66]"></div>
                <span className="text-xs">Low (1-3)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-[#ffd43b]"></div>
                <span className="text-xs">Moderate (4-5)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-[#ff922b]"></div>
                <span className="text-xs">High (6-7)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-[#ff6b6b]"></div>
                <span className="text-xs">Severe (8-10)</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg">
        <div className="text-sm font-semibold mb-2">Color By</div>
        <div className="space-y-1">
          <button
            className={`block w-full text-left px-2 py-1 text-xs rounded ${
              colorMode === 'default' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
            }`}
            onClick={() => {/* TODO: Change color mode */}}
          >
            Default
          </button>
          <button
            className={`block w-full text-left px-2 py-1 text-xs rounded ${
              colorMode === 'jetlag' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
            }`}
            onClick={() => {/* TODO: Change color mode */}}
          >
            Jetlag Score
          </button>
          <button
            className={`block w-full text-left px-2 py-1 text-xs rounded ${
              colorMode === 'alliance' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
            }`}
            onClick={() => {/* TODO: Change color mode */}}
          >
            Alliance
          </button>
        </div>
      </div>
    </div>
  );
}
