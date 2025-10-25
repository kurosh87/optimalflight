/**
 * Helper to get user email address
 * TODO: Replace Clerk with NextAuth or custom auth solution
 */

// import { clerkClient } from '@clerk/nextjs/server';

export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    // TODO: Implement proper user email retrieval from auth provider
    // For now, return placeholder
    console.warn('getUserEmail is using placeholder - implement proper auth');

    // const client = await clerkClient();
    // const user = await client.users.getUser(userId);
    // const primaryEmail = user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId);
    // return primaryEmail?.emailAddress || user.emailAddresses[0]?.emailAddress || null;

    return null; // PLACEHOLDER - replace with actual implementation
  } catch (error) {
    console.error('Error getting user email:', error);
    return null;
  }
}
