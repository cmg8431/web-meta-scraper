import type { JsonLdMetadata } from './metadata';

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
}

export interface ScraperResult {
  metadata: ResolvedMetadata;
  sources: Record<string, Record<string, unknown>>;
}
