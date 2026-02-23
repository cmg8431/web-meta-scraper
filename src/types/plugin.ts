import type { Metadata } from './metadata';
import type { ScraperOptions } from './options';

export type Plugin = (
  html: string,
  options: ScraperOptions,
) => Promise<Partial<Metadata>>;
