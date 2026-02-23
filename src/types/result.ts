import type { JsonLdMetadata } from './metadata';

/**
 * Represents a single favicon or icon reference discovered in an HTML document.
 *
 * Captures the resolved URL along with optional size and MIME type metadata
 * from `<link>` elements such as `rel="icon"`, `rel="apple-touch-icon"`,
 * `rel="mask-icon"`, or `rel="manifest"`.
 *
 * @example
 * { url: 'https://example.com/favicon.ico', sizes: '32x32', type: 'image/x-icon' }
 */
export interface FaviconEntry {
  /** Fully resolved URL pointing to the icon resource */
  url: string;
  /** Icon dimensions as declared in the `sizes` attribute (e.g. "180x180") */
  sizes?: string;
  /** MIME type of the icon (e.g. "image/png"), or "manifest" for web app manifest links */
  type?: string;
}

/**
 * Represents an RSS or Atom feed link discovered in an HTML document.
 *
 * Extracted from `<link rel="alternate">` elements with an
 * `application/rss+xml` or `application/atom+xml` type attribute.
 *
 * @example
 * { url: 'https://example.com/feed.xml', title: 'Blog RSS', type: 'rss' }
 */
export interface FeedEntry {
  /** Fully resolved URL of the feed */
  url: string;
  /** Human-readable title of the feed as declared in the `title` attribute */
  title?: string;
  /** Feed format: "rss" for RSS 2.0 feeds, "atom" for Atom feeds */
  type: 'rss' | 'atom';
}

/**
 * Aggregated robots meta tag information for a page.
 *
 * Parses all `<meta name="robots">` and bot-specific variants (e.g. googlebot)
 * to determine indexing permissions, follow permissions, and additional
 * crawl directives such as noarchive, nosnippet, noimageindex, and notranslate.
 *
 * The boolean flags (`isIndexable`, `isFollowable`, etc.) are derived solely
 * from the generic `robots` meta tag. Bot-specific directives are preserved
 * in the raw `directives` array for further inspection.
 *
 * @example
 * {
 *   directives: [{ content: 'noindex, nofollow', botName: 'robots' }],
 *   isIndexable: false,
 *   isFollowable: false,
 *   noarchive: false,
 *   nosnippet: false,
 *   noimageindex: false,
 *   notranslate: false,
 * }
 */
export interface RobotsInfo {
  /** Raw directive entries from all robots-related meta tags */
  directives: { content: string; botName: string }[];
  /** Whether the page allows indexing (no "noindex" or "none" in generic robots) */
  isIndexable: boolean;
  /** Whether the page allows link following (no "nofollow" or "none" in generic robots) */
  isFollowable: boolean;
  /** Whether caching/archiving is prohibited */
  noarchive: boolean;
  /** Whether search result snippets are prohibited */
  nosnippet: boolean;
  /** Whether image indexing is prohibited */
  noimageindex: boolean;
  /** Whether automatic translation is prohibited */
  notranslate: boolean;
}

/**
 * Represents a video resource discovered in an HTML document.
 *
 * Extracted from `og:video` meta tags, `<video>` / `<source>` elements,
 * Twitter player cards, or JSON-LD VideoObject entries.
 */
export interface VideoEntry {
  /** Fully resolved URL of the video resource */
  url: string;
  /** MIME type of the video (e.g. "video/mp4") */
  type?: string;
  /** Video width in pixels */
  width?: number;
  /** Video height in pixels */
  height?: number;
}

/**
 * Represents an audio resource discovered in an HTML document.
 *
 * Extracted from `og:audio` meta tags, `<audio>` / `<source>` elements,
 * or JSON-LD AudioObject entries.
 */
export interface AudioEntry {
  /** Fully resolved URL of the audio resource */
  url: string;
  /** MIME type of the audio (e.g. "audio/mpeg") */
  type?: string;
}

export interface OEmbedData {
  type?: string;
  version?: string;
  title?: string;
  author_name?: string;
  author_url?: string;
  provider_name?: string;
  provider_url?: string;
  thumbnail_url?: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
  html?: string;
  width?: number;
  height?: number;
  url?: string;
  [key: string]: unknown;
}

export interface ResolvedMetadata {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  favicon?: string;
  author?: string;
  keywords?: string[];
  locale?: string;
  type?: string;
  siteName?: string;
  twitterCard?: string;
  twitterSite?: string;
  twitterCreator?: string;
  jsonLd?: JsonLdMetadata[];
  oembed?: OEmbedData;
  date?: string;
  dateModified?: string;
  logo?: string;
  lang?: string;
  videos?: VideoEntry[];
  audio?: AudioEntry[];
  iframe?: string;
  favicons?: FaviconEntry[];
  feeds?: FeedEntry[];
  robots?: RobotsInfo;
}

export interface ScraperResult {
  metadata: ResolvedMetadata;
  sources: Record<string, Record<string, unknown>>;
}
