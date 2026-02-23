import { useState } from 'react';

export function Playground() {
  const [url, setUrl] = useState('https://github.com/cmg8431/web-meta-scraper');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScrape = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to scrape');
      }

      setResult(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setError(e.message || 'Failed to scrape');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && url.trim()) {
      handleScrape();
    }
  };

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://example.com"
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
          spellCheck={false}
        />
        <button
          onClick={handleScrape}
          disabled={loading || !url.trim()}
          className="shrink-0 rounded-lg border-2 border-current px-6 py-2.5 text-sm font-medium hover:opacity-70 disabled:opacity-30"
          type="button"
        >
          {loading ? 'Scraping...' : 'Scrape'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {result && (
        <pre className="max-h-[600px] overflow-auto rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
          {result}
        </pre>
      )}
    </div>
  );
}
