import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin, reviewsConfigured } from '@/lib/supabaseServer';
import { getSchoolBySlug } from '@/lib/schools';
import { hashToken, CONFIRM_TTL_MS } from '@/lib/tokenHash';
import { sendMail } from '@/lib/mailer';

const SITE = 'https://theschoolalmanac.com';

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
//
// A domain match between the submitted email and the school's own website is a
// real signal but NOT proof of mailbox control — anyone can type an address
// they don't own. So a domain match no longer auto-verifies on the spot: it
// sends a confirmation link to that address, and only clicking it (proving the
// sender actually controls that inbox) promotes the claim to verified and
// issues a dashboard token. No domain match at all still falls back to manual
// admin review (POST /api/admin/claims/:id/verify).
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

  const confirmToken = match ? crypto.randomBytes(24).toString('hex') : null;
  const status = match ? 'pending_confirmation' : 'pending';

  const { data: claim, error } = await db.from('school_claims').insert({
    school_slug: school.slug,
    contact_name: contact_name || null,
    contact_role: contact_role || null,
    contact_email,
    email_domain: ed,
    domain_match: match,
    status,
    confirm_token_hash: match ? hashToken(confirmToken) : null,
    confirm_expires_at: match ? new Date(Date.now() + CONFIRM_TTL_MS).toISOString() : null,
  }).select('id').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (match) {
    const confirmUrl = `${SITE}/schools/${school.slug}/claim/confirm?claim=${claim.id}&token=${confirmToken}`;
    const mail = await sendMail({
      to: contact_email,
      subject: `Confirm your claim of ${school.name} on The School Almanac`,
      text: `Someone requested to claim the ${school.name} listing on The School Almanac using this email address. If that was you, confirm here (valid 48 hours): ${confirmUrl}\n\nIf you didn't request this, ignore this email.`,
    });
    return NextResponse.json({
      status: 'pending_confirmation',
      message: mail.delivered
        ? `Check ${contact_email} for a confirmation link — click it to activate your dashboard.`
        : `Email sending isn't configured on this deployment yet, so here's your confirmation link directly: ${confirmUrl}`,
      // Only present while no mail provider is configured (see lib/mailer.js) —
      // once one is, a claim shouldn't rely on this appearing in an API response.
      ...(mail.delivered ? {} : { dev_confirm_url: confirmUrl }),
    }, { status: 201 });
  }
  return NextResponse.json({
    status: 'pending',
    message: 'Thanks — we could not auto-verify from your email domain, so a human will review this claim and follow up to grant dashboard access.',
  }, { status: 201 });
}
