-- Migration 0004: create the public "school-photos" Supabase Storage bucket.
--
-- scripts/sync-notion.mjs (build-time Notion sync) writes into this bucket:
-- Notion's own file-upload URLs are SIGNED AND EXPIRE (~1hr), so a photo
-- someone uploads directly into the Notion "Photos" property gets downloaded
-- and re-uploaded here at build time, keyed by Notion page id, to get a
-- permanent public URL before it ever reaches a statically-built page.
-- (Photos added to Notion as an *external* link — e.g. already hosted
-- elsewhere — skip this bucket entirely and are used as-is.)
--
-- RUN THIS IN THE SUPABASE SQL EDITOR BEFORE the first deploy that includes
-- the sync-notion.mjs photo-rehosting code. Until this bucket exists,
-- Notion-uploaded photos are silently dropped each build (fail-safe — see
-- the comment in rehostPhotos()); external-link photos are unaffected either
-- way. The prebuild script writes via SUPABASE_SERVICE_ROLE_KEY, which
-- bypasses RLS/bucket policy entirely, so no separate storage policy is
-- needed for the write path — `public = true` below is what makes the
-- uploaded photos readable by anyone (parents viewing the site), same as any
-- public Storage bucket.

insert into storage.buckets (id, name, public)
values ('school-photos', 'school-photos', true)
on conflict (id) do nothing;
