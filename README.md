![](https://github.com/user-attachments/assets/d90c0d88-c820-4ad7-ab28-193fd6491c6e)

# web-meta-scraper

[![npm version](https://img.shields.io/npm/v/web-meta-scraper)](https://www.npmjs.com/package/web-meta-scraper)
[![npm downloads](https://img.shields.io/npm/dm/web-meta-scraper)](https://www.npmjs.com/package/web-meta-scraper)
[![bundle size](https://img.shields.io/bundlephobia/minzip/web-meta-scraper)](https://bundlephobia.com/package/web-meta-scraper)
[![license](https://img.shields.io/npm/l/web-meta-scraper)](https://github.com/cmg8431/web-meta-scraper/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![GitHub stars](https://img.shields.io/github/stars/cmg8431/web-meta-scraper)](https://github.com/cmg8431/web-meta-scraper)

English | [한국어](https://github.com/cmg8431/web-meta-scraper/blob/main/README-ko_kr.md)

A lightweight, plugin-based TypeScript library for extracting web page metadata. Supports Open Graph, Twitter Cards, JSON-LD, oEmbed, and standard meta tags with smart priority-based merging.

## Why web-meta-scraper?

| | web-meta-scraper | [metascraper](https://github.com/microlinkhq/metascraper) | [open-graph-scraper](https://github.com/jshemas/openGraphScraper) |
|---|---|---|---|
| **Dependencies** | 1 (`cheerio`) | 10+ | 4+ |
| **Bundle size** | ~5KB min+gzip | ~50KB+ | ~15KB+ |
| **Plugin system** | Composable plugins | Rule-based | Monolithic |
| **Custom plugins** | Simple function | Complex rules | Not supported |
| **TypeScript** | First-class | Partial | Partial |
| **oEmbed support** | Built-in plugin | Separate package | Not supported |
| **Custom resolve rules** | Configurable priority | Fixed | Fixed |
| **Native fetch** | Uses native `fetch()` | Uses `got` | Uses `undici` |

- **Single dependency** — Only [cheerio](https://cheerio.js.org/) for HTML parsing. Uses native `fetch()` for HTTP requests.
- **Plugin architecture** — Pick only the extractors you need. Create custom plugins with a simple function.
- **Priority-based merging** — Automatically resolves conflicts when the same field exists in multiple sources. Fully customizable resolve rules.
- **TypeScript first** — Full type definitions with `ResolvedMetadata`, `ScraperResult`, and plugin types.
- **Structured result** — Returns both merged `metadata` and raw `sources` from each plugin for full transparency.

## Installation

```bash
npm install web-meta-scraper
# or
pnpm add web-meta-scraper
# or
yarn add web-meta-scraper
# or
bun add web-meta-scraper
```

## Quick Start

### Simple — `scrape()` function

The easiest way to get started. Auto-detects URL vs HTML and uses all built-in plugins:

```typescript
import { scrape } from 'web-meta-scraper';

// From URL
const result = await scrape('https://example.com');

// From HTML string
const result = await scrape('<html><head><title>Hello</title></head></html>');

console.log(result.metadata);
// {
//   title: "Example",
//   description: "An example page",
//   image: "https://example.com/og-image.png",
//   url: "https://example.com",
//   type: "website",
//   siteName: "Example",
//   ...
// }

// Raw plugin outputs are also available
console.log(result.sources);
// { "open-graph": { title: "Example", ... }, "meta-tags": { ... }, ... }
```

### Advanced — `createScraper()`

For full control over plugins, resolve rules, fetch options, and post-processing:

```typescript
import { createScraper, metaTags, openGraph, twitter, jsonLd, oembed } from 'web-meta-scraper';

const scraper = createScraper({
  plugins: [metaTags, openGraph, twitter, jsonLd, oembed],
  fetch: {
    timeout: 10000,
    userAgent: 'MyBot/1.0',
  },
  postProcess: {
    maxDescriptionLength: 150,
    secureImages: true,
  },
});

// Scrape from URL
const result = await scraper.scrapeUrl('https://example.com');

// Or parse raw HTML
const result = await scraper.scrape(html, { url: 'https://example.com' });
```

## Plugins

| Plugin | Import | Extracts |
|--------|--------|----------|
| **Meta Tags** | `metaTags` | `title`, `description`, `keywords`, `author`, `favicon`, `canonicalUrl` |
| **Open Graph** | `openGraph` | `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`, `og:locale` |
| **Twitter Cards** | `twitter` | `twitter:title`, `twitter:description`, `twitter:image`, `twitter:card`, `twitter:site`, `twitter:creator` |
| **JSON-LD** | `jsonLd` | Structured data (`Article`, `Product`, `Organization`, `FAQPage`, `BreadcrumbList`, etc.) |
| **oEmbed** | `oembed` | oEmbed data (`title`, `author_name`, `thumbnail_url`, `html`, etc.) |

```typescript
// Use only what you need
const scraper = createScraper({
  plugins: [openGraph, twitter],
});
```

## Priority-Based Merging

When the same field exists in multiple sources, the highest-priority value wins:

| Field | Priority (high → low) |
|-------|----------------------|
| `title` | Open Graph → Meta Tags → Twitter |
| `description` | Open Graph → Meta Tags → Twitter |
| `image` | Open Graph → Twitter |
| `url` | Open Graph → Meta Tags (canonical) |

Source-specific fields (`twitterCard`, `siteName`, `locale`, `jsonLd`, `oembed`, etc.) are always included directly.

You can override the default rules:

```typescript
import { createScraper, metaTags, openGraph, twitter } from 'web-meta-scraper';

const scraper = createScraper({
  plugins: [metaTags, openGraph, twitter],
  rules: [
    {
      field: 'title',
      sources: [
        { plugin: 'twitter', key: 'title', priority: 3 },   // Twitter first
        { plugin: 'open-graph', key: 'title', priority: 2 },
        { plugin: 'meta-tags', key: 'title', priority: 1 },
      ],
    },
    // ... other rules
  ],
});
```

## Configuration

### `ScraperConfig`

```typescript
const scraper = createScraper({
  // Plugins to use
  plugins: [metaTags, openGraph, twitter, jsonLd, oembed],

  // Resolve rules (default: DEFAULT_RULES)
  rules: DEFAULT_RULES,

  // Fetch options (for scrapeUrl)
  fetch: {
    timeout: 30000,             // Request timeout in ms (default: 30000)
    userAgent: 'MyBot/1.0',    // Custom User-Agent header
    followRedirects: true,      // Follow HTTP redirects (default: true)
    maxContentLength: 5242880,  // Max response size in bytes (default: 5MB)
  },

  // Post-processing options
  postProcess: {
    maxDescriptionLength: 200,  // Truncate description (default: 200)
    secureImages: true,         // Convert image URLs to HTTPS (default: true)
    omitEmpty: true,            // Remove empty/null values (default: true)
    fallbacks: true,            // Apply fallback logic (default: true)
  },
});
```

### Fallback Behavior

When `fallbacks: true` (default):
- If `title` is missing, `siteName` is used instead
- If `description` is missing, it's extracted from JSON-LD structured data
- Relative image/favicon URLs are resolved to absolute URLs

## Custom Plugins

A plugin is a function that receives a `ScrapeContext` and returns a `PluginResult`:

```typescript
import type { Plugin } from 'web-meta-scraper';

const pricePlugin: Plugin = (ctx) => {
  const { $ } = ctx; // Cheerio instance

  const price = $('[itemprop="price"]').attr('content');
  const currency = $('[itemprop="priceCurrency"]').attr('content');

  return {
    name: 'price',
    data: { price, currency },
  };
};

const scraper = createScraper({
  plugins: [openGraph, pricePlugin],
  rules: [
    ...DEFAULT_RULES,
    { field: 'price', sources: [{ plugin: 'price', key: 'price', priority: 1 }] },
    { field: 'currency', sources: [{ plugin: 'price', key: 'currency', priority: 1 }] },
  ],
});
```

## Error Handling

```typescript
import { scrape, ScraperError } from 'web-meta-scraper';

try {
  const result = await scrape('https://example.com');
} catch (error) {
  if (error instanceof ScraperError) {
    console.error(error.message); // e.g. "Request timeout after 30000ms"
    console.error(error.cause);   // Original error, if any
  }
}
```

## MCP Server

[`web-meta-scraper-mcp`](https://www.npmjs.com/package/web-meta-scraper-mcp) provides an [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that exposes web-meta-scraper as tools for AI assistants like Claude Code and Claude Desktop.

### Setup

**Claude Code:**

```bash
claude mcp add web-meta-scraper -- npx -y web-meta-scraper-mcp
```

**Claude Desktop / Cursor:**

Add to your config file:

```json
{
  "mcpServers": {
    "web-meta-scraper": {
      "command": "npx",
      "args": ["-y", "web-meta-scraper-mcp"]
    }
  }
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `scrape_url` | Extract metadata from a URL (Open Graph, Twitter Cards, JSON-LD, meta tags) |
| `scrape_html` | Extract metadata from raw HTML string with optional base URL for resolving relative paths |

See the [MCP package README](./mcp/README.md) for detailed usage and examples.

## License

MIT
