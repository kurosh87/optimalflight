/**
 * HTML processing utilities for LLM parsing
 */

/**
 * Strip unnecessary HTML to reduce token usage
 * Removes scripts, styles, comments, and excessive whitespace
 */
export function stripHTML(html: string): string {
  let cleaned = html;

  // Remove script tags and their content
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove style tags and their content
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // Remove SVG elements (usually icons, not useful for flight data)
  cleaned = cleaned.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, '');

  // Remove inline styles
  cleaned = cleaned.replace(/\s*style="[^"]*"/gi, '');

  // Remove data-* attributes (usually for JS, not semantic)
  cleaned = cleaned.replace(/\s*data-[a-z-]+="[^"]*"/gi, '');

  // Remove class attributes (not semantic for our use case)
  cleaned = cleaned.replace(/\s*class="[^"]*"/gi, '');

  // Remove excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Remove empty tags
  cleaned = cleaned.replace(/<(\w+)[^>]*>\s*<\/\1>/gi, '');

  return cleaned.trim();
}

/**
 * Extract text content from HTML
 */
export function extractTextContent(html: string): string {
  const stripped = stripHTML(html);

  // Remove all HTML tags
  const text = stripped.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  const decoded = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Clean up whitespace
  return decoded.replace(/\s+/g, ' ').trim();
}

/**
 * Calculate token estimate for text (rough approximation)
 * GPT models use ~1 token per 4 characters on average
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Truncate HTML to stay within token limit
 * @param html - HTML content
 * @param maxTokens - Maximum tokens allowed
 * @returns Truncated HTML
 */
export function truncateHTML(html: string, maxTokens = 4000): string {
  const stripped = stripHTML(html);
  const estimatedTokens = estimateTokens(stripped);

  if (estimatedTokens <= maxTokens) {
    return stripped;
  }

  // Calculate max characters (tokens * 4)
  const maxChars = maxTokens * 4;

  return stripped.substring(0, maxChars) + '...';
}
