import { describe, expect, it } from 'vitest';
import { createContext } from '../../core/context';
import type { PluginResult } from '../../types/plugin';
import { x } from './x';

function run(html: string, url?: string): PluginResult {
  const ctx = createContext(html, url, {});
  return x(ctx) as PluginResult;
}

describe('x plugin', () => {
  it('returns PluginResult with name "x"', () => {
    const result = run('<html><head></head></html>');
    expect(result.name).toBe('x');
  });

  it('returns empty data when URL does not match x or twitter domain', () => {
    const html = `<html><head>
      <meta property="og:title" content="Some Post on X:">
    </head></html>`;
    const result = run(html, 'https://www.example.com/post/123');
    expect(result.data).toEqual({});
  });

  it('sets publisher to X', () => {
    const html = '<html><head></head></html>';
    const result = run(html, 'https://x.com/elonmusk/status/123456');
    expect(result.data.publisher).toBe('X');
  });

  it('matches twitter.com domain', () => {
    const html = '<html><head></head></html>';
    const result = run(html, 'https://twitter.com/elonmusk/status/123456');
    expect(result.data.publisher).toBe('X');
  });

  it('extracts author from "Name on X:" og:title format', () => {
    const html = `<html><head>
      <meta property="og:title" content="Elon Musk on X: &quot;Hello world&quot;">
    </head></html>`;
    const result = run(html, 'https://x.com/elonmusk/status/123456');
    expect(result.data.author).toBe('Elon Musk');
  });

  it('extracts author from "Name / X" og:title format', () => {
    const html = `<html><head>
      <meta property="og:title" content="Elon Musk (@elonmusk) / X">
    </head></html>`;
    const result = run(html, 'https://x.com/elonmusk');
    expect(result.data.author).toBe('Elon Musk (@elonmusk)');
  });

  it('extracts username from URL path', () => {
    const html = '<html><head></head></html>';
    const result = run(html, 'https://x.com/elonmusk/status/123456');
    expect(result.data.username).toBe('@elonmusk');
  });

  it('extracts date from time[datetime] element', () => {
    const html = `<html><body>
      <time datetime="2024-03-15T14:30:00.000Z">Mar 15, 2024</time>
    </body></html>`;
    const result = run(html, 'https://x.com/user/status/123456');
    expect(result.data.date).toBe('2024-03-15T14:30:00.000Z');
  });

  it('upgrades 200x200 profile image to 400x400', () => {
    const html = `<html><head>
      <meta property="og:image" content="https://pbs.twimg.com/profile_images/123/photo_200x200.jpg">
    </head></html>`;
    const result = run(html, 'https://x.com/user/status/123456');
    expect(result.data.image).toBe(
      'https://pbs.twimg.com/profile_images/123/photo_400x400.jpg',
    );
  });

  it('leaves non-200x200 images unchanged', () => {
    const html = `<html><head>
      <meta property="og:image" content="https://pbs.twimg.com/media/abc123.jpg">
    </head></html>`;
    const result = run(html, 'https://x.com/user/status/123456');
    expect(result.data.image).toBe(
      'https://pbs.twimg.com/media/abc123.jpg',
    );
  });

  it('builds title from author and username', () => {
    const html = `<html><head>
      <meta property="og:title" content="Jane Doe on X: &quot;Test post&quot;">
    </head></html>`;
    const result = run(html, 'https://x.com/janedoe/status/123456');
    expect(result.data.title).toBe('Jane Doe @janedoe on X');
  });
});
