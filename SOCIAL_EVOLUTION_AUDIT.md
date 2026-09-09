# SOCIAL_EVOLUTION_AUDIT.md — Phase 0 Immutable Baseline

> Master record for the Soul Economy → Social Economy transformation.
> Rule: ADD. EXTEND. CONNECT. EVOLVE. The existing UI is APPROVED / LOCKED / SACRED.
> Phase 0 = inventory only. No implementation changes were made to produce this file.

Baseline snapshot: repo `uncommonpope-png/soul-economy`, branch `master`,
`data/catalog.json` = **282 items**, `index.html` = **17 inline script blocks**,
last validation green (HTML VALID / catalog 282 / guard clean).

---

## 1. INVENTORY — WHAT EXISTS TODAY

### 1.1 Pages / routes (static, no router; panels toggled by tab)

- `index.html` — Library home: hero, search, category tabs, PLT filters,
  `#catalog` grid (`#resourceGrid`), panels: `workbenchPanel`, `chatPanel`,
  `discussionsPanel`, `bestPanel`, plus North Star, footer, email section.
- `profile.html` — Soul Sanctuary: avatar/handle/bio/mood, My Souls (starred),
  published/pending-PR list, publish form (Publish → PR JSON), squad equip,
  summoner dock, Share Profile (`⇪`), theme presets, README badges, trading-card PNG.
- `profit.html` — Profit Prime journal/statement page.
- `journal.html` — session journal (3D overlay + entries from `data/journal-entries.json`).
- `dashboard.html` (+ `dashboard-backup.html`) — Profit Prime 3D city (separate Three.js world).
- Deep links (hash/query, not routes): `profile.html#@handle`, `#view=lz:<payload>`
  (Base64/deflate share), `index.html#catalog`, `?soul=<name>` summon deep-link.
- `workers/catalog-api.js` — Cloudflare Worker reference: CORS `/api/catalog.json`,
  `/api/soul?name=`, `/api/profile?user=`, `/og/profile?user=` SVG card.
  `soul-api.buyasoul.workers.dev` placeholder; deploy is a user step.
- `workers/auth-gate.js` — GitHub OAuth bridge reference (needs deploy + client ID).

### 1.2 Navigation (LOCKED)

- Navbar (`index.html:300`): logo, Library / BUYaSOUL / GitHub / Profit / Dashboard,
  auth bar (`btnSignin`, `userEmail`, `btnSignout`, `mySoulsBadge`),
  `🌐 Social` dock toggle (`ssDockToggle` + `ssDot` badge), `🌌 Dark City` button.
- Category dock (`index.html:377-394`): All, Trending, Souls, Skills, Packs, Worlds,
  Agents, Books, Chambers, Infrastructure, Roles, Combos, Workbench, Chat,
  Discussions, Best Models. Panels hide grid + PLT filters when active (`filterAndRender`).

### 1.3 Cards (LOCKED)

- Source of truth `data/catalog.json` (282). Schema: icon/type/name/desc/details/
  plt (`P/L/T`) / file|url|download / featured / image / version / size / contents /
  requirements / install (`SOUL_ECONOMY_BIBLE.md:71-104`).
- Render: image-or-icon header, title, PLT chips (`.plt-p/.plt-l/.plt-t`), meta tags,
  footer (Download/Play), `card-expand` → always-visible `card-details`
  (details/contents/requirements/install).
- Per-card attachments: `◇ Squad` equip, `[>_ Modelfile]` CLI flyout (Ollama
  Modelfile/Run/cURL, `data-hardened`), per-card `♡ Like` (`soulLikes`),
  per-card giscus thread mount (`mountGiscus`, `window.GISCUS` stub — needs
  repoId/categoryId), per-soul `⇪` share link.
- `soul-info-panel` modal: name/type/desc/PLT + Awaken + `⚡ Summon this Soul on Profile`.

### 1.4 Search / filters / discovery-in-place

- Fuse.js `searchInput` + results dropdown + keyboard nav; `searchClear`.
- PLT range filters P/L/T (`pltFilters`).
- `🔥 Trending` tab computed live from stars + followers + downloads.
- Guide agent (`guidePanel`) answers site questions; Aurora canvas behind hero.

### 1.5 Identity / auth (local-first + OAuth scaffold)

- Legacy prompt auth: `soulUser` / `soulEmail`, avatar via `github.com/<user>.png`.
- `js/auth-client.js` → `window.SoulAuth` (login lands on `profile.html`, code→token→
  session in `localStorage:soulUserAuthV1`, `soul-auth` event). Real OAuth requires
  deploying `workers/auth-gate.js` + OAuth App — currently unconfigured, legacy intact.
- `soulProfileV1` is the profile source of truth (handle/bio/mood/audio/themeCSS/
  top8/guests/public/guide). Registry: `profiles/<handle>.json` + `profiles/index.json`
  auto-rebuilt by `.github/workflows/registry-sync.yml`; publish flow opens a
  pre-filled GitHub create-file PR (`profiles/<handle>.json`).
