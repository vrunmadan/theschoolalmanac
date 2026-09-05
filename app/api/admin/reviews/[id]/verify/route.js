import { NextResponse } from 'next/server';
import { supabaseAdmin, reviewsConfigured } from '@/lib/supabaseServer';

// POST /api/admin/reviews/:id/verify?key=ADMIN_KEY
//   { action: 'approve' }  -> promote T0/pending to T2/published (document verification
//                             happened out-of-band, e.g. a parent emailed proof to hello@;
//                             an admin confirms it and calls this endpoint).
//   { action: 'reject' }   -> mark the review 'removed' (failed verification / disputed).
//
// This is the missing link the docs describe as "a separate step (document intake)" —
// without it, no review can ever count toward a published score (see reviewEngine.isCounting,
// which requires verification_tier:'T2' AND status:'published'). Same auth pattern as
// /api/admin/submissions: gated by ADMIN_KEY, 503 until that's set so it's never open.
export async function POST(req, { params }) {
  const ADMIN = process.env.ADMIN_KEY;
  if (!ADMIN) return NextResponse.json({ error: 'admin_key_not_set' }, { status: 503 });
  const key = new URL(req.url).searchParams.get('key');
  if (!key || key !== ADMIN) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!reviewsConfigured()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const { id } = params;
  let body = {};
  try { body = await req.json(); } catch { /* empty body defaults to approve */ }
  const action = body.action === 'reject' ? 'reject' : 'approve';

  const db = supabaseAdmin();
  const { data: existing, error: fetchErr } = await db
    .from('reviews').select('id, status, verification_tier').eq('id', id).maybeSingle();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const patch = action === 'approve'
    ? { verification_tier: 'T2', status: 'published', verified_at: new Date().toISOString() }
    : { status: 'removed' };

  const { data: updated, error } = await db
    .from('reviews').update(patch).eq('id', id).select('id, status, verification_tier').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, review: updated });
}
