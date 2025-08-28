/**
 * Shared types for the Shopify Changelog MCP Server
 */

export type ChangelogSource = 'developer' | 'platform';

export interface ChangelogEntry {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  categories: string[];
  source?: ChangelogSource;
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

export interface EnabledSources {
  developer: boolean;
  platform: boolean;
}
