import { NextResponse } from 'next/server';
import crypto from 'crypto';
import engine from '@/lib/reviewEngine';
import { supabaseAdmin, reviewsConfigured } from '@/lib/supabaseServer';

// Pseudonymise the reviewer: we never store raw email/phone against a review.
function parentRef(identity) {
  const salt = process.env.PARENT_HASH_SALT || 'tsa-default-salt';
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
  if (!school_id || !identity || !academic_year || !recommend || !ratings) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
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

  const ref = parentRef(identity);

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

  await db.from('review_ratings').insert(
    engine.CONFIG.PARAMS.map((p) => ({ review_id: review.id, parameter: p, score: ratings[p] })));
  if (tags.length) await db.from('review_tags').insert(tags.map((t) => ({ review_id: review.id, tag_key: t })));
  if (fee_inputs.length) await db.from('review_fee_inputs').insert(
    fee_inputs.filter((f) => f.amount_inr > 0).map((f) => ({
      review_id: review.id, component: f.component, amount_inr: f.amount_inr, academic_year })));

  // Verification is a separate step (POST /api/reviews/:id/verify — document intake).
  return NextResponse.json({ id: review.id, status: 'pending', next: 'verify' }, { status: 201 });
}
