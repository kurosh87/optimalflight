"use client";

import { Airport } from "@/lib/data/airports";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plane, MapPin, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

interface AirportCardProps {
  airport: Airport;
}

export function AirportCard({ airport }: AirportCardProps) {
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString("en-US", {
        timeZone: airport.timezone,
        hour: "2-digit",
        minute: "2-digit",
      });
      setCurrentTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [airport.timezone]);

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">{airport.code}</CardTitle>
            </div>
            <CardDescription className="line-clamp-1">
              {airport.name}
            </CardDescription>
          </div>
          <Badge variant="secondary">{airport.country}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{airport.city}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="font-mono font-semibold text-foreground">
              {currentTime}
            </span>
          </div>
        </div>

        {airport.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {airport.description}
          </p>
        )}

        <Link href={`/airports/${airport.code.toLowerCase()}`}>
          <Button
            variant="outline"
            className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          >
            View Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
