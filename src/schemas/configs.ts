/**
 * Configuration objects for all MCP tools
 */

import {
  FETCH_CHANGELOG_SCHEMA,
  SEARCH_CHANGELOG_SCHEMA,
  BREAKING_CHANGES_SCHEMA,
  FETCH_INDIVIDUAL_POST_SCHEMA
} from "./schemas.js";

/**
 * Configuration for fetch_changelog tool
 */
export const FETCH_CHANGELOG_CONFIG = {
  title: "Fetch Shopify Changelog",
  description: "Fetches the Shopify Developer Changelog RSS feed with comprehensive filtering options. Supports filtering by API versions, content types, and limiting results.",
  inputSchema: FETCH_CHANGELOG_SCHEMA
};

/**
 * Configuration for search_changelog tool
 */
export const SEARCH_CHANGELOG_CONFIG = {
  title: "Search Shopify Changelog",
  description: "Search the Shopify Developer Changelog for specific keywords or topics. Searches through titles, descriptions, and categories.",
  inputSchema: SEARCH_CHANGELOG_SCHEMA
};

/**
 * Configuration for breaking_changes tool
 */
export const BREAKING_CHANGES_CONFIG = {
  title: "Get Breaking Changes",
  description: "Retrieves breaking changes, deprecations, and migration notices from the Shopify Developer Changelog. Essential for staying updated on changes that require action.",
  inputSchema: BREAKING_CHANGES_SCHEMA
};

/**
 * Configuration for fetch_individual_post tool
 */
export const FETCH_INDIVIDUAL_POST_CONFIG = {
  title: "Fetch Individual Changelog Post",
  description: "Fetches the full content of an individual Shopify changelog post from its URL. Returns complete post details including title, full description, categories, publication date, and all content without truncation.",
  inputSchema: FETCH_INDIVIDUAL_POST_SCHEMA
};
