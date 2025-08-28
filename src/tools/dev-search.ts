/**
 * Developer Search Tool - Search developer changelog by keyword
 */

import {
  DEFAULT_LIMITS,
  fetchDeveloperRSSFeed,
  parseRSSXML,
  searchEntries,
  sortEntriesByDate,
  limitEntries,
  removeDuplicateEntries,
  formatChangelogEntries
} from "../utils/index.js";
import type { ToolResponse } from "../types.js";

export async function executeDevSearch({ 
  query,
  limit = DEFAULT_LIMITS.SEARCH 
}: { 
  query: string;
  limit?: number;
}): Promise<ToolResponse> {
  try {
    // Fetch developer RSS feed
    const xmlText = await fetchDeveloperRSSFeed();
    
    // Parse RSS XML
    let entries = parseRSSXML(xmlText);
    
    // Add source attribution
    entries = entries.map(entry => ({ ...entry, source: 'developer' as const }));
    
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
    
    const summary = `📘 Developer Changelog - Found ${matchedEntries.length} entries matching "${query}"${limitedEntries.length < matchedEntries.length ? ` (showing first ${limitedEntries.length})` : ''}`;
    
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
        text: `Error searching developer changelog: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}


