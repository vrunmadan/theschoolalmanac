import { NextResponse } from 'next/server';
import { supabaseAdmin, reviewsConfigured } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

const TYPES = ['add_school', 'correct_details', 'not_offered', 'remove', 'feedback', 'other'];
const BUCKET = 'submissions';

function rid() {
  return (Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
}

// POST /api/submit — public intake for "suggest a change": add a school, correct
// details, report a curriculum isn't actually offered, request removal, or feedback.
// Each submission is stored as an immutable JSON object in a private Supabase
// Storage bucket (a review queue) — never auto-applied to the live directory.
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

  const now = new Date();
  const record = {
    request_type,
    school_name: school_name || null,
    school_url: school_url || null,
    evidence: evidence || null,
    contact_name: contact_name || null,
    contact_role: contact_role || null,
    contact_email,
    message: message.trim(),
    status: 'new',
    created_at: now.toISOString(),
  };

  // Ensure the private review-queue bucket exists (idempotent; ignore "already exists").
  try { await db.storage.createBucket(BUCKET, { public: false }); } catch { /* noop */ }

  // Flat, time-sortable key so the queue is trivial to list and scan.
  const key = `${now.toISOString().replace(/[:.]/g, '-')}__${request_type}__${rid()}.json`;
  const { error } = await db.storage
    .from(BUCKET)
    .upload(key, Buffer.from(JSON.stringify(record, null, 2)), {
      contentType: 'application/json',
      upsert: false,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: key }, { status: 201 });
}
