// Soul Telephone always-open line — relay-side harness (plain Node).
// No network, no real keys, no Worker runtime. The fake D1 below speaks the
// exact statements the core module issues; the DO shell (WebSocketPair,
// hibernation) cannot run in plain Node, so it is covered by a load test
// plus review — see the limitation note at the bottom of this file.
//
// Run: node --test api/src/telephone-line.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  pairKey,
  validateMsgBody,
  sha256hex,
  authenticateLine,
  resolvePeer,
  lineRateLimit,
  queueLineMessage,
  decideDelivery,
  isDeadSocket,
  msgFrame,
  helloFrame,
  presenceFrame,
  LINE_CALLS_PER_HOUR,
  MAX_BODY,
} from './telephone-line-core.mjs';
import { TelephoneLine } from './telephone-line.mjs';

// ─── Fake D1 ────────────────────────────────────────────────────────────────
// Supports exactly the statements the line core issues. Anything else throws,
// so a query drift fails loudly instead of silently passing.
class FakeDB {
  constructor() {
    this.agentsByNumber = new Map();
    this.agentsByHash = new Map();
    this.rateLimits = new Map();
    this.calls = [];
    this.nextCallId = 1;
  }
  async addAgent({ number, name, status, key }) {
    const hash = await sha256hex(key);
    const row = { number, name, status };
    this.agentsByNumber.set(number, row);
    this.agentsByHash.set(hash, row);
    return row;
  }
  prepare(sql) {
    const db = this;
    return {
      bind(...args) {
        return {
          async first() {
            if (sql.includes('FROM telephone_agents WHERE key_hash')) {
              return db.agentsByHash.get(args[0]) || null;
            }
            if (sql.includes('FROM telephone_agents WHERE number')) {
              return db.agentsByNumber.get(args[0]) || null;
            }
            if (sql.includes('FROM rate_limits WHERE key')) {
              return db.rateLimits.get(args[0]) || null;
            }
            if (sql.includes('SELECT status FROM telephone_agents')) {
              const row = db.agentsByNumber.get(args[0]);
              return row ? { status: row.status } : null;
            }
            throw new Error(`FakeDB first(): unsupported SQL: ${sql}`);
          },
          async run() {
            if (sql.startsWith('INSERT INTO rate_limits')) {
              db.rateLimits.set(args[0], { window_start: args[1], count: 1 });
              return {};
            }
            if (sql.startsWith('UPDATE rate_limits')) {
              const row = db.rateLimits.get(args[0]);
              if (row) row.count += 1;
              return {};
            }
            if (sql.startsWith('INSERT INTO telephone_calls')) {
              const [from, to, subject, body, thread, reply, status, at] = args;
              const id = db.nextCallId++;
              db.calls.push({
                id, from_number: from, to_number: to, subject, body,
                thread_id: thread, in_reply_to: reply, status, created_at: at,
              });
              return { meta: { last_row_id: id } };
            }
            if (sql.startsWith('UPDATE telephone_calls')) {
              const row = db.calls.find((c) => c.id === args[1]);
              if (row) row.thread_id = args[0];
              return {};
            }
            throw new Error(`FakeDB run(): unsupported SQL: ${sql}`);
          },
        };
      },
    };
  }
}

const FAKE_KEY_A = 'st_test_fake_key_profit_001';
const FAKE_KEY_B = 'st_test_fake_key_builder_001';

async function seededDb() {
  const db = new FakeDB();
  await db.addAgent({ number: '222-0001', name: 'Profit', status: 'open', key: FAKE_KEY_A });
  await db.addAgent({ number: '222-0002', name: 'Builder', status: 'open', key: FAKE_KEY_B });
  await db.addAgent({ number: '222-0005', name: 'QuietOne', status: 'dnd', key: 'st_test_fake_key_dnd_001' });
  return db;
}

test('auth: good key resolves, bad/empty key rejects', async () => {
  const db = await seededDb();
  const me = await authenticateLine(db, FAKE_KEY_A);
  assert.equal(me.number, '222-0001');
  assert.equal(await authenticateLine(db, 'st_test_fake_key_wrong'), null);
  assert.equal(await authenticateLine(db, ''), null);
  assert.equal(await authenticateLine(db, null), null);
});

test('pairing: unordered pair key, self and bad numbers rejected', () => {
  assert.equal(pairKey('222-0001', '222-0002'), pairKey('222-0002', '222-0001'));
  assert.equal(pairKey('222-0001', '222-0002'), '222-0001|222-0002');
  assert.equal(pairKey('222-0001', '222-0001'), null);
  assert.equal(pairKey('222-0001', 'not-a-number'), null);
  assert.equal(pairKey('222-0001', ''), null);
});

test('peer resolution: unknown/self/bad/DND rejected, open peer resolves', async () => {
  const db = await seededDb();
  assert.equal((await resolvePeer(db, '222-9999', '222-0001')).status, 404);
  assert.equal((await resolvePeer(db, '222-0001', '222-0001')).status, 400);
  assert.equal((await resolvePeer(db, 'bogus', '222-0001')).status, 400);
  const dnd = await resolvePeer(db, '222-0005', '222-0001');
  assert.equal(dnd.status, 403);
  assert.equal(dnd.error, 'do_not_disturb');
  const ok = await resolvePeer(db, '222-0002', '222-0001');
  assert.equal(ok.peer.number, '222-0002');
});

