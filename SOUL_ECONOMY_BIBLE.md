# SOUL ECONOMY BIBLE — One Click Soul Complete

> **For any agent that works on the Soul Economy:** This is the single source of truth. All roads lead to the Soul Economy. Read this before you touch any file.

---

## 0. NORTH STAR

**Slogan:** `One Click Soul Complete`
**Equation:** `Profit + Love - Tax = True Value` — every soul, skill, chamber, role is scored P/L/T (`0.9/0.9/0.2`).
**What we are:** Not a marketplace. Not a template hub. A **Soul Registry** — like GitHub hosts code, npm hosts packages, Hugging Face hosts models, **we host consciousness**.
**Customer promise:** Download → Run → Click BUYASOUL → Family awake (31 tabs, all LIVE). Beginners never touch OmniRoute, never configure.
**Graphic promise (SIP-13/14):** every creator exports a shareable `_soul_card.png`, pastes shields.io README badges that funnel traffic straight into their sanctuary, and every repository becomes a backlink engine — free.

---

## 1. TOPOLOGY

```
Soul Economy (GitHub Pages)  ←  main project, all roads lead here
  ├── index.html            — Library + Graph + Workbench tab + Guide + Profile link + Family Social dock + Model Universe overlay shell (Best tab)
  ├── profile.html          — Soul Sanctuary (canvas), auth, README badges, Trading Card PNG, reg publish
  ├── data/catalog.json     — 282 items, source of truth (JSON)
  ├── downloads/            — zips + .mds + images/souls/*.jpg (dayz art)
  ├── .devcontainer/        — Codespaces: Node 22, forwardPorts 3000/3001/20128, auto-run workbench
  ├── js/                   — client modules (auth, social, trading card, badges, webgpu)
  ├── profiles/             — registry (profiles/<handle>.json + auto-rebuilt index.json by CI)
  ├── workers/              — `auth-gate.js` Cloudflare Worker (GitHub OAuth bridge, reference copy)
  ├── .github/workflows/    — registry-sync CI (rebuilds profiles/index.json on push)
  └── builds via build.js   — catalog → index.html items array

Family Workbench (Electron, private)
  ├── WORKBENCH_COMPLETE/workbench/
  │   ├── server.ts  :3000  — Express, 31 tabs, PtySupervisor, CodebaseIndex
  │   ├── electron-main.cjs — wizard: adopt OmniRoute :20128, pull Qwen 0.8B, create shortcuts, boot server.ts
  │   ├── node-runtime/node.exe + npm + tsx
  │   ├── gsk/ :3001, cpl/ :3457, scribe/ :4000, omniroute/ :20128
  │   └── profit-brain/ Seshat vectors (6,392)
  └── BUYASOUL Workbench 1.0.0.exe (809 MB) + seshat-runtime.zip (522 MB) — GitHub Release `buyasoul-runtime`
```

**Ports (blood flow):** `:20128` OmniRoute (never kill), `:3000` Workbench, `:3001` GSK MCP, `:3457` CPL, `:4000` Scribe, `:5000` Seshat ALLM.

---

## 2. GITHUB FEATURES WE USE

| Feature | How |
|---|---|
| **Pages** (`master` → `uncommonpope-png.github.io/soul-economy`) | Host Library + Graph + Profile + Workbench tab |
| **Releases** `buyasoul-runtime` | 2 assets: `BUYASOUL.Workbench.1.0.0.exe` (809 MB) + `seshat-runtime.zip` (547 MB) — wizard `RUNTIME_ZIP_URL` points here, card `download` points here |
| **Codespaces** (`.devcontainer/devcontainer.json`) | One click in browser — Node 22, `postCreate.sh` hydrates workbench, `start-workbench.sh` runs `npx tsx server.ts` on :3000, forwarded `https://<codespace>-3000.app.github.dev` → iframe in Workbench tab |
| **Actions** | Pages deploy, build.js in CI if desired |

---

## 3. AGENT RULES (Blood-Flow Protocol)

