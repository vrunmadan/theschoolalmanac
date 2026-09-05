-- The School Almanac — Supabase (Postgres) schema
--
-- IMPORTANT PROVENANCE NOTE: this file is reconstructed from the columns the
-- application code actually reads/writes (app/api/**/route.js, lib/reviewEngine.js)
-- and from The-School-Almanac-Engineering-and-Architecture.md §4.3. It was NOT
-- generated with `pg_dump` or the Supabase CLI against the live project, because
-- this environment has no Supabase credentials. Before treating this as
-- authoritative: run `supabase db dump` (or export from the Supabase SQL editor)
-- against the real production project and diff it against this file, then delete
-- this note. Until then, treat this as "best-effort documentation," not "source of
-- truth" — the live database is still the source of truth.
--
-- Apply db/migrations/*.sql in order against a fresh project to reproduce this.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- reviews — one row per parent review submission.
-- ---------------------------------------------------------------------------
create table if not exists reviews (
  id                 uuid primary key default gen_random_uuid(),
  school_id          text not null,              -- MUST be the school's slug (see
                                                   -- app/api/schools/[slug]/scores/route.js
                                                   -- which queries school_id = slug).
  parent_ref         text not null,               -- sha256(salt|identity), never raw PII.
  academic_year      text not null,               -- e.g. '2025-26'
  recommend          text not null check (recommend in ('yes','caveats','no')),
  programme          text[],
  grade_band         text,
  years_at_school    text,
  relationship       text,
  free_text          text,
  is_anonymous       boolean not null default true,
  verification_tier  text not null default 'T0' check (verification_tier in ('T0','T1','T2')),
  status             text not null default 'pending' check (status in ('pending','published','removed')),
  excluded           boolean not null default false,   -- set by anti-gaming (self-review/burst)
  verified_at        timestamptz,
  created_at         timestamptz not null default now(),
  unique (parent_ref, school_id, academic_year)
);
create index if not exists reviews_school_id_idx on reviews (school_id);
create index if not exists reviews_status_idx on reviews (status);

create table if not exists review_ratings (
  id         uuid primary key default gen_random_uuid(),
  review_id  uuid not null references reviews(id) on delete cascade,
  parameter  text not null check (parameter in
    ('academics','teachers','facilities','safety','extracurriculars','admin','value')),
  score      int not null check (score between 1 and 5),
  unique (review_id, parameter)
);

create table if not exists review_tags (
  id         uuid primary key default gen_random_uuid(),
  review_id  uuid not null references reviews(id) on delete cascade,
  tag_key    text not null
);

create table if not exists review_fee_inputs (
  id             uuid primary key default gen_random_uuid(),
  review_id      uuid not null references reviews(id) on delete cascade,
  component      text not null check (component in
    ('tuition','admission','transport','tech_books','deposit','other')),
  amount_inr     numeric not null check (amount_inr > 0),
  academic_year  text not null
);

create table if not exists review_responses (
  id             uuid primary key default gen_random_uuid(),
  review_id      uuid not null references reviews(id) on delete cascade,
  response_text  text not null,
  responded_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- school_claims — a school rep's claim on a listing.
-- token_hash/token_expires_at added by migration 0001 (see db/migrations) to stop
-- storing the dashboard bearer token in plaintext and to bound its lifetime.
-- ---------------------------------------------------------------------------
create table if not exists school_claims (
  id                 uuid primary key default gen_random_uuid(),
  school_slug        text not null,
  contact_name       text,
  contact_role       text,
  contact_email      text not null,
  email_domain       text,
  domain_match       boolean not null default false,
  status             text not null default 'pending' check (status in
    ('pending','pending_confirmation','verified','rejected')),
  dashboard_token    text,          -- legacy plaintext column; kept for rows written before
                                     -- migration 0001, no longer written to by new code.
  token_hash         text,          -- sha256(dashboard token) — the fee-editing bearer key.
  token_expires_at   timestamptz,
  confirm_token_hash text,          -- sha256(email-confirmation token), single-use, cleared on redemption.
  confirm_expires_at timestamptz,
  verified_at        timestamptz,
  created_at         timestamptz not null default now()
);
create index if not exists school_claims_slug_idx on school_claims (school_slug);
create index if not exists school_claims_token_hash_idx on school_claims (token_hash);
create index if not exists school_claims_confirm_token_hash_idx on school_claims (confirm_token_hash);

create table if not exists school_fee_submissions (
  id             uuid primary key default gen_random_uuid(),
  school_id      text not null,     -- school slug, consistent with reviews.school_id
  component      text not null check (component in
    ('tuition','admission','transport','tech_books','deposit','other')),
  amount_inr     numeric not null check (amount_inr >= 0),
  academic_year  text not null check (academic_year ~ '^\d{4}-\d{2}$'),
  submitted_by   text,
  notes          text,
  stated_at      timestamptz not null default now()
);
create index if not exists school_fee_submissions_school_id_idx on school_fee_submissions (school_id);

-- ---------------------------------------------------------------------------
-- submissions table: app/api/submit writes to Supabase STORAGE (bucket
-- "submissions"), not a table — see the Engineering Dossier §4.3 reconciliation
-- note about a separate Postgres `submissions` table created via a one-off
-- scheduled task. Not modeled here since the live API code path uses Storage.
-- ---------------------------------------------------------------------------
