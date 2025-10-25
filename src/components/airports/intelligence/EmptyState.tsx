/**
 * Empty State Component
 * Displays friendly message when no intelligence data is available
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

interface EmptyStateProps {
  airportCode: string;
  airportName: string;
}

export function EmptyState({ airportCode, airportName }: EmptyStateProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          No Jetlag Recovery Data Available
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          We don&apos;t have detailed jetlag recovery facility information for {airportName} ({airportCode}) yet.
        </p>

        <div className="bg-muted p-4 rounded-lg space-y-2">
          <p className="font-medium">General Recovery Tips:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Look for quiet seating areas away from main terminals</li>
            <li>Seek natural light exposure during layovers</li>
            <li>Check airline lounges for shower facilities</li>
            <li>Ask information desk about rest zones</li>
            <li>Stay hydrated and avoid heavy meals</li>
          </ul>
        </div>

        <p className="text-sm text-muted-foreground">
          Detailed facility data is primarily available for major international hubs and frequently traveled airports.
        </p>
      </CardContent>
    </Card>
  );
}
