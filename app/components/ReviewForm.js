'use client';
import { useState } from 'react';

const PARAMS = [
  ['academics', 'Academics & teaching'], ['teachers', 'Teacher attention & care'],
  ['facilities', 'Facilities & campus'], ['safety', 'Safety & child protection'],
  ['extracurriculars', 'Extracurriculars'], ['admin', 'Admin & communication'], ['value', 'Value for money'],
];

function Stars({ value, onChange }) {
  return (
    <span style={{ fontSize: 24, cursor: 'pointer', color: 'var(--line)' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} onClick={() => onChange(n)} style={{ color: n <= value ? 'var(--amber)' : 'var(--line)' }}>★</span>
      ))}
    </span>
  );
}

export default function ReviewForm({ schoolId, schoolName, boards, onClose }) {
  const [ratings, setRatings] = useState(Object.fromEntries(PARAMS.map(([k]) => [k, 0])));
  const [recommend, setRecommend] = useState('yes');
  const [identity, setIdentity] = useState('');
  const [freeText, setFreeText] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const setStar = (k, n) => setRatings((r) => ({ ...r, [k]: n }));
  const complete = PARAMS.every(([k]) => ratings[k] >= 1) && identity.includes('@');

  async function submit() {
    setBusy(true); setResult(null);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: schoolId, identity, academic_year: '2025-26', recommend, ratings,
          programme: boards.slice(0, 1), free_text: freeText,
        }),
      });
      const body = await res.json();
      if (res.status === 503) setResult({ ok: false, msg: 'Reviews aren’t enabled on this deployment yet (Supabase not configured).' });
      else if (!res.ok) setResult({ ok: false, msg: 'Could not submit: ' + (body.error || res.status) });
      else setResult({ ok: true, msg: 'Submitted. Next step: verify you’re a parent here so your review counts.' });
    } catch (e) {
      setResult({ ok: false, msg: 'Network error — please try again.' });
    } finally { setBusy(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(18,35,59,.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflow: 'auto', zIndex: 60 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="card" style={{ maxWidth: 620, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Rate {schoolName}</h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '4px 10px' }}>×</button>
        </div>

        {result?.ok ? (
          <div className="note" style={{ marginTop: 16 }}>✓ {result.msg}</div>
        ) : (
          <>
            <p className="small muted">All seven ratings are required — this is the benchmarkable data. Your review counts only after parent verification.</p>
            {PARAMS.map(([k, label]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px dashed var(--line)' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{label}</span>
                <Stars value={ratings[k]} onChange={(n) => setStar(k, n)} />
              </div>
            ))}
            <div style={{ margin: '14px 0' }}>
              <label className="small" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Would you recommend this school?</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['yes', 'caveats', 'no'].map((v) => (
                  <button key={v} className="btn btn-ghost" onClick={() => setRecommend(v)}
                    style={recommend === v ? { background: 'var(--ink)', color: '#fff' } : {}}>
                    {v === 'yes' ? 'Yes' : v === 'caveats' ? 'With caveats' : 'No'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="small" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Your experience <span className="muted">(optional, moderated — not part of the score)</span></label>
              <textarea rows={3} value={freeText} onChange={(e) => setFreeText(e.target.value)} className="filter" style={{ width: '100%' }}
                placeholder="What should other parents know? No staff or child names." />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="small" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Your email <span className="muted">(for verification only — never shown, never sold)</span></label>
              <input value={identity} onChange={(e) => setIdentity(e.target.value)} className="filter" style={{ width: '100%' }} placeholder="you@email.com" />
            </div>
            {result && !result.ok && <div className="note" style={{ marginBottom: 12 }}>{result.msg}</div>}
            <button className="btn btn-primary" disabled={!complete || busy} onClick={submit} style={{ width: '100%', opacity: complete && !busy ? 1 : 0.5 }}>
              {busy ? 'Submitting…' : 'Submit & continue to verify'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