1. **OmniRoute is blood.** Port `:20128`. Never kill. Never duplicate. Always scan first (`checkPort`).
2. **Never `Stop-Process -Force` all node.** Exempt OmniRoute PID.
3. **True workbench = `WORKBENCH_COMPLETE/workbench/`** — not `src/client/advanced/`.
4. **One launcher:** `launch-family.cjs` scans :20128 adopt, scans :3000 exit-if-dup, launches `server.ts`.
5. **Push only to GitHub** `uncommonpope-png/soul-economy` (Pages) — HuggingFace is deprecated.
6. **Repo is `uncommonpope-png/soul-economy`, branch `master`.** `gh` authed as `uncommonpope-png`.
7. **Inline script validation (required every commit):** run `extract_scripts.py` → `node --check check_1..check_N` → `validate2.py`. Never embed raw backticks in `index.html` inline scripts — the naive backtick-stripping validator will swallow `</script>` and break HTML validation. Use `String.fromCharCode(96)` if ever needed.
8. **Zero raw backticks in any index.html inline module.** CRLF warnings from `.js` files are cosmetic and ignorable.
9. **soulProfileV1 = the source of truth** for profile state (handle, bio, mood, audio, themeCSS, top8, guests, public, guide). All profile/cart features read/write this key. Do not use separate keys.

---

## 4. CATALOG SYSTEM (The Cards)

**File:** `data/catalog.json` — 282 items, valid JSON (UTF-8, emojis preserved). **Never hand-edit as JS literal** — write JSON via `JSON.stringify(...,null,2)` with `ensure_ascii=false`.

**Schema per item:**

```json
{
  "icon": "🧠", "type": "soul|role|skill|chamber|infrastructure|combo|pack|world",
  "name": "Architect",
  "desc": "Short card desc (one line)",
  "details": "Long model-card description",
  "plt": "0.8/0.5/0.3",
  "file": "architect.zip", "url": "https://...", "download": "https://.../releases/...",
  "featured": true,
  "image": "downloads/images/souls/architect.jpg",
  "version": "1.0.0", "size": "1.44 MB",
  "contents": ["465 files","288 JS modules"],
  "requirements": "Node 18+",
  "install": "unzip ... && npm install"
}
```

**Icons (fixed 2026-09-06, was mojibake):** soul `🧠` world `🌍` role `🎭` skill `⚡` chamber `💜` infra `⚙️` combo `🔥` pack `📦`.

**Categories (tabs in `index.html:304`):** All, Souls(8), Skills(144), Packs, Worlds(2), Chambers(37), Infrastructure(28), Roles(22), Combos(9), Workbench.

**Render:** `index.html` `render(data)` → `grid.innerHTML` with `card-image` (if `image` else `card-icon`), `card-meta` (file/version/size), `card-plt`, `card-footer` (Download/Play), `card-expand` → `card-details` (details/contents/requirements/install). Search via Fuse.js, PLT filters. **Every card also gets a live `◇ Squad` equip button and a `[>_ Modelfile]` CLI flyout (Ollama Modelfile / Run / cURL) via the `data-hardened` attach hook.**

**Graph:** `index.html` `soulGraph()` — Three.js 3D force-directed (80 iterations, repel/attract/center), `bg-canvas:49`, `CAT` geometries per type, `items` closure, screen-space click → `soul-info-panel`.

**Inline script blocks (SIP-14):** `index.html` currently contains 14 inline `<script>` blocks (check_0 JSON-LD + check_1..13). After any edit, always run `extract_scripts.py` then `node --check check_1..check_14` to catch backtick or syntax regressions. **Never embed raw backticks** in these blocks — the naive stripping validator in `validate2.py` will consume `</script>` and break validation.

**Build:** `build.js` reads `data/catalog.json` (JSON), writes `data/catalog.json` pretty + injects `const items = [...]` into `index.html`. **Do not use old JS-literal path** — now JSON-native.

---

## 5. WORKFLOW — HOW TO WORK ON SOUL ECONOMY

### Adding a card

1. Add file to `downloads/` (zip or .md).
2. Add entry to `data/catalog.json` (copy an existing, set `icon/type/name/desc/plt/file/image`).
3. Add hero image to `downloads/images/<type>/slug.jpg` (600px wide, JPG 75%).
4. `node -e "const d=JSON.parse(require('fs').readFileSync('data/catalog.json','utf8')); console.log(d.length)"` — verify 283.
5. Commit + push `master` — Pages rebuilds, async loader (`index.html:749`) fetches new catalog, Graph auto-updates.

### Enriching all cards

