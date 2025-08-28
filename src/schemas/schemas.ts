/**
 * Zod schemas for all MCP tools
 */

import { z } from "zod";

/**
 * Schema for dev_search tool
 */
export const DEV_SEARCH_SCHEMA = {
  query: z.string().min(1).describe("Search query - keywords to search for in developer changelog"),
  limit: z.number().min(1).max(30).default(15).describe("Maximum number of entries to return (1-30)")
};

/**
 * Schema for dev_breaking_changes tool
 */
export const DEV_BREAKING_CHANGES_SCHEMA = {
  limit: z.number().min(1).max(30).default(15).describe("Maximum number of entries to return (1-30)")
};

/**
 * Schema for dev_recent tool
 */
export const DEV_RECENT_SCHEMA = {
  days: z.number().default(7).describe("Number of days to look back (1, 3, 7, 14, or 30)"),
  limit: z.number().min(1).max(30).default(10).describe("Maximum number of entries to return (1-30)")
};

/**
 * Schema for platform_search tool
 */
export const PLATFORM_SEARCH_SCHEMA = {
  query: z.string().min(1).describe("Search query - keywords to search for in platform changelog"),
  limit: z.number().min(1).max(30).default(15).describe("Maximum number of entries to return (1-30)")
};

/**
 * Schema for platform_category tool
 */
export const PLATFORM_CATEGORY_SCHEMA = {
  category: z.union([
    z.string().describe("Platform category (e.g., 'pos', 'admin', 'checkout')"),
    z.array(z.string()).describe("Multiple categories to fetch")
  ]).describe("Category or categories to fetch updates from"),
  days: z.number().optional().describe("Optional: filter by number of days (1, 3, 7, 14, or 30)"),
  limit: z.number().min(1).max(30).default(10).describe("Maximum number of entries to return (1-30)")
};

/**
 * Schema for platform_recent tool
 */
export const PLATFORM_RECENT_SCHEMA = {
  days: z.number().default(7).describe("Number of days to look back (1, 3, 7, 14, or 30)"),
  limit: z.number().min(1).max(30).default(10).describe("Maximum number of entries to return (1-30)")
};

/**
 * Schema for get_post tool
 */
export const GET_POST_SCHEMA = {
  url: z.string().url().describe("Full URL of the changelog post (from either shopify.dev/changelog or changelog.shopify.com)")
};

/**
 * Schema for search_all tool
 */
export const SEARCH_ALL_SCHEMA = {
  query: z.string().min(1).describe("Search query - keywords to search across all enabled changelogs"),
  sources: z.array(z.enum(['developer', 'platform'])).optional()
    .describe("Optional: specify which sources to search (defaults to all enabled)"),
  limit: z.number().min(1).max(30).default(15).describe("Maximum number of entries to return (1-30)")
};

