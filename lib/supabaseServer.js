// Server-only Supabase client (service role — full access). Never import in a
// client component. Returns null if env is not configured, so the app degrades
// gracefully to a reviews-less directory.
import { createClient } from '@supabase/supabase-js';

export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// PARENT_HASH_SALT is required here too: reviews degrade to "building" (503) rather
// than ever hashing reviewer identity with a guessable/public fallback salt.
export const reviewsConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.PARENT_HASH_SALT);
