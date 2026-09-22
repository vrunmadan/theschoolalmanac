-- Migration 0005: parent accounts — shortlists and alert subscriptions.
--
-- Auth itself needs NO migration: every Supabase project ships with
-- auth.users built in, and email OTP ("magic link") sign-in is on by
-- default for new projects. Before this ships, in the Supabase dashboard
-- confirm:
--   1. Authentication > Providers > Email is enabled (it is by default).
--   2. Authentication > URL Configuration > Site URL is set to
--      https://theschoolalmanac.com, and that URL (plus any preview/local
--      URLs you use) is in the Redirect URLs allow-list — otherwise the
--      magic-link email will redirect somewhere Supabase rejects.
-- Supabase's own outgoing mail is rate-limited (fine for early testing,
-- ~a few emails/hour); swap in a custom SMTP provider under Authentication
-- > Emails before this sees real signup volume.
--
-- RUN THIS IN THE SUPABASE SQL EDITOR *BEFORE* deploying the app code that
-- reads/writes these tables (AuthWidget, ShortlistButton, AlertToggle,
-- app/account) — until it runs, those calls fail with a Postgres "relation
-- does not exist" error. The app degrades safely either way: everything
-- keyed off `session` (via supabaseBrowser()) simply never shows a session
-- if Supabase isn't configured, so this never breaks the base directory.
--
-- Design notes:
--  - Keyed by school SLUG, not Notion page id (`nid`) — slugs are this
--    codebase's durable public key for a school (see assignSlugs() in
--    scripts/sync-notion.mjs); a school's nid never appears in a URL or in
--    parent-facing UI, so slug is what a shortlist/alert row should point at.
--  - RLS is the ONLY access control here — there's no server API route for
--    these tables, the browser client (anon key) talks to Postgres directly
--    via supabase-js, so a missing or wrong policy is a real data leak, not
--    just a bug. Every policy below is scoped to auth.uid() = user_id.
--  - alert_subscriptions has no email-delivery wiring yet (deliberate — see
--    Founding Plan discussion): this migration only creates the table
--    parents' preferences are stored in. The "send an email" half is a
--    separate, later change once an email vendor is chosen.

create table if not exists shortlists (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null references auth.users(id) on delete cascade,
    school_slug  text not null,
    created_at   timestamptz not null default now(),
    unique (user_id, school_slug)
  );
create index if not exists shortlists_user_idx on shortlists (user_id);

alter table shortlists enable row level security;
create policy "shortlists_select_own" on shortlists for select using (auth.uid() = user_id);
create policy "shortlists_insert_own" on shortlists for insert with check (auth.uid() = user_id);
create policy "shortlists_delete_own" on shortlists for delete using (auth.uid() = user_id);

create table if not exists alert_subscriptions (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null references auth.users(id) on delete cascade,
    school_slug  text not null,
    created_at   timestamptz not null default now(),
    unique (user_id, school_slug)
  );
create index if not exists alert_subscriptions_user_idx on alert_subscriptions (user_id);

alter table alert_subscriptions enable row level security;
create policy "alert_subs_select_own" on alert_subscriptions for select using (auth.uid() = user_id);
create policy "alert_subs_insert_own" on alert_subscriptions for insert with check (auth.uid() = user_id);
create policy "alert_subs_delete_own" on alert_subscriptions for delete using (auth.uid() = user_id);
