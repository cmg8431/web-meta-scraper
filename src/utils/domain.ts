/**
 * Extracts the registrable domain (without subdomain or TLD suffix) from a URL.
 * e.g. "https://www.music.youtube.com/watch" → "youtube"
 * e.g. "https://amazon.co.jp/dp/123" → "amazon"
 */
function extractDomainBase(hostname: string): string {
  const parts = hostname.split('.');
  // Handle two-part TLDs like co.jp, co.uk, com.br
  if (parts.length >= 3) {
    const last2 = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    if (/^(co|com|org|net|gov)\.\w{2}$/.test(last2)) {
      return parts[parts.length - 3];
    }
  }
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
}

/**
 * Checks if a URL's domain matches any of the given domain names.
 * Supports exact hostname matching and base domain matching.
 *
 * @example
 * matchDomain('https://www.youtube.com/watch?v=abc', ['youtube']) // true
 * matchDomain('https://amazon.co.jp/dp/123', ['amazon']) // true
 * matchDomain('https://t.me/channel', ['t.me', 'telegram.me']) // true
 */
export function matchDomain(
  url: string | undefined,
  domains: string[],
): boolean {
  if (!url) return false;
  try {
    const { hostname } = new URL(url);
    const base = extractDomainBase(hostname);
    return domains.some(
      (d) => hostname === d || hostname.endsWith(`.${d}`) || base === d,
    );
  } catch {
    return false;
  }
}
