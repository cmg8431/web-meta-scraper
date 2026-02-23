import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url field is required' });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const {
      createScraper,
      metaTags,
      openGraph,
      twitter,
      jsonLd,
      favicons,
      feeds,
      robots,
    } = await import('web-meta-scraper');

    const scraper = createScraper({
      plugins: [metaTags, openGraph, twitter, jsonLd, favicons, feeds, robots],
    });

    const result = await scraper.scrapeUrl(url);
    return res.status(200).json(result);
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Scrape failed' });
  }
}
