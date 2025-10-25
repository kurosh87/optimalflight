import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Zap, Building2 } from 'lucide-react';
import { PRICING_TIERS } from '@/lib/pricing/tiers';

export default function PricingPage() {
  const tiers = Object.values(PRICING_TIERS);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto mb-8">
            No dark patterns. No surprise charges. Cancel anytime with pro-rated refunds.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-primary-100">
            <Check className="h-5 w-5" />
            <span>7-day free trial</span>
            <span className="mx-2">•</span>
            <Check className="h-5 w-5" />
            <span>No credit card required</span>
            <span className="mx-2">•</span>
            <Check className="h-5 w-5" />
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 -mt-12 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {tiers.map((tier) => (
            <Card
              key={tier.id}
              className={`relative overflow-hidden transition-all hover:shadow-airbnb-hover ${
                tier.highlighted ? 'ring-2 ring-primary-500 shadow-airbnb-hover scale-105' : 'shadow-airbnb'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute top-0 right-0 bg-primary-500 text-white px-4 py-1 text-xs font-semibold rounded-bl-lg">
                  MOST POPULAR
                </div>
              )}

              <CardHeader className="space-y-4 pb-8">
                <div className="flex items-center gap-2">
                  {tier.id === 'free' && <Sparkles className="h-5 w-5 text-gray-400" />}
                  {tier.id === 'pro' && <Zap className="h-5 w-5 text-primary-500" />}
                  {tier.id === 'expert' && <Sparkles className="h-5 w-5 text-yellow-500" />}
                  {tier.id === 'enterprise' && <Building2 className="h-5 w-5 text-blue-600" />}
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                </div>
                <CardDescription className="text-base">{tier.description}</CardDescription>

                <div className="pt-4">
                  {tier.monthlyPrice === 0 ? (
                    <div className="text-4xl font-bold">Free</div>
                  ) : tier.id === 'enterprise' ? (
                    <div className="text-4xl font-bold">Custom</div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold">${tier.monthlyPrice}</span>
                        <span className="text-gray-500">/month</span>
                      </div>
                      {tier.savings > 0 && (
                        <div className="mt-2">
                          <div className="text-sm text-gray-600">
                            or ${tier.annualPrice}/year
                          </div>
                          <Badge variant="secondary" className="mt-1">
                            Save {tier.savings}%
                          </Badge>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features */}
                <ul className="space-y-3">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  className={`w-full py-6 text-base font-semibold ${
                    tier.highlighted
                      ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                  asChild
                >
                  <Link href={tier.id === 'free' ? '/search' : '/api/auth/signin'}>
                    {tier.id === 'free' ? 'Start Free' : tier.id === 'enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                  </Link>
                </Button>

                {tier.id !== 'free' && tier.id !== 'enterprise' && (
                  <p className="text-xs text-center text-gray-500">
                    7-day free trial, no credit card required
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="mt-20 max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Compare Features</h2>

          <Card className="shadow-airbnb">
            <CardContent className="p-8">
              <div className="grid gap-6">
                {/* Daily Searches */}
                <div className="flex items-center justify-between py-4 border-b">
                  <div>
                    <div className="font-semibold">Daily Searches</div>
                    <div className="text-sm text-gray-500">Search flights per day</div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="text-sm">10</div>
                    <div className="text-sm font-bold text-primary-500">Unlimited</div>
                    <div className="text-sm font-bold text-primary-500">Unlimited</div>
                    <div className="text-sm font-bold text-primary-500">Unlimited</div>
                  </div>
                </div>

                {/* Alliance Filtering */}
                <div className="flex items-center justify-between py-4 border-b">
                  <div>
                    <div className="font-semibold">Alliance Filtering</div>
                    <div className="text-sm text-gray-500">Star Alliance, OneWorld, SkyTeam</div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>—</div>
                    <Check className="h-5 w-5 text-green-600 mx-auto" />
                    <Check className="h-5 w-5 text-green-600 mx-auto" />
                    <Check className="h-5 w-5 text-green-600 mx-auto" />
                  </div>
                </div>

                {/* Jetlag Optimization */}
                <div className="flex items-center justify-between py-4 border-b">
                  <div>
                    <div className="font-semibold">Jetlag Optimization</div>
                    <div className="text-sm text-gray-500">Score flights by health impact</div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="text-sm">Basic</div>
                    <div className="text-sm font-bold text-primary-500">Advanced</div>
                    <div className="text-sm font-bold text-primary-500">Personalized</div>
                    <div className="text-sm font-bold text-primary-500">Personalized</div>
                  </div>
                </div>

                {/* Award Availability */}
                <div className="flex items-center justify-between py-4 border-b">
                  <div>
                    <div className="font-semibold">Award Availability</div>
                    <div className="text-sm text-gray-500">Real-time award seat alerts</div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>—</div>
                    <div className="text-sm">Indicators</div>
                    <Check className="h-5 w-5 text-green-600 mx-auto" />
                    <Check className="h-5 w-5 text-green-600 mx-auto" />
                  </div>
                </div>

                {/* Alerts */}
                <div className="flex items-center justify-between py-4 border-b">
                  <div>
                    <div className="font-semibold">Price & Route Alerts</div>
                    <div className="text-sm text-gray-500">Email/SMS notifications</div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>—</div>
                    <div className="text-sm">10/month</div>
                    <div className="text-sm font-bold text-primary-500">Unlimited</div>
                    <div className="text-sm font-bold text-primary-500">Unlimited</div>
                  </div>
                </div>

                {/* API Access */}
                <div className="flex items-center justify-between py-4">
                  <div>
                    <div className="font-semibold">API Access</div>
                    <div className="text-sm text-gray-500">Programmatic access</div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>—</div>
                    <div>—</div>
                    <div className="text-sm">100/month</div>
                    <div className="text-sm font-bold text-primary-500">Unlimited</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <Card className="shadow-airbnb">
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Yes! Cancel with one click from your account settings. Monthly plans stop at period end.
                  Annual plans receive pro-rated refunds for unused months. No questions asked.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-airbnb">
              <CardHeader>
                <CardTitle className="text-lg">Do you offer monthly payments?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Yes! Unlike FlightConnections, we offer BOTH monthly and annual options.
                  Pay monthly for flexibility or annually to save 17%.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-airbnb">
              <CardHeader>
                <CardTitle className="text-lg">How does the free trial work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Get 7 days of full Expert tier access. No credit card required.
                  We'll send reminders before it expires. Upgrade anytime to keep access.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-airbnb">
              <CardHeader>
                <CardTitle className="text-lg">What's your refund policy?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Annual subscriptions receive pro-rated refunds for unused months.
                  If you paid for 12 months but cancel after 3, you get 9 months refunded. Fair and transparent.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Find Better Flights?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Start your 7-day free trial. No credit card required.
          </p>
          <Button size="lg" className="bg-primary-500 hover:bg-primary-600 text-white px-10 py-6 text-lg shadow-lg">
            <Link href="/api/auth/signin">Start Free Trial</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
