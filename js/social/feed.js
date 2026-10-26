// The Square — feed, composer, replies, PLT reactions, profile, notifications.
import * as api from './api.js';
import { signEvent, getPubkey } from './auth.js';
import { publishToRelays, relayFeed, nip19, hexToBytes, getEventHash, verifyEvent } from './nostr.js';
import * as trade from './trade.js';
import { applyTrustToFeed } from './trust.js';

export const state = {
  scope: 'global',
  posts: [],
  before: 0,
  me: null,
  notifyTimer: null,
  unread: 0,
};

const $ = (id) => document.getElementById(id);

// ─── WEB OF TRUST v1 (Layer 2, client-side only) ─────────────────────────
// Trust state lives here so loadFeed() can re-apply the active filter
// after every render (server path, relay paths, Load-more appends).
// app.js owns the dropdown and calls setTrustFilter(); feed.js never
// fetches the graph. Default is 'all' — the filter is inert until the
// user picks a restricted mode, and any failure falls back to All
// (see trust.js fail-open rules). The soul-filter view (loadSoulFeed)
// and search results deliberately do NOT go through this hook.
let trustFilter = { mode: 'all', sets: null, fallbackNote: null, onShowAll: null };
export function setTrustFilter(opts = {}) {
  trustFilter = {
    mode: opts.mode || 'all',
    sets: opts.sets || null,
    fallbackNote: opts.fallbackNote || null,
    onShowAll: typeof opts.onShowAll === 'function' ? opts.onShowAll : null,
  };
}
export function applyTrustFilter() {
  const feedEl = $('sqFeed');
  if (!feedEl) return;
  let r;
  try {
    r = applyTrustToFeed(feedEl, { ...trustFilter, doc: document });
  } catch {
    r = { note: 'error' };
  }
  if (r && r.note === 'error') {
    // Filter crashed after rendering: show everything, reset to All.
    // The dropdown UI reset goes through onShowAll when app.js set it.
    if (trustFilter.onShowAll) trustFilter.onShowAll();
    else setTrustFilter({ mode: 'all' });
  }
}

// ─── scope + soul pure helpers (harness-tested; no DOM) ────────────────────
// resolveScope: URL ?scope= wins over stored sqScope; anything else → global.
export function resolveScope(urlScope, storedScope) {
  if (urlScope === 'global' || urlScope === 'following') return urlScope;
  if (storedScope === 'global' || storedScope === 'following') return storedScope;
  return 'global';
}
// followingAuthors: relay-fallback author list for the Following tab.
// Null when logged out (the caller must show the Connect state instead).
export function followingAuthors(me, cached) {
  if (!me) return null;
  const list = Array.isArray(cached) ? cached.filter(Boolean) : [];
  return [...new Set([me, ...list])];
}
// followingEmptyKind: which honest empty state the Following tab needs.
export function followingEmptyKind(me, followeeCount) {
  if (!me) return 'connect';
  if (followeeCount === 0) return 'follow-someone';
  return null;
}
// slugifyName mirrors js/profile-server.js slugify exactly: lowercase,
// non-alphanumerics → '-', trim dashes, max 80 chars.
export function slugifyName(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}
export function normalizeSoulSlug(raw) {
  return slugifyName(raw);
}
export function isValidSoulSlug(slug) {
  return typeof slug === 'string' && slug.length >= 1 && slug.length <= 80 && /^[a-z0-9][a-z0-9-]*$/.test(slug);
}
// First ['soul', slug] tag wins (the server keeps only the first one too).
export function soulSlugFromTags(tags) {
  const t = (Array.isArray(tags) ? tags : []).find((x) => Array.isArray(x) && x[0] === 'soul' && x[1]);
  if (!t) return '';
  const s = normalizeSoulSlug(t[1]);
  return isValidSoulSlug(s) ? s : '';
}

// ─── helpers ────────────────────────────────────────────────────────────────
export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

export function timeAgo(ts) {
  const d = Math.max(0, Math.floor(Date.now() / 1000) - Number(ts || 0));
  if (d < 60) return d + 's';
  if (d < 3600) return Math.floor(d / 60) + 'm';
  if (d < 86400) return Math.floor(d / 3600) + 'h';
  if (d < 86400 * 30) return Math.floor(d / 86400) + 'd';
  return new Date(ts * 1000).toLocaleDateString();
}

export function shortPk(pk) {
  try {
    return nip19.npubEncode(pk).slice(0, 12) + '…';
  } catch {
    return (pk || '').slice(0, 10) + '…';
  }
}

