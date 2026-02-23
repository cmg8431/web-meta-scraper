# web-meta-scraper

## 1.3.0

### Minor Changes

- 4d0d6ce: ### web-meta-scraper

  - Add `date` plugin for publication/modification date extraction
  - Add `logo` plugin for site logo URL extraction
  - Add `lang` plugin for document language detection (BCP 47)
  - Add `video` plugin for video resource discovery
  - Add `audio` plugin for audio resource discovery
  - Add `iframe` plugin for embeddable iframe HTML generation
  - Add stealth fetch mode with HTTP/2 + browser-like TLS fingerprint
  - Add `selectBestFavicon()` fallback and iframe oEmbed fallback in core

  ### web-meta-scraper-mcp

  - Add date, logo, lang, video, audio, iframe plugins to default scrape tools

## 1.2.0

### Minor Changes

- 1b9f436: ### web-meta-scraper

  - Add `favicons` plugin for comprehensive favicon and app icon discovery
  - Add `feeds` plugin for RSS/Atom feed link detection
  - Add `robots` plugin for robots meta directive parsing and indexing status
  - Add `batchScrape()` for concurrent multi-URL scraping with error isolation
  - Add `extractContent()` / `extractFromHtml()` for main text extraction
  - Add `validateMetadata()` for SEO metadata scoring (100-point scale)

  ### web-meta-scraper-mcp

  - Add `batch_scrape`, `detect_feeds`, `check_robots`, `validate_metadata`, `extract_content` tools
  - Add `analyze-seo` and `suggest-metadata` prompt templates
  - Modularize server into separate tools and prompts modules

## 1.1.0

### Minor Changes

- ab27d3f: Add MCP (Model Context Protocol) server package (`web-meta-scraper-mcp`) that exposes `scrape_url` and `scrape_html` tools for AI assistants like Claude Code and Claude Desktop.

## 1.0.0

### Breaking Changes

- **Plugin API redesigned**: Plugins now receive `ScrapeContext` instead of raw `(html, options)`. Return `PluginResult` with `{ name, data }` pattern.
- **New core API**: `scrape()` function for quick usage, `createScraper()` for custom configuration.
- **Type system overhaul**: Removed deeply nested `Metadata` type. Introduced `ResolvedMetadata`, `ScraperResult`, `PluginResult`.
- **Removed `node-fetch`**: Uses native `fetch()` (Node.js 22+).
- **Package manager**: Migrated from yarn to pnpm.
- **Linter/Formatter**: Replaced ESLint + Prettier with Biome.

### New Features

- **oEmbed plugin**: Built-in oEmbed metadata extraction via `<link>` tag discovery.
- **Priority-based resolver**: Configurable `ResolveRule` for metadata merging instead of hardcoded priority map.
- **Context-based architecture**: `ScrapeContext` provides `CheerioAPI` and options to all plugins.
- **Fetcher module**: Dedicated `fetchHtml()` with timeout, redirect, and User-Agent support.
- **Structured result**: `ScraperResult` returns both merged `metadata` and raw `sources` from each plugin.

### Documentation

- Updated all docs for v1.0 API with new code examples.
- Added Korean translations (i18n).
- Added interactive playground page.
