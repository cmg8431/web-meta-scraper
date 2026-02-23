import http2 from 'node:http2';
import tls from 'node:tls';
import zlib from 'node:zlib';
import { ScraperError } from '../core/errors';

/** Chrome 131 TLS cipher suite order for browser-like TLS fingerprinting. */
const CHROME_CIPHERS = [
  'TLS_AES_128_GCM_SHA256',
  'TLS_AES_256_GCM_SHA384',
  'TLS_CHACHA20_POLY1305_SHA256',
  'ECDHE-ECDSA-AES128-GCM-SHA256',
  'ECDHE-RSA-AES128-GCM-SHA256',
  'ECDHE-ECDSA-AES256-GCM-SHA384',
  'ECDHE-RSA-AES256-GCM-SHA384',
  'ECDHE-ECDSA-CHACHA20-POLY1305',
  'ECDHE-RSA-CHACHA20-POLY1305',
  'ECDHE-RSA-AES128-SHA',
  'ECDHE-RSA-AES256-SHA',
  'AES128-GCM-SHA256',
  'AES256-GCM-SHA384',
  'AES128-SHA',
  'AES256-SHA',
].join(':');

const CHROME_SIGALGS = [
  'ecdsa_secp256r1_sha256',
  'rsa_pss_rsae_sha256',
  'rsa_pkcs1_sha256',
  'ecdsa_secp384r1_sha384',
  'rsa_pss_rsae_sha384',
  'rsa_pkcs1_sha384',
  'rsa_pss_rsae_sha512',
  'rsa_pkcs1_sha512',
].join(':');

export interface StealthFetchOptions {
  timeout: number;
  userAgent: string;
  followRedirects: boolean;
  maxContentLength: number;
  headers?: Record<string, string>;
}

function decompress(buf: Buffer, encoding?: string): string {
  if (encoding === 'br') return zlib.brotliDecompressSync(buf).toString();
  if (encoding === 'gzip') return zlib.gunzipSync(buf).toString();
  if (encoding === 'deflate') return zlib.inflateSync(buf).toString();
  return buf.toString();
}

/**
 * Fetch HTML using HTTP/2 with a browser-like TLS fingerprint.
 * Improves compatibility with sites that restrict non-browser HTTP clients.
 */
export function fetchStealth(
  url: string,
  opts: StealthFetchOptions,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    let settled = false;

    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    const timer = setTimeout(() => {
      settle(() => {
        reject(new ScraperError(`Request timeout after ${opts.timeout}ms`));
        client.close();
      });
    }, opts.timeout);

    const client = http2.connect(parsed.origin, {
      settings: { enablePush: false },
      createConnection: () =>
        tls.connect({
          host: parsed.hostname,
          port: 443,
          ALPNProtocols: ['h2', 'http/1.1'],
          ciphers: CHROME_CIPHERS,
          minVersion: 'TLSv1.2',
          maxVersion: 'TLSv1.3',
          servername: parsed.hostname,
          ecdhCurve: 'X25519:P-256:P-384',
          sigalgs: CHROME_SIGALGS,
        }),
    });

    client.on('error', (err) => {
      clearTimeout(timer);
      settle(() =>
        reject(
          new ScraperError(
            `Failed to fetch URL: ${url}`,
            err instanceof Error ? err : new Error(String(err)),
          ),
        ),
      );
    });

    const req = client.request({
      ':method': 'GET',
      ':path': parsed.pathname + parsed.search,
      ':authority': parsed.hostname,
      ':scheme': 'https',
      'user-agent': opts.userAgent,
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'accept-encoding': 'gzip, deflate, br',
      'sec-ch-ua':
        '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
      'cache-control': 'max-age=0',
      ...opts.headers,
    });

    const chunks: Buffer[] = [];
    let resHeaders: Record<string, unknown> = {};

    req.on('response', (h) => {
      resHeaders = h;
    });
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      clearTimeout(timer);
      client.close();
      if (settled) return;

      const status = resHeaders[':status'] as number;

      if (status >= 300 && status < 400 && opts.followRedirects) {
        const location = resHeaders.location as string | undefined;
        if (location) {
          settled = true;
          const redirectUrl = new URL(location, url).href;
          fetchStealth(redirectUrl, opts).then(resolve, reject);
          return;
        }
      }

      if (!status || status >= 400) {
        settle(() =>
          reject(
            new ScraperError(
              `Failed to fetch URL: ${url}`,
              new Error(`HTTP error! status: ${status}`),
            ),
          ),
        );
        return;
      }

      settle(() => {
        try {
          const buf = Buffer.concat(chunks);
          if (buf.length > opts.maxContentLength) {
            reject(
              new ScraperError(
                `Content too large: ${buf.length} bytes (max: ${opts.maxContentLength})`,
              ),
            );
            return;
          }
          resolve(
            decompress(
              buf,
              resHeaders['content-encoding'] as string | undefined,
            ),
          );
        } catch (err) {
          reject(
            new ScraperError(
              `Failed to decode response from: ${url}`,
              err instanceof Error ? err : new Error(String(err)),
            ),
          );
        }
      });
    });

    req.on('error', (err) => {
      clearTimeout(timer);
      client.close();
      settle(() =>
        reject(
          new ScraperError(
            `Failed to fetch URL: ${url}`,
            err instanceof Error ? err : new Error(String(err)),
          ),
        ),
      );
    });

    req.end();
  });
}
