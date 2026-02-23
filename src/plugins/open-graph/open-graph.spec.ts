import { describe, expect, it } from 'vitest';
import { createContext } from '../../core/context';
import type { ScraperOptions } from '../../types/options';
import { openGraph } from './open-graph';

async function run(html: string, options: Partial<ScraperOptions> = {}) {
  const ctx = createContext(html, undefined, options as ScraperOptions);
  return await openGraph(ctx);
}

describe('openGraph plugin', () => {
  const fullHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="og:title" content="OG Test Title">
        <meta property="og:description" content="OG Test Description">
        <meta property="og:image" content="http://example.com/image.jpg">
        <meta property="og:url" content="https://example.com/page">
        <meta property="og:type" content="article">
        <meta property="og:site_name" content="Test Site">
        <meta property="og:locale" content="en_US">
      </head>
    </html>
  `;

  it('returns PluginResult with name "open-graph"', async () => {
    const result = await run(fullHTML);
    expect(result.name).toBe('open-graph');
  });

  it('extracts all available OpenGraph metadata', async () => {
    const result = await run(fullHTML);

    expect(result.data).toMatchObject({
      title: 'OG Test Title',
      description: 'OG Test Description',
      image: 'http://example.com/image.jpg',
      url: 'https://example.com/page',
      type: 'article',
      siteName: 'Test Site',
      locale: 'en_US',
    });
  });

  it('handles missing OpenGraph metadata', async () => {
    const html = '<html><head></head></html>';
    const result = await run(html);

    expect(result.data).toMatchObject({});
  });

  it('returns raw description without truncation', async () => {
    const longDescription = 'a'.repeat(200);
    const html = `
      <html>
        <head>
          <meta property="og:description" content="${longDescription}">
        </head>
      </html>
    `;

    const result = await run(html);
    expect(result.data.description).toBe(longDescription);
  });

  it('returns raw image URL without secure conversion', async () => {
    const html = `
      <html>
        <head>
          <meta property="og:image" content="http://example.com/image.jpg">
        </head>
      </html>
    `;

    const result = await run(html);
    expect(result.data.image).toBe('http://example.com/image.jpg');
  });

  it('handles malformed OpenGraph tags gracefully', async () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="">
          <meta property="og:description">
          <meta property="og:invalid" content="test">
        </head>
      </html>
    `;

    const result = await run(html);
    expect(result.data.title).toBe('');
    expect(result.data.description).toBeUndefined();
  });
});
