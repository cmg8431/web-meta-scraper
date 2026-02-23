import { describe, expect, it } from 'vitest';
import { createContext } from '../../core/context';
import type { PluginResult } from '../../types/plugin';
import { video } from './video';

function run(html: string, url?: string): PluginResult {
  const ctx = createContext(html, url, {});
  return video(ctx) as PluginResult;
}

describe('video plugin', () => {
  it('returns PluginResult with name "video"', () => {
    const result = run('<html><head></head></html>');
    expect(result.name).toBe('video');
  });

  it('extracts og:video with type, width, height', () => {
    const result = run(`<html><head>
      <meta property="og:video" content="https://example.com/video.mp4">
      <meta property="og:video:type" content="video/mp4">
      <meta property="og:video:width" content="1280">
      <meta property="og:video:height" content="720">
    </head></html>`);
    expect(result.data.videos).toEqual([
      {
        url: 'https://example.com/video.mp4',
        type: 'video/mp4',
        width: 1280,
        height: 720,
      },
    ]);
  });

  it('prefers og:video:secure_url over og:video', () => {
    const result = run(`<html><head>
      <meta property="og:video" content="http://example.com/video.mp4">
      <meta property="og:video:secure_url" content="https://example.com/video.mp4">
    </head></html>`);
    expect((result.data.videos as { url: string }[])[0].url).toBe(
      'https://example.com/video.mp4',
    );
  });

  it('falls back to og:video:url when og:video is missing', () => {
    const result = run(`<html><head>
      <meta property="og:video:url" content="https://example.com/fallback.mp4">
    </head></html>`);
    expect((result.data.videos as { url: string }[])[0].url).toBe(
      'https://example.com/fallback.mp4',
    );
  });

  it('extracts twitter:player with dimensions', () => {
    const result = run(`<html><head>
      <meta name="twitter:player" content="https://example.com/player">
      <meta name="twitter:player:width" content="640">
      <meta name="twitter:player:height" content="480">
    </head></html>`);
    expect(result.data.videos).toEqual([
      { url: 'https://example.com/player', width: 640, height: 480 },
    ]);
  });

  it('extracts twitter:player without dimensions', () => {
    const result = run(`<html><head>
      <meta name="twitter:player" content="https://example.com/player">
    </head></html>`);
    expect(result.data.videos).toEqual([{ url: 'https://example.com/player' }]);
  });

  it('extracts <video> element with src', () => {
    const result = run(
      '<html><body><video src="/vid.mp4" width="320" height="240"></video></body></html>',
      'https://example.com',
    );
    expect(result.data.videos).toEqual([
      { url: 'https://example.com/vid.mp4', width: 320, height: 240 },
    ]);
  });

  it('extracts <video> with <source> children', () => {
    const result = run(
      `<html><body><video>
        <source src="/a.webm" type="video/webm">
        <source src="/b.mp4" type="video/mp4">
      </video></body></html>`,
      'https://example.com',
    );
    const videos = result.data.videos as { url: string; type?: string }[];
    expect(videos).toHaveLength(2);
    expect(videos[0].type).toBe('video/webm');
    expect(videos[1].type).toBe('video/mp4');
  });

  it('extracts <video> with both src and <source> children', () => {
    const result = run(
      `<html><body><video src="/main.mp4">
        <source src="/alt.webm" type="video/webm">
      </video></body></html>`,
      'https://example.com',
    );
    expect(result.data.videos).toHaveLength(2);
  });

  it('extracts JSON-LD VideoObject', () => {
    const result = run(`<html><head>
      <script type="application/ld+json">{"@type":"VideoObject","contentUrl":"https://example.com/jld.mp4","width":1920,"height":1080}</script>
    </head></html>`);
    expect(result.data.videos).toEqual([
      { url: 'https://example.com/jld.mp4', width: 1920, height: 1080 },
    ]);
  });

  it('extracts JSON-LD VideoObject from @graph', () => {
    const result = run(`<html><head>
      <script type="application/ld+json">{"@graph":[{"@type":"VideoObject","contentUrl":"https://example.com/graph.mp4"}]}</script>
    </head></html>`);
    expect((result.data.videos as { url: string }[])[0].url).toBe(
      'https://example.com/graph.mp4',
    );
  });

  it('deduplicates identical URLs from different sources', () => {
    const result = run(`<html><head>
      <meta property="og:video" content="https://example.com/video.mp4">
    </head><body>
      <video src="https://example.com/video.mp4"></video>
    </body></html>`);
    expect(result.data.videos).toHaveLength(1);
  });

  it('collects videos from multiple different sources', () => {
    const result = run(
      `<html><head>
      <meta property="og:video" content="https://example.com/og.mp4">
      <meta name="twitter:player" content="https://example.com/tw-player">
    </head><body>
      <video src="https://example.com/html5.mp4"></video>
    </body></html>`,
      'https://example.com',
    );
    expect(result.data.videos).toHaveLength(3);
  });

  it('returns empty data when no videos found', () => {
    const result = run('<html><head></head></html>');
    expect(result.data).toEqual({});
  });

  it('resolves relative URLs', () => {
    const result = run(
      '<html><body><video src="/videos/test.mp4"></video></body></html>',
      'https://example.com',
    );
    expect((result.data.videos as { url: string }[])[0].url).toBe(
      'https://example.com/videos/test.mp4',
    );
  });

  it('handles invalid JSON-LD gracefully', () => {
    const result = run(`<html><head>
      <script type="application/ld+json">{broken json}</script>
    </head></html>`);
    expect(result.data).toEqual({});
  });

  it('ignores VideoObject without contentUrl', () => {
    const result = run(`<html><head>
      <script type="application/ld+json">{"@type":"VideoObject","name":"No URL"}</script>
    </head></html>`);
    expect(result.data).toEqual({});
  });
});
