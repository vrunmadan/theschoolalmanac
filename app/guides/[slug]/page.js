import { notFound } from 'next/navigation';
import { getAllGuides, getGuideBySlug } from '@/lib/guides';
import ArticleBody from '@/app/components/ArticleBody';
import JsonLd from '@/app/components/JsonLd';

const SITE = 'https://theschoolalmanac.com';

export function generateStaticParams() {
  return getAllGuides().map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }) {
  const g = getGuideBySlug(params.slug);
  if (!g) return { title: 'Guide not found - The School Almanac' };
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: `/guides/${g.slug}` },
  };
}

export default function GuidePage({ params }) {
  const g = getGuideBySlug(params.slug);
  if (!g) notFound();

  const canonical = `${SITE}/guides/${g.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': canonical + '#article',
        headline: g.title,
        description: g.description,
        url: canonical,
        dateModified: g.updated,
        publisher: { '@id': `${SITE}/#org` },
        isPartOf: { '@id': `${SITE}/#website` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Guides', item: `${SITE}/guides` },
          { '@type': 'ListItem', position: 2, name: g.title, item: canonical },
        ],
      },
    ],
  };

  return (
    <main className="wrap" style={{ paddingBottom: 60 }}>
      <JsonLd data={jsonLd} />
      <p style={{ margin: '20px 0 6px' }}><a href="/guides">← All guides</a></p>
      <article className="card" style={{ maxWidth: 760, padding: '28px 32px' }}>
        <div className="eyebrow">{g.category}</div>
        <h1 style={{ fontSize: 34, margin: '10px 0 6px', lineHeight: 1.15 }}>{g.title}</h1>
        <p className="small muted" style={{ marginBottom: 18 }}>Updated {g.updated}</p>
        <ArticleBody sections={g.sections} />
      </article>
    </main>
  );
}
