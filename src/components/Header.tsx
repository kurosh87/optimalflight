import { auth, signIn, signOut } from '@/auth';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import Link from 'next/link';
import { User, Zap } from 'lucide-react';

export default async function Header() {
  const session = await auth();

  return (
    <header className="border-b bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Nav */}
          <div className="flex items-center gap-8">
            <Link href="/">
              <h1 className="text-2xl font-bold text-primary-500 hover:text-primary-600 transition cursor-pointer">
                FlightOptima
              </h1>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/search" className="text-gray-700 hover:text-primary-600 transition font-medium">
                Search
              </Link>
              <Link href="/routes" className="text-gray-700 hover:text-primary-600 transition font-medium">
                Routes
              </Link>
              <Link href="/saved" className="text-gray-700 hover:text-primary-600 transition font-medium">
                Saved
              </Link>
              <Link href="/pricing" className="text-gray-700 hover:text-primary-600 transition font-medium">
                Pricing
              </Link>
            </nav>
          </div>

          {/* Auth */}
          <div className="flex items-center gap-4">
            {session?.user ? (
              <>
                {/* User Menu */}
                <Link href="/profile">
                  <Button variant="ghost" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{session.user.email?.split('@')[0]}</span>
                  </Button>
                </Link>

                {/* Upgrade Badge (if free tier) */}
                <Link href="/pricing">
                  <Badge className="bg-primary-500 text-white hover:bg-primary-600 cursor-pointer">
                    <Zap className="h-3 w-3 mr-1" />
                    Upgrade
                  </Badge>
                </Link>

                <form
                  action={async () => {
                    'use server';
                    await signOut();
                  }}
                >
                  <Button variant="outline" type="submit" size="sm">
                    Sign Out
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Link href="/pricing">
                  <Button variant="ghost">Pricing</Button>
                </Link>
                <form
                  action={async () => {
                    'use server';
                    await signIn('github');
                  }}
                >
                  <Button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white">
                    Sign In
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
