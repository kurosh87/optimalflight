/**
 * User Profile & Settings Page
 * Airbnb-style design with account management
 */

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  Crown,
  Zap,
} from 'lucide-react';

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/');
  }

  // TODO: Fetch user subscription from database
  const userTier = 'free'; // Replace with actual tier
  const subscriptionExpires = null; // Replace with actual date

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <User className="h-10 w-10 text-primary-500" />
              Account Settings
            </h1>
            <p className="text-lg text-gray-600">
              Manage your subscription and preferences
            </p>
          </div>

          <div className="grid lg:grid-cols-[300px,1fr] gap-6">
            {/* Sidebar Navigation */}
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-left font-medium bg-primary-50 text-primary-700"
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button variant="ghost" className="w-full justify-start text-left">
                <CreditCard className="h-4 w-4 mr-2" />
                Subscription
              </Button>
              <Button variant="ghost" className="w-full justify-start text-left">
                <Bell className="h-4 w-4 mr-2" />
                Alerts
              </Button>
              <Button variant="ghost" className="w-full justify-start text-left">
                <Settings className="h-4 w-4 mr-2" />
                Preferences
              </Button>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
              {/* Profile Info */}
              <Card className="shadow-airbnb">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Your account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <div className="mt-1 text-gray-900">{session.user.email}</div>
                  </div>

                  {session.user.name && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Name</label>
                      <div className="mt-1 text-gray-900">{session.user.name}</div>
                    </div>
                  )}

                  <Separator />

                  <Button variant="outline" className="w-full">
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>

              {/* Subscription Status */}
              <Card className="shadow-airbnb">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Subscription</CardTitle>
                      <CardDescription>Current plan and billing</CardDescription>
                    </div>
                    {userTier === 'free' ? (
                      <Badge variant="secondary">Free</Badge>
                    ) : userTier === 'pro' ? (
                      <Badge className="bg-primary-500 text-white">
                        <Zap className="h-3 w-3 mr-1" />
                        Pro
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-500 text-white">
                        <Crown className="h-3 w-3 mr-1" />
                        Expert
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {userTier === 'free' ? (
                    <>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="font-semibold text-blue-900 mb-2">
                          Upgrade to unlock premium features
                        </h3>
                        <ul className="space-y-2 text-sm text-blue-800 mb-4">
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4" />
                            Alliance filtering (Star, OneWorld, SkyTeam)
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4" />
                            Unlimited searches & saved routes
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4" />
                            Advanced jetlag optimization
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4" />
                            Price alerts & notifications
                          </li>
                        </ul>
                        <Button className="w-full bg-primary-500 hover:bg-primary-600 text-white" asChild>
                          <Link href="/pricing">View Plans</Link>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Plan</span>
                          <span className="text-gray-900 font-semibold capitalize">{userTier}</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Billing</span>
                          <span className="text-gray-900">Annual</span>
                        </div>
                        {subscriptionExpires && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Renews</span>
                            <span className="text-gray-900">
                              {new Date(subscriptionExpires).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Button variant="outline" className="w-full">
                          Manage Subscription
                        </Button>
                        <Button variant="outline" className="w-full">
                          Update Payment Method
                        </Button>
                        <Button variant="outline" className="w-full text-primary-600 hover:text-primary-700">
                          Upgrade Plan
                        </Button>
                      </div>

                      <Separator />

                      <Button variant="ghost" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
                        Cancel Subscription
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Usage Stats */}
              <Card className="shadow-airbnb">
                <CardHeader>
                  <CardTitle>Usage This Month</CardTitle>
                  <CardDescription>Track your activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-3xl font-bold text-gray-900">0</div>
                      <div className="text-sm text-gray-600">Searches</div>
                      {userTier === 'free' && (
                        <div className="text-xs text-gray-500 mt-1">10/day limit</div>
                      )}
                    </div>

                    <div>
                      <div className="text-3xl font-bold text-gray-900">0</div>
                      <div className="text-sm text-gray-600">Saved Routes</div>
                      {userTier === 'free' && (
                        <div className="text-xs text-gray-500 mt-1">3 max</div>
                      )}
                    </div>

                    <div>
                      <div className="text-3xl font-bold text-gray-900">0</div>
                      <div className="text-sm text-gray-600">Active Alerts</div>
                      {userTier === 'free' && (
                        <div className="text-xs text-gray-500 mt-1">Pro feature</div>
                      )}
                    </div>

                    <div>
                      <div className="text-3xl font-bold text-gray-900">0</div>
                      <div className="text-sm text-gray-600">API Calls</div>
                      {(userTier === 'free' || userTier === 'pro') && (
                        <div className="text-xs text-gray-500 mt-1">Expert feature</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="shadow-airbnb border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-900">Danger Zone</CardTitle>
                  <CardDescription>Irreversible actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Delete Account</div>
                      <div className="text-sm text-gray-600">
                        Permanently delete your account and all data
                      </div>
                    </div>
                    <Button variant="destructive" size="sm">
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
