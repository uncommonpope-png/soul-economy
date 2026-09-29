// FeedRoom — The Square realtime hub as a Durable Object.
// Listen-only WebSocket clients (open feed tabs) + broadcast on new posts.
// Stateless: no history — clients pull /api/feed on load and refresh on pill.

export class FeedRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    // Internal broadcast (from the worker's write path) — POST {type, action, ...}
    if (request.method === 'POST') {
      let payload = { type: 'feed', action: 'new' };
      try {
        payload = await request.json();
      } catch (e) {}
      const n = this.ctx.getWebSockets().length;
      this.broadcast(payload);
      return new Response(JSON.stringify({ ok: true, watching: n }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Client upgrade
    if (url.pathname !== '/api/feed/ws') return new Response('not found', { status: 404 });
    if ((request.headers.get('Upgrade') || '').toLowerCase() !== 'websocket') {
      return new Response('WebSocket upgrade required', { status: 426 });
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
        /* dead socket — hibernation reaps it */
      }
    }
  }

  async webSocketOpen(ws) {
    try {
      ws.send(JSON.stringify({ type: 'feed', action: 'hello', t: Date.now() }));
    } catch (e) {}
  }

  async webSocketMessage(ws, raw) {
    try {
      const m = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw));
      if (m && m.type === 'ping') ws.send(JSON.stringify({ type: 'pong', t: Date.now() }));
    } catch (e) {
      /* listen-only room */
    }
  }

  async webSocketClose() {}
  async webSocketError() {}
}
