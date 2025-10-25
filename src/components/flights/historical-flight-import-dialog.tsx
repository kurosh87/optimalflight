"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Plus, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format, parse, isValid } from "date-fns";

interface ParsedFlight {
  flightNumber?: string;
  airline?: string;
  originAirportCode: string;
  destinationAirportCode: string;
  departureDate: string;
  arrivalDate?: string;
  seatNumber?: string;
  bookingReference?: string;
  isValid: boolean;
  errors: string[];
}

interface HistoricalFlightImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

export function HistoricalFlightImportDialog({
  open,
  onOpenChange,
  onImportComplete,
}: HistoricalFlightImportDialogProps) {
  const [activeTab, setActiveTab] = useState<"csv" | "manual">("csv");
  const [parsedFlights, setParsedFlights] = useState<ParsedFlight[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual entry form state
  const [manualFlight, setManualFlight] = useState({
    flightNumber: "",
    airline: "",
    originAirportCode: "",
    destinationAirportCode: "",
    departureDate: "",
    arrivalDate: "",
    seatNumber: "",
    bookingReference: "",
  });

  /**
   * Parse CSV file and extract flight data
   * Expected CSV format:
   * FlightNumber,Airline,Origin,Destination,DepartureDate,ArrivalDate,Seat,BookingRef
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length === 0) {
        toast.error("Empty CSV file");
        return;
      }

      // Parse header row
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const flights: ParsedFlight[] = [];

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());

        if (values.length === 0 || values.every((v) => !v)) {
          continue; // Skip empty rows
        }

        const flight = parseCsvRow(headers, values);
        flights.push(flight);
      }

      setParsedFlights(flights);
      toast.success(`Parsed ${flights.length} flights from CSV`);
    } catch (error) {
      console.error("Error parsing CSV:", error);
      toast.error("Failed to parse CSV file");
    }
  };

  /**
   * Parse a single CSV row into a flight object
   */
  const parseCsvRow = (headers: string[], values: string[]): ParsedFlight => {
    const errors: string[] = [];
    const getField = (fieldNames: string[]) => {
      const index = headers.findIndex((h) =>
        fieldNames.some((name) => h.includes(name))
      );
      return index >= 0 ? values[index] : "";
    };

    const originCode = getField(["origin", "from", "departure"]).toUpperCase();
    const destCode = getField(["destination", "dest", "to", "arrival"]).toUpperCase();
    const departureDate = getField(["departuredate", "depdate", "date", "departure"]);

    // Validate required fields
    if (!originCode || originCode.length !== 3) {
      errors.push("Invalid origin airport code");
    }
    if (!destCode || destCode.length !== 3) {
      errors.push("Invalid destination airport code");
    }
    if (!departureDate) {
      errors.push("Missing departure date");
    }

    // Parse and validate date
    let parsedDate = "";
    if (departureDate) {
      const dateFormats = [
        "yyyy-MM-dd",
        "MM/dd/yyyy",
        "dd/MM/yyyy",
        "yyyy/MM/dd",
        "dd-MM-yyyy",
      ];

      for (const fmt of dateFormats) {
        try {
          const date = parse(departureDate, fmt, new Date());
          if (isValid(date)) {
            parsedDate = format(date, "yyyy-MM-dd");
            break;
          }
        } catch {
          // Try next format
        }
      }

      if (!parsedDate) {
        errors.push("Invalid date format");
      }
    }

    return {
      flightNumber: getField(["flightnumber", "flight", "flightno"]),
      airline: getField(["airline", "carrier"]),
      originAirportCode: originCode,
      destinationAirportCode: destCode,
      departureDate: parsedDate,
      arrivalDate: getField(["arrivaldate", "arrdate"]),
      seatNumber: getField(["seat", "seatnumber"]),
      bookingReference: getField(["booking", "bookingref", "reference", "pnr"]),
      isValid: errors.length === 0,
      errors,
    };
  };

  /**
   * Add manual flight to preview list
   */
  const handleAddManualFlight = () => {
    const errors: string[] = [];

    if (!manualFlight.originAirportCode || manualFlight.originAirportCode.length !== 3) {
      errors.push("Invalid origin airport code");
    }
    if (
      !manualFlight.destinationAirportCode ||
      manualFlight.destinationAirportCode.length !== 3
    ) {
      errors.push("Invalid destination airport code");
    }
    if (!manualFlight.departureDate) {
      errors.push("Missing departure date");
    }

    const flight: ParsedFlight = {
      flightNumber: manualFlight.flightNumber,
      airline: manualFlight.airline,
      originAirportCode: manualFlight.originAirportCode.toUpperCase(),
      destinationAirportCode: manualFlight.destinationAirportCode.toUpperCase(),
      departureDate: manualFlight.departureDate,
      arrivalDate: manualFlight.arrivalDate,
      seatNumber: manualFlight.seatNumber,
      bookingReference: manualFlight.bookingReference,
      isValid: errors.length === 0,
      errors,
    };

    setParsedFlights([...parsedFlights, flight]);

    // Reset form
    setManualFlight({
      flightNumber: "",
      airline: "",
      originAirportCode: "",
      destinationAirportCode: "",
      departureDate: "",
      arrivalDate: "",
      seatNumber: "",
      bookingReference: "",
    });

    toast.success("Flight added to preview");
  };

  /**
   * Remove flight from preview list
   */
  const handleRemoveFlight = (index: number) => {
    setParsedFlights(parsedFlights.filter((_, i) => i !== index));
  };

  /**
   * Import all valid flights
   */
  const handleImport = async () => {
    const validFlights = parsedFlights.filter((f) => f.isValid);

    if (validFlights.length === 0) {
      toast.error("No valid flights to import");
      return;
    }

    setIsImporting(true);

    try {
      const response = await fetch("/api/flights/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flights: validFlights }),
      });

      if (!response.ok) {
        throw new Error("Failed to import flights");
      }

      const data = await response.json();

      toast.success(`Successfully imported ${data.imported} flights!`);
      setParsedFlights([]);
      setSelectedFile(null);
      onImportComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error importing flights:", error);
      toast.error("Failed to import flights");
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * Download CSV template
   */
  const handleDownloadTemplate = () => {
    const template =
      "FlightNumber,Airline,Origin,Destination,DepartureDate,ArrivalDate,Seat,BookingRef\n" +
      "UA123,United,SFO,LHR,2024-01-15,2024-01-16,12A,ABC123\n" +
      "BA456,British Airways,LHR,JFK,2024-02-20,2024-02-20,8C,XYZ789";

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flight-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = parsedFlights.filter((f) => f.isValid).length;
  const invalidCount = parsedFlights.length - validCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Historical Flights</DialogTitle>
          <DialogDescription>
            Add your past flights by uploading a CSV file or entering them manually.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "csv" | "manual")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="csv">
              <Upload className="h-4 w-4 mr-2" />
              CSV Upload
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Plus className="h-4 w-4 mr-2" />
              Manual Entry
            </TabsTrigger>
          </TabsList>

          {/* CSV Upload Tab */}
          <TabsContent value="csv" className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload a CSV file with your flight history
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose CSV File
              </Button>
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            <div className="flex justify-between items-center">
              <Button variant="link" onClick={handleDownloadTemplate} className="p-0">
                Download CSV Template
              </Button>
              <div className="text-sm text-muted-foreground">
                Supported formats: yyyy-MM-dd, MM/dd/yyyy, dd/MM/yyyy
              </div>
            </div>
          </TabsContent>

          {/* Manual Entry Tab */}
          <TabsContent value="manual" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="origin">Origin Airport Code *</Label>
                <Input
                  id="origin"
                  placeholder="e.g., SFO"
                  maxLength={3}
                  value={manualFlight.originAirportCode}
                  onChange={(e) =>
                    setManualFlight({
                      ...manualFlight,
                      originAirportCode: e.target.value.toUpperCase(),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">Destination Airport Code *</Label>
                <Input
                  id="destination"
                  placeholder="e.g., LHR"
                  maxLength={3}
                  value={manualFlight.destinationAirportCode}
                  onChange={(e) =>
                    setManualFlight({
                      ...manualFlight,
                      destinationAirportCode: e.target.value.toUpperCase(),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="departure-date">Departure Date *</Label>
                <Input
                  id="departure-date"
                  type="date"
                  value={manualFlight.departureDate}
                  onChange={(e) =>
                    setManualFlight({ ...manualFlight, departureDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="arrival-date">Arrival Date</Label>
                <Input
                  id="arrival-date"
                  type="date"
                  value={manualFlight.arrivalDate}
                  onChange={(e) =>
                    setManualFlight({ ...manualFlight, arrivalDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="flight-number">Flight Number</Label>
                <Input
                  id="flight-number"
                  placeholder="e.g., UA123"
                  value={manualFlight.flightNumber}
                  onChange={(e) =>
                    setManualFlight({ ...manualFlight, flightNumber: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="airline">Airline</Label>
                <Input
                  id="airline"
                  placeholder="e.g., United Airlines"
                  value={manualFlight.airline}
                  onChange={(e) =>
                    setManualFlight({ ...manualFlight, airline: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seat">Seat Number</Label>
                <Input
                  id="seat"
                  placeholder="e.g., 12A"
                  value={manualFlight.seatNumber}
                  onChange={(e) =>
                    setManualFlight({ ...manualFlight, seatNumber: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="booking">Booking Reference</Label>
                <Input
                  id="booking"
                  placeholder="e.g., ABC123"
                  value={manualFlight.bookingReference}
                  onChange={(e) =>
                    setManualFlight({ ...manualFlight, bookingReference: e.target.value })
                  }
                />
              </div>
            </div>

            <Button onClick={handleAddManualFlight} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Flight to Preview
            </Button>
          </TabsContent>
        </Tabs>

        {/* Preview Table */}
        {parsedFlights.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Preview ({parsedFlights.length} flights)</h3>
              <div className="flex gap-2">
                {validCount > 0 && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {validCount} Valid
                  </Badge>
                )}
                {invalidCount > 0 && (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {invalidCount} Invalid
                  </Badge>
                )}
              </div>
            </div>

            <div className="border rounded-lg max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Flight</TableHead>
                    <TableHead>Seat</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedFlights.map((flight, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {flight.originAirportCode} → {flight.destinationAirportCode}
                      </TableCell>
                      <TableCell>{flight.departureDate || "—"}</TableCell>
                      <TableCell>
                        {flight.flightNumber || "—"}
                        {flight.airline && (
                          <div className="text-xs text-muted-foreground">
                            {flight.airline}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{flight.seatNumber || "—"}</TableCell>
                      <TableCell>
                        {flight.isValid ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Valid
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {flight.errors[0]}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFlight(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting || validCount === 0}
          >
            {isImporting ? "Importing..." : `Import ${validCount} Flight${validCount !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
