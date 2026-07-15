'use client';
import { useEffect, useState } from 'react';
import ReviewForm from './ReviewForm';

const PARAM_LABELS = {
  academics: 'Academics & teaching', teachers: 'Teacher attention & care',
  facilities: 'Facilities & campus', safety: 'Safety & child protection',
  extracurriculars: 'Extracurriculars', admin: 'Admin & communication', value: 'Value for money',
};

export default function SchoolReviews({ slug, schoolId, schoolName, boards }) {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`/api/schools/${slug}/scores`)
      .then((r) => r.json())
      .then((d) => { if (live) setData(d); })
      .catch(() => { if (live) setData({ status: 'building', reviews: [] }); });
    return () => { live = false; };
  }, [slug]);

  if (!data) return <p className="small muted" style={{ marginTop: 18 }}>Loading verified reviews…</p>;

  const building = data.status !== 'published';

  return (
    <>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Verified parent reviews</h2>
          <button className="btn btn-primary" onClick={() => setOpen(true)}>Write a review</button>
        </div>

        {building ? (
          <div className="note" style={{ marginTop: 14 }}>
            <b>Building.</b> {data.nVerified || 0} verified {data.nVerified === 1 ? 'review' : 'reviews'} so far —
            we show a public score once at least 5 verified parents have reviewed. Ranking is driven by these
            ratings; schools can never buy position.
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 22, alignItems: 'center', margin: '10px 0 6px', flexWrap: 'wrap' }}>
              <div className="amt" style={{ fontSize: 44 }}>{data.overall?.toFixed(1)}</div>
              <span className="verified-note"><span className="vdot" />{data.nVerified} verified-parent reviews · weighted for sample size &amp; recency</span>
            </div>
            {Object.entries(PARAM_LABELS).map(([k, label]) => {
              const p = data.params?.[k];
              if (!p || p.value == null) return null;
              return (
                <div className="paramrow" key={k}>
                  <div>{label}</div>
                  <div className="bar"><span style={{ width: `${(p.value / 5) * 100}%` }} /></div>
                  <div style={{ textAlign: 'right', fontWeight: 600 }}>{p.value.toFixed(1)}</div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {!building && data.reviews?.length > 0 && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>What verified parents say</h3>
          {data.reviews.map((r) => (
            <div className="review" key={r.id}>
              <div className="small muted"><b style={{ color: 'var(--ink)' }}>Verified Parent</b>
                {r.grade_band ? ` · ${r.grade_band}` : ''}{Array.isArray(r.programme) && r.programme[0] ? ` · ${r.programme[0]}` : ''}</div>
              {r.free_text && <p style={{ margin: '8px 0 0', fontSize: 14 }}>{r.free_text}</p>}
              {r.response && <div className="reply"><b>{schoolName} replied</b> · {r.response.response_text}</div>}
            </div>
          ))}
        </div>
      )}

      {open && (
        <ReviewForm schoolId={schoolId} schoolName={schoolName} boards={boards} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
