import { NextResponse } from "next/server";
import { requireAuth, getCurrentUser } from "@/lib/auth/clerk";
import { checkAdminPermissions, logAdminAction } from "./permissions";

export interface AdminAuthResult {
  user: { id: string; email: string | null | undefined; name: string | null | undefined };
  permissions: {
    isAdmin: boolean;
    role: string;
    canManageUsers: boolean;
    canManagePayments: boolean;
    canManageFlights: boolean;
    canViewAnalytics: boolean;
    canManageAdmins: boolean;
  };
}

/**
 * Verify admin authentication and permissions
 */
export async function verifyAdminAuth(
  requiredPermission?: keyof AdminAuthResult["permissions"]
): Promise<{ success: true; data: AdminAuthResult } | { success: false; error: NextResponse }> {
  try {
    // Get current user
    const userId = await requireAuth();
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    // Check admin permissions
    const permissions = await checkAdminPermissions(user.id);
    if (!permissions) {
      return {
        success: false,
        error: NextResponse.json(
          { error: "Forbidden - Admin access required" },
          { status: 403 }
        ),
      };
    }

    // Check specific permission if required
    if (requiredPermission && requiredPermission !== "isAdmin") {
      if (!permissions[requiredPermission]) {
        return {
          success: false,
          error: NextResponse.json(
            { error: `Forbidden - ${requiredPermission} permission required` },
            { status: 403 }
          ),
        };
      }
    }

    return {
      success: true,
      data: { user, permissions },
    };
  } catch (error) {
    console.error("Error verifying admin auth:", error);
    return {
      success: false,
      error: NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      ),
    };
  }
}

/**
 * Middleware wrapper for admin routes with automatic logging
 */
export function withAdminAuth(
  handler: (request: Request, auth: AdminAuthResult) => Promise<NextResponse>,
  options?: {
    requiredPermission?: keyof AdminAuthResult["permissions"];
    logAction?: string;
    resourceType?: string;
  }
) {
  return async (request: Request) => {
    const authResult = await verifyAdminAuth(options?.requiredPermission);

    if (!authResult.success) {
      return authResult.error;
    }

    // Log action if specified
    if (options?.logAction) {
      await logAdminAction({
        adminUserId: authResult.data.user.id,
        action: options.logAction,
        resourceType: options.resourceType,
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      });
    }

    try {
      return await handler(request, authResult.data);
    } catch (error) {
      console.error("Error in admin route handler:", error);

      // Log failed action
      if (options?.logAction) {
        await logAdminAction({
          adminUserId: authResult.data.user.id,
          action: options.logAction,
          resourceType: options.resourceType,
          success: false,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        });
      }

      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}
