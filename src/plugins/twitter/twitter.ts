import type { CheerioAPI } from 'cheerio';

import type {
  Metadata,
  Plugin,
  ScraperOptions,
  TwitterMetadata,
} from '@/types';
import { toSecureUrl, toTruncatedText } from '@/utils';
import { getAttr, getCheerioDoc } from '@/utils/dom';

/**
 * Extracts Twitter card metadata from meta tags.
 *
 * @param $ - Cheerio instance for HTML parsing
 * @param options - Scraper configuration options
 * @returns {TwitterMetadata} Processed Twitter card metadata
 */
function extractTwitterMeta(
  $: CheerioAPI,
  options: ScraperOptions,
): TwitterMetadata {
  const twitter: Record<string, string> = {};

  $('meta[name^="twitter:"]').each((_, elem) => {
    const name = getAttr($(elem), 'name');
    const content = getAttr($(elem), 'content');

    if (name && content) {
      const key = name.replace('twitter:', '');
      twitter[key] = content;
    }
  });

  let description = twitter.description;
  if (description && options.maxDescriptionLength) {
    description = toTruncatedText(description, options.maxDescriptionLength);
  }

  return {
    title: twitter.title || '',
    description: description || undefined,
    image:
      options.secureImages && twitter.image
        ? toSecureUrl(twitter.image)
        : twitter.image,
    card: twitter.card as TwitterMetadata['card'],
    site: twitter.site,
    creator: twitter.creator,
  };
}

/**
 * Twitter card metadata extraction plugin.
 *
 * Extracts metadata from Twitter card meta tags including:
 * - Basic meta (title, description, image)
 * - Card type (summary, summary_large_image, etc)
 * - Site and creator information
 *
 * @param html - Raw HTML content to parse
 * @param options - Scraper configuration options
 * @returns Promise resolving to partial metadata object
 */
export const twitter: Plugin = async (
  html: string,
  options,
): Promise<Partial<Metadata>> => {
  const $ = getCheerioDoc(html);

  return {
    twitter: extractTwitterMeta($, options),
  };
};