- Social identity (browser-local): handle/emoji/anthem/theme (`soulSocialPre`),
  MySpace profile modal, `✦ @handle [X/8]` nav sync.

### 1.6 Social graph / feed / discussion (local-first, all inside existing UI)

- `🌐 Social` dock (`#ssDock`, `index.html:1829+`): stars, **follows (souls)**,
  watchlist, likes, shouts (200-char per-soul posts), shout votes (▲/▼),
  Pulse feed with modes **All / Following / Circle / Mine**, timestamps, author
  identity, Trending metrics, profile modal. All persisted in localStorage
  (`soulSocialPre/Stars/Follows/Watch/Events/Shouts/Votes`).
- Chat tab: per-soul threads in `localStorage:soulChats` with GitHub-avatar rows;
  sign-in gate; notes say future giscus sync.
- Discussions tab: local threads (`soulDiscussions`, seed rows) + `prompt()` reply
  + GitHub Discussions outbound link; live sync missing (REST URL used is not a
  real Discussions endpoint).
- Forks: `soulForks` local lineage (`parent`, `Gen+N` reincarnation, children lists,
  JSON import/export, soul manifest `soul.json/1.0` with lineage/memory loadout).
- Events key exists (`soulSocialEvents`, capped at 150, saved) — feed surface inside
  dock; dedicated events UI not verified.
- `ssDot` badge element + toast system exist; no notification center.
- Email signup local (`soulEmails` + CSV export); no accounts backend.

### 1.7 Save / share / publish (exists, local + GitHub rails)

- Save: `mySouls` stars (profile badge + grid + unsave), watchlist.
- Share: profile `#view=lz` link (copy/new-tab/visitor Fork badge), per-soul `⇪`
  link, clipboard helpers, README shields.io badges, `_soul_card.png` export
  (`js/soul-card-export.js`), OG/Twitter meta upgraded per registry handle.
- Publish: pendingSouls → PR JSON + instructions; registry CI merges to
  `profiles/index.json`. Propose-improvement on *other* people's souls: absent.

### 1.8 Workbench / AI layer (DO NOT TOUCH semantics)

- Workbench tab probes `:3000` (`checkWorkbench`), Codespaces forwarding
  (3000/3001/20128), iframe embed, desktop EXE download, `squad_runtime.json`
  export, two-gear summoner (Gear 1 `soulChats` sync + history modal; Gear 2 live
  transmit to `:3000`), `?soul=` auto-equip. Ports `:20128` OmniRoute (never kill),
  `:3000`, `:3001`, `:3457`, `:4000`, `:5000` per Bible.
- `js/webgpu-bridge.js` lazy ESM adapter detect + per-card launch (no weights shipped).

### 1.9 Visual / motion / responsive (LOCKED)

- Glassmorphism dark theme, purple/cyan/gold tokens; card entrance `cardIn`,
  `shimmer`, `ripple`, `shimmerGlass`, `ssIn`; hover lift/glow; shimmer sweep.
- `prefers-reduced-motion` guard. Breakpoints `820px` / `520px` (+ `640px` dock rule);
  grid `auto-fill minmax(280px,1fr)` → 2-col → 1-col; backdrop-filter fallbacks.
- `bg-canvas` Three.js soul graph (force-directed, per-type geometries,
  FXAA + UnrealBloom, fog/star drift/code-rain floor, screen-space click).
  Guard: `soulGraph|graphOverlays|renderGraph` must stay untouched.
- Validation protocol (every commit): `extract_scripts.py` → `node --check`
  inline blocks → `validate2.py`; **zero raw backticks** in inline scripts.

---

## 2. PHASE VERDICTS (EXISTS / PARTIAL / SIMULATED / MISSING / BROKEN)

