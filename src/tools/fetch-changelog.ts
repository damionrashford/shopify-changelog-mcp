/**
 * Fetch Changelog Tool - Fetches Shopify changelog entries with filtering options
 */

import {
  DEFAULT_LIMITS,
  fetchRSSFeed,
  parseRSSXML,
  filterEntriesByKeywords,
  sortEntriesByDate,
  limitEntries,
  removeDuplicateEntries,
  formatChangelogEntries
} from "../utils/index.js";
import type { ToolResponse } from "../types.js";

export async function executeFetchChangelog({ 
  filter = [], 
  limit = DEFAULT_LIMITS.FETCH 
}: { 
  filter?: string[];
  limit?: number;
}): Promise<ToolResponse> {
  try {
    // Fetch RSS feed
    const xmlText = await fetchRSSFeed();
    
    // Parse RSS XML
    let entries = parseRSSXML(xmlText);
    
    // Remove duplicates
    entries = removeDuplicateEntries(entries);
    
    // Sort by date (newest first)
    entries = sortEntriesByDate(entries, false);
    
    // Apply keyword filters
    let filteredEntries = entries;
    if (filter.length > 0) {
      filteredEntries = filterEntriesByKeywords(entries, filter);
    }
    
    // Apply limit
    const limitedEntries = limitEntries(filteredEntries, limit);
    
    // Format entries
    const formattedEntries = formatChangelogEntries(limitedEntries);
    
    let summary = `Found ${filteredEntries.length} changelog entries`;
    if (filter.length > 0) {
      summary += ` matching filter: ${filter.join(', ')}`;
    }
    if (limitedEntries.length < filteredEntries.length) {
      summary += ` (showing first ${limitedEntries.length})`;
    }
    
    return {
      content: [{
        type: "text",
        text: `${summary}\n\n${formattedEntries}`
      }]
    };
  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error fetching changelog: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}
