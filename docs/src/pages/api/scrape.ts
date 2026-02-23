import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, action, stealth } = req.body;

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
      date,
      logo,
      lang,
      video,
      audio,
      iframe,
      validateMetadata,
      extractContent,
    } = await import('web-meta-scraper');

    const fetchOptions = stealth ? { stealth: true } : undefined;

    if (action === 'extract') {
      const content = await extractContent(url, fetchOptions);
      return res.status(200).json(content);
    }

    const scraper = createScraper({
      plugins: [metaTags, openGraph, twitter, jsonLd, favicons, feeds, robots, date, logo, lang, video, audio, iframe],
      fetch: fetchOptions,
    });

    const result = await scraper.scrapeUrl(url);

    if (action === 'validate') {
      const validation = validateMetadata(result);
      return res.status(200).json(validation);
    }

    return res.status(200).json(result);
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Scrape failed' });
  }
}
