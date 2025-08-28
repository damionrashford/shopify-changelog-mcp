# Shopify Changelog MCP Server

A Model Context Protocol (MCP) server that provides access to both Shopify Developer and Platform changelog RSS feeds. Built with TypeScript and designed for integration with MCP-compatible clients like Cursor.

## Overview

This server exposes 8 specialized tools for accessing Shopify changelog information across two sources:

- **Developer Changelog** (`shopify.dev/changelog`) - API updates, deprecations, technical changes
- **Platform Changelog** (`changelog.shopify.com`) - Product updates, merchant features, UI changes

## Features

- **Dual Source Support**: Access both Developer and Platform changelogs
- **Configurable Sources**: Enable/disable sources via environment variables
- **Smart Limits**: Never overwhelms with data (10-30 entries max per request)
- **Category Filtering**: Platform changelog supports 19+ category filters
- **Recent Updates**: Filter by time period (1, 3, 7, 14, or 30 days)
- **Unified Search**: Search across both sources simultaneously
- **Source Attribution**: Clear indication of which changelog each result comes from
- **Full Content Retrieval**: Fetch complete post content when needed

## Requirements

- Node.js 18.0.0 or higher
- npm or compatible package manager

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/damionrashford/shopify-changelog-mcp.git
   cd shopify-changelog-mcp
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Configuration

### Cursor Integration

Add to your `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "shopify-changelog": {
      "command": "node",
      "args": ["/path/to/shopify-changelog-mcp/dist/index.js"],
      "env": {
        "developer_changelog": "true",
        "platform_changelog": "true"
      }
    }
  }
}
```

### Environment Variables

Both sources are enabled by default. You can customize which sources are available:

```json
{
  "env": {
    "developer_changelog": "true", // Set to "false" to disable
    "platform_changelog": "true" // Set to "false" to disable
  }
}
```

#### Configuration Examples:

**Both Sources (Default)**

```json
// No env needed, both enabled by default
{
  "command": "node",
  "args": ["/path/to/dist/index.js"]
}
```

**Developer Only**

```json
{
  "env": {
    "developer_changelog": "true",
    "platform_changelog": "false"
  }
}
```

**Platform Only**

```json
{
  "env": {
    "developer_changelog": "false",
    "platform_changelog": "true"
  }
}
```

## Available Tools

The tools available depend on which sources are enabled:

### When Both Sources Enabled (Default)

#### Developer Tools

- **`dev_search`** - Search developer changelog for API updates
- **`dev_breaking_changes`** - Find breaking changes and deprecations
- **`dev_recent`** - Get recent developer updates (configurable days)

#### Platform Tools

- **`platform_search`** - Search platform changelog for product updates
- **`platform_category`** - Get updates from specific categories (POS, Admin, etc.)
- **`platform_recent`** - Get recent platform updates (configurable days)

#### Universal Tools

- **`get_post`** - Get full content of any changelog post
- **`search_all`** - Search both changelogs simultaneously

### When Only One Source Enabled

Tools use simplified names (no prefix) when only one source is active.

## Tool Details

### dev_search / platform_search

Search for specific topics or keywords in the respective changelog.

**Parameters:**

- `query` (required): Search keywords
- `limit` (optional): Max results (1-30, default: 15)

**Example:**

```json
{
  "name": "dev_search",
  "arguments": {
    "query": "GraphQL mutations",
    "limit": 10
  }
}
```

### dev_recent / platform_recent

Get recent updates from the specified time period.

**Parameters:**

- `days` (optional): Look back period - 1, 3, 7, 14, or 30 (default: 7)
- `limit` (optional): Max results (1-30, default: 10)

**Example:**

```json
{
  "name": "platform_recent",
  "arguments": {
    "days": 3,
    "limit": 15
  }
}
```

### platform_category

Get updates from specific platform categories.

**Parameters:**

- `category` (required): Category name or array of names
- `days` (optional): Filter by recent days
- `limit` (optional): Max results (1-30, default: 10)

**Available Categories:**

- `admin`, `analytics`, `apps`, `b2b`, `checkout`
- `collective`, `customers`, `international`, `inventory`
- `marketing`, `mobile`, `online-store`, `orders`
- `payments`, `pos`, `products`, `shipping`, `shop`, `themes`

**Example:**

```json
{
  "name": "platform_category",
  "arguments": {
    "category": ["pos", "payments"],
    "days": 7
  }
}
```

### dev_breaking_changes

Get breaking changes and deprecation notices from the developer changelog.

**Parameters:**

- `limit` (optional): Max results (1-30, default: 15)

### get_post

Retrieve the complete content of a specific changelog post.

**Parameters:**

- `url` (required): Full URL of the changelog post

**Example:**

```json
{
  "name": "get_post",
  "arguments": {
    "url": "https://shopify.dev/changelog/graphql-api-update-2024"
  }
}
```

### search_all

Search across both developer and platform changelogs.

**Parameters:**

- `query` (required): Search keywords
- `sources` (optional): Array of sources to search (defaults to all enabled)
- `limit` (optional): Max total results (1-30, default: 15)

## Output Format

All tools return formatted results with clear source attribution in a compact single-line format:

```
1. 📘 [Developer] GraphQL Admin API: New bulk operations [API, GraphQL] | Dec 11 | https://shopify.dev/changelog/graphql-bulk-operations | The GraphQL Admin API now supports bulk operations for...
2. 🛍️ [Platform] POS: Offline mode improvements [POS, Mobile] | Dec 10 | https://changelog.shopify.com/posts/pos-offline-improvements | Point of Sale now offers enhanced offline capabilities...
```

## Development

### Scripts

- `npm run build` - Compile TypeScript
- `npm run start` - Run the compiled server
- `npm run dev` - Development mode with auto-reload
- `npm run clean` - Remove build directory
- `npm run test` - Test server initialization

### Debug Mode

Enable debug logging:

```bash
MCP_DEBUG=true npm run start
```
