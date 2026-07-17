import { notFound } from 'next/navigation';
import { getCities, getSchoolsByCitySlug, byEnrichedFirst, slugify } from '@/lib/schools';
import SchoolCard from '@/app/components/SchoolCard';
import JsonLd from '@/app/components/JsonLd';

const SITE = 'https://theschoolalmanac.com';

export function generateStaticParams() {
  return getCities().map((c) => ({ slug: slugify(c) }));
}

export function generateMetadata({ params }) {
  const schools = getSchoolsByCitySlug(params.slug);
  const city = schools[0]?.city || params.slug;
  return {
    title: `International schools in ${city} — fees & verified reviews`,
    description: `Compare ${schools.length} IGCSE, IB and A-Level schools in ${city} with verified fees, curricula and a Last Verified date on every school. Neutral and never pay-to-rank.`,
    alternates: { canonical: `/city/${params.slug}` },
  };
}

export default function CityHub({ params }) {
  const schools = byEnrichedFirst(getSchoolsByCitySlug(params.slug));
  if (!schools.length) notFound();
  const city = schools[0].city;
  const enriched = schools.filter((s) => s.tier === 'enriched').length;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `International schools in ${city}`,
    url: `${SITE}/city/${params.slug}`,
    isPartOf: { '@id': `${SITE}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: schools.length,
      itemListElement: schools.slice(0, 100).map((s, i) => ({
        '@type': 'ListItem', position: i + 1, name: s.name, url: `${SITE}/schools/${s.slug}`,
      })),
    },
  };

  return (
    <main className="wrap" style={{ paddingBottom: 60 }}>
      <JsonLd data={jsonLd} />
      <p style={{ margin: '20px 0 6px' }}><a href="/">← All schools</a></p>
      <section className="hero" style={{ padding: '28px 0 12px' }}>
        <div className="eyebrow">City guide</div>
        <h1>International schools in {city}</h1>
        <p className="small muted" style={{ marginTop: 10 }}>
          <b style={{ color: 'var(--ink)' }}>{schools.length}</b> schools · <b style={{ color: 'var(--ink)' }}>{enriched}</b> with verified fees · 0 paid rankings, ever
        </p>
      </section>
      <div className="grid">
        {schools.map((s) => <SchoolCard key={s.id} s={s} />)}
      </div>
    </main>
  );
}
