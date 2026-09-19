import { NextResponse } from 'next/server';
import { supabaseAdmin, reviewsConfigured } from '@/lib/supabaseServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/admin/submissions?key=...&status=new — private review queue for
// contact-form intake (add / correct / remove / feedback). Gated by the
// ADMIN_KEY env var; returns 503 until that is set in Netlify so the endpoint
// is never open. `status` defaults to 'new'; pass status=all for every row.
// (Previously listed objects out of a Supabase Storage bucket; migrated to a
// proper `submissions` table by db/migrations/0003_submissions_table.sql —
// run that migration before deploying this route.)
export async function GET(req) {
    const ADMIN = process.env.ADMIN_KEY;
    if (!ADMIN) return NextResponse.json({ error: 'admin_key_not_set' }, { status: 503 });
    const url = new URL(req.url);
    const key = url.searchParams.get('key');
    if (!key || key !== ADMIN) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (!reviewsConfigured()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const status = url.searchParams.get('status') || 'new';
    const db = supabaseAdmin();
    let q = db.from('submissions').select('*').order('created_at', { ascending: false });
    if (status !== 'all') q = q.eq('status', status);
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ count: (data || []).length, items: data || [] }, { status: 200 });
}
