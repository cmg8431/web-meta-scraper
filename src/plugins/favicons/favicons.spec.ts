import { describe, expect, it } from 'vitest';
import { createContext } from '../../core/context';
import type { PluginResult } from '../../types/plugin';
import { favicons } from './favicons';

function run(html: string, url?: string): PluginResult {
  const ctx = createContext(html, url, {});
  return favicons(ctx) as PluginResult;
}

describe('favicons plugin', () => {
  it('extracts link[rel="icon"]', () => {
    const result = run(
      '<html><head><link rel="icon" href="/favicon.ico"></head></html>',
      'https://example.com',
    );
    expect(result.name).toBe('favicons');
    expect(result.data.favicons).toEqual([
      { url: 'https://example.com/favicon.ico' },
    ]);
  });

  it('extracts apple-touch-icon with sizes and type', () => {
    const result = run(
      '<html><head><link rel="apple-touch-icon" href="/apple.png" sizes="180x180" type="image/png"></head></html>',
      'https://example.com',
    );
    expect(result.data.favicons).toEqual([
      {
        url: 'https://example.com/apple.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ]);
  });

  it('deduplicates identical URLs', () => {
    const html = `<html><head>
      <link rel="icon" href="/favicon.ico">
      <link rel="shortcut icon" href="/favicon.ico">
    </head></html>`;
    const result = run(html, 'https://example.com');
    expect(result.data.favicons).toHaveLength(1);
  });

  it('collects multiple distinct icons', () => {
    const html = `<html><head>
      <link rel="icon" href="/favicon.ico">
      <link rel="apple-touch-icon" href="/apple.png" sizes="180x180">
      <link rel="mask-icon" href="/mask.svg">
    </head></html>`;
    const result = run(html, 'https://example.com');
    expect(result.data.favicons).toHaveLength(3);
  });

  it('records manifest link with type manifest', () => {
    const html =
      '<html><head><link rel="manifest" href="/manifest.json"></head></html>';
    const result = run(html, 'https://example.com');
    expect(result.data.favicons).toEqual([
      { url: 'https://example.com/manifest.json', type: 'manifest' },
    ]);
  });

  it('returns empty data when no icons found', () => {
    const result = run('<html><head></head></html>');
    expect(result.data).toEqual({});
  });

  it('handles relative URLs without base', () => {
    const result = run(
      '<html><head><link rel="icon" href="/favicon.ico"></head></html>',
    );
    expect(result.data.favicons).toEqual([{ url: '/favicon.ico' }]);
  });
});
