import type { Plugin, PluginResult } from '../../types/plugin';
import { getAttr, getText } from '../../utils/dom';

function toISO(value: string): string | undefined {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

/**
 * Plugin that extracts publication and modification dates from an HTML document.
 *
 * Sources (in priority order):
 * - `article:published_time` / `article:modified_time` Open Graph meta tags
 * - `meta[name="date"]`, `meta[name="DC.date"]`, `meta[name="DC.date.issued"]`, `meta[name="DC.date.created"]`
 * - `meta[name="DC.date.modified"]`
 * - JSON-LD `datePublished` / `dateModified`
 * - `<time datetime>` element
 *
 * @param ctx - Scrape context providing the Cheerio DOM
 * @returns Plugin result with name "date" and `date` / `dateModified` ISO 8601 strings
 */
export const date: Plugin = (ctx): PluginResult => {
  const { $ } = ctx;
  const data: Record<string, unknown> = {};

  // Open Graph article dates
  const published = getAttr(
    $('meta[property="article:published_time"]'),
    'content',
  );
  const modified = getAttr(
    $('meta[property="article:modified_time"]'),
    'content',
  );

  if (published) {
    const iso = toISO(published);
    if (iso) data.date = iso;
  }
  if (modified) {
    const iso = toISO(modified);
    if (iso) data.dateModified = iso;
  }

  // meta[name="date"] and Dublin Core variants
  if (!data.date) {
    const selectors = [
      'meta[name="date"]',
      'meta[name="DC.date"]',
      'meta[name="DC.date.issued"]',
      'meta[name="DC.date.created"]',
    ];
    for (const sel of selectors) {
      const val = getAttr($(sel), 'content');
      if (val) {
        const iso = toISO(val);
        if (iso) {
          data.date = iso;
          break;
        }
      }
    }
  }

  if (!data.dateModified) {
    const val = getAttr($('meta[name="DC.date.modified"]'), 'content');
    if (val) {
      const iso = toISO(val);
      if (iso) data.dateModified = iso;
    }
  }

  // JSON-LD datePublished / dateModified
  if (!data.date || !data.dateModified) {
    $('script[type="application/ld+json"]').each((_, elem) => {
      try {
        const parsed = JSON.parse(getText($(elem)));
        const items = parsed?.['@graph'] ?? [parsed];
        for (const item of Array.isArray(items) ? items : [items]) {
          if (!item || typeof item !== 'object') continue;
          if (!data.date && item.datePublished) {
            const iso = toISO(String(item.datePublished));
            if (iso) data.date = iso;
          }
          if (!data.dateModified && item.dateModified) {
            const iso = toISO(String(item.dateModified));
            if (iso) data.dateModified = iso;
          }
        }
      } catch {
        // ignore invalid JSON-LD
      }
    });
  }

  // <time datetime> fallback
  if (!data.date) {
    const datetime = getAttr($('time[datetime]'), 'datetime');
    if (datetime) {
      const iso = toISO(datetime);
      if (iso) data.date = iso;
    }
  }

  return { name: 'date', data };
};