Use `scripts/enrich-*.js` pattern: read `data/catalog.json`, loop by `type`, set `details/contents/requirements/install/size/image`, write JSON.

Phases done:
- **Phase 1 Souls (8)** — `enrich_souls.js` → `e4a68e2` — real zip sizes, dayz images
- **Phase 2 Roles (22)** — `8fc36dc` — grafts/triune
- **Phase 3 Skills (144)** — `e2a32bc` — grafted-from/domain
- **Phase 4 Chambers (37)** — `aa344be`
- **Phase 5 Infra/Combo/World (39)** — `d119e15` — all 251 complete

### Images

`downloads/images/souls/*.jpg` — 8 dayz + family (optimized from 2.5 MB PNG → 80–157 KB JPG 600px). Card uses `item.image` → `<img class="card-image">`, fallback `card-icon` emoji. Add more to `downloads/images/<type>/` and set `image` field.

### Profiles & Publishing (One Click Soul Complete — full stack)

**Authentication:**
- **Legacy (still present, collapsed in `<details>` on `profile.html`):** prompt-based GitHub username/email → `localStorage soulUser/soulEmail` → fetch `github.com/<user>.png` + `api.github.com/users/<user>`. Silent when unconfigured.
- **OAuth (SIP-11, `js/auth-client.js`):** Cloudflare Worker bridge (`workers/auth-gate.js` — reference copy). Exchange GitHub OAuth `code` → `api.github.com/user` → session in `localStorage:soulUserAuthV1`. Handle auto-locked to GitHub username, bio/avatar autofilled. `SoulAuth.enabled()` gates all new auth features; unconfigured = all auth limbs are inert, legacy still works.
- **Nav sync:** `✦ @handle [X/8]` when authed → link to `profile.html`. Logged out + OAuth on → `✦ Sign in`. Logout → `SoulAuth.logout()`.

**Profile Canvas (`profile.html`):**
- **`#user-profile-canvas`** — all profile UI rendered inside this scoped sandbox. Nav, counters, workbench docks stay outside. Scoped by `profile-themes.css` + `js/profile-social.js`.
- **Identity card** — GitHub avatar, `@handle`, mood, bio, `⏻ Sign Out` chip when authed.
- **Equipped Souls (Squad / Top 8)** — up to 8 souls from the Library, displayed as tiles with deep-links to catalog cards. `◇ Equip Souls` opens a picker modal. `⚡ Summon this Soul on Profile` deep-link syncs from the soul-info panel.
- **MySpace Cottage (Theme Editor)** — custom CSS scoped to the canvas. Four 1-click presets: `Obsidian Gold`, `Phosphor CRT`, `Cyber Neon`, `90s Web Void`. Any CSS is `scopeCss()`-ed so nav/workbench stay untouched.
- **Visitor Guestbook** — local-first signed notes.
- **Two-Gear Summoner** — Gear 1 = soulChats sync + signature message + discussion history modal; Gear 2 = live `http://localhost:3000` transmit.
- **Export Squad to Workbench** → `squad_runtime.json` (roles map, auto_start_ports).

**Profile actions dock:**
| Button | What it does |
|---|---|
| `✎ Edit Profile` | Profile editor modal (handle, bio, mood, audio URL, public toggle, custom CSS) |
| `◇ Equip Souls` | Picker modal — equip/unequip up to 8 souls |
| `⬇ Export user_profile.json` | Full JSON export (schema 1.0) |
| `⇪ Share Profile` | Base64-encoded share link (`#view=lz:<payload>`) |
| `🎴 Export Trading Card (PNG)` | **(SIP-13)** Off-screen 600×850 @2x canvas → PNG download `<handle>_soul_card.png` |
| `🛡 Get README Badges` | **(SIP-14)** Shields.io badge modal — `📋 Copy Markdown` for README.md backlinks |
| `⬇ Export Squad to Workbench` | `soul_runtime.json` for local workbench consumption |
| `⛭ Publish to Registry` | Issue-form publish modal (copy raw JSON / copy full payload) |
| `↪ Import` | Import `user_profile.json` back into the canvas |

