import type { Plugin, PluginResult } from '../../types/plugin';
import { getAttr } from '../../utils/dom';

export const openGraph: Plugin = (ctx): PluginResult => {
  const { $ } = ctx;
  const og: Record<string, string> = {};

  $('meta[property^="og:"]').each((_, elem) => {
    const property = getAttr($(elem), 'property');
    const content = getAttr($(elem), 'content');
    if (property && content) {
      og[property.replace('og:', '')] = content;
    }
  });

  const data: Record<string, unknown> = {
    title: og.title || '',
    description: og.description,
    image: og.image,
    url: og.url,
    type: og.type,
    siteName: og.site_name,
    locale: og.locale,
  };

  return { name: 'open-graph', data };
};
