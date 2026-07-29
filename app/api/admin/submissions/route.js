import { NextResponse } from 'next/server';
import { supabaseAdmin, reviewsConfigured } from '@/lib/supabaseServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'submissions';

// GET /api/admin/submissions?key=... — private review queue for contact-form
// intake (add / correct / remove / feedback). Gated by the ADMIN_KEY env var;
// returns 503 until that is set in Netlify so the endpoint is never open.
export async function GET(req) {
  const ADMIN = process.env.ADMIN_KEY;
  if (!ADMIN) return NextResponse.json({ error: 'admin_key_not_set' }, { status: 503 });
  const key = new URL(req.url).searchParams.get('key');
  if (!key || key !== ADMIN) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!reviewsConfigured()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const db = supabaseAdmin();
  const { data: objects, error } = await db.storage
    .from(BUCKET)
    .list('', { limit: 1000, sortBy: { column: 'name', order: 'desc' } });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = [];
  for (const obj of objects || []) {
    if (!obj.name.endsWith('.json')) continue;
    try {
      const { data: blob } = await db.storage.from(BUCKET).download(obj.name);
      if (blob) items.push({ id: obj.name, ...JSON.parse(await blob.text()) });
    } catch { /* skip unreadable object */ }
  }
  items.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

  return NextResponse.json({ count: items.length, items }, { status: 200 });
}
