import { type ScraperConfig, scrape } from '../core';
import type { ScraperResult } from '../types/result';

/**
 * Configuration options for batch scraping operations.
 */
export interface BatchScrapeOptions {
  /**
   * Maximum number of URLs to scrape concurrently.
   * Higher values increase throughput but also memory and network usage.
   * @defaultValue 5
   */
  concurrency?: number;
  /** Optional scraper configuration forwarded to each individual scrape call */
  scraper?: ScraperConfig;
}

/**
 * Result of scraping a single URL within a batch operation.
 *
 * Each entry preserves the original URL and indicates success or failure.
 * On success, the `result` field contains the full {@link ScraperResult}.
 * On failure, the `error` field contains the error message.
 */
export interface BatchScrapeResult {
  /** The URL that was scraped */
  url: string;
  /** Whether the scrape completed without errors */
  success: boolean;
  /** Scraper output on success */
  result?: ScraperResult;
  /** Error message on failure */
  error?: string;
}

/**
 * Scrapes metadata from multiple URLs concurrently using a promise-based
 * worker pool with no external dependencies.
 *
 * Spawns up to `concurrency` parallel workers that pull URLs from a shared
 * index counter. Because JavaScript is single-threaded, the shared index
 * is safe from race conditions. Each URL is processed independently — a
 * failure in one URL does not affect the others.
 *
 * Results are returned in the same order as the input URLs regardless
 * of the order in which individual scrapes complete.
 *
 * @param urls - Array of URLs to scrape metadata from
 * @param options - Optional configuration for concurrency and scraper settings
 * @returns Array of {@link BatchScrapeResult} in the same order as the input URLs
 *
 * @example
 * const results = await batchScrape(
 *   ['https://example.com', 'https://example.org'],
 *   { concurrency: 3 },
 * );
 * for (const r of results) {
 *   if (r.success) console.log(r.result.metadata.title);
 *   else console.error(r.url, r.error);
 * }
 */
export async function batchScrape(
  urls: string[],
  options?: BatchScrapeOptions,
): Promise<BatchScrapeResult[]> {
  const concurrency = options?.concurrency ?? 5;
  const results: BatchScrapeResult[] = new Array(urls.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < urls.length) {
      const idx = nextIndex++;
      const url = urls[idx];
      try {
        const result = await scrape(url, options?.scraper);
        results[idx] = { url, success: true, result };
      } catch (err) {
        results[idx] = {
          url,
          success: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, urls.length) },
    () => worker(),
  );
  await Promise.all(workers);

  return results;
}
