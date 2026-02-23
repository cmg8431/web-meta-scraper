# web-meta-scraper-mcp

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
