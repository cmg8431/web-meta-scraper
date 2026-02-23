import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  scrape,
  createScraper,
  batchScrape,
  metaTags,
  openGraph,
  twitter,
  jsonLd,
  favicons,
  feeds,
  robots,
  validateMetadata,
  extractContent,
  extractFromHtml,
} from 'web-meta-scraper';
import { z } from 'zod';

const defaultPlugins = [metaTags, openGraph, twitter, jsonLd, favicons, feeds, robots];

function jsonResponse(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  };
}

function errorResponse(label: string, error: unknown) {
  return {
    isError: true as const,
    content: [
      {
        type: 'text' as const,
        text: `Failed to ${label}: ${error instanceof Error ? error.message : String(error)}`,
      },
    ],
  };
}

export function registerTools(server: McpServer) {
  server.tool(
    'scrape_url',
    'Extract metadata from a URL (Open Graph, Twitter Cards, JSON-LD, meta tags)',
    { url: z.string().url().describe('The URL to scrape metadata from') },
    async ({ url }) => {
      try {
        return jsonResponse(await scrape(url));
      } catch (error) {
        return errorResponse('scrape URL', error);
      }
    },
  );

  server.tool(
    'scrape_html',
    'Extract metadata from raw HTML string (Open Graph, Twitter Cards, JSON-LD, meta tags)',
    {
      html: z.string().describe('The raw HTML string to extract metadata from'),
      url: z
        .string()
        .url()
        .optional()
        .describe('Optional base URL for resolving relative paths'),
    },
    async ({ html, url }) => {
      try {
        const scraper = createScraper({ plugins: defaultPlugins });
        return jsonResponse(await scraper.scrape(html, { url }));
      } catch (error) {
        return errorResponse('scrape HTML', error);
      }
    },
  );

  server.tool(
    'validate_metadata',
    'Validate metadata quality and generate an SEO score report (100-point scale) with categorized issues',
    {
      url: z
        .string()
        .url()
        .optional()
        .describe('URL to scrape and validate metadata from'),
      html: z
        .string()
        .optional()
        .describe('Raw HTML string to validate metadata from'),
    },
    async ({ url, html }) => {
      try {
        if (!url && !html) {
          return errorResponse('validate metadata', new Error('Either "url" or "html" parameter is required'));
        }

        const result = url
          ? await scrape(url)
          : await createScraper({ plugins: defaultPlugins }).scrape(html!);

        return jsonResponse(validateMetadata(result));
      } catch (error) {
        return errorResponse('validate metadata', error);
      }
    },
  );

  server.tool(
    'extract_content',
    'Extract main text content from a web page (removes navigation, ads, sidebars). Useful for AI agents reading web pages.',
    {
      url: z
        .string()
        .url()
        .optional()
        .describe('URL to extract content from'),
      html: z
        .string()
        .optional()
        .describe('Raw HTML string to extract content from'),
    },
    async ({ url, html }) => {
      try {
        if (!url && !html) {
          return errorResponse('extract content', new Error('Either "url" or "html" parameter is required'));
        }

        const result = url ? await extractContent(url) : extractFromHtml(html!);
        return jsonResponse(result);
      } catch (error) {
        return errorResponse('extract content', error);
      }
    },
  );

  server.tool(
    'batch_scrape',
    'Scrape metadata from multiple URLs concurrently',
    {
      urls: z.array(z.string().url()).describe('List of URLs to scrape'),
      concurrency: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .describe('Number of concurrent requests (default: 5, max: 20)'),
    },
    async ({ urls, concurrency }) => {
      try {
        const results = await batchScrape(urls, {
          concurrency,
          scraper: { plugins: defaultPlugins },
        });
        return jsonResponse(results);
      } catch (error) {
        return errorResponse('batch scrape', error);
      }
    },
  );

  server.tool(
    'detect_feeds',
    'Detect RSS and Atom feed links from a web page',
    {
      url: z
        .string()
        .url()
        .optional()
        .describe('URL to detect feeds from'),
      html: z
        .string()
        .optional()
        .describe('Raw HTML string to detect feeds from'),
    },
    async ({ url, html }) => {
      try {
        if (!url && !html) {
          return errorResponse('detect feeds', new Error('Either "url" or "html" parameter is required'));
        }

        const scraper = createScraper({ plugins: [feeds] });
        const result = url
          ? await scraper.scrapeUrl(url)
          : await scraper.scrape(html!, { url: undefined });

        return jsonResponse(result.sources.feeds ?? {});
      } catch (error) {
        return errorResponse('detect feeds', error);
      }
    },
  );

  server.tool(
    'check_robots',
    'Check robots meta tag directives and indexing status of a web page',
    {
      url: z
        .string()
        .url()
        .optional()
        .describe('URL to check robots directives from'),
      html: z
        .string()
        .optional()
        .describe('Raw HTML string to check robots directives from'),
    },
    async ({ url, html }) => {
      try {
        if (!url && !html) {
          return errorResponse('check robots', new Error('Either "url" or "html" parameter is required'));
        }

        const scraper = createScraper({ plugins: [robots] });
        const result = url
          ? await scraper.scrapeUrl(url)
          : await scraper.scrape(html!, { url: undefined });

        return jsonResponse(result.sources.robots ?? {});
      } catch (error) {
        return errorResponse('check robots', error);
      }
    },
  );
}
