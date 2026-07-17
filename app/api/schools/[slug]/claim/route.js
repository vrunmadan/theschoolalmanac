import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin, reviewsConfigured } from '@/lib/supabaseServer';
import { getSchoolBySlug } from '@/lib/schools';

// domain of a website URL, lowercased, without leading www.
function domainOf(url) {
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ''); }
  catch { return null; }
}
function emailDomain(email) {
  const m = String(email || '').toLowerCase().match(/@([^@\s]+)$/);
  return m ? m[1] : null;
}
// same domain, or one is a sub-domain of the other (mail.school.org ~ school.org)
function subOrEq(a, b) {
  return a === b || a.endsWith('.' + b) || b.endsWith('.' + a);
}

// POST /api/schools/:slug/claim — a school rep requests to claim their listing.
// If the work-email domain matches the school's official website domain we treat
// that as a strong signal and auto-verify, issuing a private dashboard token.
export async function POST(req, { params }) {
  const school = getSchoolBySlug(params.slug);
  if (!school) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (!reviewsConfigured()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const db = supabaseAdmin();
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad_json' }, { status: 400 }); }
  const { contact_name, contact_role, contact_email } = body || {};
  if (!contact_email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact_email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  const ed = emailDomain(contact_email);
  const sd = domainOf(school.website);
  const match = Boolean(ed && sd && subOrEq(ed, sd));
  const status = match ? 'verified' : 'pending';
  const token = match ? crypto.randomBytes(24).toString('hex') : null;

  const { error } = await db.from('school_claims').insert({
    school_slug: school.slug,
    contact_name: contact_name || null,
    contact_role: contact_role || null,
    contact_email,
    email_domain: ed,
    domain_match: match,
    status,
    dashboard_token: token,
    verified_at: match ? new Date().toISOString() : null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (match) {
    return NextResponse.json({
      status: 'verified',
      dashboard_token: token,
      message: 'Verified via your school email domain. Save your private dashboard key below.',
    }, { status: 201 });
  }
  return NextResponse.json({
    status: 'pending',
    message: 'Thanks — we could not auto-verify from your email domain, so a human will review this claim and follow up to grant dashboard access.',
  }, { status: 201 });
}
