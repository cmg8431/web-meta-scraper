import type { Plugin, PluginResult } from '../../types/plugin';
import { getAttr } from '../../utils/dom';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Plugin that generates an embeddable `<iframe>` HTML snippet.
 *
 * Primary source is `twitter:player` + width/height meta tags, which are
 * used to construct a safe `<iframe>` tag. The oEmbed `html` field is
 * handled as a fallback in `applyFallbacks` in the core module.
 *
 * HTML attributes are escaped to prevent XSS.
 *
 * @param ctx - Scrape context providing the Cheerio DOM
 * @returns Plugin result with name "iframe" and an `iframe` HTML string
 */
export const iframe: Plugin = (ctx): PluginResult => {
  const { $ } = ctx;
  const data: Record<string, unknown> = {};

  const playerUrl = getAttr($('meta[name="twitter:player"]'), 'content');
  if (playerUrl) {
    const width =
      getAttr($('meta[name="twitter:player:width"]'), 'content') || '640';
    const height =
      getAttr($('meta[name="twitter:player:height"]'), 'content') || '360';

    data.iframe = `<iframe src="${escapeHtml(playerUrl)}" width="${escapeHtml(width)}" height="${escapeHtml(height)}" frameborder="0" allowfullscreen></iframe>`;
  }

  return { name: 'iframe', data };
};
