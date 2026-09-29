// Seed D1 soul_vec with Workers AI embeddings for every catalog item (Phase 4b).
// Slug resolution mirrors scripts/gen-fts-import.mjs (slugify + p/ dir dedup) so
// soul_vec.slug matches souls_fts.slug and p/<slug>.html.
// Resume-safe: skips slugs already in D1. Idempotent via INSERT OR REPLACE.
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdtempSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODEL = '@cf/baai/bge-base-en-v1.5';
const DIMS = 768;
const ACCOUNT = '25b6606adb037d75556166f348bf48b8';
const { api_token: TOKEN } = JSON.parse(readFileSync('C:/Users/uncom/.cloudflare/creds.json', 'utf8').replace(/^\uFEFF/, ''));
const CONCURRENCY = 4;

const items = JSON.parse(readFileSync(path.join(ROOT, 'data/catalog.json'), 'utf8'));
const pDir = path.join(ROOT, 'p');
const files = existsSync(pDir) ? readdirSync(pDir).filter((f) => f.endsWith('.html')) : [];

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
const esc = (s) => String(s == null ? '' : s).replace(/'/g, "''");

const seen = new Set();
const targets = [];
for (const item of items) {
  let slug = slugify(item.name || item.file || 'soul');
  if (seen.has(slug) || !files.includes(slug + '.html')) {
    const alt = files.find((f) => f.startsWith(slug + '-') && !seen.has(f.replace(/\.html$/, '')));
    if (alt) slug = alt.replace(/\.html$/, '');
  }
  seen.add(slug);
  const desc = String(item.desc || item.details || '').slice(0, 1000);
  targets.push({ slug, name: String(item.name || 'soul'), type: String(item.type || ''), desc });
}

// ── resume: slugs already embedded ──
const done = new Set();
try {
  const out = execSync(
    `npx wrangler d1 execute soul-economy --remote --json --command "SELECT slug FROM soul_vec"`,
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 120000 }
  );
  const parsed = JSON.parse(out);
  for (const r of parsed[0]?.results || []) done.add(r.slug);
} catch (e) {
  console.log('existing-slug query failed (fresh DB?) → embedding all:', String(e).slice(0, 120));
}
const todo = targets.filter((t) => !done.has(t.slug));
console.log(`targets: ${targets.length} | already embedded: ${done.size} | to embed: ${todo.length}`);
if (!todo.length) {
  console.log('nothing to do');
  process.exit(0);
}

async function embed(text) {
  const body = JSON.stringify({ text: text.slice(0, 2000) });
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/ai/run/${MODEL}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        body,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const json = await res.json();
      const v = json?.result?.data?.[0];
      if (!Array.isArray(v) || v.length !== DIMS) throw new Error(`bad vector len=${v?.length}`);
      return v.map((x) => +x.toFixed(4));
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 800 * 2 ** attempt));
    }
  }
  throw lastErr;
}

const results = new Array(todo.length);
let next = 0;
let failed = 0;
async function worker() {
  while (next < todo.length) {
    const i = next++;
    const t = todo[i];
    try {
      const vec = await embed(`${t.name} [${t.type}] ${t.desc}`);
      results[i] = { ...t, vec };
    } catch (e) {
      failed++;
      console.log(`FAILED ${t.slug}: ${String(e).slice(0, 160)}`);
    }
    if ((i + 1) % 40 === 0) console.log(`progress ${i + 1}/${todo.length}`);
  }
}
const t0 = Date.now();
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log(`embedded ok: ${results.filter(Boolean).length} failed: ${failed} in ${Math.round((Date.now() - t0) / 1000)}s`);
if (!results.filter(Boolean).length) process.exit(1);

const sql = results
  .filter(Boolean)
  .map(
    (r) =>
      `INSERT OR REPLACE INTO soul_vec (slug, name, type, description, dims, embedding, updated_at) VALUES ('${esc(r.slug)}', '${esc(r.name)}', '${esc(r.type)}', '${esc(r.desc)}', ${DIMS}, '${JSON.stringify(r.vec)}', datetime('now'));`
  )
  .join('\n');
const sqlFile = path.join(mkdtempSync(path.join(os.tmpdir(), 'soulvec-')), 'soul-vec.sql');
writeFileSync(sqlFile, sql + '\n');
console.log(`wrote ${sqlFile} (${(sql.length / 1024).toFixed(0)} KB, ${results.filter(Boolean).length} rows)`);

execSync(`npx wrangler d1 execute soul-economy --remote --file "${sqlFile}"`, {
  cwd: ROOT,
  encoding: 'utf8',
  stdio: 'inherit',
  timeout: 300000,
});

const check = execSync(
  `npx wrangler d1 execute soul-economy --remote --json --command "SELECT COUNT(*) AS n, COUNT(DISTINCT dims) AS d FROM soul_vec"`,
  { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 120000 }
);
console.log('verify:', JSON.parse(check)[0]?.results?.[0]);
