/* Soul Economy — server-mode profile rendering (unify step 1).
   Runs ONLY on profile.html in server mode (?pubkey= / #pk=), invoked by
   js/profile-social.js (window.SoulServer.boot) after the local canvas
   renders. Server data renders as the PRIMARY profile; local sections
   with no server equivalent (portfolio, guests, shop, theme CSS, audio)
   keep rendering from soulProfileV1, marked local-only.
   - Reads are public: GET /api/profile + GET /api/shelf, same-origin
     first, Worker origin fallback (the identity-bridge/ticker pattern —
     the Pages mirror needs the fallback for /api/*).
   - Follow reuses the Square kind-3 toggle logic (fetch follows, toggle
     one entry, sign, POST /api/events). It does NOT import
     js/social/feed.js (frozen) and does NOT mirror to relays — follow
     state is server-authoritative; relays catch up on the next Square
     follow action. Signing comes from js/social/auth.js (side-effect-
     free module, allowed on the profile page).
   - Shelf writes use the existing NIP-98 pattern (signed kind-27235
     bound to the exact request URL + method, max 600s old — copied from
     POST /api/notify/read). The auth event is re-signed when falling
     back to the Worker origin, because the URL binding changes.
   - Failure posture everywhere: keep the local render, add an honest
     note. Never a blank page, never a fake server profile. */
import { signEvent } from './social/auth.js';

