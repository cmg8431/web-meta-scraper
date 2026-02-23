import type { Plugin, PluginResult } from '../../types/plugin';
import { matchDomain } from '../../utils/domain';
import { getAttr } from '../../utils/dom';

const INSTAGRAM_DOMAINS = ['instagram'];

/**
 * Instagram vendor plugin — extracts post metadata from Instagram pages.
 *
 * Parses `og:title` and `og:description` to extract author info
 * and post date from the description text.
 */
export const instagram: Plugin = (ctx): PluginResult => {
  const { $, url } = ctx;
  if (!matchDomain(url, INSTAGRAM_DOMAINS)) {
    return { name: 'instagram', data: {} };
  }

  const data: Record<string, unknown> = { publisher: 'Instagram' };

  // Parse author from og:title — format: "Author Name on Instagram: ..."
  const ogTitle = getAttr($('meta[property="og:title"]'), 'content') || '';
  const authorMatch = ogTitle.match(/^(.+?)\s+on Instagram/);
  if (authorMatch) {
    data.author = authorMatch[1].trim();
  }

  // Parse date from og:description — format: "... on Month DD, YYYY"
  const ogDesc =
    getAttr($('meta[property="og:description"]'), 'content') || '';
  const dateMatch = ogDesc.match(
    /on\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})/,
  );
  if (dateMatch) {
    const d = new Date(`${dateMatch[1]} ${dateMatch[2]}, ${dateMatch[3]}`);
    if (!Number.isNaN(d.getTime())) {
      data.date = d.toISOString();
    }
  }

  // Username from URL path — /username/ or /p/xxx/
  if (url) {
    try {
      const segments = new URL(url).pathname.split('/').filter(Boolean);
      if (segments.length >= 1 && !['p', 'reel', 'tv', 'stories'].includes(segments[0])) {
        data.username = `@${segments[0]}`;
      }
    } catch {
      // ignore
    }
  }

  // Title from twitter:title if cleaner
  const twitterTitle = getAttr($('meta[name="twitter:title"]'), 'content');
  if (twitterTitle) data.title = twitterTitle;

  return { name: 'instagram', data };
};