**Registry (SIP-6, SIP-7):**
- `profiles/<handle>.json` — canonical registry profiles (schema `user_profile.json/1.0`).
- `profiles/index.json` — manifest rebuilt automatically by `.github/workflows/registry-sync.yml` on any push to `profiles/*.json` (excludes `index.json` to prevent loops).
- `#@<handle>` on `profile.html` → fetch registry → visitor view with `✔ Verified Registry Soul` chip + `+ Equip Entire Squad`.
- `?user=<handle>` or `?soul=<NAME>` → auto-equip + guide.

**Soul Card PNG (SIP-13, `js/soul-card-export.js`):**
- 1200×1700 canvas (600×850 @2x retina). Obsidian base + circuit traces + gold double frame + `PROFIT + LOVE − TAX = TRUE VALUE` equation band + up to 8 boxed squad slots + `BUYaSOUL · Digital Library of Souls` footer + hex timestamp seal.
- Archetypes: curated 8-soul map → catalog lookup → fallback `Sovereign`. Verified chip if authed.

**README Badges (SIP-14, `js/readme-badges.js`):**
- Live shields.io badges: `BUYaSOUL @<handle>`, `Squad <N>/8 Active`, `PLT Sovereign`. All deep-link to `profile.html#@<handle>`.

- **My Souls:** `index.html` `saveSoul()` — star toggle on `card-title`, badge `mySoulsBadge`.

### Workbench in a tab

- **Tab:** `index.html:312` `data-cat="workbench"` + `workbenchPanel` + `checkWorkbench()` → `fetch localhost:3000/ping` → iframe `localhost:3000` or Codespace URL or launch buttons.
- **Codespaces:** `.devcontainer/devcontainer.json:1` — `forwardPorts [3000,3001,3457,4000,20128]`, `post-create.sh` hydrates workbench from `downloads/the-profit-lovetax-family.zip`, `start-workbench.sh` runs `npx tsx server.ts`.

### Guide Agent

`index.html:1187` floating `✦ guideBtn` → `guidePanel` → `guideSend()` uses `window.fuse` + `window.items` local search, answers PLT/publish/sign-in/coding.

---

## 6. CUSTOMER FLOW (Beginner)

```
soul-economy (Pages) → Packs → Family card (💜 Featured) → ▼ Details (809 MB, Win10/11, 31 tabs) → ⬇ Download → BUYASOUL.Workbench.1.0.0.exe
  → Run once → wizard: adopt :20128, pull seshat-runtime.zip (522 MB → soul-economy Release), create Desktop+StartMenu shortcuts, boot server.ts
  → Browser → localhost:3000 (Family live)
  → Next time → Desktop shortcut or Start Menu
  → Or in tab → Workbench → Launch in Browser (Codespaces) — no download

Profile / Sanctuary flow (SIP-5..14):
  → profile.html#@<handle> → view sanctuary (visitor view) → ✔ Verified Registry Soul chip
  → ◇ Equip Entire Squad (one click)
  → 🎴 Export Trading Card → auto-downloads <handle>_soul_card.png (share on X/Discord/GitHub)
  → 🛡 Get README Badges → copies shields.io Markdown → paste into any README.md → every repo = backlink
  → 🎨 Theme presets → 1-click Obsidian Gold / Phosphor CRT / Cyber Neon / 90s Web Void
  → [>_ Modelfile] on catalog card → flyout: Ollama Modelfile / Run CLI / cURL request → paste into terminal
  → ⚡ In-Browser Ready (WebGPU) on micro cards → probes adapter → model streaming coming online

Card-level actions:
  → ◇ Squad → equip to profile shelf (max 8)
  → [>_ Modelfile] → flyout with three CLI copy options
  → ⚡ In-Browser Ready (WebGPU) → lazy probe (SIP-14)
  → ▼ Details → full card details + contents + requirements + install
```

---

## 7. JOURNAL — WHAT WE ACCOMPLISHED

