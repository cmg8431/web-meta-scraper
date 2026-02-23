import type { ResolvedMetadata } from '../types/result';
import type { ValidationRule } from './types';

function hasSource(
  sources: Record<string, Record<string, unknown>>,
  plugin: string,
  key: string,
): boolean {
  const data = sources[plugin];
  if (!data) return false;
  const val = data[key];
  if (val === undefined || val === null || val === '') return false;
  if (Array.isArray(val)) return val.length > 0;
  return true;
}

export const validationRules: ValidationRule[] = [
  // Essential
  {
    category: 'essential',
    field: 'title',
    severity: 'error',
    penalty: 15,
    check: (_meta, sources) =>
      !hasSource(sources, 'meta-tags', 'title') ? 'Missing page title' : null,
  },
  {
    category: 'essential',
    field: 'description',
    severity: 'error',
    penalty: 15,
    check: (_meta, sources) =>
      !hasSource(sources, 'meta-tags', 'description')
        ? 'Missing meta description'
        : null,
  },
  {
    category: 'essential',
    field: 'description',
    severity: 'warning',
    penalty: 5,
    check: (_meta, sources) => {
      const desc = sources['meta-tags']?.description;
      if (typeof desc !== 'string' || desc === '') return null;
      if (desc.length < 50)
        return `Meta description is too short (${desc.length} chars, recommended 50-160)`;
      if (desc.length > 160)
        return `Meta description is too long (${desc.length} chars, recommended 50-160)`;
      return null;
    },
  },
  {
    category: 'essential',
    field: 'favicon',
    severity: 'warning',
    penalty: 3,
    check: (_meta, sources) =>
      !hasSource(sources, 'meta-tags', 'favicon') ? 'Missing favicon' : null,
  },
  {
    category: 'essential',
    field: 'canonical',
    severity: 'warning',
    penalty: 5,
    check: (_meta, sources) =>
      !hasSource(sources, 'meta-tags', 'canonicalUrl')
        ? 'Missing canonical URL'
        : null,
  },

  // Open Graph
  {
    category: 'opengraph',
    field: 'og:title',
    severity: 'warning',
    penalty: 8,
    check: (_meta, sources) =>
      !hasSource(sources, 'open-graph', 'title')
        ? 'Missing og:title tag'
        : null,
  },
  {
    category: 'opengraph',
    field: 'og:description',
    severity: 'warning',
    penalty: 8,
    check: (_meta, sources) =>
      !hasSource(sources, 'open-graph', 'description')
        ? 'Missing og:description tag'
        : null,
  },
  {
    category: 'opengraph',
    field: 'og:image',
    severity: 'warning',
    penalty: 8,
    check: (_meta, sources) =>
      !hasSource(sources, 'open-graph', 'image')
        ? 'Missing og:image tag'
        : null,
  },
  {
    category: 'opengraph',
    field: 'og:url',
    severity: 'info',
    penalty: 3,
    check: (_meta, sources) =>
      !hasSource(sources, 'open-graph', 'url') ? 'Missing og:url tag' : null,
  },
  {
    category: 'opengraph',
    field: 'og:type',
    severity: 'info',
    penalty: 2,
    check: (_meta, sources) =>
      !hasSource(sources, 'open-graph', 'type') ? 'Missing og:type tag' : null,
  },

  // Twitter
  {
    category: 'twitter',
    field: 'twitter:card',
    severity: 'warning',
    penalty: 5,
    check: (_meta, sources) =>
      !hasSource(sources, 'twitter', 'card')
        ? 'Missing twitter:card tag'
        : null,
  },
  {
    category: 'twitter',
    field: 'twitter:title',
    severity: 'info',
    penalty: 3,
    check: (_meta, sources) =>
      !hasSource(sources, 'twitter', 'title')
        ? 'Missing twitter:title tag'
        : null,
  },
  {
    category: 'twitter',
    field: 'twitter:description',
    severity: 'info',
    penalty: 3,
    check: (_meta, sources) =>
      !hasSource(sources, 'twitter', 'description')
        ? 'Missing twitter:description tag'
        : null,
  },

  // Structured Data
  {
    category: 'structured-data',
    field: 'json-ld',
    severity: 'warning',
    penalty: 7,
    check: (_meta, sources) =>
      !hasSource(sources, 'json-ld', 'jsonLd')
        ? 'Missing JSON-LD structured data'
        : null,
  },

  // Security
  {
    category: 'security',
    field: 'image',
    severity: 'warning',
    penalty: 5,
    check: (meta: ResolvedMetadata) =>
      typeof meta.image === 'string' && meta.image.startsWith('http://')
        ? 'Image URL uses insecure HTTP protocol'
        : null,
  },
];
