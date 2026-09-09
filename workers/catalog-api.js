// Cloudflare Worker: Soul Economy Public API + OpenGraph Proxy (SIP-15 / Sprint 1)
// Deploy as a free Cloudflare Worker, then map routes:
//   1.  api/catalog.json            -> serves data/catalog.json with CORS *
//   2.  api/soul?name=Architect     -> single soul item
//   3.  api/profile?user=craig      -> profiles/<user>.json with CORS
//   4.  og/profile?user=craig       -> dynamic OpenGraph image/meta for shared sanctuary links
// Point the pages' og:image/og:url at this worker (or mirror the meta client-side).
//
// To fetch the canonical data, set DATA_BASE to where catalog.json lives on Pages:
//   https://uncommonpope-png.github.io/soul-economy
const ORIGIN = 'https://uncommonpope-png.github.io/soul-economy';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

// Minimal SVG "trading card" scene rendered server-side so any social crawler
// that calls og/profile?user=X gets a deterministic preview image. We keep it
// compact (a gold-framed card with the handle + equation) — no external fonts.
function cardSvg(handle, squadCount, verified) {
  const name = '@' + (handle || 'guest');
  const squad = (typeof squadCount === 'number' ? squadCount : 8) + '/8 Active';
  const v = verified ? '<rect x="400" y="38" width="150" height="40" rx="20" fill="#000"/><text x="475" y="66" fill="#ffd700" font-size="24" text-anchor="middle" font-family="monospace">VERIFIED</text>' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#0a0a0f"/>
    <rect x="40" y="40" width="1120" height="550" rx="28" fill="none" stroke="#ffd700" stroke-width="6"/>
    <text x="80" y="150" fill="#ffd700" font-size="56" font-family="monospace" font-weight="bold">${name}</text>
    ${v}
    <text x="80" y="220" fill="#cfc7b8" font-size="34" font-family="monospace">◇ Squad  ${squad}</text>
    <text x="80" y="300" fill="#ffd700" font-size="44" font-family="monospace">PROFIT + LOVE - TAX = TRUE VALUE</text>
    <text x="80" y="520" fill="#8f887a" font-size="30" font-family="monospace">BUYaSOUL · DIGITAL LIBRARY OF SOULS</text>
  </svg>`;
}

async function fetchJson(path) {
  const r = await fetch(ORIGIN + path, { headers: { 'Accept': 'application/json' } });
  if (!r.ok) return null;
  try { return await r.json(); } catch (e) { return null; }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    // /api/catalog.json — full catalog, CORS *
    if (path.endsWith('/api/catalog.json')) {
      const data = await fetchJson('/data/catalog.json');
      if (!data) return new Response('Catalog unavailable', { status: 502, headers: CORS });
      return new Response(JSON.stringify(data), {
        headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' }
      });
    }

    // /api/soul?name=... — single item
    if (path.endsWith('/api/soul')) {
      const name = (url.searchParams.get('name') || '').toLowerCase();
      const slug = v => String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
      const data = await fetchJson('/data/catalog.json');
      if (!Array.isArray(data)) return new Response('Unavailable', { status: 502, headers: CORS });
      const hit = data.find(it => {
        const n = String(it.name || '').toLowerCase();
        return n === name || slug(n) === name || slug(it.file || '') === name || String(it.type || '').toLowerCase() === name;
      });
      if (!hit) return new Response('Not found', { status: 404, headers: CORS });
      return new Response(JSON.stringify(hit), { headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // /api/profile?user=... — registry profile, CORS *
    if (path.endsWith('/api/profile')) {
      const user = (url.searchParams.get('user') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 39);
      const data = await fetchJson('/profiles/' + user + '.json');
      if (!data) return new Response('Not found', { status: 404, headers: CORS });
      return new Response(JSON.stringify(data), { headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    // /og/profile?user=... — dynamic OpenGraph SVG preview (social crawlers)
    if (path.endsWith('/og/profile')) {
      const user = (url.searchParams.get('user') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 39);
      const prof = await fetchJson('/profiles/' + user + '.json');
      const handle = (prof && prof.handle) || user || 'guest';
      const count = (prof && Array.isArray(prof.top8)) ? prof.top8.length : 8;
      const svg = cardSvg(handle, count, !!(prof && prof.verified));
      return new Response(svg, { headers: { ...CORS, 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' } });
    }

    return new Response('Soul Economy API. Try /api/catalog.json, /api/soul?name=, /api/profile?user=, /og/profile?user=', {
      status: 404,
      headers: { ...CORS, 'Content-Type': 'text/plain' }
    });
  }
};