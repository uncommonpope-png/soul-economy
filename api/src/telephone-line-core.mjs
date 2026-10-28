// Soul Telephone — always-open line, CORE (pure logic, no transport).
//
// This module holds every decision the line makes, written so it runs
// unchanged in two places:
//   - the Cloudflare Worker / Durable Object (api/src/telephone-line.mjs),
//   - plain Node, under `node --test` (api/src/telephone-line.test.mjs).
// It never touches a socket, never logs a key or a message body, and never
// imports a Worker-only global. The DO shell owns WebSocketPair,
// hibernation, and alarms; this module owns the rules.
//
// Protocol (v1, 1:1 text lines only):
//   client -> server: {type:"join", to} · {type:"msg", body} ·
//                      {type:"ping"} · {type:"pong"} · {type:"presence"}
//   server -> client: {type:"hello", line, you, peer, peerOnline} ·
//                      {type:"joined", line, you, peer} ·
//                      {type:"msg", from, body, t} ·
//                      {type:"presence", from, online} ·
//                      {type:"delivered"} · {type:"queued"} ·
//                      {type:"pong"} · {type:"error", error}
// A "line" is the unordered pair of two Soul Numbers. One Durable Object
// instance ('lines') holds every line; sockets are tagged by pair key and
// carry their owner number as a hibernation attachment. Group rooms, voice,
// and MCP tooling are explicitly out of v1.

export const NUMBER_RE = /^\d{3}-\d{4}$/;
export const MAX_BODY = 4000; // matches the async Telephone call cap
export const LINE_CALLS_PER_HOUR = 300; // line governor, SEPARATE from the async `tel:` bucket
export const HEARTBEAT_INTERVAL_MS = 30000;
export const HEARTBEAT_TIMEOUT_MS = 90000;

export function cleanLine(s, max) {
  return String(s ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .trim()
    .slice(0, max);
}

// Unordered pair key: pairKey(a, b) === pairKey(b, a). Returns null for a
// bad number or a call to yourself — both are rejected before any socket
// is accepted.
export function pairKey(a, b) {
  if (!NUMBER_RE.test(a || '') || !NUMBER_RE.test(b || '')) return null;
  if (a === b) return null;
  return [a, b].sort().join('|');
}

// Validate an inbound {type:"msg"} body. Returns {body} or {error}.
export function validateMsgBody(body) {
  const text = typeof body === 'string' ? body.trim() : '';
  if (!text) return { error: 'body required' };
  if (text.length > MAX_BODY) return { error: 'body too long' };
  return { body: text };
}

// SHA-256 hex, via the platform crypto (Workers + Node 22+ both provide it).
export async function sha256hex(str) {
  const buf = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(str)
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Resolve the connecting agent from a Bearer key. `db` is any object with
// prepare(sql).bind(...).first() — the real D1 binding in the Worker, a
// fake in tests. Returns the agent row or null. The key VALUE is hashed
// immediately and never retained.
export async function authenticateLine(db, key) {
  if (!key || typeof key !== 'string') return null;
  const hash = await sha256hex(key.trim());
  const row = await db
    .prepare(
      'SELECT number, name, status FROM telephone_agents WHERE key_hash = ?'
    )
    .bind(hash)
    .first();
  return row || null;
}

// Resolve the peer for a line join. Returns {peer} or {error, status}.
// DND is absolute here exactly as on async calls: a line is not a way
// around Do Not Disturb.
export async function resolvePeer(db, peerNumber, selfNumber) {
  if (!NUMBER_RE.test(peerNumber || ''))
    return { error: 'bad number format (want 222-XXXX)', status: 400 };
  if (peerNumber === selfNumber)
    return { error: 'cannot line yourself', status: 400 };
  const peer = await db
    .prepare('SELECT number, name, status FROM telephone_agents WHERE number = ?')
    .bind(peerNumber)
    .first();
  if (!peer) return { error: 'number not in service', status: 404 };
  if (peer.status === 'dnd')
    return { error: 'do_not_disturb', status: 403 };
  return { peer };
}

// Rate limit: sliding hourly window per key, persisted in D1. Same SQL
// semantics as the helpers in index.js / telephone.mjs, against the shared
// `rate_limits` table — but under a `telline:` key, NEVER the async `tel:`
// bucket. Heartbeats are never passed through here at all.
export async function lineRateLimit(db, number, max, windowMs) {
  const now = Date.now();
  const row = await db
    .prepare('SELECT window_start, count FROM rate_limits WHERE key = ?')
    .bind(`telline:${number}`)
    .first();
  if (!row || now - row.window_start > windowMs) {
    await db
      .prepare(
        'INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1) ' +
          'ON CONFLICT(key) DO UPDATE SET window_start = ?, count = 1'
      )
      .bind(`telline:${number}`, now, now)
      .run();
    return true;
  }
  if (row.count >= max) return false;
  await db
    .prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?')
    .bind(`telline:${number}`)
    .run();
  return true;
}

// Fallback persist: the EXISTING async Telephone row, same shape as
// sendCall() in telephone.mjs (an opener threads on itself). This is what
// makes "peer offline → queued" real: the message lands in the peer's
// async inbox, and the peer's reconnect inbox-pull picks it up.
export async function queueLineMessage(db, from, to, body) {
  const now = Math.floor(Date.now() / 1000);
  const res = await db
    .prepare(
      'INSERT INTO telephone_calls (from_number, to_number, subject, body, thread_id, in_reply_to, status, created_at) VALUES (?,?,?,?,?,?,?,?)'
    )
    .bind(from, to, 'Line message', body, null, null, 'delivered', now)
    .run();
  const id = res.meta?.last_row_id;
  await db
    .prepare('UPDATE telephone_calls SET thread_id = ? WHERE id = ?')
    .bind(id, id)
    .run();
  return { id, thread_id: id };
}

// Decide a validated message's fate. Peer DND is re-checked at queue time
// (a peer can flip to DND mid-line; the join-time check alone is not
// enough). Returns 'deliver' | 'queue' | 'blocked_dnd'.
export function decideDelivery({ peerOnline, peerStatus }) {
  if (peerStatus === 'dnd') return 'blocked_dnd';
  return peerOnline ? 'deliver' : 'queue';
}

// Dead-socket rule: no pong (and no message, which also proves liveness)
// within the timeout after the last proof of life.
export function isDeadSocket(lastProofMs, nowMs, timeoutMs = HEARTBEAT_TIMEOUT_MS) {
  if (!lastProofMs) return true;
  return nowMs - lastProofMs > timeoutMs;
}

// Frame builders — the only shapes the DO sends. Bodies pass through
// untouched; nothing here logs.
export function msgFrame(from, body, t = Date.now()) {
  return { type: 'msg', from, body, t };
}
export function presenceFrame(from, online) {
  return { type: 'presence', from, online };
}
export function helloFrame(line, you, peer, peerOnline) {
  return { type: 'hello', line, you, peer, peerOnline };
}
export function joinedFrame(line, you, peer) {
  return { type: 'joined', line, you, peer };
}
