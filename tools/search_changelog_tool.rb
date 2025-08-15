# frozen_string_literal: true

require 'mcp'
require 'net/http'
require 'uri'
require 'nokogiri'
require 'json'
require 'time'

module ShopifyChangelog
  class SearchChangelogTool < MCP::Tool
    description 'Search Shopify Developer Changelog entries by keyword or topic'

    input_schema(
      properties: {
        query: {
          type: 'string',
          description: 'Search term to find in changelog entries (searches title and description)'
        },
        filter: {
          type: 'array',
          description: 'Filter by content type to narrow search',
          items: {
            type: 'string',
            enum: %w[api tools platform themes shopify_app_store shopify_theme_store
                     built_for_shopify polaris]
          },
          default: %w[api platform tools]
        },
        date_from: {
          type: 'string',
          description: 'Filter entries from this date (YYYY-MM-DD format)'
        },
        date_to: {
          type: 'string',
          description: 'Filter entries up to this date (YYYY-MM-DD format)'
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of results to return',
          default: 10
        }
      },
      required: ['query']
    )

    annotations(
      title: 'Search Shopify Changelog',
      read_only_hint: true,
      destructive_hint: false,
      idempotent_hint: true,
      open_world_hint: false
    )

    class << self
      BASE_URL = 'https://shopify.dev/changelog/feed.xml'

      # rubocop:disable Lint/UnusedMethodArgument
      # server_context is required by MCP protocol but not used for public RSS feeds
      def call(query:, server_context:, **options)
        filter = options.fetch(:filter, %w[api platform tools])
        date_from = options[:date_from]
        date_to = options[:date_to]
        limit = options.fetch(:limit, 10)
        # Fetch the feed
        url = build_url(filter)
        feed_data = fetch_feed(url)

        # Parse and search the feed
        all_entries = parse_feed(feed_data)

        # Filter by search query and date range
        filtered_entries = filter_entries(all_entries, query, date_from, date_to)

        # Limit results
        limited_entries = filtered_entries.first(limit)

        # Format the response
        response_text = format_response(limited_entries, query, filter, date_from, date_to)

        MCP::Tool::Response.new([
                                  {
                                    type: 'text',
                                    text: response_text
                                  }
                                ])
      rescue StandardError => e
        MCP::Tool::Response.new(
          [{ type: 'text', text: "Error searching changelog: #{e.message}" }],
          true # isError flag
        )
      end
      # rubocop:enable Lint/UnusedMethodArgument

      private

      def build_url(filter)
        uri = URI(BASE_URL)
        params = { filter: filter.join(',') }
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

      def parse_feed(xml_data)
        doc = Nokogiri::XML(xml_data)
        entries = []

        items = doc.xpath('//item')
        items.each do |item|
          entry = {
            title: item.at_xpath('title')&.text,
            description: clean_html(item.at_xpath('description')&.text),
            link: item.at_xpath('link')&.text,
            pub_date: item.at_xpath('pubDate')&.text,
            categories: item.xpath('category').map(&:text),
            guid: item.at_xpath('guid')&.text
          }

          # Parse the publication date
          if entry[:pub_date]
            begin
              entry[:parsed_date] = Time.parse(entry[:pub_date])
              entry[:formatted_date] = entry[:parsed_date].strftime('%B %d, %Y')
            rescue StandardError
              entry[:parsed_date] = nil
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

        # Convert to readable text
        text = doc.text.strip

        # Clean up excessive whitespace
        text.gsub(/\s+/, ' ').strip
      end

      def filter_entries(entries, query, date_from, date_to)
        filtered = entries

        # Filter by search query (case-insensitive)
        if query && !query.empty?
          query_lower = query.downcase
          filtered = filtered.select do |entry|
            title_match = entry[:title]&.downcase&.include?(query_lower)
            desc_match = entry[:description]&.downcase&.include?(query_lower)
            category_match = entry[:categories]&.any? { |cat| cat.downcase.include?(query_lower) }

            title_match || desc_match || category_match
          end
        end

        # Filter by date range
        if date_from
          begin
            from_date = Time.parse(date_from)
            filtered = filtered.select do |entry|
              entry[:parsed_date] && entry[:parsed_date] >= from_date
            end
          rescue StandardError
            # Invalid date format, skip filtering
          end
        end

        if date_to
          begin
            to_date = Time.parse(date_to)
            filtered = filtered.select do |entry|
              entry[:parsed_date] && entry[:parsed_date] <= to_date
            end
          rescue StandardError
            # Invalid date format, skip filtering
          end
        end

        filtered
      end

      def format_response(entries, query, filter, date_from, date_to)
        return "No changelog entries found matching '#{query}' with the specified filters." if entries.empty?

        lines = []
        lines << '# Shopify Changelog Search Results'
        lines << ''
        lines << '## Search Parameters:'
        lines << "- Query: \"#{query}\""
        lines << "- Content Types: #{filter.join(', ')}"
        lines << "- Date From: #{date_from}" if date_from
        lines << "- Date To: #{date_to}" if date_to
        lines << ''
        lines << "## Results (#{entries.size} matches):"
        lines << ''

        entries.each_with_index do |entry, index|
          lines << "### #{index + 1}. #{entry[:title]}"
          lines << "**Date:** #{entry[:formatted_date]}"
          lines << "**Categories:** #{entry[:categories].join(', ')}" if entry[:categories].any?
          lines << "**Link:** #{entry[:link]}"
          lines << ''

          # Highlight the matching query in the description (simple approach)
          description = entry[:description]
          if query && !query.empty? && description
            # Add emphasis around matching terms
            highlighted = description.gsub(/#{Regexp.escape(query)}/i) { |match| "**#{match}**" }
            lines << '**Description:**'
            lines << highlighted
          else
            lines << '**Description:**'
            lines << description
          end

          lines << ''
          lines << '---'
          lines << ''
        end

        lines.join("\n")
      end
    end
  end
end
