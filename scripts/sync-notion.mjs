// scripts/sync-notion.mjs
// Build-time CMS sync: pulls the full school directory from the Notion
// "IGCSE Schools India — Public Directory" database and materialises it into
// data/schools.json (which lib/schools.js reads at build).
//
// FAIL-SAFE BY DESIGN: on any problem (missing token, network error, Notion API
// change, suspiciously small result) we leave the committed data/schools.json
// untouched and exit 0, so a sync hiccup can NEVER break the production build.
//
// Env:
//   NOTION_TOKEN  — internal integration secret (set in Netlify, never committed)
//   NOTION_DB_ID  — optional; defaults to the Public Directory database id

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'data', 'schools.json');

const TOKEN = process.env.NOTION_TOKEN;
// .env.example historically documented NOTION_DATA_SOURCE_ID while this script read
// NOTION_DB_ID with a *different* hardcoded default — a real config-drift risk if
// Netlify only ever had one of the two names set. Read both, preferring NOTION_DB_ID
// (what this script has always actually used) so an existing Netlify config keeps
// working unchanged; warn loudly when falling back to the hardcoded default, since
// that default may not be the database the daily enrichment automation writes to.
const DEFAULT_DB_ID = '910e3723cfae4e78bd424f8ed09b2bc3';
const DB_ID = process.env.NOTION_DB_ID || process.env.NOTION_DATA_SOURCE_ID || DEFAULT_DB_ID;
const NOTION_VERSION = '2022-06-28';

const log = (...a) => console.log('[sync-notion]', ...a);

// ---- Notion property extractors (public API shapes) ----
const rt = (p) => ((p && (p.rich_text || p.title)) || []).map((x) => x.plain_text).join('').trim() || null;
const sel = (p) => (p && p.select && p.select.name) || null;
const msel = (p) => ((p && p.multi_select) || []).map((x) => x.name);
const num = (p) => (p && typeof p.number === 'number' ? p.number : null);
const urlv = (p) => (p && p.url) || null;
const phone = (p) => (p && p.phone_number) || null;
const dateStart = (p) => (p && p.date && p.date.start) || null;
// Notion "files" property: entries are either `external` (a URL someone pasted
// in, permanent) or `file` (uploaded straight into Notion, whose `url` is a
// SIGNED URL THAT EXPIRES — ~1hr per Notion's API docs). We can't ship an
// expiring URL into a statically-built page, so `expires: true` flags those
// for rehostPhotos() to download and re-host permanently; anything it can't
// rehost gets dropped rather than shipped broken.
const files = (p) => ((p && p.files) || []).map((f) => ({
      name: f.name || null,
      url: f.type === 'external' ? (f.external && f.external.url) : (f.file && f.file.url),
      expires: f.type === 'file',
}));

