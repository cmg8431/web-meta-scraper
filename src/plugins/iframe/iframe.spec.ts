import { describe, expect, it } from 'vitest';
import { createContext } from '../../core/context';
import type { PluginResult } from '../../types/plugin';
import { iframe } from './iframe';

function run(html: string, url?: string): PluginResult {
  const ctx = createContext(html, url, {});
  return iframe(ctx) as PluginResult;
}

describe('iframe plugin', () => {
  it('returns PluginResult with name "iframe"', () => {
    const result = run('<html><head></head></html>');
    expect(result.name).toBe('iframe');
  });

  it('generates iframe from twitter:player with width and height', () => {
    const result = run(`<html><head>
      <meta name="twitter:player" content="https://example.com/embed">
      <meta name="twitter:player:width" content="640">
      <meta name="twitter:player:height" content="480">
    </head></html>`);
    expect(result.data.iframe).toBe(
      '<iframe src="https://example.com/embed" width="640" height="480" frameborder="0" allowfullscreen></iframe>',
    );
  });

  it('uses default 640x360 dimensions when width/height missing', () => {
    const result = run(`<html><head>
      <meta name="twitter:player" content="https://example.com/embed">
    </head></html>`);
    expect(result.data.iframe).toContain('width="640"');
    expect(result.data.iframe).toContain('height="360"');
  });

  it('uses default height when only width provided', () => {
    const result = run(`<html><head>
      <meta name="twitter:player" content="https://example.com/embed">
      <meta name="twitter:player:width" content="800">
    </head></html>`);
    expect(result.data.iframe).toContain('width="800"');
    expect(result.data.iframe).toContain('height="360"');
  });

  it('uses default width when only height provided', () => {
    const result = run(`<html><head>
      <meta name="twitter:player" content="https://example.com/embed">
      <meta name="twitter:player:height" content="500">
    </head></html>`);
    expect(result.data.iframe).toContain('width="640"');
    expect(result.data.iframe).toContain('height="500"');
  });

  it('escapes ampersands in URLs', () => {
    const result = run(`<html><head>
      <meta name="twitter:player" content="https://example.com/embed?a=1&b=2">
    </head></html>`);
    expect(result.data.iframe).toContain('a=1&amp;b=2');
  });

  it('escapes double quotes in URLs to prevent XSS', () => {
    const result = run(`<html><head>
      <meta name="twitter:player" content='https://example.com/embed"onload="alert(1)'>
    </head></html>`);
    const html = result.data.iframe as string;
    expect(html).not.toContain('"onload=');
    expect(html).toContain('&quot;');
  });

  it('escapes < and > in URLs', () => {
    const result = run(`<html><head>
      <meta name="twitter:player" content="https://example.com/embed<script>">
    </head></html>`);
    const html = result.data.iframe as string;
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('includes frameborder and allowfullscreen attributes', () => {
    const result = run(`<html><head>
      <meta name="twitter:player" content="https://example.com/embed">
    </head></html>`);
    expect(result.data.iframe).toContain('frameborder="0"');
    expect(result.data.iframe).toContain('allowfullscreen');
  });

  it('returns empty data when no twitter:player found', () => {
    const result = run('<html><head></head></html>');
    expect(result.data).toEqual({});
  });

  it('returns empty data when twitter:player content is empty', () => {
    const result = run(`<html><head>
      <meta name="twitter:player" content="">
    </head></html>`);
    expect(result.data).toEqual({});
  });

  it('handles URL with query parameters', () => {
    const result = run(`<html><head>
      <meta name="twitter:player" content="https://example.com/embed?v=abc123&autoplay=1">
      <meta name="twitter:player:width" content="560">
      <meta name="twitter:player:height" content="315">
    </head></html>`);
    expect(result.data.iframe).toContain(
      'src="https://example.com/embed?v=abc123&amp;autoplay=1"',
    );
    expect(result.data.iframe).toContain('width="560"');
    expect(result.data.iframe).toContain('height="315"');
  });
});
