import { describe, expect, it } from 'vitest';
import { createContext } from '../../core/context';
import type { PluginResult } from '../../types/plugin';
import { amazon } from './amazon';

function run(html: string, url?: string): PluginResult {
  const ctx = createContext(html, url, {});
  return amazon(ctx) as PluginResult;
}

describe('amazon plugin', () => {
  it('returns PluginResult with name "amazon"', () => {
    const result = run('<html><head></head></html>');
    expect(result.name).toBe('amazon');
  });

  it('returns empty data when URL does not match amazon domain', () => {
    const html = `<html><body>
      <span id="productTitle">Some Product</span>
    </body></html>`;
    const result = run(html, 'https://www.example.com/product/123');
    expect(result.data).toEqual({});
  });

  it('sets publisher to Amazon', () => {
    const html = '<html><head></head></html>';
    const result = run(html, 'https://www.amazon.com/dp/B08N5WRWNW');
    expect(result.data.publisher).toBe('Amazon');
  });

  it('extracts title from #productTitle', () => {
    const html = `<html><body>
      <span id="productTitle">  Sony WH-1000XM5 Wireless Headphones  </span>
    </body></html>`;
    const result = run(html, 'https://www.amazon.com/dp/B09XS7JWHH');
    expect(result.data.title).toBe('Sony WH-1000XM5 Wireless Headphones');
  });

  it('extracts title from #btAsinTitle as fallback', () => {
    const html = `<html><body>
      <span id="btAsinTitle">Kindle Paperwhite</span>
    </body></html>`;
    const result = run(html, 'https://www.amazon.com/dp/B08KTZ8249');
    expect(result.data.title).toBe('Kindle Paperwhite');
  });

  it('extracts image from .a-dynamic-image data-old-hires', () => {
    const html = `<html><body>
      <img class="a-dynamic-image" data-old-hires="https://m.media-amazon.com/images/I/71o8Q5XJS5L._AC_SL1500_.jpg" src="https://m.media-amazon.com/images/I/71o8Q5XJS5L._AC_SL200_.jpg">
    </body></html>`;
    const result = run(html, 'https://www.amazon.com/dp/B09XS7JWHH');
    expect(result.data.image).toBe(
      'https://m.media-amazon.com/images/I/71o8Q5XJS5L._AC_SL1500_.jpg',
    );
  });

  it('extracts image from src when data-old-hires is missing', () => {
    const html = `<html><body>
      <img id="landingImage" src="https://m.media-amazon.com/images/I/71o8Q5XJS5L._AC_SL200_.jpg">
    </body></html>`;
    const result = run(html, 'https://www.amazon.com/dp/B09XS7JWHH');
    expect(result.data.image).toBe(
      'https://m.media-amazon.com/images/I/71o8Q5XJS5L._AC_SL200_.jpg',
    );
  });

  it('cleans up author from "Visit the X Store"', () => {
    const html = `<html><body>
      <a id="bylineInfo">Visit the Sony Store</a>
    </body></html>`;
    const result = run(html, 'https://www.amazon.com/dp/B09XS7JWHH');
    expect(result.data.author).toBe('Sony');
  });

  it('cleans up author from "Brand: X"', () => {
    const html = `<html><body>
      <a id="bylineInfo">Brand: Anker</a>
    </body></html>`;
    const result = run(html, 'https://www.amazon.com/dp/B09XS7JWHH');
    expect(result.data.author).toBe('Anker');
  });

  it('detects language "en" from amazon.com domain', () => {
    const html = '<html><head></head></html>';
    const result = run(html, 'https://www.amazon.com/dp/B09XS7JWHH');
    expect(result.data.lang).toBe('en');
  });

  it('detects language "ja" from amazon.co.jp domain', () => {
    const html = '<html><head></head></html>';
    const result = run(html, 'https://www.amazon.co.jp/dp/B09XS7JWHH');
    expect(result.data.lang).toBe('ja');
  });

  it('detects language "de" from amazon.de domain', () => {
    const html = '<html><head></head></html>';
    const result = run(html, 'https://www.amazon.de/dp/B09XS7JWHH');
    expect(result.data.lang).toBe('de');
  });

  it('extracts price from .a-price .a-offscreen', () => {
    const html = `<html><body>
      <span class="a-price"><span class="a-offscreen">$349.99</span></span>
    </body></html>`;
    const result = run(html, 'https://www.amazon.com/dp/B09XS7JWHH');
    expect(result.data.price).toBe('$349.99');
  });
});
