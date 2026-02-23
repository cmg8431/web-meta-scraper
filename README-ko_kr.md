![](https://github.com/user-attachments/assets/d90c0d88-c820-4ad7-ab28-193fd6491c6e)

# web-meta-scraper

[![npm version](https://img.shields.io/npm/v/web-meta-scraper)](https://www.npmjs.com/package/web-meta-scraper)
[![license](https://img.shields.io/npm/l/web-meta-scraper)](https://github.com/cmg8431/web-meta-scraper/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)

[English](https://github.com/cmg8431/web-meta-scraper/blob/main/README.md) | 한국어

웹 페이지 메타데이터를 추출하는 경량 플러그인 기반 TypeScript 라이브러리입니다. Open Graph, Twitter Cards, JSON-LD, 표준 메타 태그를 지원하며, 우선순위 기반 자동 병합을 제공합니다.

## 설치

```bash
npm install web-meta-scraper
# 또는
yarn add web-meta-scraper
# 또는
pnpm add web-meta-scraper
# 또는
bun add web-meta-scraper
```

## 빠른 시작

```typescript
import { createScraper, metaTags, openGraph, twitter, jsonLd } from 'web-meta-scraper';

const scrape = createScraper([metaTags, openGraph, twitter, jsonLd]);
const metadata = await scrape('https://example.com');

// 플랫 구조로 반환:
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

URL 대신 HTML 문자열을 직접 전달할 수도 있습니다:

```typescript
const metadata = await scrape('<html><head><title>Hello</title></head></html>');
```

## 플러그인

필요한 플러그인만 선택해서 사용할 수 있습니다. 각 플러그인은 특정 소스에서 메타데이터를 추출합니다.

| 플러그인 | Import | 추출 항목 |
|---------|--------|----------|
| **Meta Tags** | `metaTags` | `title`, `description`, `keywords`, `author`, `favicon`, `canonicalUrl` |
| **Open Graph** | `openGraph` | `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`, `og:locale` |
| **Twitter Cards** | `twitter` | `twitter:title`, `twitter:description`, `twitter:image`, `twitter:card`, `twitter:site`, `twitter:creator` |
| **JSON-LD** | `jsonLd` | 구조화된 데이터 (`Article`, `Product`, `Organization`, `FAQPage`, `BreadcrumbList` 등) |

```typescript
// 필요한 것만 사용
const scrape = createScraper([openGraph, twitter]);
```

## 우선순위 기반 병합

같은 필드(예: `title`)가 여러 소스에 존재할 경우, 가장 높은 우선순위의 값이 사용됩니다:

| 필드 | 우선순위 (높음 → 낮음) |
|------|---------------------|
| `title` | Open Graph → Meta Tags → Twitter |
| `description` | Open Graph → Meta Tags → Twitter |
| `image` | Open Graph → Twitter |
| `url` | Open Graph → Meta Tags |

`twitterCard`, `siteName`, `structuredData` 등 소스 고유 필드는 항상 그대로 포함됩니다.

## 옵션

```typescript
const scrape = createScraper([metaTags, openGraph]);

const metadata = await scrape('https://example.com', {
  maxDescriptionLength: 200,  // 설명 최대 길이 (기본값: 200)
  secureImages: true,         // 이미지 URL을 HTTPS로 변환 (기본값: true)
  timeout: 30000,             // 요청 타임아웃 ms (기본값: 30000)
  userAgent: 'MyBot/1.0',    // 커스텀 User-Agent 헤더
  followRedirects: true,      // HTTP 리다이렉트 따라가기 (기본값: true)
  validateUrls: true,         // URL 형식 검증 (기본값: true)
  extractRaw: false,          // 원시 메타데이터 포함 (기본값: false)
  omitEmpty: true,            // 빈 값/null 제거 (기본값: true)
  fallbacks: true,            // 폴백 로직 적용 (기본값: true)
});
```

### 폴백 동작

`fallbacks: true` (기본값)일 때:
- `title`이 없으면 `siteName`으로 대체
- `description`이 없으면 JSON-LD 구조화된 데이터에서 추출
- 상대 경로 이미지/파비콘 URL을 절대 경로로 변환

## 커스텀 플러그인

HTML에서 원하는 데이터를 추출하는 커스텀 플러그인을 만들 수 있습니다:

```typescript
import type { Plugin } from 'web-meta-scraper';

const pricePlugin: Plugin = (html, options) => {
  // HTML을 파싱하고 필요한 데이터 추출
  // base/openGraph/twitter/jsonLd 외의 키는
  // 결과에 직접 추가됨
  return { price: '$99.99', currency: 'USD' };
};

const scrape = createScraper([openGraph, pricePlugin]);
const metadata = await scrape('https://shop.example.com');
// { title: "Product", price: "$99.99", currency: "USD", ... }
```

## 에러 처리

fetch 실패나 잘못된 입력 시 `ScraperError`를 throw합니다:

```typescript
import { createScraper, openGraph } from 'web-meta-scraper';

const scrape = createScraper([openGraph]);

try {
  const metadata = await scrape('https://example.com');
} catch (error) {
  if (error.name === 'ScraperError') {
    console.error(error.message); // 예: "Request timeout after 30000ms"
    console.error(error.cause);   // 원본 에러 (있는 경우)
  }
}
```

## 라이선스

MIT
