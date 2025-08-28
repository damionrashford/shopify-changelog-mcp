/**
 * Get Post Tool - Fetches full content of an individual changelog post from either source
 */

import * as cheerio from 'cheerio';
import type { ToolResponse, ChangelogSource } from "../types.js";

/**
 * Detect the source of a changelog URL
 */
function detectChangelogSource(url: string): ChangelogSource | null {
  if (url.includes('shopify.dev/changelog')) return 'developer';
  if (url.includes('changelog.shopify.com')) return 'platform';
  return null;
}

/**
 * Fetches the full content of an individual Shopify changelog post
 */
export async function executeGetPost({
  url
}: {
  url: string;
}): Promise<ToolResponse> {
  try {
    // Detect the source from URL
    const source = detectChangelogSource(url);
    
    if (!source) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: `Error: Invalid URL. Please provide a valid Shopify changelog URL from either shopify.dev/changelog or changelog.shopify.com`
        }]
      };
    }
    
    const sourceIcon = source === 'platform' ? '🛍️' : '📘';
    const sourceLabel = source === 'platform' ? 'Platform' : 'Developer';

    // Fetch the HTML content
    const response = await fetch(url);
    if (!response.ok) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: `Error: Failed to fetch post. HTTP ${response.status}: ${response.statusText}`
        }]
      };
    }

    const html = await response.text();
    
    // Parse HTML with cheerio
    const $ = cheerio.load(html);
    
    // Extract post data
    const title = $('h1').first().text().trim() || 'No title found';
    
    // Try multiple selectors for the publication date
    let pubDate = $('time').first().attr('datetime') || 
                  $('.published-date').text().trim() ||
                  $('[class*="date"]').text().trim() ||
                  'Date not found';
    
    // Format the date if it's a datetime string
    if (pubDate && pubDate !== 'Date not found') {
      try {
        const date = new Date(pubDate);
        if (!isNaN(date.getTime())) {
          pubDate = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        }
      } catch (e) {
        // Keep original date string if parsing fails
      }
    }

    // Extract categories/tags
    const categories: string[] = [];
    $('[class*="tag"], [class*="category"], .badge, .label').each((_, elem) => {
      const text = $(elem).text().trim();
      if (text && text.length < 50) { // Avoid long text that's not a category
        categories.push(text);
      }
    });

    // Extract the main content
    // Try different selectors for article content
    const contentSelectors = [
      'main article',
      '.article-content', 
      '.post-content',
      '.content',
      'article',
      '.markdown-body',
      '[class*="content"]'
    ];

    let contentHtml = '';
    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        contentHtml = element.html() || '';
        break;
      }
    }

    // If no specific content area found, get the main content after the title
    if (!contentHtml) {
      $('h1').first().nextAll().each((_, elem) => {
        contentHtml += $(elem).toString();
      });
    }

    // Convert HTML to clean text while preserving structure
    const contentText = cleanHtmlContent(contentHtml);
    
    // Format the response with source attribution
    const categoriesText = categories.length > 0 ? 
      `\n📋 Categories: ${categories.join(', ')}` : '';
    
    const fullContent = `${sourceIcon} [${sourceLabel}] ${title}

📅 Published: ${pubDate}${categoriesText}
🌐 URL: ${url}

📄 Full Content:
${contentText}`;

    return {
      content: [{
        type: "text",
        text: fullContent
      }]
    };

  } catch (error) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Error fetching individual post: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
}

/**
 * Clean HTML content and convert to readable text while preserving structure
 */
function cleanHtmlContent(html: string): string {
  if (!html) return 'No content found';
  
  const $ = cheerio.load(html);
  
  // Remove script and style elements
  $('script, style, nav, .sidebar, .navigation, .breadcrumb').remove();
  
  // Convert common elements to text with formatting
  $('h1, h2, h3, h4, h5, h6').each((_, elem) => {
    const level = parseInt($(elem).prop('tagName').slice(1));
    const prefix = '#'.repeat(level);
    $(elem).replaceWith(`\n\n${prefix} ${$(elem).text().trim()}\n`);
  });
  
  $('p').each((_, elem) => {
    $(elem).replaceWith(`${$(elem).text().trim()}\n\n`);
  });
  
  $('ul li, ol li').each((_, elem) => {
    $(elem).replaceWith(`• ${$(elem).text().trim()}\n`);
  });
  
  $('code').each((_, elem) => {
    $(elem).replaceWith(`\`${$(elem).text().trim()}\``);
  });
  
  $('pre').each((_, elem) => {
    $(elem).replaceWith(`\n\`\`\`\n${$(elem).text().trim()}\n\`\`\`\n\n`);
  });
  
  $('blockquote').each((_, elem) => {
    const lines = $(elem).text().trim().split('\n');
    const quotedLines = lines.map(line => `> ${line.trim()}`).join('\n');
    $(elem).replaceWith(`\n${quotedLines}\n\n`);
  });
  
  $('a').each((_, elem) => {
    const text = $(elem).text().trim();
    const href = $(elem).attr('href');
    if (href && href.startsWith('http')) {
      $(elem).replaceWith(`${text} (${href})`);
    } else {
      $(elem).replaceWith(text);
    }
  });
  
  // Get the cleaned text
  let cleanText = $.root().text()
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
    .replace(/^\s+|\s+$/g, '') // Trim whitespace
    .replace(/[ \t]+/g, ' '); // Normalize spaces
  
  return cleanText || 'No readable content found';
}
