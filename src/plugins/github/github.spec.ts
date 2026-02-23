import { describe, expect, it } from 'vitest';
import { createContext } from '../../core/context';
import type { PluginResult } from '../../types/plugin';
import { github } from './github';

function run(html: string, url?: string): PluginResult {
  const ctx = createContext(html, url, {});
  return github(ctx) as PluginResult;
}

describe('github plugin', () => {
  it('returns PluginResult with name "github"', () => {
    const result = run('<html><head></head></html>');
    expect(result.name).toBe('github');
  });

  it('returns empty data when URL does not match github domain', () => {
    const html = `<html><head>
      <meta property="og:title" content="cool-project">
    </head></html>`;
    const result = run(html, 'https://www.example.com/user/repo');
    expect(result.data).toEqual({});
  });

  it('sets publisher to GitHub', () => {
    const html = '<html><head></head></html>';
    const result = run(html, 'https://github.com/facebook/react');
    expect(result.data.publisher).toBe('GitHub');
  });

  it('extracts owner from URL path', () => {
    const html = '<html><head></head></html>';
    const result = run(html, 'https://github.com/facebook/react');
    expect(result.data.owner).toBe('facebook');
  });

  it('extracts repo from URL path', () => {
    const html = '<html><head></head></html>';
    const result = run(html, 'https://github.com/facebook/react');
    expect(result.data.repo).toBe('react');
  });

  it('sets author from owner', () => {
    const html = '<html><head></head></html>';
    const result = run(html, 'https://github.com/vercel/next.js');
    expect(result.data.author).toBe('vercel');
  });

  it('strips " . GitHub" suffix from og:title', () => {
    const html = `<html><head>
      <meta property="og:title" content="facebook/react: A declarative UI library \u00b7 GitHub">
    </head></html>`;
    const result = run(html, 'https://github.com/facebook/react');
    expect(result.data.title).toBe(
      'facebook/react: A declarative UI library',
    );
  });

  it('extracts programming language from itemprop', () => {
    const html = `<html><body>
      <span itemprop="programmingLanguage">TypeScript</span>
    </body></html>`;
    const result = run(html, 'https://github.com/microsoft/TypeScript');
    expect(result.data.programmingLanguage).toBe('TypeScript');
  });

  it('extracts programming language from content attribute', () => {
    const html = `<html><body>
      <span itemprop="programmingLanguage" content="Rust"></span>
    </body></html>`;
    const result = run(html, 'https://github.com/nickel-org/nickel.rs');
    expect(result.data.programmingLanguage).toBe('Rust');
  });

  it('extracts description from og:description', () => {
    const html = `<html><head>
      <meta property="og:description" content="A JavaScript library for building user interfaces">
    </head></html>`;
    const result = run(html, 'https://github.com/facebook/react');
    expect(result.data.description).toBe(
      'A JavaScript library for building user interfaces',
    );
  });

  it('strips boilerplate "Contribute to..." description', () => {
    const html = `<html><head>
      <meta property="og:description" content="Contribute to facebook/react development by creating an account on GitHub.">
    </head></html>`;
    const result = run(html, 'https://github.com/facebook/react');
    expect(result.data.description).toBeUndefined();
  });

  it('handles profile URLs with only owner', () => {
    const html = '<html><head></head></html>';
    const result = run(html, 'https://github.com/torvalds');
    expect(result.data.owner).toBe('torvalds');
    expect(result.data.repo).toBeUndefined();
  });
});
