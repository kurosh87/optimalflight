/**
 * Business tier white-label branding utilities
 * Apply organization branding to calendar events and user-facing content
 */

export interface OrganizationBranding {
  companyName: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
}

export interface BrandedEventOptions {
  summary: string;
  description: string;
  branding?: OrganizationBranding;
  includeCompanyPrefix?: boolean;
}

/**
 * Apply organization branding to a calendar event title
 * For Business tier: "Acme Corp: ☀️ GET Light (30min) - Day 3"
 * For Personal: "☀️ GET Light (30min) - Day 3"
 */
export function applyBrandingToEventTitle(
  originalTitle: string,
  branding?: OrganizationBranding
): string {
  if (!branding?.companyName) {
    return originalTitle;
  }

  return `${branding.companyName}: ${originalTitle}`;
}

/**
 * Apply organization branding to event description
 * Adds company information footer to descriptions
 */
export function applyBrandingToDescription(
  originalDescription: string,
  branding?: OrganizationBranding
): string {
  if (!branding?.companyName) {
    return originalDescription;
  }

  const brandingFooter = `\n\n---\n📋 Organized by ${branding.companyName}\n✈️ Jetlag recovery plan for your team`;

  return originalDescription + brandingFooter;
}

/**
 * Get calendar color code from organization branding
 * Maps hex color to calendar provider's color scheme
 */
export function getCalendarColorFromBranding(
  branding?: OrganizationBranding
): string | undefined {
  if (!branding?.primaryColor) {
    return undefined;
  }

  // For now, return the hex color - calendar services will handle conversion
  return branding.primaryColor;
}

/**
 * Apply full branding to calendar event data
 */
export function applyOrganizationBranding(options: BrandedEventOptions): {
  summary: string;
  description: string;
  colorId?: string;
} {
  const { summary, description, branding, includeCompanyPrefix = true } = options;

  return {
    summary: includeCompanyPrefix
      ? applyBrandingToEventTitle(summary, branding)
      : summary,
    description: applyBrandingToDescription(description, branding),
    colorId: getCalendarColorFromBranding(branding),
  };
}

/**
 * Check if a flight is part of an organization (Business tier)
 */
export function isOrganizationFlight(organizationId?: string | null): boolean {
  return Boolean(organizationId);
}

/**
 * Format organization display name for UI
 */
export function formatOrganizationName(branding?: OrganizationBranding): string {
  return branding?.companyName || "Your Organization";
}
