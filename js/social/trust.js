// Layer 2 — Client-side Web of Trust filter (v1, 2026-10-26).
// NO server work: no reputation scores, no blacklists, no server-side
// trust computation, no new endpoint, no D1 migration. The graph comes
// from the existing GET /api/follows (D1 kind-3 mirror) plus the
// existing sqFollows local cache, and every decision below runs in
// the browser. $0, no keys, no private data (pubkeys are public
// Nostr identifiers already displayed in the feed).
//
// FAIL-OPEN is the whole design: every function that can fail returns
// a value the caller treats as "show everything". The filter runs
// AFTER cards are in the DOM, so a filter crash cannot blank a feed.
//
// This module has no DOM dependency at import time (DOM helpers take
// elements as arguments), so the Node harness can import it directly.

export const TRUST_CACHE_KEY = 'sqTrustCache';
export const TRUST_MODE_KEY = 'sqTrustMode';
export const TRUST_TTL_MS = 15 * 60 * 1000;
export const TRUST_MAX_EXPAND = 50;

export const TRUST_MODES = ['all', 'trusted', 'following'];

// ─── mode ─────────────────────────────────────────────────────────────────
// resolveTrustMode mirrors resolveScope (feed.js): URL ?trust= wins over
// stored sqTrustMode; anything else → 'all' (the default, always works).
export function resolveTrustMode(urlMode, storedMode) {
  if (urlMode === 'trusted' || urlMode === 'following' || urlMode === 'all') return urlMode;
  if (storedMode === 'trusted' || storedMode === 'following' || storedMode === 'all') return storedMode;
  return 'all';
}

