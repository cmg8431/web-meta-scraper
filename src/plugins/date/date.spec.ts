import { describe, expect, it } from 'vitest';
import { createContext } from '../../core/context';
import type { PluginResult } from '../../types/plugin';
import { date } from './date';

function run(html: string, url?: string): PluginResult {
  const ctx = createContext(html, url, {});
  return date(ctx) as PluginResult;
}

describe('date plugin', () => {
  it('returns PluginResult with name "date"', () => {
    const result = run('<html><head></head></html>');
    expect(result.name).toBe('date');
  });

  it('extracts article:published_time', () => {
    const result = run(`<html><head>
      <meta property="article:published_time" content="2024-01-15T10:00:00Z">
    </head></html>`);
    expect(result.data.date).toBe('2024-01-15T10:00:00.000Z');
  });

  it('extracts article:modified_time', () => {
    const result = run(`<html><head>
      <meta property="article:modified_time" content="2024-01-16T12:00:00Z">
    </head></html>`);
    expect(result.data.dateModified).toBe('2024-01-16T12:00:00.000Z');
  });

  it('extracts both published and modified times together', () => {
    const result = run(`<html><head>
      <meta property="article:published_time" content="2024-01-15T10:00:00Z">
      <meta property="article:modified_time" content="2024-01-16T12:00:00Z">
    </head></html>`);
    expect(result.data.date).toBe('2024-01-15T10:00:00.000Z');
    expect(result.data.dateModified).toBe('2024-01-16T12:00:00.000Z');
  });

  it('extracts meta[name="date"]', () => {
    const result = run(
      '<html><head><meta name="date" content="2024-03-01"></head></html>',
    );
    expect(result.data.date).toBeDefined();
  });

  it('extracts DC.date', () => {
    const result = run(
      '<html><head><meta name="DC.date" content="2024-05-10"></head></html>',
    );
    expect(result.data.date).toBeDefined();
  });

  it('extracts DC.date.issued', () => {
    const result = run(
      '<html><head><meta name="DC.date.issued" content="2024-06-15"></head></html>',
    );
    expect(result.data.date).toBeDefined();
  });

  it('extracts DC.date.created', () => {
    const result = run(
      '<html><head><meta name="DC.date.created" content="2024-07-20"></head></html>',
    );
    expect(result.data.date).toBeDefined();
  });

  it('extracts DC.date.modified', () => {
    const result = run(
      '<html><head><meta name="DC.date.modified" content="2024-08-25"></head></html>',
    );
    expect(result.data.dateModified).toBeDefined();
  });

  it('extracts datePublished from JSON-LD', () => {
    const result = run(`<html><head>
      <script type="application/ld+json">{"@type":"Article","datePublished":"2024-02-20T08:00:00Z"}</script>
    </head></html>`);
    expect(result.data.date).toBe('2024-02-20T08:00:00.000Z');
  });

  it('extracts dateModified from JSON-LD', () => {
    const result = run(`<html><head>
      <script type="application/ld+json">{"@type":"Article","dateModified":"2024-02-21T09:00:00Z"}</script>
    </head></html>`);
    expect(result.data.dateModified).toBe('2024-02-21T09:00:00.000Z');
  });

  it('extracts dates from JSON-LD @graph', () => {
    const result = run(`<html><head>
      <script type="application/ld+json">{"@graph":[{"@type":"Article","datePublished":"2024-03-01","dateModified":"2024-03-02"}]}</script>
    </head></html>`);
    expect(result.data.date).toBeDefined();
    expect(result.data.dateModified).toBeDefined();
  });

  it('extracts <time datetime> as fallback', () => {
    const result = run(
      '<html><body><time datetime="2024-04-10T14:00:00Z">April 10</time></body></html>',
    );
    expect(result.data.date).toBe('2024-04-10T14:00:00.000Z');
  });

  it('returns empty data when no dates found', () => {
    const result = run('<html><head></head></html>');
    expect(result.data).toEqual({});
  });

  it('ignores invalid date strings', () => {
    const result = run(
      '<html><head><meta name="date" content="not-a-date"></head></html>',
    );
    expect(result.data.date).toBeUndefined();
  });

  it('ignores empty date content', () => {
    const result = run(
      '<html><head><meta name="date" content=""></head></html>',
    );
    expect(result.data.date).toBeUndefined();
  });

  it('prefers article:published_time over meta[name="date"]', () => {
    const result = run(`<html><head>
      <meta property="article:published_time" content="2024-01-15T10:00:00Z">
      <meta name="date" content="2023-12-01">
    </head></html>`);
    expect(result.data.date).toBe('2024-01-15T10:00:00.000Z');
  });

  it('prefers article:published_time over JSON-LD', () => {
    const result = run(`<html><head>
      <meta property="article:published_time" content="2024-01-15T10:00:00Z">
      <script type="application/ld+json">{"@type":"Article","datePublished":"2023-06-01"}</script>
    </head></html>`);
    expect(result.data.date).toBe('2024-01-15T10:00:00.000Z');
  });

  it('falls through to meta[name="date"] when article:published_time is missing', () => {
    const result = run(`<html><head>
      <meta name="date" content="2024-03-15">
      <script type="application/ld+json">{"@type":"Article","datePublished":"2024-06-01"}</script>
    </head></html>`);
    expect(result.data.date).toBeDefined();
    // meta[name="date"] is checked before JSON-LD
  });

  it('handles invalid JSON-LD gracefully', () => {
    const result = run(`<html><head>
      <script type="application/ld+json">{invalid json}</script>
    </head></html>`);
    expect(result.data).toEqual({});
  });

  it('handles date-only strings (no time)', () => {
    const result = run(
      '<html><head><meta property="article:published_time" content="2024-06-15"></head></html>',
    );
    expect(result.data.date).toBeDefined();
  });
});
