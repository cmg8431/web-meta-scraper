import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerPrompts(server: McpServer) {
  server.prompt(
    'analyze-seo',
    'Scrape a URL and analyze its SEO metadata quality with actionable improvement suggestions',
    { url: z.string().url().describe('The URL to analyze') },
    ({ url }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: [
              `Analyze the SEO metadata of ${url}.`,
              '',
              'Steps:',
              `1. Use the "validate_metadata" tool with url "${url}" to get the SEO score and issues.`,
              `2. Use the "scrape_url" tool with url "${url}" to get the full metadata.`,
              '',
              'Then provide:',
              '- Overall SEO score and what it means',
              '- Critical issues that must be fixed (errors)',
              '- Recommended improvements (warnings)',
              '- Optional enhancements (info)',
              '- Specific, actionable suggestions for each issue',
              '- A priority-ordered action plan',
            ].join('\n'),
          },
        },
      ],
    }),
  );

  server.prompt(
    'suggest-metadata',
    'Analyze a URL or content and suggest optimal metadata tags for SEO',
    {
      url: z
        .string()
        .optional()
        .describe('The URL to analyze (provide url or content)'),
      content: z
        .string()
        .optional()
        .describe('Page content to generate metadata for (provide url or content)'),
    },
    ({ url, content }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: url
              ? [
                  `Suggest optimal metadata for ${url}.`,
                  '',
                  'Steps:',
                  `1. Use the "scrape_url" tool with url "${url}" to get current metadata.`,
                  `2. Use the "extract_content" tool with url "${url}" to understand the page content.`,
                  `3. Use the "validate_metadata" tool with url "${url}" to identify issues.`,
                  '',
                  'Then suggest complete, optimized metadata including:',
                  '- title (50-60 chars)',
                  '- meta description (120-160 chars)',
                  '- Open Graph tags (og:title, og:description, og:image, og:url, og:type)',
                  '- Twitter Card tags (twitter:card, twitter:title, twitter:description)',
                  '- Canonical URL',
                  '- JSON-LD structured data',
                  '',
                  'Provide the suggested metadata as copy-paste ready HTML tags.',
                ].join('\n')
              : [
                  'Suggest optimal metadata for the following content:',
                  '',
                  content ?? '',
                  '',
                  'Generate complete, optimized metadata including:',
                  '- title (50-60 chars)',
                  '- meta description (120-160 chars)',
                  '- Open Graph tags (og:title, og:description, og:image, og:url, og:type)',
                  '- Twitter Card tags (twitter:card, twitter:title, twitter:description)',
                  '- JSON-LD structured data',
                  '',
                  'Provide the suggested metadata as copy-paste ready HTML tags.',
                ].join('\n'),
          },
        },
      ],
    }),
  );
}