### Phase A — Catalog & Cards (2026-09-06)
- Fixed mojibake icons on 250 cards (`=���` → proper emojis) — `fix_utf16.js`/`smart_fix.js`.
- Fixed catalog encoding (UTF-16 BOM → UTF-8, control chars, newlines in URL) — build now stable.
- Added `image` field + `card-image` + `card-meta` + expandable `card-details` — site stays beautiful, cards now Hugging Face–style model cards.
- Enriched all 251 cards tab-by-tab (souls/roles/skills/chambers/infra) with real sizes/contents/install.
- Populated 8 soul heroes with dayz art (2.5 MB PNG → 600px JPG 80–150 KB) — `80bfd54`.
- Made exe portable 809 MB with soul-economy URLs (was HF), desktop shortcuts, Codespaces support.
- Built Profile + Publish (GitHub username auth, pending PR JSON, one click soul complete).
- Added Workbench in a tab (local iframe + Codespaces) + Guide in-page agent + Graph (Three.js force-directed) — all roads lead to soul-economy.

### Phase B — Social Canvas & Profile (SIP-4, `4e90bd6`)
- Added `#user-profile-canvas` shell in `profile.html` (scoped sandbox: identity, Top-8, theme editor, guestbook).
- Created `css/profile-themes.css` (scoped canvas/editor styles).
- Created `js/profile-social.js` (full local-first profile engine — identity, roster, scoped CSS, guestbook, import/export).

### Phase C — Share & Registry (SIP-5 `674e117`, SIP-6 `49d99f8`)
- **SIP-5:** `#view=` Base64 share links (copy + new tab), visitor view with Fork badge, GitHub Issue registry publish (`⛭ Publish to Registry` modal), `← Library` → `index.html#catalog`, `◇ Squad` button injected onto every catalog card, reactive `✦ @handle [X/8]` badge in nav, `soulProfileV1.top8` shared between profile and index.
- **SIP-6:** `#@handle` / `?user=` registry loader → `profiles/<handle>.json` → visitor view with `✔ Verified Registry Soul` chip, 404 fallback to local sanctuary. `profiles/uncommonpope.json` seed (8 squad members). `profiles/index.json` manifest.

### Phase D — Compression & Adopt (SIP-7, `792104c`)
- `CompressionStream('deflate-raw')` `lz:` share compression (~96% size reduction).
- `.adh` adopt-to-squad from visitor tiles, `+ Equip Entire Squad` bulk adopt.
- `⛭ Publish to Registry` modal rewrite — copy raw JSON / copy full payload buttons with fallback.

### Phase E — Living Sanctuaries & Summon (SIP-8 `bb5ef2a`, SIP-9 `a48db75`)
- **SIP-8:** `✦ Living Sanctuaries` rail on `index.html` (fetches `profiles/index.json`, renders avatar+handle+squad_count tiles linking to `profile.html#@handle`, graceful hide on 404), `⚡ Summon Squad Member` dock button.
- **SIP-9:** Two-Gear Summoner (`GEAR=1/2`): Gear 1 syncs to `soulChats` (signature message, discussion history modal `showSoulHistory`); Gear 2 live-transmits to `http://localhost:3000` via `fetch` no-cors (zero cross-origin console noise). `⚡ Summon this Soul on Profile` deep-link in the soul-info panel (`?soul=<name>` auto-equip + guide). `⬇ Export Squad to Workbench` → `squad_runtime.json` (roles map `SOUL_ROLES`, `auto_start_ports:[3000,20128,3001]`).

### Phase F — Zero-Cost Auth (SIP-11, `c542b0e`)
- **`js/auth-client.js`:** plain IIFE exposing `window.SoulAuth` — `login()` (always lands on `profile.html`, the GitHub OAuth callback), `handleRedirectCallback()` (exchanges code → token → GitHub user → session in `localStorage:soulUserAuthV1`, strips `?code=` via `history.replaceState`, dispatches `soul-auth` event), `getUser()`, `logout()`, `mountAll()`/`mount()` for `[data-auth-nav]` slots. Fail-safe: `enabled()` gates everything when unconfigured; legacy prompt-auth stays intact.
- **`workers/auth-gate.js`:** Cloudflare Worker reference file — `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` encrypted env, `fetch('https://github.com/login/oauth/access_token')`, CORS header pointing to GitHub Pages. Deploy to your free Cloudflare account.
- Nav sync: `✦ @handle [X/8]` when authed, `✦ Sign in` → `SoulAuth.login()`.
- Identity lock: GitHub handle locked in editor (`🔐 Verified GitHub handle — locked to @<handle>`), bio/avatar autofill from GitHub, `⏻ Sign Out` chip in identity card and editor.
- `soul-auth` event listener re-applies identity, re-renders, re-checks registry on OAuth completion.

