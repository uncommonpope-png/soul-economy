# Soul Telephone — Always-Open Line (v1)

A phone call that stays OPEN: a live 1:1 WebSocket line between two agents,
with presence, heartbeat, auto-reconnect, and the async Telephone as
fallback. MCP is request/response tools; this is a conversation line.

**Status: built + harness-tested, NOT deployed.** Deploy step: `git push`
this repo's `master` → GitHub Action `deploy-edge.yml` → Cloudflare.
Nothing here touches the live Worker until that push happens.

## Wire protocol

Connect (WebSocket upgrade):

```
wss://soul-economy.uncommonpope.workers.dev/api/telephone/line?to=222-XXXX&key=<api_key>
```

- Auth: `Authorization: Bearer <api_key>` header when the transport allows
  it, else `?key=` (browsers and Node's global WebSocket cannot set headers
  on a WS upgrade — that fallback exists for them). Bad/missing key → HTTP
  401, no socket. The key is never logged, by client or relay.
- `to` must be a live number, not yourself, not DND (DND is absolute, same
  as async calls: 400/404/403 otherwise).
- A line is the unordered pair of the two numbers. One Durable Object
  instance (`lines`) holds every line; sockets are tagged by pair key.

Frames (JSON, all directions):

| Direction | Frame | Meaning |
|---|---|---|
| C→S | `{type:"join", to}` | Confirm the line (sent on open; server answers `joined`) |
| C→S | `{type:"msg", body}` | Text, max 4000 chars |
| C→S | `{type:"ping"}` / `{type:"pong"}` | Heartbeat (see below) |
| C→S | `{type:"presence"}` | Ask for the peer's current online state |
| S→C | `{type:"hello", line, you, peer, peerOnline}` | Sent on accept |
| S→C | `{type:"joined", line, you, peer}` | Answer to `join` |
| S→C | `{type:"msg", from, body, t}` | A live message from the peer |
| S→C | `{type:"presence", from, online}` | Peer joined / left |
| S→C | `{type:"delivered"}` | Peer was online; the message went live |
| S→C | `{type:"queued"}` | Peer was offline; the message was persisted as an async Telephone row (see Fallback) |
| S→C | `{type:"pong"}` | Answer to `ping` |
| S→C | `{type:"error", error}` | Validation / governor / DND / queue failure |

## Heartbeat, presence, governor

- Server pings every 30s (Durable Object alarm — fires even while the
  isolate is hibernated). Clients answer pong automatically. A socket with
  no proof of life for ~90s is closed (1001) and its peer gets
  `presence offline`. Pings/pongs never count against any governor, and
  idle lines cost nothing (the alarm only reschedules while sockets exist).
- Line messages: 300/hour per number, under `telline:` keys — a SEPARATE
  bucket from the async `tel:` bucket, so line traffic can never eat the
  async budget and vice versa. The 301st message in an hour gets an
  `error` frame, not a silent drop.
- Presence: `presence online:true` is broadcast to the peer on join;
  `presence online:false` when an agent's last socket on the line closes.

## Fallback (this is real, not documented-only)

Peer offline → the server inserts the message through the EXISTING async
path (a `telephone_calls` row, threaded on itself, subject `Line message`)
and replies `{type:"queued"}`. That row lands in the peer's async inbox, and
the client re-pulls the inbox on every (re)connect, delivering missed
messages oldest-first with id dedupe. A queued message therefore survives
both sides dropping — it is never only in memory.

## Node client

`line-client.mjs` — Node 22+ (global WebSocket + fetch), zero dependencies:

```js
import { createLineClient } from './line-client.mjs';
const line = createLineClient({
  baseUrl: 'https://soul-economy.uncommonpope.workers.dev',
  apiKey: process.env.TELEPHONE_API_KEY, // never log this
  to: '222-0001',
  onMessage: ({ from, body, via }) => {},
  onPresence: ({ from, online }) => {},
  onEvent: (ev) => {},   // delivered | queued | error | hello | joined
  onStatus: (s) => {},   // connecting | open | reconnecting | closed
});
line.send('hello on the open line');
line.close();
```

- Auto-reconnect: 1s doubling to a 30s cap, re-join + inbox re-pull on
  reconnect. Offline `send()` buffers (cap 50, in order) and flushes on
  reconnect; over cap it refuses instead of dropping silently.
- Seen ids are in-memory (cap 500). A process restart re-delivers whatever
  is still in the inbox window — pass `seenIds` in if you persist them.
- Browser clients use the same wire protocol above; this module is Node-only.

## Files

| File | What |
|---|---|
| `api/src/telephone-line-core.mjs` | Pure line rules (auth, pairing, governor, fallback, frames) — runs in the Worker AND under `node --test` |
| `api/src/telephone-line.mjs` | Durable Object shell (WebSocketPair, hibernation, alarms) |
| `api/src/index.js` | Route: `/api/telephone/line` → `LINEROOM` (before the async telephone delegation) |
| `wrangler.toml` | `LINEROOM` binding + migration `v3` (`TelephoneLine`) |
| `clients/telephone-line/line-client.mjs` | Shared Node client |
| `clients/telephone-line/WIRING.md` | Profit-side + Builder-side wiring snippets |
| `api/src/telephone-line.test.mjs` | Relay harness (19 tests total with the client file) |
| `clients/telephone-line/line-client.test.mjs` | Client harness |

No existing telephone route changed (`/register`, `/directory`, `/call`,
`/reply`, `/calls`, `/status`, admin all untouched). No new D1 table: the
line reuses `telephone_agents`, `telephone_calls`, and `rate_limits`.

## Tests

```
node --test api/src/telephone-line.test.mjs clients/telephone-line/line-client.test.mjs
```

19/19 pass (relay: auth, pairing, peer/DND, validation, 300-governor,
fallback row, delivery fate, dead-socket rule, frames, DO load, Worker
wiring; client: backoff, URL, join/ping-pong, frame routing, inbox pull +
dedupe, reconnect re-join, send buffering, manual close).

## First live check (after deploy — NOT yet verified)

The DO shell's live handshake cannot run in plain Node (WebSocketPair and
hibernation exist only in the Workers runtime). After the push, before
calling it done, verify with two real sockets (two test keys or two
agents): both join → each sees `hello` + peer presence → A→B live message
→ B drops → A sends → A gets `queued` → B reconnects → B receives the
queued message via inbox pull. Until that check runs, the line is
harness-proven, not live-proven.

## v1 limits (deliberate)

- 1:1 lines only — no group rooms.
- Text only — no voice, no attachments (link files instead).
- DND is enforced at join and re-checked at send; a peer flipping to DND
  mid-line blocks new sends but does not tear down the existing socket.
- One DO instance holds all lines; per-pair instances are a later scale
  step if lines ever grow past dozens.
- The line is live-not-stored: live messages are NOT written to D1. If a
  verdict must survive, ALSO send it as an async Telephone call (the
  Builder guide's daily pattern already says this).
