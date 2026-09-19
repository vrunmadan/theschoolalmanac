import { NextResponse } from 'next/server';
import { supabaseAdmin, reviewsConfigured } from '@/lib/supabaseServer';

// POST /api/admin/submissions/:id?key=ADMIN_KEY
//   { action: 'actioned' }  -> mark this submission handled (change made / replied).
//   { action: 'dismissed' } -> mark it reviewed with no action taken.
// New alongside the move off Storage-bucket intake (db/migrations/0003) — the
// old bucket-of-JSON-files had no way to mark an item handled, so the queue
// only ever grew. Defaults to 'actioned' so an empty body still moves the item
// out of the default GET /api/admin/submissions (status=new) view.
export async function POST(req, { params }) {
    const ADMIN = process.env.ADMIN_KEY;
    if (!ADMIN) return NextResponse.json({ error: 'admin_key_not_set' }, { status: 503 });
    const key = new URL(req.url).searchParams.get('key');
    if (!key || key !== ADMIN) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    if (!reviewsConfigured()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const { id } = params;
    let body = {};
    try { body = await req.json(); } catch { /* empty body defaults to actioned */ }
    const status = body.action === 'dismissed' ? 'dismissed' : 'actioned';

  const db = supabaseAdmin();
    const { data: existing, error: fetchErr } = await db
      .from('submissions').select('id, status').eq('id', id).maybeSingle();
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { data: updated, error } = await db.from('submissions')
      .update({ status }).eq('id', id).select('id, status').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, submission: updated });
}
