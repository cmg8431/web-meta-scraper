import { useState } from 'react';

type TabId = 'preview' | 'metadata' | 'sources';

interface ScrapedData {
  metadata: Record<string, unknown>;
  sources: Record<string, Record<string, unknown>>;
}

function MetadataPreview({ data }: { data: ScrapedData }) {
  const m = data.metadata;
  const image = m.image as string | undefined;
  const title = m.title as string | undefined;
  const description = m.description as string | undefined;
  const siteName = m.siteName as string | undefined;
  const url = m.url as string | undefined;
  const favicons = m.favicons as { url: string; sizes?: string; type?: string }[] | undefined;
  const feedList = m.feeds as { url: string; title?: string; type: string }[] | undefined;
  const robots = m.robots as Record<string, unknown> | undefined;

  return (
    <div className="flex flex-col gap-5">
      {/* OG Preview Card */}
      <div className="overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
        {image && (
          <img
            src={image}
            alt={title || 'OG Image'}
            className="h-48 w-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div className="p-4">
          {siteName && <p className="mb-1 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">{siteName}</p>}
          {title && <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>}
          {description && <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>}
          {url && <p className="mt-2 truncate text-xs text-gray-400 dark:text-gray-500">{url}</p>}
        </div>
      </div>

      {/* Favicons */}
      {favicons && favicons.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Favicons ({favicons.length})</h4>
          <div className="flex flex-wrap gap-3">
            {favicons.map((f, i) => (
              <div key={i} className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-xs dark:border-gray-700">
                {f.type !== 'manifest' && (
                  <img
                    src={f.url}
                    alt="favicon"
                    className="h-4 w-4"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <span className="max-w-[200px] truncate text-gray-600 dark:text-gray-400">{f.sizes || f.type || 'icon'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feeds */}
      {feedList && feedList.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Feeds ({feedList.length})</h4>
          <div className="flex flex-col gap-1">
            {feedList.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs font-medium uppercase text-orange-700 dark:bg-orange-900 dark:text-orange-300">{f.type}</span>
                <span className="truncate text-gray-600 dark:text-gray-400">{f.title || f.url}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Robots */}
      {robots && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Robots</h4>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Indexable', value: robots.isIndexable },
              { label: 'Followable', value: robots.isFollowable },
              { label: 'No Archive', value: robots.noarchive },
              { label: 'No Snippet', value: robots.nosnippet },
              { label: 'No Image Index', value: robots.noimageindex },
              { label: 'No Translate', value: robots.notranslate },
            ].map(({ label, value }) => (
              <span
                key={label}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  value
                    ? label.startsWith('No') ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {label}: {value ? 'Yes' : 'No'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Playground() {
  const [url, setUrl] = useState('https://github.com/cmg8431/web-meta-scraper');
  const [data, setData] = useState<ScrapedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('preview');

  const handleScrape = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to scrape');
      }

      setData(json);
      setActiveTab('preview');
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

  const tabs: { id: TabId; label: string }[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'metadata', label: 'Metadata' },
    { id: 'sources', label: 'Sources' },
  ];

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

      {data && (
        <>
          <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-current text-gray-900 dark:text-gray-100'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'preview' && <MetadataPreview data={data} />}

          {activeTab === 'metadata' && (
            <pre className="max-h-[600px] overflow-auto rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
              {JSON.stringify(data.metadata, null, 2)}
            </pre>
          )}

          {activeTab === 'sources' && (
            <pre className="max-h-[600px] overflow-auto rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
              {JSON.stringify(data.sources, null, 2)}
            </pre>
          )}
        </>
      )}
    </div>
  );
}
