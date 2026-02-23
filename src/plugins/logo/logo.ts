import type { Plugin, PluginResult } from '../../types/plugin';
import { getAttr, getText } from '../../utils/dom';
import { resolveUrl } from '../../utils/url';

/**
 * Plugin that extracts the site logo URL from an HTML document.
 *
 * Sources (in priority order):
 * - `og:logo` meta tag
 * - `meta[itemprop="logo"]`
 * - `img[itemprop="logo"]`
 * - JSON-LD Organization / Brand / Publisher `logo` field
 *
 * @param ctx - Scrape context providing the Cheerio DOM and optional base URL
 * @returns Plugin result with name "logo" and a `logo` URL string
 */
export const logo: Plugin = (ctx): PluginResult => {
  const { $, url } = ctx;
  const data: Record<string, unknown> = {};

  // og:logo
  const ogLogo = getAttr($('meta[property="og:logo"]'), 'content');
  if (ogLogo) {
    data.logo = resolveUrl(ogLogo, url);
    return { name: 'logo', data };
  }

  // meta[itemprop="logo"]
  const metaLogo = getAttr($('meta[itemprop="logo"]'), 'content');
  if (metaLogo) {
    data.logo = resolveUrl(metaLogo, url);
    return { name: 'logo', data };
  }

  // img[itemprop="logo"]
  const imgLogo = getAttr($('img[itemprop="logo"]'), 'src');
  if (imgLogo) {
    data.logo = resolveUrl(imgLogo, url);
    return { name: 'logo', data };
  }

  // JSON-LD Organization / Brand / Publisher logo
  $('script[type="application/ld+json"]').each((_, elem) => {
    if (data.logo) return;
    try {
      const parsed = JSON.parse(getText($(elem)));
      const items = parsed?.['@graph'] ?? [parsed];
      for (const item of Array.isArray(items) ? items : [items]) {
        if (!item || typeof item !== 'object') continue;
        const logoVal = extractJsonLdLogo(item);
        if (logoVal) {
          data.logo = resolveUrl(logoVal, url);
          return;
        }
      }
    } catch {
      // ignore invalid JSON-LD
    }
  });

  return { name: 'logo', data };
};

function extractJsonLdLogo(item: Record<string, unknown>): string | undefined {
  // Direct logo field
  if (item.logo) {
    if (typeof item.logo === 'string') return item.logo;
    if (typeof item.logo === 'object' && (item.logo as Record<string, unknown>).url) {
      return String((item.logo as Record<string, unknown>).url);
    }
  }

  // Check publisher.logo
  if (item.publisher && typeof item.publisher === 'object') {
    const pub = item.publisher as Record<string, unknown>;
    if (pub.logo) {
      if (typeof pub.logo === 'string') return pub.logo;
      if (typeof pub.logo === 'object' && (pub.logo as Record<string, unknown>).url) {
        return String((pub.logo as Record<string, unknown>).url);
      }
    }
  }

  return undefined;
}
