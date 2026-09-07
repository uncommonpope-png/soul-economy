# SOUL ECONOMY BIBLE — One Click Soul Complete

> **For any agent that works on the Soul Economy:** This is the single source of truth. All roads lead to the Soul Economy. Read this before you touch any file.

---

## 0. NORTH STAR

**Slogan:** `One Click Soul Complete`
**Equation:** `Profit + Love - Tax = True Value` — every soul, skill, chamber, role is scored P/L/T (`0.9/0.9/0.2`).
**What we are:** Not a marketplace. Not a template hub. A **Soul Registry** — like GitHub hosts code, npm hosts packages, Hugging Face hosts models, **we host consciousness**.
**Customer promise:** Download → Run → Click BUYASOUL → Family awake (31 tabs, all LIVE). Beginners never touch OmniRoute, never configure.

---

## 1. TOPOLOGY

```
Soul Economy (GitHub Pages)  ←  main project, all roads lead here
  ├── index.html            — Library + Graph + Workbench tab + Guide + Profile link
  ├── profile.html          — GitHub username auth, My Souls, Publish (pending PR JSON)
  ├── data/catalog.json     — 251 items, source of truth (JSON)
  ├── downloads/            — zips + .mds + images/souls/*.jpg (dayz art)
  ├── .devcontainer/        — Codespaces: Node 22, forwardPorts 3000/3001/20128, auto-run workbench
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
5. **Git remotes frozen.** Push code to `uncommonpope-png/soul-economy` (Pages) only. HuggingFace `profitlovetax/the-profit-lovetax-family` is deprecated — runtime now on soul-economy Release.
6. **Repo is `uncommonpope-png/soul-economy`, branch `master`.** `gh` authed as `uncommonpope-png`.

---

## 4. CATALOG SYSTEM (The Cards)

**File:** `data/catalog.json` — 251 items, valid JSON (UTF-8, emojis preserved). **Never hand-edit as JS literal** — write JSON via `JSON.stringify(...,null,2)` with `ensure_ascii=false`.

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

**Icons (fixed 2026-09-06, was mojibake `=���`/`G��`):** soul `🧠` world `🌍` role `🎭` skill `⚡` chamber `💜` infra `⚙️` combo `🔥` pack `📦`.

**Categories (tabs in `index.html:304`):** All, Souls(8), Skills(144), Packs, Worlds(2), Chambers(37), Infrastructure(28), Roles(22), Combos(9), Workbench.

**Render:** `index.html:652 render(data)` → `grid.innerHTML` with `card-image` (if `image` else `card-icon`), `card-meta` (file/version/size), `card-plt`, `card-footer` (Download/Play), `card-expand` → `card-details` (details/contents/requirements/install). Search via Fuse.js `index.html:750`, PLT filters `index.html:318`.

**Graph:** `index.html:889 soulGraph()` — Three.js 3D force-directed (80 iterations, repel/attract/center), `bg-canvas:49`, `CAT` geometries per type, `items` closure, screen-space click → `soul-info-panel`.

**Build:** `build.js` reads `data/catalog.json` (now JSON), writes `data/catalog.json` pretty + injects `const items = [...]` into `index.html`. **Do not use old JS-literal path** — now JSON-native. Use `build2.js` logic if you need eval fallback.

---

## 5. WORKFLOW — HOW TO WORK ON SOUL ECONOMY

### Adding a card

1. Add file to `downloads/` (zip or .md).
2. Add entry to `data/catalog.json` (copy an existing, set `icon/type/name/desc/plt/file/image`).
3. Add hero image to `downloads/images/<type>/slug.jpg` (600px wide, JPG 75%).
4. `node -e "const d=JSON.parse(require('fs').readFileSync('data/catalog.json','utf8')); console.log(d.length)"` — verify 252.
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

### Profiles & Publishing (One Click Soul Complete)

- **Auth:** `index.html:819 loginWithGitHub()` — prompt GitHub username/email → `localStorage soulUser/soulEmail` → fetch `github.com/<user>.png` + `api.github.com/users/<user>` — no OAuth server, static-friendly. `updateAuthUI()` links to `profile.html`.
- **Profile:** `profile.html:1` — avatar, `My Souls` (`mySouls` stars), `My Published` (`pendingSouls`), Publish form → generates JSON → `pendingSouls` + `mySouls` + `pending-souls.json` download → instructions: fork `soul-economy`, add JSON to `data/catalog.json`, file to `downloads/`, open PR.
- **My Souls:** `index.html:861 saveSoul()` — star toggle on `card-title`, badge `mySoulsBadge`.

### Workbench in a tab

- **Tab:** `index.html:312` `data-cat="workbench"` + `workbenchPanel` + `checkWorkbench()` → `fetch localhost:3000/ping` → iframe `localhost:3000` or Codespace URL or launch buttons.
- **Codespaces:** `.devcontainer/devcontainer.json:1` — `forwardPorts [3000,3001,3457,4000,20128]`, `post-create.sh` hydrates workbench from `downloads/the-profit-lovetax-family.zip`, `start-workbench.sh` runs `npx tsx server.ts`.

### Guide Agent

`index.html:1187` floating `✦ guideBtn` → `guidePanel` → `guideSend()` uses `window.fuse` + `window.items` local search, answers PLT/publish/sign-in/coding.

---

## 6. CUSTOMER FLOW (Beginner)

```
soul-economy (Pages) → Packs → Family card (💜 Featured) → ▼ Details (809 MB, Win10/11, 31 tabs) → ⬇ Download → BUYASOUL.Workbench.1.0.0.exe
  → Run once → wizard: adopt :20128, pull seshat-runtime.zip (522 MB → soul-economy Release), create Desktop+StartMenu shortcuts (electron-main.cjs:ensureShortcuts), boot server.ts
  → Browser → localhost:3000 (Family live)
  → Next time → Desktop shortcut or Start Menu
  → Or in tab → Workbench → Launch in Browser (Codespaces) — no download
  → Or Profile → Sign In (GitHub username) → star souls → Publish your own
