import { notFound } from 'next/navigation';
import { getSchoolBySlug } from '@/lib/schools';
import FeeDashboard from '@/app/components/FeeDashboard';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }) {
  const s = getSchoolBySlug(params.slug);
  return { title: s ? `${s.name} — fee dashboard` : 'Dashboard', robots: { index: false } };
}

export default function DashboardPage({ params }) {
  const s = getSchoolBySlug(params.slug);
  if (!s) notFound();
  return (
    <main className="wrap" style={{ paddingBottom: 60, maxWidth: 640 }}>
      <p style={{ margin: '20px 0 6px' }}><a href={`/schools/${s.slug}`}>← Back to {s.name}</a></p>
      <section className="hero" style={{ padding: '20px 0 12px' }}>
        <div className="eyebrow">School dashboard</div>
        <h1 style={{ fontSize: 28 }}>Fee dashboard</h1>
      </section>
      <FeeDashboard slug={s.slug} schoolName={s.name} />
    </main>
  );
}