const WORKER = 'https://soul-economy.uncommonpope.workers.dev';
const SHELF_TTL_NOTE = 'Local-only — lives on this device, not yet on the Square.';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function snip(s, n) {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/* Pure shelf validation — harness-tested verbatim from this file AND
   from api/src/index.js (both must enforce the same rules).
   Rules: array, max 8 (over-8 is an ERROR, never silent truncation),
   each slug 1–80 chars of [a-z0-9-], deduped preserving order.
   Catalog membership is NOT enforced server-side (the Worker has no
   catalog copy): unknown-but-well-formed slugs store fine and render
   as plain tiles client-side. */
export function validateShelfSlugs(slugs) {
  if (!Array.isArray(slugs)) return { ok: false, error: 'shelf must be an array' };
  if (slugs.length > 8) return { ok: false, error: 'shelf holds at most 8 souls' };
  const seen = new Set();
  const out = [];
  for (const raw of slugs) {
    const s = String(raw || '').trim().toLowerCase();
    if (!s || s.length > 80 || !/^[a-z0-9][a-z0-9-]*$/.test(s)) {
      return { ok: false, error: 'bad slug: ' + String(raw || '').slice(0, 40) };
    }
    if (!seen.has(s)) { seen.add(s); out.push(s); }
  }
  return { ok: true, slugs: out };
}

async function fetchJson(url, timeoutMs) {
  let ctl = null;
  try { ctl = new AbortController(); } catch (e) { /* older webview */ }
  let timer = null;
  try {
    if (ctl) timer = setTimeout(() => { try { ctl.abort(); } catch (e) {} }, timeoutMs);
    const r = await fetch(url, { signal: ctl ? ctl.signal : undefined });
    if (!r.ok) return null;
    return await r.json().catch(() => null);
  } catch (e) {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
async function fetchApi(path, timeoutMs) {
  const data = await fetchJson(path, timeoutMs || 6000);
  if (data) return data;
  return await fetchJson(WORKER + path, timeoutMs || 6000);
}
async function postApi(path, body, timeoutMs) {
  const send = async (base) => {
    let ctl = null;
    try { ctl = new AbortController(); } catch (e) {}
    let timer = null;
    try {
      if (ctl) timer = setTimeout(() => { try { ctl.abort(); } catch (e) {} }, timeoutMs || 9000);
      const r = await fetch(base + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctl ? ctl.signal : undefined,
      });
      const data = await r.json().catch(() => ({}));
      return { ok: r.ok, status: r.status, data };
    } catch (e) {
      return null;
    } finally {
      if (timer) clearTimeout(timer);
    }
  };
  const first = await send('');
  if (first) return first;
  return await send(WORKER);
}

function readLocalState() {
  try {
    return JSON.parse(localStorage.getItem('soulProfileV1') || 'null') || {};
  } catch (e) {
    return {};
  }
}
function localTop8() {
  const st = readLocalState();
  return Array.isArray(st.top8) ? st.top8.slice(0, 8) : [];
}

const cache = {
  pk: null, ownPk: null, profile: null, shelf: null,
  shelfUnavailable: false, catalog: null, catalogFailed: false,
};

function $(id) { return document.getElementById(id); }
function shortPk(pk) { return (pk || '').slice(0, 16) + '…'; }

function ensureNote(beforeEl, key, text) {
  if (!beforeEl || !beforeEl.parentNode) return null;
  let n = beforeEl.parentNode.querySelector('[data-server-note="' + key + '"]');
  if (!n) {
    n = document.createElement('div');
    n.setAttribute('data-server-note', key);
    n.style.cssText = 'font-size:0.75rem;color:#9be8ff;margin:0 0 10px';
    beforeEl.parentNode.insertBefore(n, beforeEl);
  }
  n.textContent = text;
  return n;
}
function ensureBanner(text) {
  const cv = $('user-profile-canvas');
  if (!cv) return;
  let b = cv.querySelector('[data-server-banner]');
  if (!b) {
    b = document.createElement('div');
    b.setAttribute('data-server-banner', '1');
    b.style.cssText = 'padding:12px 16px;border-radius:16px;background:rgba(0,212,255,0.08);border:1px solid rgba(0,212,255,0.35);font-size:0.8rem;color:#fff;margin-bottom:16px';
    cv.insertBefore(b, cv.firstChild);
  }
  b.innerHTML = text;
}

function renderIdentity() {
  const box = $('upcIdentity');
  if (!box || !cache.profile) return;
  const data = cache.profile;
  const u = data.user || {};
  const counts = data.counts || {};
  const isOwner = !!cache.ownPk && cache.ownPk === cache.pk;
  const name = u.display_name || u.name || (data.user ? shortPk(cache.pk) : 'Unknown Square key');
  const about = u.about || '';
  const pic = u.picture || '';
  const recent = data.recent || [];
  let html = '<div style="font-size:0.7rem;letter-spacing:0.14em;color:#00D4FF;margin-bottom:6px">◇ SQUARE PROFILE — SERVER-BACKED</div>' +
    '<div class="row">' +
    (pic && /^https?:\/\//i.test(pic)
      ? '<img class="avatar" src="' + esc(pic) + '" alt="avatar" onerror="this.style.display=\'none\'">'
      : '') +
    '<div><div style="font-size:1.3rem;font-weight:800">' + esc(name) + '</div>' +
    '<div style="font-size:0.75rem;color:var(--text-muted)" title="' + esc(cache.pk) + '">' + shortPk(cache.pk) + '</div>' +
    (about ? '<div style="font-size:0.85rem;color:var(--text-gray);margin-top:6px">' + esc(about) + '</div>' : '') +
    '</div></div>' +
    '<div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap">' +
    '<span class="badge">' + (counts.posts || 0) + ' posts</span>' +
    '<span class="badge">' + (counts.followers || 0) + ' followers</span>' +
    '<span class="badge">' + (counts.following || 0) + ' following</span>' +
    '</div>';
  if (!data.user) {
    html += '<p style="font-size:0.85rem;color:var(--text-gray);margin-top:10px">No Square profile for this key yet — they have not posted or set a name. Following still works.</p>';
  }
  if (isOwner) {
    html += '<div style="margin-top:12px"><span class="badge" style="border-color:rgba(255,209,102,0.5);color:#FFD166">This is you</span></div>';
  } else if (!cache.ownPk) {
    html += '<div style="margin-top:12px"><a href="square.html" class="upc-btn cyan" style="display:inline-block;text-decoration:none">◇ Open the Square to connect your key</a>' +
      '<span style="font-size:0.75rem;color:var(--text-muted);margin-left:8px">Following needs a connected key.</span></div>';
  } else {
    const following = !!data.is_following;
    html += '<div style="margin-top:12px"><button id="upcServerFollow" class="upc-btn ' + (following ? '' : 'cyan') + '">' +
      (following ? 'Following' : '✦ Follow') + '</button>' +
      '<span id="upcServerFollowNote" style="font-size:0.75rem;color:var(--text-muted);margin-left:8px"></span></div>';
  }
  if (recent.length) {
    html += '<div style="margin-top:14px"><div style="font-size:0.8rem;color:var(--text-gray);margin-bottom:6px">Recent in the Square:</div>' +
      recent.slice(0, 5).map((p) => '<div style="font-size:0.8rem;color:var(--text-gray);margin:4px 0">✦ ' + esc(snip(p.content, 160)) + '</div>').join('') + '</div>';
  }
  html += '<div style="margin-top:12px"><a href="square.html" style="color:#00D4FF;font-size:0.85rem">→ View in the Square</a></div>';
  box.innerHTML = html;
  const fb = $('upcServerFollow');
  if (fb) fb.addEventListener('click', onFollowClick);
}

async function onFollowClick() {
  const fb = $('upcServerFollow');
  const note = $('upcServerFollowNote');
  if (!fb || !cache.ownPk || !cache.pk) return;
  fb.disabled = true;
  try {
    const data = await fetchApi('/api/follows?pubkey=' + encodeURIComponent(cache.ownPk));
    const set = new Set((data && data.followees) || []);
    const wasFollowing = set.has(cache.pk);
    if (wasFollowing) set.delete(cache.pk);
    else set.add(cache.pk);
    const ev = await signEvent({ kind: 3, tags: [...set].map((p) => ['p', p]) });
    const res = await postApi('/api/events', ev);
    if (!res || !res.ok) throw new Error((res && res.data && res.data.error) || 'post failed');
    fb.classList.toggle('cyan', wasFollowing);
    fb.textContent = wasFollowing ? '✦ Follow' : 'Following';
    if (note) note.textContent = wasFollowing ? 'Unfollowed.' : 'Following — server state updated.';
  } catch (e) {
    if (note) note.textContent = 'Follow failed — ' + (e.message || 'offline');
  } finally {
    fb.disabled = false;
  }
}

function tileForSlug(slug) {
  let item = null;
  if (cache.catalog) {
    for (const it of cache.catalog) {
      if (slugify(it.name) === slug) { item = it; break; }
    }
  }
  const name = item ? item.name : slug;
  const icon = item ? (item.icon || '✦') : '✦';
  const ty = item ? (item.type || 'soul') : 'catalog slug';
  return '<div class="upc-soul"><a href="index.html#soul-' + encodeURIComponent(slug) + '" style="display:block" title="Open in Library">' +
    '<div class="ic">' + esc(icon) + '</div><div class="nm">' + esc(name) + '</div><div class="ty">' + esc(ty) + '</div></a></div>';
}

function renderShelf() {
  const box = $('upcTop8');
  if (!box) return;
  const isOwner = !!cache.ownPk && cache.ownPk === cache.pk;
  const local = localTop8();
  const localSlugs = local.map((n) => slugify(n)).filter(Boolean);
  let note = '';
  let slugs = null;
  if (cache.shelfUnavailable || cache.shelf === null) {
    // Server shelf unknown (table missing or fetch failed): show this
    // device's shelf, labeled honestly — never a fake server shelf.
    slugs = localSlugs;
    note = cache.shelfUnavailable
      ? 'Square shelves are not live yet — showing this device’s shelf.'
      : 'Showing this device’s shelf.';
  } else if (cache.shelf.length) {
    slugs = cache.shelf;
    note = 'From the Square.';
  } else {
    slugs = localSlugs;
    note = 'Not yet on the Square — showing this device’s shelf.';
  }
  ensureNote(box, 'shelf', note);
  let html = '';
  if (!slugs.length) {
    html = '<div class="upc-empty">No equipped souls yet.</div>';
  } else {
    html = '<div class="upc-grid">' + slugs.map(tileForSlug).join('') + '</div>';
  }
  const serverSlugs = (cache.shelf && !cache.shelfUnavailable) ? cache.shelf : null;
  const differs = isOwner && serverSlugs !== null &&
    (serverSlugs.join(',') !== localSlugs.join(','));
  const showPush = isOwner && (serverSlugs === null || differs) && !cache.shelfUnavailable;
  if (showPush) {
    html += '<div style="margin-top:12px"><button id="upcPushShelf" class="upc-btn cyan">⬆ Push my local shelf to the Square</button>' +
      '<span id="upcPushNote" style="font-size:0.75rem;color:var(--text-muted);margin-left:8px"></span></div>';
  } else if (isOwner && serverSlugs !== null && !differs) {
    html += '<div style="margin-top:12px;font-size:0.75rem;color:var(--text-muted)">Server shelf matches this device.</div>';
  }
  box.innerHTML = html;
  const pb = $('upcPushShelf');
  if (pb) pb.addEventListener('click', onPushShelf);
}

async function onPushShelf() {
  const btn = $('upcPushShelf');
  const note = $('upcPushNote');
  if (!btn || !cache.ownPk) return;
  btn.disabled = true;
  try {
    const slugs = localTop8().map((n) => slugify(n)).filter(Boolean);
    const v = validateShelfSlugs(slugs);
    if (!v.ok) throw new Error(v.error);
    let unknown = 0;
    if (cache.catalog) {
      const known = new Set(cache.catalog.map((it) => slugify(it.name)));
      unknown = v.slugs.filter((s) => !known.has(s)).length;
    }
    if (unknown && note) note.textContent = unknown + ' slug(s) are not in the catalog — they will show as plain names.';
    // NIP-98: sign an auth event bound to the EXACT request URL. The
    // fallback origin changes the URL, so re-sign for it.
    const postWithAuth = async (base) => {
      const url = base + '/api/shelf';
      const auth = await signEvent({ kind: 27235, tags: [['u', url], ['method', 'POST']], content: '' });
      let ctl = null;
      try { ctl = new AbortController(); } catch (e) {}
      let timer = null;
      try {
        if (ctl) timer = setTimeout(() => { try { ctl.abort(); } catch (e) {} }, 9000);
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pubkey: cache.ownPk, shelf: v.slugs, auth }),
          signal: ctl ? ctl.signal : undefined,
        });
        const data = await r.json().catch(() => ({}));
        return { ok: r.ok, status: r.status, data };
      } catch (e) {
        return null;
      } finally {
        if (timer) clearTimeout(timer);
      }
    };
    let res = await postWithAuth('');
    if (!res) res = await postWithAuth(WORKER);
    if (!res) throw new Error('offline');
    if (!res.ok) {
      if (res.status === 503) throw new Error('Square shelves are not live yet (migration pending) — your shelf stays on this device.');
      throw new Error((res.data && res.data.error) || ('HTTP ' + res.status));
    }
    cache.shelf = v.slugs;
    cache.shelfUnavailable = false;
    renderShelf();
    const n2 = $('upcPushNote');
    if (n2) n2.textContent = 'Shelf pushed to the Square.';
  } catch (e) {
    if (note) note.textContent = 'Push failed — ' + (e.message || 'offline');
  } finally {
    btn.disabled = false;
  }
}

