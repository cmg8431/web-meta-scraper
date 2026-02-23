import { describe, expect, it } from 'vitest';
import type { ScraperResult } from '../types/result';
import { validateMetadata } from './index';

function makeResult(
  overrides: Partial<ScraperResult['metadata']> = {},
  sources: ScraperResult['sources'] = {},
): ScraperResult {
  return {
    metadata: { ...overrides },
    sources,
  };
}

describe('validateMetadata', () => {
  it('returns perfect score for fully populated metadata', () => {
    const result = makeResult(
      {
        title: 'Test Page',
        description:
          'A valid description that is long enough to pass the check',
        favicon: 'https://example.com/favicon.ico',
        image: 'https://example.com/image.jpg',
      },
      {
        'meta-tags': {
          title: 'Test Page',
          description:
            'A valid description that is long enough to pass the check',
          favicon: 'https://example.com/favicon.ico',
          canonicalUrl: 'https://example.com/page',
        },
        'open-graph': {
          title: 'Test Page',
          description: 'OG Description',
          image: 'https://example.com/image.jpg',
          url: 'https://example.com/page',
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: 'Test Page',
          description: 'Twitter description',
        },
        'json-ld': {
          jsonLd: [{ '@context': 'https://schema.org', '@type': 'WebSite' }],
        },
      },
    );

    const validation = validateMetadata(result);
    expect(validation.score).toBe(100);
    expect(validation.issues).toHaveLength(0);
    expect(validation.summary).toEqual({ errors: 0, warnings: 0, info: 0 });
  });

  it('returns 0 issues count in summary when no problems', () => {
    const result = makeResult(
      { image: 'https://example.com/img.png' },
      {
        'meta-tags': {
          title: 'Title',
          description:
            'Description that is long enough for the minimum character count requirement',
          favicon: '/favicon.ico',
          canonicalUrl: 'https://example.com',
        },
        'open-graph': {
          title: 'T',
          description: 'D',
          image: 'https://img.png',
          url: 'https://example.com',
          type: 'website',
        },
        twitter: { card: 'summary', title: 'T', description: 'D' },
        'json-ld': { jsonLd: [{}] },
      },
    );

    const v = validateMetadata(result);
    expect(v.summary.errors).toBe(0);
    expect(v.summary.warnings).toBe(0);
    expect(v.summary.info).toBe(0);
  });

  it('detects missing title as error with -15 penalty', () => {
    const result = makeResult(
      {},
      {
        'meta-tags': {
          title: '',
          description: 'Some valid description that is long enough',
        },
      },
    );
    const v = validateMetadata(result);
    const titleIssue = v.issues.find(
      (i) => i.field === 'title' && i.severity === 'error',
    );
    expect(titleIssue).toBeDefined();
    expect(titleIssue!.category).toBe('essential');
  });

  it('detects missing description as error', () => {
    const result = makeResult({}, { 'meta-tags': { title: 'Title' } });
    const v = validateMetadata(result);
    const descIssue = v.issues.find(
      (i) => i.field === 'description' && i.severity === 'error',
    );
    expect(descIssue).toBeDefined();
  });

  it('warns when description is too short', () => {
    const result = makeResult(
      {},
      { 'meta-tags': { title: 'Title', description: 'Short' } },
    );
    const v = validateMetadata(result);
    const issue = v.issues.find(
      (i) => i.field === 'description' && i.severity === 'warning',
    );
    expect(issue).toBeDefined();
    expect(issue!.message).toContain('too short');
  });

  it('warns when description is too long', () => {
    const result = makeResult(
      {},
      { 'meta-tags': { title: 'Title', description: 'A'.repeat(200) } },
    );
    const v = validateMetadata(result);
    const issue = v.issues.find(
      (i) => i.field === 'description' && i.severity === 'warning',
    );
    expect(issue).toBeDefined();
    expect(issue!.message).toContain('too long');
  });

  it('detects missing Open Graph tags', () => {
    const result = makeResult({}, { 'meta-tags': { title: 'T' } });
    const v = validateMetadata(result);
    const ogIssues = v.issues.filter((i) => i.category === 'opengraph');
    expect(ogIssues.length).toBeGreaterThanOrEqual(3);
  });

  it('detects missing twitter:card', () => {
    const result = makeResult({}, {});
    const v = validateMetadata(result);
    const twitterCardIssue = v.issues.find((i) => i.field === 'twitter:card');
    expect(twitterCardIssue).toBeDefined();
    expect(twitterCardIssue!.severity).toBe('warning');
  });

  it('detects missing JSON-LD', () => {
    const result = makeResult({}, {});
    const v = validateMetadata(result);
    const jsonLdIssue = v.issues.find((i) => i.field === 'json-ld');
    expect(jsonLdIssue).toBeDefined();
    expect(jsonLdIssue!.category).toBe('structured-data');
  });

  it('detects insecure image URL', () => {
    const result = makeResult({ image: 'http://example.com/img.jpg' }, {});
    const v = validateMetadata(result);
    const secIssue = v.issues.find((i) => i.category === 'security');
    expect(secIssue).toBeDefined();
    expect(secIssue!.message).toContain('insecure HTTP');
  });

  it('score never goes below 0', () => {
    const result = makeResult({}, {});
    const v = validateMetadata(result);
    expect(v.score).toBeGreaterThanOrEqual(0);
  });

  it('includes metadata in result', () => {
    const result = makeResult({ title: 'Hello' }, {});
    const v = validateMetadata(result);
    expect(v.metadata.title).toBe('Hello');
  });
});
