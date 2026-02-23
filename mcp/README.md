# web-meta-scraper-mcp

[![npm version](https://img.shields.io/npm/v/web-meta-scraper-mcp)](https://www.npmjs.com/package/web-meta-scraper-mcp)
[![license](https://img.shields.io/npm/l/web-meta-scraper-mcp)](https://github.com/cmg8431/web-meta-scraper/blob/main/LICENSE)

[web-meta-scraper](https://github.com/cmg8431/web-meta-scraper)를 [MCP(Model Context Protocol)](https://modelcontextprotocol.io) 서버로 감싼 패키지입니다. Claude Code, Claude Desktop 등 MCP 클라이언트에서 URL 메타데이터 추출 도구를 바로 사용할 수 있습니다.

## 설치 & 실행

별도 설치 없이 `npx`로 바로 실행할 수 있습니다.

```bash
npx web-meta-scraper-mcp
```

## MCP 클라이언트 설정

### Claude Code

```bash
claude mcp add web-meta-scraper -- npx -y web-meta-scraper-mcp
```

### Claude Desktop

`claude_desktop_config.json`에 아래 설정을 추가합니다.

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

Cursor Settings > MCP에서 아래 설정을 추가합니다.

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

## 제공 도구

### `scrape_url`

URL에서 메타데이터를 추출합니다.

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `url` | `string` | O | 스크래핑할 URL |

**요청 예시:**

```json
{
  "name": "scrape_url",
  "arguments": {
    "url": "https://github.com"
  }
}
```

**응답 예시:**

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

HTML 문자열에서 메타데이터를 추출합니다.

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `html` | `string` | O | 파싱할 HTML 문자열 |
| `url` | `string` | X | 상대 경로를 절대 경로로 변환할 기준 URL |

**요청 예시:**

```json
{
  "name": "scrape_html",
  "arguments": {
    "html": "<html><head><meta property=\"og:title\" content=\"Hello World\"/></head></html>",
    "url": "https://example.com"
  }
}
```

## 추출 항목

아래 메타데이터를 자동으로 추출하고, 우선순위 기반으로 병합합니다.

| 플러그인 | 추출 항목 |
|----------|-----------|
| **Meta Tags** | `title`, `description`, `keywords`, `author`, `favicon`, `canonicalUrl` |
| **Open Graph** | `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`, `og:locale` |
| **Twitter Cards** | `twitter:title`, `twitter:description`, `twitter:image`, `twitter:card`, `twitter:site`, `twitter:creator` |
| **JSON-LD** | 구조화된 데이터 (`Article`, `Product`, `Organization` 등) |

## 로컬 개발

```bash
# 의존성 설치
pnpm install

# 빌드
pnpm --filter web-meta-scraper-mcp build

# 도구 목록 확인
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}
{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | node mcp/dist/index.js

# MCP Inspector로 테스트
npx @modelcontextprotocol/inspector node mcp/dist/index.js
```

## License

MIT
