/**
 * Configuration objects for all MCP tools
 */

import {
  DEV_SEARCH_SCHEMA,
  DEV_BREAKING_CHANGES_SCHEMA,
  DEV_RECENT_SCHEMA,
  PLATFORM_SEARCH_SCHEMA,
  PLATFORM_CATEGORY_SCHEMA,
  PLATFORM_RECENT_SCHEMA,
  GET_POST_SCHEMA,
  SEARCH_ALL_SCHEMA
} from "./schemas.js";

/**
 * Developer changelog tool configurations
 */
export const DEV_SEARCH_CONFIG = {
  title: "Search Developer Changelog",
  description: "Search the Shopify Developer Changelog for API updates, deprecations, and technical changes. Returns up to 15 recent matches.",
  inputSchema: DEV_SEARCH_SCHEMA
};

export const DEV_BREAKING_CHANGES_CONFIG = {
  title: "Developer Breaking Changes",
  description: "Get breaking changes, deprecations, and migration notices from the Developer Changelog. Essential for maintaining API compatibility.",
  inputSchema: DEV_BREAKING_CHANGES_SCHEMA
};

export const DEV_RECENT_CONFIG = {
  title: "Recent Developer Updates",
  description: "Get recent updates from the Developer Changelog. Specify days to look back (1, 3, 7, 14, or 30).",
  inputSchema: DEV_RECENT_SCHEMA
};

/**
 * Platform changelog tool configurations
 */
export const PLATFORM_SEARCH_CONFIG = {
  title: "Search Platform Changelog",
  description: "Search the Shopify Platform Changelog for product updates, new features, and merchant-facing changes. Returns up to 15 recent matches.",
  inputSchema: PLATFORM_SEARCH_SCHEMA
};

export const PLATFORM_CATEGORY_CONFIG = {
  title: "Platform Category Updates",
  description: "Get updates from specific platform categories like POS, Admin, Checkout, Payments, etc. Optionally filter by recent days.",
  inputSchema: PLATFORM_CATEGORY_SCHEMA
};

export const PLATFORM_RECENT_CONFIG = {
  title: "Recent Platform Updates",
  description: "Get recent updates from the Platform Changelog. Specify days to look back (1, 3, 7, 14, or 30).",
  inputSchema: PLATFORM_RECENT_SCHEMA
};

/**
 * Universal tool configurations
 */
export const GET_POST_CONFIG = {
  title: "Get Changelog Post",
  description: "Get the full content of a specific changelog post from either Developer or Platform changelog. Provide the full URL.",
  inputSchema: GET_POST_SCHEMA
};

export const SEARCH_ALL_CONFIG = {
  title: "Search All Changelogs",
  description: "Search across both Developer and Platform changelogs simultaneously. Returns combined results sorted by date.",
  inputSchema: SEARCH_ALL_SCHEMA
};

