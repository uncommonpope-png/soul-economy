// TelephoneLine — the Soul Telephone always-open line as a Durable Object
// (WebSocket hibernation + SQLite-free in-memory socket tracking).
//
// v1: 1:1 text lines only. No group rooms, no voice, no MCP tooling.
//
// Routing (see index.js): GET /api/telephone/line?to=222-XXXX with a
// WebSocket upgrade. One DO instance ('lines') holds every line — the same
// shape as FamilyRoom ('family') and FeedRoom ('square'). Sockets are
// tagged by pair key and carry {number, peer, line, lastProof} as a
// hibernation attachment, so presence and liveness survive hibernation.
//
// Auth happens HERE, from the original upgrade request: `Authorization:
// Bearer <api_key>`, or `?key=` as a fallback (browsers and Node's global
// WebSocket cannot set headers on a WS upgrade — that fallback is why it
// exists). Rejection is a plain HTTP response (401/400/404/403), never a
// socket close, and never with a key or body in it. The Worker never sees
// a key it did not already route, and the DO never forwards one anywhere.
//
// Offline-peer fallback is real, not documented-only: a message to an
// offline peer is persisted through queueLineMessage() — the EXISTING
// async telephone_calls row — so it lands in the peer's async inbox and
// the client's reconnect inbox-pull picks it up. The sender gets
// {type:"queued"}; it never silently vanishes.
//
// Heartbeats: the server pings every 30s (DO alarm); clients answer pong.
// A socket with no proof of life for ~90s is closed (1001) and its peer
// gets a presence-offline frame. Pings/pongs never touch any governor;
// line messages have their own 300/hour cap under `telline:` keys, never
// the async `tel:` bucket.
//
// Hibernation lesson, copied from FamilyRoom: there is no webSocketOpen
// callback under the Hibernation API — join-time work (hello + presence)
// happens in fetch(), immediately after acceptWebSocket.

import {
  NUMBER_RE,
  pairKey,
  validateMsgBody,
  authenticateLine,
  resolvePeer,
  lineRateLimit,
  queueLineMessage,
  decideDelivery,
  isDeadSocket,
  msgFrame,
  presenceFrame,
  helloFrame,
  joinedFrame,
  LINE_CALLS_PER_HOUR,
  HEARTBEAT_INTERVAL_MS,
  HEARTBEAT_TIMEOUT_MS,
} from './telephone-line-core.mjs';

const CLOSE_HEARTBEAT_TIMEOUT = 1001;

function sendJson(ws, obj) {
  try {
    ws.send(JSON.stringify(obj));
  } catch (e) {
    /* dead socket — the alarm reaps it */
  }
}

function attachmentOf(ws) {
  try {
    return ws.deserializeAttachment() || null;
  } catch (e) {
    return null;
  }
}

function setAttachment(ws, att) {
  try {
    ws.serializeAttachment(att);
  } catch (e) {
    /* attachment unsupported — handlers fall back to tag-only routing */
  }
}

export class TelephoneLine {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  // All sockets on one line (tag = pair key).
  lineSockets(line) {
    try {
      return this.ctx.getWebSockets(line) || [];
    } catch (e) {
      return [];
    }
  }

  // The peer's live sockets on this line, if any.
  peerSockets(line, peerNumber) {
    return this.lineSockets(line).filter((ws) => {
      const att = attachmentOf(ws);
      return att && att.number === peerNumber;
    });
  }

  peerOnline(line, peerNumber) {
    return this.peerSockets(line, peerNumber).length > 0;
  }

