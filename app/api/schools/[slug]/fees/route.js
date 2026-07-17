import { NextResponse } from 'next/server';
import { supabaseAdmin, reviewsConfigured } from '@/lib/supabaseServer';
import { getSchoolBySlug } from '@/lib/schools';

const COMPONENTS = ['tuition', 'admission', 'transport', 'tech_books', 'deposit', 'other'];

async function listFees(db, slug) {
  const { data } = await db
    .from('school_fee_submissions')
    .select('component, amount_inr, academic_year, stated_at, notes')
    .eq('school_id', slug)
    .order('stated_at', { ascending: false });
  return (data || []).map((f) => ({ ...f, amount_inr: Number(f.amount_inr) }));
}

// A verified claim's dashboard_token is the bearer key for fee edits.
async function claimForToken(db, slug, token) {
  if (!token) return null;
  const { data } = await db
    .from('school_claims')
    .select('id, contact_name, contact_role, contact_email, status')
    .eq('school_slug', slug)
    .eq('dashboard_token', token)
    .eq('status', 'verified')
    .maybeSingle();
  return data || null;
}

// POST /api/schools/:slug/fees
//   { token, action:'auth' }                 -> validate token, return claim + current fees
//   { token, action:'add', component, amount_inr, academic_year, notes }
export async function POST(req, { params }) {
  const school = getSchoolBySlug(params.slug);
  if (!school) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (!reviewsConfigured()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const db = supabaseAdmin();
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad_json' }, { status: 400 }); }
  const { token, action } = body || {};

  const claim = await claimForToken(db, school.slug, token);
  if (!claim) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  if (action === 'auth') {
    return NextResponse.json({
      ok: true,
      claim: { contact_name: claim.contact_name, contact_role: claim.contact_role },
      fees: await listFees(db, school.slug),
    });
  }

  if (action === 'add') {
    const { component, academic_year, notes } = body;
    const amount = Number(body.amount_inr);
    if (!COMPONENTS.includes(component)) return NextResponse.json({ error: 'invalid_component' }, { status: 400 });
    if (!(amount >= 0) || !Number.isFinite(amount)) return NextResponse.json({ error: 'invalid_amount' }, { status: 400 });
    if (!academic_year || !/^\d{4}-\d{2}$/.test(academic_year)) return NextResponse.json({ error: 'invalid_year' }, { status: 400 });

    const { error } = await db.from('school_fee_submissions').insert({
      school_id: school.slug,
      component,
      amount_inr: amount,
      academic_year,
      submitted_by: claim.contact_email,
      notes: notes || null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, fees: await listFees(db, school.slug) }, { status: 201 });
  }

  return NextResponse.json({ error: 'bad_action' }, { status: 400 });
}