export function normalizePubkeys(list) {
  const out = [];
  const seen = new Set();
  for (const v of Array.isArray(list) ? list : []) {
    if (typeof v !== 'string' || !v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

// ─── sets (precise definitions — see web-of-trust-spec.md) ───────────────
// F (following set) is just the followee list; the "set" functions add
// me, because own posts always pass both restricted modes (matching
// the Following tab, whose server scope is own + followees).
// Returns null when me is null (logged out → caller falls back to All).
export function buildFollowingSet(me, following) {
  if (!me) return null;
  return new Set([me, ...normalizePubkeys(following)]);
}

// T (trusted set) = {me} ∪ F ∪ F2, where F2 is the union of the
// followees of each f ∈ F. secondDegree is a Map/object f → [followees];
// missing/failed branches simply contribute nothing (partial graph is
// still usable). Returns null when me is null.
export function buildTrustedSet(me, following, secondDegree) {
  if (!me) return null;
  const set = new Set([me, ...normalizePubkeys(following)]);
  const get = (f) => {
    if (!secondDegree) return [];
    if (typeof secondDegree.get === 'function') return secondDegree.get(f) || [];
    return secondDegree[f] || [];
  };
  for (const f of normalizePubkeys(following)) {
    for (const g of normalizePubkeys(get(f))) set.add(g);
  }
  return set;
}

// ─── post filtering (pure) ────────────────────────────────────────────────
// passesTrust: mode 'all' always passes; a null set (unknown graph)
// always passes — that null IS the fail-open. Anything else is a plain
// membership test on the post's author pubkey.
export function passesTrust(post, mode, sets) {
  if (mode === 'all' || !mode) return true;
  if (!sets) return true;
  const set = mode === 'trusted' ? sets.trusted : mode === 'following' ? sets.following : null;
  if (!set) return true;
  const pk = post && post.pubkey;
  return typeof pk === 'string' && pk !== '' && set.has(pk);
}

export function filterPosts(posts, mode, sets) {
  const list = Array.isArray(posts) ? posts : [];
  const visible = [];
  const hidden = [];
  for (const p of list) {
    if (passesTrust(p, mode, sets)) visible.push(p);
    else hidden.push(p);
  }
  return { visible, hidden, total: list.length };
}

// ─── cache (localStorage; storage object injected for testability) ───────
export function readTrustCache(storage, me) {
  try {
    const raw = storage ? storage.getItem(TRUST_CACHE_KEY) : null;
    if (!raw) return null;
    const c = JSON.parse(raw);
    if (!c || typeof c !== 'object') return null;
    if (me && c.me !== me) return null;
    const following = normalizePubkeys(c.following);
    const trusted = normalizePubkeys(c.trusted);
    const builtAt = Number(c.builtAt) || 0;
    if (!builtAt) return null;
    return { me: c.me || null, following, trusted, builtAt };
  } catch {
    return null;
  }
}

export function writeTrustCache(storage, cache) {
  try {
    if (!storage || !cache || !cache.me) return false;
    storage.setItem(TRUST_CACHE_KEY, JSON.stringify({
      me: cache.me,
      following: normalizePubkeys(cache.following),
      trusted: normalizePubkeys(cache.trusted),
      builtAt: Number(cache.builtAt) || Date.now(),
    }));
    return true;
  } catch {
    return false;
  }
}

export function isTrustCacheFresh(cache, now = Date.now(), ttlMs = TRUST_TTL_MS) {
  if (!cache || !cache.builtAt) return false;
  return now - cache.builtAt < ttlMs;
}

// ─── graph build (on demand only; default 'all' never calls this) ────────
// followsFn(pubkey) → Promise<{followees: [...]}> (api.follows shape).
// cached: a previously read trust cache (may be stale — still usable).
// Returns one of:
//   {status:'ok', following, trusted, sets, fromCache:false}
//   {status:'stale-cache', following, trusted, sets, fromCache:true}
//   {status:'empty'}        — fetch succeeded, 0 followees → caller: All + note
//   {status:'unavailable'}  — fetch failed, no usable cache → caller: All + note
// A failed 2nd-degree branch is dropped, never fatal. Expansion is
// capped at TRUST_MAX_EXPAND followees.
export async function fetchTrustGraph({ me, followsFn, cached = null, maxExpand = TRUST_MAX_EXPAND } = {}) {
  if (!me || typeof followsFn !== 'function') return { status: 'unavailable' };
  let first;
  try {
    const res = await followsFn(me);
    first = normalizePubkeys(res && res.followees);
  } catch {
    first = null;
  }
  if (first === null) {
    if (cached && cached.following && cached.following.length) {
      return {
        status: 'stale-cache',
        following: cached.following,
        trusted: cached.trusted,
        sets: {
          following: buildFollowingSet(me, cached.following),
          trusted: new Set(cached.trusted),
        },
        fromCache: true,
      };
    }
    return { status: 'unavailable' };
  }
  if (!first.length) return { status: 'empty', following: [], trusted: [], sets: null };
  const expand = first.slice(0, maxExpand);
  const results = await Promise.allSettled(expand.map((f) => followsFn(f)));
  const second = new Map();
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') second.set(expand[i], normalizePubkeys(r.value && r.value.followees));
  });
  const trusted = buildTrustedSet(me, first, second);
  return {
    status: 'ok',
    following: first,
    trusted: [...trusted],
    sets: { following: buildFollowingSet(me, first), trusted },
    fromCache: false,
  };
}

// ─── DOM application ──────────────────────────────────────────────────────
// applyTrustToFeed(feedEl, opts): hide/show already-rendered .sq-post
// cards by their dataset.pubkey (set by postCard). opts:
//   {mode, sets, fallbackNote, onShowAll, doc}
// fallbackNote: null | 'connect' | 'unavailable' | 'empty' — when set,
// everything is shown and only the note renders (the fail-open paths).
// Returns {visible, total, note} where note is the fallbackNote or
// 'filtered' (a mode hid ≥1 card) or null. Never throws: on any error
// it shows everything and reports note 'error' — the caller then
// resets to All. The note bar (#sqTrustNote) is inserted as the feed's
// first child and never replaces feed content.
export function trustNoteText(kind, visible, total, mode) {
  if (kind === 'connect') return 'Connect your Square identity to use trust filters — showing all posts.';
  if (kind === 'unavailable') return 'Trust graph unavailable — showing all posts.';
  if (kind === 'empty') return "You're not following anyone yet — showing all posts. Follow people to grow your trusted network.";
  if (kind === 'filtered') {
    const label = mode === 'trusted' ? 'Trusted Network' : 'Following Only';
    return `${label} · showing ${visible} of ${total} posts in this batch`;
  }
  return '';
}

export function applyTrustToFeed(feedEl, opts = {}) {
  const out = { visible: 0, total: 0, note: null };
  try {
    if (!feedEl || typeof feedEl.querySelectorAll !== 'function') return out;
    const mode = opts.mode || 'all';
    const sets = opts.sets || null;
    const fallbackNote = opts.fallbackNote || null;
    const doc = opts.doc || (typeof document !== 'undefined' ? document : null);
    const cards = [...feedEl.querySelectorAll('.sq-post')];
    out.total = cards.length;
    let hidden = 0;
    for (const card of cards) {
      const pk = card.dataset ? card.dataset.pubkey : '';
      const pass = fallbackNote
        ? true
        : passesTrust({ pubkey: pk }, mode, sets);
      if (card.style) card.style.display = pass ? '' : 'none';
      if (pass) out.visible += 1;
      else hidden += 1;
    }
    // Manage the note bar: present exactly when there is something to say.
    let noteKind = null;
    if (fallbackNote) noteKind = fallbackNote;
    else if (mode !== 'all' && hidden > 0) noteKind = 'filtered';
    out.note = noteKind;
    let noteEl = null;
    try {
      noteEl = feedEl.querySelector('#sqTrustNote');
    } catch { noteEl = null; }
    if (!noteKind) {
      if (noteEl && typeof noteEl.remove === 'function') noteEl.remove();
      return out;
    }
    if (!doc || typeof doc.createElement !== 'function') return out;
    if (!noteEl) {
      noteEl = doc.createElement('div');
      noteEl.id = 'sqTrustNote';
      noteEl.className = 'sq-trust-note';
      if (typeof feedEl.insertBefore === 'function' && feedEl.firstChild !== undefined) {
        feedEl.insertBefore(noteEl, feedEl.firstChild);
      } else if (typeof feedEl.prepend === 'function') {
        feedEl.prepend(noteEl);
      } else if (typeof feedEl.appendChild === 'function') {
        feedEl.appendChild(noteEl);
      }
    }
    // Rebuild note contents on every apply so counts stay current.
    if (typeof noteEl.replaceChildren === 'function') {
      const span = doc.createElement('span');
      span.textContent = trustNoteText(noteKind, out.visible, out.total, mode);
      noteEl.replaceChildren(span);
    } else {
      noteEl.textContent = trustNoteText(noteKind, out.visible, out.total, mode);
    }
    if (typeof opts.onShowAll === 'function' && typeof noteEl.appendChild === 'function') {
      const btn = doc.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Show all';
      btn.onclick = opts.onShowAll;
      noteEl.appendChild(btn);
    }
    return out;
  } catch {
    // Fail-open: show everything.
    try {
      const cards = feedEl ? [...feedEl.querySelectorAll('.sq-post')] : [];
      for (const card of cards) if (card.style) card.style.display = '';
      out.visible = cards.length;
      out.total = cards.length;
    } catch {}
    out.note = 'error';
    return out;
  }
}
