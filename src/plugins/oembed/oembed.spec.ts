import { describe, expect, it, vi } from 'vitest';
import { createContext } from '../../core/context';
import { oembed } from './oembed';

describe('oembed plugin', () => {
  it('returns PluginResult with name "oembed"', async () => {
    const ctx = createContext('<html></html>', undefined, {});
    const result = await oembed(ctx);
    expect(result.name).toBe('oembed');
  });

  it('returns empty data when no oembed link is present', async () => {
    const html = '<html><head></head></html>';
    const ctx = createContext(html, undefined, {});
    const result = await oembed(ctx);
    expect(result.data).toEqual({});
  });

  it('finds oembed link tag in HTML', async () => {
    const html = `
      <html>
        <head>
          <link type="application/json+oembed" href="https://example.com/oembed?url=test">
        </head>
      </html>
    `;

    const mockData = {
      type: 'video',
      title: 'Test Video',
      author_name: 'Test Author',
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      }),
    );

    const ctx = createContext(html, 'https://example.com/page', {});
    const result = await oembed(ctx);

    expect(result.data.oembed).toEqual(mockData);

    vi.restoreAllMocks();
  });

  it('returns empty data when oembed fetch fails', async () => {
    const html = `
      <html>
        <head>
          <link type="application/json+oembed" href="https://example.com/oembed">
        </head>
      </html>
    `;

    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error')),
    );

    const ctx = createContext(html, 'https://example.com', {});
    const result = await oembed(ctx);
    expect(result.data).toEqual({});

    vi.restoreAllMocks();
  });

  it('returns empty data when oembed response is not ok', async () => {
    const html = `
      <html>
        <head>
          <link type="application/json+oembed" href="https://example.com/oembed">
        </head>
      </html>
    `;

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    );

    const ctx = createContext(html, 'https://example.com', {});
    const result = await oembed(ctx);
    expect(result.data).toEqual({});

    vi.restoreAllMocks();
  });
});
