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
import { Plus, Plane, Loader2, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AirportAutocomplete } from "./airport-autocomplete";

interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  latitude: number;
  longitude: number;
}

interface AddFlightDialogSimpleProps {
  onFlightAdded?: () => void;
  children?: React.ReactNode;
}

export function AddFlightDialogSimple({ onFlightAdded, children }: AddFlightDialogSimpleProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Quick Lookup Tab
  const [carrierCode, setCarrierCode] = useState("");
  const [flightNum, setFlightNum] = useState("");
  const [flightDate, setFlightDate] = useState("");
  const [lookupResult, setLookupResult] = useState<any>(null);

  // Manual Entry Tab
  const [originAirport, setOriginAirport] = useState<Airport | null>(null);
  const [destinationAirport, setDestinationAirport] = useState<Airport | null>(null);
  const [departureDateTime, setDepartureDateTime] = useState("");
  const [arrivalDateTime, setArrivalDateTime] = useState("");

  const resetForm = () => {
    setCarrierCode("");
    setFlightNum("");
    setFlightDate("");
    setLookupResult(null);
    setOriginAirport(null);
    setDestinationAirport(null);
    setDepartureDateTime("");
    setArrivalDateTime("");
  };

  const handleQuickLookup = async () => {
    if (!carrierCode || !flightNum || !flightDate) {
      alert("Please enter carrier code, flight number, and date");
      return;
    }

    setLookupLoading(true);
    try {
      const response = await fetch(
        `/api/amadeus/flights?carrierCode=${carrierCode.toUpperCase()}&flightNumber=${flightNum}&scheduledDepartureDate=${flightDate}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Flight lookup response:', data);
        if (data.flight) {
          setLookupResult(data.flight);
        } else {
          alert("Flight not found. Please check the details or use manual entry.");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Flight lookup error:', errorData);
        alert("Flight not found. Please check the details or use manual entry.");
      }
    } catch (error) {
      console.error("Error looking up flight:", error);
      alert("Could not look up flight. Please try manual entry.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmitLookup = async () => {
    if (!lookupResult) return;

    setLoading(true);
    try {
      // Fetch airport details for origin and destination
      const [originRes, destRes] = await Promise.all([
        fetch(`/api/amadeus/airports?code=${lookupResult.origin}`),
        fetch(`/api/amadeus/airports?code=${lookupResult.destination}`)
      ]);

      const originData = await originRes.json();
      const destData = await destRes.json();

      const origin = originData.airport;
      const destination = destData.airport;

      if (!origin || !destination) {
        alert("Could not retrieve airport details");
        return;
      }

      const departureTime = new Date(lookupResult.departureTime);
      const arrivalTime = new Date(lookupResult.arrivalTime);
      const durationMs = arrivalTime.getTime() - departureTime.getTime();
      const durationMinutes = Math.round(durationMs / (1000 * 60));

      const response = await fetch("/api/flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flightNumber: lookupResult.flightNumber,
          airline: lookupResult.airline,
          originAirportCode: origin.code,
          originCity: origin.city,
          originTimezone: origin.timezone,
          destinationAirportCode: destination.code,
          destinationCity: destination.city,
          destinationTimezone: destination.timezone,
          departureTime: departureTime.toISOString(),
          arrivalTime: arrivalTime.toISOString(),
          duration: durationMinutes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          alert(errorData.error || "You already have this flight added");
          return;
        }
        throw new Error("Failed to add flight");
      }

      resetForm();
      setOpen(false);
      if (onFlightAdded) onFlightAdded();
    } catch (error) {
      console.error("Error adding flight:", error);
      alert("Failed to add flight. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!originAirport || !destinationAirport) {
        alert("Please select origin and destination airports");
        return;
      }

      if (!departureDateTime || !arrivalDateTime) {
        alert("Please enter departure and arrival times");
        return;
      }

      const departureTime = new Date(departureDateTime);
      const arrivalTime = new Date(arrivalDateTime);
      const durationMs = arrivalTime.getTime() - departureTime.getTime();
      const durationMinutes = Math.round(durationMs / (1000 * 60));

      const response = await fetch("/api/flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originAirportCode: originAirport.code,
          originCity: originAirport.city,
          originTimezone: originAirport.timezone,
          destinationAirportCode: destinationAirport.code,
          destinationCity: destinationAirport.city,
          destinationTimezone: destinationAirport.timezone,
          departureTime: departureTime.toISOString(),
          arrivalTime: arrivalTime.toISOString(),
          duration: durationMinutes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          alert(errorData.error || "You already have this flight added");
          return;
        }
        throw new Error("Failed to add flight");
      }

      resetForm();
      setOpen(false);
      if (onFlightAdded) onFlightAdded();
    } catch (error) {
      console.error("Error adding flight:", error);
      alert("Failed to add flight. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Flight
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-primary" />
            Add Flight
          </DialogTitle>
          <DialogDescription>
            Look up your flight or enter details manually
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="lookup" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="lookup">Flight Lookup</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>

          {/* Quick Lookup Tab */}
          <TabsContent value="lookup" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="carrier">Airline Code *</Label>
                  <Input
                    id="carrier"
                    placeholder="e.g., UA, AA, DL"
                    value={carrierCode}
                    onChange={(e) => setCarrierCode(e.target.value.toUpperCase())}
                    maxLength={2}
                  />
                  <p className="text-xs text-muted-foreground">2-letter code</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flightNum">Flight Number *</Label>
                  <Input
                    id="flightNum"
                    placeholder="e.g., 123"
                    value={flightNum}
                    onChange={(e) => setFlightNum(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Departure Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={flightDate}
                  onChange={(e) => setFlightDate(e.target.value)}
                />
              </div>

              <Button
                type="button"
                onClick={handleQuickLookup}
                disabled={lookupLoading || !carrierCode || !flightNum || !flightDate}
                className="w-full gap-2"
              >
                {lookupLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Looking up flight...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Look Up Flight
                  </>
                )}
              </Button>

              {lookupResult && (
                <div className="border rounded-lg p-4 space-y-2 bg-accent/50">
                  <h4 className="font-semibold">Flight Found!</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Flight:</strong> {lookupResult.flightNumber}</p>
                    <p><strong>Route:</strong> {lookupResult.origin} → {lookupResult.destination}</p>
                    <p><strong>Departure:</strong> {new Date(lookupResult.departureTime).toLocaleString()}</p>
                    <p><strong>Arrival:</strong> {new Date(lookupResult.arrivalTime).toLocaleString()}</p>
                    {lookupResult.status && <p><strong>Status:</strong> {lookupResult.status}</p>}
                  </div>
                  <Button
                    onClick={handleSubmitLookup}
                    disabled={loading}
                    className="w-full mt-4"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add This Flight"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Manual Entry Tab */}
          <TabsContent value="manual" className="py-4">
            <form onSubmit={handleSubmitManual} className="space-y-4">
              <div className="space-y-4">
                <AirportAutocomplete
                  label="From"
                  value={originAirport ? `${originAirport.code} - ${originAirport.city}` : ""}
                  onSelect={setOriginAirport}
                  required
                  placeholder="Search origin airport..."
                />

                <AirportAutocomplete
                  label="To"
                  value={destinationAirport ? `${destinationAirport.code} - ${destinationAirport.city}` : ""}
                  onSelect={setDestinationAirport}
                  required
                  placeholder="Search destination airport..."
                />

                <div className="space-y-2">
                  <Label htmlFor="departure">Departure *</Label>
                  <Input
                    id="departure"
                    type="datetime-local"
                    value={departureDateTime}
                    onChange={(e) => setDepartureDateTime(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arrival">Arrival *</Label>
                  <Input
                    id="arrival"
                    type="datetime-local"
                    value={arrivalDateTime}
                    onChange={(e) => setArrivalDateTime(e.target.value)}
                    required
                  />
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
