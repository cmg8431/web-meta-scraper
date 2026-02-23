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
| **Favicons** | `favicons` | All icon links (`icon`, `apple-touch-icon`, `mask-icon`, `manifest`) with `sizes` and `type` |
| **Feeds** | `feeds` | RSS (`application/rss+xml`) and Atom (`application/atom+xml`) feed links with `title` |
| **Robots** | `robots` | Robots meta directives (`noindex`, `nofollow`, `noarchive`, `nosnippet`, etc.) with indexability flags |
| **Date** | `date` | Publication date (`article:published_time`, Dublin Core, JSON-LD, `<time>`) and modification date |
| **Logo** | `logo` | Site logo URL from `og:logo`, Schema.org microdata, JSON-LD Organization/Publisher |
| **Lang** | `lang` | Document language as BCP 47 tag from `<html lang>`, `og:locale`, `content-language`, JSON-LD |
| **Video** | `video` | Video resources from `og:video`, `twitter:player`, `<video>` elements, JSON-LD `VideoObject` |
| **Audio** | `audio` | Audio resources from `og:audio`, `<audio>` elements, JSON-LD `AudioObject` |
| **iFrame** | `iframe` | Embeddable iframe HTML from `twitter:player` with oEmbed fallback |

```typescript
// Use only what you need
const scraper = createScraper({
  plugins: [openGraph, twitter],
});
```

> **Note:** The `scrape()` shorthand uses only the core plugins (`metaTags`, `openGraph`, `twitter`, `jsonLd`) by default. To use other plugins like `favicons`, `feeds`, `robots`, `date`, `logo`, `lang`, `video`, `audio`, or `iframe`, pass them explicitly via `createScraper()`.

## Batch Scraping

Scrape multiple URLs concurrently with `batchScrape()`. Uses a promise-based worker pool with no external dependencies. Each URL is processed independently — one failure won't stop the rest.

```typescript
import { batchScrape } from 'web-meta-scraper';

const results = await batchScrape(
  ['https://example.com', 'https://github.com', 'https://nodejs.org'],
  { concurrency: 3 },
);

for (const r of results) {
  if (r.success) {
    console.log(r.url, r.result.metadata.title);
  } else {
    console.error(r.url, r.error);
  }
}
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

### Stealth Mode

Some websites block automated requests via TLS fingerprinting. Enable stealth mode to use HTTP/2 with a browser-like TLS fingerprint:

```typescript
const scraper = createScraper({
  plugins: [metaTags, openGraph],
  fetch: {
    stealth: true,
  },
});
```

> **Warning:** Stealth mode is disabled by default. Rapid requests with stealth mode may trigger rate limiting (e.g. JS challenge pages). Always respect `robots.txt` and site terms of service. Use responsibly.

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

## Metadata Validator

`validateMetadata()` scores metadata quality (0–100) and reports issues across 14 SEO rules:

```typescript
import { scrape, validateMetadata } from 'web-meta-scraper';

const result = await scrape('https://example.com');
const validation = validateMetadata(result);

console.log(validation.score);  // 85
console.log(validation.issues);
// [
//   { field: "description", severity: "warning", message: "Description is too short (under 50 characters)" },
// ]
```

## Content Extractor

`extractContent()` strips navigation, ads, and sidebars to extract the main text content from a web page:

```typescript
import { extractContent } from 'web-meta-scraper';

const content = await extractContent('https://example.com/article');
console.log(content.content);   // "Article body text..."
console.log(content.wordCount); // 1234
console.log(content.language);  // "en"
console.log(content.metadata);  // { title: "Article Title", description: "..." }
```

Supports CJK word counting and provides `extractFromHtml()` for parsing raw HTML strings.

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
| `scrape_url` | Extract metadata from a URL (Open Graph, Twitter Cards, JSON-LD, meta tags, favicons, feeds, robots) |
| `scrape_html` | Extract metadata from raw HTML string with optional base URL for resolving relative paths |
| `batch_scrape` | Scrape metadata from multiple URLs concurrently |
| `detect_feeds` | Detect RSS and Atom feed links from a web page |
| `check_robots` | Check robots meta tag directives and indexing status |
| `validate_metadata` | Validate metadata quality and generate an SEO score report |
| `extract_content` | Extract main text content from a web page |

See the [MCP package README](./mcp/README.md) for detailed usage and examples.

## License

MIT
