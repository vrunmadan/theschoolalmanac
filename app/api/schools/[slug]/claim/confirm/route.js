import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin, reviewsConfigured } from '@/lib/supabaseServer';
import { getSchoolBySlug } from '@/lib/schools';
import { hashToken, TOKEN_TTL_MS } from '@/lib/tokenHash';

// POST /api/schools/:slug/claim/confirm  { claim_id, token }
// The click-through from the confirmation email — proves mailbox control.
// Single-use: the confirm token is cleared once redeemed, and re-confirming an
// already-verified claim is a safe no-op rather than a fresh error or a
// second dashboard token.
export async function POST(req, { params }) {
  const school = getSchoolBySlug(params.slug);
  if (!school) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (!reviewsConfigured()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad_json' }, { status: 400 }); }
  const { claim_id, token } = body || {};
  if (!claim_id || !token) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

  const db = supabaseAdmin();
  const { data: claim } = await db
    .from('school_claims')
    .select('id, status, school_slug, confirm_token_hash, confirm_expires_at')
    .eq('id', claim_id).eq('school_slug', school.slug).maybeSingle();
  if (!claim) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (claim.status === 'verified') {
    return NextResponse.json({ ok: true, status: 'verified', already: true,
      message: 'This claim was already confirmed. Use the dashboard link you were given the first time — this page does not reissue it.' });
  }
  if (claim.status !== 'pending_confirmation') {
    return NextResponse.json({ error: 'not_pending_confirmation' }, { status: 409 });
  }
  if (!claim.confirm_token_hash || hashToken(token) !== claim.confirm_token_hash) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
  }
  if (claim.confirm_expires_at && new Date(claim.confirm_expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'token_expired' }, { status: 401 });
  }

  const dashboardToken = crypto.randomBytes(24).toString('hex');
  const { error } = await db.from('school_claims').update({
    status: 'verified',
    verified_at: new Date().toISOString(),
    token_hash: hashToken(dashboardToken),
    token_expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
    confirm_token_hash: null, // single-use
    confirm_expires_at: null,
  }).eq('id', claim.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true, status: 'verified', dashboard_token: dashboardToken,
    message: 'Confirmed. Save your private dashboard key below — it will not be shown again.',
  });
}
