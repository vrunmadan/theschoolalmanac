'use client';
import { useEffect, useState } from 'react';

const LABEL = {
  tuition: 'Annual tuition', admission: 'Admission (one-time)', transport: 'Transport',
  tech_books: 'Books / tech / uniform', deposit: 'Security deposit', other: 'Other',
};
const ORDER = ['tuition', 'admission', 'transport', 'tech_books', 'deposit', 'other'];
const fmtINR = (n) => (n == null ? null : '₹' + Number(n).toLocaleString('en-IN'));
const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return ''; } };

export default function FeesPanel({ slug }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let live = true;
    fetch(`/api/schools/${slug}/scores`).then((r) => r.json())
      .then((d) => { if (live) setData(d); }).catch(() => { if (live) setData({}); });
    return () => { live = false; };
  }, [slug]);

  const schoolFees = data?.schoolFees || {};
  const parentFees = data?.feesByComponent || {};
  const hasSchool = Object.keys(schoolFees).length > 0;
  const hasParent = Object.keys(parentFees).length > 0;

  // divergence flag on tuition
  let divergence = null;
  if (schoolFees.tuition && parentFees.tuition?.median) {
    const s = schoolFees.tuition.amount_inr, p = parentFees.tuition.median;
    if (s && p && Math.abs(s - p) / Math.max(s, p) >= 0.15) divergence = { s, p };
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Fees</h2>
        <a className="btn btn-ghost" href={`/schools/${slug}/claim`}>Are you this school? Update fees →</a>
      </div>

      {!hasSchool && !hasParent && (
        <div className="note" style={{ marginTop: 12 }}>
          No structured fees yet. <b>Are you this school?</b> <a href={`/schools/${slug}/claim`}>Claim your listing</a> to state official fees — or, as a parent, add the real fees you paid when you leave a verified review.
        </div>
      )}

      {hasSchool && (
        <div style={{ marginTop: 12 }}>
          <div className="verified-note"><span className="vdot" />Stated by the school</div>
          {ORDER.filter((k) => schoolFees[k]).map((k) => (
            <div className="paramrow" key={k}>
              <div>{LABEL[k]}<div className="small muted">{schoolFees[k].academic_year} · stated {fmtDate(schoolFees[k].stated_at)}</div></div>
              <div style={{ textAlign: 'right', fontWeight: 700 }}>{fmtINR(schoolFees[k].amount_inr)}</div>
            </div>
          ))}
        </div>
      )}

      {hasParent && (
        <div style={{ marginTop: 16 }}>
          <div className="verified-note"><span className="vdot" />Reported by verified parents</div>
          {ORDER.filter((k) => parentFees[k]).map((k) => {
            const p = parentFees[k];
            return (
              <div className="paramrow" key={k}>
                <div>{LABEL[k]}<div className="small muted">{p.n} verified {p.n === 1 ? 'report' : 'reports'}</div></div>
                <div style={{ textAlign: 'right', fontWeight: 700 }}>
                  {fmtINR(p.median)}{p.min !== p.max ? <span className="small muted"> ({fmtINR(p.min)}–{fmtINR(p.max)})</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {divergence && (
        <div className="note" style={{ marginTop: 14 }}>
          <b>Heads up:</b> the school’s stated tuition ({fmtINR(divergence.s)}) differs from what parents report paying ({fmtINR(divergence.p)}). We show both rather than pick one — ask the school what’s included.
        </div>
      )}
    </div>
  );
}
