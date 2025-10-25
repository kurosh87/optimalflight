/**
 * NextAuth Helper Functions
 * Replaces Clerk auth helpers from jetlag-revweb
 */

import { auth } from '@/auth';
import { redirect } from 'next/navigation';

/**
 * Require authentication for API routes
 * Throws error if not authenticated
 * Returns userId if authenticated
 */
export async function requireAuth(): Promise<string> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  return session.user.id;
}

/**
 * Get current user session
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}

/**
 * Require auth and redirect if not authenticated
 * Use in server components/pages
 */
export async function requireAuthWithRedirect(redirectTo: string = '/') {
  const session = await auth();

  if (!session?.user) {
    redirect(redirectTo);
  }

  return session.user;
}

/**
 * Check if user is authenticated
 * Returns boolean
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await auth();
  return !!session?.user;
}
