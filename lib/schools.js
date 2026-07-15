// Stage 1 data access: reads the verified directory from data/schools.json
// (the Notion enrichment export). Swap in a live Notion fetch later without
// changing callers — the shape stays the same.

import raw from '@/data/schools.json';

export function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')      // drop parenthetical campus notes
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Tiering (Crowdsourcing/go-live plan):
//  - 'enriched' : full verified profile (has an editorial Public Summary)
//  - 'listing'  : honest stub — facts we have + "claim & verify" CTAs
//  - 'held'     : too bare to publish (no contact/locality) — kept out of the live set
export function tierOf(s) {
  if (s.summary) return 'enriched';
  if (s.website || s.phone || s.area) return 'listing';
  return 'held';
}

// Attach a stable slug + id + tier + hub slugs once.
// Synced Notion data carries its own collision-safe `slug` and Notion `nid`
// (see scripts/sync-notion.mjs). Fall back to computed values for legacy rows.
const SCHOOLS = raw.map((s, i) => ({
  ...s,
  id: s.nid || String(i),
  slug: s.slug || slugify(s.name),
  tier: tierOf(s),
  citySlug: slugify(s.city || 'other'),
  boardSlugs: (s.boards || []).map(slugify),
}));

// The publicly listed set excludes 'held' (bare) records.
const PUBLISHED = SCHOOLS.filter((s) => s.tier !== 'held');

export function getAllSchools() {
  return PUBLISHED;
}

export function getSchoolBySlug(slug) {
  return SCHOOLS.find((s) => s.slug === slug) || null;
}

export function getCities() {
  return [...new Set(PUBLISHED.map((s) => s.city))].filter(Boolean).sort();
}

export function getBoards() {
  return [...new Set(PUBLISHED.flatMap((s) => s.boards || []))].sort();
}

export function getSchoolsByCitySlug(citySlug) {
  return PUBLISHED.filter((s) => s.citySlug === citySlug);
}

export function getSchoolsByBoardSlug(boardSlug) {
  return PUBLISHED.filter((s) => (s.boardSlugs || []).includes(boardSlug));
}

// Enriched-first ordering for hubs/rankings (never paid — plan §brand).
export function byEnrichedFirst(list) {
  const rank = { enriched: 0, listing: 1, held: 2 };
  return [...list].sort((a, b) => (rank[a.tier] - rank[b.tier]) || a.name.localeCompare(b.name));
}

export function fmtFee(n) {
  if (!n) return null;
  if (n >= 100000) return '₹' + (n / 100000).toFixed(n % 100000 ? 1 : 0).replace(/\.0$/, '') + 'L';
  return '₹' + n.toLocaleString('en-IN');
}
