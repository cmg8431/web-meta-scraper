import type { Plugin, PluginResult } from '../../types/plugin';
import type { FeedEntry } from '../../types/result';
import { getAttr } from '../../utils/dom';
import { resolveUrl } from '../../utils/url';

/**
 * Mapping of CSS selectors to their corresponding feed types.
 * Targets `<link rel="alternate">` elements with RSS or Atom MIME types.
 */
const FEED_SELECTORS: { selector: string; type: 'rss' | 'atom' }[] = [
  {
    selector: 'link[rel="alternate"][type="application/rss+xml"]',
    type: 'rss',
  },
  {
    selector: 'link[rel="alternate"][type="application/atom+xml"]',
    type: 'atom',
  },
];

/**
 * Plugin that detects RSS and Atom feed links in an HTML document.
 *
 * Searches for `<link rel="alternate">` elements with content types
 * `application/rss+xml` (RSS 2.0) and `application/atom+xml` (Atom).
 * Extracts the feed URL (resolved against the page base URL) and
 * an optional human-readable title from the `title` attribute.
 *
 * @param ctx - Scrape context providing the Cheerio DOM and optional base URL
 * @returns Plugin result with name "feeds" and a `feeds` array of {@link FeedEntry}
 *
 * @example
 * // HTML: <link rel="alternate" type="application/rss+xml" href="/feed.xml" title="Blog">
 * // Result: { name: 'feeds', data: { feeds: [{ url: 'https://example.com/feed.xml', title: 'Blog', type: 'rss' }] } }
 */
export const feeds: Plugin = (ctx): PluginResult => {
  const { $, url } = ctx;
  const entries: FeedEntry[] = [];

  for (const { selector, type } of FEED_SELECTORS) {
    $(selector).each((_, elem) => {
      const href = getAttr($(elem), 'href');
      if (!href) return;

      const entry: FeedEntry = {
        url: resolveUrl(href, url),
        type,
      };
      const title = getAttr($(elem), 'title');
      if (title) entry.title = title;

      entries.push(entry);
    });
  }

  return { name: 'feeds', data: entries.length > 0 ? { feeds: entries } : {} };
};
