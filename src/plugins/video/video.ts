import type { Plugin, PluginResult } from '../../types/plugin';
import type { VideoEntry } from '../../types/result';
import { getAttr, getText } from '../../utils/dom';
import { resolveUrl } from '../../utils/url';

function toInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? undefined : n;
}

/**
 * Plugin that extracts video resources from an HTML document.
 *
 * Sources:
 * - `og:video*` meta tags (secure_url, url, type, width, height)
 * - `twitter:player*` meta tags
 * - `<video>` and `<source>` elements
 * - JSON-LD VideoObject entries
 *
 * Duplicate URLs are automatically deduplicated.
 *
 * @param ctx - Scrape context providing the Cheerio DOM and optional base URL
 * @returns Plugin result with name "video" and a `videos` array of {@link VideoEntry}
 */
export const video: Plugin = (ctx): PluginResult => {
  const { $, url } = ctx;
  const seen = new Set<string>();
  const entries: VideoEntry[] = [];

  function add(entry: VideoEntry): void {
    if (seen.has(entry.url)) return;
    seen.add(entry.url);
    entries.push(entry);
  }

  // og:video meta tags
  const ogVideoSecure = getAttr(
    $('meta[property="og:video:secure_url"]'),
    'content',
  );
  const ogVideoUrl =
    ogVideoSecure ||
    getAttr($('meta[property="og:video"]'), 'content') ||
    getAttr($('meta[property="og:video:url"]'), 'content');
  if (ogVideoUrl) {
    add({
      url: resolveUrl(ogVideoUrl, url),
      type: getAttr($('meta[property="og:video:type"]'), 'content'),
      width: toInt(getAttr($('meta[property="og:video:width"]'), 'content')),
      height: toInt(getAttr($('meta[property="og:video:height"]'), 'content')),
    });
  }

  // twitter:player
  const twitterPlayer = getAttr($('meta[name="twitter:player"]'), 'content');
  if (twitterPlayer) {
    add({
      url: resolveUrl(twitterPlayer, url),
      width: toInt(getAttr($('meta[name="twitter:player:width"]'), 'content')),
      height: toInt(
        getAttr($('meta[name="twitter:player:height"]'), 'content'),
      ),
    });
  }

  // <video> elements
  $('video').each((_, elem) => {
    const src = getAttr($(elem), 'src');
    if (src) {
      add({
        url: resolveUrl(src, url),
        width: toInt(getAttr($(elem), 'width')),
        height: toInt(getAttr($(elem), 'height')),
      });
    }
    // <source> children
    $(elem)
      .find('source')
      .each((__, sourceElem) => {
        const srcVal = getAttr($(sourceElem), 'src');
        if (srcVal) {
          add({
            url: resolveUrl(srcVal, url),
            type: getAttr($(sourceElem), 'type'),
          });
        }
      });
  });

  // JSON-LD VideoObject
  $('script[type="application/ld+json"]').each((_, elem) => {
    try {
      const parsed = JSON.parse(getText($(elem)));
      const items = parsed?.['@graph'] ?? [parsed];
      for (const item of Array.isArray(items) ? items : [items]) {
        if (!item || typeof item !== 'object') continue;
        if (item['@type'] === 'VideoObject' && item.contentUrl) {
          add({
            url: resolveUrl(String(item.contentUrl), url),
            width: toInt(item.width != null ? String(item.width) : undefined),
            height: toInt(
              item.height != null ? String(item.height) : undefined,
            ),
          });
        }
      }
    } catch {
      // ignore invalid JSON-LD
    }
  });

  return {
    name: 'video',
    data: entries.length > 0 ? { videos: entries } : {},
  };
};
