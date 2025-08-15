/**
 * Constants for Shopify Changelog utilities
 */

/** Shopify Developer Changelog RSS feed URL */
export const RSS_URL = 'https://changelog.shopifyapis.dev/posts.rss';

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
  FETCH: 10,
  SEARCH: 10,
  BREAKING_CHANGES: 10,
  SEARCH_FETCH: 100 // Higher limit for search operations to get more results to filter
} as const;
