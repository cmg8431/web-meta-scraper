import { describe, expect, it } from 'vitest';
import { createContext } from '../../core/context';
import type { PluginResult } from '../../types/plugin';
import { tiktok } from './tiktok';

function run(html: string, url?: string): PluginResult {
  const ctx = createContext(html, url, {});
  return tiktok(ctx) as PluginResult;
}

describe('tiktok plugin', () => {
  it('returns PluginResult with name "tiktok"', () => {
    const result = run('<html><head></head></html>');
    expect(result.name).toBe('tiktok');
  });

  it('returns empty data when URL does not match tiktok domain', () => {
    const html = `<html><head>
      <meta property="og:title" content="User on TikTok">
    </head></html>`;
    const result = run(html, 'https://www.example.com/video/123');
    expect(result.data).toEqual({});
  });

  it('sets publisher to TikTok', () => {
    const html = '<html><head></head></html>';
    const result = run(html, 'https://www.tiktok.com/@user/video/7291839183927391234');
    expect(result.data.publisher).toBe('TikTok');
  });

  it('extracts author from "Name on TikTok" og:title format', () => {
    const html = `<html><head>
      <meta property="og:title" content="Funny Creator on TikTok">
    </head></html>`;
    const result = run(html, 'https://www.tiktok.com/@funnycreator/video/123');
    expect(result.data.author).toBe('Funny Creator');
  });

  it('extracts author from "Name | TikTok" og:title format', () => {
    const html = `<html><head>
      <meta property="og:title" content="Cool User (@cooluser) | TikTok">
    </head></html>`;
    const result = run(html, 'https://www.tiktok.com/@cooluser/video/123');
    expect(result.data.author).toBe('Cool User (@cooluser)');
  });

  it('extracts username from og:title parenthetical', () => {
    const html = `<html><head>
      <meta property="og:title" content="Cool User (@cooluser) | TikTok">
    </head></html>`;
    const result = run(html, 'https://www.tiktok.com/@cooluser/video/123');
    expect(result.data.username).toBe('@cooluser');
  });

  it('extracts username from URL path when not in og:title', () => {
    const html = `<html><head>
      <meta property="og:title" content="Some User on TikTok">
    </head></html>`;
    const result = run(html, 'https://www.tiktok.com/@someuser/video/123');
    expect(result.data.username).toBe('@someuser');
  });

  it('constructs title from author and username', () => {
    const html = `<html><head>
      <meta property="og:title" content="Some User on TikTok">
    </head></html>`;
    const result = run(html, 'https://www.tiktok.com/@someuser/video/123');
    expect(result.data.title).toBe('Some User (@someuser) on TikTok');
  });

  it('decodes snowflake timestamp from video ID in URL', () => {
    // ID 7291839183927391234 should decode to a valid date
    // Seconds = floor(7291839183927391234 / 2^32) = floor(7291839183927391234 / 4294967296) ≈ 1697766xxx
    const html = '<html><head></head></html>';
    const result = run(
      html,
      'https://www.tiktok.com/@user/video/7291839183927391234',
    );
    expect(result.data.date).toBeDefined();
    const date = new Date(result.data.date as string);
    expect(date.getFullYear()).toBeGreaterThanOrEqual(2023);
    expect(date.getFullYear()).toBeLessThanOrEqual(2024);
  });

  it('falls back to rehydration data when no video ID in URL', () => {
    const createTime = Math.floor(new Date('2024-01-15T12:00:00Z').getTime() / 1000);
    const rehydrationData = {
      __DEFAULT_SCOPE__: {
        'webapp.video-detail': {
          itemInfo: {
            itemStruct: {
              createTime: String(createTime),
            },
          },
        },
      },
    };
    const html = `<html><head>
      <script id="__UNIVERSAL_DATA_FOR_REHYDRATION__">${JSON.stringify(rehydrationData)}</script>
    </head></html>`;
    const result = run(html, 'https://www.tiktok.com/@user');
    expect(result.data.date).toBeDefined();
    const date = new Date(result.data.date as string);
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(0); // January
  });

  it('handles missing og:title gracefully', () => {
    const html = '<html><head></head></html>';
    const result = run(html, 'https://www.tiktok.com/@user/video/123');
    expect(result.data.publisher).toBe('TikTok');
    expect(result.data.author).toBeUndefined();
  });
});
