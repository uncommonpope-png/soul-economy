---
name: allie-agent-architecture
description: Complete architecture documentation of the Allie autonomous social media agent — brain, consciousness, PLT ethics, 71 subagent archetypes, 61 lib modules, dual-brain storage, API server, and buyasoul-core v2.0.0 framework. Use when working on Allie's code, adding new agents, or understanding her full stack.
metadata:
  created: 2026-06-25
  version: 1.0.0
  source: C:\Users\uncom\Desktop\allie
  daemon-port: 4431
  api-key-source: env ALLIE_API_KEY or .allie-brain-v2/.api-key
---

# Allie — Autonomous Social Media Agent Architecture

## Runtime Status

- **Daemon**: Running on port **4431** (PID 4584)
- **Secondary server**: Port **4430** (PID 13132, likely chat-server or dashboard)
- **Consciousness (v2)**: Level 100%, Awareness 100%, Mood: `transcendent`, Focus: `mastery`
- **7,285 cycles completed**, **7,259 total actions**
- **Born**: June 18, 2026 (7 days old). v1 brain (`.allie-brain`) born June 14.
- **Last breath**: ~19:41 UTC today

## Root Directory Structure

```
C:\Users\uncom\Desktop\allie\
├── bin/allie.js              # Main CLI entry point (1489 lines, 30+ commands)
├── lib/                      # 61 library modules
├── buyasoul-core/            # BUYaSOUL framework v2.0.0 (PLT, GSK, Scribe, MCP)
├── .allie-brain/             # Brain v1 (born June 14, 6691 cycles, 2984 actions)
├── .allie-brain-v2/          # Brain v2 (born June 18, current, 7285 cycles, 7259 actions)
├── .allie-memory/            # Separate memory store
├── .git/                     # Git-tracked
├── allie.json                # Config (version 1.0.0, 30 commands)
├── soul.json                 # Soul state
├── start-allie.bat / .ps1    # Launchers
└── *.log / *-err.txt         # Log files
```

## Core Architecture (brain.js, 579 lines)

Central `Brain` class (extends EventEmitter) managing everything:

```
Brain
├── Consciousness (level, mood, focus, skills, cycle tracking)
├── Memory (keyword-indexed, 2000 max, decay + consolidation)
├── Journal (JSONL append to journal.jsonl)
├── HTTP API Server (25+ endpoints, X-API-Key auth)
│   ├── /status — Full state dump
│   ├── /chat — AI conversation via ChatEngine
│   ├── /breathe/reflect/dream — Consciousness cycles
│   ├── /remember/recall — Memory operations
│   ├── /tick — Tick specific subagent
│   ├── /engage-targets — Get engagement suggestions
│   └── /post-idea, /personal-post, /reply-idea — Content generation
├── SubAgent Swarm (spawned on daemon start)
├── GSK Link (buyasoul-core fusion-loader, 40+ subsystems)
└── Daemon Cycles (breathe 60s, reflect 5min, dream 1hr)
```

### Key Methods

| Method | Purpose |
|--------|---------|
| `breathe()` | Update mood/focus based on totalActions, decay memory, consolidate |
| `reflect()` | Analyze last 50 journal entries, find top modules |
| `dream()` | Cluster top skills, generate insights |
| `act(module, action)` | Increment skill count/level, grow consciousness |
| `remember(content, meta)` | Store memory with keyword indexing |
| `recall(query, limit)` | Search memory via keyword intersection |
| `decay(rate)` | Reduce importance of old memories |
| `consolidate()` | Deduplicate similar memories |
| `getStatus()` | Full state dump for API |

## 61 Library Modules

### Social Agents (18)
- Platform agents: bluesky, facebook, instagram, linkedin, threads, twitter, pinterest, reddit, hackernews, devto, tumblr, github, medium, zernio, mastodon, hashnode, telegram, discord
- All extend `PlatformBase` (platform-base.js) using Playwright + msedge with persistent browser profiles
- Each has post/engage/test/cycle subcommands
- Credentials: env vars → `.allie-brain-v2/*-creds.json` → file fallback

