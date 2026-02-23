import type { ScrapeContext } from '../core/context';

export interface PluginResult {
  name: string;
  data: Record<string, unknown>;
}

export type Plugin = (
  ctx: ScrapeContext,
) => PluginResult | Promise<PluginResult>;
