/**
 * Authentication Utilities
 * TODO: Replace all Clerk dependencies with NextAuth or custom auth solution
 * Provides helper functions for authentication and authorization
 */

// import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Get the current authenticated user's ID
 * TODO: Replace Clerk implementation
 * Throws error if not authenticated
 */
export async function requireAuth(): Promise<string> {
  // TODO: Implement proper authentication
  throw new Error("requireAuth not implemented - replace Clerk auth");

  // const { userId } = await auth();
  // if (!userId) {
  //   throw new Error("Unauthorized");
  // }
  // return userId;
}

/**
 * Get the current authenticated user's full details
 * TODO: Replace Clerk implementation
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  // TODO: Implement proper user retrieval
  console.warn('getCurrentUser not implemented - replace Clerk auth');
  return null;

  // return currentUser();
}

/**
 * Get current user or throw error if not authenticated
 * TODO: Replace Clerk implementation
 */
export async function requireCurrentUser() {
  // TODO: Implement proper authentication
  throw new Error("requireCurrentUser not implemented - replace Clerk auth");

  // const user = await currentUser();
  // if (!user) {
  //   throw new Error("Unauthorized");
  // }
  // return user;
}

/**
 * Require user to be a superadmin (platform admin)
 * TODO: Replace Clerk implementation - check database or custom metadata
 * Checks publicMetadata for admin role
 */
export async function requireSuperAdmin() {
  // TODO: Implement proper superadmin check
  throw new Error("requireSuperAdmin not implemented - replace Clerk auth");

  // const user = await currentUser();
  // if (!user || user.publicMetadata?.role !== "superadmin") {
  //   throw new Error("Forbidden: Superadmin access required");
  // }
  // return user;
}

/**
 * Check if user has superadmin access
 * TODO: Replace Clerk implementation
 */
export async function isSuperAdmin(): Promise<boolean> {
  // TODO: Implement proper superadmin check
  console.warn('isSuperAdmin not implemented - replace Clerk auth');
  return false;

  // const user = await currentUser();
  // return user?.publicMetadata?.role === "superadmin";
}

/**
 * Get auth with redirect
 * TODO: Replace Clerk implementation
 * Redirects to sign-in page if not authenticated
 */
export async function requireAuthWithRedirect(redirectPath = "/sign-in") {
  // TODO: Implement proper authentication with redirect
  throw new Error("requireAuthWithRedirect not implemented - replace Clerk auth");

  // const { userId } = await auth();
  // if (!userId) {
  //   redirect(redirectPath);
  // }
  // return userId;
}

/**
 * Get current organization ID from context
 * TODO: Replace Clerk implementation
 * Returns null if not in organization context
 */
export async function getCurrentOrgId(): Promise<string | null> {
  // TODO: Implement proper organization context
  console.warn('getCurrentOrgId not implemented - replace Clerk auth');
  return null;

  // const { orgId } = await auth();
  // return orgId;
}

/**
 * Get current organization role
 * TODO: Replace Clerk implementation
 * Returns null if not in organization context
 */
export async function getCurrentOrgRole(): Promise<string | null> {
  // TODO: Implement proper organization role retrieval
  console.warn('getCurrentOrgRole not implemented - replace Clerk auth');
  return null;

  // const { orgRole } = await auth();
  // return orgRole;
}

/**
 * Require user to be in an organization
 * TODO: Replace Clerk implementation
 */
export async function requireOrganization() {
  // TODO: Implement proper organization requirement
  throw new Error("requireOrganization not implemented - replace Clerk auth");

  // const { orgId, orgRole } = await auth();
  // if (!orgId) {
  //   throw new Error("Organization context required");
  // }
  // return { orgId, orgRole };
}

/**
 * Require user to be an admin in the current organization
 * TODO: Replace Clerk implementation
 */
export async function requireOrgAdmin() {
  // TODO: Implement proper organization admin check
  throw new Error("requireOrgAdmin not implemented - replace Clerk auth");

  // const { orgId, orgRole } = await auth();
  // if (!orgId) {
  //   throw new Error("Organization context required");
  // }
  // if (orgRole !== "org:admin") {
  //   throw new Error("Forbidden: Admin access required");
  // }
  // return { orgId, orgRole };
}

/**
 * Check if user is an admin in the current organization
 * TODO: Replace Clerk implementation
 */
export async function isOrgAdmin(): Promise<boolean> {
  // TODO: Implement proper organization admin check
  console.warn('isOrgAdmin not implemented - replace Clerk auth');
  return false;

  // const { orgRole } = await auth();
  // return orgRole === "org:admin";
}

/**
 * Check if user can manage members (admin or higher)
 * TODO: Replace Clerk implementation
 */
export async function canManageMembers(): Promise<boolean> {
  // TODO: Implement proper member management permission check
  console.warn('canManageMembers not implemented - replace Clerk auth');
  return false;

  // const { orgRole } = await auth();
  // return orgRole === "org:admin" || orgRole === "org:owner";
}

/**
 * Get all organizations for the current user
 * TODO: Replace Clerk implementation
 */
export async function getUserOrganizations() {
  // TODO: Implement proper organization list retrieval from database
  console.warn('getUserOrganizations not implemented - replace Clerk auth');
  return [];

  // const { userId } = await auth();
  // if (!userId) {
  //   return [];
  // }
  // const client = await clerkClient();
  // const orgMemberships = await client.users.getOrganizationMembershipList({
  //   userId,
  // });
  // return orgMemberships.data;
}

/**
 * Get organization details by ID
 * TODO: Replace Clerk implementation
 */
export async function getOrganization(orgId: string) {
  // TODO: Implement proper organization retrieval from database
  throw new Error("getOrganization not implemented - replace Clerk auth");

  // const client = await clerkClient();
  // return client.organizations.getOrganization({ organizationId: orgId });
}

/**
 * Get organization members
 * TODO: Replace Clerk implementation
 */
export async function getOrganizationMembers(orgId: string) {
  // TODO: Implement proper member list retrieval from database
  throw new Error("getOrganizationMembers not implemented - replace Clerk auth");

  // const client = await clerkClient();
  // const memberships = await client.organizations.getOrganizationMembershipList({
  //   organizationId: orgId,
  // });
  // return memberships.data;
}

/**
 * Invite user to organization
 * TODO: Replace Clerk implementation
 */
export async function inviteToOrganization(
  orgId: string,
  emailAddress: string,
  role: "org:admin" | "org:member" = "org:member"
) {
  // TODO: Implement proper organization invitation system
  throw new Error("inviteToOrganization not implemented - replace Clerk auth");

  // const client = await clerkClient();
  // return client.organizations.createOrganizationInvitation({
  //   organizationId: orgId,
  //   emailAddress,
  //   role,
  // });
}

/**
 * Update organization member role
 * TODO: Replace Clerk implementation
 */
export async function updateMemberRole(
  orgId: string,
  userId: string,
  role: "org:admin" | "org:member"
) {
  // TODO: Implement proper member role update in database
  throw new Error("updateMemberRole not implemented - replace Clerk auth");

  // const client = await clerkClient();
  // return client.organizations.updateOrganizationMembership({
  //   organizationId: orgId,
  //   userId,
  //   role,
  // });
}

/**
 * Remove member from organization
 * TODO: Replace Clerk implementation
 */
export async function removeMemberFromOrg(orgId: string, userId: string) {
  // TODO: Implement proper member removal from database
  throw new Error("removeMemberFromOrg not implemented - replace Clerk auth");

  // const client = await clerkClient();
  // return client.organizations.deleteOrganizationMembership({
  //   organizationId: orgId,
  //   userId,
  // });
}
