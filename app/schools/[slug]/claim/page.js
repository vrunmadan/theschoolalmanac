import { notFound } from 'next/navigation';
import { getSchoolBySlug } from '@/lib/schools';
import ClaimForm from '@/app/components/ClaimForm';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }) {
  const s = getSchoolBySlug(params.slug);
  return { title: s ? `Claim ${s.name} — The School Almanac` : 'Claim listing', robots: { index: false } };
}

export default function ClaimPage({ params }) {
  const s = getSchoolBySlug(params.slug);
  if (!s) notFound();
  return (
    <main className="wrap" style={{ paddingBottom: 60, maxWidth: 640 }}>
      <p style={{ margin: '20px 0 6px' }}><a href={`/schools/${s.slug}`}>← Back to {s.name}</a></p>
      <section className="hero" style={{ padding: '20px 0 12px' }}>
        <div className="eyebrow">For schools</div>
        <h1 style={{ fontSize: 28 }}>Claim your listing</h1>
        <p className="small muted" style={{ marginTop: 8 }}>
          Take ownership of {s.name}’s profile to state your official fees. Parent-reported fees and reviews stay independent — we show both, side by side, and never let a school hide them.
        </p>
      </section>
      <ClaimForm slug={s.slug} schoolName={s.name} />
    </main>
  );
}
