/**
 * Server configuration and metadata
 */

import type { EnabledSources } from "./types.js";

export const SERVER_INFO = {
  name: "shopify-changelog",
  version: "2.0.0"
} as const;

export const SERVER_DESCRIPTION = "Shopify Changelog MCP Server - Provides access to both Developer and Platform changelog RSS feeds";

/**
 * Debug logging helper
 */
export function debugLog(message: string): void {
  if (process.env.MCP_DEBUG === 'true') {
    console.error(`[${SERVER_INFO.name}] ${message}`);
  }
}

/**
 * Get enabled changelog sources from environment variables
 * Both are enabled by default if not specified
 */
export function getEnabledSources(): EnabledSources {
  return {
    developer: process.env.developer_changelog !== 'false',  // Default true
    platform: process.env.platform_changelog !== 'false'     // Default true
  };
}

/**
 * Graceful shutdown handler
 */
export function setupGracefulShutdown(server: any): void {
  const shutdownHandler = async (signal: string) => {
    debugLog(`Received ${signal}, shutting down gracefully`);
    try {
      await server.close();
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdownHandler('SIGINT'));
  process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
}
