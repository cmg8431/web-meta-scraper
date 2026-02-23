import { describe, expect, it } from 'vitest';
import { createContext } from '../../core/context';
import type { PluginResult } from '../../types/plugin';
import { audio } from './audio';

function run(html: string, url?: string): PluginResult {
  const ctx = createContext(html, url, {});
  return audio(ctx) as PluginResult;
}

describe('audio plugin', () => {
  it('returns PluginResult with name "audio"', () => {
    const result = run('<html><head></head></html>');
    expect(result.name).toBe('audio');
  });

  it('extracts og:audio with type', () => {
    const result = run(`<html><head>
      <meta property="og:audio" content="https://example.com/song.mp3">
      <meta property="og:audio:type" content="audio/mpeg">
    </head></html>`);
    expect(result.data.audio).toEqual([
      { url: 'https://example.com/song.mp3', type: 'audio/mpeg' },
    ]);
  });

  it('extracts og:audio without type', () => {
    const result = run(`<html><head>
      <meta property="og:audio" content="https://example.com/song.mp3">
    </head></html>`);
    expect(result.data.audio).toEqual([
      { url: 'https://example.com/song.mp3' },
    ]);
  });

  it('prefers og:audio:secure_url over og:audio', () => {
    const result = run(`<html><head>
      <meta property="og:audio" content="http://example.com/song.mp3">
      <meta property="og:audio:secure_url" content="https://example.com/song.mp3">
    </head></html>`);
    expect((result.data.audio as { url: string }[])[0].url).toBe(
      'https://example.com/song.mp3',
    );
  });

  it('falls back to og:audio:url', () => {
    const result = run(`<html><head>
      <meta property="og:audio:url" content="https://example.com/fallback.mp3">
    </head></html>`);
    expect((result.data.audio as { url: string }[])[0].url).toBe(
      'https://example.com/fallback.mp3',
    );
  });

  it('extracts <audio> element with src', () => {
    const result = run(
      '<html><body><audio src="/audio.mp3"></audio></body></html>',
      'https://example.com',
    );
    expect(result.data.audio).toEqual([
      { url: 'https://example.com/audio.mp3' },
    ]);
  });

  it('extracts <audio> with <source> children', () => {
    const result = run(
      `<html><body><audio>
        <source src="/a.ogg" type="audio/ogg">
        <source src="/b.mp3" type="audio/mpeg">
      </audio></body></html>`,
      'https://example.com',
    );
    const entries = result.data.audio as { url: string; type?: string }[];
    expect(entries).toHaveLength(2);
    expect(entries[0].type).toBe('audio/ogg');
    expect(entries[1].type).toBe('audio/mpeg');
  });

  it('extracts <audio> with both src and <source> children', () => {
    const result = run(
      `<html><body><audio src="/main.mp3">
        <source src="/alt.ogg" type="audio/ogg">
      </audio></body></html>`,
      'https://example.com',
    );
    expect(result.data.audio).toHaveLength(2);
  });

  it('extracts JSON-LD AudioObject', () => {
    const result = run(`<html><head>
      <script type="application/ld+json">{"@type":"AudioObject","contentUrl":"https://example.com/podcast.mp3"}</script>
    </head></html>`);
    expect(result.data.audio).toEqual([
      { url: 'https://example.com/podcast.mp3' },
    ]);
  });

  it('extracts JSON-LD AudioObject from @graph', () => {
    const result = run(`<html><head>
      <script type="application/ld+json">{"@graph":[{"@type":"AudioObject","contentUrl":"https://example.com/graph.mp3"}]}</script>
    </head></html>`);
    expect((result.data.audio as { url: string }[])[0].url).toBe(
      'https://example.com/graph.mp3',
    );
  });

  it('deduplicates identical URLs', () => {
    const result = run(`<html><head>
      <meta property="og:audio" content="https://example.com/song.mp3">
    </head><body>
      <audio src="https://example.com/song.mp3"></audio>
    </body></html>`);
    expect(result.data.audio).toHaveLength(1);
  });

  it('collects audio from multiple different sources', () => {
    const result = run(`<html><head>
      <meta property="og:audio" content="https://example.com/og.mp3">
    </head><body>
      <audio src="https://example.com/html5.mp3"></audio>
    </body></html>`);
    expect(result.data.audio).toHaveLength(2);
  });

  it('returns empty data when no audio found', () => {
    const result = run('<html><head></head></html>');
    expect(result.data).toEqual({});
  });

  it('resolves relative URLs', () => {
    const result = run(
      '<html><body><audio src="/music/track.mp3"></audio></body></html>',
      'https://example.com',
    );
    expect((result.data.audio as { url: string }[])[0].url).toBe(
      'https://example.com/music/track.mp3',
    );
  });

  it('handles invalid JSON-LD gracefully', () => {
    const result = run(`<html><head>
      <script type="application/ld+json">{broken json}</script>
    </head></html>`);
    expect(result.data).toEqual({});
  });

  it('ignores AudioObject without contentUrl', () => {
    const result = run(`<html><head>
      <script type="application/ld+json">{"@type":"AudioObject","name":"No URL"}</script>
    </head></html>`);
    expect(result.data).toEqual({});
  });
});