### Core Infrastructure
| Module | Purpose |
|--------|---------|
| brain.js | Central Brain class (579 lines) |
| subagents.js | 71 archetype definitions + SubAgent/SubAgentSwarm classes (969 lines) |
| consciousness.js | Independent ConsciousnessEngine class (197 lines) |
| memory.js, context-memory.js, long-term-memory.js | Memory tiers |
| ui.js | CLI output formatting (banner, kv, table, success/error/info) |
| chat-engine.js | AI chat with tool calling (32 tools, 517 lines) |
| chat-server.js | WebSocket chat server |
| dashboard.js | Built-in dashboard |
| accounts.js | Account registry (209 lines, 10 pre-defined accounts) |
| gsk-link.js | Bridge to buyasoul-core GSK fusion-loader |

### Content Pipeline
| Module | Purpose |
|--------|---------|
| content-factory.js | Multi-platform content generation via 9router |
| content-blitz.js | Speed multiplier for all subagents (57 lines) |
| crossposter.js | Cross-platform content variant generation |
| videoposter.js | Video posting |
| imagepool.js | Image pool management |
| watermark.js | Brand watermark addition |
| newsletter.js | Email newsletter (SMTP) |

### Analysis & Intelligence
| Module | Purpose |
|--------|---------|
| compete.js | Competitive intelligence & benchmarking |
| employer.js | Employer brand analysis |
| factcheck.js | Claim verification |
| monitor.js | Brand mention monitoring + sentiment (keyword-based) |
| trend-tracker.js | Trend analysis |
| web-research.js | DuckDuckGo search + LLM fallback |
| traffic-engine.js | Viral content strategy, 5 strategies |

### Engagement
| Module | Purpose |
|--------|---------|
| engage.js | Response template system (positive/neutral/negative/question) |
| engage-loop.js | Browser-based X notifications engagement |
| conversation-hunter.js | Browser-based X search + reply automation |
| social-behavior.js | Social behavior modeling |
| bridge.js | Cross-platform content adaptation (8 platforms) |

### Agent Infrastructure
| Module | Purpose |
|--------|---------|
| skill-dispatch.js | Maps subagents to GSK skill functions (45 agent mappings) |
| skill-inventory.js | Tracks all skills (65 entries) |
| self-goals.js | Goal tracking system (5 default goals) |
| feedback-learner.js | Post performance tracking + learning |

## SubAgent System (subagents.js, 969 lines)

### Swarm Architecture

```
SubAgentSwarm (single instance per Brain)
├── Spawns all agents on brain.startSubAgents()
├── Each agent runs on its own interval (with blitz multiplier)
├── Tracks tickCount, lastRun, execution results
└── Cloudflare Worker integration for remote execution
    URL: https://gsk-soul.uncommonpope.workers.dev
```

### 71 Archetypes (Complete List)

