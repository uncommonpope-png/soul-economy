// Soul Telephone always-open line — client harness (plain Node).
// Fake WebSocket + fake fetch; no network, no real keys.
//
// Run: node --test clients/telephone-line/line-client.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  backoffFor,
  lineWsUrl,
  createLineClient,
} from './line-client.mjs';

// ─── Fake WebSocket ─────────────────────────────────────────────────────────
// Mirrors the surface the client uses: url, readyState, onopen/onmessage/
// onclose/onerror, send, close. readyState: 0 connecting, 1 open, 3 closed.
class FakeWS {
  static instances = [];
  static reset() {
    FakeWS.instances = [];
  }
  constructor(url) {
    this.url = url;
    this.readyState = 0;
    this.sent = [];
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
    FakeWS.instances.push(this);
  }
  send(data) {
    this.sent.push(data);
  }
  close() {
    this.simulateClose();
  }
  simulateOpen() {
    this.readyState = 1;
    if (this.onopen) this.onopen();
  }
  simulateMessage(obj) {
    if (this.onmessage) this.onmessage({ data: JSON.stringify(obj) });
  }
  simulateClose() {
    this.readyState = 3;
    if (this.onclose) this.onclose();
  }
  sentJson() {
    return this.sent.map((s) => JSON.parse(s));
  }
}

const tick = () => new Promise((r) => setImmediate(r));

function fakeFetch(calls) {
  const seen = { count: 0, headers: null, url: null };
  const fn = async (url, opts) => {
    seen.count += 1;
    seen.url = url;
    seen.headers = (opts && opts.headers) || {};
    return { json: async () => ({ calls }) };
  };
  fn.seen = seen;
  return fn;
}

test('backoff: 1s doubling to a 30s cap', () => {
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5, 6, 10].map(backoffFor),
    [1000, 2000, 4000, 8000, 16000, 30000, 30000, 30000]
  );
});

test('line URL: https→wss, path + to + key params, key never in the path', () => {
  const u = new URL(lineWsUrl('https://example.workers.dev', '222-0001', 'st_test_fake_001'));
  assert.equal(u.protocol, 'wss:');
  assert.equal(u.pathname, '/api/telephone/line');
  assert.equal(u.searchParams.get('to'), '222-0001');
  assert.equal(u.searchParams.get('key'), 'st_test_fake_001');
  const http = new URL(lineWsUrl('http://localhost:8787/', '222-0002', 'k'));
  assert.equal(http.protocol, 'ws:');
});

test('join + ping/pong: join sent on open, server ping answered with pong', () => {
  FakeWS.reset();
  const line = createLineClient({
    baseUrl: 'https://example.workers.dev',
    apiKey: 'st_test_fake_001',
    to: '222-0001',
    WebSocketImpl: FakeWS,
    fetchImpl: fakeFetch([]),
  });
  const ws = FakeWS.instances[0];
  assert.ok(ws.url.includes('/api/telephone/line'));
  ws.simulateOpen();
  assert.deepEqual(ws.sentJson()[0], { type: 'join', to: '222-0001' });
  ws.simulateMessage({ type: 'ping' });
  assert.deepEqual(ws.sentJson()[1], { type: 'pong' });
  line.close();
});

test('frames routed: msg→onMessage (via line), presence→onPresence, error/queued/delivered→onEvent', () => {
  FakeWS.reset();
  const msgs = [];
  const pres = [];
  const evs = [];
  const line = createLineClient({
    baseUrl: 'https://example.workers.dev',
    apiKey: 'st_test_fake_001',
    to: '222-0001',
    onMessage: (m) => msgs.push(m),
    onPresence: (p) => pres.push(p),
    onEvent: (e) => evs.push(e),
    WebSocketImpl: FakeWS,
    fetchImpl: fakeFetch([]),
  });
  const ws = FakeWS.instances[0];
  ws.simulateOpen();
  ws.simulateMessage({ type: 'msg', from: '222-0001', body: 'hello', t: 5 });
  ws.simulateMessage({ type: 'presence', from: '222-0001', online: true });
  ws.simulateMessage({ type: 'queued' });
  ws.simulateMessage({ type: 'delivered' });
  ws.simulateMessage({ type: 'error', error: 'body too long' });
  ws.simulateMessage({ type: 'bogus' }); // ignored, no crash
  assert.equal(msgs.length, 1);
  assert.equal(msgs[0].body, 'hello');
  assert.equal(msgs[0].via, 'line');
  assert.equal(pres.length, 1);
  assert.equal(pres[0].online, true);
  assert.equal(line.getState().peerOnline, true);
  assert.deepEqual(
    evs.map((e) => e.type),
    ['queued', 'delivered', 'error']
  );
  line.close();
});

