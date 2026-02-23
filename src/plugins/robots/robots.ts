import type { Plugin, PluginResult } from '../../types/plugin';
import type { RobotsInfo } from '../../types/result';
import { getAttr } from '../../utils/dom';

/**
 * Plugin that extracts and interprets robots meta tag directives from an HTML document.
 *
 * Scans all `<meta name="...">` elements for robots-related tags, including
 * the generic `robots` tag and bot-specific variants such as `googlebot`,
 * `bingbot`, etc. Parses comma-separated directive values and derives
 * boolean flags indicating indexing and crawl permissions.
 *
 * The `isIndexable` and `isFollowable` flags are determined solely from
 * the generic `robots` meta tag. Bot-specific directives are preserved
 * in the raw `directives` array for granular inspection.
 *
 * Recognized directives: noindex, nofollow, none, noarchive, nosnippet,
 * noimageindex, notranslate.
 *
 * @param ctx - Scrape context providing the Cheerio DOM
 * @returns Plugin result with name "robots" and a `robots` object of {@link RobotsInfo},
 *          or empty data if no robots meta tags are present
 *
 * @example
 * // HTML: <meta name="robots" content="noindex, nofollow">
 * // Result: { name: 'robots', data: { robots: { isIndexable: false, isFollowable: false, ... } } }
 */
export const robots: Plugin = (ctx): PluginResult => {
  const { $ } = ctx;

  const directives: RobotsInfo['directives'] = [];

  $('meta[name]').each((_, elem) => {
    const name = getAttr($(elem), 'name')?.toLowerCase();
    if (!name) return;
    if (
      name === 'robots' ||
      name.endsWith('bot') ||
      name.endsWith('bot-news')
    ) {
      const content = getAttr($(elem), 'content');
      if (content) {
        directives.push({ content, botName: name });
      }
    }
  });

  if (directives.length === 0) {
    return { name: 'robots', data: {} };
  }

  // Parse directives from the generic "robots" meta tag
  const genericDirectives = directives
    .filter((d) => d.botName === 'robots')
    .flatMap((d) =>
      d.content
        .toLowerCase()
        .split(',')
        .map((s) => s.trim()),
    );

  const info: RobotsInfo = {
    directives,
    isIndexable:
      !genericDirectives.includes('noindex') &&
      !genericDirectives.includes('none'),
    isFollowable:
      !genericDirectives.includes('nofollow') &&
      !genericDirectives.includes('none'),
    noarchive:
      genericDirectives.includes('noarchive') ||
      genericDirectives.includes('none'),
    nosnippet: genericDirectives.includes('nosnippet'),
    noimageindex: genericDirectives.includes('noimageindex'),
    notranslate: genericDirectives.includes('notranslate'),
  };

  return { name: 'robots', data: { robots: info } };
};
