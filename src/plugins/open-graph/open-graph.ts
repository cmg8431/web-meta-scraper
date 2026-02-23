import type { CheerioAPI } from 'cheerio';

import type {
  Metadata,
  OpenGraphMetadata,
  Plugin,
  ScraperOptions,
} from '@/types';
import { toSecureUrl, toTruncatedText } from '@/utils';
import { getAttr, getCheerioDoc } from '@/utils/dom';

/**
 * Extracts OpenGraph metadata from HTML meta tags.
 *
 * @param $ - Cheerio instance for HTML parsing
 * @param options - Scraper configuration options
 * @returns OpenGraph metadata object
 * @example
 *
 * const $ = getCheerioDoc(html);
 * const ogData = extractOpenGraph($, options);
 * // {
 * //   title: "OG Title",
 * //   description: "OG Description",
 * //   image: "https://example.com/image.jpg"
 * // }
 */
function extractOpenGraph(
  $: CheerioAPI,
  options: ScraperOptions,
): OpenGraphMetadata {
  const og: Record<string, string> = {};

  $('meta[property^="og:"]').each((_, elem) => {
    const property = getAttr($(elem), 'property');
    const content = getAttr($(elem), 'content');

    if (property && content) {
      const key = property.replace('og:', '');
      og[key] = content;
    }
  });

  let description = og.description;
  if (description && options.maxDescriptionLength) {
    description = toTruncatedText(description, options.maxDescriptionLength);
  }

  const metadata: OpenGraphMetadata = {
    title: og.title || '',
    description: description || undefined,
    image: options.secureImages && og.image ? toSecureUrl(og.image) : og.image,
    url: og.url,
    type: og.type as OpenGraphMetadata['type'],
    siteName: og['site_name'],
    locale: og.locale,
  };

  return metadata;
}

/**
 * OpenGraph metadata extraction plugin for the metadata scraper.
 *
 * Extracts metadata from og: meta tags including:
 * - Basic meta (title, description, image, url)
 * - Type information (website, article, etc.)
 * - Site metadata (site name, locale)
 *
 * @param html - Raw HTML content to parse
 * @param options - Scraper configuration options
 * @returns Promise resolving to partial metadata object
 */
export const openGraph: Plugin = async (
  html: string,
  options,
): Promise<Partial<Metadata>> => {
  const $ = getCheerioDoc(html);

  return {
    openGraph: extractOpenGraph($, options),
  };
};
