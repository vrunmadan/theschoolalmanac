'use client';
// Client component: lets a signed-in parent flag that they want to hear
// about updates to this school. Stores the preference only — no email goes
// out yet (email delivery is a separate, later change once we pick a
// vendor), so the copy says that plainly rather than implying it's live.
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

export default function AlertToggle({ slug }) {
    const sb = supabaseBrowser();
    const [session, setSession] = useState(undefined);
    const [subscribed, setSubscribed] = useState(false);
    const [busy, setBusy] = useState(false);

  useEffect(() => {
        if (!sb) { setSession(null); return; }
        sb.auth.getSession().then(({ data }) => setSession(data.session));
        const { data: listener } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
        return () => listener.subscription.unsubscribe();
  }, [sb]);

  useEffect(() => {
        if (!sb || !session) { setSubscribed(false); return; }
        let live = true;
        sb.from('alert_subscriptions').select('id').eq('user_id', session.user.id).eq('school_slug', slug)
          .maybeSingle().then(({ data }) => { if (live) setSubscribed(Boolean(data)); });
        return () => { live = false; };
  }, [sb, session, slug]);

  if (!sb || session === undefined || !session) return null; // quiet when signed out — ShortlistButton already prompts to sign in

  const toggle = async () => {
        setBusy(true);
        if (subscribed) {
                await sb.from('alert_subscriptions').delete().eq('user_id', session.user.id).eq('school_slug', slug);
                setSubscribed(false);
        } else {
                await sb.from('alert_subscriptions').insert({ user_id: session.user.id, school_slug: slug });
                setSubscribed(true);
        }
        setBusy(false);
  };

  return (
        <label className="small muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: busy ? 'default' : 'pointer' }}>
      <input type="checkbox" checked={subscribed} disabled={busy} onChange={toggle} />
        Flag me when this school&apos;s details change
{subscribed ? <span style={{ color: 'var(--slate)' }}>— saved; email alerts aren&apos;t live yet</span> : null}
  </label>
  );
}
