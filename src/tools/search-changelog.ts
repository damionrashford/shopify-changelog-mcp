/**
 * Search Changelog Tool - Search changelog by keyword or topic
 */

import {
  DEFAULT_LIMITS,
  fetchRSSFeed,
  parseRSSXML,
  filterEntriesByKeywords,
  searchEntries,
  sortEntriesByDate,
  limitEntries,
  removeDuplicateEntries,
  formatChangelogEntries
} from "../utils/index.js";
import type { ToolResponse } from "../types.js";

export async function executeSearchChangelog({ 
  query, 
  filter = [], 
  limit = DEFAULT_LIMITS.SEARCH 
}: { 
  query: string;
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
    
    // Apply keyword filters first if specified
    if (filter.length > 0) {
      entries = filterEntriesByKeywords(entries, filter);
    }
    
    // Perform search
    const matchedEntries = searchEntries(entries, query);
    
    // Apply limit
    const limitedEntries = limitEntries(matchedEntries, limit);
    
    // Format entries
    const formattedEntries = formatChangelogEntries(limitedEntries);
    
    let summary = `Found ${matchedEntries.length} entries matching "${query}"`;
    if (filter.length > 0) {
      summary += ` with filter: ${filter.join(', ')}`;
    }
    if (limitedEntries.length < matchedEntries.length) {
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
        text: `Error searching changelog: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}
