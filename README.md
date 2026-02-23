![](https://github.com/user-attachments/assets/d90c0d88-c820-4ad7-ab28-193fd6491c6e)

# web-meta-scraper

[![npm version](https://img.shields.io/npm/v/web-meta-scraper)](https://www.npmjs.com/package/web-meta-scraper)
[![license](https://img.shields.io/npm/l/web-meta-scraper)](https://github.com/cmg8431/web-meta-scraper/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)

English | [한국어](https://github.com/cmg8431/web-meta-scraper/blob/main/README-ko_kr.md)

A lightweight, plugin-based TypeScript library for extracting web page metadata. Supports Open Graph, Twitter Cards, JSON-LD, and standard meta tags with smart priority-based merging.

## Installation

```bash
npm install web-meta-scraper
# or
yarn add web-meta-scraper
# or
pnpm add web-meta-scraper
# or
bun add web-meta-scraper
```

## Quick Start

```typescript
import { createScraper, metaTags, openGraph, twitter, jsonLd } from 'web-meta-scraper';

const scrape = createScraper([metaTags, openGraph, twitter, jsonLd]);
const metadata = await scrape('https://example.com');

// Returns a flat object:
// {
//   title: "Example",
//   description: "An example page",
//   image: "https://example.com/og-image.png",
//   url: "https://example.com",
//   type: "website",
//   siteName: "Example",
//   ...
// }
```

You can also pass raw HTML instead of a URL:

```typescript
const metadata = await scrape('<html><head><title>Hello</title></head></html>');
```

## Plugins

Pick only the plugins you need. Each plugin extracts metadata from a specific source.

| Plugin | Import | Extracts |
|--------|--------|----------|
| **Meta Tags** | `metaTags` | `title`, `description`, `keywords`, `author`, `favicon`, `canonicalUrl` |
| **Open Graph** | `openGraph` | `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`, `og:locale` |
| **Twitter Cards** | `twitter` | `twitter:title`, `twitter:description`, `twitter:image`, `twitter:card`, `twitter:site`, `twitter:creator` |
| **JSON-LD** | `jsonLd` | Structured data (`Article`, `Product`, `Organization`, `FAQPage`, `BreadcrumbList`, etc.) |

```typescript
// Use only what you need
const scrape = createScraper([openGraph, twitter]);
```

## Priority-Based Merging

When the same field (e.g. `title`) exists in multiple sources, the highest-priority value wins:

| Field | Priority (high → low) |
|-------|----------------------|
| `title` | Open Graph → Meta Tags → Twitter |
| `description` | Open Graph → Meta Tags → Twitter |
| `image` | Open Graph → Twitter |
| `url` | Open Graph → Meta Tags |

Source-specific fields like `twitterCard`, `siteName`, and `structuredData` are always included as-is.

## Options

```typescript
const scrape = createScraper([metaTags, openGraph]);

const metadata = await scrape('https://example.com', {
  maxDescriptionLength: 200,  // Truncate description (default: 200)
  secureImages: true,         // Convert image URLs to HTTPS (default: true)
  timeout: 30000,             // Request timeout in ms (default: 30000)
  userAgent: 'MyBot/1.0',    // Custom User-Agent header
  followRedirects: true,      // Follow HTTP redirects (default: true)
  validateUrls: true,         // Validate URL format (default: true)
  extractRaw: false,          // Include raw metadata (default: false)
  omitEmpty: true,            // Remove empty/null values (default: true)
  fallbacks: true,            // Apply fallback logic (default: true)
});
```

### Fallback Behavior

When `fallbacks: true` (default):
- If `title` is missing, `siteName` is used instead
- If `description` is missing, it's extracted from JSON-LD structured data
- Relative image/favicon URLs are resolved to absolute URLs

## Custom Plugins

Create your own plugin to extract any data from the HTML:

```typescript
import type { Plugin } from 'web-meta-scraper';

const pricePlugin: Plugin = (html, options) => {
  // Parse HTML and extract what you need
  // Return an object - keys outside of base/openGraph/twitter/jsonLd
  // are added directly to the result
  return { price: '$99.99', currency: 'USD' };
};

const scrape = createScraper([openGraph, pricePlugin]);
const metadata = await scrape('https://shop.example.com');
// { title: "Product", price: "$99.99", currency: "USD", ... }
```

## Error Handling

The scraper throws `ScraperError` for fetch failures and invalid inputs:

```typescript
import { createScraper, openGraph } from 'web-meta-scraper';

const scrape = createScraper([openGraph]);

try {
  const metadata = await scrape('https://example.com');
} catch (error) {
  if (error.name === 'ScraperError') {
    console.error(error.message); // e.g. "Request timeout after 30000ms"
    console.error(error.cause);   // Original error, if any
  }
}
```

## License

MIT
