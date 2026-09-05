-- Migration 0002: require confirmation-email click (proof of mailbox control)
-- before a domain-matched claim becomes verified, instead of trusting the
-- submitted address on its own. Additive only — safe to run regardless of
-- current row count. RUN BEFORE deploying the accompanying app code (same
-- rule as migration 0001): the claim routes on this branch read/write
-- confirm_token_hash and confirm_expires_at.

alter table school_claims add column if not exists confirm_token_hash text;
alter table school_claims add column if not exists confirm_expires_at timestamptz;

create index if not exists school_claims_confirm_token_hash_idx on school_claims (confirm_token_hash);

-- Widen the status check constraint to add 'pending_confirmation' (domain
-- matched, confirmation email sent, awaiting the click) and 'rejected'
-- (manual admin rejection via POST /api/admin/claims/:id/verify).
--
-- BEFORE running the next statement: this schema was never pg_dump'd against
-- the live project (no Supabase credentials in the session that wrote it), so
-- the constraint's real name is a guess. Run this first to find its actual name:
--
--   select conname from pg_constraint
--   where conrelid = 'school_claims'::regclass and contype = 'c';
--
-- If it prints something other than school_claims_status_check, replace the
-- name below with what it actually shows before running this migration.
alter table school_claims drop constraint if exists school_claims_status_check;
alter table school_claims add constraint school_claims_status_check
  check (status in ('pending', 'pending_confirmation', 'verified', 'rejected'));
