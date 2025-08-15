# Shopify Changelog MCP Server

A Model Context Protocol (MCP) server that provides access to the Shopify Developer Changelog RSS feed. This server enables AI assistants to fetch, search, and analyze Shopify platform updates, API changes, deprecations, and new features.

## Features

- Fetch changelog entries with comprehensive filtering options
- Search for specific topics or keywords in the changelog
- Get breaking changes and deprecations requiring action
- Filter by API versions, API types, content categories
- Real-time access to official Shopify Developer Changelog

## Requirements

- **Ruby 3.2.0 or higher** (REQUIRED - MCP gem requires Ruby >= 3.2.0)
- Bundler gem installed

### Ruby Version Check

Check your Ruby version:

```bash
ruby --version
```

If you have Ruby < 3.2.0, you need to upgrade. Options:

#### Option 1: Install with Homebrew (macOS)

```bash
brew install ruby
echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

#### Option 2: Use rbenv (Recommended)

```bash
# Install rbenv
brew install rbenv ruby-build

# Add to shell
echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
source ~/.zshrc

# Install Ruby 3.3.0 or later
rbenv install 3.3.0
rbenv global 3.3.0
```

#### Option 3: Use RVM

```bash
# Install RVM
\curl -sSL https://get.rvm.io | bash -s stable
source ~/.rvm/scripts/rvm

# Install Ruby 3.3.0 or later
rvm install 3.3.0
rvm use 3.3.0 --default
```

## Installation

1. Clone this repository:

```bash
git clone https://github.com/your-username/shopify-changelog-mcp.git
cd shopify-changelog-mcp
```

2. Install dependencies:

```bash
bundle install
```

3. Make the server executable:

```bash
chmod +x server.rb
```

## Usage

### Standalone Testing

Test the server directly via command line:

```bash
bundle exec ruby server.rb
```

Then send JSON-RPC requests via stdin:

```json
{"jsonrpc":"2.0","id":"1","method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test"}}}
{"jsonrpc":"2.0","id":"2","method":"tools/list"}
```

### Integration with MCP Clients

#### Cursor

Add to your Cursor MCP settings:

1. Open Cursor Settings
2. Navigate to **Features > MCP**
3. Click **"+ Add New MCP Server"**
4. Configure with:
   - **Name**: Shopify Changelog
   - **Transport Type**: stdio
   - **Command**: `bundle`
   - **Arguments**: `["exec", "ruby", "/path/to/shopify-changelog-mcp/server.rb"]`

Or add directly to your Cursor configuration:

```json
{
  "mcpServers": {
    "shopify-changelog": {
      "command": "bundle",
      "args": ["exec", "ruby", "/path/to/shopify-changelog-mcp/server.rb"],
      "env": {
        "BUNDLE_GEMFILE": "/path/to/shopify-changelog-mcp/Gemfile"
      }
    }
  }
}
```

#### Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "shopify-changelog": {
      "command": "/usr/bin/env",
      "args": ["ruby", "/path/to/shopify-changelog-mcp/server.rb"],
      "env": {
        "BUNDLE_GEMFILE": "/path/to/shopify-changelog-mcp/Gemfile"
      }
    }
  }
}
```

## Available Tools

### 1. fetch_changelog_tool

Fetches changelog entries with filtering options.

**Parameters:**

- `filter` (required): Array of content types ["api", "tools", "platform", "themes", "shopify_app_store", "shopify_theme_store", "built_for_shopify", "polaris"]
- `action_required`: Boolean to filter entries requiring action (default: false)
- `api_version`: Filter by API version (2025-10, 2025-07, 2025-04, 2025-01, 2024-10, 2024-07, 2024-04, 2024-01)
- `api_type`: Filter by API type (admin-graphql, admin-rest, storefront-graphql, customer-account-graphql, payments-apps-api, webhook, liquid, app-bridge)
- `limit`: Maximum number of entries to return (default: 10)

**Example:**

```json
{
  "filter": ["api"],
  "api_version": "2025-10",
  "limit": 5
}
```

### 2. search_changelog_tool

Search changelog entries by keyword or topic.

**Parameters:**

- `query` (required): Search term to find in entries
- `filter`: Array of content types to search within (default: ["api", "platform", "tools"])
- `date_from`: Filter entries from this date (YYYY-MM-DD)
- `date_to`: Filter entries up to this date (YYYY-MM-DD)
- `limit`: Maximum number of results (default: 10)

**Example:**

```json
{
  "query": "GraphQL",
  "filter": ["api"],
  "limit": 5
}
```

### 3. breaking_changes_tool

Get breaking changes and deprecations requiring action.

**Parameters:**

- `api_version`: Filter by specific API version
- `api_type`: Filter by API type
- `days_back`: Number of days to look back (default: 90)
- `include_deprecations`: Include deprecation announcements (default: true)
- `limit`: Maximum number of entries (default: 20)

**Example:**

```json
{
  "days_back": 60,
  "include_deprecations": true,
  "limit": 10
}
```

## Project Structure

```
shopify-changelog-mcp/
├── server.rb                    # Main MCP server
├── tools/
│   ├── fetch_changelog_tool.rb  # Fetch filtered changelog entries
│   ├── search_changelog_tool.rb # Search changelog by keywords
│   └── breaking_changes_tool.rb # Get breaking changes & deprecations
├── Gemfile                      # Ruby dependencies
├── .rubocop.yml                 # Ruby style guide configuration
└── README.md                    # This file
```

## Debugging

Enable debug logging by setting the environment variable:

```bash
MCP_DEBUG=true bundle exec ruby server.rb
```

Debug logs will be sent to stderr to avoid interfering with the stdio protocol.

## Error Handling

The server includes comprehensive error handling:

- HTTP errors when fetching the RSS feed
- XML parsing errors
- Network timeouts (10 seconds)
- Graceful shutdown on SIGINT/SIGTERM
- Automatic retry logic for transient failures

## Data Source

This server fetches data from the official Shopify Developer Changelog RSS feed:

- **URL**: https://shopify.dev/changelog/feed.xml
- **Format**: RSS 2.0 with Atom namespace
- **Update Frequency**: Real-time as Shopify publishes updates

## License

MIT
