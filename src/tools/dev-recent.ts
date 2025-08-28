/**
 * Developer Recent Tool - Get recent developer changelog updates
 */

import {
  DEFAULT_LIMITS,
  fetchDeveloperRSSFeed,
  parseRSSXML,
  filterByRecentDays,
  sortEntriesByDate,
  limitEntries,
  removeDuplicateEntries,
  formatChangelogEntries
} from "../utils/index.js";
import type { ToolResponse } from "../types.js";

export async function executeDevRecent({ 
  days = 7,
  limit = DEFAULT_LIMITS.RECENT 
}: { 
  days?: number;
  limit?: number;
}): Promise<ToolResponse> {
  try {
    // Validate days parameter
    const validDays = [1, 3, 7, 14, 30];
    if (!validDays.includes(days)) {
      days = 7; // Default to 7 if invalid
    }
    
    // Fetch developer RSS feed
    const xmlText = await fetchDeveloperRSSFeed();
    
    // Parse RSS XML
    let entries = parseRSSXML(xmlText);
    
    // Add source attribution
    entries = entries.map(entry => ({ ...entry, source: 'developer' as const }));
    
    // Remove duplicates
    entries = removeDuplicateEntries(entries);
    
    // Filter by recent days
    entries = filterByRecentDays(entries, days);
    
    // Sort by date (newest first)
    entries = sortEntriesByDate(entries, false);
    
    // Apply limit
    const limitedEntries = limitEntries(entries, Math.min(limit, DEFAULT_LIMITS.MAX_ALLOWED));
    
    // Format entries
    const formattedEntries = formatChangelogEntries(limitedEntries);
    
    const daysText = days === 1 ? 'last 24 hours' : `last ${days} days`;
    const summary = `📘 Developer Changelog - ${entries.length} updates from the ${daysText}${limitedEntries.length < entries.length ? ` (showing first ${limitedEntries.length})` : ''}`;
    
    if (entries.length === 0) {
      return {
        content: [{
          type: "text",
          text: `📘 Developer Changelog - No updates in the ${daysText}`
        }]
      };
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
        text: `Error fetching recent developer updates: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}


