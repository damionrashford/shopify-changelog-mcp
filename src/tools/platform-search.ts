/**
 * Platform Search Tool - Search platform changelog by keyword
 */

import {
  DEFAULT_LIMITS,
  fetchPlatformRSSFeed,
  parseRSSXML,
  searchEntries,
  sortEntriesByDate,
  limitEntries,
  removeDuplicateEntries,
  formatChangelogEntries
} from "../utils/index.js";
import type { ToolResponse } from "../types.js";

export async function executePlatformSearch({ 
  query,
  limit = DEFAULT_LIMITS.SEARCH 
}: { 
  query: string;
  limit?: number;
}): Promise<ToolResponse> {
  try {
    // Fetch platform RSS feed (all categories)
    const xmlText = await fetchPlatformRSSFeed();
    
    // Parse RSS XML
    let entries = parseRSSXML(xmlText);
    
    // Add source attribution
    entries = entries.map(entry => ({ ...entry, source: 'platform' as const }));
    
    // Remove duplicates
    entries = removeDuplicateEntries(entries);
    
    // Sort by date (newest first)
    entries = sortEntriesByDate(entries, false);
    
    // Perform search
    const matchedEntries = searchEntries(entries, query);
    
    // Apply limit
    const limitedEntries = limitEntries(matchedEntries, Math.min(limit, DEFAULT_LIMITS.MAX_ALLOWED));
    
    // Format entries
    const formattedEntries = formatChangelogEntries(limitedEntries);
    
    const summary = `🛍️ Platform Changelog - Found ${matchedEntries.length} entries matching "${query}"${limitedEntries.length < matchedEntries.length ? ` (showing first ${limitedEntries.length})` : ''}`;
    
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
        text: `Error searching platform changelog: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}


