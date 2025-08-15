/**
 * Server configuration and metadata
 */

export const SERVER_INFO = {
  name: "shopify-changelog",
  version: "1.0.0"
} as const;

export const SERVER_DESCRIPTION = "Shopify Developer Changelog MCP Server - Provides access to Shopify changelog RSS feed through fetch, search, and breaking changes tools";

/**
 * Debug logging helper
 */
export function debugLog(message: string): void {
  if (process.env.MCP_DEBUG === 'true') {
    console.error(`[${SERVER_INFO.name}] ${message}`);
  }
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
