import { describe, expect, it } from 'vitest';
import { createContext } from '../../core/context';
import type { PluginResult } from '../../types/plugin';
import { reddit } from './reddit';

function run(html: string, url?: string): PluginResult {
  const ctx = createContext(html, url, {});
  return reddit(ctx) as PluginResult;
}

describe('reddit plugin', () => {
  it('returns PluginResult with name "reddit"', () => {
    const result = run('<html><head></head></html>');
    expect(result.name).toBe('reddit');
  });

  it('returns empty data when URL does not match reddit domain', () => {
    const html = `<html><head>
      <meta property="og:title" content="Some post : r/programming">
    </head></html>`;
    const result = run(html, 'https://www.example.com/r/programming/123');
    expect(result.data).toEqual({});
  });

  it('sets publisher to Reddit', () => {
    const html = '<html><head></head></html>';
    const result = run(
      html,
      'https://www.reddit.com/r/programming/comments/abc123/test_post/',
    );
    expect(result.data.publisher).toBe('Reddit');
  });

  it('extracts subreddit from URL path', () => {
    const html = '<html><head></head></html>';
    const result = run(
      html,
      'https://www.reddit.com/r/javascript/comments/abc123/some_post/',
    );
    expect(result.data.subreddit).toBe('r/javascript');
  });

  it('strips subreddit suffix from og:title', () => {
    const html = `<html><head>
      <meta property="og:title" content="What is the best JS framework? : r/javascript">
    </head></html>`;
    const result = run(
      html,
      'https://www.reddit.com/r/javascript/comments/abc123/what_is/',
    );
    expect(result.data.title).toBe('What is the best JS framework?');
  });

  it('strips "- Reddit" suffix from og:title', () => {
    const html = `<html><head>
      <meta property="og:title" content="Check out my project - Reddit">
    </head></html>`;
    const result = run(
      html,
      'https://www.reddit.com/r/webdev/comments/abc123/check/',
    );
    expect(result.data.title).toBe('Check out my project');
  });

  it('extracts author from URL user path', () => {
    const html = '<html><head></head></html>';
    const result = run(html, 'https://www.reddit.com/user/john_doe/comments');
    expect(result.data.author).toBe('u/john_doe');
  });

  it('extracts author from URL u/ shorthand path', () => {
    const html = '<html><head></head></html>';
    const result = run(html, 'https://www.reddit.com/u/jane_dev/submitted');
    expect(result.data.author).toBe('u/jane_dev');
  });

  it('extracts author from JSON-LD when not in URL', () => {
    const jsonLd = {
      '@type': 'DiscussionForumPosting',
      author: { '@type': 'Person', name: 'u/reddituser42' },
    };
    const html = `<html><head>
      <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    </head></html>`;
    const result = run(
      html,
      'https://www.reddit.com/r/webdev/comments/abc123/post_title/',
    );
    expect(result.data.author).toBe('u/reddituser42');
  });

  it('extracts commentCount from JSON-LD', () => {
    const jsonLd = {
      '@type': 'DiscussionForumPosting',
      commentCount: 42,
    };
    const html = `<html><head>
      <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    </head></html>`;
    const result = run(
      html,
      'https://www.reddit.com/r/webdev/comments/abc123/post_title/',
    );
    expect(result.data.commentCount).toBe(42);
  });

  it('handles invalid JSON-LD gracefully', () => {
    const html = `<html><head>
      <script type="application/ld+json">{broken json}</script>
    </head></html>`;
    const result = run(
      html,
      'https://www.reddit.com/r/test/comments/abc123/post/',
    );
    expect(result.data.publisher).toBe('Reddit');
  });
});
