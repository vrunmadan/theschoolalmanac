'use client';
// Client component: reads the signed-in parent's shortlist and alert
// preferences straight from Postgres (RLS-scoped) and resolves each
// school_slug against the static directory for display. No server route —
// same pattern as ShortlistButton/AlertToggle.
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { getSchoolBySlug } from '@/lib/schools';

function Row({ s, onRemove, removing }) {
  if (!s) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
      <div>
        <a href={`/schools/${s.slug}`} style={{ fontWeight: 600 }}>{s.name}</a>
        <div className="small muted">{s.area || s.city} · {s.city}</div>
      </div>
      <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 13 }} disabled={removing} onClick={onRemove}>
        Remove
      </button>
    </div>
  );
}

export default function AccountPage() {
  const sb = supabaseBrowser();
  const [session, setSession] = useState(undefined);
  const [shortlist, setShortlist] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    if (!sb) { setSession(null); return; }
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, [sb]);

  useEffect(() => {
    if (!sb || !session) return;
    sb.from('shortlists').select('school_slug').eq('user_id', session.user.id)
      .then(({ data }) => setShortlist((data || []).map((r) => r.school_slug)));
    sb.from('alert_subscriptions').select('school_slug').eq('user_id', session.user.id)
      .then(({ data }) => setAlerts((data || []).map((r) => r.school_slug)));
  }, [sb, session]);

  const removeShortlist = async (slug) => {
    setRemoving(slug);
    await sb.from('shortlists').delete().eq('user_id', session.user.id).eq('school_slug', slug);
    setShortlist((cur) => cur.filter((s) => s !== slug));
    setRemoving(null);
  };
  const removeAlert = async (slug) => {
    setRemoving(slug);
    await sb.from('alert_subscriptions').delete().eq('user_id', session.user.id).eq('school_slug', slug);
    setAlerts((cur) => cur.filter((s) => s !== slug));
    setRemoving(null);
  };

  return (
    <main className="wrap" style={{ paddingBottom: 60 }}>
      <p style={{ margin: '20px 0 6px' }}><a href="/">All schools</a></p>
      <h1 style={{ fontSize: 32, margin: '10px 0 20px' }}>My account</h1>

      {!sb ? (
        <div className="note">Accounts aren&apos;t configured on this build yet.</div>
      ) : session === undefined ? null : !session ? (
        <div className="note">Sign in from the link at the top of any page to see your shortlist and alerts here.</div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 18 }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>My shortlist</h2>
            {shortlist === null ? (
              <p className="small muted">Loading…</p>
            ) : shortlist.length === 0 ? (
              <p className="small muted" style={{ marginTop: 10 }}>
                Nothing shortlisted yet — use &quot;Add to shortlist&quot; on any school page.
              </p>
            ) : (
              <div style={{ marginTop: 8 }}>
                {shortlist.map((slug) => (
                  <Row key={slug} s={getSchoolBySlug(slug)} removing={removing === slug} onRemove={() => removeShortlist(slug)} />
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 style={{ margin: 0, fontSize: 20 }}>My alerts</h2>
            <p className="small muted" style={{ marginTop: 6 }}>
              Email delivery for these isn&apos;t live yet — this is just what you&apos;ve flagged so far.
            </p>
            {alerts === null ? (
              <p className="small muted">Loading…</p>
            ) : alerts.length === 0 ? (
              <p className="small muted" style={{ marginTop: 10 }}>
                No alerts set — use the checkbox on any school page.
              </p>
            ) : (
              <div style={{ marginTop: 8 }}>
                {alerts.map((slug) => (
                  <Row key={slug} s={getSchoolBySlug(slug)} removing={removing === slug} onRemove={() => removeAlert(slug)} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
