import type { Plugin, PluginResult } from '../../types/plugin';
import { getAttr } from '../../utils/dom';

export const twitter: Plugin = (ctx): PluginResult => {
  const { $ } = ctx;
  const tw: Record<string, string> = {};

  $('meta[name^="twitter:"]').each((_, elem) => {
    const name = getAttr($(elem), 'name');
    const content = getAttr($(elem), 'content');
    if (name && content) {
      tw[name.replace('twitter:', '')] = content;
    }
  });

  const data: Record<string, unknown> = {
    title: tw.title || '',
    description: tw.description,
    image: tw.image,
    card: tw.card,
    site: tw.site,
    creator: tw.creator,
  };

  return { name: 'twitter', data };
};
