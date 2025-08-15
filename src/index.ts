#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Import server configuration and utilities
import { SERVER_INFO, debugLog, setupGracefulShutdown } from "./server-config.js";

// Import tool configurations and handlers
import {
  FETCH_CHANGELOG_CONFIG,
  SEARCH_CHANGELOG_CONFIG, 
  BREAKING_CHANGES_CONFIG,
  executeFetchChangelog,
  executeSearchChangelog,
  executeBreakingChanges
} from "./tools/index.js";

/**
 * Shopify Developer Changelog MCP Server
 * 
 * This server provides access to the Shopify Developer Changelog RSS feed
 * through three main tools: fetch_changelog, search_changelog, and breaking_changes
 */
class ShopifyChangelogServer {
  private server: McpServer;

  constructor() {
    this.server = new McpServer(SERVER_INFO);
    this.registerTools();
  }

  /**
   * Register all MCP tools with the server
   */
  private registerTools(): void {
    // Tool 1: fetch_changelog
    this.server.registerTool(
      "fetch_changelog",
      FETCH_CHANGELOG_CONFIG,
      executeFetchChangelog
    );

    // Tool 2: search_changelog 
    this.server.registerTool(
      "search_changelog",
      SEARCH_CHANGELOG_CONFIG,
      executeSearchChangelog
    );

    // Tool 3: breaking_changes
    this.server.registerTool(
      "breaking_changes",
      BREAKING_CHANGES_CONFIG,
      executeBreakingChanges
    );

    debugLog('All tools registered successfully');
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    
    debugLog(`Starting ${SERVER_INFO.name} v${SERVER_INFO.version}`);
    debugLog('Tools registered: 3 tools loaded successfully');
    
    await this.server.connect(transport);
    
    // Set up graceful shutdown handling
    setupGracefulShutdown(this.server);
    
    debugLog('Server started and ready for connections');
  }
}

/**
 * Main entry point
 */
async function main() {
  try {
    const server = new ShopifyChangelogServer();
    await server.start();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Run the server
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
