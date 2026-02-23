import type { CheerioAPI } from 'cheerio';

import type { BaseMetadata, Metadata, Plugin } from '@/types';
import { toSecureUrl } from '@/utils';
import { getAttr, getCheerioDoc, getText } from '@/utils/dom';

/**
 * Extracts and processes HTML metadata from various meta tags.
 *
 * @param $ - Cheerio instance for HTML parsing
 * @param secureImages - Whether to convert image URLs to HTTPS
 * @returns {BaseMetadata} - Object containing processed metadata
 * @example
 *
 * const $ = getCheerioDoc(html);
 * const metadata = extractBaseMeta($, true);
 * // {
 * //   title: "Page Title",
 * //   description: "Page Description",
 * //   keywords: ["tag1", "tag2"]
 * // }
 */
function extractBaseMeta($: CheerioAPI, secureImages: boolean): BaseMetadata {
  const base: BaseMetadata = {
    title: getText($('title')),
    description: getAttr($('meta[name="description"]'), 'content') || '',
    author: getAttr($('meta[name="author"]'), 'content') || '',
    keywords: [],
  };

  const keywordsContent = getAttr($('meta[name="keywords"]'), 'content');
  if (keywordsContent) {
    base.keywords = keywordsContent
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean);
  }

  const canonicalUrl = getAttr($('link[rel="canonical"]'), 'href');
  if (canonicalUrl) {
    base.canonicalUrl = canonicalUrl;
  }

  const favicon = getAttr(
    $('link[rel="icon"], link[rel="shortcut icon"]'),
    'href',
  );
  if (favicon) {
    base.favicon = secureImages ? toSecureUrl(favicon) : favicon;
  }

  return base;
}

/**
 * Meta tags extraction plugin for the metadata scraper.
 *
 * This plugin extracts standard HTML meta tags including:
 * - Title from <title> tag
 * - Description from meta description
 * - Keywords from meta keywords
 * - Canonical URL from link[rel="canonical"]
 * - Author information
 * - Favicon URL (with optional HTTPS conversion)
 *
 * @param html - Raw HTML content to parse
 * @param options - Scraper configuration options
 * @returns Promise resolving to partial metadata object
 */
export const metaTags: Plugin = async (
  html: string,
  options,
): Promise<Partial<Metadata>> => {
  const $ = getCheerioDoc(html);

  return {
    base: extractBaseMeta($, options.secureImages ?? false),
  };
};
