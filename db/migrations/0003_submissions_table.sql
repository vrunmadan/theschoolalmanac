-- Migration 0003: move "suggest a change" intake (app/api/submit) from JSON
-- blobs in the Supabase Storage "submissions" bucket to a proper Postgres
-- table. Additive only (new table, no drops) so it's safe to run against the
-- live project regardless of current row count.
--
-- RUN THIS IN THE SUPABASE SQL EDITOR *BEFORE* DEPLOYING THE APP CODE THAT
-- ACCOMPANIES IT (app/api/submit/route.js and app/api/admin/submissions/route.js
-- from this change) — that code reads/writes the `submissions` table, which
-- doesn't exist until this migration runs. Deploying the code first will make
-- every submit / admin-queue request fail with a Postgres "relation does not
-- exist" error.
--
-- Existing submissions already sitting as JSON files in the Storage bucket are
-- NOT migrated by this script (there were zero as of the day this shipped —
-- outreach hadn't started). If that's no longer true when you run this,
-- backfill separately from the bucket listing before retiring the old code
-- path, then remove the bucket.

create extension if not exists "pgcrypto";

create table if not exists submissions (
    id             uuid primary key default gen_random_uuid(),
    request_type   text not null check (request_type in
      ('add_school','correct_details','not_offered','remove','feedback','other')),
    school_name    text,
    school_url     text,
    evidence       text,
    contact_name   text,
    contact_role   text,
    contact_email  text not null,
    message        text not null,
    status         text not null default 'new' check (status in ('new','actioned','dismissed')),
    created_at     timestamptz not null default now()
  );
create index if not exists submissions_status_idx on submissions (status);
create index if not exists submissions_created_at_idx on submissions (created_at);
