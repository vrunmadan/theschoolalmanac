import { NextResponse } from 'next/server';
import engine from '@/lib/reviewEngine';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { getSchoolBySlug } from '@/lib/schools';

// GET /api/schools/:slug/scores
// Returns computed verified scores + published reviews for a school.
// Degrades to { status:'building' } when Supabase isn't configured yet.
export async function GET(_req, { params }) {
  const school = getSchoolBySlug(params.slug);
  if (!school) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const db = supabaseAdmin();
  if (!db) {
    return NextResponse.json({
      status: 'building', nVerified: 0, overall: null, params: {}, reviews: [], feesByComponent: {},
    });
  }

  // pull published, non-excluded reviews + their ratings/fees for this school
  const { data: reviews, error } = await db
    .from('reviews')
    .select('id, recommend, verification_tier, status, excluded, verified_at, created_at, grade_band, programme, free_text, is_anonymous, review_ratings(parameter, score), review_fee_inputs(component, amount_inr, academic_year), review_responses(response_text, responded_at)')
    .eq('school_id', school.slug)
    .eq('status', 'published')
    .eq('excluded', false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // reshape ratings into { param: score } for the engine
  const shaped = (reviews || []).map((r) => ({
    ...r,
    ratings: Object.fromEntries((r.review_ratings || []).map((x) => [x.parameter, x.score])),
  }));

  // city priors: simple mean per param across this city's already-scored schools.
  // For v1 we use a neutral prior; replace with a cached city aggregate.
  const cityPriors = Object.fromEntries(engine.CONFIG.PARAMS.map((p) => [p, 3.5]));

  const scores = engine.computeSchoolScores(shaped, cityPriors);

  const feeInputs = shaped.flatMap((r) =>
    (r.review_fee_inputs || []).map((f) => ({ ...f, tier: r.verification_tier })));
  const feesByComponent = {};
  for (const comp of ['tuition', 'admission', 'transport', 'tech_books', 'deposit']) {
    const agg = engine.aggregateFees(feeInputs, comp);
    if (agg.n > 0) feesByComponent[comp] = agg;
  }

  const publicReviews = shaped.map((r) => ({
    id: r.id, recommend: r.recommend, grade_band: r.grade_band, programme: r.programme,
    free_text: r.free_text, verified_at: r.verified_at, ratings: r.ratings,
    response: (r.review_responses || [])[0] || null,
  }));

  // School-stated fees (source-tagged): latest submission per component.
  // Schools may state their own fee but can never hide parent-reported fees.
  const { data: sfees } = await db
    .from('school_fee_submissions')
    .select('component, amount_inr, academic_year, stated_at')
    .eq('school_id', school.slug)
    .order('stated_at', { ascending: false });
  const schoolFees = {};
  for (const f of sfees || []) {
    if (!schoolFees[f.component]) {
      schoolFees[f.component] = {
        amount_inr: Number(f.amount_inr),
        academic_year: f.academic_year,
        stated_at: f.stated_at,
      };
    }
  }

  return NextResponse.json({ ...scores, feesByComponent, schoolFees, reviews: publicReviews });
}
