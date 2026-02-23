import type { Plugin, PluginResult } from '../../types/plugin';
import { matchDomain } from '../../utils/domain';
import { getAttr, getText } from '../../utils/dom';

const GITHUB_DOMAINS = ['github'];

/**
 * GitHub vendor plugin — extracts repository and profile metadata from GitHub pages.
 *
 * Parses GitHub-specific selectors and URL structure to extract
 * repository owner, name, stars, language, and description.
 * Not available in metascraper.
 */
export const github: Plugin = (ctx): PluginResult => {
  const { $, url } = ctx;
  if (!matchDomain(url, GITHUB_DOMAINS)) {
    return { name: 'github', data: {} };
  }

  const data: Record<string, unknown> = { publisher: 'GitHub' };

  // Parse owner/repo from URL
  if (url) {
    try {
      const segments = new URL(url).pathname.split('/').filter(Boolean);
      if (segments.length >= 1) data.owner = segments[0];
      if (segments.length >= 2) data.repo = segments[1];
    } catch {
      // ignore
    }
  }

  // Title: clean GitHub suffix
  const ogTitle = getAttr($('meta[property="og:title"]'), 'content') || '';
  if (ogTitle) {
    data.title = ogTitle.replace(/\s*·\s*GitHub$/, '').trim();
  }

  // Programming language from repo meta
  const lang =
    getAttr($('span[itemprop="programmingLanguage"]'), 'content') ||
    getText($('span[itemprop="programmingLanguage"]')).trim();
  if (lang) data.programmingLanguage = lang;

  // Description — og:description cleaned
  const ogDesc =
    getAttr($('meta[property="og:description"]'), 'content') || '';
  if (ogDesc) {
    // Strip "Contribute to owner/repo development..." boilerplate
    const cleaned = ogDesc
      .replace(
        /^Contribute to .+ development by creating an account on GitHub\.?$/,
        '',
      )
      .trim();
    if (cleaned) data.description = cleaned;
  }

  // Author from owner
  if (data.owner && !data.author) {
    data.author = data.owner as string;
  }

  return { name: 'github', data };
};
