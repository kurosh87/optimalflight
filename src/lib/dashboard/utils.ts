import crypto from "crypto";

/**
 * Generate a URL-friendly slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50);
}

/**
 * Generate a unique slug by appending random characters if needed
 */
export function generateUniqueSlug(name: string, existingSlugs: string[]): string {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Generate a secure invite token
 */
export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Calculate invite expiration (7 days from now)
 */
export function getInviteExpiration(): Date {
  const expiration = new Date();
  expiration.setDate(expiration.getDate() + 7);
  return expiration;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate hex color format
 */
export function isValidHexColor(color: string): boolean {
  const hexRegex = /^#[0-9A-F]{6}$/i;
  return hexRegex.test(color);
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: string): string {
  const roleMap: Record<string, string> = {
    owner: "Owner",
    admin: "Admin",
    member: "Member",
  };
  return roleMap[role] || role;
}

/**
 * Get role badge color
 */
export function getRoleBadgeVariant(
  role: string
): "default" | "secondary" | "destructive" | "outline" {
  const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    owner: "default",
    admin: "secondary",
    member: "outline",
  };
  return variantMap[role] || "outline";
}
