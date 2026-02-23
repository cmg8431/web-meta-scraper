import type { Plugin, PluginResult } from '../../types/plugin';
import { matchDomain } from '../../utils/domain';
import { getAttr, getText } from '../../utils/dom';

const X_DOMAINS = ['twitter.com', 'x.com'];

/**
 * X (formerly Twitter) vendor plugin — extracts post metadata from X pages.
 *
 * Parses `og:title` to separate author display name and username,
 * extracts post date from `<time datetime>` elements, and upgrades
 * small profile images to larger versions.
 */
export const x: Plugin = (ctx): PluginResult => {
  const { $, url } = ctx;
  if (!matchDomain(url, X_DOMAINS)) return { name: 'x', data: {} };

  const data: Record<string, unknown> = { publisher: 'X' };

  // Parse og:title — format: "DisplayName on X: \"post content\""
  // or "DisplayName (@handle) / X"
  const ogTitle = getAttr($('meta[property="og:title"]'), 'content') || '';

  // Extract author name
  const onXMatch = ogTitle.match(/^(.+?)\s+on X:/);
  const slashXMatch = ogTitle.match(/^(.+?)\s*[/|]\s*X$/);
  if (onXMatch) {
    data.author = onXMatch[1].trim();
  } else if (slashXMatch) {
    data.author = slashXMatch[1].trim();
  }

  // Extract username from URL path — /username/status/id
  if (url) {
    const pathMatch = new URL(url).pathname.match(/^\/([^/]+)/);
    if (pathMatch && pathMatch[1] !== 'i') {
      data.username = `@${pathMatch[1]}`;
    }
  }

  // Build clean title
  if (data.author) {
    const handle = data.username || '';
    data.title = `${data.author} ${handle} on X`.trim();
  }

  // Extract date from <time datetime>
  const timeEl = $('time[datetime]');
  if (timeEl.length > 0) {
    const datetime = getAttr(timeEl.first(), 'datetime');
    if (datetime) {
      const d = new Date(datetime);
      if (!Number.isNaN(d.getTime())) {
        data.date = d.toISOString();
      }
    }
  }

  // Image: upgrade 200x200 profile pics to 400x400
  const ogImage = getAttr($('meta[property="og:image"]'), 'content');
  if (ogImage) {
    data.image = ogImage.replace(/_200x200\b/, '_400x400');
  }

  // Canonical URL
  const canonical = getAttr($('link[rel="canonical"]'), 'href');
  if (canonical) data.url = canonical;

  return { name: 'x', data };
};
