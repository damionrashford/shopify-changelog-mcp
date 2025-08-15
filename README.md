# Shopify Developer Changelog MCP Server

A Model Context Protocol (MCP) server that provides access to the Shopify Developer Changelog RSS feed. Built with TypeScript and designed for integration with MCP-compatible clients like Cursor.

## Overview

This server exposes four main tools for accessing Shopify changelog information:

- **fetch_changelog**: Retrieve changelog entries with filtering options
- **search_changelog**: Search through changelog entries by keywords
- **breaking_changes**: Find breaking changes and deprecations
- **fetch_individual_post**: Get the full content of individual changelog posts

## Features

- XML parsing using fast-xml-parser for RSS feeds
- HTML parsing using cheerio for individual post content
- Comprehensive filtering and search capabilities
- Breaking change detection and warnings
- Full post content extraction with proper formatting
- Browse-then-dive workflow: search truncated results, then fetch full posts
- Proper error handling and logging
- Clean, componentized architecture
- TypeScript type safety

## Requirements

- Node.js 18.0.0 or higher
- npm or compatible package manager

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/damionrashford/shopify-dev-changelog-mcp.git
   cd shopify-dev-changelog-mcp
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Usage

### Development

Run the server in development mode with auto-reload:

```bash
npm run dev
```

### Production

Build and start the server:

```bash
npm run build
npm run start
```

### Testing

Test server initialization:

```bash
npm run test
```

Manual testing with JSON-RPC:

```bash
# Initialize server
echo '{"jsonrpc":"2.0","id":"1","method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | npm run start

# List available tools
echo '{"jsonrpc":"2.0","id":"2","method":"tools/list"}' | npm run start
```

## MCP Client Configuration

### Cursor

Add to your `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "shopify-changelog": {
      "command": "node",
      "args": ["/path/to/shopify-dev-changelog-mcp/dist/index.js"]
    }
  }
}
```

Replace `/path/to/shopify-dev-changelog-mcp` with the actual path to your installation.

## Available Tools

### fetch_changelog

Fetches changelog entries with optional filtering.

**Parameters:**

- `filter` (optional): Array of keywords to filter by (API versions, content types, or keywords)
- `limit` (optional): Maximum number of entries to return (1-100, default: 10)

**Example:**

```json
{
  "name": "fetch_changelog",
  "arguments": {
    "filter": ["2024-10", "GraphQL"],
    "limit": 5
  }
}
```

### search_changelog

Search changelog entries by keywords or topics.

**Parameters:**

- `query` (required): Search keywords
- `filter` (optional): Additional filter by API version or content type
- `limit` (optional): Maximum number of entries to return (1-50, default: 10)

**Example:**

```json
{
  "name": "search_changelog",
  "arguments": {
    "query": "webhook validation",
    "limit": 5
  }
}
```

### breaking_changes

Retrieve breaking changes and deprecation notices.

**Parameters:**

- `apiVersion` (optional): Specific API version to filter by
- `limit` (optional): Maximum number of entries to return (1-50, default: 10)

**Example:**

```json
{
  "name": "breaking_changes",
  "arguments": {
    "apiVersion": "2024-07",
    "limit": 10
  }
}
```

### fetch_individual_post

Get the complete content of an individual changelog post from its URL. Perfect for getting full details after finding interesting posts through the other tools.

**Parameters:**

- `url` (required): Full URL of the Shopify changelog post to fetch

**Example:**

```json
{
  "name": "fetch_individual_post",
  "arguments": {
    "url": "https://shopify.dev/changelog/shopify-payments-payout-graphql-type-supports-externaltraceid"
  }
}
```

**Typical Workflow:**

1. Use `search_changelog` or `fetch_changelog` to find relevant posts (with truncated descriptions)
2. Copy the URL from the results
3. Use `fetch_individual_post` to get the complete post content including full descriptions, code examples, and detailed implementation notes

## Project Structure

```
src/
├── index.ts              # Main server entry point
├── server-config.ts      # Server configuration and utilities
├── types.ts              # Shared TypeScript interfaces
├── schemas/              # Tool schemas and configurations
│   ├── index.ts          # Schema exports
│   ├── schemas.ts        # Zod validation schemas
│   └── configs.ts        # Tool configurations
├── tools/                # MCP tool implementations
│   ├── index.ts          # Tool exports
│   ├── fetch-changelog.ts
│   ├── search-changelog.ts
│   ├── breaking-changes.ts
│   └── fetch-individual-post.ts
└── utils/                # Utility modules
    ├── index.ts          # Utility exports
    ├── constants.ts      # Application constants
    ├── httpUtils.ts      # HTTP and RSS fetching
    ├── rssParser.ts      # XML parsing with fast-xml-parser
    ├── filterUtils.ts    # Filtering and search logic
    └── formatUtils.ts    # Output formatting

dist/                     # Compiled JavaScript output
└── ...                   # All compiled files
```

## Scripts

- `npm run build` - Compile TypeScript and make server executable
- `npm run start` - Run the compiled server
- `npm run dev` - Development mode with auto-reload
- `npm run clean` - Remove build directory
- `npm run rebuild` - Clean build from scratch
- `npm run test` - Build and test server initialization

## Development

Enable debug logging by setting the `MCP_DEBUG` environment variable:

```bash
MCP_DEBUG=true npm run start
```

The server uses a modular architecture with clear separation of concerns:

- Tools handle MCP protocol integration
- Utils provide reusable business logic
- Clean interfaces between layers

## Error Handling

The server includes comprehensive error handling:

- Network timeouts and failures
- XML parsing errors
- Invalid input validation
- Graceful degradation

All errors are properly formatted for MCP client consumption.

## Dependencies

### Production

- `@modelcontextprotocol/sdk` - MCP SDK for TypeScript
- `fast-xml-parser` - XML parsing for RSS feeds
- `node-fetch` - HTTP requests
- `zod` - Schema validation
- `cheerio` - HTML parsing for individual post content

### Development

- `typescript` - TypeScript compiler
- `@types/node` - Node.js type definitions
- `@types/cheerio` - Cheerio type definitions
- `ts-node` - Direct TypeScript execution
- `nodemon` - Development auto-reload

## License

MIT

## Contributing

1. Fork the repository at [https://github.com/damionrashford/shopify-dev-changelog-mcp](https://github.com/damionrashford/shopify-dev-changelog-mcp)
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Ensure TypeScript compilation succeeds
6. Submit a pull request
