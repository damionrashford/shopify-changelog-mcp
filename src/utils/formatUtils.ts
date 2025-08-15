/**
 * Formatting utilities for changelog entries and dates
 */

import type { ChangelogEntry } from "../types.js";

/**
 * Format a single changelog entry for display (compact single-line format)
 */
export function formatEntry(entry: ChangelogEntry, index: number = 0): string {
  const categories = entry.categories.length > 0 ? `[${entry.categories.join(', ')}]` : '';
  const date = formatDateCompact(entry.pubDate);
  const cleanDescription = stripHTMLTags(entry.description);
  const truncatedDescription = truncateText(cleanDescription, 120);
  
  return `${index + 1}. ${entry.title} ${categories} | ${date} | ${entry.link} | ${truncatedDescription}`;
}

/**
 * Format multiple changelog entries for display (compact format)
 */
export function formatChangelogEntries(entries: ChangelogEntry[]): string {
  if (entries.length === 0) {
    return 'No changelog entries found.';
  }
  
  return entries
    .map((entry, index) => formatEntry(entry, index))
    .join('\n');
}

/**
 * Format a date string for display
 */
export function formatDate(dateString: string): string {
  if (!dateString) return 'Unknown date';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return original if parsing fails
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

/**
 * Format a date string in compact format (MMM DD)
 */
export function formatDateCompact(dateString: string): string {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString.substring(0, 10); // Return first 10 chars if parsing fails
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString.substring(0, 10);
  }
}

/**
 * Format a date as ISO string for API responses
 */
export function formatDateISO(dateString: string): string | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString();
  } catch {
    return null;
  }
}

/**
 * Truncate text to a specific length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Clean HTML tags from text (simple cleanup for descriptions)
 */
export function stripHTMLTags(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/&amp;/g, '&')  // Replace HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
}

/**
 * Format categories as a readable string
 */
export function formatCategories(categories: string[]): string {
  if (categories.length === 0) return '';
  if (categories.length === 1) return categories[0];
  if (categories.length === 2) return categories.join(' and ');
  
  const lastCategory = categories[categories.length - 1];
  const otherCategories = categories.slice(0, -1);
  
  return `${otherCategories.join(', ')}, and ${lastCategory}`;
}

/**
 * Create a summary line for search results
 */
export function formatSearchSummary(
  query: string,
  totalFound: number,
  displayed: number,
  filters?: string[]
): string {
  let summary = `Found ${totalFound} entries`;
  
  if (query) {
    summary += ` matching "${query}"`;
  }
  
  if (filters && filters.length > 0) {
    summary += ` with filter: ${filters.join(', ')}`;
  }
  
  if (displayed < totalFound) {
    summary += ` (showing first ${displayed})`;
  }
  
  return summary;
}

/**
 * Format breaking changes warning
 */
export function formatBreakingChangesWarning(entryCount: number): string {
  if (entryCount === 0) return '';
  
  return "\n⚠️  IMPORTANT: These are breaking changes that may require code updates. Please review carefully and plan for necessary modifications.\n\n";
}
