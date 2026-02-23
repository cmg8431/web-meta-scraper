import type { JsonLdMetadata } from '@/types';
import { getCheerioDoc, getText } from '@/utils';

/**
 * Processes JSON-LD data and handles @graph notation if present
 *
 * @param {unknown} data - The parsed JSON-LD content
 * @returns {JsonLdMetadata[]} Array of JSON-LD objects
 */
function processJsonLdData(data: unknown): JsonLdMetadata[] {
  if (!data || typeof data !== 'object') {
    return [];
  }

  const jsonLdObject = data as Record<string, unknown>;

  if (jsonLdObject['@graph'] && Array.isArray(jsonLdObject['@graph'])) {
    return jsonLdObject['@graph'] as JsonLdMetadata[];
  }

  return [jsonLdObject as JsonLdMetadata];
}

/**
 * Creates a safer version of JSON.parse with error handling specific to JSON-LD.
 *
 * @param {string} content - The JSON string to parse
 * @returns {JsonLdMetadata[] | null} Array of parsed JSON-LD objects or null if parsing fails
 */
function safeParseJsonLd(content: string): JsonLdMetadata[] | null {
  try {
    if (!content.trim()) {
      return null;
    }

    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : processJsonLdData(parsed);
  } catch {
    return null;
  }
}

/**
 * A plugin that extracts JSON-LD structured data from HTML.
 *
 * Searches for script tags with type "application/ld+json" and parses their content.
 * Handles both single objects and arrays of JSON-LD data.
 * Invalid JSON in script tags is silently skipped.
 *
 * @param {string} html - The HTML content to search for JSON-LD data
 * @param {ScraperOptions} _options - Scraper options (unused)
 * @returns {Promise<Partial<Metadata>>} Object containing array of parsed JSON-LD data
 */
export function jsonLd(html: string): Promise<{ jsonLd: JsonLdMetadata[] }> {
  const $ = getCheerioDoc(html);
  const scripts = $('script[type="application/ld+json"]');
  const jsonLdData: JsonLdMetadata[] = [];

  scripts.each((_, elem) => {
    const content = getText($(elem));
    const parsed = safeParseJsonLd(content);

    if (parsed) {
      jsonLdData.push(...parsed);
    }
  });

  return Promise.resolve({
    jsonLd: jsonLdData,
  });
}
