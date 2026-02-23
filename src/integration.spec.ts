import { describe, expect, it } from 'vitest';
import { createScraper, scrape } from './core';
import type { ScrapeContext } from './core/context';
import { jsonLd } from './plugins/json-ld/json-ld';
import { metaTags } from './plugins/meta-tags/meta-tags';
import { openGraph } from './plugins/open-graph/open-graph';
import { twitter } from './plugins/twitter/twitter';
import type { JsonLdMetadata } from './types/metadata';

const allPlugins = [metaTags, openGraph, twitter, jsonLd];

// ── Fixtures ──────────────────────────────────────────────────────────

// E-commerce product page — rich metadata from all sources
const ecommerceHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Wireless Noise-Cancelling Headphones — TechStore</title>
  <meta name="description" content="Premium wireless headphones with active noise cancellation, 30-hour battery life, and Hi-Res audio support. Free shipping on orders over $50.">
  <meta name="author" content="TechStore Editorial">
  <meta name="keywords" content="headphones, noise cancelling, wireless, bluetooth, audio, hi-res">
  <link rel="canonical" href="https://techstore.example.com/products/headphones-pro">
  <link rel="icon" href="/favicon.ico">

  <meta property="og:title" content="Wireless Noise-Cancelling Headphones">
  <meta property="og:description" content="Premium wireless headphones with active noise cancellation and 30-hour battery life.">
  <meta property="og:image" content="https://cdn.techstore.example.com/images/headphones-pro.jpg">
  <meta property="og:url" content="https://techstore.example.com/products/headphones-pro">
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="TechStore">
  <meta property="og:locale" content="en_US">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Wireless Noise-Cancelling Headphones">
  <meta name="twitter:description" content="Premium wireless headphones — 30hr battery, ANC, Hi-Res Audio">
  <meta name="twitter:image" content="https://cdn.techstore.example.com/images/headphones-pro.jpg">
  <meta name="twitter:site" content="@TechStore">
  <meta name="twitter:creator" content="@TechStoreEditorial">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Wireless Noise-Cancelling Headphones",
    "description": "Premium wireless headphones with active noise cancellation",
    "image": "https://cdn.techstore.example.com/images/headphones-pro.jpg",
    "brand": { "@type": "Brand", "name": "AudioMax" },
    "offers": {
      "@type": "Offer",
      "price": "299.99",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    }
  }
  </script>
</head>
<body></body>
</html>`;

// Video page — YouTube-style with oEmbed link
const videoPageHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Learn TypeScript in 60 Minutes — DevTube</title>
  <meta name="description" content="A comprehensive beginner-friendly tutorial covering TypeScript basics, types, interfaces, and generics.">
  <meta name="author" content="Jane Developer">
  <meta name="keywords" content="typescript, tutorial, programming, javascript, web development">
  <link rel="canonical" href="https://devtube.example.com/watch?v=abc123">
  <link rel="icon" href="https://devtube.example.com/favicon.png">
  <link type="application/json+oembed" href="https://devtube.example.com/oembed?url=https%3A%2F%2Fdevtube.example.com%2Fwatch%3Fv%3Dabc123&format=json">

  <meta property="og:title" content="Learn TypeScript in 60 Minutes">
  <meta property="og:description" content="A comprehensive beginner-friendly TypeScript tutorial.">
  <meta property="og:image" content="https://img.devtube.example.com/vi/abc123/maxresdefault.jpg">
  <meta property="og:url" content="https://devtube.example.com/watch?v=abc123">
  <meta property="og:type" content="video.other">
  <meta property="og:site_name" content="DevTube">
  <meta property="og:locale" content="en_US">

  <meta name="twitter:card" content="player">
  <meta name="twitter:title" content="Learn TypeScript in 60 Minutes">
  <meta name="twitter:description" content="TypeScript basics in one hour">
  <meta name="twitter:image" content="https://img.devtube.example.com/vi/abc123/maxresdefault.jpg">
  <meta name="twitter:site" content="@DevTube">
  <meta name="twitter:creator" content="@JaneDev">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": "Learn TypeScript in 60 Minutes",
    "description": "A comprehensive beginner-friendly TypeScript tutorial",
    "thumbnailUrl": "https://img.devtube.example.com/vi/abc123/maxresdefault.jpg",
    "uploadDate": "2024-06-15",
    "duration": "PT1H2M30S",
    "embedUrl": "https://devtube.example.com/embed/abc123",
    "author": { "@type": "Person", "name": "Jane Developer" }
  }
  </script>
</head>
<body></body>
</html>`;

// Blog article — JSON-LD @graph, long description
const longDesc =
  'TypeScript 5.0 introduces decorators, const type parameters, and all enums becoming union enums. This article walks through the most impactful changes for real-world production codebases. ';
const blogArticleHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>What Changed in TypeScript 5.0 — Dev Blog</title>
  <meta name="description" content="${longDesc.repeat(3)}">
  <meta name="author" content="Alex Kim">
  <meta name="keywords" content="TypeScript, TypeScript 5.0, decorators, frontend">
  <link rel="canonical" href="https://blog.example.com/ts-5">
  <link rel="icon" href="/assets/favicon.png">

  <meta property="og:title" content="What Changed in TypeScript 5.0">
  <meta property="og:description" content="Decorators, const type parameters, and more — a practical guide to TS 5.0.">
  <meta property="og:image" content="http://blog.example.com/images/ts5-cover.png">
  <meta property="og:url" content="https://blog.example.com/ts-5">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Dev Blog">
  <meta property="og:locale" content="en_US">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="What Changed in TypeScript 5.0">
  <meta name="twitter:description" content="TS 5.0 key changes summary">
  <meta name="twitter:image" content="http://blog.example.com/images/ts5-cover.png">
  <meta name="twitter:site" content="@devblog">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "name": "Dev Blog",
        "url": "https://blog.example.com"
      },
      {
        "@type": "Article",
        "headline": "What Changed in TypeScript 5.0",
        "author": { "@type": "Person", "name": "Alex Kim" },
        "datePublished": "2024-03-15",
        "description": "Practical guide to TypeScript 5.0 changes"
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://blog.example.com" },
          { "@type": "ListItem", "position": 2, "name": "TypeScript", "item": "https://blog.example.com/ts" }
        ]
      }
    ]
  }
  </script>
</head>
<body></body>
</html>`;

// Bare minimal HTML
const bareMinimalHTML = `<!DOCTYPE html>
<html>
<head><title>Simple Page</title></head>
<body><h1>Hello World</h1></body>
</html>`;

// OG-only SPA — protocol-relative image
const ogOnlyHTML = `<!DOCTYPE html>
<html>
<head>
  <meta property="og:title" content="SPA App">
  <meta property="og:description" content="A modern single page application">
  <meta property="og:image" content="//cdn.example.com/hero.webp">
  <meta property="og:site_name" content="MyApp">
</head>
<body><div id="root"></div></body>
</html>`;

// Conflicting sources — for priority testing
const conflictingHTML = `<!DOCTYPE html>
<html>
<head>
  <title>HTML Title</title>
  <meta name="description" content="HTML meta description">
  <meta property="og:title" content="OG Title">
  <meta property="og:description" content="OG description wins">
  <meta name="twitter:title" content="Twitter Title">
  <meta name="twitter:description" content="Twitter description">
