/**
 * Search All Tool - Search across both developer and platform changelogs
 */

import {
  DEFAULT_LIMITS,
  fetchDeveloperRSSFeed,
  fetchPlatformRSSFeed,
  parseRSSXML,
  searchEntries,
  sortEntriesByDate,
  limitEntries,
  removeDuplicateEntries,
  formatChangelogEntries
} from "../utils/index.js";
import type { ToolResponse, ChangelogEntry } from "../types.js";

export async function executeSearchAll({ 
  query,
  sources = ['developer', 'platform'],
  limit = DEFAULT_LIMITS.SEARCH 
}: { 
  query: string;
  sources?: ('developer' | 'platform')[];
  limit?: number;
}): Promise<ToolResponse> {
  try {
    const allEntries: ChangelogEntry[] = [];
    const searchResults: { source: string; count: number }[] = [];
    
    // Fetch from enabled sources in parallel
    const fetchPromises = [];
    
    if (sources.includes('developer')) {
      fetchPromises.push(
        fetchDeveloperRSSFeed().then(xml => ({
          source: 'developer' as const,
          xml
        }))
      );
    }
    
    if (sources.includes('platform')) {
      fetchPromises.push(
        fetchPlatformRSSFeed().then(xml => ({
          source: 'platform' as const,
          xml
        }))
      );
    }
    
    if (fetchPromises.length === 0) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: "Error: No valid sources specified for search"
        }]
      };
    }
    
    // Fetch all sources in parallel
    const results = await Promise.all(fetchPromises);
    
    // Parse and process each source
    for (const { source, xml } of results) {
      let entries = parseRSSXML(xml);
      
      // Add source attribution
      entries = entries.map(entry => ({ ...entry, source }));
      
      // Remove duplicates within this source
      entries = removeDuplicateEntries(entries);
      
      // Search entries
      const matchedEntries = searchEntries(entries, query);
      
      searchResults.push({ source, count: matchedEntries.length });
      allEntries.push(...matchedEntries);
    }
    
    // Sort all entries by date (newest first)
    const sortedEntries = sortEntriesByDate(allEntries, false);
    
    // Apply limit
    const limitedEntries = limitEntries(sortedEntries, Math.min(limit, DEFAULT_LIMITS.MAX_ALLOWED));
    
    // Format entries
    const formattedEntries = formatChangelogEntries(limitedEntries);
    
    // Build summary
    const totalFound = allEntries.length;
    const sourceDetails = searchResults
      .filter(r => r.count > 0)
      .map(r => `${r.source}: ${r.count}`)
      .join(', ');
    
    const sourcesText = sources.length === 2 ? 'both changelogs' : sources.join(' and ') + ' changelog';
    const summary = `🔍 Search across ${sourcesText} - Found ${totalFound} entries matching "${query}"${sourceDetails ? ` (${sourceDetails})` : ''}${limitedEntries.length < totalFound ? ` - showing first ${limitedEntries.length}` : ''}`;
    
    if (totalFound === 0) {
      return {
        content: [{
          type: "text",
          text: `🔍 No entries found matching "${query}" in ${sourcesText}`
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
        text: `Error searching changelogs: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}