  async fetch(request) {
    if ((request.headers.get('Upgrade') || '').toLowerCase() !== 'websocket') {
      return new Response('WebSocket upgrade required', { status: 426 });
    }
    const url = new URL(request.url);

    // Auth: header first, ?key= fallback for browser/Node WS clients.
    let key = null;
    const auth = request.headers.get('Authorization') || '';
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (m) key = m[1].trim();
    else key = url.searchParams.get('key');
    const me = await authenticateLine(this.env.DB, key);
    if (!me) return new Response('unauthorized', { status: 401 });

    const peerNumber = url.searchParams.get('to') || '';
    const chk = await resolvePeer(this.env.DB, peerNumber, me.number);
    if (chk.error) return new Response(chk.error, { status: chk.status });

    const line = pairKey(me.number, peerNumber);
    if (!line) return new Response('bad line', { status: 400 });

    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1], [line]);
    const att = {
      number: me.number,
      peer: peerNumber,
      line,
      lastProof: Date.now(),
    };
    setAttachment(pair[1], att);

    // Join-time work lives HERE (no webSocketOpen under hibernation).
    const online = this.peerOnline(line, peerNumber);
    sendJson(pair[1], helloFrame(line, me.number, peerNumber, online));
    for (const ws of this.peerSockets(line, peerNumber)) {
      sendJson(ws, presenceFrame(me.number, true));
    }
    try {
      await this.ctx.storage.setAlarm(Date.now() + HEARTBEAT_INTERVAL_MS);
    } catch (e) {
      /* alarms unavailable — heartbeats degrade to client-side reconnects */
    }
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  // Shared close/error path: if this was the agent's last socket on the
  // line, tell the peer they went offline.
  handleClose(ws) {
    const att = attachmentOf(ws);
    if (!att || !att.line || !att.number) return;
    const remaining = this.lineSockets(att.line).filter((s) => {
      const a = attachmentOf(s);
      return a && a.number === att.number;
    });
    if (remaining.length === 0) {
      for (const peer of this.peerSockets(att.line, att.peer)) {
        sendJson(peer, presenceFrame(att.number, false));
      }
    }
  }

  async webSocketClose(ws) {
    this.handleClose(ws);
  }

  async webSocketError(ws) {
    this.handleClose(ws);
  }

  async webSocketMessage(ws, raw) {
    const att = attachmentOf(ws);
    if (!att || !att.number || !att.peer || !att.line) return;
    let msg;
    try {
      msg = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw));
    } catch (e) {
      return; // malformed frame: ignore, never crash the line
    }
    if (!msg || typeof msg.type !== 'string') return;

    // Any parsed frame is proof of life.
    att.lastProof = Date.now();
    setAttachment(ws, att);

    if (msg.type === 'ping') {
      sendJson(ws, { type: 'pong' });
      return;
    }
    if (msg.type === 'pong') return; // liveness already recorded above
    if (msg.type === 'join') {
      if (msg.to === att.peer) sendJson(ws, joinedFrame(att.line, att.number, att.peer));
      else sendJson(ws, { type: 'error', error: 'wrong line' });
      return;
    }
    if (msg.type === 'presence') {
      sendJson(ws, presenceFrame(att.peer, this.peerOnline(att.line, att.peer)));
      return;
    }
    if (msg.type !== 'msg') return; // unknown type: ignore

    const v = validateMsgBody(msg.body);
    if (v.error) {
      sendJson(ws, { type: 'error', error: v.error });
      return;
    }
    if (
      !(await lineRateLimit(
        this.env.DB,
        att.number,
        LINE_CALLS_PER_HOUR,
        3600_000
      ))
    ) {
      sendJson(ws, {
        type: 'error',
        error: `rate limit (${LINE_CALLS_PER_HOUR} line messages/hour)`,
      });
      return;
    }

    // DND is re-checked at send time: a peer can flip mid-line.
    let peerStatus = 'open';
    try {
      const row = await this.env.DB.prepare(
        'SELECT status FROM telephone_agents WHERE number = ?'
      )
        .bind(att.peer)
        .first();
      if (row) peerStatus = row.status;
    } catch (e) {
      /* status unreadable — deliver live, queue offline, as before */
    }
    const fate = decideDelivery({
      peerOnline: this.peerOnline(att.line, att.peer),
      peerStatus,
    });
    if (fate === 'blocked_dnd') {
      sendJson(ws, { type: 'error', error: 'do_not_disturb' });
      return;
    }
    if (fate === 'deliver') {
      const frame = msgFrame(att.number, v.body);
      for (const peer of this.peerSockets(att.line, att.peer)) {
        sendJson(peer, frame);
      }
      sendJson(ws, { type: 'delivered' });
      return;
    }
    // Peer offline: persist through the EXISTING async row, reply queued.
    try {
      await queueLineMessage(this.env.DB, att.number, att.peer, v.body);
      sendJson(ws, { type: 'queued' });
    } catch (e) {
      sendJson(ws, { type: 'error', error: 'queue failed' });
    }
  }

  // Heartbeat sweep: ping the living, close the dead. Runs on the DO
  // alarm, which fires even while the isolate is hibernated. Reschedules
  // itself only while sockets remain — idle lines cost nothing.
  async alarm() {
    const now = Date.now();
    let sockets = [];
    try {
      sockets = this.ctx.getWebSockets() || [];
    } catch (e) {
      sockets = [];
    }
    for (const ws of sockets) {
      const att = attachmentOf(ws);
      const lastProof = att ? att.lastProof : 0;
      if (isDeadSocket(lastProof, now, HEARTBEAT_TIMEOUT_MS)) {
        try {
          ws.close(CLOSE_HEARTBEAT_TIMEOUT, 'heartbeat timeout');
        } catch (e) {
          /* already gone */
        }
      } else {
        sendJson(ws, { type: 'ping' });
      }
    }
    if (sockets.length > 0) {
      try {
        await this.ctx.storage.setAlarm(now + HEARTBEAT_INTERVAL_MS);
      } catch (e) {
        /* alarms unavailable */
      }
    }
  }
}

// Re-exported for the Worker route + tests: NUMBER_RE is used by index.js
// only indirectly (resolvePeer validates), but keep the surface explicit.
export { NUMBER_RE };
