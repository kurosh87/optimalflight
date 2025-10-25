"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Plane, Loader2, Search } from "lucide-react";
import { AirportAutocomplete } from "./airport-autocomplete";
import { parseDuration } from "@/lib/amadeus";

interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  latitude: number;
  longitude: number;
}

interface AddFlightDialogAmadeusProps {
  onFlightAdded?: () => void;
}

export function AddFlightDialogAmadeus({ onFlightAdded }: AddFlightDialogAmadeusProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchingFlights, setSearchingFlights] = useState(false);

  // Flight details
  const [flightNumber, setFlightNumber] = useState("");
  const [airline, setAirline] = useState("");

  // Origin & Destination
  const [originAirport, setOriginAirport] = useState<Airport | null>(null);
  const [destinationAirport, setDestinationAirport] = useState<Airport | null>(null);

  // Times
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");

  // User preferences from settings
  const [userPreferences, setUserPreferences] = useState<any>(null);

  // Flight-specific overrides
  const [sleepQualityOverride, setSleepQualityOverride] = useState<string>("");
  const [adaptabilityOverride, setAdaptabilityOverride] = useState<string>("");

  // Flight search results
  const [flightOffers, setFlightOffers] = useState<any[]>([]);
  const [showFlightOffers, setShowFlightOffers] = useState(false);

  // Fetch user preferences when dialog opens
  useEffect(() => {
    if (open) {
      fetchUserPreferences();
    }
  }, [open]);

  const fetchUserPreferences = async () => {
    try {
      const response = await fetch("/api/preferences");
      if (response.ok) {
        const data = await response.json();
        setUserPreferences(data);
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    }
  };

  const handleSearchFlights = async () => {
    if (!originAirport || !destinationAirport || !departureDate) {
      alert("Please select origin, destination, and departure date");
      return;
    }

    setSearchingFlights(true);
    try {
      const response = await fetch(
        `/api/amadeus/flights?origin=${originAirport.code}&destination=${destinationAirport.code}&departureDate=${departureDate}&max=5`
      );

      if (response.ok) {
        const data = await response.json();
        setFlightOffers(data.flights || []);
        setShowFlightOffers(true);
      }
    } catch (error) {
      console.error("Error searching flights:", error);
      alert("Failed to search flights. Please enter details manually.");
    } finally {
      setSearchingFlights(false);
    }
  };

  const handleSelectFlightOffer = (offer: any) => {
    setFlightNumber(offer.flightNumber);
    setAirline(offer.airline);

    // Parse departure and arrival times
    const departure = new Date(offer.departureTime);
    const arrival = new Date(offer.arrivalTime);

    setDepartureDate(departure.toISOString().split('T')[0]);
    setDepartureTime(departure.toTimeString().slice(0, 5));
    setArrivalDate(arrival.toISOString().split('T')[0]);
    setArrivalTime(arrival.toTimeString().slice(0, 5));

    setShowFlightOffers(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!originAirport || !destinationAirport) {
        alert("Please select valid airports");
        return;
      }

      const departureDateTime = new Date(`${departureDate}T${departureTime}`);
      const arrivalDateTime = new Date(`${arrivalDate}T${arrivalTime}`);

      // Calculate duration in minutes
      const durationMs = arrivalDateTime.getTime() - departureDateTime.getTime();
      const durationMinutes = Math.round(durationMs / (1000 * 60));

      const response = await fetch("/api/flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flightNumber: flightNumber || null,
          airline: airline || null,
          originAirportCode: originAirport.code,
          originCity: originAirport.city,
          originTimezone: originAirport.timezone,
          destinationAirportCode: destinationAirport.code,
          destinationCity: destinationAirport.city,
          destinationTimezone: destinationAirport.timezone,
          departureTime: departureDateTime.toISOString(),
          arrivalTime: arrivalDateTime.toISOString(),
          duration: durationMinutes,
          sleepQualityOverride: sleepQualityOverride || null,
          adaptabilityOverride: adaptabilityOverride || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to add flight");

      // Reset form
      setFlightNumber("");
      setAirline("");
      setOriginAirport(null);
      setDestinationAirport(null);
      setDepartureDate("");
      setDepartureTime("");
      setArrivalDate("");
      setArrivalTime("");
      setSleepQualityOverride("");
      setAdaptabilityOverride("");
      setFlightOffers([]);
      setShowFlightOffers(false);
      setOpen(false);

      if (onFlightAdded) {
        onFlightAdded();
      }
    } catch (error) {
      console.error("Error adding flight:", error);
      alert("Failed to add flight. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Flight
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-primary" />
            Add New Flight
          </DialogTitle>
          <DialogDescription>
            Search for flights or enter details manually to get a personalized jet lag recovery plan
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Route Selection with Amadeus Search */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Route *</h3>
              <div className="grid grid-cols-2 gap-4">
                <AirportAutocomplete
                  label="From (Origin)"
                  value={originAirport ? `${originAirport.code} - ${originAirport.city}` : ""}
                  onSelect={setOriginAirport}
                  required
                  placeholder="Search origin airport..."
                />
                <AirportAutocomplete
                  label="To (Destination)"
                  value={destinationAirport ? `${destinationAirport.code} - ${destinationAirport.city}` : ""}
                  onSelect={setDestinationAirport}
                  required
                  placeholder="Search destination airport..."
                />
              </div>
            </div>

            {/* Departure Date for Flight Search */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Departure Date *</h3>
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSearchFlights}
                  disabled={searchingFlights || !originAirport || !destinationAirport || !departureDate}
                  className="gap-2"
                >
                  {searchingFlights ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Search Flights
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Flight Offers */}
            {showFlightOffers && flightOffers.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Available Flights</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                  {flightOffers.map((offer, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectFlightOffer(offer)}
                      className="w-full p-3 text-left hover:bg-accent rounded-md border"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold">{offer.flightNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(offer.departureTime).toLocaleTimeString()} → {new Date(offer.arrivalTime).toLocaleTimeString()}
                          </div>
                        </div>
                        {offer.price && (
                          <div className="text-sm font-semibold">
                            {offer.price.currency} {offer.price.amount}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Flight Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Flight Information (Optional)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="airline">Airline</Label>
                  <Input
                    id="airline"
                    value={airline}
                    onChange={(e) => setAirline(e.target.value)}
                    placeholder="e.g., United Airlines"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flightNumber">Flight Number</Label>
                  <Input
                    id="flightNumber"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    placeholder="e.g., UA123"
                  />
                </div>
              </div>
            </div>

            {/* Departure Time */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Departure Time *</h3>
              <div className="space-y-2">
                <Label htmlFor="departureTime">Time</Label>
                <Input
                  id="departureTime"
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Arrival */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Arrival *</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="arrivalDate">Date</Label>
                  <Input
                    id="arrivalDate"
                    type="date"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arrivalTime">Time</Label>
                  <Input
                    id="arrivalTime"
                    type="time"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Personal Factors */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">
                Personal Factors Override (optional)
              </h3>
              <p className="text-xs text-muted-foreground">
                Leave empty to use your default preferences from settings
                {userPreferences && (
                  <> (Sleep: {userPreferences.sleepQuality}, Adaptability:{" "}
                  {userPreferences.adaptabilityLevel})</>
                )}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sleepQuality">Sleep Quality Override</Label>
                  <Select
                    value={sleepQualityOverride}
                    onValueChange={setSleepQualityOverride}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          userPreferences?.sleepQuality
                            ? `Default: ${userPreferences.sleepQuality}`
                            : "Use default"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="excellent">Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adaptability">Adaptability Override</Label>
                  <Select
                    value={adaptabilityOverride}
                    onValueChange={setAdaptabilityOverride}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          userPreferences?.adaptabilityLevel
                            ? `Default: ${userPreferences.adaptabilityLevel}`
                            : "Use default"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Flight"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
