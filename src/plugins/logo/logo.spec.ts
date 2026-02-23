import { describe, expect, it } from 'vitest';
import { createContext } from '../../core/context';
import type { PluginResult } from '../../types/plugin';
import { logo } from './logo';

function run(html: string, url?: string): PluginResult {
  const ctx = createContext(html, url, {});
  return logo(ctx) as PluginResult;
}

describe('logo plugin', () => {
  it('returns PluginResult with name "logo"', () => {
    const result = run('<html><head></head></html>');
    expect(result.name).toBe('logo');
  });

  it('extracts og:logo', () => {
    const result = run(
      '<html><head><meta property="og:logo" content="https://example.com/logo.png"></head></html>',
    );
    expect(result.data.logo).toBe('https://example.com/logo.png');
  });

  it('extracts meta[itemprop="logo"]', () => {
    const result = run(
      '<html><head><meta itemprop="logo" content="/logo.svg"></head></html>',
      'https://example.com',
    );
    expect(result.data.logo).toBe('https://example.com/logo.svg');
  });

  it('extracts img[itemprop="logo"]', () => {
    const result = run(
      '<html><body><img itemprop="logo" src="/img/logo.png"></body></html>',
      'https://example.com',
    );
    expect(result.data.logo).toBe('https://example.com/img/logo.png');
  });

  it('extracts logo from JSON-LD Organization with string logo', () => {
    const result = run(`<html><head>
      <script type="application/ld+json">{"@type":"Organization","logo":"https://example.com/org-logo.png"}</script>
    </head></html>`);
    expect(result.data.logo).toBe('https://example.com/org-logo.png');
  });

  it('extracts logo from JSON-LD Organization with ImageObject logo', () => {
    const result = run(`<html><head>
      <script type="application/ld+json">{"@type":"Organization","logo":{"@type":"ImageObject","url":"https://example.com/img-obj-logo.png"}}</script>
    </head></html>`);
    expect(result.data.logo).toBe('https://example.com/img-obj-logo.png');
  });

  it('extracts logo from JSON-LD publisher.logo (string)', () => {
    const result = run(`<html><head>
      <script type="application/ld+json">{"@type":"Article","publisher":{"@type":"Organization","logo":"https://example.com/pub-logo.png"}}</script>
    </head></html>`);
    expect(result.data.logo).toBe('https://example.com/pub-logo.png');
  });

  it('extracts logo from JSON-LD publisher.logo (ImageObject)', () => {
    const result = run(`<html><head>
      <script type="application/ld+json">{"@type":"Article","publisher":{"@type":"Organization","logo":{"@type":"ImageObject","url":"https://example.com/pub-logo-obj.png"}}}</script>
    </head></html>`);
    expect(result.data.logo).toBe('https://example.com/pub-logo-obj.png');
  });

  it('extracts logo from JSON-LD @graph', () => {
    const result = run(`<html><head>
      <script type="application/ld+json">{"@graph":[{"@type":"Organization","logo":"https://example.com/graph-logo.png"}]}</script>
    </head></html>`);
    expect(result.data.logo).toBe('https://example.com/graph-logo.png');
  });

  it('returns empty data when no logo found', () => {
    const result = run('<html><head></head></html>');
    expect(result.data).toEqual({});
  });

  it('prefers og:logo over meta[itemprop="logo"]', () => {
    const result = run(`<html><head>
      <meta property="og:logo" content="https://example.com/og-logo.png">
      <meta itemprop="logo" content="https://example.com/meta-logo.png">
    </head></html>`);
    expect(result.data.logo).toBe('https://example.com/og-logo.png');
  });

  it('prefers meta[itemprop="logo"] over img[itemprop="logo"]', () => {
    const result = run(
      `<html>
      <head><meta itemprop="logo" content="/meta-logo.png"></head>
      <body><img itemprop="logo" src="/img-logo.png"></body>
    </html>`,
      'https://example.com',
    );
    expect(result.data.logo).toBe('https://example.com/meta-logo.png');
  });

  it('resolves relative URLs against base URL', () => {
    const result = run(
      '<html><head><meta property="og:logo" content="/assets/logo.png"></head></html>',
      'https://example.com',
    );
    expect(result.data.logo).toBe('https://example.com/assets/logo.png');
  });

  it('handles relative URLs without base URL', () => {
    const result = run(
      '<html><head><meta property="og:logo" content="/logo.png"></head></html>',
    );
    expect(result.data.logo).toBe('/logo.png');
  });

  it('handles invalid JSON-LD gracefully', () => {
    const result = run(`<html><head>
      <script type="application/ld+json">{not valid}</script>
    </head></html>`);
    expect(result.data).toEqual({});
  });
});
