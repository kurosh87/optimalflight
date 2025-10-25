'use client';

/**
 * Contextual Upgrade Prompt Modal
 * Shows strategically when user hits limits or aha moments
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Crown, TrendingUp, Check } from 'lucide-react';
import Link from 'next/link';

export type UpgradeTrigger =
  | 'search_limit' // Hit daily search limit
  | 'feature_gate' // Tried to access premium feature
  | 'aha_moment' // Completed 3-5 searches successfully
  | 'alert_limit' // Tried to create 3rd alert on free tier
  | 'value_demonstration'; // Saw high-value flight comparison

interface UpgradePromptProps {
  trigger: UpgradeTrigger;
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  currentTier?: 'free' | 'pro';
}

export default function UpgradePrompt({
  trigger,
  isOpen,
  onClose,
  feature,
  currentTier = 'free',
}: UpgradePromptProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Track that upgrade prompt was shown
      // analytics.trackUpgradePromptShown({ trigger, location: 'modal' });
    }
  }, [isOpen, trigger]);

  const handleClose = () => {
    if (dontShowAgain) {
      // Store in localStorage to not show again for 24 hours
      localStorage.setItem('upgrade_prompt_dismissed', Date.now().toString());
    }
    onClose();
  };

  const getHeadline = () => {
    switch (trigger) {
      case 'search_limit':
        return "You've reached your daily search limit";
      case 'feature_gate':
        return `Unlock ${feature || 'Premium Features'}`;
      case 'aha_moment':
        return "You're getting great value! Want more?";
      case 'alert_limit':
        return 'Get unlimited price alerts';
      case 'value_demonstration':
        return 'Found a great deal? Never miss one again!';
      default:
        return 'Upgrade to Premium';
    }
  };

  const getDescription = () => {
    switch (trigger) {
      case 'search_limit':
        return 'Free users get 10 searches per day. Upgrade for unlimited searches and advanced features.';
      case 'feature_gate':
        return `This feature requires ${currentTier === 'free' ? 'Pro' : 'Expert'} tier. Upgrade to unlock.`;
      case 'aha_moment':
        return "You've done 5 searches! You're clearly serious about finding the best flights. Get unlimited access.";
      case 'alert_limit':
        return 'Free users can create 2 price alerts. Upgrade for unlimited alerts and notifications.';
      case 'value_demonstration':
        return 'Set price alerts to get notified when great deals appear on your favorite routes.';
      default:
        return 'Upgrade to unlock all premium features.';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">{getHeadline()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pro Tier Highlight */}
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-primary-500 text-white">
                <Zap className="h-3 w-3 mr-1" />
                Most Popular
              </Badge>
              <span className="text-2xl font-bold text-primary-900">$99/year</span>
              <span className="text-sm text-primary-700">Save 17%</span>
            </div>

            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-primary-900">
                <Check className="h-4 w-4 flex-shrink-0" />
                <span><strong>Unlimited searches</strong> - no daily limits</span>
              </li>
              <li className="flex items-center gap-2 text-primary-900">
                <Check className="h-4 w-4 flex-shrink-0" />
                <span><strong>Alliance filtering</strong> - Star Alliance, OneWorld, SkyTeam</span>
              </li>
              <li className="flex items-center gap-2 text-primary-900">
                <Check className="h-4 w-4 flex-shrink-0" />
                <span><strong>Jetlag optimization</strong> - health-first flight selection</span>
              </li>
              <li className="flex items-center gap-2 text-primary-900">
                <Check className="h-4 w-4 flex-shrink-0" />
                <span><strong>10 price alerts</strong> - get notified of deals</span>
              </li>
              <li className="flex items-center gap-2 text-primary-900">
                <Check className="h-4 w-4 flex-shrink-0" />
                <span><strong>Ad-free experience</strong></span>
              </li>
            </ul>

            <Button
              asChild
              className="w-full mt-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold"
            >
              <Link href="/pricing">
                Start 14-Day Free Trial
              </Link>
            </Button>

            <p className="text-xs text-center text-primary-700 mt-2">
              No credit card required • Cancel anytime
            </p>
          </div>

          {/* Expert Tier Option */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-4 w-4 text-yellow-600" />
              <span className="font-semibold">Expert: $149/year</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Everything in Pro + unlimited alerts, API access, priority support
            </p>
            <Button
              variant="outline"
              asChild
              className="w-full"
            >
              <Link href="/pricing">
                View All Plans
              </Link>
            </Button>
          </div>

          {/* Don't show again checkbox */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              id="dont-show"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="dont-show">Don't show this again today</label>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
