// Seed/upsert catalog.json into Supabase `products` (REST, no deps).
// Slug resolution mirrors scripts/gen-fts-import.mjs so product slugs match
// souls_fts, /p/<slug>.html and data-shop-slug buy buttons.
// Env: SUPABASE_URL, SUPABASE_SERVICE_KEY (never hardcode, never commit).
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SERVICE) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY in env.');
  process.exit(1);
}

// PWYW suggestions — the Pope's call: suggested, never a wall.
const SUGGESTED = {
  'the-profit-lovetax-family.zip': 2999,
  'scribe.zip': 2999,
  'workbench.zip': 2999,
};
const suggest = (type) => (type === 'pack' || type === 'soul' ? 199 : 99);

const items = JSON.parse(readFileSync(path.join(ROOT, 'data/catalog.json'), 'utf8'));
const pDir = path.join(ROOT, 'p');
const files = existsSync(pDir) ? readdirSync(pDir).filter((f) => f.endsWith('.html')) : [];

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const seen = new Set();
const products = items.map((item, i) => {
  let slug = slugify(item.name || item.file || 'soul-' + i);
  if (seen.has(slug) || !files.includes(slug + '.html')) {
    const alt = files.find((f) => f.startsWith(slug + '-') && !seen.has(f.replace(/\.html$/, '')));
    if (alt) slug = alt.replace(/\.html$/, '');
  }
  seen.add(slug);
  const suggestedCents = SUGGESTED[item.file] || suggest(item.type);
  return {
    slug,
    name: String(item.name || item.file || slug),
    type: String(item.type || 'soul'),
    icon: item.icon || '',
    image: item.image || '',
    desc: item.desc || '',
    details: item.details || '',
    mode: 'pwyp',
    price_cents: null,
    suggested_cents: item.suggested ? item.suggested : suggestedCents,
    min_cents: item.min ? item.min : 0,
    license: item.license || 'BUYASOUL-{key}',
    payout_pct: item.payout_pct || 60,
    featured: !!item.featured,
    tags: Array.isArray(item.tags) ? item.tags : [],
    contents: Array.isArray(item.contents) ? item.contents : [],
    requirements: item.requirements || '',
    install: item.install || '',
    version: item.version || '',
    size: item.size || '',
    download: item.download || item.file || '',
    sort: i,
    active: true,
  };
});

async function upsertBatch(batch) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?on_conflict=slug`, {
    method: 'POST',
    headers: {
      apikey: SERVICE,
      Authorization: `Bearer ${SERVICE}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(batch),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

const BATCH = 50;
let done = 0;
for (let i = 0; i < products.length; i += BATCH) {
  await upsertBatch(products.slice(i, i + BATCH));
  done += Math.min(BATCH, products.length - i);
  console.log(`upserted ${done}/${products.length}`);
}

const check = await fetch(`${SUPABASE_URL}/rest/v1/products?select=slug&active=eq.true`, {
  headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` },
});
const rows = await check.json();
console.log(`verify: ${Array.isArray(rows) ? rows.length : '?'} active products in Supabase`);
