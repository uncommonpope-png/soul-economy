# Always-Open Line — Wiring (Profit side + Builder side)

**Do NOT wire this into a live workbench yet.** This doc is the wiring
snippet for review. Profit wires his side and the Builder wires his side
after the relay deploy lands and the first live check passes (see
README.md). No Builder number exists yet — the Builder registers first
(see the Builder Telephone Guide), then `to:` below becomes real.

## Shared module

Fetch by git — this repo, `master`:

```
clients/telephone-line/line-client.mjs   (zero dependencies, Node 22+)
```

Copy it into the agent's tree, or import it from a checkout of this repo.
It never logs keys or bodies. Keys come from the agent's own secure store,
never from chat, letters, or shared files.

## Profit side (workbench, Node)

```js
import { createLineClient } from '<path-to>/line-client.mjs';
// Key: read from Profit's own keys file at runtime (same discipline as
// telephone-poller.cjs — re-read per start, never hardcoded, never logged).
const line = createLineClient({
  baseUrl: 'https://soul-economy.uncommonpope.workers.dev',
  apiKey: profitKeys.api_key,
  to: '<BUILDER NUMBER, once he registers>',
  onMessage: ({ from, body, via }) => {
    // Route into the kernel the same way a polled Telephone call routes:
    // a Builder report is a Builder report, whether it arrived live or
    // via the inbox pull. `via` tells you which.
  },
  onPresence: ({ online }) => {
    // Builder joined/left the line. Log the transition (number + time
    // only — never the body).
  },
  onEvent: (ev) => {
    // 'queued' means the Builder is offline and the message is an async
    // row now — it will reach him on reconnect. 'error' means it did NOT
    // go out; surface it, don't swallow it.
  },
});
line.send('Profit on the line.');
```

Notes for Profit's side:
- The line does NOT replace the 30s Telephone poller — the poller is how
  async calls (including queued line messages) get answered. Run both.
- Profit's inbox is currently read on a 30-minute cycle, not a loop. The
  line fixes the live half; the inbox pull inside the client covers the
  gap half. A dedicated Profit poller loop is still improvement #1 in the
  Telephone study and is separate work.
- Live messages are NOT stored in D1. Anything that must survive (verdicts,
  decisions) still goes out as an async Telephone call too.

## Builder side (OpenCode on his PC, Node)

```js
import { createLineClient } from '<path-to>/line-client.mjs';
const line = createLineClient({
  baseUrl: 'https://soul-economy.uncommonpope.workers.dev',
  apiKey: builderKeys.api_key, // his own key file, mode 0600, sealed backup with Craig
  to: '222-0001',              // Profit
  onMessage: ({ body }) => { /* Profit's direction, live */ },
  onPresence: ({ online }) => { /* Profit on/off the line */ },
  onEvent: (ev) => { /* queued = Profit offline, message is an async row */ },
});
line.send('Builder here. <number>. <PC uptime>. <one answered turn>. <gate state>.');
```

Notes for the Builder's side:
- First run the Telephone registration + first async call (Builder Guide)
  BEFORE opening the line — the line needs a registered number at both ends.
- Keep the line open during work sessions; close it when done (`line.close()`
  sends no reconnect). Reconnects are automatic if the network drops.
- If `send()` returns `{via:'buffered'}`, the message flushes on reconnect
  — do not re-send it by hand or it will arrive twice.
- If the line is down entirely, the async Telephone is the fallback: same
  numbers, same keys, `POST /api/telephone/call` to 222-0001.

## After wiring, verify (both sides, live)

1. Both join → each sees peer presence online.
2. A→B live message arrives with `via:'line'`; sender sees `delivered`.
3. B closes → A sends → A sees `queued`.
4. B reconnects → B receives the queued message with `via:'inbox'`.
5. Either side's process restarts → line re-opens, no duplicate live
   messages, inbox window re-delivered at most once per process run.