function applyLocalOnlyBadges() {
  ['upcPortfolio', 'upcGuests', 'upcShop', 'upcCss'].forEach((id) => {
    const box = $(id);
    if (!box) return;
    let n = box.querySelector('[data-server-note="local-' + id + '"]');
    if (!n) {
      n = document.createElement('div');
      n.setAttribute('data-server-note', 'local-' + id);
      n.style.cssText = 'font-size:0.75rem;color:#9be8ff;margin:0 0 10px';
      if (box.firstChild) box.insertBefore(n, box.firstChild);
      else box.appendChild(n);
    }
    n.textContent = SHELF_TTL_NOTE;
  });
}

function applyVisitorTreatment() {
  const isOwner = !!cache.ownPk && cache.ownPk === cache.pk;
  const dock = ['upcEdit', 'upcPick', 'upcExport', 'upcImport', 'upcReg', 'upcShare', 'upcImportFile'];
  dock.forEach((id) => {
    const b = $(id);
    if (b) b.style.display = isOwner ? '' : 'none';
  });
  const bridge = $('upcBridge');
  if (bridge) bridge.style.display = 'none';
  if (!isOwner) {
    const comments = $('upcComments');
    if (comments) comments.style.display = 'none';
  }
}

function renderAll() {
  if (cache.profile) renderIdentity();
  renderShelf();
  applyLocalOnlyBadges();
  applyVisitorTreatment();
}

