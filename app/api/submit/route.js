import { NextResponse } from 'next/server';
import { supabaseAdmin, reviewsConfigured } from '@/lib/supabaseServer';

const TYPES = ['add_school', 'correct_details', 'not_offered', 'remove', 'feedback', 'other'];

// POST /api/submit — public intake for "suggest a change": add a school, correct
// details, report a curriculum isn't actually offered, request removal, or feedback.
// Everything lands in a review queue (submissions table) — never auto-applied.
export async function POST(req) {
  if (!reviewsConfigured()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const db = supabaseAdmin();
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'bad_json' }, { status: 400 }); }

  const { request_type, school_name, school_url, evidence, contact_name, contact_role, contact_email, message } = body || {};
  if (!TYPES.includes(request_type)) return NextResponse.json({ error: 'invalid_type' }, { status: 400 });
  if (!contact_email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact_email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }
  if (!message || message.trim().length < 5) return NextResponse.json({ error: 'message_too_short' }, { status: 400 });

  const { error } = await db.from('submissions').insert({
    request_type,
    school_name: school_name || null,
    school_url: school_url || null,
    evidence: evidence || null,
    contact_name: contact_name || null,
    contact_role: contact_role || null,
    contact_email,
    message: message.trim(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
