import type { Plugin, PluginResult } from '../../types/plugin';
import { matchDomain } from '../../utils/domain';
import { getAttr, getText } from '../../utils/dom';
import { resolveUrl } from '../../utils/url';

const AMAZON_DOMAINS = ['amazon', 'amzn'];

/** Maps Amazon domain suffixes to language codes */
const DOMAIN_LANG: Record<string, string> = {
  'com': 'en',
  'co.uk': 'en',
  'ca': 'en',
  'com.au': 'en',
  'de': 'de',
  'fr': 'fr',
  'it': 'it',
  'es': 'es',
  'co.jp': 'ja',
  'cn': 'zh',
  'in': 'hi',
  'com.br': 'pt',
  'com.mx': 'es',
  'nl': 'nl',
  'pl': 'pl',
  'se': 'sv',
  'com.tr': 'tr',
  'ae': 'ar',
  'sa': 'ar',
  'sg': 'en',
};

function detectLangFromUrl(url: string): string | undefined {
  try {
    const hostname = new URL(url).hostname;
    // Extract suffix after "amazon." — e.g. amazon.co.jp → co.jp
    const match = hostname.match(/amazon\.(.+)$/);
    if (match) return DOMAIN_LANG[match[1]];
  } catch {
    // ignore
  }
  return undefined;
}

/**
 * Amazon vendor plugin — extracts product metadata from Amazon pages.
 *
 * Uses Amazon-specific element IDs and class names that are stable
 * across Amazon's international domains. Detects product language
 * from the domain suffix.
 */
export const amazon: Plugin = (ctx): PluginResult => {
  const { $, url } = ctx;
  if (!matchDomain(url, AMAZON_DOMAINS)) return { name: 'amazon', data: {} };

  const data: Record<string, unknown> = { publisher: 'Amazon' };

  // Product title — Amazon uses specific IDs
  const title =
    getText($('#productTitle')).trim() ||
    getText($('#btAsinTitle')).trim() ||
    getText($('#title')).trim() ||
    getText($('h1.a-size-large')).trim();
  if (title) data.title = title;

  // Product image — high-res from data-old-hires or landingImage
  const imgEl = $('.a-dynamic-image, #landingImage, #imgBlkFront');
  const image =
    getAttr(imgEl, 'data-old-hires') || getAttr(imgEl, 'src');
  if (image) data.image = resolveUrl(image, url);

  // Author/Brand
  const author =
    getText($('#bylineInfo')).trim() ||
    getText($('#brand')).trim() ||
    getText($('.contributorNameID')).trim();
  if (author) {
    // Clean up "Visit the X Store" → "X"
    data.author = author
      .replace(/^Visit the\s+/i, '')
      .replace(/\s+Store$/i, '')
      .replace(/^Brand:\s*/i, '')
      .trim();
  }

  // Price
  const price =
    getText($('.a-price .a-offscreen')).trim() ||
    getText($('#priceblock_ourprice')).trim() ||
    getText($('#priceblock_dealprice')).trim();
  if (price) data.price = price;

  // Rating
  const rating = getAttr($('#acrPopover'), 'title') ||
    getText($('span[data-hook="rating-out-of-text"]')).trim();
  if (rating) data.rating = rating;

  // Language from domain
  if (url) {
    const lang = detectLangFromUrl(url);
    if (lang) data.lang = lang;
  }

  return { name: 'amazon', data };
};
