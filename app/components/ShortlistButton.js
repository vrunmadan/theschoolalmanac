'use client';
// Client component: save/unsave this school to the signed-in parent's
// shortlist. Talks to Postgres directly from the browser (RLS-scoped anon
// key) — see db/migrations/0005_parent_accounts.sql for the policies that
// make this safe. Renders nothing while auth state is unknown, and a plain
// sign-in prompt (not a broken button) when signed out.
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

export default function ShortlistButton({ slug }) {
    const sb = supabaseBrowser();
    const [session, setSession] = useState(undefined);
    const [saved, setSaved] = useState(false);
    const [busy, setBusy] = useState(false);

  useEffect(() => {
        if (!sb) { setSession(null); return; }
        sb.auth.getSession().then(({ data }) => setSession(data.session));
        const { data: listener } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
        return () => listener.subscription.unsubscribe();
  }, [sb]);

  useEffect(() => {
        if (!sb || !session) { setSaved(false); return; }
        let live = true;
        sb.from('shortlists').select('id').eq('user_id', session.user.id).eq('school_slug', slug)
          .maybeSingle().then(({ data }) => { if (live) setSaved(Boolean(data)); });
        return () => { live = false; };
  }, [sb, session, slug]);

  if (!sb || session === undefined) return null;

  if (!session) {
        return <span className="small muted">Sign in (top of page) to save this school to a shortlist.</span>;
  }

  const toggle = async () => {
        setBusy(true);
        if (saved) {
                await sb.from('shortlists').delete().eq('user_id', session.user.id).eq('school_slug', slug);
                setSaved(false);
        } else {
                await sb.from('shortlists').insert({ user_id: session.user.id, school_slug: slug });
                setSaved(true);
        }
        setBusy(false);
  };

  return (
        <button className="btn btn-ghost" disabled={busy} onClick={toggle}>
  {saved ? '★ Shortlisted' : '☆ Add to shortlist'}
</button>
  );
}