</head>
<body></body>
</html>`;

// ── Tests ──────────────────────────────────────────────────────────────

describe('Integration: E-commerce product page', () => {
  it('extracts all core metadata correctly', async () => {
    const s = createScraper({ plugins: allPlugins });
    const result = await s.scrape(ecommerceHTML, {
      url: 'https://techstore.example.com/products/headphones-pro',
    });
    const { metadata } = result;

    expect(metadata.title).toBe('Wireless Noise-Cancelling Headphones');
    expect(metadata.description).toContain('noise cancellation');
    expect(metadata.image).toBe(
      'https://cdn.techstore.example.com/images/headphones-pro.jpg',
    );
    expect(metadata.url).toBe(
      'https://techstore.example.com/products/headphones-pro',
    );
    expect(metadata.type).toBe('product');
    expect(metadata.siteName).toBe('TechStore');
    expect(metadata.locale).toBe('en_US');
    expect(metadata.twitterCard).toBe('summary_large_image');
    expect(metadata.twitterSite).toBe('@TechStore');
    expect(metadata.twitterCreator).toBe('@TechStoreEditorial');
    expect(metadata.author).toBe('TechStore Editorial');
    expect(metadata.keywords).toContain('headphones');
    expect(metadata.keywords).toContain('noise cancelling');
    expect(metadata.keywords?.length).toBe(6);
  });

  it('resolves relative favicon to absolute URL', async () => {
    const s = createScraper({ plugins: allPlugins });
    const result = await s.scrape(ecommerceHTML, {
      url: 'https://techstore.example.com/products/headphones-pro',
    });

    expect(result.metadata.favicon).toBe(
      'https://techstore.example.com/favicon.ico',
    );
  });

  it('extracts JSON-LD Product with offers', async () => {
    const s = createScraper({ plugins: allPlugins });
    const result = await s.scrape(ecommerceHTML);
    const ld = result.metadata.jsonLd as JsonLdMetadata[];

    expect(ld).toHaveLength(1);
    expect(ld[0]['@type']).toBe('Product');
    expect(ld[0].name).toBe('Wireless Noise-Cancelling Headphones');
    const offers = ld[0].offers as Record<string, unknown>;
    expect(offers.price).toBe('299.99');
    expect(offers.priceCurrency).toBe('USD');
  });

  it('provides per-source raw data', async () => {
    const s = createScraper({ plugins: allPlugins });
    const result = await s.scrape(ecommerceHTML);

    expect(result.sources['meta-tags']).toBeDefined();
    expect(result.sources['open-graph']).toBeDefined();
    expect(result.sources.twitter).toBeDefined();
    expect(result.sources['json-ld']).toBeDefined();

    expect(result.sources['meta-tags'].title).toBe(
      'Wireless Noise-Cancelling Headphones — TechStore',
    );
    expect(result.sources['open-graph'].title).toBe(
      'Wireless Noise-Cancelling Headphones',
    );
    expect(result.sources.twitter.title).toBe(
      'Wireless Noise-Cancelling Headphones',
    );
  });
});

describe('Integration: Video page (rich metadata)', () => {
  it('extracts metadata from all sources', async () => {
    const s = createScraper({ plugins: allPlugins });
    const result = await s.scrape(videoPageHTML);
    const { metadata, sources } = result;

    expect(metadata.title).toBe('Learn TypeScript in 60 Minutes');
    expect(metadata.image).toBe(
      'https://img.devtube.example.com/vi/abc123/maxresdefault.jpg',
    );
    expect(metadata.url).toBe('https://devtube.example.com/watch?v=abc123');
    expect(metadata.type).toBe('video.other');
    expect(metadata.siteName).toBe('DevTube');
    expect(metadata.locale).toBe('en_US');
    expect(metadata.twitterCard).toBe('player');
    expect(metadata.twitterSite).toBe('@DevTube');
    expect(metadata.twitterCreator).toBe('@JaneDev');
    expect(metadata.author).toBe('Jane Developer');
    expect(metadata.keywords).toContain('typescript');

    expect(sources['meta-tags']).toBeDefined();
    expect(sources['open-graph']).toBeDefined();
    expect(sources.twitter).toBeDefined();
    expect(sources['json-ld']).toBeDefined();
  });

  it('extracts JSON-LD VideoObject', async () => {
    const s = createScraper({ plugins: allPlugins });
    const result = await s.scrape(videoPageHTML);
    const ld = result.metadata.jsonLd as JsonLdMetadata[];

    expect(ld).toHaveLength(1);
    expect(ld[0]['@type']).toBe('VideoObject');
    expect(ld[0].name).toBe('Learn TypeScript in 60 Minutes');
    expect(ld[0].duration).toBe('PT1H2M30S');
    expect(ld[0].uploadDate).toBe('2024-06-15');
  });
});

describe('Integration: Blog article (@graph + long description)', () => {
  it('extracts multiple entities from JSON-LD @graph', async () => {
    const s = createScraper({ plugins: allPlugins });
    const result = await s.scrape(blogArticleHTML);
    const ld = result.metadata.jsonLd as JsonLdMetadata[];

    expect(ld).toHaveLength(3);
    expect(ld[0]['@type']).toBe('WebSite');
    expect(ld[1]['@type']).toBe('Article');
    expect(ld[1].headline).toBe('What Changed in TypeScript 5.0');
    expect(ld[2]['@type']).toBe('BreadcrumbList');
  });

  it('converts http image to https (secureImages default)', async () => {
    const s = createScraper({ plugins: allPlugins });
    const result = await s.scrape(blogArticleHTML);

    expect(result.metadata.image).toBe(
      'https://blog.example.com/images/ts5-cover.png',
    );
  });

  it('keeps http when secureImages is false', async () => {
    const s = createScraper({
      plugins: allPlugins,
      postProcess: { secureImages: false },
    });
    const result = await s.scrape(blogArticleHTML);

    expect(result.metadata.image).toBe(
      'http://blog.example.com/images/ts5-cover.png',
    );
  });

  it('resolves relative favicon using page URL', async () => {
    const s = createScraper({ plugins: allPlugins });
    const result = await s.scrape(blogArticleHTML, {
      url: 'https://blog.example.com/ts-5',
    });

    expect(result.metadata.favicon).toBe(
      'https://blog.example.com/assets/favicon.png',
    );
  });
});

describe('Integration: Bare minimal HTML', () => {
  it('works with only a title tag', async () => {
    const s = createScraper({ plugins: allPlugins });
    const result = await s.scrape(bareMinimalHTML);

    expect(result.metadata.title).toBe('Simple Page');
    expect(result.metadata.image).toBeUndefined();
    expect(result.metadata.url).toBeUndefined();
    expect(result.metadata.twitterCard).toBeUndefined();
    expect(result.metadata.jsonLd).toBeUndefined();
  });
});

describe('Integration: OG-only SPA', () => {
  it('converts protocol-relative image to https', async () => {
    const s = createScraper({ plugins: allPlugins });
    const result = await s.scrape(ogOnlyHTML);

    expect(result.metadata.image).toBe('https://cdn.example.com/hero.webp');
  });

  it('falls back to siteName when title is missing', async () => {
    const noTitleHTML = `<html><head>
      <meta property="og:site_name" content="MySite">
    </head></html>`;

    const s = createScraper({ plugins: allPlugins });
    const result = await s.scrape(noTitleHTML);

    expect(result.metadata.title).toBe('MySite');
  });

  it('falls back to JSON-LD description', async () => {
    const noDescHTML = `<html><head>
      <script type="application/ld+json">
        {"@context":"https://schema.org","@type":"Product","name":"Widget","description":"A great widget"}
      </script>
    </head></html>`;

    const s = createScraper({ plugins: allPlugins });
    const result = await s.scrape(noDescHTML);

    expect(result.metadata.description).toBe('A great widget');
  });
});

describe('Integration: Source priority conflicts', () => {
  it('title priority: OG > meta-tags > twitter', async () => {
    const s = createScraper({ plugins: allPlugins });
    const result = await s.scrape(conflictingHTML);

    expect(result.metadata.title).toBe('OG Title');
    expect(result.sources['meta-tags'].title).toBe('HTML Title');
    expect(result.sources['open-graph'].title).toBe('OG Title');
    expect(result.sources.twitter.title).toBe('Twitter Title');
  });

  it('description priority: OG > meta-tags > twitter', async () => {
    const s = createScraper({ plugins: allPlugins });
    const result = await s.scrape(conflictingHTML);

    expect(result.metadata.description).toBe('OG description wins');
  });

  it('custom rules can reverse priority', async () => {
    const s = createScraper({
      plugins: allPlugins,
      rules: [
        {
          field: 'title',
          sources: [
            { plugin: 'twitter', key: 'title', priority: 3 },
            { plugin: 'meta-tags', key: 'title', priority: 2 },
            { plugin: 'open-graph', key: 'title', priority: 1 },
          ],
        },
      ],
    });
    const result = await s.scrape(conflictingHTML);

    expect(result.metadata.title).toBe('Twitter Title');
  });
});

describe('Integration: scrape() one-liner API', () => {
  it('uses default 4 plugins', async () => {
    const result = await scrape(ecommerceHTML);

    expect(result.metadata.title).toBe('Wireless Noise-Cancelling Headphones');
    expect(result.sources['open-graph']).toBeDefined();
    expect(result.sources['meta-tags']).toBeDefined();
    expect(result.sources.twitter).toBeDefined();
    expect(result.sources['json-ld']).toBeDefined();
  });

  it('accepts custom config', async () => {
    const result = await scrape(blogArticleHTML, {
      postProcess: { maxDescriptionLength: 50 },
    });

    expect(result.metadata.description?.length).toBeLessThanOrEqual(53);
  });
});

describe('Integration: postProcess options', () => {
  it('omitEmpty: false preserves sources with empty values', async () => {
    const s = createScraper({
      plugins: [metaTags],
      postProcess: { omitEmpty: false },
    });
    const result = await s.scrape('<html><head><title>X</title></head></html>');

    expect(result.sources['meta-tags']).toHaveProperty('description');
    expect(result.sources['meta-tags'].description).toBe('');
  });

  it('fallbacks: false skips siteName to title fallback', async () => {
    const html = `<html><head>
      <meta property="og:site_name" content="MySite">
    </head></html>`;

    const s = createScraper({
      plugins: [openGraph],
      postProcess: { fallbacks: false },
    });
    const result = await s.scrape(html);

    expect(result.metadata.title).toBeUndefined();
    expect(result.metadata.siteName).toBe('MySite');
  });

  it('custom maxDescriptionLength', async () => {
    const s = createScraper({
      plugins: allPlugins,
      postProcess: { maxDescriptionLength: 30 },
    });
    const result = await s.scrape(ecommerceHTML);

    expect(result.metadata.description?.length).toBeLessThanOrEqual(33);
    expect(result.metadata.description?.endsWith('...')).toBe(true);
  });
});

describe('Integration: Custom plugin', () => {
  it('user-defined plugin works alongside built-in plugins', async () => {
    const pricePlugin = (ctx: ScrapeContext) => {
      const price = ctx
        .$('meta[property="product:price:amount"]')
        .attr('content');
      return {
        name: 'price',
        data: price ? { price, currency: 'KRW' } : {},
      };
    };

    const html = `<html><head>
      <title>Product</title>
      <meta property="product:price:amount" content="29900">
    </head></html>`;

    const s = createScraper({ plugins: [metaTags, pricePlugin] });
    const result = await s.scrape(html);

    expect(result.metadata.title).toBe('Product');
    expect(result.sources.price).toEqual({
      price: '29900',
      currency: 'KRW',
    });
  });
});
