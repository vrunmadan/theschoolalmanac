import { getAllSchools, getCities, getBoards, slugify } from '@/lib/schools';
import Directory from '@/app/components/Directory';

export default function HomePage() {
  const schools = getAllSchools();
  const cities = getCities();
  const boards = getBoards();
  const withFees = schools.filter((s) => s.tuition).length;

  const cityCounts = {};
  for (const s of schools) if (s.city) cityCounts[s.city] = (cityCounts[s.city] || 0) + 1;
  const topCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 18);

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

      <section style={{ margin: '4px 0 22px' }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Browse by curriculum</div>
        <div className="badges">
          {boards.map((b) => <a key={b} className="chip" href={`/curriculum/${slugify(b)}`}>{b}</a>)}
        </div>
        <div className="eyebrow" style={{ margin: '16px 0 8px' }}>Browse by city</div>
        <div className="badges">
          {topCities.map(([c, n]) => <a key={c} className="chip" href={`/city/${slugify(c)}`}>{c} · {n}</a>)}
        </div>
      </section>

      <Directory schools={schools} cities={cities} boards={boards} />
    </main>
  );
}
