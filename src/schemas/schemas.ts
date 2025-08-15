/**
 * Zod schemas for all MCP tools
 */

import { z } from "zod";

/**
 * Schema for fetch_changelog tool
 */
export const FETCH_CHANGELOG_SCHEMA = {
  filter: z.array(z.string()).optional().describe("Filter entries by API version, content type, or keyword (e.g., ['api', '2024-01'])"),
  limit: z.number().min(1).max(100).default(10).describe("Maximum number of entries to return (1-100)")
};

/**
 * Schema for search_changelog tool
 */
export const SEARCH_CHANGELOG_SCHEMA = {
  query: z.string().min(1).describe("Search query - keywords to search for in changelog entries"),
  filter: z.array(z.string()).optional().describe("Additional filter by API version or content type"),
  limit: z.number().min(1).max(50).default(10).describe("Maximum number of entries to return (1-50)")
};

/**
 * Schema for breaking_changes tool
 */
export const BREAKING_CHANGES_SCHEMA = {
  apiVersion: z.string().optional().describe("Specific API version to filter by (e.g., '2024-01', '2024-07')"),
  limit: z.number().min(1).max(50).default(10).describe("Maximum number of entries to return (1-50)")
};
