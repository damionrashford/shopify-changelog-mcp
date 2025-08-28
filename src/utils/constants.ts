/**
 * Constants for Shopify Changelog utilities
 */

/** Shopify Changelog RSS feed URLs */
export const RSS_URLS = {
  DEVELOPER: 'https://shopify.dev/changelog/feed.xml',
  PLATFORM: 'https://changelog.shopify.com/feed.xml'
} as const;

/** Default RSS URL */
export const RSS_URL = RSS_URLS.DEVELOPER;

/** Keywords that indicate breaking changes */
export const BREAKING_KEYWORDS = [
  'breaking',
  'deprecated',
  'removal',
  'discontinued',
  'migration',
  'upgrade'
] as const;

/** Default limits for various operations */
export const DEFAULT_LIMITS = {
  RECENT: 10,     // Recent updates default
  SEARCH: 15,     // Search results
  BREAKING_CHANGES: 15,  // Breaking changes
  CATEGORY: 10,   // Category-specific fetch
  MAX_ALLOWED: 30, // Maximum ever returned
  SEARCH_FETCH: 100 // Internal fetch limit for filtering
} as const;

/** Platform changelog categories */
export const PLATFORM_CATEGORIES = [
  'admin',
  'analytics', 
  'apps',
  'b2b',
  'checkout',
  'collective',
  'customers',
  'international', 
  'inventory',
  'marketing',
  'mobile',
  'online-store',
  'orders',
  'payments',
  'pos',
  'products',
  'shipping',
  'shop',
  'themes'
] as const;

export type PlatformCategory = typeof PLATFORM_CATEGORIES[number];
