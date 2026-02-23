import type { Plugin, PluginResult } from '../../types/plugin';
import { resolveUrl } from '../../utils/url';

export const oembed: Plugin = async (ctx): Promise<PluginResult> => {
  const { $, url, options } = ctx;

  const link = $('link[type="application/json+oembed"]').attr('href');
  if (!link) {
    return { name: 'oembed', data: {} };
  }

  const resolved = resolveUrl(link, url);

  try {
    const response = await fetch(resolved, {
      signal: AbortSignal.timeout(options.timeout ?? 5000),
    });

    if (!response.ok) {
      return { name: 'oembed', data: {} };
    }

    const data = await response.json();
    return { name: 'oembed', data: { oembed: data } };
  } catch {
    return { name: 'oembed', data: {} };
  }
};
