// Layer 4 — Client Relay Connector: live client-to-public-relay sync.
//
// The browser frontend subscribes directly to public Nostr relays
// (NIP-01 WebSocket filters) ALONGSIDE the backend database. The backend
// feed remains the base; relay-live posts are additive only.
//
// FAIL-OPEN: every entry point is try/catch-guarded. A relay disconnect,
// timeout, rejection, or throw must NEVER break the feed, posting, or page
// render — the feed works exactly as before, with the indicator offline.
//
// ZERO STATIC IMPORTS on purpose: this module must stay Node-importable
// so the functional harness can import the REAL pure helpers (same trick
// as threads.js). Browser-only wiring (nostr pool, feed DOM) arrives via
// dynamic import() inside startRelayLive(), after page modules are
// evaluated — so there is no import cycle with feed.js, even though
// feed.js statically imports liveInsertIndex from here.
//
// NOT: no proprietary WebSocket server in the Worker, no relay auth, no
// keys, no secrets, no auto-publish change, no D1 migration. Only public
// kind-1 posts are read. Live posts render ONLY into the global (All)
// feed view — Following, soul-filter, and search views are untouched
// (see prependLivePost in feed.js).

export const LIVE_LIMIT = 50;
export const LIVE_TAG = 'soul-economy';
export const MAX_LIVE_PREPENDS = 20;
export const MAX_RETRIES = 5;
export const SEEN_CAP = 1000;

// ─── pure helpers (harness-tested; no DOM, no network) ───────────────────

// Standard NIP-01 filter: kinds [1], limit 50, scoped to the repo's
// existing '#t' soul-economy tag (see spec §4: bare kinds:[1] would flood
// the Square with unrelated global Nostr traffic).
export function buildLiveFilter() {
  return { kinds: [1], '#t': [LIVE_TAG], limit: LIVE_LIMIT };
}

export function hasSoulEconomyTag(ev) {
  try {
    const tags = Array.isArray(ev && ev.tags) ? ev.tags : [];
    return tags.some((t) => Array.isArray(t) && t[0] === 't' && t[1] === LIVE_TAG);
  } catch {
    return false;
  }
}

// Eligibility for live rendering. `since` is the unix second the
// subscription started: relays replay up to 50 recent events on subscribe
// (backfill), and only events created at/after subscribe time may render
// — older replays only seed the dedup set (see spec §5.3).
export function isLiveEligible(ev, { since = 0, seen = null } = {}) {
  try {
    if (!ev || typeof ev !== 'object') return false;
    if (ev.kind !== 1) return false;
    if (typeof ev.id !== 'string' || !ev.id) return false;
    if (typeof ev.created_at !== 'number' || !(ev.created_at >= since)) return false;
    if (!hasSoulEconomyTag(ev)) return false;
    if (seen && typeof seen.has === 'function' && seen.has(ev.id)) return false;
    return true;
  } catch {
    return false;
  }
}

// Bounded dedup set. Returns true when the id was newly seen.
export function rememberSeen(seen, id, cap = SEEN_CAP) {
  try {
    if (!seen || typeof id !== 'string' || !id) return false;
    if (seen.has(id)) return false;
    if (seen.size >= cap) seen.clear();
    seen.add(id);
    return true;
  } catch {
    return false;
  }
}

// Index at which a card with `createdAt` slots into a newest-first list of
// created_at values, so out-of-order relay delivery still renders in
// correct order. feed.js imports this exact function for DOM insertion.
export function liveInsertIndex(createdAtsDesc, createdAt) {
  const list = Array.isArray(createdAtsDesc) ? createdAtsDesc : [];
  const t = Number(createdAt) || 0;
  let i = 0;
  while (i < list.length && (Number(list[i]) || 0) > t) i++;
  return i;
}

// ─── indicator state machine ──────────────────────────────────────────────
// States: 'offline' | 'reconnecting' | 'connected'.
// Events: 'started' | 'first-proof' (an event or EOSE proves ≥1 relay
// answers) | 'closed' (sub closed → retry scheduled) | 'retries-exhausted'
// | 'stopped'. Unknown events leave the state unchanged.
export function nextRelayState(state, event) {
  const s = state === 'connected' || state === 'reconnecting' ? state : 'offline';
  switch (event) {
    case 'started':
      return s === 'connected' ? 'connected' : 'reconnecting';
    case 'first-proof':
      return 'connected';
    case 'closed':
      return 'reconnecting';
    case 'retries-exhausted':
    case 'stopped':
      return 'offline';
    default:
      return s;
  }
}

// Retry backoff: 2s, 4s, 8s, 16s, then capped at 30s.
export function backoffMs(attempt) {
  const a = Math.max(0, Math.floor(Number(attempt) || 0));
  return Math.min(30000, 2000 * Math.pow(2, a));
}

