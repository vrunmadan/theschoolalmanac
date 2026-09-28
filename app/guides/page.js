import { getAllGuides } from '@/lib/guides';

export const metadata = {
  title: 'Guides — choosing an international school in India',
  description:
    "Independent guides on choosing an international-curriculum school in India: curricula compared, relocation planning for NRI families, and how to evaluate a school beyond the brochure.",
  alternates: { canonical: '/guides' },
};

export default function GuidesIndex() {
  const guides = getAllGuides();

  return (
    <main className="wrap" style={{ paddingBottom: 60 }}>
      <p style={{ margin: '20px 0 6px' }}><a href="/">← All schools</a></p>
      <section className="hero" style={{ padding: '28px 0 12px' }}>
        <div className="eyebrow">Guides</div>
        <h1>Choosing a school, explained plainly</h1>
        <p className="small muted" style={{ marginTop: 10, maxWidth: 600 }}>
          Independent guides — never sponsored, never tied to which school pays us anything. When a guide
          sends you somewhere, it sends you to compare schools yourself, not to one we&apos;d recommend.
        </p>
      </section>
      <div className="grid">
        {guides.map((g) => (
          <a
            key={g.slug}
            href={`/guides/${g.slug}`}
            className="card"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="eyebrow" style={{ marginBottom: 0 }}>{g.category}</div>
            <h3>{g.title}</h3>
            <p className="small muted" style={{ margin: 0 }}>{g.description}</p>
            <div className="small muted" style={{ marginTop: 'auto' }}>Updated {g.updated}</div>
          </a>
        ))}
      </div>
    </main>
  );
}
