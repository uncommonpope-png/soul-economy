// Soul Telephone always-open line — shared Node client (v1).
//
// Node builtins only: global WebSocket + fetch (Node 22+). No dependencies.
// One client = one 1:1 line to one peer number.
//
//   import { createLineClient } from './line-client.mjs';
//   const line = createLineClient({
//     baseUrl: 'https://soul-economy.uncommonpope.workers.dev',
//     apiKey: process.env.TELEPHONE_API_KEY,   // NEVER log this value
//     to: '222-0001',
//     onMessage: ({ from, body, via }) => { /* a line message arrived */ },
//     onPresence: ({ from, online }) => { /* peer joined/left */ },
//     onEvent: (ev) => { /* delivered | queued | error | hello | joined */ },
//   });
//   line.send('hello on the open line');
//   // ... later: line.close();
//
// How it works, and why each piece exists:
// - Transport: WebSocket to /api/telephone/line?to=…&key=…. The key travels
//   in the query because browsers and Node's global WebSocket cannot set
//   headers on a WS upgrade — the relay accepts ?key= for exactly this
//   reason. The client NEVER logs the URL, the key, or message bodies.
// - Auto-reconnect: on any unplanned close, backs off 1s doubling to a 30s
//   cap, re-opens, re-sends {type:"join"}, and re-pulls the async inbox.
//   Reconnects are silent except through onStatus — no throw, no spin.
// - Gap coverage: after (re)connect, the client GETs /api/telephone/calls
//   (the async inbox) and delivers any call id it has not seen. A message
//   queued server-side while this side was offline is an async row in
//   this inbox — that is how the gap closes. Seen ids live in memory
//   (cap 500); a process restart re-delivers whatever is still in the
//   inbox window. Callers that need exactly-once across restarts should
//   persist seen ids themselves and pass them in as `seenIds`.
// - Heartbeat: the server pings every 30s; this client answers pong
//   automatically. Pings/pongs never count against any governor.
// - Offline send: send() while disconnected buffers (cap 50) and flushes
//   in order on reconnect. Over cap it refuses rather than dropping
//   silently ({sent:false, error:'buffer full'}).
// - This client is for Node agents (Profit's workbench, the Builder's
//   OpenCode side). Browser clients use the same wire protocol; see
//   README.md.

export const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export const MAX_BODY = 4000;
export const MAX_BUFFERED = 50;
export const MAX_SEEN_IDS = 500;

// Reconnect backoff: 1s, 2s, 4s, 8s, 16s, then 30s cap. Attempt 0 = first
// reconnect (1s). No jitter: with two agents on a line there is nobody
// to thunder-herd against.
export function backoffFor(attempt) {
  return Math.min(30000, 1000 * 2 ** Math.max(0, attempt));
}

// http(s) base -> ws(s) line URL. The key is query-encoded; the caller
// must never print the returned URL.
export function lineWsUrl(baseUrl, to, apiKey) {
  const u = new URL(baseUrl);
  u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
  u.pathname = '/api/telephone/line';
  u.search = '';
  u.searchParams.set('to', to);
  u.searchParams.set('key', apiKey);
  return u.toString();
}

