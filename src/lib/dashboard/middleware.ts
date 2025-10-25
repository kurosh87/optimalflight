// TODO: Replace Clerk auth with NextAuth or custom auth solution
// import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export interface OrgMembership {
  id: string;
  organizationId: string;
  userId: string;
  role: "org:admin" | "org:member";
  joinedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  publicMetadata: {
    stripeCustomerId?: string;
    subscriptionTier?: string;
    subscriptionStatus?: string;
    companyName?: string;
    logoUrl?: string;
    primaryColor?: string;
  };
  createdAt: number;
}

/**
 * Verify that a user is a member of an organization
 * TODO: Replace Clerk implementation with NextAuth or custom auth solution
 * Returns the organization and membership info if valid
 * Throws error or redirects if invalid
 */
export async function verifyOrgMembership(
  orgId: string
): Promise<{ org: Organization; role: string }> {
  // TODO: Implement proper organization membership verification
  throw new Error("verifyOrgMembership not implemented - replace Clerk auth");

  // const { userId, orgRole } = await auth();
  // if (!userId) {
  //   throw new Error("Unauthorized");
  // }
  // if (!orgRole) {
  //   throw new Error("Not in organization context");
  // }
  // const client = await clerkClient();
  // const clerkOrg = await client.organizations.getOrganization({
  //   organizationId: orgId,
  // });
  // if (!clerkOrg) {
  //   throw new Error("Organization not found");
  // }
  // return {
  //   org: {
  //     id: clerkOrg.id,
  //     name: clerkOrg.name,
  //     slug: clerkOrg.slug || clerkOrg.id,
  //     imageUrl: clerkOrg.imageUrl,
  //     publicMetadata: clerkOrg.publicMetadata as any,
  //     createdAt: clerkOrg.createdAt,
  //   },
  //   role: orgRole,
  // };
}

/**
 * Check if user can manage members (admin or higher)
 */
export function canManageMembers(role: string): boolean {
  return role === "org:admin";
}

/**
 * Check if user can manage settings (admin only in Clerk)
 */
export function canManageSettings(role: string): boolean {
  return role === "org:admin";
}

/**
 * Require admin role in current organization
 * TODO: Replace Clerk implementation with NextAuth or custom auth solution
 */
export async function requireOrgAdmin(): Promise<{ orgId: string; userId: string }> {
  // TODO: Implement proper organization admin check
  throw new Error("requireOrgAdmin not implemented - replace Clerk auth");

  // const { userId, orgId, orgRole } = await auth();
  // if (!userId || !orgId) {
  //   throw new Error("Unauthorized or not in organization context");
  // }
  // if (orgRole !== "org:admin") {
  //   throw new Error("Insufficient permissions. Admin role required.");
  // }
  // return { orgId, userId };
}

/**
 * Get all organizations for the current user
 * TODO: Replace Clerk implementation with NextAuth or custom auth solution
 */
export async function getUserOrganizations(): Promise<
  Array<Organization & { role: string; memberCount: number }>
> {
  // TODO: Implement proper organization list retrieval
  throw new Error("getUserOrganizations not implemented - replace Clerk auth");

  // const { userId } = await auth();
  // if (!userId) {
  //   throw new Error("Unauthorized");
  // }
  // const client = await clerkClient();
  // const memberships = await client.users.getOrganizationMembershipList({
  //   userId,
  // });
  // const orgsWithDetails = await Promise.all(
  //   memberships.data.map(async (membership) => {
  //     const org = await client.organizations.getOrganization({
  //       organizationId: membership.organization.id,
  //     });
  //     const memberList = await client.organizations.getOrganizationMembershipList({
  //       organizationId: org.id,
  //     });
  //     return {
  //       id: org.id,
  //       name: org.name,
  //       slug: org.slug || org.id,
  //       imageUrl: org.imageUrl,
  //       publicMetadata: org.publicMetadata as any,
  //       createdAt: org.createdAt,
  //       role: membership.role,
  //       memberCount: memberList.totalCount,
  //     };
  //   })
  // );
  // return orgsWithDetails;
}
