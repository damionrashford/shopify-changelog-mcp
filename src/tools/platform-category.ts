/**
 * Platform Category Tool - Get updates from specific platform categories
 */

import {
  DEFAULT_LIMITS,
  fetchPlatformRSSFeed,
  parseRSSXML,
  filterByRecentDays,
  sortEntriesByDate,
  limitEntries,
  removeDuplicateEntries,
  formatChangelogEntries,
  PLATFORM_CATEGORIES,
  type PlatformCategory
} from "../utils/index.js";
import type { ToolResponse } from "../types.js";

export async function executePlatformCategory({ 
  category,
  days,
  limit = DEFAULT_LIMITS.CATEGORY 
}: { 
  category: string | string[];
  days?: number;
  limit?: number;
}): Promise<ToolResponse> {
  try {
    // Handle single or multiple categories
    const categories = Array.isArray(category) ? category : [category];
    
    // Validate categories
    const validCategories = categories.filter(cat => 
      PLATFORM_CATEGORIES.includes(cat as PlatformCategory)
    ) as PlatformCategory[];
    
    if (validCategories.length === 0) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: `Error: Invalid category. Valid categories are: ${PLATFORM_CATEGORIES.join(', ')}`
        }]
      };
    }
    
    // Fetch platform RSS feed with category filter
    const xmlText = await fetchPlatformRSSFeed(validCategories);
    
    // Parse RSS XML
    let entries = parseRSSXML(xmlText);
    
    // Add source attribution
    entries = entries.map(entry => ({ ...entry, source: 'platform' as const }));
    
    // Remove duplicates
    entries = removeDuplicateEntries(entries);
    
    // Filter by recent days if specified
    if (days) {
      const validDays = [1, 3, 7, 14, 30];
      if (validDays.includes(days)) {
        entries = filterByRecentDays(entries, days);
      }
    }
    
    // Sort by date (newest first)
    entries = sortEntriesByDate(entries, false);
    
    // Apply limit
    const limitedEntries = limitEntries(entries, Math.min(limit, DEFAULT_LIMITS.MAX_ALLOWED));
    
    // Format entries
    const formattedEntries = formatChangelogEntries(limitedEntries);
    
    const categoryText = validCategories.length > 1 
      ? `categories: ${validCategories.join(', ')}` 
      : `category: ${validCategories[0]}`;
      
    const daysText = days ? ` from the last ${days} days` : '';
    const summary = `🛍️ Platform Changelog - ${entries.length} updates for ${categoryText}${daysText}${limitedEntries.length < entries.length ? ` (showing first ${limitedEntries.length})` : ''}`;
    
    if (entries.length === 0) {
      return {
        content: [{
          type: "text",
          text: `🛍️ Platform Changelog - No updates found for ${categoryText}${daysText}`
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
        text: `Error fetching platform category updates: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}


