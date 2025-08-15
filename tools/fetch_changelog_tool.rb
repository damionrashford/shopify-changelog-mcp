# frozen_string_literal: true

require 'mcp'
require 'net/http'
require 'uri'
require 'nokogiri'
require 'json'
require 'time'

module ShopifyChangelog
  class FetchChangelogTool < MCP::Tool
    description 'Fetches the Shopify Developer Changelog RSS feed with comprehensive filtering options'

    input_schema(
      properties: {
        filter: {
          type: 'array',
          description: 'Filter by content type (api, tools, platform, themes, shopify_app_store, shopify_theme_store, built_for_shopify, polaris)',
          items: {
            type: 'string',
            enum: %w[api tools platform themes shopify_app_store shopify_theme_store
                     built_for_shopify polaris]
          }
        },
        action_required: {
          type: 'boolean',
          description: 'Filter for entries requiring developer action',
          default: false
        },
        api_version: {
          type: 'string',
          description: "Filter by API version (only applies when filter includes 'api')",
          enum: %w[2025-10 2025-07 2025-04 2025-01 2024-10 2024-07 2024-04 2024-01]
        },
        api_type: {
          type: 'string',
          description: "Filter by API type (only applies when filter includes 'api')",
          enum: %w[admin-graphql admin-rest storefront-graphql customer-account-graphql payments-apps-api
                   webhook liquid app-bridge]
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of entries to return',
          default: 10
        }
      },
      required: ['filter']
    )

    annotations(
      title: 'Fetch Shopify Changelog',
      read_only_hint: true,
      destructive_hint: false,
      idempotent_hint: true,
      open_world_hint: false
    )

    class << self
      BASE_URL = 'https://shopify.dev/changelog/feed.xml'

      # rubocop:disable Lint/UnusedMethodArgument
      # server_context is required by MCP protocol but not used for public RSS feeds
      def call(filter:, server_context:, **options)
        action_required = options.fetch(:action_required, false)
        api_version = options[:api_version]
        api_type = options[:api_type]
        limit = options.fetch(:limit, 10)
        # Build URL with query parameters
        url = build_url(filter, action_required, api_version, api_type)

        # Fetch the RSS feed
        feed_data = fetch_feed(url)

        # Parse and process the feed
        entries = parse_feed(feed_data, limit)

        # Format the response
        response_text = format_response(entries, filter, action_required, api_version, api_type)

        MCP::Tool::Response.new([
                                  {
                                    type: 'text',
                                    text: response_text
                                  }
                                ])
      rescue StandardError => e
        MCP::Tool::Response.new(
          [{ type: 'text', text: "Error fetching changelog: #{e.message}" }],
          true # isError flag
        )
      end
      # rubocop:enable Lint/UnusedMethodArgument

      private

      def build_url(filter, action_required, api_version, api_type)
        uri = URI(BASE_URL)
        params = {}

        # Filter is required
        params[:filter] = filter.join(',')

        # Optional parameters
        params[:action_required] = action_required.to_s if action_required
        params[:api_version] = api_version if api_version && filter.include?('api')
        params[:api_type] = api_type if api_type && filter.include?('api')

        uri.query = URI.encode_www_form(params)
        uri
      end

      def fetch_feed(uri)
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = true
        http.read_timeout = 10
        http.open_timeout = 10

        request = Net::HTTP::Get.new(uri)
        request['User-Agent'] = 'Shopify-Changelog-MCP/1.0'
        request['Accept'] = 'application/rss+xml, application/xml'

        response = http.request(request)

        raise "HTTP Error: #{response.code} - #{response.message}" unless response.code == '200'

        response.body
      end

      def parse_feed(xml_data, limit)
        doc = Nokogiri::XML(xml_data)
        entries = []

        # Extract channel information
        channel = doc.at_xpath('//channel')
        channel.at_xpath('title')&.text
        channel.at_xpath('description')&.text

        # Extract items (changelog entries)
        items = doc.xpath('//item')
        items.first(limit).each do |item|
          entry = {
            title: item.at_xpath('title')&.text,
            description: clean_html(item.at_xpath('description')&.text),
            link: item.at_xpath('link')&.text,
            pub_date: item.at_xpath('pubDate')&.text,
            categories: item.xpath('category').map(&:text),
            guid: item.at_xpath('guid')&.text
          }

          # Parse the publication date for better formatting
          if entry[:pub_date]
            begin
              entry[:formatted_date] = Time.parse(entry[:pub_date]).strftime('%B %d, %Y')
            rescue StandardError
              entry[:formatted_date] = entry[:pub_date]
            end
          end

          entries << entry
        end

        entries
      end

      def clean_html(html_text)
        return '' if html_text.nil?

        # Remove CDATA markers if present
        cleaned = html_text.gsub(/<!\[CDATA\[(.*?)\]\]>/m, '\1')

        # Parse HTML and extract text
        doc = Nokogiri::HTML::DocumentFragment.parse(cleaned)

        # Convert to readable text while preserving structure
        text = doc.text.strip

        # Clean up excessive whitespace
        text.gsub(/\s+/, ' ').strip
      end

      def format_response(entries, filter, action_required, api_version, api_type)
        return 'No changelog entries found with the specified filters.' if entries.empty?

        lines = []
        lines << '# Shopify Developer Changelog'
        lines << ''

        # Show active filters
        lines << '## Active Filters:'
        lines << "- Content Types: #{filter.join(', ')}"
        lines << "- Action Required: #{action_required}" if action_required
        lines << "- API Version: #{api_version}" if api_version
        lines << "- API Type: #{api_type}" if api_type
        lines << ''
        lines << "## Changelog Entries (#{entries.size} results):"
        lines << ''

        entries.each_with_index do |entry, index|
          lines << "### #{index + 1}. #{entry[:title]}"
          lines << "**Date:** #{entry[:formatted_date]}"
          lines << "**Categories:** #{entry[:categories].join(', ')}" if entry[:categories].any?
          lines << "**Link:** #{entry[:link]}"
          lines << ''
          lines << '**Description:**'
          lines << entry[:description]
          lines << ''
          lines << '---'
          lines << ''
        end

        lines.join("\n")
      end
    end
  end
end
