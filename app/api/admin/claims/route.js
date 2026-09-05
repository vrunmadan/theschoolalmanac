import { NextResponse } from 'next/server';
import { supabaseAdmin, reviewsConfigured } from '@/lib/supabaseServer';

// GET /api/admin/claims?key=ADMIN_KEY&status=pending — the manual-review queue.
// Before this, a non-domain-matched claim (status:'pending') had no path to
// ever become verified at all. Same auth pattern as /api/admin/submissions
// and /api/admin/reviews.
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
    .from('school_claims')
    .select('id, school_slug, contact_name, contact_role, contact_email, email_domain, domain_match, status, created_at')
    .eq('status', status)
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ count: (data || []).length, claims: data || [] });
}