const INDICATOR_TEXT = {
  connected: '● relays live',
  reconnecting: '◐ relays reconnecting…',
  offline: '○ relays offline',
};

// ─── runtime (browser only; all guarded, all fail-open) ───────────────────

let started = false;
let closeSub = null;
let retryTimer = 0;
let retryAttempt = 0;
let indicatorState = 'offline';
let liveSince = 0;
const seenIds = new Set();

function setIndicator(state) {
  indicatorState = state;
  try {
    if (typeof document === 'undefined') return;
    const el = document.getElementById('sqRelayDot');
    if (!el) return;
    el.dataset.state = state;
    el.textContent = INDICATOR_TEXT[state] || INDICATOR_TEXT.offline;
    el.title =
      state === 'connected'
        ? 'Connected to public Nostr relays — new Square posts stream in live.'
        : state === 'reconnecting'
          ? 'Relays reconnecting — the Square feed below is unaffected.'
          : 'Relays offline — the Square feed below is unaffected.';
  } catch {}
}

function clearRetry() {
  try {
    if (retryTimer) clearTimeout(retryTimer);
  } catch {}
  retryTimer = 0;
}

function scheduleRetry() {
  clearRetry();
  if (retryAttempt >= MAX_RETRIES) {
    setIndicator(nextRelayState(indicatorState, 'retries-exhausted'));
    return;
  }
  const wait = backoffMs(retryAttempt);
  retryAttempt++;
  try {
    retryTimer = setTimeout(() => {
      retryTimer = 0;
      connect();
    }, wait);
  } catch {
    setIndicator(nextRelayState(indicatorState, 'retries-exhausted'));
  }
}

// Proof that ≥1 relay answers: indicator → connected, and a retry that
// connects resets the attempt counter (a later disconnect gets a fresh
// run of retries).
function markProof() {
  setIndicator(nextRelayState(indicatorState, 'first-proof'));
  if (indicatorState === 'connected') retryAttempt = 0;
}

async function connect() {
  let nostr;
  try {
    nostr = await import('./nostr.js');
  } catch {
    setIndicator(nextRelayState(indicatorState, 'retries-exhausted'));
    return;
  }
  if (!nostr || typeof nostr.subscribeLiveRelay !== 'function') {
    setIndicator(nextRelayState(indicatorState, 'retries-exhausted'));
    return;
  }
  liveSince = Math.floor(Date.now() / 1000);
  let feed = null;
  const deliverEligible = async (ev) => {
    try {
      if (!feed) {
        try {
          feed = await import('./feed.js');
        } catch {
          return;
        }
      }
      if (!feed || typeof feed.prependLivePost !== 'function') return;
      feed.prependLivePost(feed.relayPost(ev));
    } catch {}
  };
  let closer = null;
  try {
    closer = nostr.subscribeLiveRelay(buildLiveFilter(), {
      onevent: (ev) => {
        // Dedup FIRST (multi-relay duplicates + backfill seeding):
        // rememberSeen returns false for repeats, so a repeat never
        // reaches the render path even if it passes the other gates.
        const fresh = ev && typeof ev.id === 'string' && ev.id ? rememberSeen(seenIds, ev.id) : false;
        markProof();
        if (!fresh) return;
        if (!isLiveEligible(ev, { since: liveSince })) return;
        deliverEligible(ev);
      },
      oneose: () => markProof(),
      onclose: () => {
        setIndicator(nextRelayState(indicatorState, 'closed'));
        scheduleRetry();
      },
    });
  } catch {
    closer = null;
  }
  if (typeof closer !== 'function') {
    // Subscribe threw or returned null: this attempt failed outright.
    if (retryAttempt >= MAX_RETRIES) {
      setIndicator(nextRelayState(indicatorState, 'retries-exhausted'));
    } else {
      setIndicator(nextRelayState(indicatorState, 'closed'));
      scheduleRetry();
    }
    return;
  }
  closeSub = closer;
}

// Start the live relay subscription. Safe to call on any origin (public
// relays need no backend — unlike startFeedLive, which is workers.dev
// only). Second call is a no-op. Never throws.
export function startRelayLive() {
  try {
    if (started) return;
    if (typeof window === 'undefined') return;
    started = true;
    retryAttempt = 0;
    setIndicator(nextRelayState(indicatorState, 'started'));
    connect();
  } catch {
    try {
      setIndicator('offline');
    } catch {}
  }
}

// Stop the subscription and retries. Never throws.
export function stopRelayLive() {
  try {
    started = false;
    clearRetry();
    try {
      if (typeof closeSub === 'function') closeSub();
    } catch {}
    closeSub = null;
    setIndicator(nextRelayState(indicatorState, 'stopped'));
  } catch {}
}

// Test/diagnostic hook: current indicator state (no DOM required).
export function getRelayIndicatorState() {
  return indicatorState;
}
