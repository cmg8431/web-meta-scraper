import type { Plugin, PluginResult } from '../../types/plugin';
import { matchDomain } from '../../utils/domain';
import { getAttr, getText } from '../../utils/dom';

const TIKTOK_DOMAINS = ['tiktok'];

/**
 * Decodes a TikTok Snowflake-style video ID into a timestamp.
 * TikTok IDs encode a Unix timestamp in the upper bits (right-shift by 32).
 * We use Number since TikTok IDs fit within Number.MAX_SAFE_INTEGER range.
 */
function decodeSnowflakeTimestamp(id: string): Date | undefined {
  const num = Number(id);
  if (!Number.isFinite(num) || num <= 0) return undefined;
  // Right-shift 32 bits to get seconds since epoch
  const seconds = Math.floor(num / 2 ** 32);
  if (seconds < 1_500_000_000 || seconds > 2_000_000_000) return undefined;
  return new Date(seconds * 1000);
}

/**
 * TikTok vendor plugin — extracts video metadata from TikTok pages.
 *
 * Decodes the Snowflake-style video ID embedded in the URL to extract
 * the publication timestamp without any external dependencies.
 * Also parses the embedded `__UNIVERSAL_DATA_FOR_REHYDRATION__` script
 * for additional metadata.
 */
export const tiktok: Plugin = (ctx): PluginResult => {
  const { $, url } = ctx;
  if (!matchDomain(url, TIKTOK_DOMAINS)) return { name: 'tiktok', data: {} };

  const data: Record<string, unknown> = { publisher: 'TikTok' };

  // Parse author from og:title — "Author on TikTok" or "Author (@handle) | TikTok"
  const ogTitle = getAttr($('meta[property="og:title"]'), 'content') || '';
  const onMatch = ogTitle.match(/^(.+?)\s+on TikTok/);
  const pipeMatch = ogTitle.match(/^(.+?)\s*[|]\s*TikTok$/);
  if (onMatch) {
    data.author = onMatch[1].trim();
  } else if (pipeMatch) {
    data.author = pipeMatch[1].trim();
  }

  // Extract username from og:title parenthetical or URL path
  const handleMatch = ogTitle.match(/\(@([^)]+)\)/);
  if (handleMatch) {
    data.username = `@${handleMatch[1]}`;
  } else if (url) {
    try {
      const pathMatch = new URL(url).pathname.match(/^\/@([^/]+)/);
      if (pathMatch) data.username = `@${pathMatch[1]}`;
    } catch {
      // ignore
    }
  }

  // Build clean title
  if (data.author) {
    data.title = `${data.author}${data.username ? ` (${data.username})` : ''} on TikTok`;
  }

  // Date from Snowflake ID in URL path — /video/1234567890123456789
  if (url) {
    try {
      const videoIdMatch = new URL(url).pathname.match(/\/video\/(\d+)/);
      if (videoIdMatch) {
        const ts = decodeSnowflakeTimestamp(videoIdMatch[1]);
        if (ts) data.date = ts.toISOString();
      }
    } catch {
      // ignore
    }
  }

  // Fallback: try rehydration data
  if (!data.date) {
    $('script#__UNIVERSAL_DATA_FOR_REHYDRATION__').each((_, elem) => {
      if (data.date) return;
      try {
        const json = JSON.parse(getText($(elem)));
        const createTime =
          json?.__DEFAULT_SCOPE__?.['webapp.video-detail']?.itemInfo?.itemStruct
            ?.createTime;
        if (createTime) {
          const d = new Date(Number(createTime) * 1000);
          if (!Number.isNaN(d.getTime())) data.date = d.toISOString();
        }
      } catch {
        // ignore
      }
    });
  }

  return { name: 'tiktok', data };
};
