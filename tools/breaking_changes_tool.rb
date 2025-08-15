# frozen_string_literal: true

require 'mcp'
require 'net/http'
require 'uri'
require 'nokogiri'
require 'json'
require 'time'

module ShopifyChangelog
  class BreakingChangesTool < MCP::Tool
    description 'Get breaking changes and deprecations from Shopify Developer Changelog that require action'

    input_schema(
      properties: {
        api_version: {
          type: 'string',
          description: 'Filter by specific API version',
          enum: %w[2025-10 2025-07 2025-04 2025-01 2024-10 2024-07 2024-04 2024-01]
        },
        api_type: {
          type: 'string',
          description: 'Filter by API type',
          enum: %w[admin-graphql admin-rest storefront-graphql customer-account-graphql
                   payments-apps-api webhook liquid app-bridge]
        },
        days_back: {
          type: 'integer',
          description: 'Number of days to look back for breaking changes',
          default: 90
        },
        include_deprecations: {
          type: 'boolean',
          description: 'Include deprecation announcements',
          default: true
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of entries to return',
          default: 20
        }
      },
      required: []
    )

    annotations(
      title: 'Get Breaking Changes',
      read_only_hint: true,
      destructive_hint: false,
      idempotent_hint: true,
      open_world_hint: false
    )

    class << self
      BASE_URL = 'https://shopify.dev/changelog/feed.xml'

      # rubocop:disable Lint/UnusedMethodArgument
      # server_context is required by MCP protocol but not used for public RSS feeds
      def call(server_context:, **options)
        api_version = options[:api_version]
        api_type = options[:api_type]
        days_back = options.fetch(:days_back, 90)
        include_deprecations = options.fetch(:include_deprecations, true)
        limit = options.fetch(:limit, 20)
        # Build URL with action_required filter
        url = build_url(api_version, api_type)

        # Fetch the RSS feed
        feed_data = fetch_feed(url)

        # Parse and filter for breaking changes
        entries = parse_and_filter_breaking_changes(feed_data, days_back, include_deprecations)

        # Limit results
        limited_entries = entries.first(limit)

        # Format the response
        response_text = format_response(limited_entries, api_version, api_type, days_back, include_deprecations)

        MCP::Tool::Response.new([
                                  {
                                    type: 'text',
                                    text: response_text
                                  }
                                ])
      rescue StandardError => e
        MCP::Tool::Response.new(
          [{ type: 'text', text: "Error fetching breaking changes: #{e.message}" }],
          true # isError flag
        )
      end
      # rubocop:enable Lint/UnusedMethodArgument

      private

      def build_url(api_version, api_type)
        uri = URI(BASE_URL)
        params = {
          filter: 'api,platform', # Focus on API and platform changes
          action_required: 'true' # Get entries that require action
        }

        # Add optional filters
        params[:api_version] = api_version if api_version
        params[:api_type] = api_type if api_type

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

      def parse_and_filter_breaking_changes(xml_data, days_back, include_deprecations)
        doc = Nokogiri::XML(xml_data)
        entries = []
        cutoff_date = Time.now - (days_back * 24 * 60 * 60)

        items = doc.xpath('//item')
        items.each do |item|
          title = item.at_xpath('title')&.text || ''
          categories = item.xpath('category').map(&:text)
          pub_date_str = item.at_xpath('pubDate')&.text

          # Parse date
          begin
            pub_date = Time.parse(pub_date_str) if pub_date_str
          rescue StandardError
            pub_date = nil
          end

          # Skip if outside date range
          next if pub_date && pub_date < cutoff_date

          # Check if it's a breaking change or deprecation
          is_breaking = categories.any? do |cat|
            cat.downcase.include?('breaking') ||
              cat.downcase.include?('action required')
          end

          is_deprecation = include_deprecations && categories.any? do |cat|
            cat.downcase.include?('deprecation')
          end

          # Also check title and description for breaking change indicators
          description = clean_html(item.at_xpath('description')&.text)

          is_breaking ||= title.downcase.include?('breaking') ||
                          title.downcase.include?('removal') ||
                          title.downcase.include?('migration required') ||
                          description.downcase.include?('breaking change') ||
                          description.downcase.include?('will be removed') ||
                          description.downcase.include?('action required')

          is_deprecation ||= include_deprecations && (
            title.downcase.include?('deprecat') ||
            description.downcase.include?('deprecat')
          )

          next unless is_breaking || is_deprecation

          entry = {
            title: title,
            description: description,
            link: item.at_xpath('link')&.text,
            pub_date: pub_date,
            formatted_date: pub_date ? pub_date.strftime('%B %d, %Y') : pub_date_str,
            categories: categories,
            guid: item.at_xpath('guid')&.text,
            change_type: is_breaking ? 'Breaking Change' : 'Deprecation',
            urgency: determine_urgency(title, description, categories)
          }

          entries << entry
        end

        # Sort by urgency and then by date (most recent first)
        entries.sort_by { |e| [urgency_score(e[:urgency]), e[:pub_date] ? -e[:pub_date].to_i : 0] }
      end

      def clean_html(html_text)
        return '' if html_text.nil?

        # Remove CDATA markers if present
        cleaned = html_text.gsub(/<!\[CDATA\[(.*?)\]\]>/m, '\1')

        # Parse HTML and extract text
        doc = Nokogiri::HTML::DocumentFragment.parse(cleaned)

        # Convert to readable text
        text = doc.text.strip

        # Clean up excessive whitespace
        text.gsub(/\s+/, ' ').strip
      end

      def determine_urgency(title, description, categories)
        combined_text = "#{title} #{description} #{categories.join(' ')}".downcase

        if combined_text.include?('immediate') ||
           combined_text.include?('critical') ||
           combined_text.include?('urgent')
          'URGENT'
        elsif combined_text.include?('breaking') ||
              combined_text.include?('removal') ||
              combined_text.include?('action required')
          'HIGH'
        elsif combined_text.include?('deprecat')
          'MEDIUM'
        else
          'LOW'
        end
      end

      def urgency_score(urgency)
        case urgency
        when 'URGENT' then 0
        when 'HIGH' then 1
        when 'MEDIUM' then 2
        when 'LOW' then 3
        else 4
        end
      end

      def format_response(entries, api_version, api_type, days_back, include_deprecations)
        if entries.empty?
          return "No breaking changes or deprecations found in the last #{days_back} days with the specified filters."
        end

        lines = []
        lines << '# Shopify Breaking Changes & Deprecations'
        lines << ''
        lines << '## Filters Applied:'
        lines << "- Time Period: Last #{days_back} days"
        lines << "- API Version: #{api_version || 'All versions'}"
        lines << "- API Type: #{api_type || 'All types'}"
        lines << "- Include Deprecations: #{include_deprecations}"
        lines << ''
        lines << "## Critical Changes Requiring Action (#{entries.size} items):"
        lines << ''

        # Group by urgency
        urgent_entries = entries.select { |e| e[:urgency] == 'URGENT' }
        high_entries = entries.select { |e| e[:urgency] == 'HIGH' }
        medium_entries = entries.select { |e| e[:urgency] == 'MEDIUM' }
        low_entries = entries.select { |e| e[:urgency] == 'LOW' }

        [
          ['URGENT - Immediate Action Required', urgent_entries],
          ['HIGH PRIORITY - Action Required Soon', high_entries],
          ['MEDIUM PRIORITY - Plan for Migration', medium_entries],
          ['LOW PRIORITY - For Awareness', low_entries]
        ].each do |section_title, section_entries|
          next if section_entries.empty?

          lines << "## #{section_title}"
          lines << ''

          section_entries.each_with_index do |entry, index|
            lines << "### #{index + 1}. #{entry[:title]}"
            lines << "**Type:** #{entry[:change_type]}"
            lines << "**Date:** #{entry[:formatted_date]}"
            lines << "**Categories:** #{entry[:categories].join(', ')}" if entry[:categories].any?
            lines << "**Link:** #{entry[:link]}"
            lines << ''
            lines << '**Impact:**'
            lines << entry[:description]
            lines << ''
            lines << '---'
            lines << ''
          end
        end

        lines << '## Recommended Actions:'
        lines << ''
        lines << '1. Review all URGENT and HIGH priority items immediately'
        lines << '2. Create migration plans for deprecated features'
        lines << '3. Test your integration with the latest API versions'
        lines << '4. Subscribe to the Shopify Developer Changelog for updates'
        lines << ''

        lines.join("\n")
      end
    end
  end
end
