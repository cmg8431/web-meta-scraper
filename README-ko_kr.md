![](https://github.com/user-attachments/assets/d90c0d88-c820-4ad7-ab28-193fd6491c6e)

# web-meta-scraper

[![npm version](https://img.shields.io/npm/v/web-meta-scraper)](https://www.npmjs.com/package/web-meta-scraper)
[![npm downloads](https://img.shields.io/npm/dm/web-meta-scraper)](https://www.npmjs.com/package/web-meta-scraper)
[![bundle size](https://img.shields.io/bundlephobia/minzip/web-meta-scraper)](https://bundlephobia.com/package/web-meta-scraper)
[![license](https://img.shields.io/npm/l/web-meta-scraper)](https://github.com/cmg8431/web-meta-scraper/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![GitHub stars](https://img.shields.io/github/stars/cmg8431/web-meta-scraper)](https://github.com/cmg8431/web-meta-scraper)

[English](https://github.com/cmg8431/web-meta-scraper/blob/main/README.md) | 한국어

웹 페이지 메타데이터를 추출하는 경량 플러그인 기반 TypeScript 라이브러리입니다. Open Graph, Twitter Cards, JSON-LD, oEmbed, 표준 메타 태그를 지원하며 우선순위 기반 자동 병합을 제공합니다.

## 왜 web-meta-scraper인가?

| | web-meta-scraper | [metascraper](https://github.com/microlinkhq/metascraper) | [open-graph-scraper](https://github.com/jshemas/openGraphScraper) |
|---|---|---|---|
| **의존성** | 1개 (`cheerio`) | 10개+ | 4개+ |
| **번들 크기** | ~5KB min+gzip | ~50KB+ | ~15KB+ |
| **플러그인 시스템** | 조합 가능한 플러그인 | 규칙 기반 | 모놀리식 |
| **커스텀 플러그인** | 간단한 함수 | 복잡한 규칙 | 미지원 |
| **TypeScript** | 퍼스트 클래스 | 부분 지원 | 부분 지원 |
| **oEmbed 지원** | 내장 플러그인 | 별도 패키지 | 미지원 |
| **커스텀 우선순위 규칙** | 설정 가능 | 고정 | 고정 |
| **네이티브 fetch** | 네이티브 `fetch()` 사용 | `got` 사용 | `undici` 사용 |

- **단일 의존성** — HTML 파싱을 위한 [cheerio](https://cheerio.js.org/)만 사용. HTTP 요청은 네이티브 `fetch()` 사용.
- **플러그인 아키텍처** — 필요한 추출기만 선택. 간단한 함수로 커스텀 플러그인 생성 가능.
- **우선순위 기반 병합** — 같은 필드가 여러 소스에 있을 때 자동으로 충돌 해결. 우선순위 규칙 커스터마이징 가능.
- **TypeScript 퍼스트** — `ResolvedMetadata`, `ScraperResult`, 플러그인 타입 등 완전한 타입 정의.
- **구조화된 결과** — 병합된 `metadata`와 각 플러그인의 원본 `sources`를 함께 반환.

## 설치

```bash
npm install web-meta-scraper
# 또는
pnpm add web-meta-scraper
# 또는
yarn add web-meta-scraper
# 또는
bun add web-meta-scraper
```

## 빠른 시작

### 간단한 사용 — `scrape()` 함수

가장 쉬운 방법입니다. URL과 HTML을 자동 감지하고 모든 빌트인 플러그인을 사용합니다:

```typescript
import { scrape } from 'web-meta-scraper';

// URL에서 스크래핑
const result = await scrape('https://example.com');

// HTML 문자열에서 스크래핑
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

// 각 플러그인의 원본 데이터도 확인 가능
console.log(result.sources);
// { "open-graph": { title: "Example", ... }, "meta-tags": { ... }, ... }
```

### 고급 사용 — `createScraper()`

플러그인, 우선순위 규칙, fetch 옵션, 후처리를 세밀하게 제어할 수 있습니다:

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

// URL에서 스크래핑
const result = await scraper.scrapeUrl('https://example.com');

// HTML 직접 파싱
const result = await scraper.scrape(html, { url: 'https://example.com' });
```

## 플러그인

| 플러그인 | Import | 추출 항목 |
|---------|--------|----------|
| **Meta Tags** | `metaTags` | `title`, `description`, `keywords`, `author`, `favicon`, `canonicalUrl` |
| **Open Graph** | `openGraph` | `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`, `og:locale` |
| **Twitter Cards** | `twitter` | `twitter:title`, `twitter:description`, `twitter:image`, `twitter:card`, `twitter:site`, `twitter:creator` |
| **JSON-LD** | `jsonLd` | 구조화된 데이터 (`Article`, `Product`, `Organization`, `FAQPage`, `BreadcrumbList` 등) |
| **oEmbed** | `oembed` | oEmbed 데이터 (`title`, `author_name`, `thumbnail_url`, `html` 등) |

```typescript
// 필요한 것만 사용
const scraper = createScraper({
  plugins: [openGraph, twitter],
});
```

## 우선순위 기반 병합

같은 필드가 여러 소스에 존재할 경우 가장 높은 우선순위의 값이 사용됩니다:

| 필드 | 우선순위 (높음 → 낮음) |
|------|---------------------|
| `title` | Open Graph → Meta Tags → Twitter |
| `description` | Open Graph → Meta Tags → Twitter |
| `image` | Open Graph → Twitter |
| `url` | Open Graph → Meta Tags (canonical) |

`twitterCard`, `siteName`, `locale`, `jsonLd`, `oembed` 등 소스 고유 필드는 항상 그대로 포함됩니다.

기본 규칙을 오버라이드할 수 있습니다:

```typescript
import { createScraper, metaTags, openGraph, twitter } from 'web-meta-scraper';

const scraper = createScraper({
  plugins: [metaTags, openGraph, twitter],
  rules: [
    {
      field: 'title',
      sources: [
        { plugin: 'twitter', key: 'title', priority: 3 },   // Twitter 우선
        { plugin: 'open-graph', key: 'title', priority: 2 },
        { plugin: 'meta-tags', key: 'title', priority: 1 },
      ],
    },
    // ... 다른 규칙
  ],
});
```

## 설정

### `ScraperConfig`

```typescript
const scraper = createScraper({
  // 사용할 플러그인
  plugins: [metaTags, openGraph, twitter, jsonLd, oembed],

  // 우선순위 규칙 (기본값: DEFAULT_RULES)
  rules: DEFAULT_RULES,

  // Fetch 옵션 (scrapeUrl에 적용)
  fetch: {
    timeout: 30000,             // 요청 타임아웃 ms (기본값: 30000)
    userAgent: 'MyBot/1.0',    // 커스텀 User-Agent 헤더
    followRedirects: true,      // HTTP 리다이렉트 따라가기 (기본값: true)
    maxContentLength: 5242880,  // 최대 응답 크기 bytes (기본값: 5MB)
  },

  // 후처리 옵션
  postProcess: {
    maxDescriptionLength: 200,  // 설명 최대 길이 (기본값: 200)
    secureImages: true,         // 이미지 URL을 HTTPS로 변환 (기본값: true)
    omitEmpty: true,            // 빈 값/null 제거 (기본값: true)
    fallbacks: true,            // 폴백 로직 적용 (기본값: true)
  },
});
```

### 폴백 동작

`fallbacks: true` (기본값)일 때:
- `title`이 없으면 `siteName`으로 대체
- `description`이 없으면 JSON-LD 구조화된 데이터에서 추출
- 상대 경로 이미지/파비콘 URL을 절대 경로로 변환

## 커스텀 플러그인

플러그인은 `ScrapeContext`를 받아 `PluginResult`를 반환하는 함수입니다:

```typescript
import type { Plugin } from 'web-meta-scraper';

const pricePlugin: Plugin = (ctx) => {
  const { $ } = ctx; // Cheerio 인스턴스

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

## 에러 처리

```typescript
import { scrape, ScraperError } from 'web-meta-scraper';

try {
  const result = await scrape('https://example.com');
} catch (error) {
  if (error instanceof ScraperError) {
    console.error(error.message); // 예: "Request timeout after 30000ms"
    console.error(error.cause);   // 원본 에러 (있는 경우)
  }
}
```

## MCP 서버

[`web-meta-scraper-mcp`](https://www.npmjs.com/package/web-meta-scraper-mcp)는 web-meta-scraper를 [MCP(Model Context Protocol)](https://modelcontextprotocol.io) 서버로 제공합니다. Claude Code, Claude Desktop 등 MCP 클라이언트에서 메타데이터 추출 도구를 바로 사용할 수 있습니다.

### 설정

**Claude Code:**

```bash
claude mcp add web-meta-scraper -- npx -y web-meta-scraper-mcp
```

**Claude Desktop / Cursor:**

설정 파일에 아래 내용을 추가합니다:

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

### 제공 도구

| 도구 | 설명 |
|------|------|
| `scrape_url` | URL에서 메타데이터 추출 (Open Graph, Twitter Cards, JSON-LD, meta tags) |
| `scrape_html` | HTML 문자열에서 메타데이터 추출 (상대 경로 해석을 위한 기준 URL 옵션 제공) |

자세한 사용법과 예시는 [MCP 패키지 README](./mcp/README.md)를 참고하세요.

## 라이선스

MIT
