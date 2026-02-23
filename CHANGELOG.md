# web-meta-scraper

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