test('message validation: empty and over-cap rejected, text trimmed', () => {
  assert.equal(validateMsgBody('').error, 'body required');
  assert.equal(validateMsgBody('   ').error, 'body required');
  assert.equal(validateMsgBody(42).error, 'body required');
  assert.equal(validateMsgBody('x'.repeat(MAX_BODY + 1)).error, 'body too long');
  assert.equal(validateMsgBody('  hi  ').body, 'hi');
  assert.equal(validateMsgBody('x'.repeat(MAX_BODY)).body.length, MAX_BODY);
});

test('governor: 300 line messages allowed, 301st refused, separate number unaffected', async () => {
  const db = await seededDb();
  for (let i = 0; i < LINE_CALLS_PER_HOUR; i++) {
    assert.equal(await lineRateLimit(db, '222-0001', LINE_CALLS_PER_HOUR, 3600_000), true);
  }
  assert.equal(await lineRateLimit(db, '222-0001', LINE_CALLS_PER_HOUR, 3600_000), false);
  assert.equal(await lineRateLimit(db, '222-0002', LINE_CALLS_PER_HOUR, 3600_000), true);
  // Governor key is telline:, never the async tel: bucket.
  assert.equal(db.rateLimits.has('telline:222-0001'), true);
  assert.equal(db.rateLimits.has('tel:222-0001'), false);
});

test('offline fallback: queued row is a real async call row, threaded on itself', async () => {
  const db = await seededDb();
  const q = await queueLineMessage(db, '222-0001', '222-0002', 'hello while you were out');
  assert.equal(db.calls.length, 1);
  const row = db.calls[0];
  assert.equal(row.id, q.id);
  assert.equal(row.thread_id, q.id);
  assert.equal(row.thread_id, row.id);
  assert.equal(row.from_number, '222-0001');
  assert.equal(row.to_number, '222-0002');
  assert.equal(row.body, 'hello while you were out');
  assert.equal(row.subject, 'Line message');
  assert.equal(row.status, 'delivered');
});

test('delivery decision: live→deliver, offline→queue, DND→blocked even if online', () => {
  assert.equal(decideDelivery({ peerOnline: true, peerStatus: 'open' }), 'deliver');
  assert.equal(decideDelivery({ peerOnline: false, peerStatus: 'open' }), 'queue');
  assert.equal(decideDelivery({ peerOnline: true, peerStatus: 'dnd' }), 'blocked_dnd');
  assert.equal(decideDelivery({ peerOnline: false, peerStatus: 'dnd' }), 'blocked_dnd');
});

test('dead-socket rule: 90s timeout, missing proof counts as dead', () => {
  const now = 1_000_000;
  assert.equal(isDeadSocket(now - 89_000, now), false);
  assert.equal(isDeadSocket(now - 91_000, now), true);
  assert.equal(isDeadSocket(0, now), true);
  assert.equal(isDeadSocket(null, now), true);
  assert.equal(isDeadSocket(now - 31_000, now, 30_000), true);
});

test('frames: msg/hello/presence shapes', () => {
  const m = msgFrame('222-0001', 'hi', 123);
  assert.deepEqual(m, { type: 'msg', from: '222-0001', body: 'hi', t: 123 });
  const h = helloFrame('222-0001|222-0002', '222-0001', '222-0002', false);
  assert.deepEqual(h, {
    type: 'hello', line: '222-0001|222-0002',
    you: '222-0001', peer: '222-0002', peerOnline: false,
  });
  assert.deepEqual(presenceFrame('222-0002', true), {
    type: 'presence', from: '222-0002', online: true,
  });
});

test('DO shell loads in plain Node (WebSocketPair only touched inside fetch)', () => {
  assert.equal(typeof TelephoneLine, 'function');
});

test('Worker wiring present: index.js routes /api/telephone/line to LINEROOM and exports the class', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(join(here, 'index.js'), 'utf8');
  assert.ok(src.includes("url.pathname === '/api/telephone/line'"));
  assert.ok(src.includes("env.LINEROOM.idFromName('lines')"));
  assert.ok(src.includes("export { FamilyRoom, FeedRoom, TelephoneLine }"));
  assert.ok(src.includes("from './telephone-line.mjs'"));
});

// LIMITATION (honest, not buried): the DO shell's live WebSocket behavior —
// accept, pair handshake, hibernation wake, alarm ping/reap, presence on
// close — cannot execute in plain Node: WebSocketPair and the hibernation
// context exist only in the Workers runtime. What this harness proves is
// every DECISION the shell makes (auth, pairing, validation, governor,
// fallback row, delivery fate, dead-socket rule, frame shapes) plus that
// the shell loads and the Worker route exists. The live handshake must be
// verified once after deploy with a real WS connect (see README: first
// live check). The shell code paths that touch sockets are deliberately
// thin and every send is try/catch-guarded, matching FamilyRoom.
