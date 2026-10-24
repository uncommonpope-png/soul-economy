/* Soul Economy — Identity bridge (bridge list, Rank 1).
   Reads the Square/FeedRoom server identity (GET /api/profile, no auth
   needed for reads) and renders it on profile.html, so a feed user shows
   up on their profile WITHOUT a GitHub PR.
   - Pubkey resolution, in order: NIP-07 extension (window.nostr) →
     localStorage:soulPubkey cached by js/square-bridge-module.js.
   - API base: same-origin first (Worker origin), then the Worker origin
     directly (so the GitHub Pages mirror works) — the same pattern as
     js/ticker.js.
   - NEVER replaces the local Sanctuary: export/import, starred souls,
     and pending PRs live below this card untouched. When no Square
     identity is resolvable, or the server knows nothing for the pubkey,
     this renders an honest fallback — never a fake profile.
   - Visitor views (#@handle or ?user=) are registry profiles, not the
     owner's feed identity: the bridge hides itself there. */
(function () {
  'use strict';
  var WORKER = 'https://soul-economy.uncommonpope.workers.dev';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function snip(s, n) {
    s = String(s || '').replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }
  function isVisitor() {
    try {
      if ((location.hash || '').indexOf('#@') === 0) return true;
      var sp = new URLSearchParams(location.search.split('#')[0]);
      if (sp.get('user')) return true;
    } catch (e) { /* keep going: not a visitor */ }
    return false;
  }
  function sleep(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }

  async function resolvePubkey() {
    try {
      if (typeof window !== 'undefined' && window.nostr && window.nostr.getPublicKey) {
        var pk = await window.nostr.getPublicKey();
        if (pk) return pk;
      }
    } catch (e) { /* NIP-07 absent or declined — fall through */ }
    try {
      var cached = localStorage.getItem('soulPubkey');
      if (cached) return cached;
    } catch (e) { /* private-mode storage */ }
    // The module shim may still be deriving from soulKey; give it a beat.
    for (var i = 0; i < 6; i++) {
      await sleep(250);
      try {
        if (typeof window !== 'undefined' && window.SquareBridge && window.SquareBridge.pubkey)
          return window.SquareBridge.pubkey;
        var late = localStorage.getItem('soulPubkey');
        if (late) return late;
      } catch (e) { /* keep waiting */ }
    }
    return null;
  }

  async function fetchJson(url, timeoutMs) {
    var ctl = null;
    try { ctl = new AbortController(); } catch (e) { /* older webview */ }
    var timer = null;
    try {
      if (ctl) timer = setTimeout(function () { try { ctl.abort(); } catch (e) {} }, timeoutMs);
      var r = await fetch(url, { signal: ctl ? ctl.signal : undefined });
      if (!r.ok) return null;
      return await r.json().catch(function () { return null; });
    } catch (e) {
      return null;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function fetchProfile(pk) {
    var q = '?pubkey=' + encodeURIComponent(pk);
    var data = await fetchJson('/api/profile' + q, 6000);
    if (data) return data;
    return await fetchJson(WORKER + '/api/profile' + q, 6000);
  }

  function renderProfile(box, data) {
    var u = (data && data.user) || {};
    var counts = (data && data.counts) || {};
    var name = u.display_name || u.name || 'Square soul';
    var about = u.about || '';
    var pic = u.picture || '';
    var pk = u.pubkey || '';
    var recent = (data && data.recent) || [];
    var html = '<h3>◇ Square Identity — from the Feed</h3>' +
      '<p style="color:var(--text-muted);font-size:0.85rem;margin:6px 0 12px">Your server-backed social identity. No PR needed — this is who the Square knows you as.</p>' +
      '<div class="row">' +
      (pic && /^https?:\/\//i.test(pic)
        ? '<img class="avatar" src="' + esc(pic) + '" alt="avatar" onerror="this.style.display=\'none\'">'
        : '') +
      '<div><div style="font-size:1.1rem;font-weight:700">' + esc(name) + '</div>' +
      (pk ? '<div style="font-size:0.75rem;color:var(--text-muted)" title="' + esc(pk) + '">' + esc(pk.slice(0, 16)) + '…</div>' : '') +
      (about ? '<div style="font-size:0.85rem;color:var(--text-gray);margin-top:6px">' + esc(about) + '</div>' : '') +
      '</div></div>' +
      '<div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap">' +
      '<span class="badge">' + (counts.posts || 0) + ' posts</span>' +
      '<span class="badge">' + (counts.followers || 0) + ' followers</span>' +
      '<span class="badge">' + (counts.following || 0) + ' following</span>' +
      '</div>';
    if (recent.length) {
      html += '<div style="margin-top:14px"><div style="font-size:0.8rem;color:var(--text-gray);margin-bottom:6px">Recent in the Square:</div>' +
        recent.slice(0, 5).map(function (p) {
          return '<div style="font-size:0.8rem;color:var(--text-gray);margin:4px 0">✦ ' +
            esc(snip(p.content, 110)) + '</div>';
        }).join('') + '</div>';
    }
    html += '<div style="margin-top:14px"><a href="square.html" style="color:#00D4FF;font-size:0.85rem">→ View in the Square</a>' +
      '<span style="font-size:0.75rem;color:var(--text-muted)"> · Your local Sanctuary (starred, pending, export/import) still lives below — untouched.</span></div>';
    box.innerHTML = html;
  }

  function renderFallback(box, msg) {
    box.innerHTML = '<h3>◇ Square Identity — from the Feed</h3>' +
      '<p style="color:var(--text-muted);font-size:0.85rem;margin:6px 0">' + esc(msg) + '</p>' +
      '<p style="font-size:0.8rem;color:var(--text-gray)">Your local Sanctuary below still works exactly as before — starred souls, pending PRs, and Export/Import Sanctuary are untouched.</p>' +
      '<div style="margin-top:10px"><a href="square.html" style="color:#00D4FF;font-size:0.85rem">→ Open the Square</a></div>';
  }

  async function boot() {
    var box = document.getElementById('upcBridge');
    if (!box) return;
    if (isVisitor()) { box.style.display = 'none'; return; }
    var pk = await resolvePubkey();
    if (!pk) {
      renderFallback(box, 'No Square identity connected on this device. Open the Square once to connect your key, or connect a NIP-07 browser extension, then reload this page.');
      return;
    }
    var data = await fetchProfile(pk);
    if (!data || !data.user) {
      renderFallback(box, 'Square key connected, but the server has no profile for it yet — post once in the Square (or sign in there) to create it.');
      return;
    }
    renderProfile(box, data);
  }

  // Deferred scripts run after parsing, so the #upcBridge node exists.
  try { boot(); } catch (e) { /* never break the profile page */ }
})();