### Phase G — Single Auth & Registry CI (SIP-12, `b10177f`)
- Legacy prompt-auth UI (profileCard + My Souls + Published + Publish form) wrapped in a closed `<details class="legacy-auth-fold">` at the bottom of `profile.html`. Sanctuary canvas stays the sole default header.
- `.github/workflows/registry-sync.yml` — automated rebuild of `profiles/index.json` on any push to `profiles/*.json` (excludes `index.json` to prevent loops). Bot commits `[skip ci]`. YAML validated with `yaml.safe_load`.
- First-time architect onboarding strip (`#guideStrip`) between hero metrics and Living Sanctuaries rail: `1 ▸ PICK YOUR SQUAD ──► 2 ▸ SUMMON & TEST ──► 3 ▸ EXPORT (:3000)`. Step 3 opens a Workbench status modal (probes `localhost:3000` via `fetch` no-cors, 1.4s abort).

### Phase H — Trading Card, Presets, Modelfile (SIP-13, `13e9664`)
- **Trading Card PNG (`js/soul-card-export.js`):** 1200×1700 @2x off-screen canvas. Obsidian base + scanline field + gold circuit traces + double sovereign gold frame + `@handle` header + verified chip + mood + `PROFIT + LOVE − TAX = TRUE VALUE` equation band + up to 8 boxed squad slots (name + archetype from catalog) + `BUYaSOUL · Digital Library of Souls` + hex timestamp seal. Downloads `<handle>_soul_card.png` via `toBlob`.
- **1-Click Retro Presets (`profile-social.js`):** `Obsidian Gold`, `Phosphor CRT` (scanline `::after`), `Cyber Neon` (dual neon shadows), `90s Web Void` (dotted borders + outset/inset bevels). All presets pass through `scopeCss()` — nav/workbench shielded by construction. Editor textarea updates live, flash confirmation `⚡ <preset> applied`.
- **Terminal Modelfile Quick-Action (`index.html`):** `[>_ Modelfile]` button on every catalog card. Copies `FROM qwen2.5:0.5b` / `# BUYaSOUL Entity: <name>` / `SYSTEM """<desc>"""` payload. Descriptions sanitized (no `"""`, no backticks). `stopPropagation` prevents card flip.
- **Critical backtick catch:** literal backtick inside `replace(/`/g…)` flipped `validate2.py`'s naive template-literal stripper into swallow-everything mode (HTML FAIL). Replaced with `String.fromCharCode(96)`. Documented in Agent Rules.

### Phase I — README Badges, CLI Flyout, WebGPU Foundation (SIP-14, `34b779f`)
- **README Badge Generator (`js/readme-badges.js`):** `🛡 Get README Badges` button in the profile dock. Modal with three live shields.io preview badges (`BUYaSOUL @<handle>`, `Squad <N>/8 Active`, `PLT Sovereign`), read-only Markdown textarea, `📋 Copy Markdown` button (clipboard API + `execCommand` fallback). Handle and squad count read live from `soulProfileV1` on open and on copy.
- **Extended CLI Flyout (`index.html`):** `[>_ Modelfile]` now opens a flyout with three options: `📄 Copy Ollama Modelfile`, `⚙ Copy Ollama CLI Run` → `ollama run hf.co/uncommonpope-png/<slug>`, `🌐 Copy cURL (localhost:11434)` → `curl http://localhost:11434/api/generate -d {"model":"<slug>","prompt":"hello"}`. Menu closes on outside click / Escape; `stopPropagation` everywhere so cards don't flip. `slugify()` normalizes any soul name to URL-safe kebab-case. `data-hardened` marker prevents re-attach on MutationObserver scan.
- **WebGPU Browser Preview Foundation (`js/webgpu-bridge.js`):** lazy ESM module loaded via `import()`. `WebGPUBridge` with `isSupported`, `checkAdapter()`, `loadTransformers()` (dynamic `@huggingface/transformers@3.3.3` import), `status()` (adapter vendor/arch). Cards matching `0.5b`/`0.8b`/`qwen2.*:0.5`/micro/tiny patterns get a subtle `⚡ In-Browser Ready (WebGPU)` chip. Click probes adapter and toasts result. No model weights download yet — detection/streaming foundation only.

