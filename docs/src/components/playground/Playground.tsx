import { useState } from 'react';

type TabId = 'preview' | 'metadata' | 'sources' | 'validation' | 'content';

interface ScrapedData {
  metadata: Record<string, unknown>;
  sources: Record<string, Record<string, unknown>>;
}

interface ValidationData {
  score: number;
  issues: { severity: string; category: string; field: string; message: string }[];
  summary: { errors: number; warnings: number; info: number };
}

interface ContentData {
  content: string;
  metadata: { title: string; description: string };
  wordCount: number;
  language: string;
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
  const date = m.date as string | undefined;
  const dateModified = m.dateModified as string | undefined;
  const logo = m.logo as string | undefined;
  const lang = m.lang as string | undefined;
  const videos = m.videos as { url: string; type?: string; width?: number; height?: number }[] | undefined;
  const audioList = m.audio as { url: string; type?: string }[] | undefined;
  const iframe = m.iframe as string | undefined;

  return (
    <div className="flex flex-col gap-5">
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

      {/* Meta Info Badges */}
      {(lang || date || dateModified || logo) && (
        <div className="flex flex-wrap gap-2">
          {lang && (
            <span className="rounded-md border border-gray-200 px-2.5 py-1 text-xs dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400">Lang: </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{lang}</span>
            </span>
          )}
          {date && (
            <span className="rounded-md border border-gray-200 px-2.5 py-1 text-xs dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400">Published: </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{new Date(date).toLocaleDateString()}</span>
            </span>
          )}
          {dateModified && (
            <span className="rounded-md border border-gray-200 px-2.5 py-1 text-xs dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400">Modified: </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{new Date(dateModified).toLocaleDateString()}</span>
            </span>
          )}
          {logo && (
            <span className="flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1 text-xs dark:border-gray-700">
              <img src={logo} alt="logo" className="h-4 w-4" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <span className="text-gray-500 dark:text-gray-400">Logo</span>
            </span>
          )}
        </div>
      )}

      {/* Videos */}
      {videos && videos.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Videos ({videos.length})</h4>
          <div className="flex flex-col gap-1">
            {videos.map((v, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">{v.type || 'video'}</span>
                {v.width && v.height && <span className="text-xs text-gray-400">{v.width}x{v.height}</span>}
                <span className="truncate text-gray-600 dark:text-gray-400">{v.url}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audio */}
      {audioList && audioList.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Audio ({audioList.length})</h4>
          <div className="flex flex-col gap-1">
            {audioList.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">{a.type || 'audio'}</span>
                <span className="truncate text-gray-600 dark:text-gray-400">{a.url}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Iframe Embed */}
      {iframe && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Embed</h4>
          <pre className="overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">{iframe}</pre>
        </div>
      )}

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

function ScoreRing({ score }: { score: number }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-700" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          transform="rotate(-90 50 50)" className="transition-all duration-500"
        />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
          className="fill-gray-900 text-2xl font-bold dark:fill-gray-100" fontSize="24"
        >{score}</text>
      </svg>
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">SEO Score</span>
    </div>
  );
}

function ValidationView({ data }: { data: ValidationData }) {
  const severityStyles: Record<string, string> = {
    error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
    info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
  };

  const severityLabels: Record<string, string> = {
    error: 'Error',
    warning: 'Warning',
    info: 'Info',
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-6">
        <ScoreRing score={data.score} />
        <div className="flex gap-4">
          {data.summary.errors > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="text-gray-700 dark:text-gray-300">{data.summary.errors} errors</span>
            </div>
          )}
          {data.summary.warnings > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
              <span className="text-gray-700 dark:text-gray-300">{data.summary.warnings} warnings</span>
            </div>
          )}
          {data.summary.info > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-gray-700 dark:text-gray-300">{data.summary.info} info</span>
            </div>
          )}
          {data.issues.length === 0 && (
            <span className="text-sm text-green-600 dark:text-green-400">No issues found</span>
          )}
        </div>
      </div>

      {data.issues.length > 0 && (
        <div className="flex flex-col gap-2">
          {data.issues.map((issue, i) => (
            <div key={i} className={`rounded-lg border p-3 text-sm ${severityStyles[issue.severity] ?? ''}`}>
              <div className="flex items-center gap-2">
                <span className="rounded px-1.5 py-0.5 text-xs font-semibold uppercase opacity-80">{severityLabels[issue.severity]}</span>
                <span className="font-mono text-xs opacity-60">{issue.field}</span>
              </div>
              <p className="mt-1">{issue.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ContentView({ data }: { data: ContentData }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        {data.language && (
          <div className="rounded-md border border-gray-200 px-3 py-1.5 text-xs dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">Language: </span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{data.language}</span>
          </div>
        )}
        <div className="rounded-md border border-gray-200 px-3 py-1.5 text-xs dark:border-gray-700">
          <span className="text-gray-500 dark:text-gray-400">Words: </span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{data.wordCount.toLocaleString()}</span>
        </div>
        {data.metadata.title && (
          <div className="rounded-md border border-gray-200 px-3 py-1.5 text-xs dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">Title: </span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{data.metadata.title}</span>
          </div>
        )}
      </div>
      <div className="max-h-[500px] overflow-auto rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm leading-relaxed text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
        {data.content || <span className="italic text-gray-400">No content extracted</span>}
      </div>
    </div>
  );
}

export function Playground() {
  const [url, setUrl] = useState('https://github.com/cmg8431/web-meta-scraper');
  const [stealth, setStealth] = useState(false);
  const [data, setData] = useState<ScrapedData | null>(null);
  const [validation, setValidation] = useState<ValidationData | null>(null);
  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('preview');

  const fetchAction = async (action?: string) => {
    const res = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, action, stealth }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Request failed');
    return json;
  };

  const handleScrape = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    setValidation(null);
    setContent(null);

    try {
      const [scrapeResult, validationResult, contentResult] = await Promise.all([
        fetchAction(),
        fetchAction('validate'),
        fetchAction('extract'),
      ]);

      setData(scrapeResult);
      setValidation(validationResult);
      setContent(contentResult);
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

  const tabs: { id: TabId; label: string; ready: boolean }[] = [
    { id: 'preview', label: 'Preview', ready: !!data },
    { id: 'validation', label: 'Validation', ready: !!validation },
    { id: 'content', label: 'Content', ready: !!content },
    { id: 'metadata', label: 'Metadata', ready: !!data },
    { id: 'sources', label: 'Sources', ready: !!data },
  ];

  const hasResult = data || validation || content;

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

      <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <input
          type="checkbox"
          checked={stealth}
          onChange={(e) => setStealth(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
        />
        Stealth mode
        <span className="text-xs text-gray-400 dark:text-gray-500">(HTTP/2 + browser TLS fingerprint)</span>
      </label>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {hasResult && (
        <>
          <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
            {tabs.filter(t => t.ready).map((tab) => (
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

          {activeTab === 'preview' && data && <MetadataPreview data={data} />}

          {activeTab === 'validation' && validation && <ValidationView data={validation} />}

          {activeTab === 'content' && content && <ContentView data={content} />}

          {activeTab === 'metadata' && data && (
            <pre className="max-h-[600px] overflow-auto rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
              {JSON.stringify(data.metadata, null, 2)}
            </pre>
          )}

          {activeTab === 'sources' && data && (
            <pre className="max-h-[600px] overflow-auto rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
              {JSON.stringify(data.sources, null, 2)}
            </pre>
          )}
        </>
      )}
    </div>
  );
}
