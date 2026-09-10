/* js/social-sync.js — shared-truth sync engine (Phase B/C).
   Additive-only: the app works offline without this file. Nothing here runs
   unless the user flips Cloud Sync on (USE_SOCIAL_API, default off).
   Outbox (local-first writes) + pull (since-timestamp merge). Exposes
   window.SocialSync. Server: workers/social-api.js + social-schema.sql. */
(function(){
'use strict';
var API = 'https://soul-api.buyasoul.workers.dev/social';
var K_FLAG = 'soulSocialUseAPI', K_TOKEN = 'soulSocialJWT', K_OUTBOX = 'soulSocialOutbox', K_SINCE = 'soulSocialSince';
var flushing = false, pullTimer = 0;

function lsGet(k, f){ try{ var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? f : v; }catch(e){ return f; } }
function lsSet(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function enabled(){ try{ return localStorage.getItem(K_FLAG) === '1'; }catch(e){ return false; } }
function token(){ try{ return localStorage.getItem(K_TOKEN) || ''; }catch(e){ return ''; } }
function toast(m){
  try{
    if (window.__familySocial && window.__familySocial.toast) { window.__familySocial.toast(m); return; }
    var t = document.getElementById('ssToast');
    if (t) { t.textContent = m; t.classList.remove('hidden'); setTimeout(function(){ t.classList.add('hidden'); }, 2600); }
  }catch(e){}
}

function headers(auth) {
  var h = { 'Content-Type': 'application/json' };
  if (auth && token()) h.Authorization = 'Bearer ' + token();
  return h;
}
async function api(path, opts, auth) {
  const r = await fetch(API + path, Object.assign({ headers: headers(auth) }, opts || {}));
  const j = await r.json().catch(() => ({ ok: false, error: 'bad json' }));
  if (!j.ok) throw new Error(j.error || ('http ' + r.status));
  return j.data;
}

/* ---- outbox: every synced write lands locally first, then queues ---- */
function queue(op) {
  if (!enabled() || !token()) return false;
  var box = lsGet(K_OUTBOX, []);
  box.push(Object.assign({ _t: Date.now() }, op));
  lsSet(K_OUTBOX, box.slice(-200));
  touch();
  return true;
}
function touch() {
  if (!enabled() || !token() || flushing) return;
  if (!navigator.onLine) return;
  clearTimeout(touch._t);
  touch._t = setTimeout(flush, 1200);
}
async function flush() {
  if (!enabled() || !token() || flushing || !navigator.onLine) return;
  var box = lsGet(K_OUTBOX, []);
  if (!box.length) return;
  flushing = true;
  try {
    const ops = box.slice(0, 50).map(o => { const c = {}; for (const k in o) if (k.charAt(0) !== '_') c[k] = o[k]; return c; });
    const res = await api('/sync', { method: 'POST', body: JSON.stringify({ ops }) }, true);
    void res;
    lsSet(K_OUTBOX, box.slice(50));
  } catch (e) { /* stay queued; retry on next touch */
  }
  flushing = false;
  if (lsGet(K_OUTBOX, []).length) touch();
}

/* ---- pull + merge (ids are stable client-generated strings) ---- */
function since() { return lsGet(K_SINCE, {}); }
function setSince(patch) { const s = since(); for (const k in patch) s[k] = patch[k]; lsSet(K_SINCE, s); }

function mergePosts(rows) {
  if (!rows || !rows.length) return 0;
  var all = lsGet('soulSocialShouts', {}), n = 0;
  rows.forEach(p => {
    const soul = p.g || p.group_id ? 'group:' + (p.g || p.group_id) : (p.soul || '');
    const list = all[soul] || (all[soul] = []);
    const ix = list.findIndex(x => String(x.id) === String(p.id));
    const rec = { id: String(p.id), u: p.u || p.author, e: '🫂', t: p.t || p.created, b: p.b || p.body, v: 0, k: p.k || p.kind || 'text', url: p.url || '', vis: p.vis || 'public', m: (p.m ? 1 : 0) };
    if (ix >= 0) { if ((p.edited || p.created || 0) >= (list[ix].t || 0)) list[ix] = rec; }
    else { list.unshift(rec); n++; }
  });
  try { localStorage.setItem('soulSocialShouts', JSON.stringify(all)); } catch (e) {}
  return n;
}
function applyDeletes(rows) {
  if (!rows || !rows.length) return;
  var changed = false;
  rows.forEach(d => {
    if (d.ref_kind === 'post') {
      var all = lsGet('soulSocialShouts', {});
      for (const k in all) {
        const ix = (all[k] || []).findIndex(x => String(x.id) === String(d.ref_id));
        if (ix >= 0) { all[k].splice(ix, 1); changed = true; }
      }
      if (changed) try { localStorage.setItem('soulSocialShouts', JSON.stringify(all)); } catch (e) {}
    }
    if (d.ref_kind === 'reply') {
      var rp = lsGet('soulShoutReplies', {});
      for (const k in rp) {
        const L = rp[k] || [];
        const ix = L.findIndex(x => String(x.id) === String(d.ref_id));
        if (ix >= 0) { L.splice(ix, 1); changed = true; }
        L.forEach(r => {
          const jx = ((r.r) || []).findIndex(x => String(x.id) === String(d.ref_id));
          if (jx >= 0) { r.r.splice(jx, 1); changed = true; }
        });
      }
      if (changed) try { localStorage.setItem('soulShoutReplies', JSON.stringify(rp)); } catch (e) {}
    }
  });
}

async function pull(surfaces) {
  if (!enabled() || !token() || !navigator.onLine) return null;
  const s = since();
  const q = '?since=' + (s.global || 0);
  const d = await api('/pull' + q, null, true);
  if (surfaces && surfaces.indexOf('posts') < 0) { /* selective surfaces later */ }
  const n = mergePosts(d.posts);
  applyDeletes(d.deletes);
  if (d.messages && d.messages.length) {
    var dms = lsGet('soulDMs', {}), added = 0;
    d.messages.forEach(m => {
      const key = dmKeyFor(m, verifiedHandle() || myHandle());
      const L = dms[key] || (dms[key] = []);
      if (!L.some(x => String(x.id) === String(m.id))) {
        L.push({ id: String(m.id), u: m.author, t: m.created, b: m.body });
        added++;
      }
    });
    if (added) try { localStorage.setItem('soulDMs', JSON.stringify(dms)); } catch (e) {}
  }
  setSince({ global: d.serverTime || Date.now() });
  return { posts: n, notes: (d.notes || []).length, messages: (d.messages || []).length };
}
function dmKeyFor(m, me) {
  const parts = String(m.thread || '').split('|');
  const ml = String(me || '').toLowerCase();
  const other = parts[0] === ml ? parts[1] : parts[0];
  return (other || String(m.author || '')).toLowerCase();
}
function myHandle() {
  try {
    if (window.__familySocial && window.__familySocial.prefs && window.__familySocial.prefs.user) {
      return window.__familySocial.prefs.user.handle || 'You';
    }
  } catch (e) {}
  return 'You';
}
function verifiedHandle() {
  try {
    if (window.SoulAuth && window.SoulAuth.getUser) {
      const a = window.SoulAuth.getUser();
      if (a && a.handle) return String(a.handle).replace(/^@/, '');
    }
  } catch (e) {}
  return '';
}
function ghToken() {
  try {
    if (window.SoulAuth && window.SoulAuth.getUser) {
      const a = window.SoulAuth.getUser();
      if (a && a.token) return a.token;
    }
  } catch (e) {}
  return '';
}

/* ---- auth: verify GitHub token via existing OAuth, mint session ---- */
async function loginWithGitHub(ghToken) {
  const d = await api('/auth/session', { method: 'POST', body: JSON.stringify({ gh_token: ghToken }) }, false);
  try { localStorage.setItem(K_TOKEN, d.token); } catch (e) {}
  try { localStorage.setItem(K_FLAG, '1'); } catch (e) {}
  touch();
  pull().catch(() => {});
  return d.handle;
}
function logout() {
  try { localStorage.removeItem(K_TOKEN); localStorage.setItem(K_FLAG, '0'); } catch (e) {}
}
function setEnabled(on) {
  try { localStorage.setItem(K_FLAG, on ? '1' : '0'); } catch (e) {}
  if (on) { touch(); pull().catch(() => {}); }
}

/* ---- auto-pull while the dock is open ---- */
function armAutoPull() {
  if (pullTimer) return;
  pullTimer = setInterval(function() {
    try {
      const dock = document.getElementById('ssDock');
      if (enabled() && token() && dock && !dock.classList.contains('hidden')) pull().catch(() => {});
    } catch (e) {}
  }, 30000);
  try {
    window.addEventListener('online', function() { touch(); pull().catch(() => {}); });
  } catch (e) {}
  try {
    if (!armAutoPull._bound) {
      armAutoPull._bound = true;
      window.addEventListener('soul-auth', function() {
        if (enabled() && !token() && ghToken()) loginWithGitHub(ghToken()).catch(() => {});
      });
    }
  } catch (e) {}
}

window.SocialSync = {
  enabled, token, queue, touch, flush, pull, loginWithGitHub, logout, setEnabled, armAutoPull, toast, API
};
})();
