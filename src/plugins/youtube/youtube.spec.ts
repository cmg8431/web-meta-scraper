import { describe, expect, it } from 'vitest';
import { createContext } from '../../core/context';
import type { PluginResult } from '../../types/plugin';
import { youtube } from './youtube';

function run(html: string, url?: string): PluginResult {
  const ctx = createContext(html, url, {});
  return youtube(ctx) as PluginResult;
}

describe('youtube plugin', () => {
  it('returns PluginResult with name "youtube"', () => {
    const result = run('<html><head></head></html>');
    expect(result.name).toBe('youtube');
  });

  it('returns empty data when URL does not match youtube domain', () => {
    const html = `<html><head>
      <meta property="og:title" content="Some Video - YouTube">
    </head></html>`;
    const result = run(html, 'https://www.example.com/watch?v=dQw4w9WgXcQ');
    expect(result.data).toEqual({});
  });

  it('returns empty data when no URL is provided', () => {
    const html = `<html><head>
      <meta property="og:title" content="Some Video - YouTube">
    </head></html>`;
    const result = run(html);
    expect(result.data).toEqual({});
  });

  it('sets publisher to YouTube', () => {
    const html = '<html><head></head></html>';
    const result = run(html, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result.data.publisher).toBe('YouTube');
  });

  it('strips " - YouTube" suffix from og:title', () => {
    const html = `<html><head>
      <meta property="og:title" content="Never Gonna Give You Up - YouTube">
    </head></html>`;
    const result = run(html, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result.data.title).toBe('Never Gonna Give You Up');
  });

  it('strips " - YouTube" suffix from <title> as fallback', () => {
    const html = `<html><head>
      <title>My Cool Video - YouTube</title>
    </head></html>`;
    const result = run(html, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result.data.title).toBe('My Cool Video');
  });

  it('extracts video ID from standard watch URL', () => {
    const html = '<html><head></head></html>';
    const result = run(html, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result.data.videoId).toBe('dQw4w9WgXcQ');
  });

  it('extracts video ID from youtu.be short URL', () => {
    const html = '<html><head></head></html>';
    const result = run(html, 'https://youtu.be/dQw4w9WgXcQ');
    expect(result.data.videoId).toBe('dQw4w9WgXcQ');
  });

  it('extracts video ID from shorts URL', () => {
    const html = '<html><head></head></html>';
    const result = run(html, 'https://www.youtube.com/shorts/dQw4w9WgXcQ');
    expect(result.data.videoId).toBe('dQw4w9WgXcQ');
  });

  it('generates thumbnails array with all resolutions', () => {
    const html = '<html><head></head></html>';
    const result = run(html, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    const thumbnails = result.data.thumbnails as {
      url: string;
      resolution: string;
    }[];
    expect(thumbnails).toHaveLength(5);
    expect(thumbnails[0]).toEqual({
      url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      resolution: 'maxresdefault',
    });
    expect(thumbnails[4]).toEqual({
      url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg',
      resolution: 'default',
    });
  });

  it('sets primary image to maxresdefault thumbnail', () => {
    const html = '<html><head></head></html>';
    const result = run(html, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result.data.image).toBe(
      'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    );
  });

  it('extracts author from itemprop="name" link', () => {
    const html = `<html><head>
      <link itemprop="name" content="Rick Astley">
    </head></html>`;
    const result = run(html, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result.data.author).toBe('Rick Astley');
  });
});
