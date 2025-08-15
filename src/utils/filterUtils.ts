/**
 * Filtering and searching utilities for changelog entries
 */

import type { ChangelogEntry } from "../types.js";
import { BREAKING_KEYWORDS } from "./constants.js";

/**
 * Filter entries by keywords in title, description, and categories
 */
export function filterEntriesByKeywords(
  entries: ChangelogEntry[],
  keywords: string[]
): ChangelogEntry[] {
  if (keywords.length === 0) return entries;
  
  return entries.filter(entry =>
    keywords.some(keyword => {
      const lowerKeyword = keyword.toLowerCase();
      return (
        entry.title.toLowerCase().includes(lowerKeyword) ||
        entry.description.toLowerCase().includes(lowerKeyword) ||
        entry.categories.some(cat => cat.toLowerCase().includes(lowerKeyword))
      );
    })
  );
}

/**
 * Search entries by query terms (all terms must be found somewhere)
 */
export function searchEntries(
  entries: ChangelogEntry[],
  query: string
): ChangelogEntry[] {
  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
  
  if (searchTerms.length === 0) return entries;
  
  return entries.filter(entry => {
    const searchableText = `${entry.title} ${entry.description} ${entry.categories.join(' ')}`.toLowerCase();
    return searchTerms.some(term => searchableText.includes(term));
  });
}

/**
 * Filter entries for breaking changes and deprecations
 */
export function filterBreakingChanges(entries: ChangelogEntry[]): ChangelogEntry[] {
  return entries.filter(entry => {
    const content = `${entry.title} ${entry.description}`.toLowerCase();
    return BREAKING_KEYWORDS.some(keyword => content.includes(keyword));
  });
}

/**
 * Filter entries by API version
 */
export function filterByAPIVersion(
  entries: ChangelogEntry[],
  apiVersion: string
): ChangelogEntry[] {
  const versionPattern = apiVersion.toLowerCase();
  
  return entries.filter(entry => {
    const searchableText = `${entry.title} ${entry.description} ${entry.categories.join(' ')}`.toLowerCase();
    return searchableText.includes(versionPattern);
  });
}

/**
 * Filter entries by date range
 */
export function filterByDateRange(
  entries: ChangelogEntry[],
  startDate?: Date,
  endDate?: Date
): ChangelogEntry[] {
  if (!startDate && !endDate) return entries;
  
  return entries.filter(entry => {
    if (!entry.pubDate) return false;
    
    const entryDate = new Date(entry.pubDate);
    if (isNaN(entryDate.getTime())) return false;
    
    if (startDate && entryDate < startDate) return false;
    if (endDate && entryDate > endDate) return false;
    
    return true;
  });
}

/**
 * Sort entries by publication date (newest first)
 */
export function sortEntriesByDate(entries: ChangelogEntry[], ascending: boolean = false): ChangelogEntry[] {
  return [...entries].sort((a, b) => {
    const dateA = new Date(a.pubDate);
    const dateB = new Date(b.pubDate);
    
    // Handle invalid dates
    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;
    
    const comparison = dateB.getTime() - dateA.getTime(); // Newest first by default
    return ascending ? -comparison : comparison;
  });
}

/**
 * Limit entries to a specific count
 */
export function limitEntries(entries: ChangelogEntry[], limit: number): ChangelogEntry[] {
  return limit > 0 ? entries.slice(0, limit) : entries;
}

/**
 * Remove duplicate entries based on link or title
 */
export function removeDuplicateEntries(entries: ChangelogEntry[]): ChangelogEntry[] {
  const seen = new Set<string>();
  
  return entries.filter(entry => {
    const key = entry.link || entry.title;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
