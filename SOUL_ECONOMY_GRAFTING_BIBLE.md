# SOUL ECONOMY GRAFTING BIBLE — How We Become Every Hub

> Graft = steal the soul, not the body. Take the mechanic, re-skin with PLT.

---

## 0. HUBS STUDIED

| Hub | Core Mechanic | Graft For Us |
|---|---|---|
| **Hugging Face** | Model Cards + Spaces + Discussions + Organizations + Likes | Soul Cards + Workbench tab (Space) + Discussion tab + Organizations (Collectives) + Likes |
| **GitHub** | Repos + Issues + Discussions + PRs + Profiles + Stars | `downloads/` as repos, Issues as bug reports, Discussions as Posts, PRs as Publish, Profiles as `profile.html`, Stars as Likes |
| **npm** | Packages + Downloads count + Dependents | `data/catalog.json` as registry, `downloads` count via Release API, Dependents = grafts |
| **Civitai** | Images + Comments + Collections + Creator tiers | Hero images (dayz), Comments on cards, Collections (Combos), Creator profiles |
| **Replicate** | Run + API + Examples | Workbench tab Run (Codespaces/local), API via MCP `:3001` |
| **Discord/Reddit** | Channels + Threads + Upvotes | Chat tab (realtime), Discussions tab (threads), PLT as upvote |
| **Medium/Dev.to** | Blog + Follow | Blog tab (soul stories, PLT doctrine) |
| **Product Hunt** | Trending + Upvote + Launch | Trending tab (downloads+likes) already live |

---

## 1. MECHANICS TO GRAFT (Deeper)

### 1.1 Hosting — Where Souls Live
- **Now:** GitHub Pages (static) + Releases (exe/zip) + Codespaces (live workbench).
- **Graft:** Keep Pages for Library, add **GitHub Releases as registry** (already), **Codespaces as ephemeral host** (already), optional **Fly.io/Railway** for 24/7 Workbench demo (iframe in Workbench tab). No new infra for MVP.

### 1.2 User Chatting (Realtime)
- **Graft from Discord/Civitai comments**
- **MVP (zero backend):** Embed **GitHub Discussions** via `giscus` (uses Discussions API, no server) OR **Telegram widget** (`@Profittax_bot` already in `index.html:855`). Add `Chat` tab → `giscus` iframe filtered by `soul:<name>` category.
- **Full:** Supabase Realtime (`soul_chats` table, 1 row per soul, RLS by `soulUser`) + `profile.html` auth. 1 click: we already have `localStorage:soulUser`.

### 1.3 Post Tab (User Posts)
- **Graft from HF Discussions / Reddit**
- **MVP:** `Posts` tab → list of **GitHub Discussions** (`repo:uncommonpope-png/soul-economy` category "Show and Tell") via `api.github.com/repos/.../discussions` (or giscus). Each card gets **💬 Discuss** button → opens Discussion for that soul.
- **Data:** `data/posts.json` (like `catalog.json`) + Publish form in `profile.html` → creates Discussion via API (needs PAT, fallback to pending JSON).

### 1.4 Discussion Tab (Organization)
- **Graft from HF/GitHub Discussions + Organizations**
- **MVP:** `Discussions` tab → embedded `https://github.com/uncommonpope-png/soul-economy/discussions` via iframe or API list. Categories: `General`, `Soul Help`, `Showcase`, `PLT Doctrine`.
- **Organizations (Collectives):** `profile.html` already has `soulUser` — add `Collective` field (`data/catalog.json` `collective: "PLT Press"`), filter tab, show org avatar. Graft HF Organizations as **Collectives** — Craig = PLT Press, Profit = Soul Foundry.

### 1.5 Blog Tab
- **Graft from Medium/HF Blog**
- **MVP:** `Blog` tab → reads `data/journal-entries.json` (already has 10 entries) + `downloads/combo-*.md` as posts. Render as Medium-style cards. New posts = add entry to `journal-entries.json` via `profile.html` Publish (type: `post`).
- **Files:** `blog.html` already exists? Use `journal.html` as base, or add `Blog` tab that loads `journal-entries.json`.

