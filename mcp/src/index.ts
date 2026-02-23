import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  scrape,
  createScraper,
  metaTags,
  openGraph,
  twitter,
  jsonLd,
} from 'web-meta-scraper';
import { z } from 'zod';

const defaultPlugins = [metaTags, openGraph, twitter, jsonLd];

const server = new McpServer({
  name: 'web-meta-scraper',
  version: '1.0.0',
});

server.tool(
  'scrape_url',
  'Extract metadata from a URL (Open Graph, Twitter Cards, JSON-LD, meta tags)',
  {
    url: z.string().url().describe('The URL to scrape metadata from'),
  },
  async ({ url }) => {
    try {
      const result = await scrape(url);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Failed to scrape URL: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
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
      const result = await scraper.scrape(html, { url });
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Failed to scrape HTML: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('web-meta-scraper MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