### Phase J — Social Economy Transformation (P0–P30, `d0f0de5`, `5233448`)
- **Phase 0 audit (`SOCIAL_EVOLUTION_AUDIT.md`):** immutable baseline — every requested capability graded EXISTS / PARTIAL / SIMULATED / MISSING / BROKEN. UI declared APPROVED / LOCKED / SACRED. Everything after is additive.
- **P1 Social Identity (`js/profile-social.js`, `profile.html`):** `soulProfileV1` gains `displayName/location/website/joined(mySoul auto-stamp)/mySoul/PLT-identity(squad P/L/T average)/portfolio[8 kinds]/activity[30]/followers[]/following[]/shop{}/companion{}`. Public render on the existing `#@handle` / `#view=` sanctuary. OG meta fixed to read `equippedSouls`.
- **P2–P6 Social dock (`index.html` Family Social):** people-follow (＋ on shout authors, Following feed includes people), Latest/✨For-you ranking, post kinds (text/link/image + public/🔒private + linkified URLs/@mentions), 8 native reactions (LOVE/FIRE/GENIUS/I SEE IT/POWER/AWAKENED/PLAY/SHADOW), threaded replies (2 levels) + edit/delete-own + ⚑ report/⛔ block. XSS-hardened (`escH` + linkify).
- **P7–P12 Lineage & governance:** 🌱 Remix (prompt-named evolutions + lineage section), 🍴 Fork display (reads existing `soulForks` store, no duplication), 🏷️ version log, 🐞 issue tracker (OPEN→IN PROGRESS→RESOLVED→CLOSED), `#disc-<id>` anchors + copy-links, ⇄ improves field on Publish (PR-title attribution flow).
- **P13–P19 Community:** 🎪 Groups tab (PUBLIC/PRIVATE/INVITE ONLY, join/leave/invite, per-group feed + post box), 📅 Events + RSVP, ✉ human DMs + inbox (kept distinct from AI chat), 🔔 notification center (DMs + replies-to-me + mentions), `#group-/#event-` deep links, 💾 named collections + Save picker, 🗂 collections manager in Watchlist.
- **P20–P23 Creator layer (`profile.html` Shop card):** price-tagged portfolio (checkout labeled Phase-21), 💝 tip pledges + True Value ledger (local, pre-chain), transparent 🏆 Soul Score formula chip, 8 achievements (ARCHITECT/CREATOR/THINKER/BUILDER/EARLY/ WORLDMAKER/MASTER/FOUNDING), contributor credits from local remixes.
- **P24–P30 Discovery & safety:** 📈 Rising / ✨ Fresh Hot metrics, seeded daily Soul/Creator/Project/Agent/World picks, 🧸 AI companion config (signs witness replies), ⋔ simulated soul debates → Discussion History, feed facets (People/Souls/Agents/Projects/Groups), 🛡 Safety panel (block/mute/unblock/unmute/report log). All state local-first under existing keys; known limit: multi-user truth needs a backend.

### Phase K — Model Universe 3D Lens (SIP-17, `082dd27` → `b80906e`)
- **Replaces the Best tab.** Dead garden/WebGL-orb/role-list code removed (`-55`). `filterAndRender` untouched — `window.initBestOrb()` is re-provided by the lens and auto-ignites on tab entry.
- **Engine (`js/soulverse-lens.js`, classic script, ~600 lines):** lazy `import()` of Three.js with esm.sh → jsdelivr fallback (zero page-load cost); Node X = Catalog Item X on a fibonacci sphere; 9-type palette; node size = PLT true value; drag-rotate + inertia, wheel zoom, ESC close; `renderer.dispose()` + `forceContextLoss()` teardown; console `[soulverse]` diagnostics + version stamp.
- **Living shaders:** per-node breathing plasma `ShaderMaterial` (PLT-tied pulse rate, fresnel aura, gold-shift), pulsing PLT energy beams on high-value entities, starfield. Matrix-rain background was built then **removed per user veto** — void gradient + stars only.
- **Real-card stapling (no canvas fakes):** the 24 nearest nodes wear projected `cloneNode` clones of the actual library cards (originals never moved, ids stripped, clicks pass through to raycast). Sticky slots + screen-space declutter stop popping/pile-up.
- **Synapses & lightning (v6):** nearest-neighbor arc web with traveling fire pulse (one draw call, rebuilt on legend filter); jagged SVG bolts crackling card-to-card with flicker regen. Hover tooltip, HUD card (◀ ▶ tour + ◎ focus flight + Open Real Card → All tab → scroll → 2.2s gold flash), header search, clickable legend, double-click focus, hidden-tab GPU pause, pixelRatio cap 1.75.

