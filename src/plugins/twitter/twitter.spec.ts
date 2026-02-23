import { describe, expect, it } from 'vitest';
import { createContext } from '../../core/context';
import type { ScraperOptions } from '../../types/options';
import { twitter } from './twitter';

async function run(html: string, options: Partial<ScraperOptions> = {}) {
  const ctx = createContext(html, undefined, options as ScraperOptions);
  return await twitter(ctx);
}

describe('twitter plugin', () => {
  const fullHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="twitter:title" content="Twitter Test Title">
        <meta name="twitter:description" content="Twitter Test Description">
        <meta name="twitter:image" content="http://example.com/image.jpg">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:site" content="@testsite">
        <meta name="twitter:creator" content="@testuser">
      </head>
    </html>
  `;

  it('returns PluginResult with name "twitter"', async () => {
    const result = await run(fullHTML);
    expect(result.name).toBe('twitter');
  });

  it('extracts all available Twitter card metadata', async () => {
    const result = await run(fullHTML);

    expect(result.data).toMatchObject({
      title: 'Twitter Test Title',
      description: 'Twitter Test Description',
      image: 'http://example.com/image.jpg',
      card: 'summary_large_image',
      site: '@testsite',
      creator: '@testuser',
    });
  });

  it('handles missing Twitter metadata', async () => {
    const html = '<html><head></head></html>';
    const result = await run(html);

    expect(result.data).toMatchObject({
      title: '',
    });
  });

  it('returns raw description without truncation', async () => {
    const longDescription = 'a'.repeat(200);
    const html = `
      <html>
        <head>
          <meta name="twitter:description" content="${longDescription}">
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
          <meta name="twitter:image" content="http://example.com/image.jpg">
        </head>
      </html>
    `;

    const result = await run(html);
    expect(result.data.image).toBe('http://example.com/image.jpg');
  });

  it('handles malformed Twitter tags gracefully', async () => {
    const html = `
      <html>
        <head>
          <meta name="twitter:title" content="">
          <meta name="twitter:description">
          <meta name="twitter:invalid" content="test">
        </head>
      </html>
    `;

    const result = await run(html);
    expect(result.data.title).toBe('');
    expect(result.data.description).toBeUndefined();
  });
});
