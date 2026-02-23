import { describe, expect, it } from 'vitest';
import { createContext } from '../../core/context';
import type { PluginResult } from '../../types/plugin';
import { instagram } from './instagram';

function run(html: string, url?: string): PluginResult {
  const ctx = createContext(html, url, {});
  return instagram(ctx) as PluginResult;
}

describe('instagram plugin', () => {
  it('returns PluginResult with name "instagram"', () => {
    const result = run('<html><head></head></html>');
    expect(result.name).toBe('instagram');
  });

  it('returns empty data when URL does not match instagram domain', () => {
    const html = `<html><head>
      <meta property="og:title" content="John on Instagram: photo">
    </head></html>`;
    const result = run(html, 'https://www.example.com/p/ABC123');
    expect(result.data).toEqual({});
  });

  it('sets publisher to Instagram', () => {
    const html = '<html><head></head></html>';
    const result = run(html, 'https://www.instagram.com/p/ABC123');
    expect(result.data.publisher).toBe('Instagram');
  });

  it('extracts author from og:title "Name on Instagram" format', () => {
    const html = `<html><head>
      <meta property="og:title" content="John Smith on Instagram: &quot;Beautiful sunset&quot;">
    </head></html>`;
    const result = run(html, 'https://www.instagram.com/p/ABC123');
    expect(result.data.author).toBe('John Smith');
  });

  it('extracts date from og:description "on Month DD, YYYY" format', () => {
    const html = `<html><head>
      <meta property="og:description" content="42 likes, 3 comments - John on January 15, 2024">
    </head></html>`;
    const result = run(html, 'https://www.instagram.com/p/ABC123');
    expect(result.data.date).toBeDefined();
    const date = new Date(result.data.date as string);
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(0); // January = 0
    expect(date.getDate()).toBe(15);
  });

  it('extracts username from profile URL path', () => {
    const html = '<html><head></head></html>';
    const result = run(html, 'https://www.instagram.com/johndoe');
    expect(result.data.username).toBe('@johndoe');
  });

  it('does not extract username from /p/ post URLs', () => {
    const html = '<html><head></head></html>';
    const result = run(html, 'https://www.instagram.com/p/ABC123');
    expect(result.data.username).toBeUndefined();
  });

  it('does not extract username from /reel/ URLs', () => {
    const html = '<html><head></head></html>';
    const result = run(html, 'https://www.instagram.com/reel/ABC123');
    expect(result.data.username).toBeUndefined();
  });

  it('extracts title from twitter:title meta', () => {
    const html = `<html><head>
      <meta name="twitter:title" content="John Smith (@johndoe) - Instagram photos and videos">
    </head></html>`;
    const result = run(html, 'https://www.instagram.com/johndoe');
    expect(result.data.title).toBe(
      'John Smith (@johndoe) - Instagram photos and videos',
    );
  });

  it('handles description without a date gracefully', () => {
    const html = `<html><head>
      <meta property="og:description" content="42 likes, 3 comments - some caption text">
    </head></html>`;
    const result = run(html, 'https://www.instagram.com/p/ABC123');
    expect(result.data.date).toBeUndefined();
  });
});