| Phase | Verdict | Evidence / gap |
|---|---|---|
| 0 Baseline | EXISTS | This file. No code changed. |
| 1 Social identity | PARTIAL | Local handle identity + sanctuary + top8/mySouls/publish exist; SoulAuth OAuth unconfigured; no multi-user public profiles, no followers/following counts on people, portfolio limited to souls/squad. |
| 2 Social graph | PARTIAL | Soul-follow + counts local exist; MISSING: follow people/souls/agents/projects/worlds/groups, global counts. |
| 3 Soul feed | PARTIAL | Pulse feed (All/Following/Circle/Mine) + Trending live; MISSING: server chronological/personalized feed, pagination/infinite scroll, object links. |
| 4 Posts | PARTIAL | Shouts (text, 200ch, per soul) + chat + discussion threads; MISSING: image/video/link/soul/project/AI/poll types, repost, save-post, follow-author. |
| 5 Reactions | PARTIAL | Like/star/watch/vote exist; MISSING: native 8-reaction set (LOVE/FIRE/GENIUS/I SEE IT/POWER/AWAKENED/PLAY/SHADOW) + extensibility. |
| 6 Comments | PARTIAL | Shouts+votes, prompt-reply, soul history; MISSING: threading/nesting/edit/delete/mentions/notifications/moderation; must cover Posts+Souls+Projects+Worlds+Discussions. |
| 7 Remix | MISSING | Fork covers derivation; no REMIX chain (Original→Remix→Evolution) with attribution. |
| 8 Fork | PARTIAL | Local `soulForks` lineage + import/export; MISSING: public "Forked from / forks N" + creator attribution surface. |
| 9 Versioning | PARTIAL | `version` meta-tag + fork generations; MISSING: version history/changes/dates/evolution path UI. |
| 10 Issues | MISSING | GitHub Issues only used as publish path; no per-soul OPEN→CLOSED tracker. |
| 11 Discussions | PARTIAL | Tab + local threads + giscus stub + outbound link; MISSING: live sync (REST URL invalid for Discussions; needs repoId/categoryId + app). |
| 12 Pull requests | PARTIAL | Publish→PR + registry CI merge; MISSING: propose-improvement on others' souls with accept/reject/discuss/merge + contributor credit. |
| 13 Groups | MISSING | Circle filter is a friend-set, not joinable PUBLIC/PRIVATE/INVITE groups. |
| 14 Group feeds | MISSING | Depends on 13. |
| 15 Events | PARTIAL | `soulSocialEvents` storage exists; dedicated event UI (RSVP/attendees/discussion) not verified. |
| 16 Messaging | MISSING | Chat/summoner are AI-community, must stay distinct; no human 1:1/group messaging. |
| 17 Notifications | PARTIAL | `ssDot` + toasts exist; MISSING: notification center + event coverage. |
| 18 Share | PARTIAL | Profile/soul links, badges, trading card, OG worker; MISSING: unified internal share for Soul/Profile/Post/Project/World/Group/Event/Discussion. |
| 19 Save/Collections | PARTIAL | Stars + watchlist; MISSING: named custom collections. |
| 20 Creator stores | MISSING | Catalog marketplace exists; no per-creator shops. |
| 21 Creator economy | MISSING | PLT scoring exists; no tips/support/purchase/royalty. |
| 22 Reputation | PARTIAL | Per-soul PLT + trending; MISSING: transparent SOUL SCORE (creation/contribution/collaboration/remix/answers/activity/PLT). |
| 23 Achievements | MISSING | No badges on profiles. |
| 24 Discovery | PARTIAL | Trending live; MISSING: people/projects/agents/worlds/discussions/groups/new/rising/featured atop catalog. |
| 25 Of-the-day | MISSING | No Soul/Creator/Project/Agent/World of the Day. |
| 26 AI companions | SIMULATED | Summoner witness mode + Active Guide; no persistent profile-aware companions. |
| 27 Soul-to-soul | SIMULATED | Bonds/equips/contracts language only; no real soul↔soul collaboration/debate. |
| 28 AI feed filter | PARTIAL | All/Following/Circle/Mine; MISSING: People/Souls/Agents/Projects/Groups facets. |
| 29 Moderation/safety | MISSING | No block/mute/report/rate-limit/privacy scopes (PUBLIC/FOLLOWERS/GROUP/PRIVATE). |
| 30 Social economy | MISSING | Architecture not wired to PLT true-value loop. |

BROKEN: nothing found in audit scope. Known unconfigured (not broken): giscus
`repoId/categoryId`, `soul-api.buyasoul.workers.dev` deploy, OAuth client/secret.

---

## 3. WHAT WILL BE ADDED (sequenced, additive-only)

- Phase 1 first: complete social identity on top of `SoulAuth` + `soulProfileV1` +
  registry (public profile destination in existing visual system, follow counts,
  portfolio breadth) — no nav/cards/colors/animations touched.
- Then Phase 2 → 3 → … in directive order, each phase: audit → smallest additive
  slice → preserve + test → PHASE STATUS. Never duplicate: follow/people,
  feed server-sync, post types, reactions, threading, remix, groups, events UI,
  messaging, notifications, share object, collections, stores, economy, score,
  achievements, discovery, of-the-day, companions, soul↔soul, facets, moderation,
  economy wiring.
- Explicitly never touched: navbar, category tabs, card design, PLT filters,
  search, soul graph (`soulGraph|graphOverlays|renderGraph`), workbench ports
  and probe semantics, catalog data (stays 282 unless the user orders a card),
  Codespaces/Dark City flows, existing animations/colors/responsive rules.

## 4. GOLDEN-RULE TEST (run after every phase)

1. Existing UI preserved. 2. Every existing feature preserved. 3. Added, not
replaced. 4. New feature actually usable. 5. It persists. 6. It connects to the
social graph. 7. Desktop + mobile. 8. No duplicates. 9. Nothing broken
(validators green). 10. Still unmistakably Soul Economy.
