/* Soul Economy — Square bridge module (bridge list, Ranks 1 + 3).
   Loads the Square's OWN key + API modules (the same ones square.html
   uses), so no new crypto, no invented endpoints, no backend change.
   - On load: if a Square key (localStorage:soulKey) exists on this
     device, derive its pubkey and cache it as localStorage:soulPubkey
     (a PUBLIC value) so the classic identity-bridge script can read the
     feed identity without doing crypto itself.
   - window.SquareBridge.publishSoul(item): signs a kind-1 Nostr event
     with tags [['soul', slug], ['realm', 'soul-economy']] and posts it
     to POST /api/events. The server indexes it into D1, so the soul is
     instantly searchable via /api/search and listable via
     /api/feed?soul=<slug>. The GitHub PR path in profile.html ALWAYS
     runs alongside this; a failed announce never blocks publishing.
   - If this module fails to load (offline, CDN down), window.SquareBridge
     simply never appears and the profile page keeps its PR-only path.
   Pure helpers are exposed synchronously as window.SquareBridgeHelpers
   so the draft harness can test slug/content without network. */
import { getPublicKey, hexToBytes, signWithHex } from './social/nostr.js';
import { postEvent } from './social/api.js';

var WORKER = 'https://soul-economy.uncommonpope.workers.dev';

function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function buildAnnounce(item) {
  var slug = slugify(item && item.name);
  var desc = String((item && item.desc) || '').replace(/\s+/g, ' ').trim().slice(0, 1500);
  var type = String((item && item.type) || 'soul');
  var file = String((item && item.file) || '');
  var content = 'Published: ' + String((item && item.name) || 'Untitled') + ' (' + type + ')';
  if (desc) content += ' — ' + desc;
  if (file) content += ' · ' + file;
  // Server cap is 4000 chars; stay well under it.
  if (content.length > 3800) content = content.slice(0, 3797) + '…';
  return { slug: slug, content: content, tags: [['soul', slug], ['realm', 'soul-economy']] };
}

if (typeof window !== 'undefined') {
  window.SquareBridgeHelpers = { slugify: slugify, buildAnnounce: buildAnnounce };
}

async function postAnnounce(ev) {
  try {
    return await postEvent(ev);
  } catch (e) {
    // api.js falls back to its legacy worker; if that path also fails,
    // go straight to the main Worker origin before giving up.
    var r = await fetch(WORKER + '/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ev),
    });
    var data = await r.json().catch(function () { return {}; });
    if (!r.ok) throw new Error((data && data.error) || ('HTTP ' + r.status));
    return data;
  }
}

try {
  var hex = null;
  try { hex = localStorage.getItem('soulKey'); } catch (e) { hex = null; }
  if (hex && typeof window !== 'undefined') {
    var pk = getPublicKey(hexToBytes(hex));
    try { localStorage.setItem('soulPubkey', pk); } catch (e) { /* private-mode storage */ }
    window.SquareBridge = {
      pubkey: pk,
      publishSoul: async function (item) {
        var a = buildAnnounce(item);
        if (!a.slug) throw new Error('name required for a Square announce');
        var ev = signWithHex({ kind: 1, tags: a.tags, content: a.content }, hex);
        var res = await postAnnounce(ev);
        return { ok: true, id: res && res.id };
      },
    };
  }
} catch (e) {
  /* No Square identity on this device, or key derivation failed.
     The profile page keeps its PR-only path — nothing breaks. */
}