export function slugify(name) {
      return String(name)
        .toLowerCase()
        .replace(/\([^)]*\)/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Derive a real city for hub pages. The Notion "City" select only has 8 buckets
// (metros + "Other"); for "Other" we parse the finer city out of Area/Locality.
const KNOWN_CITIES = ['Bangalore', 'Mumbai', 'Delhi NCR', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata'];

// Free-text Area/Locality parsing produces genuine misspelling duplicates —
// confirmed live: /city/hoshiapur, /city/hoshiapurt and /city/hoshiarpur were
// three separate one-school pages for the same town. Only merge pairs verified
// to be the same real place; DO NOT extend this by fuzzy-matching short city
// names generally — e.g. Jaipur/Kanpur/Nagpur/Raipur/Udaipur are five different
// real cities that happen to be edit-distance 2 apart.
const CITY_ALIASES = {
      'hoshiapur': 'Hoshiarpur', 'hoshiapurt': 'Hoshiarpur', 'hoshiarpur': 'Hoshiarpur',
      'jodphur': 'Jodhpur', 'jodhpur': 'Jodhpur',
      'bhubaneshwar': 'Bhubaneswar', 'bhubaneswar': 'Bhubaneswar',
      'luchnow': 'Lucknow', 'lucknow': 'Lucknow',
      'tiruppur': 'Tiruppur', 'tirupur': 'Tiruppur',
      'mira-bhayandar': 'Mira Bhayandar', 'mira-bhyander': 'Mira Bhayandar', 'mira bhyander': 'Mira Bhayandar',
      'visakhapatnam': 'Visakhapatnam', 'vishakapatnam': 'Visakhapatnam',
};
function normalizeCity(c) {
      const alias = CITY_ALIASES[c.toLowerCase()];
      return alias || c;
}

export function cityDisplay(citySelect, area) {
      if (citySelect && KNOWN_CITIES.includes(citySelect)) return citySelect;
      if (area) {
              let a = area.split('/')[0].trim();               // take first of "A / B"
        const parts = a.split(',').map((x) => x.trim()).filter(Boolean);
              let c = parts[0] || '';
              if (c.includes(' - ')) c = c.split(' - ').pop().trim();  // "Wadala - Mumbai" -> "Mumbai"
        c = c.replace(/\s+district$/i, '').trim();        // drop trailing "District"
        if (c) return normalizeCity(c);
      }
      return citySelect || 'Other';
}

export function mapPage(pg) {
      const P = pg.properties || {};
      const name = rt(P['Name']);
      if (!name) return null;
      return {
              nid: pg.id,
              name,
              city: cityDisplay(sel(P['City']), rt(P['Area/Locality'])),
              city_bucket: sel(P['City']),
              area: rt(P['Area/Locality']),
              boards: msel(P['Boards Offered']),
              type: sel(P['School Type']),
              gender: sel(P['Gender']),
              grades: rt(P['Grade Range']),
              tuition: rt(P['Annual Tuition (Gr 9-10)']),
              tuition_num: num(P['Annual Tuition ₹ (num)']),
              summary: rt(P['Public Summary']),
              website: urlv(P['Website']),
              phone: phone(P['Phone']),
              est: num(P['Established Year']),
              verified: dateStart(P['Last Verified']),
              gmaps: urlv(P['Google Maps Link']),
              address: rt(P['Address']),
              pincode: rt(P['Pincode']),
              photos_raw: files(P['Photos']),  // consumed by rehostPhotos(), never written to schools.json
      };
}

// Turns each row's photos_raw into a final `photos: string[]` of permanent
// URLs, then drops photos_raw. External links pass through as-is. Notion-
// uploaded files get downloaded and re-uploaded to the public "school-photos"
// Supabase Storage bucket (keyed by Notion page id, so re-syncs overwrite in
// place instead of piling up) — that bucket must exist and be public, see
// db/migrations. Without SUPABASE_SERVICE_ROLE_KEY at build time (or if the
// bucket doesn't exist yet), Notion-uploaded photos are silently dropped for
// this build rather than shipped as a link that dies in about an hour —
// external links still work either way. This never fails the sync.
async function rehostPhotos(rows) {
      const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const canRehost = Boolean(supaUrl && supaKey);
      if (!canRehost) {
              log('SUPABASE_SERVICE_ROLE_KEY not set at build time — Notion-uploaded photos (signed, ' +
                          'expiring URLs) will be dropped this build; external photo URLs are unaffected.');
      }

  for (const row of rows) {
          const raw = row.photos_raw || [];
          const out = [];
          for (const [i, f] of raw.entries()) {
                    if (!f.url) continue;
                    if (!f.expires) { out.push(f.url); continue; }        // external — already permanent
            if (!canRehost) continue;                              // can't rehost this run — drop, don't ship broken
            try {
                        const res = await fetch(f.url);
                        if (!res.ok) throw new Error('fetch ' + res.status);
                        const buf = Buffer.from(await res.arrayBuffer());
                        const ext = (f.name && f.name.includes('.')) ? f.name.split('.').pop().toLowerCase() : 'jpg';
                        const objectPath = `${row.nid}/${i}.${ext}`;
                        // Plain Storage REST calls, not the @supabase/supabase-js SDK: the SDK's
                      // createClient() eagerly spins up a realtime/WebSocket client, which
                      // throws ("native WebSocket not found") under plain Node < 22 — exactly
                      // this build script's environment (Netlify's Node 20 build image) —
                      // even though we only ever touch Storage here. REST sidesteps that.
                      const upRes = await fetch(`${supaUrl}/storage/v1/object/school-photos/${objectPath}`, {
                                    method: 'POST',
                                    headers: {
                                                    Authorization: 'Bearer ' + supaKey,
                                                    'Content-Type': res.headers.get('content-type') || 'application/octet-stream',
                                                    'x-upsert': 'true',
                                    },
                                    body: buf,
                      });
                        if (!upRes.ok) throw new Error('upload ' + upRes.status + ': ' + (await upRes.text()).slice(0, 200));
                        out.push(`${supaUrl}/storage/v1/object/public/school-photos/${objectPath}`);
            } catch (e) {
                        log('photo rehost failed for', row.name, '-', e.message);
            }
          }
          row.photos = out;
          delete row.photos_raw;
  }
}

// School names are NOT unique across campuses (e.g. two "Amity Global School").
// Slugs are the durable public key (URLs + review keying), so make them unique:
// base slug -> base-<locality> -> base-<n>.
export function assignSlugs(rows) {
      const seen = new Set();
      for (const s of rows) {
              let base = slugify(s.name) || 'school';
              let slug = base;
              if (seen.has(slug)) {
                        const loc = slugify((s.area || s.city || '').split(/[,/]/)[0] || '');
                        if (loc && !seen.has(base + '-' + loc)) {
                                    slug = base + '-' + loc;
                        } else {
                                    let i = 2;
                                    while (seen.has(base + '-' + i)) i++;
                                    slug = base + '-' + i;
                        }
              }
              seen.add(slug);
              s.slug = slug;
      }
      return rows;
}


async function queryAll() {
        const rows = [];
        let cursor;
        do {
                      const res = await fetch('https://api.notion.com/v1/databases/' + DB_ID + '/query', {
                                            method: 'POST',
                                            headers: {
                                                                            Authorization: 'Bearer ' + TOKEN,
                                                                            'Notion-Version': NOTION_VERSION,
                                                                            'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify({ page_size: 100, start_cursor: cursor }),
                      });
                      if (!res.ok) throw new Error('Notion API ' + res.status + ': ' + (await res.text()).slice(0, 300));
                      const j = await res.json();
                      for (const pg of j.results || []) {
                                            const m = mapPage(pg);
                                            if (m) rows.push(m);
                      }
                      cursor = j.has_more ? j.next_cursor : undefined;
        } while (cursor);
        return rows;
}

async function main() {
        if (!TOKEN) {
                      log('NOTION_TOKEN not set — keeping committed data/schools.json (fallback).');
                      return;
        }
        if (!process.env.NOTION_DB_ID && !process.env.NOTION_DATA_SOURCE_ID) {
                      log('WARNING: neither NOTION_DB_ID nor NOTION_DATA_SOURCE_ID is set — using the ' +
                                                'hardcoded default (' + DEFAULT_DB_ID + '). Verify in the Netlify dashboard that ' +
                                                'this is actually the database the daily enrichment automation writes to.');
        }
        try {
                      const rows = await queryAll();
                      if (rows.length < 50) {
                                            log('only ' + rows.length + ' rows returned — too low, keeping committed file.');
                                            return;
                      }
                      await rehostPhotos(rows);
                      assignSlugs(rows);
                      rows.sort((a, b) => a.name.localeCompare(b.name));
                      fs.writeFileSync(OUT, JSON.stringify(rows, null, 1));
                      log('OK — wrote ' + rows.length + ' schools to data/schools.json');
        } catch (e) {
                      log('sync failed, keeping committed data/schools.json:', e.message);
        }
}

if (process.argv[1] && process.argv[1].endsWith('sync-notion.mjs')) {
        main();
}
