import { getAllSchools, getCities, getBoards } from '@/lib/schools';
import Directory from '@/app/components/Directory';

export default function HomePage() {
  const schools = getAllSchools();
  const cities = getCities();
  const boards = getBoards();
  const withFees = schools.filter((s) => s.tuition).length;

  return (
    <main className="wrap">
      <section className="hero">
        <div className="eyebrow">The verified guide to India&apos;s international schools</div>
        <h1>Choose your child&apos;s school with the facts, not the marketing.</h1>
        <p>Real fees. Real curricula. A Last&nbsp;Verified date on every school. Neutral, parent-first,
          and never pay-to-rank.</p>
        <p className="small muted" style={{ marginTop: 18 }}>
          <b style={{ color: 'var(--ink)' }}>{schools.length}</b> verified schools ·{' '}
          <b style={{ color: 'var(--ink)' }}>{cities.length}</b> cities ·{' '}
          <b style={{ color: 'var(--ink)' }}>{withFees}</b> with transparent fees · 0 paid rankings, ever
        </p>
      </section>
      <Directory schools={schools} cities={cities} boards={boards} />
    </main>
  );
}