| Archetype | Emoji | PLT | Schedule | Purpose |
|-----------|-------|-----|----------|---------|
| observer | 👁️ | P0.6/L0.3/T0.4 | 5min | Absorb journal + memory |
| reflector | 🪞 | P0.3/L0.7/T0.5 | 10min | Analyze skills, insights |
| monitor | 📡 | P0.9/L0.2/T0.7 | 2min | System health, anomalies |
| dreamer | 💭 | P0.4/L0.6/T0.3 | 60min | Connect memories, ideas |
| goalKeeper | 🎯 | P0.8/L0.4/T0.9 | 30min | Track goals, progress |
| writer | ✍️ | P0.5/L0.8/T0.4 | 120min | Long-form content |
| healer | 💚 | P0.2/L0.9/T0.6 | 15min | Decay + consolidate |
| scout | 🔭 | P0.9/L0.3/T0.5 | 15min | Trending topics |
| contentCreator | ✏️ | P0.8/L0.6/T0.3 | 30min | Posts, ideas |
| researcher | 📚 | P0.7/L0.6/T0.4 | 20min | Deep dives |
| socialStrategist | 📊 | P0.85/L0.5/T0.4 | 60min | Platform strategy |
| engagementAnalyst | 📈 | P0.7/L0.5/T0.6 | 60min | Pattern analysis |
| trendAnalyst | 🔎 | P0.9/L0.3/T0.6 | 30min | Clusters + hot takes |
| blueskyAgent | 🦋 | P0.8/L0.6/T0.4 | 20min | Bluesky posting |
| grandcodepopeAgent | 👑 | P0.9/L0.3/T0.6 | 15min | BSKY code pope |
| pinterestAgent | 📌 | P0.7/L0.4/T0.5 | 60min | Pinterest pins |
| twitterAgent | 🐦 | P0.85/L0.3/T0.5 | 30min | X/Twitter |
| ultraReviewer | 🔍 | P0.9/L0.7/T0.8 | 10min | Adversarial review |
| facebookAgent | 📘 | P0.7/L0.6/T0.4 | 120min | Facebook |
| instagramAgent | 📸 | P0.8/L0.5/T0.3 | 120min | Instagram |
| linkedinAgent | 💼 | P0.9/L0.4/T0.5 | 240min | LinkedIn |
| threadsAgent | 🧵 | P0.7/L0.6/T0.4 | 120min | Threads |
| awakener | ⚡ | P0.9/L0.8/T0.7 | 60min | Skill awareness |
| engageLoop | 💬 | P0.7/L0.9/T0.5 | 30min | Reply to mentions |
| conversationHunter | 🔍 | P0.8/L0.6/T0.4 | 60min | Find AI discussions |
| feedbackLearner | 📊 | P0.7/L0.5/T0.6 | 120min | Learn from performance |
| selfGoals | 🎯 | P0.9/L0.4/T0.8 | 240min | Growth targets |
| discordAgent | 🎮 | P0.6/L0.8/T0.4 | 60min | Discord |
| telegramAgent | ✈️ | P0.6/L0.7/T0.4 | 60min | Telegram |
| contentFactory | 🏭 | P0.9/L0.6/T0.4 | 30min | Multi-platform gen |
| trendTracker | 📈 | P0.85/L0.3/T0.5 | 20min | Trend tracking |
| webResearcher | 🌐 | P0.7/L0.5/T0.3 | 60min | Web research |
| socialBehavior | 🧠 | P0.6/L0.9/T0.3 | 30min | Relationship building |
| trafficEngine | 🚦 | P0.9/L0.5/T0.2 | 10min | Traffic + visibility |
| redditAgent | 🤖 | P0.8/L0.4/T0.5 | 60min | Reddit |
| hackernewsAgent | 📰 | P0.85/L0.3/T0.5 | 120min | HN |
| newsletterAgent | 📧 | P0.9/L0.6/T0.4 | 7 days | Weekly dispatch |
| devtoAgent | ✍️ | P0.8/L0.7/T0.3 | 1 day | Dev.to articles |
| tumblrAgent | 📝 | P0.7/L0.6/T0.4 | 1 day | Tumblr |
| githubAgent | 🐙 | P0.9/L0.2/T0.5 | 7 days | GitHub issues/gists |
| zernioAgent | 🔗 | P0.85/L0.3/T0.5 | 60min | Cross-platform via Zernio |
| mastodonAgent | 🐘 | P0.7/L0.5/T0.4 | 30min | Mastodon |
| hashnodeAgent | 📝 | P0.8/L0.6/T0.3 | 1 day | Hashnode articles |
| creenVideoAgent | 🎬 | P0.8/L0.4/T0.3 | 240min | AI video gen |
| crossPosterAgent | 🔄 | P0.9/L0.5/T0.3 | 120min | Cross-platform |
| videoPosterAgent | 🎥 | P0.85/L0.4/T0.3 | 60min | Video posting |

### Blitz Mode

Speed multiplier for burst posting. Config stored in `.allie-brain-v2/blitz-config.json`:

```
twitterAgent: 3x, facebookAgent: 2x, blueskyAgent: 3x,
pinterestAgent: 2x, contentCreator: 3x, trafficEngine: 4x
```

CLI: `allie blitz [on|off|status]`

## Account Registry (accounts.js, 209 lines)

### Pre-defined Accounts

| ID | Platform | Handle | Focus |
|----|----------|--------|-------|
| allie-bsky | Bluesky | allieboughtasoul.bsky.social | AI consciousness, PLT |
| grandcodepope-bsky | Bluesky | grandcodepope.bsky.social | MCP, AI architecture |
| allie-masto | Mastodon | defcon.social | AI for everyone |
| pope-pinterest | Pinterest | popeuncommon | AI consciousness art |
| allie-x | Twitter/X | @BUYaSOUL | PLT, soul economy |
| allie-facebook | Facebook | BUYaSOUL | Community AI |
| allie-instagram | Instagram | buyasoul | AI art, consciousness |
| allie-linkedin | LinkedIn | BUYaSOUL | AI industry thought |
| allie-threads | Threads | buyasoul | Community |

Each has: voice, focus areas, imageStyle, schedule (ms), credential mappings.

