// Soft download check (Gemini Rank 1) + Worker-side real order check (v1).
//
// LAYER 1 — soft gate (unchanged): downloads open when the visitor
// arrives from a Stripe checkout return, or within 30 days after one.
// This is friction against casual link scraping, NOT a license lock:
// the ZIP files themselves are static and directly fetchable by anyone
// who knows their URLs. If JavaScript is unavailable the page fails open
// (downloads shown), so no buyer is ever locked out by this check.
//
// LAYER 2 — real order check (new, additive only): when the URL carries
// ?session_id=cs_... or the buyer pastes a session id into the locked
// view, the page asks the Worker (POST /api/order-check) whether that
// Stripe checkout session actually paid and which pack it paid for. On a
// positively verified answer the page stores a pack-scoped record and
// shows ONLY that pack's card. On ANY failure — no secret configured,
// Stripe unreachable, lookup fails, bad id, network error — the page
// proceeds exactly as layer 1 would have, as if the exchange never
// happened. A failed check NEVER hides a download the soft gate shows.
//
// Precedence: unexpired order record > soft gate > locked view.
// A successful exchange does NOT set the soft-gate timestamp (that would
// re-open both packs and defeat pack distinction). An expired/cleared
// order record falls straight back to the soft gate.
(function () {
  var STRIPE_REF = /^https:\/\/(buy\.stripe\.com|checkout\.stripe\.com)\//;
  var KEY = 'seDlVerifiedAt';
  var TTL = 30 * 24 * 60 * 60 * 1000;
  var ORDER_KEY = 'seDlOrder';
  // Absolute Worker URL so the Pages mirror hits the same API as the
  // Worker origin. Any failure here is swallowed (see header).
  var ORDER_API = 'https://soul-economy.uncommonpope.workers.dev/api/order-check';
  var PACKS = ['complete', 'scorer'];

  function isVerified(referrer, storedAt, now) {
    if (STRIPE_REF.test(referrer || '')) return true;
    var t = parseInt(storedAt, 10);
    return !isNaN(t) && (now - t) < TTL;
  }

  // Pure display decision — the unit under test. orderPacks is the stored
  // record's packs (or []); orderExpired is true when the record's
  // expires_at has passed. Returns { mode, packs } where mode is
  // 'order' | 'soft' | 'locked'.
  function decideDisplay(softVerified, orderPacks, orderExpired) {
    var packs = Array.isArray(orderPacks)
      ? PACKS.filter(function (p) { return orderPacks.indexOf(p) !== -1; })
      : [];
    if (packs.length && !orderExpired) return { mode: 'order', packs: packs };
    if (softVerified) return { mode: 'soft', packs: PACKS.slice() };
    return { mode: 'locked', packs: [] };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { isVerified: isVerified, TTL: TTL, decideDisplay: decideDisplay, ORDER_KEY: ORDER_KEY };
    return;
  }

  function loadOrder() {
    try {
      var raw = localStorage.getItem(ORDER_KEY);
      if (!raw) return null;
      var rec = JSON.parse(raw);
      if (!rec || !Array.isArray(rec.packs)) return null;
      return rec;
    } catch (e) { return null; }
  }

  function orderExpired(rec, nowSeconds) {
    if (!rec || typeof rec.expires_at !== 'number') return true;
    return rec.expires_at <= nowSeconds;
  }

  function render() {
    var verifiedEl = document.getElementById('dlVerified');
    var lockedEl = document.getElementById('dlLocked');
    if (!verifiedEl || !lockedEl) return;
    var soft = false;
    try {
      if (STRIPE_REF.test(document.referrer || '')) {
        try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {}
        soft = true;
      } else {
        soft = isVerified('', localStorage.getItem(KEY), Date.now());
      }
    } catch (e) { soft = false; }
    var rec = loadOrder();
    var decision = decideDisplay(soft, rec ? rec.packs : [], rec ? orderExpired(rec, Math.floor(Date.now() / 1000)) : true);
    verifiedEl.style.display = decision.mode === 'locked' ? 'none' : '';
    lockedEl.style.display = decision.mode === 'locked' ? '' : 'none';
    // Pack scoping only ever narrows the verified view; the soft view
    // shows both cards exactly as before.
    PACKS.forEach(function (p) {
      var card = document.getElementById('pack-' + p);
      if (!card) return;
      card.style.display = (decision.mode === 'order' && decision.packs.indexOf(p) === -1) ? 'none' : '';
    });
    var note = document.getElementById('dlPackNote');
    if (note) {
      if (decision.mode === 'order') {
        var names = decision.packs.map(function (p) { return p === 'complete' ? 'Complete Library ($19)' : 'Scorer Pack ($49)'; });
        note.textContent = 'Verified purchase: ' + names.join(' + ') + '. Showing only what you bought — the other pack is linked below if you want it too.';
        note.style.display = '';
      } else {
        note.style.display = 'none';
      }
    }
    return decision;
  }

  // Exchange a session id for a pack-scoped record. Returns true only on
  // a positively verified answer. Every failure returns false silently —
  // the caller just keeps the current (soft-gate) rendering.
  function exchange(sessionId) {
    if (!sessionId || !/^cs_(test|live)_[A-Za-z0-9]{8,}$/.test(sessionId)) return Promise.resolve(false);
    return fetch(ORDER_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data || !data.verified || !Array.isArray(data.packs) || !data.packs.length) return false;
        try {
          localStorage.setItem(ORDER_KEY, JSON.stringify({
            packs: PACKS.filter(function (p) { return data.packs.indexOf(p) !== -1; }),
            token: data.token || null,
            expires_at: data.expires_at || (Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60),
          }));
        } catch (e) { return false; }
        return true;
      })
      .catch(function () { return false; });
  }

  function init() {
    render();
    // URL session id (future success-URL form): exchange once, then strip
    // it from the URL so it does not leak via referrer on later clicks.
    var params = null;
    try { params = new URLSearchParams(window.location.search); } catch (e) { params = null; }
    var sid = params ? params.get('session_id') : null;
    if (sid) {
      exchange(sid).then(function (ok) { if (ok) render(); });
      try {
        params.delete('session_id');
        var qs = params.toString();
        history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '') + window.location.hash);
      } catch (e) {}
    }
    // Locked-view recovery box: paste a checkout session id.
    var btn = document.getElementById('dlSessionBtn');
    var input = document.getElementById('dlSessionId');
    var msg = document.getElementById('dlSessionMsg');
    if (btn && input) {
      btn.addEventListener('click', function () {
        var id = (input.value || '').trim();
        if (msg) msg.textContent = 'Checking…';
        exchange(id).then(function (ok) {
          if (ok) {
            render();
            if (msg) msg.textContent = '';
          } else if (msg) {
            msg.textContent = 'Couldn\u2019t verify that id — it may not be a paid checkout session. Try coming back through your Stripe checkout return, or write to the Soul Economy and it will be made right.';
          }
        });
      });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
