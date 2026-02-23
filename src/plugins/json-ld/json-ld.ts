import type { JsonLdMetadata } from '../../types/metadata';
import type { Plugin, PluginResult } from '../../types/plugin';
import { getText } from '../../utils/dom';

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

export const jsonLd: Plugin = (ctx): PluginResult => {
  const { $ } = ctx;
  const scripts = $('script[type="application/ld+json"]');
  const jsonLdData: JsonLdMetadata[] = [];

  scripts.each((_, elem) => {
    const content = getText($(elem));
    const parsed = safeParseJsonLd(content);
    if (parsed) {
      jsonLdData.push(...parsed);
    }
  });

  return {
    name: 'json-ld',
    data: { jsonLd: jsonLdData },
  };
};