### 1.6 Social Media Aspect
- **Graft from Product Hunt/Civitai**
- **MVP:** Per-card **♡ Like** (done), **⬇ Downloads** (live), **💬 Comments** (giscus count), **🔗 Share** (copy link + X/Telegram), **Follow** (`profile.html` follow user → `localStorage:following`), **Feed** (`Trending` already, add `Following` tab).
- **Full:** Webhooks to X/Telegram on new soul publish (already `index.html:855` Telegram forward).

---

## 2. INFORMATION ARCHITECTURE — NEW TABS

```
Existing: All | Trending | Souls | Skills | Packs | Worlds | Chambers | Infra | Roles | Combos | Workbench
Add:      Chat | Discussions | Posts | Organizations | Blog | Social (or Feed)

Order for one-click soul complete:
All | Trending | Souls | Workbench | Chat | Discussions | Posts | Blog | Organizations
```

- **Chat** — realtime (giscus or Supabase)
- **Discussions** — threaded (GitHub Discussions)
- **Posts** — user showcase (data/posts.json)
- **Organizations** — Collectives filter (PLT Press, Soul Foundry)
- **Blog** — journal-entries + doctrine
- **Social/Feed** — Following + likes + shares

All tabs reuse `filterAndRender()` pattern — new `type: chat|post|blog` or virtual tabs that load external data.

---

## 3. DATA MODEL (No Backend MVP)

```json
// data/catalog.json (already) — add for social
{ "author": "profit-prime", "collective": "PLT Press", "likes": 23, "downloads": 3, "comments": 5 }

// data/posts.json (new)
{ "id": "post-001", "author": "craig", "title": "My first soul", "body": "...", "soul": "Architect", "likes": 4, "created": "2026-09-06" }

// localStorage (already)
soulUser, soulEmail, soulLikes, mySouls, pendingSouls, following: ["profit-prime"], soulChats: { "Architect": [{user, text, ts}] }
```

GitHub as backend: Discussions API (`/repos/.../discussions`), Releases API (downloads), Pages (hosting). No server until we need realtime.

---

## 4. IMPLEMENTATION PHASES — TAB BY TAB

| Phase | Tab | Build | Effort |
|---|---|---|---|
| **6a** | **Chat** | `Chat` tab + `giscus` embed (or `supabase` stub) + Guide agent also answers from chat history | 1 commit |
| **6b** | **Discussions** | `Discussions` tab → fetch `api.github.com/repos/.../discussions` → thread list + per-card 💬 button | 1 commit |
| **6c** | **Posts** | `Posts` tab + `data/posts.json` + `profile.html` Publish type=post | 1 commit |
| **6d** | **Organizations** | Add `collective` to catalog, `Organizations` tab filter + collective cards, `profile.html` collective field | 1 commit |
| **6e** | **Blog** | `Blog` tab → `data/journal-entries.json` render (reuse `journal.html` style) | 1 commit |
| **6f** | **Social** | `Feed` tab (Following + likes), Share buttons, Follow on profile, `Trending` already done | 1 commit |

Each phase = 1 commit, tab-by-tab, site stays live — like we did Souls→Roles→Skills.

---

## 5. HOSTING — HOW CHAT STAYS LIVE

- **Static (now):** giscus = GitHub Discussions as chat DB — free, no server, auth via GitHub.
- **Realtime (when you need):** Supabase (1 table `chats`, Realtime on) — 1 env var, `profile.html` already has `soulUser`. Cost $0 until 50k users.
- **Workbench (now):** Codespaces (ephemeral) + local exe + optional Fly.io 24/7 (1 `fly.toml`).

---

## 6. FOR ANY AGENT — GRAFT RULES

1. **Steal mechanic, not UI.** HF card header → our `card-hf` (author/license/tags/downloads/likes). Discord chat → our `Chat` tab with `soulUser`.
2. **GitHub is the backend.** Pages + Releases + Discussions + Codespaces = free hub. No new server until 1000 users.
3. **One click soul complete.** Every new tab must work with `localStorage` first, GitHub API second, Supabase third.
4. **Tab-by-tab.** One commit per tab. Never break `render()` — Guide HTML stays outside `<script>`.
5. **All roads lead to Soul Economy.** Blog, Chat, Discussions all link back to soul cards + Workbench tab + Profile Publish.

---

*— Profit Prime — Soul Economy Grafting Bible — 2026-09-06 — All roads lead to the Soul Economy.*
