import './globals.css';

const SITE = 'https://theschoolalmanac.com';
const DESC =
  "The verified, neutral guide to India's international-curriculum schools (IGCSE, IB, A-Level, Cambridge). Real fees, real facts, a Last Verified date on every school.";

export const metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'The School Almanac — Every international school, verified',
    template: '%s · The School Almanac',
  },
  description: DESC,
  applicationName: 'The School Almanac',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'The School Almanac — Every international school, verified',
    description: DESC,
    url: SITE,
    siteName: 'The School Almanac',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'The School Almanac', description: DESC },
};

const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE}/#org`,
      name: 'The School Almanac',
      url: SITE,
      description: DESC,
      slogan: 'Choose your child’s school with the facts, not the marketing.',
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      name: 'The School Almanac',
      url: SITE,
      publisher: { '@id': `${SITE}/#org` },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
      </head>
      <body>
        <header className="site-header">
          <div className="wrap nav">
            <a href="/" className="logo"><span className="mark">✓</span>The School Almanac</a>
            <div className="spacer" />
            <span className="verified-note"><span className="vdot" />Every school shows when we last checked it</span>
          </div>
        </header>
        {children}
        <footer className="site">
          <div className="wrap">
            <b style={{ color: 'var(--ink)' }}>Our promise:</b> schools can never buy placement or ranking —
            position is driven by verified parent ratings alone. We publish fees plainly, flag uncertainty,
            and never sell parent data.
          </div>
        </footer>
      </body>
    </html>
  );
}