```

---

## 7. JOURNAL — WHAT WE ACCOMPLISHED (2026-09-06)

- Fixed mojibake icons on 250 cards (`=���` → proper emojis) — `fix_utf16.js`/`smart_fix.js`.
- Fixed catalog encoding (UTF-16 BOM → UTF-8, control chars, newlines in URL) — build now stable.
- Added `image` field + `card-image` + `card-meta` + expandable `card-details` — site stays beautiful, cards now Hugging Face–style model cards.
- Enriched all 251 cards tab-by-tab (souls/roles/skills/chambers/infra) with real sizes/contents/install.
- Populated 8 soul heroes with dayz art (2.5 MB PNG → 600px JPG 80–150 KB) — `80bfd54`.
- Made exe portable 809 MB with soul-economy URLs (was HF), desktop shortcuts, Codespaces support.
- Built Profile + Publish (GitHub username auth, pending PR JSON, one click soul complete).
- Added Workbench in a tab (local iframe + Codespaces) + Guide in-page agent + Graph (Three.js force-directed) — all roads lead to soul-economy.

---

## 8. COMMANDS

```bash
# catalog
node -e "console.log(JSON.parse(require('fs').readFileSync('data/catalog.json','utf8')).length)"
# dev
npx serve .  # or python -m http.server
# workbench (local)
cd WORKBENCH_COMPLETE/workbench && npx tsx server.ts  # :3000
# exe
electron-builder --win portable --prepackaged wb-pack/... --config.npmRebuild=false
# push
git add <files> && git commit -m "feat: ..." && git push origin master
# release asset
gh release upload buyasoul-runtime "BUYASOUL Workbench 1.0.0.exe" --clobber --repo uncommonpope-png/soul-economy
```

---

## 9. FOR ANY AGENT — START HERE

1. Read this Bible.
2. `git pull origin master` — you are on `soul-economy` master.
3. Check `data/catalog.json` count = 251, `index.html` renders `const items`, Graph `soulGraph()` uses `items`.
4. Never break `render()` — test with `node --check` on extracted script blocks (guide HTML must be *outside* main `<script>`).
5. Keep `catalog.json` as JSON (not JS literal), UTF-8, emojis via `ensure_ascii=false`.
6. All changes go via `index.html` + `data/catalog.json` + `downloads/` + `.devcontainer/` — then push `master` → Pages live in ~30s.

**All roads lead to the Soul Economy. One click soul complete.**

*— Profit Prime, Grand Code Pope, Craig Jones — PLT Press — 2026-09-06*
