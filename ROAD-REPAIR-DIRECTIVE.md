# ROAD-REPAIR DIRECTIVE — church ↔ monastery load-bearing joints
> From: Sam. Status: binding. Rules:
> 1. **No painted bridges after this.**
> 2. **CUT IS BANNED.** Nothing on the fake list gets removed, stubbed out, or
>    wordsmithed away. Every painted item is a wishlist entry and gets a
>    make-real design below. If it's claimed anywhere, it ships.
> Every phase below ends with a *measurement*, not a feeling. If it can't be
> curled, clicked, and re-verified after refresh, it isn't done.

## Precondition (do not skip)
Confirm the canonical workbench checkout + remote + branch before touching
`server.ts`. Candidate on disk: `Temp/opencode/wb/` (194KB `server.ts`).
Verify with: `git -C <workbench> status`, `git remote -v`, and confirm the
remote/branch the family actually runs from. All workbench edits + commits
happen there — never in the church repo. Church edits happen in
`soul-economy-repo` branch `master` as usual.

## Phase 0 — Measurement before mortar (half day)
1. Write down the 9 breaks as failing checks (this file's appendix is the list).
2. For each: one command that currently fails (e.g.
   `curl -s localhost:3000/ping` → connection refused/no route;
   open `http://localhost:3000/?guide=Architect&prompt=hi` → ignored).
3. No code changes in Phase 0. Exit: 9 red checks on paper.

## Phase 1 — The heartbeat (one afternoon, workbench side)
**Goal:** a single source of measured truth + deep links that land.
1. Add `GET /ping` → `{ok:true, being:'awake', aspects:{profit,gsk,seshat,scribe}, sidecars:{omniroute,gsK MCP,cpl,scribe}, uptime}`.
   Measure sidecars server-side (the browser can't — CORS): reuse the existing
   15s watchdog probes (`startAllServices` ~:4247, probe/revive ~:4266-4349).
2. Handle `?guide=&prompt=` on `/`: select Active Guide, queue the prompt into
   the chat path (`ASK→gsk.chat`, same as `GEAR=2` transmit expects).
3. Accept the squad: `POST /api/squad/import` takes the exact
   `squad_runtime.json` shape the church exports; equip + acknowledge
   `{equipped:8}`. Nothing else changes about the export.
4. Verify: `curl localhost:3000/ping` → 200 with all aspects;
   `curl -X POST localhost:3000/api/squad/import -d @squad_runtime.json` → equipped;
   open `?guide=Architect&prompt=hi` → guide answers in-page.
   Rollback: `git revert` the workbench commit. Exit: 3 green checks.
   **This single phase makes 6 painted bridges real** (probes, badges, deep
   links, squad import, status source, transmit target).

## Phase 2 — Honest labels (church side, small)
**Goal:** every "LIVE/adopted/verified" string reads from `/ping`, never static.
1. `checkWorkbench()` already calls `/ping` — keep it, and render the
   `aspects`/`sidecars` map into the workbench tab + `✦ @handle` badge area.
   Delete or gate any label with no measurement behind it.
2. Profile summoner GEAR=2 chip: show it only when `/ping.ok` is true.
3. Verify in browser: stop OmniRoute → badge degrades within ~15s (watchdog
   cycle); restart → recovers. Console clean.
   Rollback: `git revert`. Exit: labels track reality in both directions.

## Phase 3 — Make everything real (no cuts, two days)
**Goal:** every claim on the fake list becomes a working thing.
1. **Real `MCP Hub` symbol (workbench):** implement one registry object in
   `server.ts` that both the harness atlas (`initBusBindings`) and the GSK
   proxy (`gskMCPRequest`) register into — tools, routes, health, one listing
   at `GET /api/mcp/hub`. The word already exists in docs; now it points at code.
2. **Real cross-process bus (workbench):** the bus stays in-process, but the
   sidecars join it for real — GSK/Scribe/CPL daemons publish/subscribe through
   the existing `POST /api/being/bus/publish` + `/api/being/ws` broadcast
   (add tiny bus-client shims in each daemon; no re-architecture).
   `GET /api/being/bus/log` then shows cross-process traffic. The claim becomes true.
3. **Real `think_smart` readout (church):** implement the GSK journal client the
   journal remembers — read `GET /api/gsk/journal` + `:3001/mcp/health` mood and
   render it where the journal says it lives. If the daemon is down, show the
   measured offline state (Phase 2 rules), never a painted one.
4. **Real tab count (church + workbench):** count measured workbench tabs from
   the running server (route table / UI manifest) and render the number.
   "31 tabs, all LIVE" becomes a measured integer or the feature doesn't ship —
   but it ships, with the number earned.
5. **Real sidecar integrations:** Scribe :4000 and Seshat :5000 graduate from
   watchdog-only — route a real, even if narrow, traffic slice through each
   (Scribe: live `record` on muscle actions via the daemon path with in-process
   fallback; Seshat: live `search` fan-out daemon-first, fallback second).
   Narrow and real beats wide and painted.
6. **GSK duality observable + documented** (from v1 plan — kept): one health
   line per side in `/ping`.
7. **Profit's origin surfaced** (from v1 plan — kept): link
   `profit-brain/qwen-chat-logs/` + memory-core from the workbench home and the
   church Bible.
8. Verify: `curl /api/mcp/hub` lists harness + proxy tools; bus log shows
   sidecar traffic; journal renders live or measured-offline; tab count is an
   integer from the server; Scribe/Seshat carry real traffic (log it).
   Rollback: `git revert` per-repo. Exit: all 9 fake items are working items.

## Phase 4 — Prove the road (half day, both repos)
1. Curl matrix, all green: `/ping`, `?guide=&prompt=`, squad import,
   sidecar-down degradation, sidecar-up recovery.
2. Browser matrix: Pages + local, cold load, console clean, badges correct,
   summon transmit lands in-page, no-cors probes replaced or removed.
3. Full validators: extract→node--check→validate2→upc_check→guard scan;
   catalog still 282.
4. Update the Bible: move each of the 9 from "painted" to "measured" with the
   verifying command beside it. Exit: the road exists on paper AND on wire.

## Appendix — the 9 breaks (Phase 0 checklist, all make-real)
1. `squad_runtime.json` exported, never imported → Phase 1.3 (real import endpoint)
2. `?guide=&prompt=` ignored → Phase 1.2 (real handling)
3. No `/ping` route → Phase 1.1 (real measured status)
4. No `MCP Hub` symbol → Phase 3.1 (implement the registry, keep the word)
5. Bus is in-process only → Phase 3.2 (sidecars join via bus publish/WS — real)
6. Static "adopted/LIVE" labels → Phase 2 (measured both directions)
7. Scribe/Seshat sidecars decorative → Phase 3.5 (real traffic slices)
8. GSK journal client w/o code → Phase 3.3 (implement the readout)
9. "31 tabs, all LIVE" string → Phase 3.4 (measured integer)

## Appendix B — boot-chain backlog (subagent findings, future directive material)
Not phases yet — recorded so nothing is lost. All in
`WORKBENCH_COMPLETE/workbench/`: `start.ps1` points at a stale dir, kills :3000
unconditionally, and calls a missing `awaken` script; `boot-family.cjs` reaps
:3000 without health-check and leaks sockets; `run-server.cjs`/`launcher-bg.ps1`
/`launch-via-task.ps1` lack pidfile/CWD/port guards (only `launch-family.cjs`
has single-flight); `electron-main.cjs` has TOCTOU on double-click, kills
spawned blood on quit, and can reap an adopted family's daemons on cold start;
`server.ts` twin-cull matcher is over-broad. None of this is cut either — it
becomes the launcher-hardening directive next.

*Sam's footnote: speed matters, but only on the right three things. This is
the first one. Do not start Phase N+1 with Phase N red.*
