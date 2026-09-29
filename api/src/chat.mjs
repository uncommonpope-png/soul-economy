// FamilyRoom — the Family Chat as a Durable Object (WebSocket hibernation +
// SQLite storage). Free-tier: hibernation means we pay nothing while idle and
// there is no server to sleep. Protocol is byte-compatible with the old
// Render server (server.mjs): hello + history, {type:'msg'} in, msg/system out.

const MAX_NAME = 32;
const MAX_TEXT = 500;
const HISTORY_LIMIT = 50;
const MAX_CONNECTIONS = 500;

function clean(s, max) {
  if (typeof s !== 'string') return '';
  return s.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max);
}

export class FamilyRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  sql() {
    return this.ctx.storage.sql;
  }

  init() {
    this.sql().exec(
      'CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, text TEXT NOT NULL, t INTEGER NOT NULL)'
    );
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== '/ws') return new Response('not found', { status: 404 });
    if ((request.headers.get('Upgrade') || '').toLowerCase() !== 'websocket') {
      return new Response('WebSocket upgrade required', { status: 426 });
    }
    if (this.ctx.getWebSockets().length >= MAX_CONNECTIONS) {
      return new Response('House full. Try again shortly.', { status: 503 });
    }
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  broadcast(obj) {
    const payload = JSON.stringify(obj);
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(payload);
      } catch (e) {
        /* dead socket — hibernation will reap it */
      }
    }
  }

  async webSocketOpen(ws) {
    this.init();
    let history = [];
    try {
      const rows = this.sql()
        .exec('SELECT id, name, text, t FROM history ORDER BY id DESC LIMIT ?', HISTORY_LIMIT)
        .toArray()
        .reverse();
      history = rows.map((r) => ({ type: 'msg', id: r.id, name: r.name, text: r.text, t: r.t }));
    } catch (e) {
      history = [];
    }
    try {
      ws.send(JSON.stringify({ type: 'hello', id: 0, history }));
    } catch (e) {}
    this.broadcast({ type: 'system', text: 'A soul has entered the room.' });
  }

  async webSocketClose() {
    this.broadcast({ type: 'system', text: 'A soul has left the room.' });
  }

  async webSocketError() {
    /* mirrored from server.mjs — errors are silent */
  }

  async webSocketMessage(ws, raw) {
    let msg;
    try {
      msg = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw));
    } catch (e) {
      return;
    }
    if (!msg || msg.type !== 'msg') return;
    const name = clean(msg.name, MAX_NAME) || 'Soul';
    const text = clean(msg.text, MAX_TEXT);
    if (!text) return;
    this.init();
    const t = Date.now();
    this.sql().exec('INSERT INTO history (name, text, t) VALUES (?,?,?)', name, text, t);
    let id = 0;
    try {
      id = this.sql().exec('SELECT last_insert_rowid() AS id').one().id;
    } catch (e) {}
    this.broadcast({ type: 'msg', id, name, text, t });
  }
}
