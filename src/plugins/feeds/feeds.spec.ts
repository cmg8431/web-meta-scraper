import { describe, expect, it } from 'vitest';
import { createContext } from '../../core/context';
import type { PluginResult } from '../../types/plugin';
import { feeds } from './feeds';

function run(html: string, url?: string): PluginResult {
  const ctx = createContext(html, url, {});
  return feeds(ctx) as PluginResult;
}

describe('feeds plugin', () => {
  it('detects RSS feed', () => {
    const html =
      '<html><head><link rel="alternate" type="application/rss+xml" href="/feed.xml" title="RSS Feed"></head></html>';
    const result = run(html, 'https://example.com');
    expect(result.name).toBe('feeds');
    expect(result.data.feeds).toEqual([
      { url: 'https://example.com/feed.xml', title: 'RSS Feed', type: 'rss' },
    ]);
  });

  it('detects Atom feed', () => {
    const html =
      '<html><head><link rel="alternate" type="application/atom+xml" href="/atom.xml" title="Atom"></head></html>';
    const result = run(html, 'https://example.com');
    expect(result.data.feeds).toEqual([
      { url: 'https://example.com/atom.xml', title: 'Atom', type: 'atom' },
    ]);
  });

  it('detects multiple feeds', () => {
    const html = `<html><head>
      <link rel="alternate" type="application/rss+xml" href="/rss.xml" title="RSS">
      <link rel="alternate" type="application/atom+xml" href="/atom.xml" title="Atom">
    </head></html>`;
    const result = run(html, 'https://example.com');
    const feedList = result.data.feeds as {
      url: string;
      title?: string;
      type: string;
    }[];
    expect(feedList).toHaveLength(2);
    expect(feedList[0].type).toBe('rss');
    expect(feedList[1].type).toBe('atom');
  });

  it('omits title when not present', () => {
    const html =
      '<html><head><link rel="alternate" type="application/rss+xml" href="/feed.xml"></head></html>';
    const result = run(html, 'https://example.com');
    expect(result.data.feeds).toEqual([
      { url: 'https://example.com/feed.xml', type: 'rss' },
    ]);
  });

  it('returns empty data when no feeds found', () => {
    const result = run('<html><head></head></html>');
    expect(result.data).toEqual({});
  });

  it('resolves relative URLs', () => {
    const html =
      '<html><head><link rel="alternate" type="application/rss+xml" href="/blog/feed"></head></html>';
    const result = run(html, 'https://example.com/page');
    expect((result.data.feeds as { url: string }[])[0].url).toBe(
      'https://example.com/blog/feed',
    );
  });
});
