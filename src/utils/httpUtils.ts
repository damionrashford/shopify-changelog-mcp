/**
 * HTTP utilities for fetching external resources
 */

import { RSS_URL } from "./constants.js";

/**
 * HTTP request configuration
 */
const HTTP_CONFIG = {
  timeout: 10000, // 10 seconds
  headers: {
    'User-Agent': 'Shopify-Changelog-MCP/1.0.0',
    'Accept': 'application/rss+xml, application/xml, text/xml'
  }
} as const;

/**
 * Fetch RSS feed with proper error handling and timeout
 */
export async function fetchRSSFeed(url: string = RSS_URL): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HTTP_CONFIG.timeout);
    
    const response = await fetch(url, {
      headers: HTTP_CONFIG.headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('xml')) {
      console.warn(`Unexpected content type: ${contentType}`);
    }
    
    return await response.text();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout: RSS feed took too long to respond');
    }
    
    throw new Error(`Failed to fetch RSS feed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if RSS feed URL is accessible
 */
export async function healthCheckRSSFeed(url: string = RSS_URL): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Shorter timeout for health check
    
    const response = await fetch(url, {
      method: 'HEAD',
      headers: HTTP_CONFIG.headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}
