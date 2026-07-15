import { notFound } from 'next/navigation';
import { getBoards, getSchoolsByBoardSlug, byEnrichedFirst, slugify } from '@/lib/schools';
import SchoolCard from '@/app/components/SchoolCard';

export function generateStaticParams() {
  return getBoards().map((b) => ({ slug: slugify(b) }));
}

function boardName(slug) {
  return getBoards().find((b) => slugify(b) === slug) || slug;
}

export function generateMetadata({ params }) {
  const name = boardName(params.slug);
  const schools = getSchoolsByBoardSlug(params.slug);
  return {
    title: `${name} schools in India — fees & verified reviews | The School Almanac`,
    description: `Every ${name} school in India in one place: ${schools.length} schools with verified fees, curricula and a Last Verified date. Neutral, parent-first, never pay-to-rank.`,
  };
}

export default function CurriculumHub({ params }) {
  const name = boardName(params.slug);
  const schools = byEnrichedFirst(getSchoolsByBoardSlug(params.slug));
  if (!schools.length) notFound();
  const enriched = schools.filter((s) => s.tier === 'enriched').length;

  return (
    <main className="wrap" style={{ paddingBottom: 60 }}>
      <p style={{ margin: '20px 0 6px' }}><a href="/">← All schools</a></p>
      <section className="hero" style={{ padding: '28px 0 12px' }}>
        <div className="eyebrow">Curriculum guide</div>
        <h1>{name} schools in India</h1>
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