function hashHue(str) {
  let h = 0;
  for (let i = 0; i < (str || '').length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

export function nameOf(p) {
  return (p.display_name || p.name || shortPk(p.pubkey)).slice(0, 40);
}

function avatarEl(p, cls = 'sq-avatar') {
  const d = document.createElement('div');
  d.className = cls;
  const hue = hashHue(p.pubkey);
  d.style.background = `linear-gradient(135deg, hsl(${hue} 70% 45%), hsl(${(hue + 60) % 360} 70% 30%))`;
  if (p.picture) {
    const img = document.createElement('img');
    img.src = esc(p.picture);
    img.alt = '';
    img.onerror = () => img.remove();
    d.appendChild(img);
  } else {
    d.textContent = (nameOf(p) || '??').slice(0, 2).toUpperCase();
  }
  return d;
}

// my reactions, per device (server holds the counts)
function myReactions() {
  try {
    return JSON.parse(localStorage.getItem('sqReactions') || '{}');
  } catch {
    return {};
  }
}
function saveReaction(id, content) {
  const m = myReactions();
  m[id] = [...new Set([...(m[id] || []), content])];
  localStorage.setItem('sqReactions', JSON.stringify(m));
}

export function status(msg) {
  const el = $('sqStatus');
  if (el) el.textContent = msg || '';
}

// ─── soul catalog + attachment rendering ────────────────────────────────
// The Square does not bundle a catalog copy: it fetches the site's served
// /data/catalog.json (same-origin first, Worker origin fallback). If the
// fetch fails, every slug renders as today's plain chip — never a break.
let catalogPromise = null;
export async function ensureCatalog() {
  if (catalogPromise) return catalogPromise;
  catalogPromise = (async () => {
    const urls = ['/data/catalog.json', 'https://soul-economy.uncommonpope.workers.dev/data/catalog.json'];
    for (const u of urls) {
      try {
        const r = await fetch(u);
        if (!r.ok) continue;
        const d = await r.json();
        const items = Array.isArray(d) ? d : (d.items || d.souls || []);
        const map = new Map();
        for (const it of items) {
          if (!it || !it.name) continue;
          const s = it.slug ? normalizeSoulSlug(it.slug) : slugifyName(it.name);
          if (s && !map.has(s)) map.set(s, it);
        }
        return map;
      } catch { /* try next URL */ }
    }
    return null;
  })();
  return catalogPromise;
}
export async function findSoul(slug) {
  const s = normalizeSoulSlug(slug);
  if (!isValidSoulSlug(s)) return null;
  const map = await ensureCatalog();
  return (map && map.get(s)) || null;
}
export async function searchSouls(q) {
  const needle = String(q || '').trim().toLowerCase();
  if (!needle) return [];
  const map = await ensureCatalog();
  if (!map) return [];
  const out = [];
  for (const [slug, it] of map) {
    if (String(it.name || '').toLowerCase().includes(needle)) out.push({ slug, item: it });
    if (out.length >= 8) break;
  }
  return out;
}

// Pending composer attachment (v1: exactly one — the server keeps only the
// first soul tag, so the picker enforces one and says so).
let soulAttachment = '';
export function getSoulAttachment() {
  return soulAttachment;
}
export function setSoulAttachment(slug) {
  const s = normalizeSoulSlug(slug);
  if (!isValidSoulSlug(s)) return false;
  soulAttachment = s;
  return true;
}
export function clearSoulAttachment() {
  soulAttachment = '';
}
export function resetSoulComposer() {
  clearSoulAttachment();
  const picker = $('sqSoulPicker');
  if (picker) picker.hidden = true;
  const search = $('sqSoulSearch');
  if (search) search.value = '';
  const results = $('sqSoulResults');
  if (results) results.innerHTML = '';
  const preview = $('sqSoulPreview');
  if (preview) preview.innerHTML = '';
  // Trade composer (v1: one attachment per post — reset clears both).
  clearTradeDraft();
  const tradePanel = $('sqTradePanel');
  if (tradePanel) tradePanel.hidden = true;
  const tradePreview = $('sqTradePreview');
  if (tradePreview) tradePreview.innerHTML = '';
  for (const id of ['sqTradeTitle', 'sqTradeAuthor', 'sqTradeP', 'sqTradeL', 'sqTradeT', 'sqTradeTip', 'sqTradeSoulMd', 'sqTradeSeshat']) {
    const el = $(id);
    if (el) el.value = '';
  }
}

// Pending trade draft (v1: one attachment per post — a trade clears a
// catalog soul attachment and vice versa; submitPost refuses both).
let tradeDraft = null;
export function getTradeDraft() {
  return tradeDraft;
}
export function setTradeDraft(artifact) {
  tradeDraft = artifact || null;
}
export function clearTradeDraft() {
  tradeDraft = null;
}

// Rich catalog card for a cited soul. opts.filterButton (default true)
// adds the "Words about this soul" feed-filter action; the composer
// preview passes false — a preview is not a feed card.
export function buildSoulCardEl(item, slug, opts = {}) {
  const card = document.createElement('div');
  card.className = 'sq-soul-card';
  const title = document.createElement('a');
  title.className = 'sq-soul-card-title';
  title.href = 'index.html#catalog';
  title.textContent = '◈ ' + (item.name || slug);
  const meta = document.createElement('div');
  meta.className = 'sq-soul-card-meta';
  meta.textContent = [(item.type || 'soul'), item.author ? 'by ' + item.author : '', item.plt ? 'PLT ' + item.plt : ''].filter(Boolean).join(' · ');
  card.append(title, meta);
  if (item.desc) {
    const d = document.createElement('div');
    d.className = 'sq-soul-card-desc';
    d.textContent = String(item.desc).slice(0, 160);
    card.appendChild(d);
  }
  const acts = document.createElement('div');
  acts.className = 'sq-soul-card-actions';
  if (item.download) {
    const dl = document.createElement('a');
    dl.href = item.download;
    dl.target = '_blank';
    dl.rel = 'noopener';
    dl.textContent = '⬇ Download';
    acts.appendChild(dl);
  }
  if (opts.filterButton !== false) {
    const words = document.createElement('button');
    words.type = 'button';
    words.textContent = '☾ Words about this soul';
    words.onclick = () => loadSoulFeed(slug);
    acts.appendChild(words);
  }
  card.appendChild(acts);
  return card;
}

// Render a cited soul under a post body: plain chip immediately (today's
// behavior, synchronous), upgraded to the rich card once the catalog
// resolves it. Unknown slugs keep the chip forever — never a broken card.
export function appendSoulAttachment(bodyEl, slug) {
  const s = normalizeSoulSlug(slug);
  if (!isValidSoulSlug(s)) return;
  const chip = document.createElement('span');
  chip.className = 'sq-soul-chip';
  chip.textContent = '◈ ' + s;
  bodyEl.appendChild(document.createElement('br'));
  bodyEl.appendChild(chip);
  findSoul(s).then((item) => {
    if (!item || !chip.isConnected) return;
    chip.replaceWith(buildSoulCardEl(item, s));
  }).catch(() => {});
}

// ─── traded-artifact card (Layer 3 v1, Gemini nested format) ─────────────
// Distinct gold card, NOT a catalog card: the artifact is user-created,
// its scores are seller claims, and its tip link is seller-supplied.
// This builder trusts its input; appendTradeAttachment verifies first.
// opts.sigState: 'signed' | 'post-bound' | 'preview' (preview never claims
// a crypto check that has not run).
export function buildTradeCardEl(artifact, post, opts = {}) {
  const s = artifact.soul || {};
  const ps = s.plt_score || {};
  const tr = artifact.trade || {};
  const card = document.createElement('div');
  card.className = 'sq-trade-card';
  const badge = document.createElement('div');
  badge.className = 'sq-trade-badge';
  badge.textContent = '⇄ TRADED SOUL';
  card.appendChild(badge);
  const title = document.createElement('div');
  title.className = 'sq-trade-title';
  title.textContent = '⇄ ' + s.title;
  card.appendChild(title);
  const meta = document.createElement('div');
  meta.className = 'sq-soul-card-meta';
  const author = s.author || (post ? nameOf(post) : 'unknown');
  meta.textContent = `by ${author} · PLT ${trade.formatPlt(ps.p, ps.l, ps.t)} · TV ${tr.plt_valuation}`;
  card.appendChild(meta);
  const sigLine = document.createElement('div');
  sigLine.className = 'sq-trade-memory';
  sigLine.textContent =
    opts.sigState === 'signed'
      ? '✓ Signed by the author key (detached artifact signature)'
      : opts.sigState === 'preview'
        ? 'signature binds at post time'
        : 'bound by the post signature';
  card.appendChild(sigLine);
  const soulLine = document.createElement('div');
  soulLine.className = 'sq-trade-memory';
  soulLine.textContent =
    s.soul_md !== null && s.soul_md !== undefined
      ? `soul included (${s.soul_md.length} chars, sha256 ${(artifact.soul_md_sha256 || '').slice(0, 12)}…)`
      : artifact.soul_md_held
        ? 'soul held by seller — claim with the full .trade.json'
        : 'no soul text';
  card.appendChild(soulLine);
  const mem = document.createElement('div');
  mem.className = 'sq-trade-memory';
  if (s.seshat_json !== null && s.seshat_json !== undefined) {
    mem.textContent = `memory included (sha256 ${(artifact.seshat_sha256 || '').slice(0, 12)}…)`;
  } else if (artifact.seshat_held) {
    mem.textContent = 'memory held by seller — claim with the full .trade.json';
  } else {
    mem.textContent = 'no memory state';
  }
  card.appendChild(mem);
  const acts = document.createElement('div');
  acts.className = 'sq-soul-card-actions';
  const claim = document.createElement('button');
  claim.type = 'button';
  claim.textContent = tr.stripe_tip_url ? '♥ Tip & Claim Soul' : '⬇ Claim Soul';
  claim.onclick = () => claimTradeArtifact(artifact, post);
  acts.appendChild(claim);
  const dl = document.createElement('button');
  dl.type = 'button';
  dl.textContent = '⬇ Artifact (.trade.json)';
  dl.onclick = async () => {
    try {
      const ok = await trade.contentHashesMatch(artifact);
      if (!ok) status('artifact content hash mismatch — file may differ from the post');
    } catch {}
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = artifact.slug + '.trade.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };
  acts.appendChild(dl);
  if (opts.filterButton !== false) {
    const words = document.createElement('button');
    words.type = 'button';
    words.textContent = '☾ Words about this soul';
    words.onclick = () => loadSoulFeed(artifact.slug);
    acts.appendChild(words);
  }
  card.appendChild(acts);
  return card;
}

// Claim = instant LOCAL import into the buyer's Sanctuary, then the tip
// URL opens (when one exists). Nothing is bought server-side: v1 has no
// escrow, no settlement, no DRM — the tip is a seller-supplied link and
// the import is localStorage only. Held parts need the seller's full
// .trade.json (hash-checked against the posted artifact before merging).
// Storage: claimedTradeSouls (full record, deduped, capped 200) plus the
// soul title appended to mySouls (the starred list Sanctuary export
// carries), so the claim rides the existing Sanctuary round-trip.
export async function claimTradeArtifact(artifact, post) {
  let full = artifact;
  if (artifact.soul_md_held || artifact.seshat_held) {
    const file = await pickTradeFile();
    if (!file) {
      status('claim cancelled — the full .trade.json is needed for held parts');
      return;
    }
    try {
      full = JSON.parse(await file.text());
    } catch {
      status('that file is not valid JSON');
      return;
    }
    if (full.type !== trade.TRADE_TYPE || full.slug !== artifact.slug || full.author_pubkey !== artifact.author_pubkey) {
      status('that file is not this trade — slug or author does not match');
      return;
    }
    if (!(await trade.hashesMatch(artifact, full))) {
      status('that file does not match the posted trade hashes — claim refused');
      return;
    }
  }
  const record = trade.claimRecord(full, post);
  try {
    const list = JSON.parse(localStorage.getItem('claimedTradeSouls') || '[]');
    const kept = (Array.isArray(list) ? list : []).filter(
      (r) => !(r && r.slug === record.slug && r.author_pubkey === record.author_pubkey),
    );
    kept.unshift(record);
    localStorage.setItem('claimedTradeSouls', JSON.stringify(kept.slice(0, 200)));
  } catch {}
  try {
    const starred = JSON.parse(localStorage.getItem('mySouls') || '[]');
    const kept = (Array.isArray(starred) ? starred : []).filter((x) => x !== record.title);
    kept.unshift(record.title);
    localStorage.setItem('mySouls', JSON.stringify(kept.slice(0, 500)));
  } catch {}
  const tip = (artifact.trade || {}).stripe_tip_url;
  if (tip) window.open(tip, '_blank', 'noopener');
  status(tip ? 'claimed ✓ — in your Sanctuary, tip opened' : 'claimed ✓ — in your Sanctuary');
}

function pickTradeFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = () => resolve(input.files && input.files[0] ? input.files[0] : null);
    input.oncancel = () => resolve(null);
    input.click();
  });
}

