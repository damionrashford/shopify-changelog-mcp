/**
 * Constants for Shopify Changelog utilities
 */

/** Shopify Developer Changelog RSS feed URL */
export const RSS_URL = 'https://shopify.dev/changelog/feed.xml';

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
  FETCH: 20,  // Increased due to compact formatting
  SEARCH: 15, // Increased due to compact formatting  
  BREAKING_CHANGES: 15, // Increased due to compact formatting
  SEARCH_FETCH: 100 // Higher limit for search operations to get more results to filter
} as const;
