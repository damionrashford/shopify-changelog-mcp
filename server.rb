#!/usr/bin/env ruby
# frozen_string_literal: true

require 'bundler/setup'
require 'mcp'
require 'mcp/server/transports/stdio_transport'
require 'logger'

# Load all tool classes
require_relative 'tools/fetch_changelog_tool'
require_relative 'tools/search_changelog_tool'
require_relative 'tools/breaking_changes_tool'

# Configure MCP with error handling
MCP.configure do |config|
  # Set up exception reporting
  config.exception_reporter = lambda { |exception, server_context|
    # Log errors to stderr so they don't interfere with stdio protocol
    logger = Logger.new($stderr)
    logger.error("MCP Server Error: #{exception.class} - #{exception.message}")
    logger.error(exception.backtrace.join("\n")) if exception.backtrace
    logger.error("Context: #{server_context.inspect}")
  }

  # Set up instrumentation for debugging (optional)
  config.instrumentation_callback = lambda { |data|
    # Log to stderr for debugging
    if ENV['MCP_DEBUG'] == 'true'
      logger = Logger.new($stderr)
      logger.info("MCP Instrumentation: #{data.inspect}")
    end
  }
end

# Create the MCP server with tools
server = MCP::Server.new(
  name: 'shopify-changelog',
  version: '1.0.0',
  tools: [
    ShopifyChangelog::FetchChangelogTool,
    ShopifyChangelog::SearchChangelogTool,
    ShopifyChangelog::BreakingChangesTool
  ]
)

# Add custom notification handlers for dynamic tool updates
server.define_custom_method(method_name: 'changelog/notify') do |_params|
  # This could be used to notify about new changelog entries
  # For now, just acknowledge the notification
  { status: 'acknowledged', timestamp: Time.now.iso8601 }
end

# Add a health check method
server.define_custom_method(method_name: 'health') do |_params|
  {
    status: 'healthy',
    server: 'shopify-changelog',
    version: '1.0.0',
    tools_count: 3,
    timestamp: Time.now.iso8601
  }
end

# Start the stdio transport
begin
  # Log startup to stderr
  if ENV['MCP_DEBUG'] == 'true'
    logger = Logger.new($stderr)
    logger.info('Starting Shopify Changelog MCP Server v1.0.0')
    logger.info("Tools registered: #{server.tools.map(&:name).join(', ')}")
  end

  # Create and start the stdio transport
  transport = MCP::Server::Transports::StdioTransport.new(server)

  # Set up signal handlers for graceful shutdown
  Signal.trap('INT') do
    warn "\nShutting down Shopify Changelog MCP Server..."
    exit(0)
  end

  Signal.trap('TERM') do
    warn "\nShutting down Shopify Changelog MCP Server..."
    exit(0)
  end

  # Open the transport and start processing
  transport.open
rescue StandardError => e
  warn "Failed to start server: #{e.message}"
  warn e.backtrace.join("\n") if ENV['MCP_DEBUG'] == 'true'
  exit(1)
end