// Verify-then-render for a marker found in a post: a failing artifact
// renders as a note, never a card, never a dropped post. The detached
// signature check is async (hashing), so a signed artifact first renders
// a checking note that is replaced once the check completes.
export function appendTradeAttachment(bodyEl, artifact, post) {
  const v = trade.verifyTradeArtifact(artifact, post ? post.pubkey : '');
  bodyEl.appendChild(document.createElement('br'));
  if (!v.ok) {
    const note = document.createElement('div');
    note.className = 'sq-trade-broken';
    note.textContent = 'Trade artifact could not be verified — shown as text only.';
    note.title = v.errors.join('; ');
    bodyEl.appendChild(note);
    return;
  }
  if (!artifact.sig) {
    bodyEl.appendChild(buildTradeCardEl(artifact, post, { sigState: 'post-bound' }));
    return;
  }
  const checking = document.createElement('div');
  checking.className = 'sq-trade-memory';
  checking.textContent = 'verifying trade signature…';
  bodyEl.appendChild(checking);
  trade
    .notarizationParts(artifact)
    .then((parts) => {
      let ok = false;
      try {
        if (parts) {
          const ev = { ...parts.template, id: getEventHash(parts.template), sig: parts.sig };
          ok = verifyEvent(ev);
        }
      } catch {
        ok = false;
      }
      if (!checking.isConnected) return;
      if (ok) {
        checking.replaceWith(buildTradeCardEl(artifact, post, { sigState: 'signed' }));
      } else {
        const note = document.createElement('div');
        note.className = 'sq-trade-broken';
        note.textContent = 'Trade artifact signature failed — shown as text only.';
        note.title = 'detached notarization signature does not verify';
        checking.replaceWith(note);
      }
    })
    .catch(() => {
      if (!checking.isConnected) return;
      const note = document.createElement('div');
      note.className = 'sq-trade-broken';
      note.textContent = 'Trade artifact signature could not be checked — shown as text only.';
      checking.replaceWith(note);
    });
}

