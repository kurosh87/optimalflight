import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bookmark, Plane } from 'lucide-react';

export default async function SavedRoutesPage() {
  const session = await auth();

  if (!session) {
    redirect('/');
  }

  // TODO: Fetch user's saved routes from database
  // const savedRoutes = await db.select().from(savedRoutes).where(eq(savedRoutes.userId, session.user.id));

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Bookmark className="h-10 w-10 text-blue-600" />
              Saved Routes
            </h1>
            <p className="text-lg text-gray-600">
              Your bookmarked routes and favorite flights
            </p>
          </div>

          {/* Empty State */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>No Saved Routes Yet</CardTitle>
              <CardDescription>
                Search for flights and save your favorite routes for quick access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Plane className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  Start by searching for flights and clicking the bookmark icon
                </p>
                <a
                  href="/search"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Search Flights
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Feature Info */}
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Access</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Saved routes appear here for one-click searching without re-entering details
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Price Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Set price alerts on saved routes to get notified when prices drop (Premium feature)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
