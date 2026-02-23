import { describe, expect, it } from 'vitest';
import { createContext } from '../../core/context';
import type { JsonLdMetadata } from '../../types/metadata';
import { jsonLd } from './json-ld';

async function run(html: string) {
  const ctx = createContext(html, undefined, {});
  return await jsonLd(ctx);
}

describe('jsonLd plugin', () => {
  it('returns PluginResult with name "json-ld"', async () => {
    const result = await run('<html></html>');
    expect(result.name).toBe('json-ld');
  });

  it('retrieves single json-ld if html has it', async () => {
    const html = `
     <!DOCTYPE html>
     <html>
       <head>
         <script type="application/ld+json">
           {
             "@context": "https://schema.org",
             "@type": "Article",
             "headline": "Test Article",
             "datePublished": "2024-02-02"
           }
         </script>
       </head>
       <body></body>
     </html>
   `;

    const result = await run(html);
    const data = result.data.jsonLd as JsonLdMetadata[];
    expect(data.length).toBe(1);
    expect(data[0]['@type']).toBe('Article');
    expect(data[0].headline).toBe('Test Article');
    expect(data[0].datePublished).toBe('2024-02-02');
  });

  it('retrieves multiple json-ld scripts', async () => {
    const html = `
     <!DOCTYPE html>
     <html>
       <head>
         <script type="application/ld+json">
           {
             "@context": "https://schema.org",
             "@type": "Event",
             "name": "Test Event"
           }
         </script>
         <script type="application/ld+json">
           {
             "@context": "https://schema.org",
             "@type": "BreadcrumbList",
             "itemListElement": []
           }
         </script>
       </head>
       <body></body>
     </html>
   `;

    const result = await run(html);
    const data = result.data.jsonLd as JsonLdMetadata[];
    expect(data.length).toBe(2);
    expect(data[0]['@type']).toBe('Event');
    expect(data[1]['@type']).toBe('BreadcrumbList');
  });

  it('handles json-ld with @graph syntax', async () => {
    const html = `
     <!DOCTYPE html>
     <html>
       <head>
         <script type="application/ld+json">
           {
             "@context": "https://schema.org",
             "@graph": [
               {
                 "@type": "Organization",
                 "name": "Test Org"
               },
               {
                 "@type": "Person",
                 "name": "John Doe"
               }
             ]
           }
         </script>
       </head>
       <body></body>
     </html>
   `;

    const result = await run(html);
    const data = result.data.jsonLd as JsonLdMetadata[];
    expect(data.length).toBe(2);
    expect(data[0]['@type']).toBe('Organization');
    expect(data[1]['@type']).toBe('Person');
  });

  it('returns empty array for invalid json-ld', async () => {
    const html = `
     <!DOCTYPE html>
     <html>
       <head>
         <script type="application/ld+json">
           {invalid json}
         </script>
       </head>
       <body></body>
     </html>
   `;

    const result = await run(html);
    expect(result.data.jsonLd).toEqual([]);
  });

  it('handles empty html without json-ld', async () => {
    const html = `
     <!DOCTYPE html>
     <html>
       <head></head>
       <body></body>
     </html>
   `;

    const result = await run(html);
    expect(result.data.jsonLd).toEqual([]);
  });
});
