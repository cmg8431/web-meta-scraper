import type { BaseMetadata, Metadata, Plugin, ScraperOptions } from '@/types';
import { toNormalizedText, toTruncatedText } from '@/utils';

/**
 * Custom error class for scraper-specific errors
 */
export class ScraperError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ScraperError';
  }
}

/**
 * 메타데이터 우선순위 정의
 * 높은 숫자 = 높은 우선순위
 */
const PRIORITY_MAP = {
  // 제목 우선순위: OpenGraph > Base > Twitter
  title: { openGraph: 3, base: 2, twitter: 1 },
  // 설명 우선순위: OpenGraph > Base > Twitter
  description: { openGraph: 3, base: 2, twitter: 1 },
  // 이미지 우선순위: OpenGraph > Twitter
  image: { openGraph: 2, twitter: 1 },
  // URL 우선순위: OpenGraph > Base
  url: { openGraph: 2, base: 1 },
};

/**
 * 중복된 메타데이터를 우선순위에 따라 병합
 */
function mergeMetadataByPriority(
  metadata: Partial<Metadata>,
): Record<string, any> {
  const result: Record<string, any> = {};

  // 각 필드별로 우선순위에 따라 병합
  for (const [field, priorities] of Object.entries(PRIORITY_MAP)) {
    let bestValue = null;
    let highestPriority = 0;

    // 각 소스에서 값 확인
    for (const [source, priority] of Object.entries(priorities)) {
      const sourceData = metadata[source as keyof Metadata] as Record<
        string,
        any
      >;
      const value = sourceData?.[field];

      if (value && priority > highestPriority) {
        bestValue = value;
        highestPriority = priority;
      }
    }

    if (bestValue) {
      result[field] = bestValue;
    }
  }

  // 고유한 필드들 추가
  if (metadata.base?.author) {
    result.author = metadata.base.author;
  }
  if (metadata.base?.keywords?.length) {
    result.keywords = metadata.base.keywords;
  }
  if (metadata.base?.canonicalUrl) {
    result.canonicalUrl = metadata.base.canonicalUrl;
  }
  if (metadata.base?.favicon) {
    result.favicon = metadata.base.favicon;
  }
  if (metadata.openGraph?.type) {
    result.type = metadata.openGraph.type;
  }
  if (metadata.openGraph?.siteName) {
    result.siteName = metadata.openGraph.siteName;
  }
  if (metadata.openGraph?.locale) {
    result.locale = metadata.openGraph.locale;
  }
  if (metadata.twitter?.card) {
    result.twitterCard = metadata.twitter.card;
  }
  if (metadata.twitter?.site) {
    result.twitterSite = metadata.twitter.site;
  }
  if (metadata.twitter?.creator) {
    result.twitterCreator = metadata.twitter.creator;
  }
  if (metadata.jsonLd?.length) {
    result.structuredData = metadata.jsonLd;
  }

  return result;
}

/**
 * 빈 값들을 제거하는 헬퍼 함수
 */
function removeEmptyValues(obj: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          cleaned[key] = value;
        }
      } else if (typeof value === 'object') {
        const cleanedNested = removeEmptyValues(value);
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      } else {
        cleaned[key] = value;
      }
    }
  }

  return cleaned;
}

/**
 * 폴백 값들을 적용하는 함수
 */
function applyFallbacks(metadata: Record<string, any>): Record<string, any> {
  const result = { ...metadata };

  // 제목이 없으면 사이트명 사용
  if (!result.title && result.siteName) {
    result.title = result.siteName;
  }

  // 설명이 없으면 구조화된 데이터에서 찾기
  if (!result.description && result.structuredData?.length) {
    for (const data of result.structuredData) {
      if (data.description) {
        result.description = data.description;
        break;
      }
    }
  }

  // 이미지가 상대 경로면 절대 경로로 변환
  if (result.image && result.url && result.image.startsWith('/')) {
    const baseUrl = new URL(result.url).origin;
    result.image = baseUrl + result.image;
  }

  // 파비콘도 마찬가지
  if (result.favicon && result.url && result.favicon.startsWith('/')) {
    const baseUrl = new URL(result.url).origin;
    result.favicon = baseUrl + result.favicon;
  }

  return result;
}

