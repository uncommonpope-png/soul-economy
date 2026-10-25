// Soft download check (Gemini Rank 1): downloads open when the visitor
// arrives from a Stripe checkout return, or within 30 days after one.
// This is friction against casual link scraping, NOT a license lock:
// the ZIP files themselves are static and directly fetchable by anyone
// who knows their URLs. If JavaScript is unavailable the page fails open
// (downloads shown), so no buyer is ever locked out by this check.
(function () {
  var STRIPE_REF = /^https:\/\/(buy\.stripe\.com|checkout\.stripe\.com)\//;
  var KEY = 'seDlVerifiedAt';
  var TTL = 30 * 24 * 60 * 60 * 1000;
  function isVerified(referrer, storedAt, now) {
    if (STRIPE_REF.test(referrer || '')) return true;
    var t = parseInt(storedAt, 10);
    return !isNaN(t) && (now - t) < TTL;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { isVerified: isVerified, TTL: TTL };
    return;
  }
  function init() {
    var verifiedEl = document.getElementById('dlVerified');
    var lockedEl = document.getElementById('dlLocked');
    if (!verifiedEl || !lockedEl) return;
    var verified = false;
    try {
      if (STRIPE_REF.test(document.referrer || '')) {
        try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {}
        verified = true;
      } else {
        verified = isVerified('', localStorage.getItem(KEY), Date.now());
      }
    } catch (e) { verified = false; }
    verifiedEl.style.display = verified ? '' : 'none';
    lockedEl.style.display = verified ? 'none' : '';
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