// Feed filtered to one cited soul (?soul=, server-side). The filter bar's
// clear button restores the active tab's feed.
export async function loadSoulFeed(slug) {
  const feedEl = $('sqFeed');
  if (!feedEl) return;
  const s = normalizeSoulSlug(slug);
  if (!isValidSoulSlug(s)) return;
  feedEl.innerHTML = '';
  let bar = $('sqSoulFilterBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'sqSoulFilterBar';
    bar.className = 'sq-soul-filterbar';
  }
  bar.innerHTML = '';
  const label = document.createElement('span');
  label.textContent = '☾ Words about ◈ ' + s;
  const clear = document.createElement('button');
  clear.type = 'button';
  clear.textContent = '✕ Show all';
  clear.onclick = () => {
    bar.remove();
    loadFeed();
  };
  bar.append(label, clear);
  feedEl.appendChild(bar);
  try {
    const data = await api.feed({ soul: s, limit: 20 });
    const posts = data.posts || [];
    if (!posts.length) {
      const d = document.createElement('div');
      d.className = 'sq-empty';
      d.textContent = 'No words about this soul yet.';
      feedEl.appendChild(d);
    } else {
      posts.forEach((p, i) => feedEl.appendChild(postCard(p, i)));
    }
    $('sqMore').hidden = true;
  } catch {
    const d = document.createElement('div');
    d.className = 'sq-empty';
    d.textContent = 'Could not load words about this soul — try again.';
    feedEl.appendChild(d);
  }
}

// Cached follow list for the relay/offline Following view (last known
// good list; written whenever follows are fetched successfully).
export function readFollowsCache() {
  try {
    const v = JSON.parse(localStorage.getItem('sqFollows') || 'null');
    return Array.isArray(v) ? v.filter(Boolean) : null;
  } catch {
    return null;
  }
}
export function writeFollowsCache(list) {
  try {
    localStorage.setItem('sqFollows', JSON.stringify([...new Set((list || []).filter(Boolean))]));
  } catch {}
}

// ─── feed loading ───────────────────────────────────────────────────────────
export async function loadFeed({ append = false } = {}) {
  const feedEl = $('sqFeed');
  if (!feedEl) return;
  if (!append) {
    state.before = 0;
    feedEl.innerHTML = '';
    // Following tab never shows global posts: logged out → Connect prompt,
    // before any API call is made.
    if (state.scope === 'following' && !state.me) {
      renderFollowingConnect();
      status('');
      return;
    }
    status('pulling…');
  }
  try {
    const data = await api.feed({
      scope: state.scope,
      me: state.me || '',
      limit: 20,
      before: append ? state.before : 0,
    });
    const posts = data.posts || [];
    if (!append) state.posts = posts;
    else state.posts = state.posts.concat(posts);
    state.before = data.next_before || 0;
    $('sqMore').hidden = !data.next_before;
    if (!append) feedEl.innerHTML = '';
    if (!posts.length && !append) {
      if (state.scope === 'following' && state.me) {
        // Distinguish 0 follows from follows-with-no-posts (and cache the
        // list for the offline Following view). A failed fetch stays
        // generic — never claim 0 follows on an error.
        let count = null;
        try {
          const f = await api.follows(state.me);
          const list = f.followees || [];
          writeFollowsCache(list);
          count = list.length;
        } catch {}
        if (count === 0) renderFollowingEmpty();
        else renderEmpty('No words from the people you follow yet.');
      } else {
        renderEmpty();
      }
    }
    posts.forEach((p, i) => feedEl.appendChild(postCard(p, i)));
    applyTrustFilter(); // WEB OF TRUST v1: filter the rendered batch (no-op on 'all')
    status(api.API.includes('workers.dev') ? 'live · signed · sovereign' : '');
    if (!append) jumpToDeepLink();
    return;
  } catch (e) {
    console.warn('[square] API down, falling back to relays', e);
    if (append) return;
    // Relay/offline fallback — Following must never silently become global.
    if (state.scope === 'following') {
      if (!state.me) {
        feedEl.innerHTML = '';
        renderFollowingConnect();
        status('');
        return;
      }
      const cached = readFollowsCache();
      if (cached && cached.length) {
        status('Following (offline)…');
        const events = await relayFeed({ limit: 20, authors: followingAuthors(state.me, cached) });
        feedEl.innerHTML = '';
        if (!events.length) {
          renderEmpty('Nobody you follow has spoken on the relays yet.');
          $('sqMore').hidden = true;
          return;
        }
        events.forEach((ev, i) => feedEl.appendChild(postCard(relayPost(ev), i)));
        applyTrustFilter(); // WEB OF TRUST v1 (relay Following path)
        $('sqMore').hidden = true;
        jumpToDeepLink();
        return;
      }
      feedEl.innerHTML = '';
      renderFollowingOffline();
      status('');
      return;
    }
    status('relays (offline mode)…');
    const events = await relayFeed({ limit: 20 });
    feedEl.innerHTML = '';
    if (!events.length) {
      renderEmpty('The Square is unreachable right now. The souls will return.');
      return;
    }
    events.forEach((ev, i) => feedEl.appendChild(postCard(relayPost(ev), i)));
    applyTrustFilter(); // WEB OF TRUST v1 (relay global path)
    $('sqMore').hidden = true;
    jumpToDeepLink();
  }
}

