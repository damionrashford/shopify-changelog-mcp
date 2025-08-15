/**
 * Breaking Changes Tool - Get breaking changes and deprecations
 */

import {
  DEFAULT_LIMITS,
  fetchRSSFeed,
  parseRSSXML,
  filterBreakingChanges,
  filterByAPIVersion,
  sortEntriesByDate,
  limitEntries,
  removeDuplicateEntries,
  formatChangelogEntries,
  formatBreakingChangesWarning
} from "../utils/index.js";
import type { ToolResponse } from "../types.js";

export async function executeBreakingChanges({ 
  apiVersion, 
  limit = DEFAULT_LIMITS.BREAKING_CHANGES 
}: { 
  apiVersion?: string;
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
    
    // Apply API version filter first if specified
    if (apiVersion) {
      entries = filterByAPIVersion(entries, apiVersion);
    }
    
    // Filter for breaking changes
    let breakingEntries = filterBreakingChanges(entries);
    
    // Apply limit
    const limitedEntries = limitEntries(breakingEntries, limit);
    
    // Format entries
    const formattedEntries = formatChangelogEntries(limitedEntries);
    
    let summary = `Found ${breakingEntries.length} breaking changes/deprecations`;
    if (apiVersion) {
      summary += ` for API version ${apiVersion}`;
    }
    if (limitedEntries.length < breakingEntries.length) {
      summary += ` (showing first ${limitedEntries.length})`;
    }
    
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
        text: `Error fetching breaking changes: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}
