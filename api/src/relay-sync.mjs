// Backend Nostr relay sync — broadcast-on-create only.
//
// When a new signed kind-1 post lands (POST /api/events, signature already
// verified by the router via verifyEvent, D1 insert actually happened),
// this module re-broadcasts that exact signed event to public relays in
// the background via ctx.waitUntil — never awaited in the request path,
// never fatal to post creation.
//
// Hard rules:
// - NEVER sign anything, never create keys, never touch a private key.
//   Only already-signed events pass the shape gate, and the payload is
//   the received event unchanged: ["EVENT", ev].
// - FAIL-OPEN: every relay failure (unreachable, timeout, rejection,
//   closed socket, missing WebSocket, missing ctx) is a logged result,
//   never a throw, never a failed post.
// - No D1, no storage, no retry queue, no relay auth, no polling loop.
// - Dependency-free on purpose (no nostr-tools import) so it can be
//   tested with plain node. Cryptographic verification lives in the
//   router's request path; this module re-checks shape only.

export const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net',
  'wss://relay.snort.social',
];

export const RELAY_TIMEOUT_MS = 3000;
export const MAX_RELAYS = 8;

const HEX64 = /^[0-9a-f]{64}$/;
const HEX128 = /^[0-9a-f]{128}$/;

function isValidRelayUrl(raw) {
  if (typeof raw !== 'string') return false;
  const s = raw.trim();
  if (!s.startsWith('wss://')) return false;
  try {
    const u = new URL(s);
    if (u.protocol !== 'wss:') return false;
    if (!u.hostname) return false;
    // No credentials in a relay URL — a public relay needs none.
    if (u.username || u.password) return false;
    return true;
  } catch {
    return false;
  }
}

// Configurable relay list: env NOSTR_RELAYS (comma-separated wss:// URLs)
// wins when it yields at least one valid entry; anything missing, empty,
// or all-invalid falls back to DEFAULT_RELAYS. Never throws, never [].
export function parseRelayList(env) {
  try {
    const raw = env && typeof env.NOSTR_RELAYS === 'string' ? env.NOSTR_RELAYS : '';
    const seen = new Set();
    const out = [];
    for (const part of raw.split(',')) {
      const s = part.trim();
      if (isValidRelayUrl(s) && !seen.has(s)) {
        seen.add(s);
        out.push(s);
        if (out.length >= MAX_RELAYS) break;
      }
    }
    if (out.length) return out;
  } catch (e) {
    console.log('[relay-sync] parseRelayList failed, using defaults', e && e.message);
  }
  return [...DEFAULT_RELAYS];
}

// Shape gate only — the router already verified the signature before
// this module is ever called. Refuses anything that is not a plausibly
// signed kind-1 event, so no unsigned content can reach a socket.
export function isBroadcastableEvent(ev) {
  if (!ev || typeof ev !== 'object' || Array.isArray(ev)) return false;
  if (ev.kind !== 1) return false;
  if (typeof ev.id !== 'string' || !HEX64.test(ev.id)) return false;
  if (typeof ev.pubkey !== 'string' || !HEX64.test(ev.pubkey)) return false;
  if (typeof ev.sig !== 'string' || !HEX128.test(ev.sig)) return false;
  if (typeof ev.content !== 'string') return false;
  if (!Array.isArray(ev.tags)) return false;
  if (typeof ev.created_at !== 'number') return false;
  return true;
}

// The relay payload: the signed event, unchanged. Never rebuilt
// field-by-field — rebuilding could drop a tag or alter content and
// invalidate the signature relays check.
export function buildRelayMessage(ev) {
  return JSON.stringify(['EVENT', ev]);
}

