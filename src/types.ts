/**
 * Shared types for the Shopify Changelog MCP Server
 */

export interface ChangelogEntry {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  categories: string[];
}

export interface ChangelogResult {
  entries: ChangelogEntry[];
  totalCount: number;
}

export interface ToolResponse {
  [x: string]: unknown;
  content: Array<{
    type: "text";
    text: string;
    [x: string]: unknown;
  }>;
  isError?: boolean;
}
