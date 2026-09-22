'use client';
// Client component: parent sign-in via Supabase magic link (email OTP), no
// password ever collected. Lives in the site header. Session lives in the
// browser client's own storage (supabase-js default) — there's no server
// session/cookie here, so this only ever reflects the state of THIS browser.
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

export default function AuthWidget() {
    const sb = supabaseBrowser();
    const [session, setSession] = useState(undefined); // undefined = still loading
  const [open, setOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [err, setErr] = useState(null);

  useEffect(() => {
        if (!sb) { setSession(null); return; }
        sb.auth.getSession().then(({ data }) => setSession(data.session));
        const { data: listener } = sb.auth.onAuthStateChange((_event, s) => setSession(s));
        return () => listener.subscription.unsubscribe();
  }, [sb]);

  if (!sb || session === undefined) return null; // not configured, or still loading — avoid a flash

  if (session) {
        return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a href="/account" className="small">My account</a>
          <button
            className="btn btn-ghost"
            style={{ padding: '6px 12px', fontSize: 13 }}
          onClick={() => sb.auth.signOut()}
        >
                      Sign out
            </button>
            </div>
    );
}

  if (sent) {
        return <span className="small muted">Check your email for a sign-in link.</span>;
  }

  if (!open) {
        return (
                <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => setOpen(true)}>
            Sign in
    </button>
    );
}

  return (
        <form
      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
      onSubmit={async (e) => {
                e.preventDefault();
                setErr(null);
                const { error } = await sb.auth.signInWithOtp({
                            email,
                            options: { emailRedirectTo: `${window.location.origin}/account` },
                });
                if (error) setErr(error.message);
                else setSent(true);
      }}
    >
              <input
        type="email"
                required
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '6px 10px', fontSize: 13, width: 180 }}
      />
      <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 13 }} type="submit">
                Send link
        </button>
{err ? <span className="small" style={{ color: '#b3261e' }}>{err}</span> : null}
  </form>
  );
}
