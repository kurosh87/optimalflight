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
import { Plus, Plane, Loader2 } from "lucide-react";
import { AIRPORTS } from "@/lib/data/airports";
import { useToast } from "@/hooks/use-toast";

interface AddFlightDialogProps {
  onFlightAdded?: () => void;
}

export function AddFlightDialog({ onFlightAdded }: AddFlightDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Flight details
  const [flightNumber, setFlightNumber] = useState("");
  const [airline, setAirline] = useState("");

  // Origin
  const [originAirportCode, setOriginAirportCode] = useState("");

  // Destination
  const [destinationAirportCode, setDestinationAirportCode] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const originAirport = AIRPORTS.find((a) => a.code === originAirportCode);
      const destinationAirport = AIRPORTS.find(
        (a) => a.code === destinationAirportCode
      );

      if (!originAirport || !destinationAirport) {
        toast({
          title: "Invalid Airports",
          description: "Please select valid origin and destination airports from the list.",
          variant: "destructive",
        });
        setLoading(false);
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
      setOriginAirportCode("");
      setDestinationAirportCode("");
      setDepartureDate("");
      setDepartureTime("");
      setArrivalDate("");
      setArrivalTime("");
      setSleepQualityOverride("");
      setAdaptabilityOverride("");
      setOpen(false);

      if (onFlightAdded) {
        onFlightAdded();
      }
    } catch (error) {
      console.error("Error adding flight:", error);
      toast({
        title: "Error Adding Flight",
        description: error instanceof Error ? error.message : "Failed to add flight. Please try again.",
        variant: "destructive",
      });
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-primary" />
            Add New Flight
          </DialogTitle>
          <DialogDescription>
            Add your flight details to get a personalized jet lag recovery plan
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Flight Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Flight Information</h3>
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

            {/* Route */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Route</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin">From (Origin) *</Label>
                  <Select
                    value={originAirportCode}
                    onValueChange={setOriginAirportCode}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select airport" />
                    </SelectTrigger>
                    <SelectContent>
                      {AIRPORTS.map((airport) => (
                        <SelectItem key={airport.code} value={airport.code}>
                          {airport.code} - {airport.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">To (Destination) *</Label>
                  <Select
                    value={destinationAirportCode}
                    onValueChange={setDestinationAirportCode}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select airport" />
                    </SelectTrigger>
                    <SelectContent>
                      {AIRPORTS.map((airport) => (
                        <SelectItem key={airport.code} value={airport.code}>
                          {airport.code} - {airport.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Departure */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Departure *</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departureDate">Date</Label>
                  <Input
                    id="departureDate"
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    required
                  />
                </div>
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
