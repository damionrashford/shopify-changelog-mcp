/**
 * Developer Breaking Changes Tool - Get breaking changes and deprecations
 */

import {
  DEFAULT_LIMITS,
  fetchDeveloperRSSFeed,
  parseRSSXML,
  filterBreakingChanges,
  sortEntriesByDate,
  limitEntries,
  removeDuplicateEntries,
  formatChangelogEntries,
  formatBreakingChangesWarning
} from "../utils/index.js";
import type { ToolResponse } from "../types.js";

export async function executeDevBreakingChanges({ 
  limit = DEFAULT_LIMITS.BREAKING_CHANGES 
}: { 
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
    
    // Filter for breaking changes
    let breakingEntries = filterBreakingChanges(entries);
    
    // Apply limit
    const limitedEntries = limitEntries(breakingEntries, Math.min(limit, DEFAULT_LIMITS.MAX_ALLOWED));
    
    // Format entries
    const formattedEntries = formatChangelogEntries(limitedEntries);
    
    const summary = `📘 Developer Changelog - Found ${breakingEntries.length} breaking changes/deprecations${limitedEntries.length < breakingEntries.length ? ` (showing first ${limitedEntries.length})` : ''}`;
    
    // Add a warning about the importance of breaking changes
    const warningText = formatBreakingChangesWarning(limitedEntries.length);
    
    return {
      content: [{
        type: "text",
        text: `${summary}${warningText}${formattedEntries}`
      }]
    };
  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error fetching developer breaking changes: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}


