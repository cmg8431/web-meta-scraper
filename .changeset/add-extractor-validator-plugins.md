---
"web-meta-scraper": minor
"web-meta-scraper-mcp": minor
---

### web-meta-scraper

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
