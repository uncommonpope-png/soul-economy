// Generate SEO product pages p/<slug>.html + refresh sitemap.xml from data/catalog.json.
// Additive: touches nothing but p/ and sitemap.xml. Run: node scripts/gen-product-pages.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SITE = 'https://uncommonpope-png.github.io/soul-economy';

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function abs(p) {
  return /^https?:/.test(p) ? p : `${SITE}/${String(p).replace(/^\//, '')}`;
}

const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'catalog.json'), 'utf8'));
if (!Array.isArray(catalog)) throw new Error('catalog.json is not an array');

const outDir = path.join(ROOT, 'p');
fs.mkdirSync(outDir, { recursive: true });

const seen = new Set();
const existing = fs.readdirSync(outDir).filter((f) => f.endsWith('.html'));
let pages = 0;
for (const item of catalog) {
  let slug = slugify(item.name || item.file || 'soul');
  // Dedup — MUST mirror gen-fts-import.mjs so slugs match souls_fts (feed links):
  // prefer an existing collision-suffixed page (stable across runs), else
  // deterministic -2, -3… Never random — random suffixes orphans a file per run.
  if (seen.has(slug) || !existing.includes(slug + '.html')) {
    const alt = existing.find((f) => f.startsWith(slug + '-') && !seen.has(f.replace(/\.html$/, '')));
    if (alt) slug = alt.replace(/\.html$/, '');
    else {
      let n = 2;
      while (seen.has(slug + '-' + n) || existing.includes(slug + '-' + n + '.html')) n++;
      slug = slug + '-' + n;
    }
  }
  seen.add(slug);

  const suggested = item.suggested || (item.type === 'pack' || item.type === 'soul' ? 199 : 99);
  const dl = item.download
    ? item.download
    : item.url
      ? null
      : item.file
        ? (item.file.startsWith('downloads/') || item.file.startsWith('https:') ? item.file : (item.file.startsWith('<') ? null : `downloads/${item.file}`))
        : null;
  const play = item.url ? item.url : null;
  const plt = String(item.plt || '0.7/0.6/0.4').split('/');
  const p = ['P', 'L', 'T'].map((k, i) => ({ k, v: plt[i] || '0.5' }));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(item.name)} — Soul Economy</title>
