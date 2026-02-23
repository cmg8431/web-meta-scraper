import { describe, expect, it } from 'vitest';
import { createContext } from '../../core/context';
import type { PluginResult } from '../../types/plugin';
import type { RobotsInfo } from '../../types/result';
import { robots } from './robots';

function run(html: string): PluginResult {
  const ctx = createContext(html, undefined, {});
  return robots(ctx) as PluginResult;
}

describe('robots plugin', () => {
  it('detects indexable page (no robots meta)', () => {
    const result = run('<html><head></head></html>');
    expect(result.name).toBe('robots');
    expect(result.data).toEqual({});
  });

  it('parses noindex directive', () => {
    const html =
      '<html><head><meta name="robots" content="noindex"></head></html>';
    const result = run(html);
    const info = result.data.robots as RobotsInfo;
    expect(info.isIndexable).toBe(false);
    expect(info.isFollowable).toBe(true);
  });

  it('parses nofollow directive', () => {
    const html =
      '<html><head><meta name="robots" content="nofollow"></head></html>';
    const result = run(html);
    const info = result.data.robots as RobotsInfo;
    expect(info.isIndexable).toBe(true);
    expect(info.isFollowable).toBe(false);
  });

  it('parses none directive (noindex + nofollow)', () => {
    const html =
      '<html><head><meta name="robots" content="none"></head></html>';
    const result = run(html);
    const info = result.data.robots as RobotsInfo;
    expect(info.isIndexable).toBe(false);
    expect(info.isFollowable).toBe(false);
    expect(info.noarchive).toBe(true);
  });

  it('parses multiple directives', () => {
    const html =
      '<html><head><meta name="robots" content="noindex, noarchive, nosnippet"></head></html>';
    const result = run(html);
    const info = result.data.robots as RobotsInfo;
    expect(info.isIndexable).toBe(false);
    expect(info.noarchive).toBe(true);
    expect(info.nosnippet).toBe(true);
    expect(info.noimageindex).toBe(false);
    expect(info.notranslate).toBe(false);
  });

  it('detects bot-specific directives', () => {
    const html = `<html><head>
      <meta name="robots" content="index, follow">
      <meta name="googlebot" content="nosnippet">
    </head></html>`;
    const result = run(html);
    const info = result.data.robots as RobotsInfo;
    expect(info.directives).toHaveLength(2);
    expect(info.directives[1].botName).toBe('googlebot');
    expect(info.directives[1].content).toBe('nosnippet');
    // generic robots says index,follow so page is indexable
    expect(info.isIndexable).toBe(true);
    expect(info.isFollowable).toBe(true);
  });

  it('handles noimageindex and notranslate', () => {
    const html =
      '<html><head><meta name="robots" content="noimageindex, notranslate"></head></html>';
    const result = run(html);
    const info = result.data.robots as RobotsInfo;
    expect(info.noimageindex).toBe(true);
    expect(info.notranslate).toBe(true);
    expect(info.isIndexable).toBe(true);
  });
});