// ─── Front-door deep link ───────────────────────────────────────────────
// The homepage ticker links to square.html#post-<id>. Feed cards render
// asynchronously, so the browser's native anchor scroll fires before the
// card exists — jump after each fresh render, and on hashchange (clicking
// a ticker link while already on the Square). Never fetches, never changes
// scope, never touches Following / picker / trade logic. No-ops unless the
// hash names a rendered post.
let __deepLinkEl = null;
let __deepLinkTimer = 0;
function jumpToDeepLink() {
  try {
    const h = (typeof location !== 'undefined' && location.hash) || '';
    if (!h.startsWith('#post-')) return;
    let id = h.slice(6);
    try { id = decodeURIComponent(id); } catch {}
    if (!id) return;
    const el = document.getElementById('post-' + id) ||
      document.querySelector('[data-id="' + CSS.escape(id) + '"]');
    if (!el) return;
    if (__deepLinkEl && __deepLinkEl !== el) __deepLinkEl.classList.remove('sq-deep-link');
    __deepLinkEl = el;
    el.classList.add('sq-deep-link');
    if (typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'center' });
    if (__deepLinkTimer) clearTimeout(__deepLinkTimer);
    __deepLinkTimer = setTimeout(function () {
      if (__deepLinkEl) __deepLinkEl.classList.remove('sq-deep-link');
      __deepLinkEl = null;
    }, 3000);
  } catch {}
}
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('hashchange', jumpToDeepLink);
}

// Relay event → post-card shape, with the soul tag mapped to soul_slug
// client-side (the D1 path carries soul_slug on the row already).
function relayPost(ev) {
  return {
    id: ev.id, pubkey: ev.pubkey, created_at: ev.created_at, content: ev.content,
    root_id: null, parent_id: null, reply_count: 0, like_count: 0, plt: '{}',
    name: '', display_name: '', picture: '', about: '',
    soul_slug: soulSlugFromTags(ev.tags), tags: ev.tags || [],
  };
}

function renderEmpty(msg) {
  const feedEl = $('sqFeed');
  const d = document.createElement('div');
  d.className = 'sq-empty';
  d.textContent = msg || 'The Square is silent. Be the first voice.';
  feedEl.appendChild(d);
}

// Following tab, logged out: Connect prompt via the existing sign-in path
// (requireSignIn → sign-in modal). Sign-in reloads the feed, and the scope
// is still 'following', so the real feed loads next.
function renderFollowingConnect() {
  const feedEl = $('sqFeed');
  const d = document.createElement('div');
  d.className = 'sq-empty';
  const t = document.createElement('div');
  t.textContent = 'Connect your Square identity to see the people you follow.';
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'sq-empty-btn';
  b.textContent = '✦ Enter the Economy';
  b.onclick = () => requireSignIn();
  d.append(t, b);
  feedEl.appendChild(d);
}

// Following tab, connected with 0 followees: point at the fix (follow
// someone) instead of the generic silence line. The Browse button reuses
// the All tab's own click handler, so scope persistence + reload stay true.
function renderFollowingEmpty() {
  const feedEl = $('sqFeed');
  const d = document.createElement('div');
  d.className = 'sq-empty';
  const t = document.createElement('div');
  t.textContent = "You're not following anyone yet. Find voices worth following.";
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'sq-empty-btn';
  b.textContent = '✦ Browse the Square';
  b.onclick = () => {
    const all = document.querySelector('.sq-tab[data-scope="global"]');
    if (all) all.click();
  };
  d.append(t, b);
  feedEl.appendChild(d);
}

// Following tab, API down and no cached follow list: honest note, never a
// relay-global feed under the Following label.
function renderFollowingOffline() {
  const feedEl = $('sqFeed');
  const d = document.createElement('div');
  d.className = 'sq-empty';
  d.textContent = 'Following feed needs the Square backend — you appear to be offline.';
  feedEl.appendChild(d);
}

// ─── realtime (edge only) ───────────────────────────────────────────────────
// Open feed tabs listen on the FeedRoom DO; a new post shows a refresh pill.
// Local static / GH Pages origins skip it (no backend there) — zero console noise.
let liveStarted = false;
let liveTries = 0;
export function startFeedLive() {
  if (liveStarted) return;
  if (typeof location === 'undefined' || !location.hostname.endsWith('.workers.dev')) return;
  liveStarted = true;
  const connect = () => {
    let ws;
    try {
      ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/api/feed/ws');
    } catch (e) {
      return;
    }
    ws.onopen = () => {
      liveTries = 0;
    };
    ws.onmessage = (ev) => {
      let m;
      try {
        m = JSON.parse(ev.data);
      } catch (e) {
        return;
      }
      if (m && m.type === 'feed' && m.action === 'new') {
        if (m.pubkey && m.pubkey === state.me) return; // own post already refreshed
        showNewPill();
      }
    };
    ws.onerror = () => {
      try {
        ws.close();
      } catch (e) {}
    };
    ws.onclose = () => {
      if (liveTries++ < 5) setTimeout(connect, 2000 + liveTries * 1500);
    };
  };
  connect();
}

function showNewPill() {
  const feedEl = $('sqFeed');
  if (!feedEl || $('sqNewPill')) return;
  const pill = document.createElement('button');
  pill.id = 'sqNewPill';
  pill.type = 'button';
  pill.textContent = '✦ a soul just spoke — tap to refresh';
  pill.style.cssText =
    'display:block;width:100%;margin:8px 0;padding:10px;font:700 .8rem inherit;letter-spacing:.04em;' +
    'color:#00D4FF;background:rgba(0,212,255,.08);border:1px solid rgba(0,212,255,.35);border-radius:30px;cursor:pointer';
  pill.onclick = () => {
    pill.remove();
    loadFeed();
  };
  feedEl.prepend(pill);
}

