import { describe, expect, it } from 'vitest';
import { createContext } from '../../core/context';
import type { PluginResult } from '../../types/plugin';
import { lang } from './lang';

function run(html: string, url?: string): PluginResult {
  const ctx = createContext(html, url, {});
  return lang(ctx) as PluginResult;
}

describe('lang plugin', () => {
  it('returns PluginResult with name "lang"', () => {
    const result = run('<html><head></head></html>');
    expect(result.name).toBe('lang');
  });

  it('extracts <html lang="en">', () => {
    const result = run('<html lang="en"><head></head></html>');
    expect(result.data.lang).toBe('en');
  });

  it('normalizes html lang with region (en-US → en)', () => {
    const result = run('<html lang="en-US"><head></head></html>');
    expect(result.data.lang).toBe('en');
  });

  it('normalizes html lang with underscore (zh_CN → zh)', () => {
    const result = run('<html lang="zh_CN"><head></head></html>');
    expect(result.data.lang).toBe('zh');
  });

  it('handles uppercase lang attribute', () => {
    const result = run('<html lang="EN"><head></head></html>');
    expect(result.data.lang).toBe('en');
  });

  it('extracts og:locale and normalizes (ko_KR → ko)', () => {
    const result = run(
      '<html><head><meta property="og:locale" content="ko_KR"></head></html>',
    );
    expect(result.data.lang).toBe('ko');
  });

  it('extracts og:locale with hyphen (ja-JP → ja)', () => {
    const result = run(
      '<html><head><meta property="og:locale" content="ja-JP"></head></html>',
    );
    expect(result.data.lang).toBe('ja');
  });

  it('extracts content-language meta', () => {
    const result = run(
      '<html><head><meta http-equiv="content-language" content="ja"></head></html>',
    );
    expect(result.data.lang).toBe('ja');
  });

  it('extracts content-language with region', () => {
    const result = run(
      '<html><head><meta http-equiv="content-language" content="pt-BR"></head></html>',
    );
    expect(result.data.lang).toBe('pt');
  });

  it('extracts itemprop="inLanguage"', () => {
    const result = run(
      '<html><head><meta itemprop="inLanguage" content="fr"></head></html>',
    );
    expect(result.data.lang).toBe('fr');
  });

  it('extracts inLanguage from JSON-LD', () => {
    const result = run(`<html><head>
      <script type="application/ld+json">{"@type":"Article","inLanguage":"de"}</script>
    </head></html>`);
    expect(result.data.lang).toBe('de');
  });

  it('extracts inLanguage from JSON-LD @graph', () => {
    const result = run(`<html><head>
      <script type="application/ld+json">{"@graph":[{"@type":"WebPage","inLanguage":"es"}]}</script>
    </head></html>`);
    expect(result.data.lang).toBe('es');
  });

  it('returns empty data when no language found', () => {
    const result = run('<html><head></head></html>');
    expect(result.data).toEqual({});
  });

  it('prefers html lang over og:locale', () => {
    const result = run(`<html lang="en"><head>
      <meta property="og:locale" content="ko_KR">
    </head></html>`);
    expect(result.data.lang).toBe('en');
  });

  it('prefers og:locale over content-language', () => {
    const result = run(`<html><head>
      <meta property="og:locale" content="fr_FR">
      <meta http-equiv="content-language" content="de">
    </head></html>`);
    expect(result.data.lang).toBe('fr');
  });

  it('prefers content-language over itemprop', () => {
    const result = run(`<html><head>
      <meta http-equiv="content-language" content="it">
      <meta itemprop="inLanguage" content="es">
    </head></html>`);
    expect(result.data.lang).toBe('it');
  });

  it('handles invalid JSON-LD gracefully', () => {
    const result = run(`<html><head>
      <script type="application/ld+json">{broken}</script>
    </head></html>`);
    expect(result.data).toEqual({});
  });
});