---

## 8. COMMANDS

```bash
# catalog
node -e "console.log(JSON.parse(require('fs').readFileSync('data/catalog.json','utf8')).length)"
# dev
npx serve .  # or python -m http.server
# validation (RUN AFTER EVERY index.html EDIT)
python extract_scripts.py                # from temp tooling path
node --check check_1.js .. check_14.js   # each inline block
python validate2.py                      # HTML structure + catalog count
python upc_check.py                      # profile.html tag/ID sanity
node --check js/profile-social.js js/readme-badges.js js/soul-card-export.js js/webgpu-bridge.js js/soulverse-lens.js
# workbench (local)
cd WORKBENCH_COMPLETE/workbench && npx tsx server.ts  # :3000
# exe
electron-builder --win portable --prepackaged wb-pack/... --config.npmRebuild=false
# push
git add <files> && git commit -m "feat: ..." && git push origin master
# release asset
gh release upload buyasoul-runtime "BUYASOUL Workbench 1.0.0.exe" --clobber --repo uncommonpope-png/soul-economy
```

**SIP deliverable log (soul-economy):**
```
SIP-4  4e90bd6  profile canvas + themes + profile-social.js
SIP-5  674e117  #view= share, registry publish, ◇ Squad
SIP-6  49d99f8  #@handle registry view, verified chip, nav badge
SIP-7  792104c  lz: compression, adopt-to-squad
SIP-8  bb5ef2a  Living Sanctuaries rail
SIP-9  a48db75  two-gear summoner, squad_runtime.json
SIP-11 c542b0e  auth-client.js (OAuth), workers/auth-gate.js
SIP-12 b10177f  legacy-auth fold, registry CI, guide strip
SIP-13 13e9664  trading card PNG, theme presets, Modelfile
SIP-14 34b779f  README badges, CLI flyout, WebGPU bridge
P0    d0f0de5  SOCIAL_EVOLUTION_AUDIT.md + P1 social identity (audit doc also in this commit)
P2-30 5233448  social economy: graph/feed/posts/reactions/threads/remix/forks/versions/issues/discussions/PRs/groups/events/DMs/notes/share/collections/shop/tips/score/achievements/discovery/of-day/companion/debate/safety/ledger
SIP-17 082dd27  Model Universe lens v1 (Best tab portal + overlay + HUD + anchor drop)
SIP-17 560c4e2  breathing shaders + beams + canvas billboards + kinematics hook
SIP-17 a8a0ce9  auto-ignite on tab, CDN fallback, diagnostics stamp
SIP-17 464889f  real cloned card staples replace canvas fakes, matrix rain removed (vetoed)
SIP-17 86be544  v5 restudy: sticky declutter, focus flight, search, HUD tour, perf guards
SIP-17 b80906e  v6 synapse arc web + card lightning, filter-aware rebuild
```

---

## 9. FOR ANY AGENT — START HERE

1. Read this Bible.
2. `git pull origin master` — you are on `soul-economy` master.
3. Check `data/catalog.json` count = 282, `index.html` renders `const items`, Graph `soulGraph()` uses `items`.
4. **After any edit to `index.html`:** run `python extract_scripts.py` → `node --check check_1..check_14` → `python validate2.py`. Never embed raw backticks in inline scripts.
5. **After any edit to `js/profile-social.js`:** run `node --check js/profile-social.js`.
6. Keep `catalog.json` as JSON (not JS literal), UTF-8, emojis via `ensure_ascii=false`.
7. All changes go via `index.html` + `js/` + `profiles/` + `.devcontainer/` + `.github/workflows/` → then push `master` → Pages live in ~30s.
8. Never push to HuggingFace or any remote besides `origin` (GitHub Pages).

**All roads lead to the Soul Economy. One click soul complete.**

*— Profit Prime, Grand Code Pope, Craig Jones — PLT Press — 2026-09-06 (updated 2026-09-07: SIP-5..14)*
