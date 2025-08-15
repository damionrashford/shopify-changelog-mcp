/**
 * RSS/XML parsing utilities for Shopify Developer Changelog using fast-xml-parser
 */

import { XMLParser, XMLValidator } from 'fast-xml-parser';
import type { ChangelogEntry } from "../types.js";

/**
 * XML parser configuration for RSS feeds
 */
const XML_PARSER_OPTIONS = {
  ignoreAttributes: false,
  parseAttributeValue: false,
  trimValues: true,
  cdataPropName: "__cdata", // Handle CDATA sections
  parseTrueNumberOnly: false,
  arrayMode: false,
  alwaysCreateTextNode: false,
  isArray: (name: string, _jpath: string, _isLeafNode: boolean, _isAttribute: boolean) => {
    // Ensure these elements are always arrays
    return ['item', 'category'].includes(name);
  }
};

/**
 * Production-ready RSS XML parser using fast-xml-parser
 */
export function parseRSSXML(xml: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  
  try {
    // Validate XML first
    const validationResult = XMLValidator.validate(xml);
    if (validationResult !== true) {
      throw new Error(`Invalid XML: ${validationResult.err?.msg || 'Unknown validation error'}`);
    }
    
    // Parse XML
    const parser = new XMLParser(XML_PARSER_OPTIONS);
    const parsedXml = parser.parse(xml);
    
    // Navigate to RSS items
    const rssItems = parsedXml?.rss?.channel?.item || [];
    const itemsArray = Array.isArray(rssItems) ? rssItems : [rssItems];
    
    for (const item of itemsArray) {
      if (!item) continue;
      
      try {
        const entry: ChangelogEntry = {
          title: extractTextContent(item.title) || '',
          link: extractTextContent(item.link) || '',
          description: extractTextContent(item.description) || '',
          pubDate: extractTextContent(item.pubDate) || '',
          categories: extractCategories(item.category)
        };
        
        entries.push(entry);
      } catch (error) {
        console.warn('Failed to parse RSS item:', error);
        continue;
      }
    }
  } catch (error) {
    console.error('Failed to parse RSS XML:', error);
    throw new Error(`XML parsing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return entries;
}

/**
 * Extract text content from parsed XML element (handles CDATA and regular text)
 */
function extractTextContent(element: any): string | null {
  if (!element) return null;
  
  // Handle CDATA sections
  if (element.__cdata) {
    return String(element.__cdata).trim();
  }
  
  // Handle regular text content
  if (typeof element === 'string') {
    return element.trim();
  }
  
  // Handle objects with text content
  if (element['#text']) {
    return String(element['#text']).trim();
  }
  
  // Convert to string as fallback
  return String(element).trim();
}

/**
 * Extract categories from parsed XML (handles single or multiple categories)
 */
function extractCategories(categoryElement: any): string[] {
  if (!categoryElement) return [];
  
  // Handle array of categories
  if (Array.isArray(categoryElement)) {
    return categoryElement
      .map(cat => extractTextContent(cat))
      .filter((cat): cat is string => cat !== null && cat.length > 0);
  }
  
  // Handle single category
  const singleCategory = extractTextContent(categoryElement);
  return singleCategory ? [singleCategory] : [];
}

/**
 * Validate RSS XML structure
 */
export function validateRSSStructure(xml: string): { isValid: boolean; error?: string } {
  try {
    const validationResult = XMLValidator.validate(xml);
    if (validationResult !== true) {
      return {
        isValid: false,
        error: validationResult.err?.msg || 'Invalid XML structure'
      };
    }
    
    // Additional RSS-specific validation
    const parser = new XMLParser(XML_PARSER_OPTIONS);
    const parsedXml = parser.parse(xml);
    
    if (!parsedXml?.rss?.channel) {
      return {
        isValid: false,
        error: 'Missing required RSS channel structure'
      };
    }
    
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error'
    };
  }
}
