/* Soul Economy — shared pubkey resolver (unify step 1).
   ONE precedence, used by the profile page (this classic script) and
   mirrored by js/social/auth.js resolvePubkey() on the Square side.
   Why two implementations of one contract: a classic script cannot
   import the ESM module, and square.html is frozen — so both files
   implement the identical pickPubkey() decision and the identical
   harness cases. If they ever disagree, the harness catches it.
   Precedence: local soulKey first, then NIP-07, then cached soulPubkey.
   - Local-first means: a device holding BOTH a local key and a NIP-07
     extension resolves to the LOCAL key (the key Square signs with).
     While a local key exists but its pubkey is not yet derived (the
     Square module shim hasn't run), resolvePubkey() WAITS for the
     derivation — it never falls through to NIP-07, or the identity
     would flip depending on load timing.
   - The cached soulPubkey is only trusted in the local branch as a
     fallback after the derivation wait (the module writes that cache
     from the same local key), or in the no-local-key branch as a last
     resort. It is a PUBLIC value, never a secret. */
(function () {
  'use strict';

  function hasLocalKey() {
    try { return !!localStorage.getItem('soulKey'); } catch (e) { return false; }
  }
  function cachedPubkey() {
    try { return localStorage.getItem('soulPubkey') || null; } catch (e) { return null; }
  }
  function bridgePubkey() {
    try { return (window.SquareBridge && window.SquareBridge.pubkey) || null; } catch (e) { return null; }
  }

  /* Pure precedence decision — harness-tested verbatim.
     input: { hasLocalKey, bridgePubkey, nip07Pubkey, cachedPubkey }.
     - Local key present: the LOCAL identity wins; bridgePubkey null
       means "not derived yet" (caller waits), never a NIP-07 fallback.
     - No local key: NIP-07, then cached, then null. */
  function pickPubkey(input) {
    var i = input || {};
    if (i.hasLocalKey) return i.bridgePubkey || null;
    if (i.nip07Pubkey) return i.nip07Pubkey;
    if (i.cachedPubkey) return i.cachedPubkey;
    return null;
  }

  function sleep(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }

  async function resolvePubkey() {
    if (hasLocalKey()) {
      // Wait for the Square module shim to derive the local pubkey
      // (its imports resolve over the network; the old bridge code
      // waited 1.5s — 3s covers a slow CDN without stalling the page).
      for (var i = 0; i < 12; i++) {
        var bp = bridgePubkey();
        if (bp) return bp;
        await sleep(250);
      }
      // Module never derived (offline/CDN down): fall back to the cache
      // the module wrote from this same key on an earlier visit.
      return cachedPubkey();
    }
    try {
      if (typeof window !== 'undefined' && window.nostr && window.nostr.getPublicKey) {
        var pk = await window.nostr.getPublicKey();
        if (pk) return pk;
      }
    } catch (e) { /* NIP-07 absent or declined — fall through */ }
    return cachedPubkey();
  }

  if (typeof window !== 'undefined') {
    window.SoulIdentity = {
      pickPubkey: pickPubkey,
      resolvePubkey: resolvePubkey,
      hasLocalKey: hasLocalKey,
      cachedPubkey: cachedPubkey,
      bridgePubkey: bridgePubkey,
    };
  }
})();