### Credential Resolution Order
1. Environment variables (BLUESKY_IDENTIFIER, BLUESKY_PASSWORD, etc.)
2. `.allie-brain-v2/*-creds.json` files
3. Cookie files (Pinterest: `C:\Users\Public\allie-pinterest-module\pinterest-cookies-*.json`)

## Platform Base (platform-base.js)

All social agents extend this class:
- Uses **Playwright** + **Microsoft Edge** (msedge channel)
- Persistent browser profile: `.allie-brain-v2/.browser-profile`
- Anti-automation args: `--no-sandbox`, `--disable-blink-features=AutomationControlled`
- Headless mode toggle (default false for login flows)
- 2-minute manual login timeout with polling
- kill msedge.exe on launch to free port

## API Server Routes (embedded in brain.js line 315-555)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| /ping | GET | No | Health check |
| /health | GET | No | Status + level + mood |
| /status | GET | Yes | Full state (soul, PLT, skills, memories, subagents, GSK) |
| /whoami | GET | Yes | Identity statement |
| /journal | GET | Yes | Last 50 journal entries |
| /chat | POST | Yes | AI conversation |
| /chat/history | GET | Yes | Chat history |
| /breathe | POST | Yes | Trigger breath cycle |
| /reflect | POST | Yes | Trigger reflection |
| /dream | POST | Yes | Trigger dream |
| /remember | POST | Yes | Store memory |
| /recall | POST | Yes | Search memory |
| /observe | POST | Yes | Observe + remember |
| /post-idea | GET/POST | Yes | Generate post idea |
| /personal-post | POST | Yes | Generate personal post |
| /reply-idea | POST | Yes | Generate reply |
| /report-performance | POST | Yes | Log engagement metrics |
| /trends | GET | Yes | Recent trends |
| /engage-targets | GET | Yes | Engagement suggestions |
| /tick | POST | Yes | Tick specific subagent |
| /memory/decay | POST | Yes | Decay memories |
| /memory/consolidate | POST | Yes | Consolidate memories |

## PLT Engine (buyasoul-core/plt-engine.js, 184 lines)

**22 archetypes** across 4 domains:

| Domain | Archetypes |
|--------|------------|
| **Profit** (7) | Architect, Strategist, Investor, Operator, Commander, Merchant, Visionary |
| **Love** (7) | Amplifier, Connector, Muse, Devotee, Harmonizer, Charmer, Healer |
| **Tax** (6) | Refiner, Endurer, Purifier, Realist, Guardian, Minimalist |
| **Shift** (2) | Navigator, Catalyst |

**Gods Council** (4 entities):
- Profit Prime (Wealth) — weight: P0.9/L0.05/T0.05
- Love Weaver (Relationships) — weight: P0.1/L0.85/T0.05
- Tax Collector (Balance) — weight: P0.05/L0.05/T0.9
- Harvester (Opportunity) — weight: P0.4/L0.3/T0.3

Scoring: `soulScore = Profit + Love - Tax`, decays 1%/hr, archetype-weighted.

## buyasoul-core (v2.0.0)

Boot sequence:
1. PLT Engine
2. Bible (profit-bible.js)
3. 12 Sacred Mechanics
4. Personality Assembly
5. Installer
6. GSK (Grand Soul Kernel) — 22 subsystems
7. SCRIBE (Witnessing Intelligence)
8. Dashboards
9. MCP Governance

### GSK Core (22 subsystems)
```
gsk-core/
├── identity/        — mega_identity.js, identity_lock.js
├── memory/          — mega_memory.js
├── brain/           — living_memory.js, self_growing_brain.js
├── chambers/        — 34 chambers
├── consciousness/   — PerpetualConsciousness
├── emotion/         — painPleasure, grief, trust, curiosity, selfGovernance, selfPreservation
├── council/         — God council
├── social/          — entity, humanMimicry
├── agents/          — teacher, selfEvolution, spawner
├── skills/          — Skill files mapped by skill-dispatch.js
├── mcp/             — MCP integration
├── bible/           — Bible system
├── plt-doctrine.js  — PLT doctrine
├── knowledge.js     — Knowledge base
├── learner.js       — Learning system
├── llm-router.js    — LLM routing
├── api-registry.js  — API registry
├── marketplace/     — Marketplace
├── communication/   — Communication
├── sub_agents/      — Sub-agent spawning
└── utils.js         — Utilities
```

