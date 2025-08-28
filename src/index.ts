#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Import server configuration and utilities
import { 
  SERVER_INFO, 
  debugLog, 
  setupGracefulShutdown,
  getEnabledSources 
} from "./server-config.js";

// Import tool configurations and handlers
import {
  // Developer tools
  DEV_SEARCH_CONFIG,
  DEV_BREAKING_CHANGES_CONFIG,
  DEV_RECENT_CONFIG,
  executeDevSearch,
  executeDevBreakingChanges,
  executeDevRecent,
  
  // Platform tools
  PLATFORM_SEARCH_CONFIG,
  PLATFORM_CATEGORY_CONFIG,
  PLATFORM_RECENT_CONFIG,
  executePlatformSearch,
  executePlatformCategory,
  executePlatformRecent,
  
  // Universal tools
  GET_POST_CONFIG,
  SEARCH_ALL_CONFIG,
  executeGetPost,
  executeSearchAll
} from "./tools/index.js";

/**
 * Shopify Changelog MCP Server
 * 
 * Provides access to both Developer and Platform Shopify changelogs
 * with configurable source selection via environment variables
 */
class ShopifyChangelogServer {
  private server: McpServer;
  private enabledSources: ReturnType<typeof getEnabledSources>;
  private toolCount: number = 0;

  constructor() {
    this.server = new McpServer(SERVER_INFO);
    this.enabledSources = getEnabledSources();
    this.registerTools();
  }

  /**
   * Register all MCP tools conditionally based on enabled sources
   */
  private registerTools(): void {
    const sources = this.enabledSources;
    
    debugLog(`Enabled sources: developer=${sources.developer}, platform=${sources.platform}`);
    
    // Count enabled sources
    const enabledCount = [sources.developer, sources.platform].filter(Boolean).length;
    
    // Universal tool - always available
    this.server.registerTool(
      "get_post",
      GET_POST_CONFIG,
      executeGetPost
    );
    this.toolCount++;
    
    // Developer tools (if enabled)
    if (sources.developer) {
      // If only developer is enabled, use simple names
      const prefix = enabledCount === 1 ? '' : 'dev_';
      
      this.server.registerTool(
        `${prefix}search${prefix ? '' : '_changelog'}`,
        DEV_SEARCH_CONFIG,
        executeDevSearch
      );
      
      this.server.registerTool(
        `${prefix}breaking_changes`,
        DEV_BREAKING_CHANGES_CONFIG,
        executeDevBreakingChanges
      );
      
      this.server.registerTool(
        `${prefix}recent`,
        DEV_RECENT_CONFIG,
        executeDevRecent
      );
      
      this.toolCount += 3;
      
      debugLog('Developer changelog tools registered');
    }
    
    // Platform tools (if enabled)
    if (sources.platform) {
      // If only platform is enabled, use simple names
      const prefix = enabledCount === 1 ? '' : 'platform_';
      
      this.server.registerTool(
        `${prefix}search${prefix ? '' : '_changelog'}`,
        PLATFORM_SEARCH_CONFIG,
        executePlatformSearch
      );
      
      this.server.registerTool(
        `${prefix}category`,
        PLATFORM_CATEGORY_CONFIG,
        executePlatformCategory
      );
      
      this.server.registerTool(
        `${prefix}recent`,
        PLATFORM_RECENT_CONFIG,
        executePlatformRecent
      );
      
      this.toolCount += 3;
      debugLog('Platform changelog tools registered');
    }
    
    // Combined search tool (only if both sources are enabled)
    if (sources.developer && sources.platform) {
      this.server.registerTool(
        "search_all",
        SEARCH_ALL_CONFIG,
        executeSearchAll
      );
      this.toolCount++;
      debugLog('Combined search tool registered');
    }
    
    // Validation: ensure at least one source is enabled
    if (!sources.developer && !sources.platform) {
      console.warn('Warning: No changelog sources enabled. Enabling developer by default.');
      // Re-register with developer tools
      this.enabledSources.developer = true;
      this.registerTools();
      return;
    }
    
    debugLog(`Total tools registered: ${this.toolCount}`);
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    
    const sourcesText = [];
    if (this.enabledSources.developer) sourcesText.push('Developer');
    if (this.enabledSources.platform) sourcesText.push('Platform');
    
    debugLog(`Starting ${SERVER_INFO.name} v${SERVER_INFO.version}`);
    debugLog(`Active changelog sources: ${sourcesText.join(', ')}`);
    debugLog(`Tools available: ${this.toolCount}`);
    
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