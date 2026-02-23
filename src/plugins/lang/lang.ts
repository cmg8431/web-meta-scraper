import type { Plugin, PluginResult } from '../../types/plugin';
import { getAttr, getText } from '../../utils/dom';

/**
 * Normalizes a locale string like "en_US" to a BCP 47 language tag "en".
 * Returns the primary language subtag only.
 */
function normalizeLocale(value: string): string {
  return value.replace(/_/g, '-').split('-')[0].toLowerCase();
}

/**
 * Plugin that extracts the primary language of an HTML document.
 *
 * Sources (in priority order):
 * - `<html lang>` attribute
 * - `og:locale` meta tag (normalized from "en_US" to "en")
 * - `meta[http-equiv="content-language"]`
 * - `meta[itemprop="inLanguage"]`
 * - JSON-LD `inLanguage` field
 *
 * @param ctx - Scrape context providing the Cheerio DOM
 * @returns Plugin result with name "lang" and a `lang` string
 */
export const lang: Plugin = (ctx): PluginResult => {
  const { $ } = ctx;
  const data: Record<string, unknown> = {};

  // <html lang>
  const htmlLang = getAttr($('html'), 'lang');
  if (htmlLang) {
    data.lang = normalizeLocale(htmlLang);
    return { name: 'lang', data };
  }

  // og:locale
  const ogLocale = getAttr($('meta[property="og:locale"]'), 'content');
  if (ogLocale) {
    data.lang = normalizeLocale(ogLocale);
    return { name: 'lang', data };
  }

  // content-language
  const contentLang = getAttr(
    $('meta[http-equiv="content-language"]'),
    'content',
  );
  if (contentLang) {
    data.lang = normalizeLocale(contentLang);
    return { name: 'lang', data };
  }

  // itemprop="inLanguage"
  const inLang = getAttr($('meta[itemprop="inLanguage"]'), 'content');
  if (inLang) {
    data.lang = normalizeLocale(inLang);
    return { name: 'lang', data };
  }

  // JSON-LD inLanguage
  $('script[type="application/ld+json"]').each((_, elem) => {
    if (data.lang) return;
    try {
      const parsed = JSON.parse(getText($(elem)));
      const items = parsed?.['@graph'] ?? [parsed];
      for (const item of Array.isArray(items) ? items : [items]) {
        if (!item || typeof item !== 'object') continue;
        if (item.inLanguage && typeof item.inLanguage === 'string') {
          data.lang = normalizeLocale(item.inLanguage);
          return;
        }
      }
    } catch {
      // ignore invalid JSON-LD
    }
  });

  return { name: 'lang', data };
};
