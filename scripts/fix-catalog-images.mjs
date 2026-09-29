// One-off repair: data/catalog.json image paths point at dead legacy files
// (skills/*.png, chambers/, combos/, infra/, worlds/, root .png — none exist).
// index.html's inline `items` array carries the real art (cards/*.jpg, souls/*.jpg).
// Rewrite catalog.image to match index by file, then by name, else deterministic card.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

// ── extract index.html items literal ──
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const start = html.indexOf('const items = [');
if (start < 0) throw new Error('items literal not found in index.html');
const open = html.indexOf('[', start);
let depth = 0;
let end = -1;
let inStr = null;
for (let i = open; i < html.length; i++) {
  const c = html[i];
  const prev = html[i - 1];
  if (inStr) {
    if (c === inStr && prev !== '\\') inStr = null;
    continue;
  }
  if (c === "'" || c === '"' || c === '`') inStr = c;
  else if (c === '[') depth++;
  else if (c === ']') {
    depth--;
    if (depth === 0) {
      end = i;
      break;
    }
  }
}
if (end < 0) throw new Error('items literal end not found');
const literal = html.slice(open, end + 1);
const indexItems = new Function('return ' + literal)();
console.log(`index items: ${indexItems.length}`);

// ── existing art ──
const cardsDir = path.join(ROOT, 'downloads/images/cards');
const cards = fs.readdirSync(cardsDir).filter((f) => f.endsWith('.jpg')).sort();
if (!cards.length) throw new Error('no cards art');
const norm = (s) => String(s || '').toLowerCase().trim();

const byFile = new Map();
const byName = new Map();
for (const it of indexItems) {
  if (it.image && it.file && !byFile.has(norm(it.file))) byFile.set(norm(it.file), it.image);
  if (it.image && it.name && !byName.has(norm(it.name))) byName.set(norm(it.name), it.image);
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
const exists = (p) => p && fs.existsSync(path.join(ROOT, p));

const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/catalog.json'), 'utf8'));
let changed = 0;
let kept = 0;
let byNameHits = 0;
let byFileHits = 0;
let fallbacks = 0;
for (const item of catalog) {
  const cur = item.image;
  if (exists(cur)) {
    kept++;
    continue;
  }
  let next = null;
  if (item.file && byFile.has(norm(item.file))) {
    next = byFile.get(norm(item.file));
    byFileHits++;
  } else if (item.name && byName.has(norm(item.name))) {
    next = byName.get(norm(item.name));
    byNameHits++;
  }
  if (!exists(next)) {
    next = 'downloads/images/cards/' + cards[hash(norm(item.name) + '|' + norm(item.file)) % cards.length];
    fallbacks++;
  }
  item.image = next;
  changed++;
}
console.log(`kept(existing art): ${kept} | file-match: ${byFileHits} | name-match: ${byNameHits} | deterministic fallback: ${fallbacks} | changed: ${changed}`);

const stillMissing = catalog.filter((c) => !exists(c.image));
if (stillMissing.length) throw new Error(stillMissing.length + ' still missing: ' + stillMissing.slice(0, 5).map((s) => s.image).join(', '));

fs.writeFileSync(path.join(ROOT, 'data/catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
console.log('wrote data/catalog.json — all 282 image paths resolve on disk');
