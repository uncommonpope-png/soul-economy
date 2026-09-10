# SOCIAL BACKEND PLAN — shared truth layer for the Soul Economy

> Design-only deliverable (no code changed). Goal: make follows, feed, posts,
> DMs, and notifications real across browsers while the site stays static,
> free, local-first, and visually untouched.
> Rule carried over: ADD. EXTEND. CONNECT. EVOLVE. Local storage remains the
> offline source of truth; the backend is a sync peer, never a requirement.

## 0. Constraints (non-negotiable)

- **$0 forever:** Cloudflare Workers Free (100k req/day) + D1 Free (5M row reads,
  100k writes/day) + zero KV dependence (KV free writes are 1k/day — too tight).
  No Durable Objects (no free tier), no realtime sockets.
- **Static frontend:** GitHub Pages stays as-is. One new file set under
  `workers/social-api/` (same single-file style as `workers/catalog-api.js`).
- **Local-first preserved:** every feature works offline exactly as today. Sync
  is opportunistic; conflicts resolve last-write-wins by timestamp, deletes use
  tombstones. A kill flag (`USE_SOCIAL_API`, default off) reverts to pure local.
- **Privacy enforced server-side:** visibility (public/followers/private),
  blocks, and mutes are checked on every read, not just hidden in UI.

## 1. Architecture

```
GitHub Pages (static, unchanged UI)
   │  fetch, same patterns as catalog-api.js
   ▼
workers/social-api (ONE Worker: index.js router + auth.js + schema.sql)
   ├─ D1 database `soul_social` (all state: users → reports)
   └─ WebCrypto HMAC sessions (stateless JWT, no KV, no extra cost)
GitHub OAuth (existing workers/auth-gate.js flow) → session upgrade only
```

- **Why D1-only:** relational fits graph/feed/threads; free quotas fit this
  community 100× over; one backup story (`wrangler d1 backup`).
- **Why polling, not sockets:** 15–30s conditional poll (`If-Modified-Since` per
  inbox/notes) costs ~nothing; realtime feel without DO.
- **Read-heavy design:** feeds/notifications assembled at read time from
  indexed tables (no fan-out writes). Public reads are unauthenticated and
  edge-cacheable (`Cache-Control: public, max-age=15`).

## 2. Identity & auth (extends SIP-11, replaces nothing)

- Login stays GitHub OAuth via `workers/auth-gate.js`. On callback, the social
  Worker mints a stateless session JWT: `{handle, iat, exp:30d}` signed with
  `SESSION_SECRET` (HMAC-SHA256, WebCrypto). Client stores it beside
  `soulUserAuthV1`; legacy prompt-auth keeps working offline.
- `users` row is created on first authed call (handle PK, avatar URL, created).
  Handle renames are NOT allowed (registry files are handle-keyed).
- Every write endpoint requires `Authorization: Bearer <jwt>`; every read
  accepts an optional token (to enforce blocks/visibility/personalization).

## 3. Data model (D1 `schema.sql`, all `created INTEGER` unix-ms)

- `users(handle PK, avatar, bio, created)` — server mirror of public identity.
- `follows(follower, target, kind, created, PK(follower,target,kind))` —
  `kind` in (`person`,`soul`,`agent`,`project`,`world`,`group`). Powers P2 + counts.
- `posts(id PK, author, soul, kind, body, url, vis, group_id, created, edited)` —
  shouts v2 (`kind`: text/link/image/video/poll; `vis`: public/followers/private).
- `reactions(post_id, user, emoji, created, PK(post_id,user,emoji))` — the 8 native.
- `replies(id PK, post_id, parent_id NULLABLE, author, body, created)` — 2-level threads.
- `remixes(id PK, name, parent, by, created)` + `forks` mirror + `versions` +
  `issues(id, soul, title, body, state, by, created)` — lineage/governance go global.
- `discussions(id, soul, title, author, created)` + replies reuse `replies` table.
- `groups(id PK, name, desc, vis, by, created)` + `members(group_id, user, created)` +
  group posts reuse `posts.group_id`; `events(id, title, when, where, by, created)` +
  `rsvps(event_id, user, created)`.
