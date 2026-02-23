import { ScraperError } from '../core/errors';

export interface FetchOptions {
  timeout?: number;
  userAgent?: string;
  followRedirects?: boolean;
  maxContentLength?: number;
}

const DEFAULT_FETCH_OPTIONS: Required<FetchOptions> = {
  timeout: 30000,
  userAgent: 'Mozilla/5.0 (compatible; WebMetaScraper/2.0;)',
  followRedirects: true,
  maxContentLength: 5 * 1024 * 1024, // 5MB
};

export async function fetchHtml(
  url: string,
  options?: FetchOptions,
): Promise<string> {
  const opts = { ...DEFAULT_FETCH_OPTIONS, ...options };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), opts.timeout);

    const response = await fetch(url, {
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': opts.userAgent,
      },
      redirect: opts.followRedirects ? 'follow' : 'manual',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('text/html')) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && Number(contentLength) > opts.maxContentLength) {
      throw new Error(
        `Content too large: ${contentLength} bytes (max: ${opts.maxContentLength})`,
      );
    }

    return await response.text();
  } catch (error) {
    if (error instanceof ScraperError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ScraperError(`Request timeout after ${opts.timeout}ms`);
    }
    throw new ScraperError(
      `Failed to fetch URL: ${url}`,
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}
