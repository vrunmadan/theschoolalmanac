'use client';
import { useState } from 'react';

const TYPES = [
  ['add_school', 'Add a school that’s missing'],
  ['correct_details', 'Correct details on a listing'],
  ['not_offered', 'This school doesn’t actually offer this curriculum'],
  ['remove', 'Request removal of a listing'],
  ['feedback', 'General feedback'],
  ['other', 'Something else'],
];
const ROLES = ['Parent', 'School staff / admin', 'School owner / trustee', 'Other'];
const needsSchool = (t) => ['add_school', 'correct_details', 'not_offered', 'remove'].includes(t);

export default function ContactForm() {
  const [f, setF] = useState({ request_type: 'add_school', school_name: '', school_url: '', evidence: '', contact_name: '', contact_role: ROLES[0], contact_email: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.contact_email) && f.message.trim().length >= 5;

  async function submit() {
    setBusy(true); setResult(null);
    try {
      const res = await fetch('/api/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      const b = await res.json();
      if (res.status === 503) setResult({ ok: false, msg: 'Submissions aren’t enabled on this deployment yet.' });
      else if (!res.ok) setResult({ ok: false, msg: 'Could not submit: ' + (b.error || res.status) });
      else setResult({ ok: true });
    } catch { setResult({ ok: false, msg: 'Network error — please try again.' }); }
    finally { setBusy(false); }
  }

  if (result?.ok) {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: 22 }}>Thank you — got it ✓</h2>
        <p className="small">Your submission is in our review queue. We verify every change before it goes live — that’s the whole point of “verified.” If we need anything, we’ll email you.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ marginBottom: 12 }}>
        <label className="small" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>What would you like to do?</label>
        <select value={f.request_type} onChange={(e) => set('request_type', e.target.value)} className="filter" style={{ width: '100%' }}>
          {TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>

      {needsSchool(f.request_type) && (
        <>
          <div style={{ marginBottom: 12 }}>
            <label className="small" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>School name</label>
            <input value={f.school_name} onChange={(e) => set('school_name', e.target.value)} className="filter" style={{ width: '100%' }} placeholder="Full school name" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="small" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>School website <span className="muted">(optional)</span></label>
            <input value={f.school_url} onChange={(e) => set('school_url', e.target.value)} className="filter" style={{ width: '100%' }} placeholder="https://" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="small" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Evidence <span className="muted">(helps us verify — e.g. Cambridge/CAIE centre number, IB code, an official page)</span></label>
            <input value={f.evidence} onChange={(e) => set('evidence', e.target.value)} className="filter" style={{ width: '100%' }} placeholder="Centre number or link" />
          </div>
        </>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="small" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Your name</label>
          <input value={f.contact_name} onChange={(e) => set('contact_name', e.target.value)} className="filter" style={{ width: '100%' }} />
        </div>
        <div>
          <label className="small" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>You are a…</label>
          <select value={f.contact_role} onChange={(e) => set('contact_role', e.target.value)} className="filter" style={{ width: '100%' }}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div style={{ margin: '12px 0' }}>
        <label className="small" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Your email <span className="muted">(so we can follow up — never shown or sold)</span></label>
        <input value={f.contact_email} onChange={(e) => set('contact_email', e.target.value)} className="filter" style={{ width: '100%' }} placeholder="you@email.com" />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label className="small" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Details</label>
        <textarea rows={4} value={f.message} onChange={(e) => set('message', e.target.value)} className="filter" style={{ width: '100%' }} placeholder="Tell us what to add, fix, or remove — and why." />
      </div>

      {result && !result.ok && <div className="note" style={{ marginBottom: 12 }}>{result.msg}</div>}
      <button className="btn btn-primary" disabled={!ok || busy} onClick={submit} style={{ width: '100%', opacity: ok && !busy ? 1 : 0.5 }}>
        {busy ? 'Submitting…' : 'Submit'}
      </button>
    </div>
  );
}