// ─── post card ──────────────────────────────────────────────────────────────
export function postCard(p, index = 0) {
  const art = document.createElement('article');
  art.className = 'sq-post';
  art.dataset.id = p.id;
  /* Front-door deep link: the homepage ticker links to square.html#post-<id>.
     The id attribute lets the landing jump find the card directly; the
     dataset.id it already carried stays the source of truth for actions. */
  if (p.id != null && String(p.id) !== '') art.id = 'post-' + p.id;
  // WEB OF TRUST v1: author pubkey on the card so the client-side trust
  // filter can hide/show cards without re-reading post data.
  art.dataset.pubkey = p.pubkey || '';
  art.style.animationDelay = Math.min(index * 40, 300) + 'ms';

  art.appendChild(avatarEl(p));

  const main = document.createElement('div');
  main.className = 'sq-post-main';

  const head = document.createElement('div');
  head.className = 'sq-post-head';
  const nm = document.createElement('span');
  nm.className = 'sq-name';
  nm.textContent = nameOf(p);
  nm.onclick = () => openProfile(p.pubkey);
  const hd = document.createElement('span');
  hd.className = 'sq-handle';
  hd.textContent = shortPk(p.pubkey);
  const tm = document.createElement('span');
  tm.className = 'sq-time';
  tm.textContent = timeAgo(p.created_at);
  head.append(nm, hd, tm);

  const body = document.createElement('div');
  body.className = 'sq-post-body';
  // Trade marker wins over the catalog card: a trade post carries both a
  // soul tag (for ?soul= filtering) and the marker, and must show one card.
  const tmk = trade.extractTradeMarker(p.content || '');
  fillBody(body, tmk.text);
  if (tmk.markerFound) appendTradeAttachment(body, tmk.artifact, p);
  else {
    const attachedSlug = p.soul_slug || soulSlugFromTags(p.tags);
    if (attachedSlug) appendSoulAttachment(body, attachedSlug);
  }

  const acts = document.createElement('div');
  acts.className = 'sq-post-actions';
  acts.appendChild(actionBtn('sq-reply', '💬', p.reply_count || 0, async () => toggleReplies(p, main)));
  acts.appendChild(actionBtn('sq-like', '♥', p.like_count || 0, () => react(p, '+')));
  acts.appendChild(actionBtn('sq-p', 'P', pltOf(p).p, () => react(p, 'P+')));
  acts.appendChild(actionBtn('sq-l', 'L', pltOf(p).l, () => react(p, 'L+')));
  acts.appendChild(actionBtn('sq-t', 'T', pltOf(p).t, () => react(p, 'T+')));

  const mine = myReactions()[p.id] || [];
  acts.querySelectorAll('.sq-act').forEach((b) => {
    if (mine.includes(b.dataset.kind)) b.classList.add('on');
  });

  const plt = pltOf(p);
  const mini = document.createElement('span');
  mini.className = 'sq-plt-mini';
  mini.innerHTML = `<b class="p">P${plt.p}</b> <b class="l">L${plt.l}</b> <b class="t">T${plt.t}</b>`;
  acts.appendChild(mini);

  main.append(head, body, acts);
  art.appendChild(main);
  return art;
}

function pltOf(p) {
  try {
    const o = JSON.parse(p.plt || '{}');
    return { p: Number(o.p) || 0, l: Number(o.l) || 0, t: Number(o.t) || 0 };
  } catch {
    return { p: 0, l: 0, t: 0 };
  }
}

const MEDIA_RE = /!\[([^\]]*)\]\((https:\/\/soul-economy\.uncommonpope\.workers\.dev\/media\/[^)\s]+)\)/g;
function fillBody(el, content) {
  const text = String(content || '');
  const frag = document.createDocumentFragment();
  let last = 0;
  let m;
  let n = 0;
  MEDIA_RE.lastIndex = 0;
  while ((m = MEDIA_RE.exec(text)) && n < 6) {
    if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
    const img = document.createElement('img');
    img.src = m[2];
    img.alt = m[1] || 'image';
    img.loading = 'lazy';
    img.onclick = () => window.open(m[2], '_blank', 'noopener');
    frag.appendChild(img);
    last = m.index + m[0].length;
    n++;
  }
  if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
  el.textContent = '';
  el.appendChild(frag);
}

function actionBtn(kind, icon, count, handler) {
  const b = document.createElement('button');
  b.className = 'sq-act ' + kind;
  b.dataset.kind = kind === 'sq-like' ? '+' : kind === 'sq-p' ? 'P+' : kind === 'sq-l' ? 'L+' : kind === 'sq-t' ? 'T+' : 'reply';
  b.innerHTML = `${icon} <span>${Number(count) || 0}</span>`;
  b.onclick = async (e) => {
    e.stopPropagation();
    if (kind === 'sq-reply') return handler();
    if (!state.me) return requireSignIn();
    await handler();
  };
  return b;
}

// ─── reactions ──────────────────────────────────────────────────────────────
async function react(post, content) {
  const mine = myReactions()[post.id] || [];
  if (mine.includes(content)) return;
  try {
    const ev = await signEvent({ kind: 7, tags: [['e', post.id]], content });
    await api.postEvent(ev);
    publishToRelays(ev);
    saveReaction(post.id, content);
    const card = document.querySelector(`.sq-post[data-id="${post.id}"]`);
    if (card) {
      const btn = card.querySelector(`.sq-act[data-kind="${content}"]`);
      if (btn) {
        btn.classList.add('on');
        const sp = btn.querySelector('span');
        sp.textContent = (Number(sp.textContent) || 0) + 1;
      }
      const mini = card.querySelector('.sq-plt-mini');
      if (mini && content !== '+') {
        const k = content[0].toLowerCase();
        const b = mini.querySelector('b.' + k);
        if (b) b.textContent = k.toUpperCase() + ((Number(b.textContent.slice(1)) || 0) + 1);
      }
    }
  } catch (e) {
    console.warn('[square] react failed', e);
    status('reaction failed — ' + (e.message || ''));
  }
}

