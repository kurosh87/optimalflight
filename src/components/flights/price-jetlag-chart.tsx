"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  DollarSign,
  Brain,
  Info,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FlightPoint {
  id: string;
  price: number;
  jetlagScore: number;
  isOptimal?: boolean;
  category?: 'best-value' | 'cheapest' | 'best-jetlag' | 'balanced';
  label?: string;
}

interface PriceJetlagChartProps {
  flights: FlightPoint[];
  priceRange: { min: number; max: number };
  jetlagRange: { min: number; max: number };
  highlightedFlightId?: string;
  onFlightClick?: (flightId: string) => void;
  width?: number;
  height?: number;
}

export function PriceJetlagChart({
  flights,
  priceRange,
  jetlagRange,
  highlightedFlightId,
  onFlightClick,
  width = 600,
  height = 400,
}: PriceJetlagChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);

  // Chart dimensions
  const padding = { top: 40, right: 40, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale functions
  const scaleX = (price: number) => {
    const range = priceRange.max - priceRange.min;
    const buffer = range * 0.1; // 10% padding
    return ((price - priceRange.min + buffer) / (range + 2 * buffer)) * chartWidth;
  };

  const scaleY = (score: number) => {
    const range = jetlagRange.max - jetlagRange.min;
    const buffer = range * 0.1; // 10% padding
    return chartHeight - ((score - jetlagRange.min + buffer) / (range + 2 * buffer)) * chartHeight;
  };

  // Generate grid lines
  const xGridLines = useMemo(() => {
    const step = Math.ceil((priceRange.max - priceRange.min) / 5 / 100) * 100;
    const lines = [];
    for (let price = Math.ceil(priceRange.min / step) * step; price <= priceRange.max; price += step) {
      lines.push({
        price,
        x: scaleX(price),
        label: `$${(price / 1000).toFixed(price >= 10000 ? 0 : 1)}k`,
      });
    }
    return lines;
  }, [priceRange.min, priceRange.max]);

  const yGridLines = useMemo(() => {
    const lines = [];
    for (let score = 20; score <= 100; score += 20) {
      lines.push({
        score,
        y: scaleY(score),
        label: score.toString(),
      });
    }
    return lines;
  }, [jetlagRange.min, jetlagRange.max]);

  // Calculate Pareto frontier (flights that are better on both dimensions)
  const paretoFrontier = useMemo(() => {
    const sorted = [...flights].sort((a, b) => a.price - b.price);
    const frontier: FlightPoint[] = [];
    let maxScore = -Infinity;

    for (const flight of sorted) {
      if (flight.jetlagScore > maxScore) {
        frontier.push(flight);
        maxScore = flight.jetlagScore;
      }
    }

    return frontier;
  }, [flights]);

  // Get point style based on category
  const getPointStyle = (flight: FlightPoint) => {
    const isHovered = hoveredPoint === flight.id;
    const isHighlighted = highlightedFlightId === flight.id;

    if (flight.category === 'best-value') {
      return {
        fill: isHovered || isHighlighted ? '#a855f7' : '#c084fc',
        stroke: '#7e22ce',
        strokeWidth: isHovered || isHighlighted ? 3 : 2,
        radius: isHovered || isHighlighted ? 8 : 6,
      };
    }
    if (flight.category === 'cheapest') {
      return {
        fill: isHovered || isHighlighted ? '#22c55e' : '#4ade80',
        stroke: '#16a34a',
        strokeWidth: isHovered || isHighlighted ? 3 : 2,
        radius: isHovered || isHighlighted ? 8 : 6,
      };
    }
    if (flight.category === 'best-jetlag') {
      return {
        fill: isHovered || isHighlighted ? '#3b82f6' : '#60a5fa',
        stroke: '#2563eb',
        strokeWidth: isHovered || isHighlighted ? 3 : 2,
        radius: isHovered || isHighlighted ? 8 : 6,
      };
    }
    if (flight.category === 'balanced') {
      return {
        fill: isHovered || isHighlighted ? '#f59e0b' : '#fbbf24',
        stroke: '#d97706',
        strokeWidth: isHovered || isHighlighted ? 3 : 2,
        radius: isHovered || isHighlighted ? 8 : 6,
      };
    }

    // Regular flight
    return {
      fill: isHovered || isHighlighted ? '#94a3b8' : '#cbd5e1',
      stroke: '#64748b',
      strokeWidth: isHovered || isHighlighted ? 2 : 1,
      radius: isHovered || isHighlighted ? 6 : 4,
    };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Price vs Jetlag Tradeoff
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Find the sweet spot between cost and recovery time
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              <CircleDot className="h-3 w-3 mr-1 text-purple-500" />
              Best Value
            </Badge>
            <Badge variant="outline" className="text-xs">
              <CircleDot className="h-3 w-3 mr-1 text-green-500" />
              Cheapest
            </Badge>
            <Badge variant="outline" className="text-xs">
              <CircleDot className="h-3 w-3 mr-1 text-blue-500" />
              Best Jetlag
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-x-auto">
          <svg
            width={width}
            height={height}
            className="mx-auto"
            style={{ maxWidth: '100%', height: 'auto' }}
          >
            {/* Background */}
            <rect
              x={padding.left}
              y={padding.top}
              width={chartWidth}
              height={chartHeight}
              fill="currentColor"
              className="fill-muted/10"
            />

            {/* Grid lines - Vertical */}
            {xGridLines.map((line, i) => (
              <g key={`x-grid-${i}`}>
                <line
                  x1={padding.left + line.x}
                  y1={padding.top}
                  x2={padding.left + line.x}
                  y2={padding.top + chartHeight}
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  className="stroke-muted-foreground/20"
                />
                <text
                  x={padding.left + line.x}
                  y={padding.top + chartHeight + 20}
                  textAnchor="middle"
                  className="fill-muted-foreground text-xs"
                >
                  {line.label}
                </text>
              </g>
            ))}

            {/* Grid lines - Horizontal */}
            {yGridLines.map((line, i) => (
              <g key={`y-grid-${i}`}>
                <line
                  x1={padding.left}
                  y1={padding.top + line.y}
                  x2={padding.left + chartWidth}
                  y2={padding.top + line.y}
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  className="stroke-muted-foreground/20"
                />
                <text
                  x={padding.left - 10}
                  y={padding.top + line.y + 4}
                  textAnchor="end"
                  className="fill-muted-foreground text-xs"
                >
                  {line.label}
                </text>
              </g>
            ))}

            {/* Pareto frontier line */}
            {paretoFrontier.length > 1 && (
              <path
                d={paretoFrontier
                  .map((flight, i) => {
                    const x = padding.left + scaleX(flight.price);
                    const y = padding.top + scaleY(flight.jetlagScore);
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ')}
                stroke="currentColor"
                strokeWidth={2}
                fill="none"
                strokeDasharray="6 3"
                className="stroke-primary/30"
              />
            )}

            {/* Flight points */}
            {flights.map((flight) => {
              const x = padding.left + scaleX(flight.price);
              const y = padding.top + scaleY(flight.jetlagScore);
              const style = getPointStyle(flight);

              return (
                <g key={flight.id}>
                  {/* Hover/highlight ring */}
                  {(hoveredPoint === flight.id || highlightedFlightId === flight.id) && (
                    <circle
                      cx={x}
                      cy={y}
                      r={style.radius + 4}
                      fill="none"
                      stroke={style.stroke}
                      strokeWidth={1}
                      opacity={0.3}
                    />
                  )}

                  {/* Main point */}
                  <circle
                    cx={x}
                    cy={y}
                    r={style.radius}
                    fill={style.fill}
                    stroke={style.stroke}
                    strokeWidth={style.strokeWidth}
                    className={cn(
                      "transition-all duration-200 cursor-pointer",
                      onFlightClick && "hover:opacity-80"
                    )}
                    onMouseEnter={() => setHoveredPoint(flight.id)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    onClick={() => onFlightClick?.(flight.id)}
                  />

                  {/* Label for special points */}
                  {flight.category && (hoveredPoint === flight.id || highlightedFlightId === flight.id) && (
                    <g>
                      <rect
                        x={x - 40}
                        y={y - style.radius - 28}
                        width={80}
                        height={20}
                        rx={4}
                        fill="currentColor"
                        className="fill-background"
                        stroke={style.stroke}
                        strokeWidth={1}
                      />
                      <text
                        x={x}
                        y={y - style.radius - 14}
                        textAnchor="middle"
                        className="fill-foreground text-xs font-medium"
                      >
                        ${flight.price.toLocaleString()}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Axes */}
            <line
              x1={padding.left}
              y1={padding.top + chartHeight}
              x2={padding.left + chartWidth}
              y2={padding.top + chartHeight}
              stroke="currentColor"
              strokeWidth={2}
              className="stroke-foreground"
            />
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={padding.top + chartHeight}
              stroke="currentColor"
              strokeWidth={2}
              className="stroke-foreground"
            />

            {/* Axis labels */}
            <text
              x={padding.left + chartWidth / 2}
              y={height - 10}
              textAnchor="middle"
              className="fill-foreground text-sm font-medium"
            >
              <tspan>Price</tspan>
              <tspan className="fill-muted-foreground text-xs"> (USD)</tspan>
            </text>
            <text
              x={20}
              y={padding.top + chartHeight / 2}
              textAnchor="middle"
              transform={`rotate(-90, 20, ${padding.top + chartHeight / 2})`}
              className="fill-foreground text-sm font-medium"
            >
              <tspan>Jetlag Score</tspan>
              <tspan className="fill-muted-foreground text-xs"> (0-100)</tspan>
            </text>

            {/* Legend: Optimal zone indicator */}
            <g transform={`translate(${padding.left + chartWidth - 140}, ${padding.top + 10})`}>
              <rect
                width={130}
                height={50}
                rx={4}
                fill="currentColor"
                className="fill-background/80"
                stroke="currentColor"
                strokeWidth={1}
                className="stroke-border"
              />
              <text x={10} y={18} className="fill-foreground text-xs font-medium">
                Optimal Zone
              </text>
              <text x={10} y={32} className="fill-muted-foreground text-xs">
                Higher score
              </text>
              <text x={10} y={44} className="fill-muted-foreground text-xs">
                Lower price
              </text>
              <path
                d="M 105 15 L 115 25 L 105 35 M 115 25 L 95 25"
                stroke="currentColor"
                strokeWidth={2}
                fill="none"
                className="stroke-primary"
              />
            </g>
          </svg>
        </div>

        {/* Info footer */}
        <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border">
          <div className="flex items-start gap-2 text-sm">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-muted-foreground">
                <strong className="text-foreground">Top-left is optimal:</strong> High jetlag score (better recovery) with lower price.
              </p>
              <p className="text-muted-foreground text-xs">
                The dashed line shows the Pareto frontier - flights that aren't dominated by any other option.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
