import type { Plugin, PluginResult } from '../../types/plugin';
import { matchDomain } from '../../utils/domain';
import { getAttr, getText } from '../../utils/dom';

const REDDIT_DOMAINS = ['reddit'];

/**
 * Reddit vendor plugin — extracts post/subreddit metadata from Reddit pages.
 *
 * Parses Reddit-specific meta tags and JSON-LD data to extract
 * subreddit, author, vote score, and post type information.
 * Not available in metascraper.
 */
export const reddit: Plugin = (ctx): PluginResult => {
  const { $, url } = ctx;
  if (!matchDomain(url, REDDIT_DOMAINS)) {
    return { name: 'reddit', data: {} };
  }

  const data: Record<string, unknown> = { publisher: 'Reddit' };

  // Subreddit from URL path — /r/subreddit/
  if (url) {
    try {
      const subMatch = new URL(url).pathname.match(/\/r\/([^/]+)/);
      if (subMatch) data.subreddit = `r/${subMatch[1]}`;
    } catch {
      // ignore
    }
  }

  // Author from URL path — /user/username or posted by info
  if (url) {
    try {
      const userMatch = new URL(url).pathname.match(
        /\/(?:user|u)\/([^/]+)/,
      );
      if (userMatch) data.author = `u/${userMatch[1]}`;
    } catch {
      // ignore
    }
  }

  // Post title — from og:title, strip subreddit suffix
  const ogTitle = getAttr($('meta[property="og:title"]'), 'content') || '';
  if (ogTitle) {
    data.title = ogTitle
      .replace(/\s*:\s*r\/\w+$/, '')
      .replace(/\s*-\s*Reddit$/, '')
      .trim();
  }

  // JSON-LD for additional structured data
  $('script[type="application/ld+json"]').each((_, elem) => {
    try {
      const parsed = JSON.parse(getText($(elem)));
      const items = parsed?.['@graph'] ?? [parsed];
      for (const item of Array.isArray(items) ? items : [items]) {
        if (!item || typeof item !== 'object') continue;
        if (!data.author && item.author?.name) {
          data.author = String(item.author.name);
        }
        if (item.commentCount != null) {
          data.commentCount = Number(item.commentCount);
        }
      }
    } catch {
      // ignore
    }
  });

  return { name: 'reddit', data };
};
