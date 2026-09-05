import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin, reviewsConfigured } from '@/lib/supabaseServer';
import { hashToken, TOKEN_TTL_MS } from '@/lib/tokenHash';

// POST /api/admin/claims/:id/verify?key=ADMIN_KEY
//   { action: 'approve' } -> manually verify a non-domain-matched claim after
//                            you've confirmed it some other way (a call, a
//                            document emailed to hello@); issues a dashboard token.
//   { action: 'reject' }  -> mark it rejected.
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
    .from('school_claims').select('id, status').eq('id', id).maybeSingle();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (action === 'reject') {
    const { data: updated, error } = await db.from('school_claims')
      .update({ status: 'rejected' }).eq('id', id).select('id, status').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, claim: updated });
  }

  const dashboardToken = crypto.randomBytes(24).toString('hex');
  const { data: updated, error } = await db.from('school_claims').update({
    status: 'verified',
    verified_at: new Date().toISOString(),
    token_hash: hashToken(dashboardToken),
    token_expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
  }).eq('id', id).select('id, status, contact_email').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // The dashboard token has to reach the school somehow — with no mail provider
  // configured (lib/mailer.js), it's returned here for you to relay manually.
  // Once a provider is wired up, this should email it to updated.contact_email instead.
  return NextResponse.json({ ok: true, claim: updated, dashboard_token: dashboardToken });
}