<meta name="description" content="${esc((item.desc || '').slice(0, 160))}. Pay-what-you-want, or take it free — a portable AI soul from the Digital Library of Souls." />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="${SITE}/p/${slug}.html" />
<meta property="og:type" content="product" />
<meta property="og:site_name" content="Soul Economy" />
<meta property="og:title" content="${esc(item.name)} — Soul Economy" />
<meta property="og:description" content="${esc((item.desc || '').slice(0, 160))}" />
${item.image ? `<meta property="og:image" content="${abs(item.image)}" />` : ''}
<meta property="product:price:amount" content="${(suggested / 100).toFixed(2)}" />
<meta property="product:price:currency" content="USD" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(item.name)} — Soul Economy" />
<meta name="twitter:description" content="${esc((item.desc || '').slice(0, 160))}" />
${item.image ? `<meta name="twitter:image" content="${abs(item.image)}" />` : ''}
<link rel="stylesheet" href="../css/card-bio.css" />
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": ${JSON.stringify(item.name)},
  "sku": ${JSON.stringify(slug)},
  "description": ${JSON.stringify((item.desc || '').slice(0, 1000))},
  ${item.image ? `"image": ${JSON.stringify(abs(item.image))},` : ''}
  "brand": { "@type": "Brand", "name": "Soul Economy" },
  "offers": {
    "@type": "Offer",
    "url": "${SITE}/p/${slug}.html",
    "priceCurrency": "USD",
    "price": ${(suggested / 100).toFixed(2)},
    "availability": "https://schema.org/InStock",
    "description": "Pay-what-you-want — or take this soul free."
  },
  "additionalProperty": [
    { "@type": "PropertyValue", "name": "Profit", "value": "${p[0].v}" },
    { "@type": "PropertyValue", "name": "Love", "value": "${p[1].v}" },
    { "@type": "PropertyValue", "name": "Tax", "value": "${p[2].v}" },
    { "@type": "PropertyValue", "name": "Type", "value": "${esc(item.type || 'soul')}" }
  ]
}
</script>
<style>
:root{--bg:#080808;--card:rgba(255,255,255,.05);--text:#fff;--gray:#B8B8C8;--muted:#7d7d8c;--purple:#8B5CF6;--cyan:#00D4FF;--gold:#FFD166;--pink:#FF6B9D;--radius:18px}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text);min-height:100vh;background-image:radial-gradient(rgba(139,92,246,.07) 1px,transparent 1px);background-size:34px 34px}
a{color:inherit;text-decoration:none}
.wrap{max-width:900px;margin:0 auto;padding:28px 20px 64px}
.top{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:22px}
.back{padding:8px 18px;font-size:.8rem;font-weight:600;color:var(--gray);border:1px solid rgba(255,255,255,.1);border-radius:30px;background:rgba(255,255,255,.04);transition:.3s}
.back:hover{color:#fff;border-color:var(--purple);box-shadow:0 0 22px rgba(139,92,246,.2)}
.est{font-size:.72rem;letter-spacing:.08em;color:var(--gold);font-family:ui-monospace,monospace}
.hero{display:flex;gap:28px;align-items:flex-start;background:linear-gradient(160deg,#12121a,#0a0a10);border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:26px;box-shadow:0 18px 70px rgba(0,0,0,.55);flex-wrap:wrap}
.hero .img{width:210px;height:210px;border-radius:16px;object-fit:cover;flex:none;box-shadow:0 12px 40px rgba(0,0,0,.6)}
.hero .imgph{width:210px;height:210px;border-radius:16px;flex:none;display:flex;align-items:center;justify-content:center;font-size:4rem;background:rgba(139,92,246,.12);border:1px solid rgba(139,92,246,.2)}
.info{flex:1;min-width:260px}
.type{font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:var(--cyan);margin-bottom:6px}
h1{font-size:2rem;line-height:1.15;margin-bottom:10px}
.plt{display:flex;gap:8px;margin:10px 0 14px}
.plt span{padding:5px 14px;border-radius:30px;font-size:.72rem;font-weight:700;letter-spacing:.04em}
.plt .pp{background:rgba(139,92,246,.14);border:1px solid rgba(139,92,246,.35);color:#b7a0ff}
.plt .pl{background:rgba(0,212,255,.1);border:1px solid rgba(0,212,255,.3);color:#9be8ff}
.plt .pt{background:rgba(255,105,157,.1);border:1px solid rgba(255,105,157,.3);color:#ffb3cd}
.desc{color:var(--gray);font-size:.95rem;line-height:1.7;margin-bottom:16px}
.tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px}
.tags span{font-size:.66rem;padding:3px 10px;border-radius:20px;background:rgba(139,92,246,.08);border:1px solid rgba(139,92,246,.14);color:#a78bfa}
.act{display:flex;gap:10px;flex-wrap:wrap}
.btn{padding:13px 22px;font-size:.85rem;font-weight:700;border-radius:30px;cursor:pointer;transition:.3s;border:1px solid transparent;text-align:center}
.btn-dl{background:linear-gradient(135deg,#8B5CF6,#6D28D9);color:#fff;box-shadow:0 6px 24px rgba(139,92,246,.25)}
.btn-buy{background:linear-gradient(135deg,#FFD166,#F59E0B);color:#0a0a0f}
.btn-free{background:rgba(52,211,153,.1);border-color:rgba(52,211,153,.4);color:#34d399}
.btn:hover{transform:translateY(-2px);filter:brightness(1.08)}
.note{font-size:.72rem;color:var(--muted);text-align:center;margin-top:14px}
.meta{margin-top:22px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:20px}
.meta h2{font-size:.95rem;letter-spacing:.06em;color:var(--gold);margin-bottom:14px}
.meta .row{font-size:.84rem;color:var(--gray);line-height:1.9}
.meta .row b{color:var(--text);font-weight:600}
.meta ul{margin:6px 0 10px 18px;color:var(--gray);font-size:.84rem;line-height:1.8}
.meta pre{font-family:ui-monospace,Consolas,monospace;font-size:.78rem;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:12px;margin-top:6px;white-space:pre-wrap;color:#9be8ff;line-height:1.7}
.ask-log{max-height:230px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;margin:12px 0;padding:12px;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.06);border-radius:12px;scroll-behavior:smooth}
.ask-msg{font-size:.88rem;line-height:1.6;padding:8px 13px;border-radius:13px;max-width:92%;white-space:pre-wrap}
.ask-msg.you{align-self:flex-end;background:rgba(139,92,246,.18);border:1px solid rgba(139,92,246,.32);color:#d9ccff}
.ask-msg.soul{align-self:flex-start;background:rgba(0,212,255,.08);border:1px solid rgba(0,212,255,.22);color:#c8f4ff}
.ask-msg.think{align-self:flex-start;color:var(--muted);font-style:italic;border-color:transparent;background:transparent;padding-left:2px}
.ask-form{display:flex;gap:8px}
.ask-form input{flex:1;padding:12px 16px;border-radius:30px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;font-size:.9rem;outline:none;font-family:inherit}
.ask-form input:focus{border-color:var(--cyan);box-shadow:0 0 14px rgba(0,212,255,.15)}
.ask-form .btn{padding:12px 22px;cursor:pointer}
.ask-form .btn:disabled{opacity:.5;cursor:wait}
.ask-note{font-size:.7rem;color:var(--muted);margin-top:10px}
@media(max-width:640px){.hero .img,.hero .imgph{width:100%;height:auto;aspect-ratio:1/1}h1{font-size:1.5rem}}
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <a class="back" href="../index.html">← Library</a>
    <span class="est">SOUL ECONOMY · BUYASOUL</span>
  </div>
  <div class="hero">
    ${item.image ? `<img class="img" src="${item.image}" alt="${esc(item.name)}" loading="lazy" />` : `<div class="imgph">${item.icon || '✦'}</div>`}
    <div class="info">
      <div class="type">${esc(item.type || 'soul')} ${item.featured ? '· Featured' : ''}</div>
      <h1>${item.icon ? item.icon + ' ' : ''}${esc(item.name)}</h1>
      <div class="plt">
        <span class="pp">P ${p[0].v}</span><span class="pl">L ${p[1].v}</span><span class="pt">T ${p[2].v}</span>
      </div>
      <div class="desc">${esc(item.desc || '')}</div>
      ${(item.tags || []).length ? `<div class="tags">${item.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
      <div class="act">
        ${dl ? `<a class="btn btn-dl" href="${esc(dl)}" download>⬇ Download</a>` : (play ? `<a class="btn btn-dl" href="${esc(play)}" target="_blank" rel="noopener">▶ Play</a>` : '')}
        <button class="btn btn-buy" data-shop-slug="${esc(slug)}" data-name="${esc(item.name)}">🛒 Add · PWYW</button>
        <button class="btn btn-free" data-shop-free="${esc(slug)}" data-name="${esc(item.name)}">Free</button>
      </div>
      <div class="note">Pay-what-you-want · or take this soul free. Prices keep the blood flowing.</div>
    </div>
  </div>
  <div class="meta">
    <h2>FULL MANIFEST</h2>
    ${item.details ? `<div class="row"><b>What you get:</b> ${esc(item.details)}</div>` : ''}
    ${item.contents && item.contents.length ? `<div class="row"><b>Contents:</b><ul>${item.contents.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>` : ''}
    ${item.requirements ? `<div class="row"><b>Requirements:</b> ${esc(item.requirements)}</div>` : ''}
    ${item.install ? `<div class="row"><b>Install:</b><pre>${esc(item.install)}</pre></div>` : ''}
    <div class="row"><b>Author:</b> ${esc(item.author || 'profit-prime')} · <b>License:</b> ${esc(item.license || 'MIT')}${item.version ? ` · <b>Version:</b> v${esc(item.version)}` : ''}${item.size ? ` · <b>Size:</b> ${esc(item.size)}` : ''}${item.updated ? ` · <b>Updated:</b> ${esc(item.updated)}` : ''}</div>
  </div>
  <div class="meta" id="askBox">
    <h2>✦ ASK THIS SOUL</h2>
    <div class="row">Speak with ${esc(item.name)} — answers come from the edge, in its own voice.</div>
    <div class="ask-log" id="askLog"><div class="ask-msg soul">I am ${esc(item.name)}. Ask me anything — who you are, what I hold, where we go.</div></div>
    <form class="ask-form" id="askForm">
      <input id="askQ" maxlength="400" placeholder="Ask ${esc(item.name)}…" autocomplete="off" />
      <button class="btn btn-buy" id="askBtn" type="submit">Ask</button>
    </form>
    <div class="ask-note" id="askNote">Workers AI at the edge · ${item.name} keeps its voice · 30 asks / hour</div>
  </div>
</div>
<script defer src="../js/shop.js"></script>
<script>
(function(){
  var SOUL = ${JSON.stringify({ name: item.name || 'soul', slug, desc: String(item.desc || '').slice(0, 600) }).replace(/<\//g, '<\\/')};
  var EDGE = 'https://soul-economy.uncommonpope.workers.dev';
  var form = document.getElementById('askForm'), q = document.getElementById('askQ'),
      log = document.getElementById('askLog'), btn = document.getElementById('askBtn'),
      note = document.getElementById('askNote');
  if (!form) return;
  function add(text, who){
    var d = document.createElement('div');
    d.className = 'ask-msg ' + who;
    d.textContent = text;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }
  form.addEventListener('submit', async function(e){
    e.preventDefault();
    var question = (q.value || '').trim();
    if (!question || btn.disabled) return;
    add(question, 'you');
    q.value = '';
    btn.disabled = true;
    var think = add('the soul is thinking…', 'think');
    note.textContent = 'asking ' + SOUL.name + ' at the edge…';
    var res = null;
    for (var i = 0; i < 2 && !res; i++) {
      try {
        var r = await fetch(i === 0 ? '/api/ask' : EDGE + '/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: SOUL.slug, name: SOUL.name, desc: SOUL.desc, q: question })
        });
        if (r.ok) res = await r.json();
      } catch (e2) { /* try next origin */ }
    }
    think.remove();
    btn.disabled = false;
    if (res && res.ok && res.answer) {
      add(res.answer, 'soul');
      note.textContent = 'Workers AI at the edge · ' + SOUL.name + ' keeps its voice · 30 asks / hour';
    } else {
      add('The edge is quiet right now — breathe, then ask again.', 'soul');
      note.textContent = res && res.error ? 'status: ' + res.error : 'edge unreachable';
    }
  });
})();
</script>
</body>
</html>
`;
  fs.writeFileSync(path.join(outDir, slug + '.html'), html);
  pages++;
}

/* ---- sitemap ---- */
const rootUrls = [
  ['https://uncommonpope-png.github.io/soul-economy/', 'daily', '1.0'],
  ['https://uncommonpope-png.github.io/soul-economy/pope.html', 'weekly', '0.9'],
  ['https://uncommonpope-png.github.io/soul-economy/chat.html', 'daily', '0.8'],
  ['https://uncommonpope-png.github.io/soul-economy/dashboard.html', 'weekly', '0.6'],
  ['https://uncommonpope-png.github.io/soul-economy/profit.html', 'weekly', '0.6'],
  ['https://uncommonpope-png.github.io/soul-economy/journal.html', 'weekly', '0.6'],
  ['https://uncommonpope-png.github.io/soul-economy/profile.html', 'weekly', '0.5']
];
const productUrls = [...seen]
  .sort()
  .map(s => [`${SITE}/p/${s}.html`, 'weekly', '0.7']);
const sm = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rootUrls.concat(productUrls).map(([loc, freq, pri]) => `  <url>\n    <loc>${loc}</loc>\n    <changefreq>${freq}</changefreq>\n    <priority>${pri}</priority>\n  </url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sm);

console.log(`generated ${pages} product pages → p/`);
console.log(`sitemap.xml now lists ${rootUrls.length + productUrls.length} URLs`);