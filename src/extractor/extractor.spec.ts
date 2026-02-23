import { describe, expect, it } from 'vitest';
import { extractFromHtml } from './index';

describe('extractFromHtml', () => {
  it('extracts title and description from meta tags', () => {
    const html = `
      <html>
        <head>
          <title>Test Page</title>
          <meta name="description" content="Page description">
        </head>
        <body><p>Content</p></body>
      </html>
    `;
    const result = extractFromHtml(html);
    expect(result.metadata.title).toBe('Test Page');
    expect(result.metadata.description).toBe('Page description');
  });

  it('extracts language from html lang attribute', () => {
    const html = '<html lang="ko"><body><p>안녕하세요</p></body></html>';
    const result = extractFromHtml(html);
    expect(result.language).toBe('ko');
  });

  it('returns empty language when not specified', () => {
    const html = '<html><body><p>Hello</p></body></html>';
    const result = extractFromHtml(html);
    expect(result.language).toBe('');
  });

  it('removes script and style elements', () => {
    const html = `
      <html><body>
        <script>var x = 1;</script>
        <style>.foo { color: red; }</style>
        <p>Actual content</p>
      </body></html>
    `;
    const result = extractFromHtml(html);
    expect(result.content).toContain('Actual content');
    expect(result.content).not.toContain('var x = 1');
    expect(result.content).not.toContain('color: red');
  });

  it('removes nav, header, footer, aside elements', () => {
    const html = `
      <html><body>
        <nav>Navigation</nav>
        <header>Header content</header>
        <main><p>Main content here</p></main>
        <aside>Sidebar</aside>
        <footer>Footer content</footer>
      </body></html>
    `;
    const result = extractFromHtml(html);
    expect(result.content).toContain('Main content here');
    expect(result.content).not.toContain('Navigation');
    expect(result.content).not.toContain('Header content');
    expect(result.content).not.toContain('Footer content');
    expect(result.content).not.toContain('Sidebar');
  });

  it('prefers article over body for content', () => {
    const html = `
      <html><body>
        <div>Other stuff</div>
        <article><p>Article content</p></article>
      </body></html>
    `;
    const result = extractFromHtml(html);
    expect(result.content).toContain('Article content');
    expect(result.content).not.toContain('Other stuff');
  });

  it('prefers main element when no article', () => {
    const html = `
      <html><body>
        <div>Other stuff</div>
        <main><p>Main content</p></main>
      </body></html>
    `;
    const result = extractFromHtml(html);
    expect(result.content).toContain('Main content');
    expect(result.content).not.toContain('Other stuff');
  });

  it('falls back to body when no content area found', () => {
    const html = `
      <html><body>
        <div><p>Body fallback content</p></div>
      </body></html>
    `;
    const result = extractFromHtml(html);
    expect(result.content).toContain('Body fallback content');
  });

  it('counts words correctly for English text', () => {
    const html = '<html><body><p>Hello world this is a test</p></body></html>';
    const result = extractFromHtml(html);
    expect(result.wordCount).toBe(6);
  });

  it('counts CJK characters as individual words', () => {
    const html = '<html><body><p>안녕하세요 world</p></body></html>';
    const result = extractFromHtml(html);
    // 5 Korean chars + 1 English word
    expect(result.wordCount).toBe(6);
  });

  it('normalizes whitespace in content', () => {
    const html = `
      <html><body>
        <p>  Multiple   spaces   and
        newlines   here  </p>
      </body></html>
    `;
    const result = extractFromHtml(html);
    expect(result.content).not.toContain('  ');
  });

  it('removes ad-related elements', () => {
    const html = `
      <html><body>
        <div class="ad">Advertisement</div>
        <div class="sidebar">Side content</div>
        <article><p>Real content</p></article>
      </body></html>
    `;
    const result = extractFromHtml(html);
    expect(result.content).toContain('Real content');
    expect(result.content).not.toContain('Advertisement');
  });

  it('separates text from different block elements', () => {
    const html = `
      <html><body>
        <article><h1>Title</h1><p>Paragraph text</p></article>
      </body></html>
    `;
    const result = extractFromHtml(html);
    expect(result.content).toContain('Title');
    expect(result.content).toContain('Paragraph text');
    expect(result.content).not.toContain('TitleParagraph');
  });

  it('handles empty HTML gracefully', () => {
    const result = extractFromHtml('<html><body></body></html>');
    expect(result.content).toBe('');
    expect(result.wordCount).toBe(0);
  });
});
