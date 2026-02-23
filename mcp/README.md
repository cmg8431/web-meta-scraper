# web-meta-scraper-mcp

[![npm version](https://img.shields.io/npm/v/web-meta-scraper-mcp)](https://www.npmjs.com/package/web-meta-scraper-mcp)
[![license](https://img.shields.io/npm/l/web-meta-scraper-mcp)](https://github.com/cmg8431/web-meta-scraper/blob/main/LICENSE)

English | [한국어](./README-ko_kr.md)

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that wraps [web-meta-scraper](https://github.com/cmg8431/web-meta-scraper). Use URL metadata extraction tools directly from MCP clients like Claude Code, Claude Desktop, and Cursor.

## Setup & Run

Run directly with `npx` — no installation required.

```bash
npx web-meta-scraper-mcp
```

## MCP Client Configuration

### Claude Code

```bash
claude mcp add web-meta-scraper -- npx -y web-meta-scraper-mcp
```

### Claude Desktop

Add to your `claude_desktop_config.json`:

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

### Cursor

Add to Cursor Settings > MCP:

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

## Available Tools

### `scrape_url`

Extract metadata from a URL.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | `string` | Yes | The URL to scrape metadata from |

**Example request:**

```json
{
  "name": "scrape_url",
  "arguments": {
    "url": "https://github.com"
  }
}
```

**Example response:**

```json
{
  "metadata": {
    "title": "GitHub: Let's build from here",
    "description": "GitHub is where over 100 million developers shape the future of software.",
    "image": "https://github.githubassets.com/assets/social-card.png",
    "url": "https://github.com",
    "type": "website",
    "siteName": "GitHub"
  },
  "sources": {
    "meta-tags": { "title": "GitHub: Let's build from here", "..." : "..." },
    "open-graph": { "title": "GitHub: Let's build from here", "..." : "..." },
    "twitter": { "..." : "..." },
    "json-ld": { "..." : "..." }
  }
}
```

### `scrape_html`

Extract metadata from a raw HTML string.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `html` | `string` | Yes | The raw HTML string to extract metadata from |
| `url` | `string` | No | Base URL for resolving relative paths |

### `batch_scrape`

Scrape metadata from multiple URLs concurrently.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `urls` | `string[]` | Yes | List of URLs to scrape |
| `concurrency` | `number` | No | Number of concurrent requests (default: 5, max: 20) |

### `detect_feeds`

Detect RSS and Atom feed links from a web page.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | `string` | No | URL to detect feeds from |
| `html` | `string` | No | Raw HTML string to detect feeds from |

### `check_robots`

Check robots meta tag directives and indexing status.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | `string` | No | URL to check robots directives from |
| `html` | `string` | No | Raw HTML string to check robots directives from |

### `validate_metadata`

Validate metadata quality and generate an SEO score report (100-point scale).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | `string` | No | URL to validate metadata from |
| `html` | `string` | No | Raw HTML string to validate metadata from |

### `extract_content`

Extract main text content from a web page (removes navigation, ads, sidebars).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | `string` | No | URL to extract content from |
| `html` | `string` | No | Raw HTML string to extract content from |

## Extracted Metadata

The server automatically extracts and merges metadata from all built-in plugins using priority-based rules:

| Plugin | Fields |
|--------|--------|
| **Meta Tags** | `title`, `description`, `keywords`, `author`, `favicon`, `canonicalUrl` |
| **Open Graph** | `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`, `og:locale` |
| **Twitter Cards** | `twitter:title`, `twitter:description`, `twitter:image`, `twitter:card`, `twitter:site`, `twitter:creator` |
| **JSON-LD** | Structured data (`Article`, `Product`, `Organization`, etc.) |
| **Favicons** | All icon links with `sizes` and `type` |
| **Feeds** | RSS and Atom feed links with `title` |
| **Robots** | Robots meta directives and indexability flags |

## Local Development

```bash
# Install dependencies
pnpm install

# Build
pnpm --filter web-meta-scraper-mcp build

# List tools
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}
{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | node mcp/dist/index.js

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node mcp/dist/index.js
```

## License

MIT