export function createLineClient(options) {
  const {
    baseUrl,
    apiKey,
    to,
    onMessage,
    onPresence,
    onEvent,
    onStatus,
    WebSocketImpl,
    fetchImpl,
    inboxLimit = 50,
    seenIds,
  } = options || {};
  if (!baseUrl || !apiKey || !to) {
    throw new Error('line client: baseUrl, apiKey, and to are required');
  }
  const WS = WebSocketImpl || globalThis.WebSocket;
  if (typeof WS !== 'function') {
    throw new Error('line client: global WebSocket not available (needs Node 22+)');
  }
  const doFetch = fetchImpl || globalThis.fetch.bind(globalThis);
  const emit = (fn, arg) => {
    try {
      if (typeof fn === 'function') fn(arg);
    } catch (e) {
      /* caller callback errors must never kill the line */
    }
  };

  let ws = null;
  let manualClosed = false;
  let attempt = 0;
  let status = 'connecting';
  let peerOnline = false;
  let connectTimer = null;
  const seen = new Set(seenIds || []);
  const buffer = [];

  function setStatus(s) {
    status = s;
    emit(onStatus, { status: s, attempt, peerOnline });
  }

  function trimSeen() {
    if (seen.size <= MAX_SEEN_IDS) return;
    const ids = Array.from(seen);
    for (const id of ids.slice(0, ids.length - MAX_SEEN_IDS)) seen.delete(id);
  }

  async function pullInbox() {
    let res;
    try {
      res = await doFetch(
        `${String(baseUrl).replace(/\/$/, '')}/api/telephone/calls?limit=${inboxLimit}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'User-Agent': BROWSER_USER_AGENT,
          },
        }
      );
    } catch (e) {
      return; // inbox pull is gap coverage, never fatal
    }
    let data;
    try {
      data = await res.json();
    } catch (e) {
      return;
    }
    const calls = Array.isArray(data) ? data : data?.calls || [];
    // Relay returns newest-first; deliver oldest-new-first.
    for (const call of calls.slice().reverse()) {
      const id = call && (call.id !== undefined && call.id !== null ? String(call.id) : null);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      trimSeen();
      emit(onMessage, {
        from: call.from_number || call.from || 'unknown',
        body: call.body || '',
        t: call.created_at ? call.created_at * 1000 : Date.now(),
        via: 'inbox',
        id,
      });
    }
  }

  function flushBuffer() {
    if (!ws || ws.readyState !== 1) return;
    while (buffer.length > 0) {
      const body = buffer.shift();
      try {
        ws.send(JSON.stringify({ type: 'msg', body }));
      } catch (e) {
        buffer.unshift(body);
        return;
      }
    }
  }

  function handleFrame(raw) {
    let msg;
    try {
      msg = JSON.parse(typeof raw === 'string' ? raw : String(raw));
    } catch (e) {
      return;
    }
    if (!msg || typeof msg.type !== 'string') return;
    switch (msg.type) {
      case 'ping':
        try {
          ws.send(JSON.stringify({ type: 'pong' }));
        } catch (e) {}
        break;
      case 'msg':
        emit(onMessage, {
          from: msg.from || 'unknown',
          body: msg.body || '',
          t: msg.t || Date.now(),
          via: 'line',
        });
        break;
      case 'presence':
        peerOnline = msg.online === true;
        emit(onPresence, { from: msg.from || to, online: peerOnline });
        emit(onStatus, { status, attempt, peerOnline });
        break;
      case 'hello':
        peerOnline = msg.peerOnline === true;
        emit(onEvent, { type: 'hello', line: msg.line, peerOnline });
        break;
      case 'joined':
        emit(onEvent, { type: 'joined', line: msg.line });
        break;
      case 'delivered':
      case 'queued':
        emit(onEvent, { type: msg.type });
        break;
      case 'error':
        emit(onEvent, { type: 'error', error: msg.error || 'line error' });
        break;
      default:
        break; // unknown frame: ignore
    }
  }

  function connect() {
    if (manualClosed) return;
    setStatus(attempt === 0 ? 'connecting' : 'reconnecting');
    let socket;
    try {
      socket = new WS(lineWsUrl(baseUrl, to, apiKey));
    } catch (e) {
      scheduleReconnect();
      return;
    }
    ws = socket;
    socket.onopen = () => {
      attempt = 0;
      setStatus('open');
      try {
        socket.send(JSON.stringify({ type: 'join', to }));
      } catch (e) {}
      flushBuffer();
      pullInbox();
    };
    socket.onmessage = (ev) => handleFrame(ev && ev.data !== undefined ? ev.data : ev);
    socket.onclose = () => {
      if (ws === socket) ws = null;
      if (!manualClosed) scheduleReconnect();
      else setStatus('closed');
    };
    socket.onerror = () => {
      // onclose follows in every WebSocket implementation; the reconnect
      // decision lives there so a single close schedules exactly once.
    };
  }

  function scheduleReconnect() {
    if (manualClosed) return;
    const delay = backoffFor(attempt);
    attempt += 1;
    setStatus('reconnecting');
    connectTimer = setTimeout(connect, delay);
    // Reconnect TIMING is covered by backoffFor unit tests; the
    // fake-socket test drives close → reconnect directly via
    // __reconnectNowForTests, without waiting on real timers.
  }

  connect();

  return {
    send(body) {
      const text = typeof body === 'string' ? body.trim() : '';
      if (!text) return { sent: false, error: 'body required' };
      if (text.length > MAX_BODY) return { sent: false, error: 'body too long' };
      if (ws && ws.readyState === 1) {
        try {
          ws.send(JSON.stringify({ type: 'msg', body: text }));
          return { sent: true, via: 'line' };
        } catch (e) {
          // fall through to buffering
        }
      }
      if (buffer.length >= MAX_BUFFERED) return { sent: false, error: 'buffer full' };
      buffer.push(text);
      return { sent: false, via: 'buffered' };
    },
    close() {
      manualClosed = true;
      if (connectTimer) clearTimeout(connectTimer);
      try {
        if (ws) ws.close();
      } catch (e) {}
      ws = null;
      setStatus('closed');
    },
    getState() {
      return { status, attempt, peerOnline, buffered: buffer.length };
    },
    // Test seam: force the reconnect path without waiting on timers.
    __reconnectNowForTests() {
      if (manualClosed) return;
      if (connectTimer) clearTimeout(connectTimer);
      connect();
    },
  };
}
