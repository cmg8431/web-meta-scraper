import type { Plugin, PluginResult } from '../../types/plugin';
import { matchDomain } from '../../utils/domain';
import { getAttr, getText } from '../../utils/dom';

const YOUTUBE_DOMAINS = ['youtube', 'youtu.be'];

const VIDEO_ID_PATTERNS = [
  /[?&]v=([a-zA-Z0-9_-]{11})/,
  /\/embed\/([a-zA-Z0-9_-]{11})/,
  /\/v\/([a-zA-Z0-9_-]{11})/,
  /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /\/shorts\/([a-zA-Z0-9_-]{11})/,
];

function extractVideoId(url: string): string | undefined {
  for (const pattern of VIDEO_ID_PATTERNS) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return undefined;
}

const THUMBNAIL_RESOLUTIONS = [
  'maxresdefault',
  'sddefault',
  'hqdefault',
  'mqdefault',
  'default',
] as const;

/**
 * YouTube vendor plugin — extracts clean metadata from YouTube pages.
 *
 * Unlike metascraper-youtube which probes thumbnail URLs via HTTP,
 * we return all available thumbnail resolutions for the consumer to choose.
 * The highest resolution is used as the primary image.
 */
export const youtube: Plugin = (ctx): PluginResult => {
  const { $, url } = ctx;
  if (!matchDomain(url, YOUTUBE_DOMAINS)) return { name: 'youtube', data: {} };

  const data: Record<string, unknown> = { publisher: 'YouTube' };

  // Extract video ID from URL
  const videoId = url ? extractVideoId(url) : undefined;

  // Clean title: strip " - YouTube" suffix
  const rawTitle =
    getAttr($('meta[property="og:title"]'), 'content') || getText($('title'));
  if (rawTitle) {
    data.title = rawTitle.replace(/\s*-\s*YouTube$/i, '').trim();
  }

  // Author from channel info
  const author =
    getAttr($('link[itemprop="name"]'), 'content') ||
    getAttr($('span[itemprop="author"] link[itemprop="name"]'), 'content') ||
    getAttr($('[itemprop="author"] [itemprop="name"]'), 'content');
  if (author) data.author = author;

  // Best thumbnail as primary image (maxresdefault first)
  if (videoId) {
    data.image = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    data.thumbnails = THUMBNAIL_RESOLUTIONS.map((res) => ({
      url: `https://i.ytimg.com/vi/${videoId}/${res}.jpg`,
      resolution: res,
    }));
    data.videoId = videoId;
  }

  return { name: 'youtube', data };
};
