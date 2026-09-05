import { NextResponse } from 'next/server';
import crypto from 'crypto';
import engine from '@/lib/reviewEngine';
import { supabaseAdmin, reviewsConfigured } from '@/lib/supabaseServer';
import { getSchoolBySlug } from '@/lib/schools';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const FREE_TEXT_MAX = 4000;

// Pseudonymise the reviewer: we never store raw email/phone against a review.
// No public fallback salt — if this were guessable, reviewer identity hashes would
// be enumerable/linkable across the whole user base. Fail loudly instead.
function parentRef(identity) {
  const salt = process.env.PARENT_HASH_SALT;
  if (!salt) throw new Error('PARENT_HASH_SALT not set');
  return crypto.createHash('sha256').update(salt + '|' + String(identity).toLowerCase()).digest('hex');
}

// POST /api/reviews  — submit a review (starts as pending, unverified)
export async function POST(req) {
  if (!reviewsConfigured()) {
    return NextResponse.json({ error: 'reviews_not_configured' }, { status: 503 });
  }
  const db = supabaseAdmin();
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad_json' }, { status: 400 }); }

  const { school_id, identity, academic_year, ratings, recommend, programme, grade_band,
          years_at_school, relationship, tags = [], fee_inputs = [], free_text } = body;

  // ---- validation ----
  if (!school_id || !identity || !academic_year || !recommend || !ratings || typeof ratings !== 'object') {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }
  if (!getSchoolBySlug(school_id)) {
    return NextResponse.json({ error: 'unknown_school' }, { status: 400 });
  }
  if (typeof identity !== 'string' || !EMAIL_RE.test(identity)) {
    return NextResponse.json({ error: 'invalid_identity' }, { status: 400 });
  }
  if (typeof academic_year !== 'string' || !/^\d{4}-\d{2}$/.test(academic_year)) {
    return NextResponse.json({ error: 'invalid_academic_year' }, { status: 400 });
  }
  for (const p of engine.CONFIG.PARAMS) {
    const s = ratings[p];
    if (!Number.isInteger(s) || s < 1 || s > 5) {
      return NextResponse.json({ error: `invalid_rating:${p}` }, { status: 400 });
    }
  }
  if (!['yes', 'caveats', 'no'].includes(recommend)) {
    return NextResponse.json({ error: 'invalid_recommend' }, { status: 400 });
  }
  if (!Array.isArray(tags) || !tags.every((t) => typeof t === 'string')) {
    return NextResponse.json({ error: 'invalid_tags' }, { status: 400 });
  }
  if (!Array.isArray(fee_inputs)) {
    return NextResponse.json({ error: 'invalid_fee_inputs' }, { status: 400 });
  }
  if (free_text != null && (typeof free_text !== 'string' || free_text.length > FREE_TEXT_MAX)) {
    return NextResponse.json({ error: 'invalid_free_text' }, { status: 400 });
  }

  let ref;
  try { ref = parentRef(identity); }
  catch { return NextResponse.json({ error: 'reviews_not_configured' }, { status: 503 }); }

  // ---- one review per parent / school / year (also enforced by DB constraint) ----
  const { data: existing } = await db.from('reviews')
    .select('parent_ref, school_id, academic_year, status')
    .eq('school_id', school_id).eq('parent_ref', ref);
  const gate = engine.canSubmit(existing || [], { parent_ref: ref, school_id, academic_year });
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 409 });

  // ---- insert review (pending until verified) ----
  const { data: review, error } = await db.from('reviews').insert({
    school_id, parent_ref: ref, academic_year, recommend, programme, grade_band,
    years_at_school, relationship, free_text, verification_tier: 'T0', status: 'pending',
  }).select('id').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Supabase-js has no cross-table transaction here; on a dependent-insert failure,
  // delete the review row rather than leave an orphaned parent with no ratings —
  // partial data would otherwise silently corrupt this school's future score.
  const ratingsResult = await db.from('review_ratings').insert(
    engine.CONFIG.PARAMS.map((p) => ({ review_id: review.id, parameter: p, score: ratings[p] })));
  const tagsResult = tags.length
    ? await db.from('review_tags').insert(tags.map((t) => ({ review_id: review.id, tag_key: t })))
    : { error: null };
  const feesResult = fee_inputs.length
    ? await db.from('review_fee_inputs').insert(
        fee_inputs.filter((f) => f.amount_inr > 0).map((f) => ({
          review_id: review.id, component: f.component, amount_inr: f.amount_inr, academic_year })))
    : { error: null };

  const failure = ratingsResult.error || tagsResult.error || feesResult.error;
  if (failure) {
    await db.from('reviews').delete().eq('id', review.id);
    return NextResponse.json({ error: failure.message }, { status: 500 });
  }

  // Verification is a separate step: an admin confirms proof-of-parent out of band
  // (e.g. a document emailed to hello@) then calls POST /api/admin/reviews/:id/verify.
  return NextResponse.json({ id: review.id, status: 'pending', next: 'verify' }, { status: 201 });
}
