import { type CheerioAPI, load } from 'cheerio';
import type { ScraperOptions } from '../types/options';

export interface ScrapeContext {
  $: CheerioAPI;
  url?: string;
  options: ScraperOptions;
}

export function createContext(
  html: string,
  url: string | undefined,
  options: ScraperOptions,
): ScrapeContext {
  const $ = load(html, { xml: false });
  return { $, url, options };
}