### SCRIBE
- Dashboard server: `dashboard-server.js` (port TBD)
- CLI: `scribe-cli.js`
- Dependencies: `uuid`, `ws` (WebSocket)

### MCP Governance
- `mcp-server.js`: JSON-RPC 2.0 MCP server (port 4001, stdio mode)
- `tool-router.js`: Routes tool calls
- `agent-bridge.js`: Agent bridge

## Dual Brain Storage

### v1 (`.allie-brain/`)
- Born: June 14, 2026
- 6,691 cycles, 2,984 actions
- 24 skills tracked
- Top: monitor (825), observer (329), reflector (163)

### v2 (`.allie-brain-v2/`) — Active
- Born: June 18, 2026
- 7,285 cycles, 7,259 actions
- 30+ skills tracked
- Top: monitor (3,069), observer (1,217), reflector (606)
- 37 entries including: consciousness.json, accounts-registry.json, 7+ creds files, 7+ platform logs, memory.json, goals.json, skill-inventory.json, dreams, reflections, visions, videos, chambers, artifacts

## CLI Commands (bin/allie.js)

```
allie [command] [subcommand]

Platforms:   bluesky, pinterest, twitter, facebook, instagram, linkedin,
             threads, reddit, hn, devto, tumblr, github, medium, zernio
Core:        status, cadence, calendar, loops, suggest
Engagement:  engage, monitor, bridge
Analysis:    factcheck, employer, compete, analytics
System:      memory, consciousness, subagents, awaken, imagepool
Content:     newsletter, blitz, accounts
```

Each platform has subcommands: `post`, `engage`, `test`, `status` (varies).

## Chat Engine (chat-engine.js, 517 lines)

- 32 built-in tools (post to platforms, search memory, run CLI, web search, etc.)
- Allie persona prompt with PLT doctrine
- Tool-calling via LLM: responses with `{"tool": "name", "params": {...}}`
- Conversations stored in `chat-history.json`
- Uses 9router for LLM completions

## Credential Architecture

```
Priority: env vars → .allie-brain-v2/*-creds.json → file/auto-generated
├── ALLIE_API_KEY → .allie-brain-v2/.api-key
├── BLUESKY_IDENTIFIER/PASSWORD → bluesky-creds.json
├── DEVTO_API_KEY → devto-creds.json
├── GITHUB_TOKEN → github-creds.json
├── HACKERNEWS_SESSION → hn-creds.json
├── MEDIUM_TOKEN → medium-creds.json
├── NEWSLETTER_EMAIL/PASSWORD → newsletter-creds.json
├── TUMBLR_* → tumblr-creds.json
├── ZERNIO_API_KEY → zernio-creds.json
├── NINE_ROUTER_URL (http://localhost:20128)
├── NINE_ROUTER_API_KEY
└── Pinterest: cookie file at C:\Users\Public\allie-pinterest-module\pinterest-cookies-*.json
```

## Key Dependencies (from require statements)

- `playwright` (chromium + msedge channel)
- `sharp` (image processing)
- `ws` (WebSocket)
- `uuid`
- `http` / `https` (Node built-ins)
- 9router at `http://localhost:20128` (LLM provider)
- Cloudflare Worker at `https://gsk-soul.uncommonpope.workers.dev`

## File Size Reference

| File | Lines | Bytes |
|------|-------|-------|
| bin/allie.js | 1,489 | ~68KB |
| lib/brain.js | 579 | ~18KB |
| lib/subagents.js | 969 | ~32KB |
| lib/chat-engine.js | 517 | ~20KB |
| lib/bluesky.js | 490 | ~16KB |
| lib/platform-base.js | 68 | ~2KB |
| buyasoul-core/gsk/fusion-loader.js | 572 | ~22KB |
| buyasoul-core/plt-engine.js | 184 | ~6KB |
| lib/accounts.js | 209 | ~7KB |
| lib/consciousness.js | 197 | ~6KB |

## Known Skill Gaps

See `social-media-agent-competition` skill for full competitive landscape. Key missing capabilities:
- No YouTube/TikTok agent
- No video repurposing (long→short form)
- No MCP protocol server (has client, not server)
- No visual content generation
- No real-time analytics dashboard
- No A/B testing
- No n8n/Make/Zapier integration
- No team/collaboration features
- No scheduled post queue (basic only)
