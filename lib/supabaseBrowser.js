// Browser Supabase client (anon key — RLS-restricted). Safe for client components.
import { createClient } from '@supabase/supabase-js';

let client = null;
export function supabaseBrowser() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client = createClient(url, key);
  return client;
}