async function boot(pk) {
  cache.pk = pk;
  try {
    if (typeof window !== 'undefined' && window.SoulIdentity && window.SoulIdentity.resolvePubkey) {
      cache.ownPk = await window.SoulIdentity.resolvePubkey();
    }
  } catch (e) { cache.ownPk = null; }
  const [profile, shelf] = await Promise.all([
    fetchApi('/api/profile?pubkey=' + encodeURIComponent(pk) +
      (cache.ownPk ? '&me=' + encodeURIComponent(cache.ownPk) : '')),
    fetchApi('/api/shelf?pubkey=' + encodeURIComponent(pk)),
  ]);
  cache.profile = profile;
  if (shelf && Array.isArray(shelf.shelf)) {
    cache.shelf = shelf.shelf;
    cache.shelfUnavailable = !!shelf.unavailable;
  } else if (shelf && shelf.unavailable) {
    cache.shelf = null;
    cache.shelfUnavailable = true;
  } else {
    cache.shelf = null;
    cache.shelfUnavailable = false;
  }
  try {
    const cj = await fetchJson('data/catalog.json', 6000);
    cache.catalog = Array.isArray(cj) ? cj : (cj && cj.items) || null;
    if (!cache.catalog) cache.catalogFailed = true;
  } catch (e) {
    cache.catalogFailed = true;
  }
  if (!profile) {
    ensureBanner('Square unreachable — showing your local sanctuary. Server identity, counts, and shelf will appear when the Square answers.');
  } else if (!cache.ownPk) {
    ensureBanner('Viewing a Square profile. <a href="square.html" style="color:#00D4FF">Open the Square</a> to connect your own key and follow.');
  }
  renderAll();
}

if (typeof window !== 'undefined') {
  window.SoulServer = { boot, applyCached: renderAll };
}
