import type { FetchOptions } from '../fetcher';
import { fetchHtml } from '../fetcher';
import type { Plugin, PluginResult } from '../types/plugin';
import type {
  FaviconEntry,
  ResolvedMetadata,
  ScraperResult,
} from '../types/result';
import { toNormalizedText, toTruncatedText } from '../utils/text';
import { createContext } from './context';
import { ScraperError } from './errors';
import { DEFAULT_RULES, type ResolveRule, resolve } from './resolver';

export interface ScraperConfig {
  plugins?: Plugin[];
  rules?: ResolveRule[];
  fetch?: FetchOptions;
  postProcess?: {
    omitEmpty?: boolean;
    fallbacks?: boolean;
    secureImages?: boolean;
    maxDescriptionLength?: number;
  };
}

const DEFAULT_POST_PROCESS = {
  omitEmpty: true,
  fallbacks: true,
  secureImages: true,
  maxDescriptionLength: 200,
};

function removeEmptyValues(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length > 0) cleaned[key] = value;
    } else if (typeof value === 'object') {
      const nested = removeEmptyValues(value as Record<string, unknown>);
      if (Object.keys(nested).length > 0) cleaned[key] = nested;
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

function applyFallbacks(metadata: Record<string, unknown>): void {
  if (!metadata.title && metadata.siteName) {
    metadata.title = metadata.siteName;
  }

  if (!metadata.description && Array.isArray(metadata.jsonLd)) {
    for (const item of metadata.jsonLd) {
      if (
        item &&
        typeof item === 'object' &&
        'description' in item &&
        item.description
      ) {
        metadata.description = item.description;
        break;
      }
    }
  }

  if (
    typeof metadata.image === 'string' &&
    typeof metadata.url === 'string' &&
    metadata.image.startsWith('/')
  ) {
    try {
      metadata.image = new URL(metadata.image, metadata.url).href;
    } catch {
      // ignore invalid URL
    }
  }

  if (
    typeof metadata.favicon === 'string' &&
    typeof metadata.url === 'string' &&
    metadata.favicon.startsWith('/')
  ) {
    try {
      metadata.favicon = new URL(metadata.favicon, metadata.url).href;
    } catch {
      // ignore invalid URL
    }
  }

  // Resolve relative logo URLs
  if (
    typeof metadata.logo === 'string' &&
    typeof metadata.url === 'string' &&
    metadata.logo.startsWith('/')
  ) {
    try {
      metadata.logo = new URL(metadata.logo, metadata.url).href;
    } catch {
      // ignore invalid URL
    }
  }

  // Best favicon selection: pick from favicons[] when favicon is missing
  if (
    !metadata.favicon &&
    Array.isArray(metadata.favicons) &&
    metadata.favicons.length > 0
  ) {
    metadata.favicon = selectBestFavicon(metadata.favicons as FaviconEntry[]);
  }

  // iframe oEmbed fallback
  if (!metadata.iframe) {
    const oembed = metadata.oembed as Record<string, unknown> | undefined;
    if (oembed && typeof oembed.html === 'string') {
      metadata.iframe = oembed.html;
    }
  }
}

function postProcess(
  metadata: Record<string, unknown>,
  opts: typeof DEFAULT_POST_PROCESS,
): void {
  if (typeof metadata.title === 'string') {
    metadata.title = toNormalizedText(metadata.title);
  }

  if (typeof metadata.description === 'string') {
    metadata.description = toTruncatedText(
      toNormalizedText(metadata.description),
      opts.maxDescriptionLength,
    );
  }

  if (opts.secureImages) {
    for (const key of ['image', 'favicon', 'logo'] as const) {
      const val = metadata[key];
      if (typeof val !== 'string') continue;
      if (val.startsWith('http:')) {
        metadata[key] = val.replace('http:', 'https:');
      } else if (val.startsWith('//')) {
        metadata[key] = `https:${val}`;
      }
    }
  }
}

const FORMAT_SCORE: Record<string, number> = {
  'image/png': 4,
  'image/jpeg': 3,
  'image/jpg': 3,
  'image/svg+xml': 2,
  'image/x-icon': 1,
};

function selectBestFavicon(favicons: FaviconEntry[]): string {
  let bestUrl = favicons[0].url;
  let bestScore = -1;

  for (const entry of favicons) {
    if (entry.type === 'manifest') continue;
    let score = 0;

    // Size score: parse "NxN" and use the larger dimension
    if (entry.sizes) {
      const match = entry.sizes.match(/(\d+)x(\d+)/);
      if (match) {
        score += Math.max(Number(match[1]), Number(match[2]));
      }
    }

    // Format score bonus
    if (entry.type && FORMAT_SCORE[entry.type]) {
      score += FORMAT_SCORE[entry.type] * 1000;
    } else if (entry.url.endsWith('.png')) {
      score += 4000;
    } else if (entry.url.endsWith('.jpg') || entry.url.endsWith('.jpeg')) {
      score += 3000;
    } else if (entry.url.endsWith('.svg')) {
      score += 2000;
    } else if (entry.url.endsWith('.ico')) {
      score += 1000;
    }

    if (score > bestScore) {
      bestScore = score;
      bestUrl = entry.url;
    }
  }

  return bestUrl;
}

function buildSources(
  results: PluginResult[],
): Record<string, Record<string, unknown>> {
  const sources: Record<string, Record<string, unknown>> = {};
  for (const r of results) {
    if (Object.keys(r.data).length > 0) {
      sources[r.name] = r.data;
    }
  }
  return sources;
}

export function createScraper(config?: ScraperConfig) {
  const plugins = config?.plugins ?? [];
  const rules = config?.rules ?? DEFAULT_RULES;
  const fetchOpts = config?.fetch;
  const pp = { ...DEFAULT_POST_PROCESS, ...config?.postProcess };

  async function runPlugins(
    html: string,
    url: string | undefined,
  ): Promise<ScraperResult> {
    const ctx = createContext(html, url, {
      timeout: fetchOpts?.timeout,
    });

    const results = await Promise.all(plugins.map((p) => p(ctx)));

    let resolved = resolve(results, rules);

    if (pp.fallbacks) {
      applyFallbacks(resolved);
    }

    if (pp.omitEmpty) {
      resolved = removeEmptyValues(resolved);
    }

    postProcess(resolved, pp);

    return {
      metadata: resolved as ResolvedMetadata,
      sources: buildSources(results),
    };
  }

  return {
    async scrape(
      html: string,
      options?: { url?: string },
    ): Promise<ScraperResult> {
      try {
        return await runPlugins(html, options?.url);
      } catch (error) {
        if (error instanceof ScraperError) throw error;
        throw new ScraperError(
          'Failed to scrape metadata',
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    },

    async scrapeUrl(url: string): Promise<ScraperResult> {
      try {
        const parsedUrl = new URL(url);
        if (!parsedUrl.protocol.startsWith('http')) {
          throw new ScraperError('Only HTTP(S) protocols are supported');
        }

        const html = await fetchHtml(url, fetchOpts);
        return await runPlugins(html, url);
      } catch (error) {
        if (error instanceof ScraperError) throw error;
        throw new ScraperError(
          'Failed to scrape metadata',
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    },
  };
}

export async function scrape(
  input: string,
  config?: ScraperConfig,
): Promise<ScraperResult> {
  const { metaTags } = await import('../plugins/meta-tags/meta-tags');
  const { openGraph } = await import('../plugins/open-graph/open-graph');
  const { twitter } = await import('../plugins/twitter/twitter');
  const { jsonLd } = await import('../plugins/json-ld/json-ld');

  const defaultPlugins = [metaTags, openGraph, twitter, jsonLd];
  const mergedConfig: ScraperConfig = {
    ...config,
    plugins: config?.plugins ?? defaultPlugins,
  };

  const s = createScraper(mergedConfig);

  const isUrl = input.startsWith('http://') || input.startsWith('https://');
  if (isUrl) {
    return s.scrapeUrl(input);
  }
  return s.scrape(input);
}

export { ScraperError } from './errors';
