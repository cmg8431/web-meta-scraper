import { ScraperError } from '../core/errors';
import { fetchStealth } from './stealth';

export interface FetchOptions {
  timeout?: number;
  userAgent?: string;
  followRedirects?: boolean;
  maxContentLength?: number;
  /** Use HTTP/2 with browser-like TLS fingerprint for improved compatibility (default: false) */
  stealth?: boolean;
  /** Additional headers to send with the request */
  headers?: Record<string, string>;
}

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const DEFAULT_FETCH_OPTIONS: Required<Omit<FetchOptions, 'headers'>> = {
  timeout: 30000,
  userAgent: DEFAULT_USER_AGENT,
  followRedirects: true,
  maxContentLength: 5 * 1024 * 1024,
  stealth: false,
};

async function fetchSimple(
  url: string,
  opts: typeof DEFAULT_FETCH_OPTIONS & { headers?: Record<string, string> },
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), opts.timeout);

  const response = await fetch(url, {
    headers: {
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': opts.userAgent,
      ...opts.headers,
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
}

export async function fetchHtml(
  url: string,
  options?: FetchOptions,
): Promise<string> {
  const { headers, stealth, ...rest } = options ?? {};
  const opts = { ...DEFAULT_FETCH_OPTIONS, ...rest, headers };
  const useStealth = stealth ?? DEFAULT_FETCH_OPTIONS.stealth;

  try {
    if (useStealth) {
      return await fetchStealth(url, opts);
    }
    return await fetchSimple(url, opts);
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
