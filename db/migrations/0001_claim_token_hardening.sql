-- Migration 0001: stop storing school-claim dashboard tokens in plaintext, and
-- bound their lifetime. Additive only (no drops, no NOT NULL on existing data) so
-- it's safe to run against the live project regardless of current row count.
--
-- RUN THIS IN THE SUPABASE SQL EDITOR *BEFORE* DEPLOYING THE APP CODE THAT
-- ACCOMPANIES IT (app/api/schools/[slug]/claim/route.js and .../fees/route.js
-- from this branch) — that code reads/writes token_hash and token_expires_at,
-- which don't exist until this migration runs. Deploying the code first will
-- make every claim/fee request fail.
--
-- If any claims already exist with a plaintext dashboard_token (unlikely per the
-- Work Log — outreach hasn't started yet — but not verified against the live
-- table), the backfill step below computes their token_hash so existing tokens
-- keep working after the code switch.

-- digest() below needs pgcrypto. Your project almost certainly already has this
-- (it's what generates the uuid primary keys on your existing tables), but this
-- makes the migration self-contained regardless.
create extension if not exists pgcrypto;

alter table school_claims add column if not exists token_hash text;
alter table school_claims add column if not exists token_expires_at timestamptz;

create index if not exists school_claims_token_hash_idx on school_claims (token_hash);

-- Backfill: hash any existing plaintext tokens so already-issued dashboard
-- credentials keep working (sha256, matching the app's hashing — see
-- lib/tokenHash.js). Gives existing tokens a 180-day expiry from now; extend
-- manually via the SQL editor if a real school is actively using one.
update school_claims
set token_hash = encode(digest(dashboard_token, 'sha256'), 'hex'),
    token_expires_at = now() + interval '180 days'
where dashboard_token is not null and token_hash is null;