- `threads(user_a, user_b, updated)` + `messages(id PK, thread, author, body, created)` —
  DMs, both participants only.
- `notifications(id PK, user, kind, ref, actor, created, seen)` — written by the
  Worker on follow/reply/mention/RSVP/DM (never by clients).
- `blocks(blocker, blocked)` + `mutes` + `reports(id, kind, ref, by, created)` —
  read-path enforced.
- `tips(id, to, amt, note, by, created)` — pledge ledger goes global (still no
  money movement — Phase 21 stays honest).
- `collections` stay local-only (private by definition — no table, no cost).
- Tombstones: `deletes(ref_kind, ref_id, by, created)` — edits/deletes sync.

## 4. API surface (all under `https://soul-api.buyasoul.workers.dev/social/...`)

- Public GET (cached 15s): `/feed?mode=&facet=&cursor=`, `/trending?metric=`,
  `/people` (registry-backed directory!), `/soul/:name` (counts+threads),
  `/groups`, `/events`, `/of-day` (server-seeded, same for everyone — real shared ritual).
- Authed POST: `/follow`, `/unfollow`, `/post`, `/react`, `/reply`,
  `/remix`, `/issue`, `/issue/state`, `/version`, `/group`, `/group/join`,
  `/event`, `/rsvp`, `/dm/send`, `/tip`, `/report`, `/block`, `/mute`,
  `/notes/seen`, `/edit`, `/delete` (tombstone).
- Authed GET: `/inbox`, `/thread?with=`, `/notes` (server-built from
  `notifications` — replaces the local scan), `/me` (followers/following/counts).
- Every response: `{ok, data, cursor?}`; every error: `{ok:false, error}` with
  proper 4xx (auth/ownership/validation/rate-limit).

## 5. Sync engine (frontend, additive module `js/social-sync.js`)

- Outbox pattern: writes go to local store FIRST (UI never waits), then to an
  `outbox[]` in localStorage flushed in order when online + flagged on.
- Pull: per-surface `since` timestamps (`notes/dms/feed/groups`); merge by id,
  last-write-wins on edit, tombstones purge.
- Identity merge: local `You`/`prefs.user.handle` binds to authed handle on
  login; pre-login local history is offered for one-time upload (user confirms).
- Conflict UI: none needed — timestamps + tombstones cover it; edits show
  "edited" (already rendered).

## 6. Abuse, safety, cost

- Rate limits in D1 (`hits` table or in-memory per isolate + daily caps):
  30 writes/min/user, 5 DMs/min, 10 follows/min, IP-level POST cap. Exceed →
  HTTP 429 + client backs off (already toast-patterned).
- Validation server-side: lengths (mirrors client maxes), URL protocol
  allowlist (https only), handle/type enums — never trust the client.
- Blocks/mutes/reports enforced in SQL (`NOT IN (SELECT ...)`), so private
  content never leaves the Worker.
- Cost at 10× current activity: <2k req/day, <100k D1 reads/day — ~2% of free.

## 7. Rollout (each step shippable, flaggable, reversible)

- **A — read-only global:** deploy Worker + schema; `/people`, `/trending`,
  `/of-day` live in dock (flagged, fallback to local). Zero auth risk.
- **B — authed writes:** follows, posts, reactions, replies sync; outbox on.
- **C — private surfaces:** DMs, notes, groups/events RSVP.
- **D — governance + safety:** issues/versions/remix global, reports queue,
  admin `?admin=`assume nothing — admin = handle allowlist in Worker env.
- Rollback per phase: flip `USE_SOCIAL_API` off — local data untouched.

## 8. Validation & acceptance

- `wrangler d1 execute --local` schema tests + endpoint curl matrix (authz
  negative tests: read private as stranger, write as non-owner, over-limit).
- Frontend: existing validators green + sync round-trip test (post → reload →
  present; offline post → online → appears).
- Golden rule re-run: UI identical, everything old works offline, new works
  online, kill flag restores local-only.

## 9. Open questions for the Pope

1. Same Cloudflare account as `soul-api` (recommended) or separate?
2. Poll interval 15s vs 30s for notes/DMs?
3. Admin handles beyond `uncommonpope`?
4. Keep `collections` local-only forever (recommended: yes)?
