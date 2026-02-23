import { describe, expect, it, vi } from 'vitest';
import { batchScrape } from './index';

// Mock the scrape function from core
vi.mock('../core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../core')>();
  return {
    ...actual,
    scrape: vi.fn(async (input: string) => {
      if (input.includes('fail')) {
        throw new Error(`Failed to fetch: ${input}`);
      }
      return {
        metadata: { title: `Title for ${input}` },
        sources: {},
      };
    }),
  };
});

describe('batchScrape', () => {
  it('scrapes multiple URLs and returns results in order', async () => {
    const urls = [
      'https://example.com/a',
      'https://example.com/b',
      'https://example.com/c',
    ];
    const results = await batchScrape(urls);

    expect(results).toHaveLength(3);
    expect(results[0].url).toBe('https://example.com/a');
    expect(results[0].success).toBe(true);
    expect(results[0].result?.metadata.title).toBe(
      'Title for https://example.com/a',
    );
    expect(results[1].url).toBe('https://example.com/b');
    expect(results[2].url).toBe('https://example.com/c');
  });

  it('handles failures without stopping other URLs', async () => {
    const urls = [
      'https://example.com/ok',
      'https://fail.com/page',
      'https://example.com/ok2',
    ];
    const results = await batchScrape(urls);

    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(false);
    expect(results[1].error).toContain('fail');
    expect(results[2].success).toBe(true);
  });

  it('respects concurrency option', async () => {
    const urls = Array.from(
      { length: 10 },
      (_, i) => `https://example.com/${i}`,
    );
    const results = await batchScrape(urls, { concurrency: 2 });

    expect(results).toHaveLength(10);
    for (const r of results) {
      expect(r.success).toBe(true);
    }
  });

  it('handles empty URL list', async () => {
    const results = await batchScrape([]);
    expect(results).toEqual([]);
  });
});
