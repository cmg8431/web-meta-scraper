import type { Plugin, PluginResult } from '../../types/plugin';
import type { AudioEntry } from '../../types/result';
import { getAttr, getText } from '../../utils/dom';
import { resolveUrl } from '../../utils/url';

/**
 * Plugin that extracts audio resources from an HTML document.
 *
 * Sources:
 * - `og:audio*` meta tags (secure_url, url, type)
 * - `<audio>` and `<source>` elements
 * - JSON-LD AudioObject entries
 *
 * Duplicate URLs are automatically deduplicated.
 *
 * @param ctx - Scrape context providing the Cheerio DOM and optional base URL
 * @returns Plugin result with name "audio" and an `audio` array of {@link AudioEntry}
 */
export const audio: Plugin = (ctx): PluginResult => {
  const { $, url } = ctx;
  const seen = new Set<string>();
  const entries: AudioEntry[] = [];

  function add(entry: AudioEntry): void {
    if (seen.has(entry.url)) return;
    seen.add(entry.url);
    entries.push(entry);
  }

  // og:audio meta tags
  const ogAudioSecure = getAttr(
    $('meta[property="og:audio:secure_url"]'),
    'content',
  );
  const ogAudioUrl =
    ogAudioSecure ||
    getAttr($('meta[property="og:audio"]'), 'content') ||
    getAttr($('meta[property="og:audio:url"]'), 'content');
  if (ogAudioUrl) {
    add({
      url: resolveUrl(ogAudioUrl, url),
      type: getAttr($('meta[property="og:audio:type"]'), 'content'),
    });
  }

  // <audio> elements
  $('audio').each((_, elem) => {
    const src = getAttr($(elem), 'src');
    if (src) {
      add({ url: resolveUrl(src, url) });
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

  // JSON-LD AudioObject
  $('script[type="application/ld+json"]').each((_, elem) => {
    try {
      const parsed = JSON.parse(getText($(elem)));
      const items = parsed?.['@graph'] ?? [parsed];
      for (const item of Array.isArray(items) ? items : [items]) {
        if (!item || typeof item !== 'object') continue;
        if (item['@type'] === 'AudioObject' && item.contentUrl) {
          add({ url: resolveUrl(String(item.contentUrl), url) });
        }
      }
    } catch {
      // ignore invalid JSON-LD
    }
  });

  return {
    name: 'audio',
    data: entries.length > 0 ? { audio: entries } : {},
  };
};
