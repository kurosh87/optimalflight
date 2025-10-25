'use client';

/**
 * Affiliate Button Component
 * Tracks clicks and redirects to Kiwi.com via Travelpayouts
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateAffiliateLink } from '@/lib/affiliate/kiwi-deep-links';
import { Loader2, ExternalLink } from 'lucide-react';

interface AffiliateButtonProps {
  flight: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    price: number;
    currency: string;
    airline?: string;
    flightNumber?: string;
  };
  className?: string;
  children?: React.ReactNode;
}

export default function AffiliateButton({
  flight,
  className,
  children = 'Book on Kiwi.com',
}: AffiliateButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);

    try {
      // Track click in database
      const response = await fetch('/api/affiliate/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliate: 'kiwi',
          flightId: flight.flightNumber || `${flight.origin}-${flight.destination}`,
          origin: flight.origin,
          destination: flight.destination,
          price: flight.price,
          currency: flight.currency,
          metadata: {
            airline: flight.airline,
            departureDate: flight.departureDate,
            returnDate: flight.returnDate,
          },
        }),
      });

      const data = await response.json();
      const clickId = data.clickId;

      // Generate affiliate link with click ID
      const affiliateLink = generateAffiliateLink(
        {
          from: flight.origin,
          to: flight.destination,
          departure: flight.departureDate,
          return: flight.returnDate,
        },
        clickId
      );

      // Redirect to affiliate site
      window.open(affiliateLink, '_blank');
    } catch (error) {
      console.error('Error tracking affiliate click:', error);
      // Still redirect even if tracking fails
      const fallbackLink = generateAffiliateLink(
        {
          from: flight.origin,
          to: flight.destination,
          departure: flight.departureDate,
          return: flight.returnDate,
        },
        'fallback'
      );
      window.open(fallbackLink, '_blank');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          {children}
          <ExternalLink className="h-4 w-4 ml-2" />
        </>
      )}
    </Button>
  );
}
