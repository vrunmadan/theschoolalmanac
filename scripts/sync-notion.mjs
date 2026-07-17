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
const DB_ID = process.env.NOTION_DB_ID || '910e3723cfae4e78bd424f8ed09b2bc3';
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
export function cityDisplay(citySelect, area) {
  if (citySelect && KNOWN_CITIES.includes(citySelect)) return citySelect;
  if (area) {
    let a = area.split('/')[0].trim();               // take first of "A / B"
    const parts = a.split(',').map((x) => x.trim()).filter(Boolean);
    let c = parts[0] || '';
    if (c.includes(' - ')) c = c.split(' - ').pop().trim();  // "Wadala - Mumbai" -> "Mumbai"
    c = c.replace(/\s+district$/i, '').trim();        // drop trailing "District"
    if (c) return c;
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
  };
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
  try {
    const rows = await queryAll();
    if (rows.length < 50) {
      log('only ' + rows.length + ' rows returned — too low, keeping committed file.');
      return;
    }
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