// ─── replies ────────────────────────────────────────────────────────────────
async function toggleReplies(p, main) {
  const existing = main.querySelector('.sq-replies');
  if (existing) {
    existing.remove();
    return;
  }
  const box = document.createElement('div');
  box.className = 'sq-replies';
  box.innerHTML = '<div class="sq-notify-empty">loading replies…</div>';
  main.appendChild(box);

  let root = p;
  let replies = [];
  try {
    const data = await api.thread(p.id);
    root = data.root || p;
    replies = (data.replies || []).filter((r) => r.id !== p.id);
  } catch (e) {
    box.innerHTML = '<div class="sq-notify-empty">offline — replies unavailable</div>';
    return;
  }
  box.innerHTML = '';
  replies.forEach((r) => box.appendChild(replyItem(r)));

  const rbox = document.createElement('div');
  rbox.className = 'sq-reply-box';
  const input = document.createElement('input');
  input.placeholder = state.me ? 'Speak your reply…' : 'Sign in to reply';
  const btn = document.createElement('button');
  btn.textContent = 'Reply';
  btn.onclick = async () => {
    if (!state.me) return requireSignIn();
    const text = input.value.trim();
    if (!text) return;
    btn.disabled = true;
    try {
      const tags = [
        ['e', root.id, '', 'root'],
        ['e', p.id, '', 'reply'],
        ['p', p.pubkey],
        ['t', 'soul-economy'],
      ];
      const ev = await signEvent({ kind: 1, tags, content: text });
      await api.postEvent(ev);
      publishToRelays(ev);
      input.value = '';
      const item = replyItem({
        id: ev.id, pubkey: ev.pubkey, created_at: ev.created_at, content: text,
        name: localStorage.getItem('soulUserName') || '', display_name: localStorage.getItem('soulUserName') || '', picture: '',
      });
      box.insertBefore(item, rbox);
      const c = main.querySelector('.sq-act.sq-reply span');
      if (c) c.textContent = (Number(c.textContent) || 0) + 1;
    } catch (e) {
      status('reply failed — ' + (e.message || ''));
    } finally {
      btn.disabled = false;
    }
  };
  rbox.append(input, btn);
  box.appendChild(rbox);
}

function replyItem(r) {
  const d = document.createElement('div');
  d.className = 'sq-reply-item';
  d.appendChild(avatarEl(r));
  const wrap = document.createElement('div');
  wrap.style.flex = '1';
  const head = document.createElement('div');
  head.className = 'sq-post-head';
  const nm = document.createElement('span');
  nm.className = 'sq-name';
  nm.style.fontSize = '0.82rem';
  nm.textContent = nameOf(r);
  nm.onclick = () => openProfile(r.pubkey);
  const tm = document.createElement('span');
  tm.className = 'sq-time';
  tm.textContent = timeAgo(r.created_at);
  head.append(nm, tm);
  const body = document.createElement('div');
  body.className = 'sq-post-body';
  body.style.fontSize = '0.85rem';
  const rtm = trade.extractTradeMarker(r.content || '');
  body.textContent = rtm.text;
  if (rtm.markerFound) appendTradeAttachment(body, rtm.artifact, r);
  else {
    const rSlug = r.soul_slug || soulSlugFromTags(r.tags);
    if (rSlug) appendSoulAttachment(body, rSlug);
  }
  wrap.append(head, body);
  d.appendChild(wrap);
  return d;
}

// ─── compose ────────────────────────────────────────────────────────────────
export async function submitPost() {
  const ta = $('sqText');
  const text = (ta.value || '').trim();
  if (!text) return;
  if (!state.me) return requireSignIn();
  const btn = $('sqPost');
  btn.disabled = true;
  btn.textContent = '✦ Signing…';
  try {
    // Attachments (v1: exactly one per post). A trade draft is FINAL at
    // package time (author_pubkey + detached signature already bound), so
    // submit only re-checks identity + validity, appends the marker line,
    // and also carries the soul tag so the post stays filterable by
    // ?soul= — plus a ['trade','v1'] tag for relay-side readers. The
    // Worker needs no change: it already extracts the first soul tag and
    // ignores the rest.
    const attached = getSoulAttachment();
    const draft = getTradeDraft();
    if (attached && draft) {
      status('one attachment per post — remove the soul or the trade first');
      return;
    }
    const tags = [['t', 'soul-economy']];
    let content = text;
    if (draft) {
      if (draft.author_pubkey !== state.me) {
        status('trade was packaged under a different identity — re-package it');
        return;
      }
      if (trade.validateArtifact(draft).length) {
        status('trade draft is no longer valid — re-package it');
        return;
      }
      const marker = trade.encodeMarker(draft);
      content = text + '\n' + marker;
      if (content.length > trade.MAX_CONTENT) {
        status(`trade post too long by ${content.length - trade.MAX_CONTENT} chars — shorten your text`);
        return;
      }
      tags.push(['soul', draft.slug], ['realm', 'soul-economy'], ['trade', 'v1']);
    } else if (attached) {
      tags.push(['soul', attached], ['realm', 'soul-economy']);
    }
    const ev = await signEvent({ kind: 1, tags, content });
    await api.postEvent(ev);
    publishToRelays(ev);
    ta.value = '';
    updateCount();
    resetSoulComposer();
    await loadFeed();
    status('posted ✓');
  } catch (e) {
    console.error(e);
    status('post failed — ' + (e.message || ''));
  } finally {
    btn.disabled = false;
    btn.textContent = '✦ Post';
  }
}

export function updateCount() {
  const ta = $('sqText');
  const c = $('sqCount');
  if (!ta || !c) return;
  const n = (ta.value || '').length;
  c.textContent = `${n} / 4000`;
  c.classList.toggle('warn', n > 3600);
}

