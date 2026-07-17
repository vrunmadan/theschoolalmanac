'use client';
import { useState } from 'react';

const COMPONENTS = [
  ['tuition', 'Annual tuition'],
  ['admission', 'Admission fee (one-time)'],
  ['transport', 'Transport (annual)'],
  ['tech_books', 'Books / tech / uniform'],
  ['deposit', 'Security deposit (refundable)'],
  ['other', 'Other'],
];
const LABEL = Object.fromEntries(COMPONENTS);
const fmtINR = (n) => '₹' + Number(n).toLocaleString('en-IN');
const YEARS = ['2026-27', '2025-26', '2024-25'];

export default function FeeDashboard({ slug, schoolName }) {
  const [token, setToken] = useState('');
  const [session, setSession] = useState(null); // { claim, fees }
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState({ component: 'tuition', amount_inr: '', academic_year: YEARS[1], notes: '' });
  const setF = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  async function call(payload) {
    const res = await fetch(`/api/schools/${slug}/fees`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, ...payload }),
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  }

  async function openDash() {
    setBusy(true); setMsg(null);
    const { status, body } = await call({ action: 'auth' });
    if (status === 401) setMsg({ kind: 'err', text: 'That key wasn’t recognised. Check it and try again.' });
    else if (!body.ok) setMsg({ kind: 'err', text: 'Could not open dashboard (' + status + ').' });
    else setSession({ claim: body.claim, fees: body.fees });
    setBusy(false);
  }

  async function addFee() {
    setBusy(true); setMsg(null);
    const amount = Number(String(form.amount_inr).replace(/[^0-9.]/g, ''));
    const { status, body } = await call({ action: 'add', component: form.component, amount_inr: amount, academic_year: form.academic_year, notes: form.notes });
    if (!body.ok) setMsg({ kind: 'err', text: 'Could not save (' + (body.error || status) + ').' });
    else { setSession((s) => ({ ...s, fees: body.fees })); setForm((s) => ({ ...s, amount_inr: '', notes: '' })); setMsg({ kind: 'ok', text: 'Saved. Your stated fee is now live on the public profile.' }); }
    setBusy(false);
  }

  if (!session) {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: 22 }}>Open your dashboard</h2>
        <p className="small muted">Paste the private dashboard key you received when you claimed {schoolName}.</p>
        <input value={token} onChange={(e) => setToken(e.target.value)} className="filter" style={{ width: '100%', fontFamily: 'monospace' }} placeholder="Dashboard key" />
        {msg?.kind === 'err' && <div className="note" style={{ margin: '12px 0' }}>{msg.text}</div>}
        <button className="btn btn-primary" disabled={!token || busy} onClick={openDash} style={{ marginTop: 14, opacity: token && !busy ? 1 : 0.5 }}>{busy ? 'Opening…' : 'Open dashboard'}</button>
        <p className="small muted" style={{ marginTop: 12 }}>Don’t have a key? <a href={`/schools/${slug}/claim`}>Claim this listing first →</a></p>
      </div>
    );
  }

  const cur = {};
  for (const f of session.fees) if (!cur[f.component]) cur[f.component] = f;

  return (
    <>
      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: 22 }}>Update fees — {schoolName}</h2>
        <p className="small muted">Signed in as {session.claim.contact_name || 'school admin'}{session.claim.contact_role ? ` · ${session.claim.contact_role}` : ''}. Fees you state here are tagged “Stated by the school” and dated. Parent-reported fees stay separate and visible.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="small" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Fee type</label>
            <select value={form.component} onChange={(e) => setF('component', e.target.value)} className="filter" style={{ width: '100%' }}>
              {COMPONENTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="small" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Academic year</label>
            <select value={form.academic_year} onChange={(e) => setF('academic_year', e.target.value)} className="filter" style={{ width: '100%' }}>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div style={{ margin: '12px 0' }}>
          <label className="small" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Amount (₹ per year, numbers only)</label>
          <input value={form.amount_inr} onChange={(e) => setF('amount_inr', e.target.value)} className="filter" style={{ width: '100%' }} placeholder="e.g. 250000" inputMode="numeric" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label className="small" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Note <span className="muted">(optional — e.g. “Grade 9–10, excludes transport”)</span></label>
          <input value={form.notes} onChange={(e) => setF('notes', e.target.value)} className="filter" style={{ width: '100%' }} />
        </div>
        {msg && <div className="note" style={{ marginBottom: 12 }}>{msg.text}</div>}
        <button className="btn btn-primary" disabled={busy || !form.amount_inr} onClick={addFee} style={{ opacity: busy || !form.amount_inr ? 0.5 : 1 }}>{busy ? 'Saving…' : 'Save fee'}</button>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Your current stated fees</h3>
        {Object.keys(cur).length === 0
          ? <p className="small muted">No fees stated yet. Add your first above.</p>
          : COMPONENTS.filter(([k]) => cur[k]).map(([k, l]) => (
              <div key={k} className="paramrow">
                <div>{l}<div className="small muted">{cur[k].academic_year}{cur[k].notes ? ` · ${cur[k].notes}` : ''}</div></div>
                <div style={{ textAlign: 'right', fontWeight: 700 }}>{fmtINR(cur[k].amount_inr)}</div>
              </div>
            ))}
      </div>
    </>
  );
}