test('inbox pull on open: Bearer + UA sent, calls delivered oldest-first, ids deduped', async () => {
  FakeWS.reset();
  const fetch = fakeFetch([
    { id: 12, from_number: '222-0001', body: 'newer', created_at: 200 },
    { id: 11, from_number: '222-0001', body: 'older', created_at: 100 },
  ]);
  const msgs = [];
  const line = createLineClient({
    baseUrl: 'https://example.workers.dev',
    apiKey: 'st_test_fake_001',
    to: '222-0001',
    onMessage: (m) => msgs.push(m),
    WebSocketImpl: FakeWS,
    fetchImpl: fetch,
  });
  const ws = FakeWS.instances[0];
  ws.simulateOpen();
  await tick();
  await tick();
  assert.equal(fetch.seen.count, 1);
  assert.ok(fetch.seen.url.includes('/api/telephone/calls?limit=50'));
  assert.equal(fetch.seen.headers.Authorization, 'Bearer st_test_fake_001');
  assert.ok(String(fetch.seen.headers['User-Agent']).includes('Chrome/'));
  assert.deepEqual(
    msgs.filter((m) => m.via === 'inbox').map((m) => m.body),
    ['older', 'newer']
  );
  line.close();
});

test('reconnect: close → new socket → re-join → inbox re-pulled without re-delivering seen ids', async () => {
  FakeWS.reset();
  const fetch = fakeFetch([
    { id: 11, from_number: '222-0001', body: 'missed', created_at: 100 },
  ]);
  const msgs = [];
  const line = createLineClient({
    baseUrl: 'https://example.workers.dev',
    apiKey: 'st_test_fake_001',
    to: '222-0001',
    onMessage: (m) => msgs.push(m),
    WebSocketImpl: FakeWS,
    fetchImpl: fetch,
  });
  const ws1 = FakeWS.instances[0];
  ws1.simulateOpen();
  await tick();
  assert.equal(msgs.filter((m) => m.via === 'inbox').length, 1);
  ws1.simulateClose(); // schedules a real 1s timer; drive reconnect now
  line.__reconnectNowForTests();
  assert.equal(FakeWS.instances.length, 2);
  const ws2 = FakeWS.instances[1];
  ws2.simulateOpen();
  await tick();
  assert.deepEqual(ws2.sentJson()[0], { type: 'join', to: '222-0001' });
  assert.equal(fetch.seen.count, 2);
  // Same inbox id on the second pull is NOT re-delivered.
  assert.equal(msgs.filter((m) => m.via === 'inbox').length, 1);
  line.close();
});

test('send buffering: offline sends buffer in order and flush on open; over-cap refuses', () => {
  FakeWS.reset();
  const line = createLineClient({
    baseUrl: 'https://example.workers.dev',
    apiKey: 'st_test_fake_001',
    to: '222-0001',
    WebSocketImpl: FakeWS,
    fetchImpl: fakeFetch([]),
  });
  const ws = FakeWS.instances[0];
  assert.deepEqual(line.send('first'), { sent: false, via: 'buffered' });
  assert.deepEqual(line.send('second'), { sent: false, via: 'buffered' });
  ws.simulateOpen();
  const bodies = ws.sentJson().filter((f) => f.type === 'msg').map((f) => f.body);
  assert.deepEqual(bodies, ['first', 'second']);
  assert.deepEqual(line.send('live'), { sent: true, via: 'line' });
  assert.deepEqual(line.send(''), { sent: false, error: 'body required' });
  assert.deepEqual(line.send('x'.repeat(4001)), { sent: false, error: 'body too long' });
  line.close();
});

test('close(): manual close reports closed and never reconnects', () => {
  FakeWS.reset();
  const line = createLineClient({
    baseUrl: 'https://example.workers.dev',
    apiKey: 'st_test_fake_001',
    to: '222-0001',
    WebSocketImpl: FakeWS,
    fetchImpl: fakeFetch([]),
  });
  const ws = FakeWS.instances[0];
  ws.simulateOpen();
  line.close();
  assert.equal(line.getState().status, 'closed');
  line.__reconnectNowForTests();
  assert.equal(FakeWS.instances.length, 1);
});
