'use client';
import { useState } from 'react';

const ROLES = ['Principal / Head', 'Admissions', 'Administration / Ops', 'Owner / Trustee', 'Marketing', 'Other'];

export default function ClaimForm({ slug, schoolName }) {
  const [f, setF] = useState({ contact_name: '', contact_role: ROLES[0], contact_email: '' });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const ok = f.contact_name.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.contact_email);

  async function submit() {
    setBusy(true); setResult(null);
    try {
      const res = await fetch(`/api/schools/${slug}/claim`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f),
      });
      const b = await res.json();
      if (res.status === 503) setResult({ kind: 'err', msg: 'Claiming isn’t enabled on this deployment yet.' });
      else if (!res.ok) setResult({ kind: 'err', msg: 'Could not submit: ' + (b.error || res.status) });
      else if (b.status === 'verified') setResult({ kind: 'verified', token: b.dashboard_token, msg: b.message });
      else setResult({ kind: 'pending', msg: b.message });
    } catch { setResult({ kind: 'err', msg: 'Network error — please try again.' }); }
    finally { setBusy(false); }
  }

  if (result?.kind === 'verified') {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: 22 }}>You’re verified ✓</h2>
        <p className="small">{result.msg}</p>
        <label className="small" style={{ fontWeight: 600, display: 'block', margin: '10px 0 6px' }}>Your private dashboard key (save it — shown once)</label>
        <input readOnly value={result.token} className="filter" style={{ width: '100%', fontFamily: 'monospace' }} onFocus={(e) => e.target.select()} />
        <a className="btn btn-primary" href={`/schools/${slug}/dashboard`} style={{ display: 'inline-block', marginTop: 14 }}>Open your fee dashboard →</a>
        <p className="small muted" style={{ marginTop: 10 }}>You’ll paste this key on the dashboard to update fees. Keep it safe — anyone with it can edit your school’s stated fees.</p>
      </div>
    );
  }
  if (result?.kind === 'pending') {
    return <div className="card"><h2 style={{ marginTop: 0, fontSize: 22 }}>Claim received</h2><p className="small">{result.msg}</p></div>;
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0, fontSize: 22 }}>Claim {schoolName}</h2>
      <p className="small muted">Use your official school email — if its domain matches the school’s website, you’re verified instantly and can update fees. We never sell or display your email.</p>
      <div style={{ marginBottom: 12 }}>
        <label className="small" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Your name</label>
        <input value={f.contact_name} onChange={(e) => set('contact_name', e.target.value)} className="filter" style={{ width: '100%' }} placeholder="Full name" />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label className="small" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Your role</label>
        <select value={f.contact_role} onChange={(e) => set('contact_role', e.target.value)} className="filter" style={{ width: '100%' }}>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label className="small" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Work email</label>
        <input value={f.contact_email} onChange={(e) => set('contact_email', e.target.value)} className="filter" style={{ width: '100%' }} placeholder="you@yourschool.edu.in" />
      </div>
      {result?.kind === 'err' && <div className="note" style={{ marginBottom: 12 }}>{result.msg}</div>}
      <button className="btn btn-primary" disabled={!ok || busy} onClick={submit} style={{ width: '100%', opacity: ok && !busy ? 1 : 0.5 }}>
        {busy ? 'Submitting…' : 'Claim this listing'}
      </button>
    </div>
  );
}
