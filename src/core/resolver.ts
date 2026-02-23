import type { PluginResult } from '../types/plugin';

export interface ResolveRule {
  field: string;
  sources: Array<{ plugin: string; key: string; priority: number }>;
}

export const DEFAULT_RULES: ResolveRule[] = [
  {
    field: 'title',
    sources: [
      { plugin: 'open-graph', key: 'title', priority: 3 },
      { plugin: 'meta-tags', key: 'title', priority: 2 },
      { plugin: 'twitter', key: 'title', priority: 1 },
    ],
  },
  {
    field: 'description',
    sources: [
      { plugin: 'open-graph', key: 'description', priority: 3 },
      { plugin: 'meta-tags', key: 'description', priority: 2 },
      { plugin: 'twitter', key: 'description', priority: 1 },
    ],
  },
  {
    field: 'image',
    sources: [
      { plugin: 'open-graph', key: 'image', priority: 2 },
      { plugin: 'twitter', key: 'image', priority: 1 },
    ],
  },
  {
    field: 'url',
    sources: [
      { plugin: 'open-graph', key: 'url', priority: 2 },
      { plugin: 'meta-tags', key: 'canonicalUrl', priority: 1 },
    ],
  },
  {
    field: 'favicon',
    sources: [{ plugin: 'meta-tags', key: 'favicon', priority: 1 }],
  },
  {
    field: 'author',
    sources: [{ plugin: 'meta-tags', key: 'author', priority: 1 }],
  },
  {
    field: 'keywords',
    sources: [{ plugin: 'meta-tags', key: 'keywords', priority: 1 }],
  },
  {
    field: 'type',
    sources: [{ plugin: 'open-graph', key: 'type', priority: 1 }],
  },
  {
    field: 'siteName',
    sources: [{ plugin: 'open-graph', key: 'siteName', priority: 1 }],
  },
  {
    field: 'locale',
    sources: [{ plugin: 'open-graph', key: 'locale', priority: 1 }],
  },
  {
    field: 'twitterCard',
    sources: [{ plugin: 'twitter', key: 'card', priority: 1 }],
  },
  {
    field: 'twitterSite',
    sources: [{ plugin: 'twitter', key: 'site', priority: 1 }],
  },
  {
    field: 'twitterCreator',
    sources: [{ plugin: 'twitter', key: 'creator', priority: 1 }],
  },
  {
    field: 'jsonLd',
    sources: [{ plugin: 'json-ld', key: 'jsonLd', priority: 1 }],
  },
  {
    field: 'oembed',
    sources: [{ plugin: 'oembed', key: 'oembed', priority: 1 }],
  },
  {
    field: 'favicons',
    sources: [{ plugin: 'favicons', key: 'favicons', priority: 1 }],
  },
  {
    field: 'feeds',
    sources: [{ plugin: 'feeds', key: 'feeds', priority: 1 }],
  },
  {
    field: 'robots',
    sources: [{ plugin: 'robots', key: 'robots', priority: 1 }],
  },
  {
    field: 'date',
    sources: [{ plugin: 'date', key: 'date', priority: 1 }],
  },
  {
    field: 'dateModified',
    sources: [{ plugin: 'date', key: 'dateModified', priority: 1 }],
  },
  {
    field: 'logo',
    sources: [{ plugin: 'logo', key: 'logo', priority: 1 }],
  },
  {
    field: 'lang',
    sources: [{ plugin: 'lang', key: 'lang', priority: 1 }],
  },
  {
    field: 'videos',
    sources: [{ plugin: 'video', key: 'videos', priority: 1 }],
  },
  {
    field: 'audio',
    sources: [{ plugin: 'audio', key: 'audio', priority: 1 }],
  },
  {
    field: 'iframe',
    sources: [{ plugin: 'iframe', key: 'iframe', priority: 1 }],
  },
];

export function resolve(
  pluginResults: PluginResult[],
  rules: ResolveRule[],
): Record<string, unknown> {
  const byName = new Map<string, Record<string, unknown>>();
  for (const pr of pluginResults) {
    byName.set(pr.name, pr.data);
  }

  const result: Record<string, unknown> = {};

  for (const rule of rules) {
    let bestValue: unknown;
    let highestPriority = 0;

    for (const source of rule.sources) {
      const data = byName.get(source.plugin);
      if (!data) continue;
      const value = data[source.key];
      if (isEmpty(value)) continue;
      if (source.priority > highestPriority) {
        bestValue = value;
        highestPriority = source.priority;
      }
    }

    if (!isEmpty(bestValue)) {
      result[rule.field] = bestValue;
    }
  }

  return result;
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}