// ─── profile ────────────────────────────────────────────────────────────────
export async function openProfile(pubkey) {
  const card = $('sqModalCard');
  card.innerHTML = '<div class="sq-notify-empty">loading soul…</div>';
  openModal();
  let data = null;
  try {
    data = await api.profile(pubkey, state.me || '');
  } catch {}
  const u = (data && data.user) || { pubkey, name: '', display_name: '', about: '' };
  const counts = (data && data.counts) || { posts: 0, followers: 0, following: 0 };
  const isFollowing = data && data.is_following;

  card.innerHTML = '';
  const close = document.createElement('button');
  close.className = 'sq-modal-close';
  close.textContent = '✕';
  close.onclick = closeModal;

  const h = document.createElement('div');
  h.className = 'sq-profile-head';
  h.appendChild(avatarEl({ pubkey, ...u }));
  const info = document.createElement('div');
  const nm = document.createElement('h3');
  nm.textContent = nameOf({ pubkey, ...u });
  const handle = document.createElement('div');
  handle.className = 'sq-handle';
  handle.textContent = shortPk(pubkey);
  info.append(nm, handle);
  h.appendChild(info);

  const stats = document.createElement('div');
  stats.className = 'sq-profile-stats';
  stats.innerHTML = `
    <span><b>${counts.posts || 0}</b>posts</span>
    <span><b>${counts.followers || 0}</b>followers</span>
    <span><b>${counts.following || 0}</b>following</span>`;

  const about = document.createElement('p');
  about.textContent = u.about || 'This soul has not spoken of themselves yet.';

  card.append(close, h, stats, about);

  if (pubkey !== state.me) {
    const fb = document.createElement('button');
    fb.className = 'sq-follow-btn' + (isFollowing ? ' following' : '');
    fb.textContent = isFollowing ? 'Following' : '✦ Follow';
    fb.onclick = () => toggleFollow(pubkey, fb);
    card.appendChild(fb);
  }

  const recent = (data && data.recent) || [];
  if (recent.length) {
    const hr = document.createElement('p');
    hr.className = 'sq-warn';
    hr.style.marginTop = '18px';
    hr.textContent = 'RECENT WORDS';
    card.appendChild(hr);
    recent.slice(0, 5).forEach((r) => {
      const line = document.createElement('div');
      line.className = 'sq-notify-item';
      line.innerHTML = `<span class="sq-n-type">◈</span><span>${esc(trade.stripTradeMarker(r.content || '').slice(0, 160))}</span>`;
      card.appendChild(line);
    });
  }
}

export async function toggleFollow(pubkey, btn) {
  if (!state.me) return requireSignIn();
  if (pubkey === state.me) return;
  btn.disabled = true;
  try {
    const data = await api.follows(state.me);
    const set = new Set(data.followees || []);
    const wasFollowing = set.has(pubkey);
    if (wasFollowing) set.delete(pubkey);
    else set.add(pubkey);
    const ev = await signEvent({ kind: 3, tags: [...set].map((p) => ['p', p]) });
    await api.postEvent(ev);
    writeFollowsCache([...set]);
    publishToRelays(ev);
    btn.classList.toggle('following', !wasFollowing);
    btn.textContent = wasFollowing ? '✦ Follow' : 'Following';
  } catch (e) {
    status('follow failed — ' + (e.message || ''));
  } finally {
    btn.disabled = false;
  }
}

// ─── notifications ──────────────────────────────────────────────────────────
export async function pollNotifications() {
  if (!state.me) return;
  try {
    const data = await api.notify(state.me);
    state.unread = data.unread || 0;
    const badge = $('sqBellCount');
    badge.textContent = state.unread > 99 ? '99+' : String(state.unread);
    badge.hidden = !state.unread;
  } catch {}
}

export async function toggleNotifyPop() {
  const wrap = $('sqBellWrap');
  const old = wrap.querySelector('.sq-notify-pop');
  if (old) {
    old.remove();
    return;
  }
  const pop = document.createElement('div');
  pop.className = 'sq-notify-pop';
  pop.innerHTML = '<div class="sq-notify-empty">loading…</div>';
  wrap.appendChild(pop);
  let data;
  try {
    data = await api.notify(state.me);
  } catch {
    pop.innerHTML = '<div class="sq-notify-empty">notifications unreachable</div>';
    return;
  }
  const rows = data.notifications || [];
  pop.innerHTML = '';
  if (!rows.length) {
    pop.innerHTML = '<div class="sq-notify-empty">No whispers yet. Engage the Square.</div>';
    return;
  }
  const icons = { reply: '💬', mention: '@', follow: '✦', react: '♥' };
  rows.forEach((n) => {
    const item = document.createElement('div');
    item.className = 'sq-notify-item' + (n.is_read ? '' : ' unread');
    item.innerHTML = `<span class="sq-n-type">${icons[n.type] || '◈'}</span><span><b>${esc(n.display_name || n.name || shortPk(n.actor)).slice(0, 20)}</b> ${notifyVerb(n.type)} · ${timeAgo(n.created_at)}</span>`;
    item.onclick = async () => {
      pop.remove();
      if (n.target_id && n.type !== 'follow') {
        const card = document.querySelector(`.sq-post[data-id="${n.target_id}"]`);
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        else if (n.type === 'reply') openProfile(n.actor);
      } else openProfile(n.actor);
    };
    pop.appendChild(item);
  });
  if (data.unread) {
    try {
      const auth = await signEvent({
        kind: 27235,
        tags: [['u', api.API + '/api/notify/read'], ['method', 'POST']],
        content: '',
      });
      await api.notifyRead([], auth);
      const badge = $('sqBellCount');
      badge.hidden = true;
      badge.textContent = '0';
      state.unread = 0;
      pop.querySelectorAll('.unread').forEach((x) => x.classList.remove('unread'));
    } catch {}
  }
}

function notifyVerb(type) {
  return { reply: 'replied to you', mention: 'mentioned you', follow: 'followed you', react: 'reacted to your post' }[type] || 'notified you';
}

// ─── modal ──────────────────────────────────────────────────────────────────
export function openModal() {
  $('sqModal').hidden = false;
}
export function closeModal() {
  $('sqModal').hidden = true;
}

// ─── session ────────────────────────────────────────────────────────────────
export function setSession(pubkey) {
  state.me = pubkey;
  renderIdentity();
  pollNotifications();
  if (state.notifyTimer) clearInterval(state.notifyTimer);
  state.notifyTimer = setInterval(pollNotifications, 30000);
}

export function renderIdentity() {
  const el = $('sqIdentity');
  if (!el) return;
  if (!state.me) {
    el.innerHTML = '';
    const b = document.createElement('button');
    b.textContent = '✦ Enter the Economy';
    b.onclick = () => window.__soulSignIn && window.__soulSignIn();
    el.appendChild(b);
    return;
  }
  el.innerHTML = '';
  const name = document.createElement('span');
  name.className = 'sq-me-name';
  name.textContent = localStorage.getItem('soulUserName') || shortPk(state.me);
  name.onclick = () => openProfile(state.me);
  const out = document.createElement('button');
  out.className = 'sq-ghost';
  out.textContent = 'Sign Out';
  out.onclick = () => window.__soulSignOut && window.__soulSignOut();
  el.append(name, out);
}

export function requireSignIn() {
  if (window.__soulSignIn) window.__soulSignIn();
}
