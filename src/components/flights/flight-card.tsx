"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plane, Clock, ArrowRight, TrendingUp, AlertCircle, ChevronDown, ChevronUp, MoreVertical, Pencil, Trash2, Download } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getTimezoneOffsetDifference,
  getTravelDirection,
  calculateJetLagSeverity,
  calculatePersonalizedRecoveryDays,
  UserProfile,
} from "@/lib/utils/jetlag";
import Link from "next/link";

interface Flight {
  id: string;
  flightNumber?: string;
  airline?: string;
  originAirportCode: string;
  originCity: string;
  originTimezone: string;
  destinationAirportCode: string;
  destinationCity: string;
  destinationTimezone: string;
  departureTime: string;
  arrivalTime: string;
  duration?: number;
  status: string;
  sleepQualityOverride?: string;
  adaptabilityOverride?: string;
}

interface FlightCardProps {
  flight: Flight;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function FlightCard({ flight, onDelete, onEdit }: FlightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloadingCalendar, setDownloadingCalendar] = useState(false);
  const { toast } = useToast();

  const handleDownloadCalendar = async () => {
    setDownloadingCalendar(true);
    try {
      const response = await fetch(`/api/flights/${flight.id}/calendar`);
      if (!response.ok) throw new Error('Failed to download calendar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jetlag-plan-${flight.originAirportCode}-${flight.destinationAirportCode}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Calendar downloaded",
        description: "Import this file into your calendar app to follow your jetlag recovery plan.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download calendar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingCalendar(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/flights?id=${flight.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Flight deleted",
          description: "The flight has been removed successfully.",
        });
        onDelete?.();
      } else {
        throw new Error("Failed to delete flight");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete flight. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const departureDate = new Date(flight.departureTime);
  const arrivalDate = new Date(flight.arrivalTime);

  // Calculate jet lag metrics
  const timezonesDiff = getTimezoneOffsetDifference(
    flight.originTimezone,
    flight.destinationTimezone
  );

  const direction = getTravelDirection(0, timezonesDiff); // Simplified for demo

  const userProfile: UserProfile = {
    sleepQuality: flight.sleepQualityOverride as any,
    adaptabilityLevel: flight.adaptabilityOverride as any,
  };

  const flightDuration = flight.duration ? flight.duration / 60 : 8; // Convert to hours

  const jetLagSeverity = calculateJetLagSeverity(
    timezonesDiff,
    direction,
    flightDuration,
    userProfile
  );

  const recoveryDays = calculatePersonalizedRecoveryDays(
    timezonesDiff,
    direction,
    userProfile
  );

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "minimal":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "mild":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "moderate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case "severe":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100";
      case "very severe":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">
                  {flight.originAirportCode} → {flight.destinationAirportCode}
                </CardTitle>
              </div>
              {flight.airline && (
                <CardDescription>
                  {flight.airline} {flight.flightNumber && `• ${flight.flightNumber}`}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={getSeverityColor(jetLagSeverity.severity)}
              >
                {jetLagSeverity.severity}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={onEdit}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Flight
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Flight
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

      <CardContent className="space-y-4">
        {/* Flight Route */}
        <div className="flex items-center justify-between text-sm">
          <div>
            <div className="font-semibold">{flight.originCity}</div>
            <div className="text-muted-foreground">
              {formatDateTime(departureDate)}
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="text-right">
            <div className="font-semibold">{flight.destinationCity}</div>
            <div className="text-muted-foreground">
              {formatDateTime(arrivalDate)}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="text-center p-2 bg-muted/50 rounded">
            <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">Duration</div>
            <div className="text-sm font-semibold">
              {flight.duration ? `${Math.floor(Math.abs(flight.duration) / 60)}h ${Math.abs(flight.duration) % 60}m` : "N/A"}
            </div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">Time Diff</div>
            <div className="text-sm font-semibold">{Math.round(timezonesDiff)}h</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <AlertCircle className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">Recovery</div>
            <div className="text-sm font-semibold">{recoveryDays}d</div>
          </div>
        </div>

        {/* Expandable Section */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="w-full"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                View Recovery Plan
              </>
            )}
          </Button>

          {expanded && (
            <div className="mt-4 space-y-3 p-4 bg-muted/30 rounded-lg">
              <div>
                <h4 className="font-semibold text-sm mb-2">Jet Lag Assessment</h4>
                <p className="text-sm text-muted-foreground">
                  {jetLagSeverity.description}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">Severity Score:</div>
                  <div className="text-sm font-semibold">
                    {jetLagSeverity.score}/10
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">
                  Personalized Recovery Plan
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Estimated recovery: {recoveryDays} days</li>
                  <li>
                    • Travel direction: {direction === "east" ? "Eastward (harder)" : "Westward (easier)"}
                  </li>
                  {flight.sleepQualityOverride && (
                    <li>• Sleep quality: {flight.sleepQualityOverride}</li>
                  )}
                  {flight.adaptabilityOverride && (
                    <li>• Adaptability: {flight.adaptabilityOverride}</li>
                  )}
                </ul>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Link
                  href={`/flights/${flight.id}`}
                  className="text-primary hover:underline text-sm font-medium"
                >
                  View Full Recovery Timeline →
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadCalendar}
                  disabled={downloadingCalendar}
                  className="ml-auto gap-2"
                >
                  <Download className="h-3 w-3" />
                  {downloadingCalendar ? 'Downloading...' : 'Calendar'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Flight?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this flight from {flight.originAirportCode} to{" "}
              {flight.destinationAirportCode}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
