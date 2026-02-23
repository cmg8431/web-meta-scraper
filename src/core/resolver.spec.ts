import { describe, expect, it } from 'vitest';
import type { PluginResult } from '../types/plugin';
import { DEFAULT_RULES, type ResolveRule, resolve } from './resolver';

describe('resolver', () => {
  it('resolves fields by priority', () => {
    const results: PluginResult[] = [
      { name: 'open-graph', data: { title: 'OG Title' } },
      { name: 'meta-tags', data: { title: 'Meta Title' } },
      { name: 'twitter', data: { title: 'Twitter Title' } },
    ];

    const resolved = resolve(results, DEFAULT_RULES);
    expect(resolved.title).toBe('OG Title');
  });

  it('falls back to lower priority when higher is empty', () => {
    const results: PluginResult[] = [
      { name: 'open-graph', data: { title: '' } },
      { name: 'meta-tags', data: { title: 'Meta Title' } },
      { name: 'twitter', data: { title: 'Twitter Title' } },
    ];

    const resolved = resolve(results, DEFAULT_RULES);
    expect(resolved.title).toBe('Meta Title');
  });

  it('resolves multiple fields from different plugins', () => {
    const results: PluginResult[] = [
      {
        name: 'open-graph',
        data: { title: 'OG Title', description: 'OG Desc', image: 'og.jpg' },
      },
      {
        name: 'meta-tags',
        data: {
          title: 'Meta Title',
          author: 'Author',
          favicon: '/fav.ico',
          keywords: ['a', 'b'],
        },
      },
      {
        name: 'twitter',
        data: { card: 'summary', site: '@test', creator: '@user' },
      },
    ];

    const resolved = resolve(results, DEFAULT_RULES);
    expect(resolved.title).toBe('OG Title');
    expect(resolved.description).toBe('OG Desc');
    expect(resolved.image).toBe('og.jpg');
    expect(resolved.author).toBe('Author');
    expect(resolved.favicon).toBe('/fav.ico');
    expect(resolved.keywords).toEqual(['a', 'b']);
    expect(resolved.twitterCard).toBe('summary');
    expect(resolved.twitterSite).toBe('@test');
    expect(resolved.twitterCreator).toBe('@user');
  });

  it('supports custom rules', () => {
    const customRules: ResolveRule[] = [
      {
        field: 'title',
        sources: [
          { plugin: 'twitter', key: 'title', priority: 2 },
          { plugin: 'open-graph', key: 'title', priority: 1 },
        ],
      },
    ];

    const results: PluginResult[] = [
      { name: 'open-graph', data: { title: 'OG Title' } },
      { name: 'twitter', data: { title: 'Twitter Title' } },
    ];

    const resolved = resolve(results, customRules);
    expect(resolved.title).toBe('Twitter Title');
  });

  it('returns empty object when no plugins match', () => {
    const resolved = resolve([], DEFAULT_RULES);
    expect(resolved).toEqual({});
  });

  it('skips empty arrays', () => {
    const results: PluginResult[] = [
      { name: 'meta-tags', data: { keywords: [] } },
    ];

    const resolved = resolve(results, DEFAULT_RULES);
    expect(resolved.keywords).toBeUndefined();
  });
});
