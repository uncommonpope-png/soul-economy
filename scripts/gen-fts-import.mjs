// Generate api/fts-souls.sql — souls_fts rows for all catalog items.
// Slug resolution mirrors scripts/gen-product-pages.mjs (slugify + dedupe),
// falling back to existing p/<prefix>-*.html files for collision-suffixed names.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const items = JSON.parse(readFileSync(new URL('../data/catalog.json', import.meta.url), 'utf8'));
const pDir = new URL('../p/', import.meta.url);
const files = existsSync(pDir) ? readdirSync(pDir).filter((f) => f.endsWith('.html')) : [];

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const esc = (s) => String(s == null ? '' : s).replace(/'/g, "''");

const seen = new Set();
const rows = [];
for (const item of items) {
  let slug = slugify(item.name || item.file || 'soul');
  if (seen.has(slug) || !files.includes(slug + '.html')) {
    const alt = files.find((f) => f.startsWith(slug + '-') && !seen.has(f.replace(/\.html$/, '')));
    if (alt) slug = alt.replace(/\.html$/, '');
  }
  seen.add(slug);
  const desc = String(item.desc || item.details || '').slice(0, 1000);
  rows.push(
    `INSERT INTO souls_fts (slug, name, type, description) VALUES ('${esc(slug)}', '${esc(item.name)}', '${esc(item.type || '')}', '${esc(desc)}');`
  );
}

writeFileSync(new URL('../api/fts-souls.sql', import.meta.url), rows.join('\n') + '\n');
console.log(`wrote api/fts-souls.sql — ${rows.length} souls`);
