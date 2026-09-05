import { NextResponse } from 'next/server';
import { supabaseAdmin, reviewsConfigured } from '@/lib/supabaseServer';

// GET /api/admin/reviews?key=ADMIN_KEY&status=pending — the queue to work from before
// calling POST /api/admin/reviews/:id/verify on each one. Without this, verify has no
// way to discover review ids. Same auth pattern as /api/admin/submissions.
export async function GET(req) {
  const ADMIN = process.env.ADMIN_KEY;
  if (!ADMIN) return NextResponse.json({ error: 'admin_key_not_set' }, { status: 503 });
  const url = new URL(req.url);
  const key = url.searchParams.get('key');
  if (!key || key !== ADMIN) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!reviewsConfigured()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const status = url.searchParams.get('status') || 'pending';
  const db = supabaseAdmin();
  const { data, error } = await db
    .from('reviews')
    .select('id, school_id, academic_year, recommend, programme, grade_band, relationship, free_text, verification_tier, status, created_at, review_ratings(parameter, score), review_fee_inputs(component, amount_inr, academic_year)')
    .eq('status', status)
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ count: (data || []).length, reviews: data || [] });
}
