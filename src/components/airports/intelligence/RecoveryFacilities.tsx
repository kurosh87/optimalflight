/**
 * Recovery Facilities Component
 * Displays jetlag recovery amenities using tabs for better organization
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { JetlagRecoveryFacilities } from '@/lib/types/airport-intelligence';
import { Bed, Dumbbell, Volume2, Droplets, Sparkles, Church, TreePine, ExternalLink, Clock, DollarSign, MapPin } from 'lucide-react';

interface RecoveryFacilitiesProps {
  recovery: JetlagRecoveryFacilities;
}

export function RecoveryFacilities({ recovery }: RecoveryFacilitiesProps) {
  const hasFacilities =
    recovery.sleepPods.length > 0 ||
    recovery.gyms.length > 0 ||
    recovery.quietZones.length > 0 ||
    recovery.showers.length > 0 ||
    recovery.spas.length > 0 ||
    recovery.meditationRooms.length > 0 ||
    recovery.outdoorAreas.length > 0;

  if (!hasFacilities) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Jetlag Recovery Facilities</CardTitle>
          <CardDescription>No dedicated recovery facilities data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
        <TabsTrigger value="overview" className="gap-1.5">
          <span className="text-base">📊</span>
          <span className="hidden sm:inline">Overview</span>
        </TabsTrigger>
        {recovery.sleepPods.length > 0 && (
          <TabsTrigger value="sleep" className="gap-1.5">
            <Bed className="h-4 w-4" />
            <span className="hidden sm:inline">Sleep</span>
            <Badge variant="secondary" className="ml-1 hidden lg:inline-flex">{recovery.sleepPods.length}</Badge>
          </TabsTrigger>
        )}
        {recovery.gyms.length > 0 && (
          <TabsTrigger value="fitness" className="gap-1.5">
            <Dumbbell className="h-4 w-4" />
            <span className="hidden sm:inline">Fitness</span>
            <Badge variant="secondary" className="ml-1 hidden lg:inline-flex">{recovery.gyms.length}</Badge>
          </TabsTrigger>
        )}
        {recovery.quietZones.length > 0 && (
          <TabsTrigger value="quiet" className="gap-1.5">
            <Volume2 className="h-4 w-4" />
            <span className="hidden sm:inline">Quiet</span>
            <Badge variant="secondary" className="ml-1 hidden lg:inline-flex">{recovery.quietZones.length}</Badge>
          </TabsTrigger>
        )}
        {recovery.showers.length > 0 && (
          <TabsTrigger value="showers" className="gap-1.5">
            <Droplets className="h-4 w-4" />
            <span className="hidden sm:inline">Showers</span>
            <Badge variant="secondary" className="ml-1 hidden lg:inline-flex">{recovery.showers.length}</Badge>
          </TabsTrigger>
        )}
        {(recovery.spas.length > 0 || recovery.meditationRooms.length > 0 || recovery.outdoorAreas.length > 0) && (
          <TabsTrigger value="wellness" className="gap-1.5">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">More</span>
          </TabsTrigger>
        )}
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-4 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recovery.sleepPods.length > 0 && (
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Bed className="h-8 w-8 text-blue-500" />
                  <Badge variant="secondary">{recovery.sleepPods.length}</Badge>
                </div>
                <CardTitle className="text-lg">Sleep Pods</CardTitle>
                <CardDescription className="text-xs">Rest & recovery areas</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  {recovery.sleepPods.slice(0, 2).map((pod, idx) => (
                    <li key={idx} className="truncate text-muted-foreground">• {pod.name}</li>
                  ))}
                  {recovery.sleepPods.length > 2 && (
                    <li className="text-xs text-primary">+{recovery.sleepPods.length - 2} more</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}

          {recovery.gyms.length > 0 && (
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Dumbbell className="h-8 w-8 text-green-500" />
                  <Badge variant="secondary">{recovery.gyms.length}</Badge>
                </div>
                <CardTitle className="text-lg">Fitness Centers</CardTitle>
                <CardDescription className="text-xs">Exercise facilities</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  {recovery.gyms.slice(0, 2).map((gym, idx) => (
                    <li key={idx} className="truncate text-muted-foreground">• {gym.name}</li>
                  ))}
                  {recovery.gyms.length > 2 && (
                    <li className="text-xs text-primary">+{recovery.gyms.length - 2} more</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}

          {recovery.quietZones.length > 0 && (
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Volume2 className="h-8 w-8 text-purple-500" />
                  <Badge variant="secondary">{recovery.quietZones.length}</Badge>
                </div>
                <CardTitle className="text-lg">Quiet Zones</CardTitle>
                <CardDescription className="text-xs">Peaceful rest areas</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {recovery.quietZones.filter(z => z.capacity === 'large').length} large, {' '}
                  {recovery.quietZones.filter(z => z.capacity === 'medium').length} medium, {' '}
                  {recovery.quietZones.filter(z => z.capacity === 'small').length} small zones
                </p>
              </CardContent>
            </Card>
          )}

          {recovery.showers.length > 0 && (
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Droplets className="h-8 w-8 text-cyan-500" />
                  <Badge variant="secondary">{recovery.showers.length}</Badge>
                </div>
                <CardTitle className="text-lg">Shower Facilities</CardTitle>
                <CardDescription className="text-xs">Refresh between flights</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  {recovery.showers.slice(0, 2).map((shower, idx) => (
                    <li key={idx} className="truncate text-muted-foreground">• {shower.name}</li>
                  ))}
                  {recovery.showers.length > 2 && (
                    <li className="text-xs text-primary">+{recovery.showers.length - 2} more</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="bg-blue-50/50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-2">💡 How to Use These Facilities</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Upon arrival:</strong> Use shower facilities to refresh and signal a &ldquo;new day&rdquo; to your body</li>
              <li>• <strong>During layover:</strong> Time sleep pods with your destination&apos;s night cycle (not your departure time)</li>
              <li>• <strong>Before departure:</strong> Light exercise helps regulate circadian rhythm and combats fatigue</li>
              <li>• <strong>Any time:</strong> Quiet zones provide stress-free environment for meditation or light napping</li>
            </ul>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Sleep Pods Tab */}
      {recovery.sleepPods.length > 0 && (
        <TabsContent value="sleep" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bed className="h-5 w-5" />
                <CardTitle>Sleep Pods & Nap Rooms</CardTitle>
              </div>
              <CardDescription>Private rest areas for recovery sleep</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recovery.sleepPods.map((pod, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{pod.name}</h3>
                      <p className="text-sm text-muted-foreground">by {pod.provider}</p>
                    </div>
                    <Badge variant="secondary">{pod.availability}</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="font-medium">{pod.location.terminal}</p>
                        <p className="text-muted-foreground">{pod.location.area}</p>
                        <Badge variant="outline" className="mt-1">
                          {pod.location.postSecurity ? 'Post-Security' : 'Pre-Security'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <DollarSign className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div>
                        {pod.pricing.hourly ? (
                          <p>{pod.pricing.currency} {pod.pricing.hourly}/hour</p>
                        ) : pod.pricing.overnight ? (
                          <p>{pod.pricing.currency} {pod.pricing.overnight}/night</p>
                        ) : (
                          <Badge variant="secondary">Free</Badge>
                        )}
                        {pod.bookingRequired && (
                          <Badge variant="outline" className="mt-1">Booking Required</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {pod.features.map((feature, i) => (
                      <Badge key={i} variant="outline">{feature}</Badge>
                    ))}
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      💡 Jetlag Benefit: {pod.jetlagBenefit}
                    </p>
                  </div>

                  {pod.bookingUrl && (
                    <a
                      href={pod.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      Book Now <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      )}

      {/* Fitness Tab */}
      {recovery.gyms.length > 0 && (
        <TabsContent value="fitness" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                <CardTitle>Fitness Centers</CardTitle>
              </div>
              <CardDescription>Exercise facilities to reset your circadian rhythm</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recovery.gyms.map((gym, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg">{gym.name}</h3>
                    <Badge>{gym.access}</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="font-medium">{gym.location.terminal}</p>
                        <p className="text-muted-foreground">{gym.location.area}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <p>{gym.hours}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Equipment:</p>
                    <div className="flex flex-wrap gap-2">
                      {gym.equipment.map((item, i) => (
                        <Badge key={i} variant="outline">{item}</Badge>
                      ))}
                    </div>
                  </div>

                  {gym.pricing && gym.pricing.dayPass && (
                    <p className="text-sm">
                      Day Pass: {gym.pricing.currency} {gym.pricing.dayPass}
                    </p>
                  )}

                  {gym.showers && (
                    <Badge variant="secondary">Showers Available</Badge>
                  )}

                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      💡 Jetlag Benefit: {gym.jetlagBenefit}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      )}

      {/* Quiet Zones Tab */}
      {recovery.quietZones.length > 0 && (
        <TabsContent value="quiet" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                <CardTitle>Quiet Zones</CardTitle>
              </div>
              <CardDescription>Peaceful areas for rest and relaxation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recovery.quietZones.map((zone, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                  <Badge variant="secondary">{zone.capacity} capacity</Badge>

                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="font-medium">{zone.location.terminal}</p>
                      <p className="text-sm text-muted-foreground">{zone.location.area}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {zone.features.map((feature, i) => (
                      <Badge key={i} variant="outline">{feature}</Badge>
                    ))}
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      💡 Jetlag Benefit: {zone.jetlagBenefit}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      )}

      {/* Showers Tab */}
      {recovery.showers.length > 0 && (
        <TabsContent value="showers" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                <CardTitle>Shower Facilities</CardTitle>
              </div>
              <CardDescription>Refresh and rejuvenate between flights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recovery.showers.map((shower, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg">{shower.name}</h3>
                    {shower.bookingRequired ? (
                      <Badge variant="secondary">Booking Required</Badge>
                    ) : (
                      <Badge variant="outline">Walk-in</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="font-medium">{shower.location.terminal}</p>
                        <p className="text-muted-foreground">{shower.location.area}</p>
                        <Badge variant="outline" className="mt-1">
                          {shower.location.postSecurity ? 'Post-Security' : 'Pre-Security'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p>{shower.hours}</p>
                        {shower.pricing.amount ? (
                          <p className="mt-1">{shower.pricing.currency} {shower.pricing.amount}</p>
                        ) : (
                          <Badge variant="secondary" className="mt-1">Free</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Included:</p>
                    <div className="flex flex-wrap gap-2">
                      {shower.pricing.included.map((item, i) => (
                        <Badge key={i} variant="outline">{item}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      💡 Jetlag Benefit: {shower.jetlagBenefit}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      )}

      {/* Wellness Tab (Spas, Meditation, Outdoor) */}
      {(recovery.spas.length > 0 || recovery.meditationRooms.length > 0 || recovery.outdoorAreas.length > 0) && (
        <TabsContent value="wellness" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recovery.spas.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    <CardTitle>Spa Services</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recovery.spas.map((spa, idx) => (
                    <div key={idx} className="text-sm space-y-2 border-b last:border-0 pb-3 last:pb-0">
                      <p className="font-semibold">{spa.name}</p>
                      <p className="text-muted-foreground">{spa.location.terminal}, {spa.location.area}</p>
                      <p><strong>Hours:</strong> {spa.hours}</p>
                      <p><strong>Price Range:</strong> {spa.priceRange}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {recovery.meditationRooms.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Church className="h-5 w-5" />
                    <CardTitle>Meditation/Prayer Rooms</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recovery.meditationRooms.map((room, idx) => (
                    <div key={idx} className="text-sm space-y-2 border-b last:border-0 pb-3 last:pb-0">
                      <p className="text-muted-foreground">{room.location.terminal}, {room.location.area}</p>
                      {room.denomination && (
                        <Badge>{room.denomination}</Badge>
                      )}
                      <p><strong>Hours:</strong> {room.hours}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {recovery.outdoorAreas.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TreePine className="h-5 w-5" />
                    <CardTitle>Outdoor Areas</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recovery.outdoorAreas.map((area, idx) => (
                    <div key={idx} className="text-sm space-y-2 border-b last:border-0 pb-3 last:pb-0">
                      <p className="font-semibold">{area.name}</p>
                      <p className="text-muted-foreground">{area.location.terminal}, {area.location.area}</p>
                      <div className="flex flex-wrap gap-1">
                        {area.features.map((feature, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{feature}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
}
