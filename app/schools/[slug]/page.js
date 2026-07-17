import { notFound } from 'next/navigation';
import { getAllSchools, getSchoolBySlug, slugify } from '@/lib/schools';
import SchoolReviews from '@/app/components/SchoolReviews';
import FeesPanel from '@/app/components/FeesPanel';
import MapBlock from '@/app/components/MapBlock';

const SITE = 'https://theschoolalmanac.com';

export function generateStaticParams() {
  return getAllSchools().map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }) {
  const s = getSchoolBySlug(params.slug);
  if (!s) return { title: 'School not found - The School Almanac' };
  return {
    title: `${s.name} - fees, curricula and verified parent reviews`,
    description: `${s.name} in ${s.area || s.city}: ${(s.boards || []).join(', ')}. ${s.summary || ''} Last verified ${s.verified}.`,
  };
}

function isCaveaty(s) {
  return /verify|unverified|confirm|low confidence|ambiguous|reference|per aggregator/i.test((s.summary || '') + (s.tuition || ''));
}

export default function SchoolPage({ params }) {
  const s = getSchoolBySlug(params.slug);
  if (!s) notFound();

  const cityHref = `/city/${s.citySlug || slugify(s.city || '')}`;
  const firstBoard = (s.boards || [])[0] || null;
  const boardHref = firstBoard ? `/curriculum/${slugify(firstBoard)}` : null;
  const trustNote = isCaveaty(s)
    ? 'Some details here come from aggregators or need direct confirmation. We flag rather than hide uncertainty - verify with the school before deciding.'
    : `Fees and curricula last checked ${s.verified}. Fees change through the year - confirm the exact figure with the school.`;

  const canonical = `${SITE}/schools/${s.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'School',
        '@id': canonical + '#school',
        name: s.name,
        url: canonical,
        ...(s.website ? { sameAs: [s.website] } : {}),
        ...(s.phone ? { telephone: s.phone } : {}),
        ...(s.est ? { foundingDate: String(s.est) } : {}),
        address: {
          '@type': 'PostalAddress',
          ...(s.address ? { streetAddress: s.address } : {}),
          addressLocality: s.city || undefined,
          ...(s.pincode ? { postalCode: s.pincode } : {}),
          addressCountry: 'IN',
        },
        description: s.summary || `${s.name} in ${s.area || s.city}: ${(s.boards || []).join(', ')}.`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Schools', item: `${SITE}/` },
          ...(s.city ? [{ '@type': 'ListItem', position: 2, name: s.city, item: `${SITE}${cityHref}` }] : []),
          { '@type': 'ListItem', position: s.city ? 3 : 2, name: s.name, item: canonical },
        ],
      },
    ],
  };

  return (
    <main className="wrap" style={{ paddingBottom: 60 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p style={{ margin: '20px 0 6px' }}><a href="/">All schools</a></p>
      <div className="card">
        <span className="verified-note"><span className="vdot" />Last Verified {s.verified}</span>
        <h1 style={{ margin: '10px 0 2px', fontSize: 32 }}>{s.name}</h1>
        <div className="loc">
          {s.area ? s.area + ' - ' : ''}
          <a href={cityHref}>{s.city}</a>
          {boardHref ? <span>{' - '}<a href={boardHref}>{firstBoard} schools</a></span> : null}
        </div>

        {s.tier === 'listing'
          ? <div className="note" style={{ marginTop: 12 }}>
              <b>This school is listed but not yet fully verified.</b> We show the facts we have below.
              Are you this school? <b>Claim and verify your listing</b> to add fees and details.
              Know it as a parent? <b>Help us verify the fees.</b>
            </div>
          : null}

        {s.summary ? <p style={{ fontSize: 15 }}>{s.summary}</p> : null}

        <dl className="kv">
          <dt>Curricula</dt><dd>{(s.boards || []).join(', ') || '-'}</dd>
          <dt>School type</dt><dd>{s.type || '-'}</dd>
          <dt>Grades</dt><dd>{s.grades || '-'}</dd>
          <dt>Gender</dt><dd>{s.gender || '-'}</dd>
          <dt>Established</dt><dd>{s.est || '-'}</dd>
          <dt>Annual tuition</dt><dd>{s.tuition || 'Not yet verified'}</dd>
          <dt>Website</dt><dd>{s.website ? <a href={s.website} target="_blank" rel="noopener noreferrer">Official site</a> : '-'}</dd>
          <dt>Phone</dt><dd>{s.phone || '-'}</dd>
          {s.address ? <><dt>Address</dt><dd>{s.address}{s.pincode ? ` – ${s.pincode}` : ''}</dd></> : null}
        </dl>

        <div className="note" style={{ marginTop: 14 }}>{trustNote}</div>
      </div>

      <MapBlock school={s} />

      <FeesPanel slug={s.slug} />

      <SchoolReviews slug={s.slug} schoolId={s.id} schoolName={s.name} boards={s.boards || []} />
    </main>
  );
}
