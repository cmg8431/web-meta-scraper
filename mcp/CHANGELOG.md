# web-meta-scraper-mcp

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

### Patch Changes

- Updated dependencies [4d0d6ce]
  - web-meta-scraper@1.3.0

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

### Patch Changes

- Updated dependencies [1b9f436]
  - web-meta-scraper@1.2.0

## 1.1.0

### Minor Changes

- ab27d3f: Add MCP (Model Context Protocol) server package (`web-meta-scraper-mcp`) that exposes `scrape_url` and `scrape_html` tools for AI assistants like Claude Code and Claude Desktop.

### Patch Changes

- Updated dependencies [ab27d3f]
  - web-meta-scraper@1.1.0