async function getHtmlContent(
  input: string,
  options: Partial<ScraperOptions>,
): Promise<string> {
  const isUrl = input.startsWith('http://') || input.startsWith('https://');
  if (!isUrl) {
    return input;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      options.timeout || 30000,
    );

    const response = await fetch(input, {
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent':
          options.userAgent || 'Mozilla/5.0 (compatible; MetaScraper/1.0;)',
      },
      redirect: options.followRedirects ? 'follow' : 'manual',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('text/html')) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    return response.text();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ScraperError(`Request timeout after ${options.timeout}ms`);
    }
    throw new ScraperError(
      `Failed to fetch URL: ${input}`,
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

function createInitialMetadata(
  options: Partial<ScraperOptions>,
): Partial<Metadata> {
  return {
    base: {} as BaseMetadata,
    openGraph: {},
    twitter: {},
    jsonLd: [],
    ...(options.extractRaw ? { raw: {} } : {}),
  };
}

function processMetadata(
  metadata: Record<string, any>,
  options: Partial<ScraperOptions>,
): void {
  if (metadata.title) {
    metadata.title = toNormalizedText(metadata.title);
  }

  if (metadata.description && options.maxDescriptionLength) {
    metadata.description = toTruncatedText(
      toNormalizedText(metadata.description),
      options.maxDescriptionLength,
    );
  }

  if (options.secureImages && metadata.image?.startsWith('http:')) {
    metadata.image = metadata.image.replace('http:', 'https:');
  }
}

async function executePlugins(
  html: string,
  plugins: Plugin[],
  options: ScraperOptions,
): Promise<{ rawMetadata: Partial<Metadata>; allResults: any[] }> {
  const results = await Promise.all(
    plugins.map((plugin) => plugin(html, options)),
  );

  const rawMetadata = results.reduce<Partial<Metadata>>(
    (acc, curr) => ({
      ...acc,
      ...curr,
    }),
    createInitialMetadata(options),
  );

  return { rawMetadata, allResults: results };
}

export interface ImprovedScraperOptions extends Partial<ScraperOptions> {
  omitEmpty?: boolean; // 빈 값 제거
  fallbacks?: boolean; // 폴백 값 적용
  priorityOverride?: Record<string, Record<string, number>>; // 우선순위 커스터마이징
}

/**
 * 개선된 메타데이터 스크래퍼 생성 (항상 플랫 구조)
 *
 * @example
 * ```ts
 * // 기본 사용 (플랫 구조, 빈 값 제거, 폴백 적용)
 * const scraper = createScraper([jsonLd, openGraph, twitter]);
 * const result = await scraper('https://example.com');
 * // { title: "Example", description: "...", image: "...", price: "$99" }
 *
 * // 커스텀 플러그인과 함께
 * const pricePlugin = (html) => ({ price: extractPrice(html) });
 * const scraper = createScraper([metaTags, openGraph, pricePlugin]);
 * ```
 */
export function createScraper(plugins: Plugin[] = []) {
  return async (
    input: string,
    options: ImprovedScraperOptions = {},
  ): Promise<any> => {
    const defaultOptions: ScraperOptions & ImprovedScraperOptions = {
      maxDescriptionLength: 200,
      secureImages: true,
      timeout: 30000,
      userAgent: 'Mozilla/5.0 (compatible; MetaScraper/1.0;)',
      followRedirects: true,
      validateUrls: true,
      extractRaw: false,
      // 새로운 기본값들
      omitEmpty: true,
      fallbacks: true,
    };

    const mergedOptions = { ...defaultOptions, ...options };

    try {
      if (mergedOptions.validateUrls && input.startsWith('http')) {
        const url = new URL(input);
        if (!url.protocol.startsWith('http')) {
          throw new Error('Only HTTP(S) protocols are supported');
        }
      }

      const html = await getHtmlContent(input, mergedOptions);
      const { rawMetadata } = await executePlugins(
        html,
        plugins,
        mergedOptions,
      );

      // 플랫 구조로 병합
      let result = mergeMetadataByPriority(rawMetadata);

      // 커스텀 플러그인 결과 병합 (플러그인에서 직접 반환한 값들)
      for (const pluginResult of await Promise.all(
        plugins.map((plugin) => plugin(html, mergedOptions)),
      )) {
        // base, openGraph, twitter 외의 필드들은 직접 추가
        for (const [key, value] of Object.entries(pluginResult)) {
          if (!['base', 'openGraph', 'twitter', 'jsonLd'].includes(key)) {
            if (value != null) {
              result[key] = value;
            }
          }
        }
      }

      if (mergedOptions.omitEmpty) {
        result = removeEmptyValues(result);
      }

      if (mergedOptions.fallbacks) {
        result = applyFallbacks(result);
      }

      processMetadata(result, mergedOptions);

      return result;
    } catch (error) {
      if (error instanceof ScraperError) {
        throw error;
      }
      throw new ScraperError(
        'Failed to scrape metadata',
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  };
}
