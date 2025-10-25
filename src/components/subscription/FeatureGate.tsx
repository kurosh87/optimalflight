'use client';

/**
 * Feature Gate Component
 * Wraps premium features with upgrade prompts
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Zap, Crown } from 'lucide-react';
import Link from 'next/link';

interface FeatureGateProps {
  feature: string;
  tier: 'free' | 'pro' | 'expert' | 'enterprise';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  blur?: boolean;
}

export default function FeatureGate({
  feature,
  tier,
  children,
  fallback,
  blur = true,
}: FeatureGateProps) {
  const [hasAccess, setHasAccess] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Check user's subscription tier
    // For now, assume free tier
    setHasAccess(false);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-20 rounded"></div>;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  const tierBadge = tier === 'pro' ? (
    <Badge className="bg-primary-500 text-white">
      <Zap className="h-3 w-3 mr-1" />
      Pro
    </Badge>
  ) : tier === 'expert' ? (
    <Badge className="bg-yellow-500 text-white">
      <Crown className="h-3 w-3 mr-1" />
      Expert
    </Badge>
  ) : null;

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <>
      <div className="relative">
        {/* Blurred preview */}
        <div className={blur ? 'filter blur-sm pointer-events-none select-none' : 'opacity-50 pointer-events-none'}>
          {children}
        </div>

        {/* Unlock overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="text-center p-6">
            <Lock className="h-12 w-12 text-primary-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
            {tierBadge && <div className="mb-3">{tierBadge}</div>}
            <p className="text-gray-600 mb-4 max-w-sm">
              Upgrade to {tier.charAt(0).toUpperCase() + tier.slice(1)} to unlock {feature}
            </p>
            <Button
              onClick={() => setShowUpgrade(true)}
              className="bg-primary-500 hover:bg-primary-600 text-white"
            >
              Unlock Feature
            </Button>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock {feature}</DialogTitle>
            <DialogDescription>
              This feature requires {tier.charAt(0).toUpperCase() + tier.slice(1)} tier
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                What you get with {tier.charAt(0).toUpperCase() + tier.slice(1)}:
              </h4>
              <ul className="space-y-2 text-sm text-blue-800">
                {tier === 'pro' && (
                  <>
                    <li>✓ Unlimited searches</li>
                    <li>✓ Alliance filtering</li>
                    <li>✓ Jetlag optimization</li>
                    <li>✓ 10 price alerts</li>
                    <li>✓ Ad-free experience</li>
                  </>
                )}
                {tier === 'expert' && (
                  <>
                    <li>✓ Everything in Pro</li>
                    <li>✓ Real-time award availability</li>
                    <li>✓ Unlimited alerts</li>
                    <li>✓ API access (100 calls/month)</li>
                    <li>✓ Priority support</li>
                  </>
                )}
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowUpgrade(false)}
                className="flex-1"
              >
                Maybe Later
              </Button>
              <Button
                asChild
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white"
              >
                <Link href="/pricing">
                  View Plans
                </Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
