import { describe, expect, it } from 'vitest';
import { jsonLd } from '../plugins/json-ld/json-ld';
import { metaTags } from '../plugins/meta-tags/meta-tags';
import { openGraph } from '../plugins/open-graph/open-graph';
import { twitter } from '../plugins/twitter/twitter';
import { createScraper, scrape } from './index';

const testHTML = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Test Page</title>
      <meta name="description" content="Test Description">
      <meta name="author" content="Test Author">
      <meta name="keywords" content="test, page">
      <link rel="canonical" href="https://example.com/page">
      <link rel="icon" href="/favicon.ico">
      <meta property="og:title" content="OG Title">
      <meta property="og:description" content="OG Description">
      <meta property="og:image" content="http://example.com/image.jpg">
      <meta property="og:url" content="https://example.com/page">
      <meta property="og:type" content="article">
      <meta property="og:site_name" content="Test Site">
      <meta property="og:locale" content="en_US">
      <meta name="twitter:title" content="Twitter Title">
      <meta name="twitter:description" content="Twitter Description">
      <meta name="twitter:image" content="http://example.com/tw.jpg">
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:site" content="@testsite">
      <meta name="twitter:creator" content="@testuser">
      <script type="application/ld+json">
        {"@context":"https://schema.org","@type":"Article","headline":"Test"}
      </script>
    </head>
  </html>
`;

describe('createScraper', () => {
  it('returns scrape and scrapeUrl methods', () => {
    const s = createScraper({
      plugins: [metaTags, openGraph, twitter, jsonLd],
    });
    expect(typeof s.scrape).toBe('function');
    expect(typeof s.scrapeUrl).toBe('function');
  });

  it('scrapes HTML and returns ScraperResult', async () => {
    const s = createScraper({
      plugins: [metaTags, openGraph, twitter, jsonLd],
    });
    const result = await s.scrape(testHTML, {
      url: 'https://example.com/page',
    });

    expect(result.metadata).toBeDefined();
    expect(result.sources).toBeDefined();

    expect(result.metadata.title).toBe('OG Title');
    expect(result.metadata.description).toBe('OG Description');
    expect(result.metadata.image).toBe('https://example.com/image.jpg');
    expect(result.metadata.url).toBe('https://example.com/page');
    expect(result.metadata.type).toBe('article');
    expect(result.metadata.siteName).toBe('Test Site');
    expect(result.metadata.locale).toBe('en_US');
    expect(result.metadata.twitterCard).toBe('summary_large_image');
    expect(result.metadata.twitterSite).toBe('@testsite');
    expect(result.metadata.twitterCreator).toBe('@testuser');
    expect(result.metadata.author).toBe('Test Author');
    expect(result.metadata.keywords).toEqual(['test', 'page']);
    expect(result.metadata.jsonLd).toHaveLength(1);
  });

  it('provides sources for each plugin', async () => {
    const s = createScraper({
      plugins: [metaTags, openGraph, twitter, jsonLd],
    });
    const result = await s.scrape(testHTML);

    expect(result.sources['meta-tags']).toBeDefined();
    expect(result.sources['open-graph']).toBeDefined();
    expect(result.sources.twitter).toBeDefined();
    expect(result.sources['json-ld']).toBeDefined();

    expect(result.sources['open-graph'].title).toBe('OG Title');
    expect(result.sources['meta-tags'].title).toBe('Test Page');
    expect(result.sources.twitter.title).toBe('Twitter Title');
  });

  it('applies fallbacks (title from siteName)', async () => {
    const html = `
      <html><head>
        <meta property="og:site_name" content="Fallback Site">
      </head></html>
    `;

    const s = createScraper({ plugins: [openGraph] });
    const result = await s.scrape(html);

    expect(result.metadata.title).toBe('Fallback Site');
  });

  it('omits empty values by default', async () => {
    const html = '<html><head></head></html>';
    const s = createScraper({ plugins: [metaTags] });
    const result = await s.scrape(html);

    expect(result.metadata.image).toBeUndefined();
    expect(result.metadata.url).toBeUndefined();
  });

  it('resolves relative image URLs using page URL', async () => {
    const html = `
      <html><head>
        <meta property="og:image" content="/img/photo.jpg">
        <meta property="og:url" content="https://example.com/page">
      </head></html>
    `;

    const s = createScraper({
      plugins: [openGraph],
      postProcess: { secureImages: false },
    });
    const result = await s.scrape(html);

    expect(result.metadata.image).toBe('https://example.com/img/photo.jpg');
  });

  it('applies secureImages postProcess', async () => {
    const html = `
      <html><head>
        <meta property="og:image" content="http://example.com/img.jpg">
      </head></html>
    `;

    const s = createScraper({
      plugins: [openGraph],
      postProcess: { secureImages: true },
    });
    const result = await s.scrape(html);

    expect(result.metadata.image).toBe('https://example.com/img.jpg');
  });

  it('supports custom rules', async () => {
    const s = createScraper({
      plugins: [metaTags, openGraph],
      rules: [
        {
          field: 'title',
          sources: [
            { plugin: 'meta-tags', key: 'title', priority: 2 },
            { plugin: 'open-graph', key: 'title', priority: 1 },
          ],
        },
      ],
    });

    const result = await s.scrape(testHTML);
    expect(result.metadata.title).toBe('Test Page');
  });
});

describe('scrape (one-liner)', () => {
  it('scrapes HTML with default plugins', async () => {
    const result = await scrape(testHTML);

    expect(result.metadata.title).toBe('OG Title');
    expect(result.metadata.author).toBe('Test Author');
    expect(result.sources['open-graph']).toBeDefined();
    expect(result.sources['meta-tags']).toBeDefined();
    expect(result.sources.twitter).toBeDefined();
    expect(result.sources['json-ld']).toBeDefined();
  });
});
