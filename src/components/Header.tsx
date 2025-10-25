import { auth, signIn, signOut } from '@/auth';
import { Button } from './ui/button';

export default async function Header() {
  const session = await auth();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold text-blue-600">FlightOptima</h1>
          <nav className="hidden md:flex gap-6">
            <a href="/" className="text-gray-700 hover:text-blue-600 transition">
              Search
            </a>
            <a href="/routes" className="text-gray-700 hover:text-blue-600 transition">
              Routes
            </a>
            <a href="/saved" className="text-gray-700 hover:text-blue-600 transition">
              Saved
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {session?.user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {session.user.email}
              </span>
              <form
                action={async () => {
                  'use server';
                  await signOut();
                }}
              >
                <Button variant="outline" type="submit">
                  Sign Out
                </Button>
              </form>
            </div>
          ) : (
            <form
              action={async () => {
                'use server';
                await signIn('github');
              }}
            >
              <Button type="submit">Sign In</Button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