function publishToOneRelay(ev, relay, WebSocketImpl, timeoutMs) {
  return new Promise((resolve) => {
    let settled = false;
    let ws = null;
    let timer = null;
    const finish = (ok, reason) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      try {
        if (ws) ws.close();
      } catch {}
      if (!ok) console.log('[relay-sync] relay failed', relay, reason, 'event', ev.id);
      resolve({ relay, ok, reason });
    };
    try {
      timer = setTimeout(() => finish(false, 'timeout'), timeoutMs);
      ws = new WebSocketImpl(relay);
    } catch (e) {
      finish(false, 'error');
      return;
    }
    const onOpen = () => {
      try {
        ws.send(buildRelayMessage(ev));
      } catch {
        finish(false, 'error');
      }
    };
    const onMessage = (msg) => {
      try {
        const data = typeof msg === 'string' ? msg : msg && msg.data;
        const parsed = JSON.parse(typeof data === 'string' ? data : '');
        if (Array.isArray(parsed) && parsed[0] === 'OK' && parsed[1] === ev.id) {
          finish(parsed[2] === true, parsed[2] === true ? 'ok' : 'rejected');
        }
        // Any other relay message (NOTICE, etc.) is ignored — keep waiting
        // for the OK or the timeout.
      } catch {
        // Unparseable relay chatter: ignore, keep waiting for OK/timeout.
      }
    };
    const onError = () => finish(false, 'error');
    const onClose = () => finish(false, 'closed');
    try {
      if (typeof ws.addEventListener === 'function') {
        ws.addEventListener('open', onOpen);
        ws.addEventListener('message', onMessage);
        ws.addEventListener('error', onError);
        ws.addEventListener('close', onClose);
      } else {
        // Fallback for minimal WebSocket implementations.
        ws.onopen = onOpen;
        ws.onmessage = (m) => onMessage(m && m.data !== undefined ? m.data : m);
        ws.onerror = onError;
        ws.onclose = onClose;
      }
    } catch {
      finish(false, 'error');
    }
  });
}

// Broadcast to all relays in parallel. Never throws, never rejects:
// unreachable/timeout/rejected relays resolve as { ok: false } results.
export async function broadcastToRelays(ev, relays, opts = {}) {
  try {
    if (!isBroadcastableEvent(ev)) return [];
    const list = Array.isArray(relays) ? relays.filter(Boolean) : [];
    if (!list.length) return [];
    const WebSocketImpl = opts.WebSocketImpl || globalThis.WebSocket;
    if (typeof WebSocketImpl !== 'function') {
      console.log('[relay-sync] no WebSocket available, skipping broadcast', 'event', ev.id);
      return list.map((relay) => ({ relay, ok: false, reason: 'no-websocket' }));
    }
    const timeoutMs =
      typeof opts.timeoutMs === 'number' && opts.timeoutMs > 0 ? opts.timeoutMs : RELAY_TIMEOUT_MS;
    const results = await Promise.all(
      list.map((relay) => publishToOneRelay(ev, relay, WebSocketImpl, timeoutMs))
    );
    const delivered = results.filter((r) => r.ok).length;
    console.log('[relay-sync] broadcast done', 'event', ev.id, `${delivered}/${results.length} relays ok`);
    return results;
  } catch (e) {
    console.log('[relay-sync] broadcast failed', e && e.message);
    return [];
  }
}

// Router entry point. Registers the background broadcast with
// ctx.waitUntil when available (zero added user latency: the response
// proceeds immediately and the runtime keeps the work alive), otherwise
// starts it fire-and-forget. Never throws; never awaited by the caller.
export function scheduleRelayBroadcast(ctx, env, ev) {
  try {
    if (!isBroadcastableEvent(ev)) return false;
    const relays = parseRelayList(env);
    if (!relays.length) return false;
    // Deferred by one microtask on purpose: no socket is opened
    // synchronously in the request path — the handler only does a shape
    // check, a list parse, and this registration, then returns. waitUntil
    // keeps the deferred work alive past the response.
    const work = Promise.resolve().then(() => broadcastToRelays(ev, relays));
    if (ctx && typeof ctx.waitUntil === 'function') {
      try {
        ctx.waitUntil(work);
        return true;
      } catch (e) {
        console.log('[relay-sync] waitUntil failed, fire-and-forget', e && e.message);
      }
    }
    // No execution context (tests / non-Worker runtimes): still attempt,
    // detached, and swallow any rejection so the caller can never fail.
    work.catch(() => {});
    return false;
  } catch (e) {
    console.log('[relay-sync] schedule failed', e && e.message);
    return false;
  }
}
