import type { CheerioAPI } from 'cheerio';
import type { Plugin, PluginResult } from '../../types/plugin';
import { getAttr, getText } from '../../utils/dom';

function extractBaseMeta($: CheerioAPI): Record<string, unknown> {
  const title = getText($('title'));
  const description = getAttr($('meta[name="description"]'), 'content') || '';
  const author = getAttr($('meta[name="author"]'), 'content') || '';

  let keywords: string[] = [];
  const keywordsContent = getAttr($('meta[name="keywords"]'), 'content');
  if (keywordsContent) {
    keywords = keywordsContent
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
  }

  const result: Record<string, unknown> = {
    title,
    description,
    author,
    keywords,
  };

  const canonicalUrl = getAttr($('link[rel="canonical"]'), 'href');
  if (canonicalUrl) {
    result.canonicalUrl = canonicalUrl;
  }

  const favicon = getAttr(
    $('link[rel="icon"], link[rel="shortcut icon"]'),
    'href',
  );
  if (favicon) {
    result.favicon = favicon;
  }

  return result;
}

export const metaTags: Plugin = (ctx): PluginResult => {
  const { $ } = ctx;
  return {
    name: 'meta-tags',
    data: extractBaseMeta($),
  };
};
