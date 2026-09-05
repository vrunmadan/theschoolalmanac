'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

export default function ConfirmClaimPage() {
  const { slug } = useParams();
  const search = useSearchParams();
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    const claim_id = search.get('claim');
    const token = search.get('token');
    if (!claim_id || !token) { setState({ status: 'error', msg: 'This confirmation link is missing information — copy the full link from your email.' }); return; }

    let live = true;
    fetch(`/api/schools/${slug}/claim/confirm`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claim_id, token }),
    })
      .then((r) => r.json().then((b) => ({ ok: r.ok, b })))
      .then(({ ok, b }) => {
        if (!live) return;
        if (!ok) setState({ status: 'error', msg: b.error === 'token_expired'
          ? 'This confirmation link has expired (they last 48 hours) — go back and claim the listing again to get a new one.'
          : b.error === 'invalid_token' ? 'This confirmation link is invalid.'
          : 'Could not confirm: ' + (b.error || 'unknown error') });
        else setState({ status: 'ok', dashboardToken: b.dashboard_token, already: b.already, msg: b.message });
      })
      .catch(() => { if (live) setState({ status: 'error', msg: 'Network error — please try again.' }); });
    return () => { live = false; };
  }, [slug, search]);

  return (
    <main className="wrap" style={{ paddingBottom: 60, maxWidth: 640 }}>
      <p style={{ margin: '20px 0 6px' }}><a href={`/schools/${slug}`}>← Back to school</a></p>
      <div className="card">
        {state.status === 'loading' && <p className="small muted">Confirming…</p>}
        {state.status === 'error' && (
          <>
            <h2 style={{ marginTop: 0, fontSize: 22 }}>Couldn’t confirm</h2>
            <p className="small">{state.msg}</p>
          </>
        )}
        {state.status === 'ok' && (
          <>
            <h2 style={{ marginTop: 0, fontSize: 22 }}>{state.already ? 'Already confirmed' : 'You’re verified ✓'}</h2>
            <p className="small">{state.msg}</p>
            {state.dashboardToken && (
              <>
                <label className="small" style={{ fontWeight: 600, display: 'block', margin: '10px 0 6px' }}>
                  Your private dashboard key (save it — shown once)
                </label>
                <input readOnly value={state.dashboardToken} className="filter" style={{ width: '100%', fontFamily: 'monospace' }} onFocus={(e) => e.target.select()} />
                <a className="btn btn-primary" href={`/schools/${slug}/dashboard`} style={{ display: 'inline-block', marginTop: 14 }}>Open your fee dashboard →</a>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
