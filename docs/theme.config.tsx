import { useRouter } from 'next/router';
import type { DocsThemeConfig } from 'nextra-theme-docs';
import { useConfig } from 'nextra-theme-docs';

const config: DocsThemeConfig = {
  project: {
    link: 'https://github.com/cmg8431/web-meta-scraper',
  },
  docsRepositoryBase: 'https://github.com/cmg8431/web-meta-scraper/tree/main/docs',
  useNextSeoProps() {
    const { asPath } = useRouter();
    if (asPath !== '/') {
      return {
        titleTemplate: '%s – web-meta-scraper',
      };
    }
  },
  logo: (
    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
      web-meta-scraper
    </span>
  ),
  head: function useHead() {
    const { title } = useConfig();

    return (
      <>
        <meta name="msapplication-TileColor" content="#fff" />
        <meta name="theme-color" content="#fff" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Language" content="en" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="og:title"
          content={title ? title + ' – web-meta-scraper' : 'web-meta-scraper'}
        />
        <meta name="apple-mobile-web-app-title" content="web-meta-scraper" />
      </>
    );
  },
  sidebar: {
    titleComponent({ title, type }) {
      if (type === 'separator') {
        return <span className="cursor-default">{title}</span>;
      }
      return <>{title}</>;
    },
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  footer: {
    text: function useText() {
      return (
        <div className="flex w-full flex-col items-center sm:items-start">
          <div>
            <a
              className="flex items-center gap-1 text-current"
              target="_blank"
              rel="noopener noreferrer"
              title="github"
              href="https://github.com/cmg8431"
            >
              <span>Powered by</span> @cmg8431
            </a>
          </div>
          <p className="mt-6 text-xs">
            © {new Date().getFullYear()} The Web-Meta-scraper Project.
          </p>
        </div>
      );
    },
  },
  toc: {
    backToTop: true,
  },
  i18n: [
    { locale: 'en', text: 'English' },
    { locale: 'ko', text: '한국어' },
  ],
};

export default config;
