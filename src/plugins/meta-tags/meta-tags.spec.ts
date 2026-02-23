import { describe, expect, it } from 'vitest';
import { createContext } from '../../core/context';
import type { ScraperOptions } from '../../types/options';
import { metaTags } from './meta-tags';

async function run(html: string, options: Partial<ScraperOptions> = {}) {
  const ctx = createContext(html, undefined, options as ScraperOptions);
  return await metaTags(ctx);
}

describe('metaTags plugin', () => {
  const fullHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Test Page</title>
        <meta name="description" content="Page Description">
        <meta name="keywords" content="key1, key2, key3">
        <meta name="author" content="John Doe">
        <link rel="canonical" href="https://example.com/page">
        <link rel="icon" href="http://example.com/favicon.ico">
      </head>
    </html>
  `;

  const minimalHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Minimal Page</title>
      </head>
    </html>
  `;

  it('returns PluginResult with name "meta-tags"', async () => {
    const result = await run(fullHTML);
    expect(result.name).toBe('meta-tags');
  });

  it('extracts all available metadata from complete HTML', async () => {
    const result = await run(fullHTML);

    expect(result.data).toMatchObject({
      title: 'Test Page',
      description: 'Page Description',
      keywords: ['key1', 'key2', 'key3'],
      author: 'John Doe',
      canonicalUrl: 'https://example.com/page',
      favicon: 'http://example.com/favicon.ico',
    });
  });

  it('handles minimal HTML gracefully', async () => {
    const result = await run(minimalHTML);

    expect(result.data).toMatchObject({
      title: 'Minimal Page',
      keywords: [],
    });
  });

  it('returns raw favicon URL without secure conversion', async () => {
    const result = await run(fullHTML);
    expect(result.data.favicon).toBe('http://example.com/favicon.ico');
  });

  it('handles malformed keywords correctly', async () => {
    const malformedHTML = `
      <html>
        <head>
          <meta name="keywords" content="key1,,  ,key2, ,key3,">
        </head>
      </html>
    `;

    const result = await run(malformedHTML);
    expect(result.data.keywords).toEqual(['key1', 'key2', 'key3']);
  });

  it('returns empty strings for missing metadata', async () => {
    const result = await run('<html></html>');

    expect(result.data).toMatchObject({
      title: '',
      description: '',
      author: '',
      keywords: [],
    });
  });
});
