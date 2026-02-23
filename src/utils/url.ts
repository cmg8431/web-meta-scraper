export function resolveUrl(target: string, base?: string): string {
  if (!base) return target;
  try {
    return new URL(target, base).href;
  } catch {
    return target;
  }
}
