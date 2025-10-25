import { db } from "@/lib/db";
import { adminUsers, adminAuditLog } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export interface AdminPermissions {
  isAdmin: boolean;
  role: string;
  canManageUsers: boolean;
  canManagePayments: boolean;
  canManageFlights: boolean;
  canViewAnalytics: boolean;
  canManageAdmins: boolean;
}

/**
 * Check if a user has admin permissions
 */
export async function checkAdminPermissions(
  userId: string
): Promise<AdminPermissions | null> {
  try {
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(and(eq(adminUsers.userId, userId), eq(adminUsers.isActive, true)))
      .limit(1);

    if (!admin) {
      return null;
    }

    return {
      isAdmin: true,
      role: admin.role,
      canManageUsers: admin.canManageUsers ?? false,
      canManagePayments: admin.canManagePayments ?? false,
      canManageFlights: admin.canManageFlights ?? false,
      canViewAnalytics: admin.canViewAnalytics ?? false,
      canManageAdmins: admin.canManageAdmins ?? false,
    };
  } catch (error) {
    console.error("Error checking admin permissions:", error);
    return null;
  }
}

/**
 * Log an admin action to the audit log
 */
export async function logAdminAction(params: {
  adminUserId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}) {
  try {
    await db.insert(adminAuditLog).values({
      adminUserId: params.adminUserId,
      action: params.action,
      resourceType: params.resourceType || null,
      resourceId: params.resourceId || null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
      success: params.success ?? true,
      errorMessage: params.errorMessage || null,
    });
  } catch (error) {
    console.error("Error logging admin action:", error);
    // Don't throw - logging shouldn't break the main flow
  }
}

/**
 * Grant admin permissions to a user
 */
export async function grantAdminPermissions(params: {
  userId: string;
  grantedBy: string;
  role?: string;
  permissions?: {
    canManageUsers?: boolean;
    canManagePayments?: boolean;
    canManageFlights?: boolean;
    canViewAnalytics?: boolean;
    canManageAdmins?: boolean;
  };
}) {
  try {
    // Check if user already has admin record
    const [existing] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.userId, params.userId))
      .limit(1);

    if (existing) {
      // Update existing record
      await db
        .update(adminUsers)
        .set({
          role: params.role || existing.role,
          canManageUsers: params.permissions?.canManageUsers ?? existing.canManageUsers,
          canManagePayments: params.permissions?.canManagePayments ?? existing.canManagePayments,
          canManageFlights: params.permissions?.canManageFlights ?? existing.canManageFlights,
          canViewAnalytics: params.permissions?.canViewAnalytics ?? existing.canViewAnalytics,
          canManageAdmins: params.permissions?.canManageAdmins ?? existing.canManageAdmins,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(adminUsers.userId, params.userId));
    } else {
      // Create new admin record
      await db.insert(adminUsers).values({
        userId: params.userId,
        role: params.role || "admin",
        grantedBy: params.grantedBy,
        canManageUsers: params.permissions?.canManageUsers ?? true,
        canManagePayments: params.permissions?.canManagePayments ?? true,
        canManageFlights: params.permissions?.canManageFlights ?? true,
        canViewAnalytics: params.permissions?.canViewAnalytics ?? true,
        canManageAdmins: params.permissions?.canManageAdmins ?? false,
        isActive: true,
      });
    }

    // Log the action
    await logAdminAction({
      adminUserId: params.grantedBy,
      action: "grant_admin_permissions",
      resourceType: "admin",
      resourceId: params.userId,
      metadata: { role: params.role, permissions: params.permissions },
    });

    return { success: true };
  } catch (error) {
    console.error("Error granting admin permissions:", error);
    throw error;
  }
}

/**
 * Revoke admin permissions from a user
 */
export async function revokeAdminPermissions(params: {
  userId: string;
  revokedBy: string;
}) {
  try {
    await db
      .update(adminUsers)
      .set({
        isActive: false,
        revokedBy: params.revokedBy,
        revokedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.userId, params.userId));

    // Log the action
    await logAdminAction({
      adminUserId: params.revokedBy,
      action: "revoke_admin_permissions",
      resourceType: "admin",
      resourceId: params.userId,
    });

    return { success: true };
  } catch (error) {
    console.error("Error revoking admin permissions:", error);
    throw error;
  }
}

/**
 * Get all admin users
 */
export async function getAllAdminUsers() {
  try {
    return await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.isActive, true));
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return [];
  }
}

/**
 * Get audit log for an admin user
 */
export async function getAdminAuditLog(params: {
  adminUserId?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = db.select().from(adminAuditLog);

    if (params.adminUserId) {
      query = query.where(eq(adminAuditLog.adminUserId, params.adminUserId)) as any;
    }

    const logs = await query
      .limit(params.limit || 50)
      .offset(params.offset || 0)
      .orderBy(desc(adminAuditLog.insertedAt));

    return logs;
  } catch (error) {
    console.error("Error fetching audit log:", error);
    return [];
  }
}
