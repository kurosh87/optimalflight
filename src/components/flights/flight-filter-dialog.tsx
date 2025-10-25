"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter, Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export interface FlightFilters {
  dateFrom?: Date;
  dateTo?: Date;
  airline?: string;
  aircraft?: string;
  origin?: string;
  destination?: string;
  minDistance?: number;
  maxDistance?: number;
}

interface FlightFilterDialogProps {
  filters: FlightFilters;
  onFiltersChange: (filters: FlightFilters) => void;
  airlines: string[];
  aircraft: string[];
  airports: string[];
}

export function FlightFilterDialog({
  filters,
  onFiltersChange,
  airlines,
  aircraft,
  airports,
}: FlightFilterDialogProps) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FlightFilters>(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleReset = () => {
    const emptyFilters: FlightFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const activeFilterCount = Object.keys(filters).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge
              variant="default"
              className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filter Flights</DialogTitle>
          <DialogDescription>
            Refine your flight history with advanced filtering options
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Date Range */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Date Range</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date-from">From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date-from"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.dateFrom ? (
                        format(localFilters.dateFrom, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.dateFrom}
                      onSelect={(date) =>
                        setLocalFilters({ ...localFilters, dateFrom: date })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-to">To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date-to"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.dateTo ? (
                        format(localFilters.dateTo, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={localFilters.dateTo}
                      onSelect={(date) =>
                        setLocalFilters({ ...localFilters, dateTo: date })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Airline & Aircraft */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="airline">Airline</Label>
              <Select
                value={localFilters.airline || "all"}
                onValueChange={(value) =>
                  setLocalFilters({
                    ...localFilters,
                    airline: value === "all" ? undefined : value,
                  })
                }
              >
                <SelectTrigger id="airline">
                  <SelectValue placeholder="All airlines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All airlines</SelectItem>
                  {airlines.map((airline) => (
                    <SelectItem key={airline} value={airline}>
                      {airline}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aircraft">Aircraft</Label>
              <Select
                value={localFilters.aircraft || "all"}
                onValueChange={(value) =>
                  setLocalFilters({
                    ...localFilters,
                    aircraft: value === "all" ? undefined : value,
                  })
                }
              >
                <SelectTrigger id="aircraft">
                  <SelectValue placeholder="All aircraft" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All aircraft</SelectItem>
                  {aircraft.map((ac) => (
                    <SelectItem key={ac} value={ac}>
                      {ac}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Origin & Destination */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origin">Origin Airport</Label>
              <Select
                value={localFilters.origin || "all"}
                onValueChange={(value) =>
                  setLocalFilters({
                    ...localFilters,
                    origin: value === "all" ? undefined : value,
                  })
                }
              >
                <SelectTrigger id="origin">
                  <SelectValue placeholder="All airports" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All airports</SelectItem>
                  {airports.map((airport) => (
                    <SelectItem key={airport} value={airport}>
                      {airport}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">Destination Airport</Label>
              <Select
                value={localFilters.destination || "all"}
                onValueChange={(value) =>
                  setLocalFilters({
                    ...localFilters,
                    destination: value === "all" ? undefined : value,
                  })
                }
              >
                <SelectTrigger id="destination">
                  <SelectValue placeholder="All airports" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All airports</SelectItem>
                  {airports.map((airport) => (
                    <SelectItem key={airport} value={airport}>
                      {airport}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Distance Range */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Distance Range (km)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-distance">Minimum</Label>
                <Select
                  value={localFilters.minDistance?.toString() || "all"}
                  onValueChange={(value) =>
                    setLocalFilters({
                      ...localFilters,
                      minDistance: value === "all" ? undefined : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger id="min-distance">
                    <SelectValue placeholder="No minimum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">No minimum</SelectItem>
                    <SelectItem value="500">500 km (Short-haul)</SelectItem>
                    <SelectItem value="1500">1,500 km (Medium-haul)</SelectItem>
                    <SelectItem value="4000">4,000 km (Long-haul)</SelectItem>
                    <SelectItem value="8000">8,000 km (Ultra long-haul)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-distance">Maximum</Label>
                <Select
                  value={localFilters.maxDistance?.toString() || "all"}
                  onValueChange={(value) =>
                    setLocalFilters({
                      ...localFilters,
                      maxDistance: value === "all" ? undefined : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger id="max-distance">
                    <SelectValue placeholder="No maximum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">No maximum</SelectItem>
                    <SelectItem value="1500">1,500 km (Short-haul)</SelectItem>
                    <SelectItem value="4000">4,000 km (Medium-haul)</SelectItem>
                    <SelectItem value="8000">8,000 km (Long-haul)</SelectItem>
                    <SelectItem value="15000">15,000 km (Ultra long-haul)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReset}>
            <X className="mr-2 h-4 w-4" />
            Reset All
          </Button>
          <Button onClick={handleApply}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
