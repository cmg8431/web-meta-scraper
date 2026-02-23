import type { Plugin, PluginResult } from '../../types/plugin';
import type { FaviconEntry } from '../../types/result';
import { getAttr } from '../../utils/dom';
import { resolveUrl } from '../../utils/url';

/**
 * CSS selectors targeting all standard icon-related `<link>` elements.
 * Covers standard favicons, Apple touch icons, and SVG mask icons.
 */
const ICON_SELECTORS = [
  'link[rel="icon"]',
  'link[rel="shortcut icon"]',
  'link[rel="apple-touch-icon"]',
  'link[rel="apple-touch-icon-precomposed"]',
  'link[rel="mask-icon"]',
];

/**
 * Plugin that discovers all favicon and icon references in an HTML document.
 *
 * Scans for standard icon `<link>` elements (icon, shortcut icon, apple-touch-icon,
 * apple-touch-icon-precomposed, mask-icon) as well as the web app manifest link.
 * Relative URLs are resolved against the page URL. Duplicate URLs are
 * automatically deduplicated using a Set.
 *
 * Each discovered icon includes its resolved URL and optional `sizes` and
 * `type` attributes. Manifest links are recorded with `type: "manifest"`.
 *
 * @param ctx - Scrape context providing the Cheerio DOM and optional base URL
 * @returns Plugin result with name "favicons" and a `favicons` array of {@link FaviconEntry}
 *
 * @example
 * // HTML: <link rel="icon" href="/favicon.ico" sizes="32x32">
 * // Result: { name: 'favicons', data: { favicons: [{ url: 'https://example.com/favicon.ico', sizes: '32x32' }] } }
 */
export const favicons: Plugin = (ctx): PluginResult => {
  const { $, url } = ctx;
  const seen = new Set<string>();
  const entries: FaviconEntry[] = [];

  for (const selector of ICON_SELECTORS) {
    $(selector).each((_, elem) => {
      const href = getAttr($(elem), 'href');
      if (!href) return;

      const resolved = resolveUrl(href, url);
      if (seen.has(resolved)) return;
      seen.add(resolved);

      const entry: FaviconEntry = { url: resolved };
      const sizes = getAttr($(elem), 'sizes');
      if (sizes) entry.sizes = sizes;
      const type = getAttr($(elem), 'type');
      if (type) entry.type = type;

      entries.push(entry);
    });
  }

  const manifestHref = getAttr($('link[rel="manifest"]'), 'href');
  if (manifestHref) {
    const resolved = resolveUrl(manifestHref, url);
    if (!seen.has(resolved)) {
      entries.push({ url: resolved, type: 'manifest' });
    }
  }

  return {
    name: 'favicons',
    data: entries.length > 0 ? { favicons: entries } : {},
  };
};
