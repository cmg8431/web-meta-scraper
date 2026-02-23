import { load } from 'cheerio';
import type { FetchOptions } from '../fetcher';

export interface ExtractContentResult {
  content: string;
  metadata: { title: string; description: string };
  wordCount: number;
  language: string;
}

const NOISE_SELECTORS = [
  'script',
  'style',
  'noscript',
  'iframe',
  'nav',
  'header',
  'footer',
  'aside',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="contentinfo"]',
  '.ad',
  '.ads',
  '.advertisement',
  '.sidebar',
  '.nav',
  '.menu',
  '.popup',
  '.modal',
  '.cookie-banner',
  '.social-share',
  '.comments',
].join(', ');

const CONTENT_SELECTORS = [
  'article',
  'main',
  '[role="main"]',
  '.content',
  '.post-content',
  '.entry-content',
  '.article-body',
  '#content',
];

function normalizeText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function countWords(text: string): number {
  if (!text) return 0;
  // Handle CJK characters as individual words + whitespace-separated words
  const cjkCount = (
    text.match(
      /[\u4e00-\u9fff\u3400-\u4dbf\uac00-\ud7af\u3040-\u309f\u30a0-\u30ff]/g,
    ) || []
  ).length;
  const wordCount = text
    .replace(
      /[\u4e00-\u9fff\u3400-\u4dbf\uac00-\ud7af\u3040-\u309f\u30a0-\u30ff]/g,
      '',
    )
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  return cjkCount + wordCount;
}

export function extractFromHtml(html: string): ExtractContentResult {
  const $ = load(html);

  // Extract metadata before removing elements
  const title = $('title').first().text().trim();
  const description =
    $('meta[name="description"]').attr('content')?.trim() ?? '';
  const language = $('html').attr('lang')?.trim() ?? '';

  // Remove noise elements
  $(NOISE_SELECTORS).remove();

  // Add newlines around block elements so .text() doesn't concatenate words
  const blockTags =
    'p, div, h1, h2, h3, h4, h5, h6, li, tr, br, blockquote, pre, hr, dt, dd';
  $(blockTags).each((_, el) => {
    const $el = $(el);
    $el.before('\n').after('\n');
  });

  // Find main content area
  let contentText = '';
  for (const selector of CONTENT_SELECTORS) {
    const el = $(selector).first();
    if (el.length > 0) {
      contentText = el.text();
      break;
    }
  }

  // Fallback to body
  if (!contentText) {
    contentText = $('body').text();
  }

  const content = normalizeText(contentText);

  return {
    content,
    metadata: { title, description },
    wordCount: countWords(content),
    language,
  };
}

export async function extractContent(
  url: string,
  fetchOptions?: FetchOptions,
): Promise<ExtractContentResult> {
  const { fetchHtml } = await import('../fetcher');
  const html = await fetchHtml(url, fetchOptions);
  return extractFromHtml(html);
}
