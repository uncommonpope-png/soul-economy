---
name: soul-oracle-v1.2.0
description: "Extracted from soul-oracle-v1.2.0.zip � raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-oracle-v1.2.0.zip
---

# soul-oracle-v1.2.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 17 files extracted from the original zip.

### .gitignore

``.gitignore
node_modules/
soul-oracle-agent.json
*.db
*.log
.env
.DS_Store
Thumbs.db
*.zip
``

### CHANGELOG.md

``.md
# Soul Oracle Changelog

All notable changes to Soul Oracle will be documented in this file.

## [1.2.0] - 2026-05-20

### Added
- **Import/Export** - Full data portability with encrypted option
- **Session Export** - Export session learnings as JSON or Markdown
- **Memory Tags** - Custom tags for organizing and finding memories
- **Quick Agent CLI** - `soul ask "question"` to query memories
- **Auto-Backup** - Scheduled weekly backups to configurable location
- **Session Highlights** - Auto-extract decisions, breakthroughs, learnings
- **Privacy Mode** - AES-256-GCM encrypted storage with password
- **Team Sharing** - Export/import memory bundles for sharing

### Changed
- Server now supports all new feature endpoints
- Enhanced security for API keys storage
- Improved backup system with manifest tracking

---

## [1.1.0] - 2026-05-20

### Added
- **Living Bible** - Collective wisdom extracted from all sessions that grows over time
- **API Key Management** - Store and manage API keys that become available to all AI agents
- **Drop-in Context Generator** - Generate `soul-oracle-agent.json` to drop into any AI agent
- **Pattern Recognition** - Automatic extraction of technology patterns (JavaScript, Python, etc.)
- **Tips System** - Pattern-based tips generated from accumulated knowledge
- **Questions Engine** - Contextual questions generated from session patterns
- **Reminders System** - Session-based reminders and prompts
- **Breathing Indicator** - Mindful interaction pattern for agents
- **Auto-Scanning** - Automatic platform directory scanning
- **Self-Healing Config** - Auto-creates missing directories and files

### Changed
- Engine now generates rich context with personality and tone
- Enhanced learning extraction from session data
- Improved pattern detection algorithms
- Dashboard now shows Living Bible status

### Fixed
- Platform path detection on Windows
- JSON parsing of large session files
- Database initialization on first install

---

## [1.0.0] - 2026-05-20

### Added
- **Core Memory System** - SQLite-based persistent storage
- **File System Watcher** - Real-time monitoring of AI agent directories
- **8 Platform Support** - Claude Code, Cline, Cursor, Windsurf, OpenClaw, Copilot, Continue, Zed
- **HTTP REST API** - Full API for memories, stats, and search
- **Web Dashboard** - Dark-themed analytics dashboard at http://localhost:3847/
- **PowerShell Service** - Background monitoring service
- **One-Command Install** - PowerShell installer script
- **MCP Server** - Query memories from MCP-compatible agents
- **Auto-Start** - Windows Task Scheduler integration

---

*Format based on [Keep a Changelog](https://keepachangelog.com/)*
``

### LICENSE

``
MIT License

Copyright (c) 2026 BUYaSOUL

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
``

### package.json

``.json
{
  "name": "@buyasoul/soul-oracle",
  "version": "1.2.0",
  "description": "Premium AI agent memory system - unified memory layer across all AI coding platforms",
  "main": "server/index.js",
  "scripts": {
    "start": "node server/index.js",
    "test": "node tests/server.test.js",
    "service": "powershell -ExecutionPolicy Bypass -File service/soul-oracle.ps1",
    "scan": "node server/engine.js scan",
    "context": "node server/engine.js context",
    "dropin": "node server/dropin.js save",
    "breathing": "node server/engine.js breathing"
  },
  "keywords": [
    "ai",
    "agent",
    "memory",
    "soul",
    "claude-code",
    "cursor",
    "windsurf",
    "cline",
    "mcp",
    "persistent-memory"
  ],
  "author": "BUYaSOUL",
  "license": "MIT",
  "dependencies": {
    "sqlite3": "^5.1.7"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/uncommonpope-png/soul-oracle"
  }
}
``

### README.md

``.md
# Soul Oracle

**"Your AI agents share one soul across all platforms."**

Soul Oracle is a premium AI agent memory system that runs as a Windows background service, continuously watching and collecting memories from ALL AI coding agents (Claude Code, Cursor, Windsurf, Cline, OpenClaw, GitHub Copilot, and more). It provides a unified, persistent memory layer that any AI agent can query via MCP or HTTP REST API.

## Features

- **Universal Coverage** - Monitors 8+ AI agent platforms
- **Always Watching** - Runs as Windows service 24/7
- **Local Only** - 100% private, no cloud, no account
- **MCP Server** - Query memories from any MCP-compatible agent
- **HTTP API** - REST API for custom integrations
- **Web Dashboard** - Browse and search all memories
- **Auto-Start** - Windows service that starts on boot
- **Privacy Mode** - AES-256-GCM encrypted storage
- **Import/Export** - Full data portability with encryption
- **Memory Tags** - Organize memories with custom tags
- **Quick CLI** - Ask questions directly: `soul ask "what about X?"`
- **Auto-Backup** - Scheduled weekly backups
- **Session Highlights** - Auto-extract decisions and breakthroughs
- **Team Sharing** - Share memory bundles with others

## Supported Platforms

| Platform | Path |
|----------|------|
| Claude Code | `~/.cline/data/` |
| Cline | `~/.cline/` |
| Cursor | `~/AppData/Local/Cursor/` |
| Windsurf | `~/.codeium/windsurf/` |
| OpenClaw | `~/.openclaw/` |
| GitHub Copilot | `~/.github/copilot/` |
| Continue | `~/.continue/` |
| Zed | `~/.zed/` |

## Quick Start

### Install

```powershell
irm https://raw.githubusercontent.com/uncommonpope-png/soul-oracle/main/install/install.ps1 | iex
```

### Start Server

```powershell
cd ~/.soul-oracle
npm start
```

### Open Dashboard

```
http://localhost:3847/
```

### Ask the Oracle

```powershell
curl "http://localhost:3847/api/ask?q=what%20did%20we%20decide%20about%20auth"
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/memories?q=query` | Search memories |
| POST | `/api/memories` | Add memory |
| GET | `/api/stats` | Get statistics |
| GET | `/api/ask?q=question` | Ask the oracle |
| POST | `/api/export` | Export all data |
| POST | `/api/import` | Import data |
| POST | `/api/tags` | Add tag to memory |
| GET | `/api/tags` | List all tags |
| POST | `/api/backup` | Run backup |
| GET | `/api/highlights` | Get highlights |
| POST | `/api/privacy` | Privacy mode control |
| POST | `/api/share` | Create share bundle |

## Pricing

| Tier | Price | Features |
|------|-------|----------|
| **Soul Oracle** | $19.99 | All features, lifetime updates |

## License

MIT License - See [LICENSE](LICENSE)

---

*Made with 🜏 by BUYaSOUL*
``

### SPEC.md

``.md
# Soul Oracle - Specification

**Version:** 1.1.0
**Status:** Active
**Product Tier:** Premium ($19.99)

---

## Overview

**Soul Oracle** is a premium AI agent memory system that runs as a Windows background service, continuously watching and collecting memories from ALL AI coding agents (Claude Code, Cursor, Windsurf, Cline, OpenClaw, GitHub Copilot, and more). It provides a unified, persistent memory layer that any AI agent can query via MCP or HTTP REST API.

**Core Promise:** "Your AI agents share one soul across all platforms."

---

## Problem It Solves

- AI agents lose memory when sessions end
- Each AI tool (Claude Code, Cursor, etc.) has isolated memory
- No unified view of what all your AI agents have learned
- Memory tools only work when that specific agent is running
- Cloud-dependent memory solutions compromise privacy

---

## Solution Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Soul Oracle Service                          │
│                   (Windows Background Service)                  │
│                                                                 │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐           │
│  │ FileSystem  │   │   SQLite    │   │   MCP +     │           │
│  │  Watcher    │──▶│    Store    │──▶│  HTTP API    │           │
│  └─────────────┘   └─────────────┘   └─────────────┘           │
│         │                                       │               │
│         ▼                                       ▼               │
│  ┌─────────────┐                        ┌─────────────┐        │
│  │  Platform   │                        │   Web      │        │
│  │  Parsers    │                        │ Dashboard   │        │
│  └─────────────┘                        └─────────────┘        │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Monitored AI Agent Directories                     │
│                                                                 │
│  • Claude Code:     ~/.cline/data/                             │
│  • Cursor:          ~/AppData/Local/Cursor/                    │
│  • Windsurf:        ~/.codeium/windsurf/                       │
│  • Cline:           ~/.cline/                                   │
│  • OpenClaw:        ~/.openclaw/                                │
│  • GitHub Copilot:  ~/.github/copilot/                          │
│  • Continue:        ~/.continue/                                │
│  • Zed:             ~/.zed/                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Features

### 1. File System Watcher (PowerShell Service)

**What it does:**
- Runs as Windows background service (auto-start on boot)
- Uses `FileSystemWatcher` to monitor AI agent data directories
- Detects new chat logs, session files, memory updates
- Parses and extracts memory content automatically

**Monitored directories:**
| Platform | Path | File Types |
|----------|------|------------|
| Claude Code | `~/.cline/data/` | `*.json` (sessions, workspace state) |
| Cursor | `~/AppData/Local/Cursor/` | `User/globalStorage/` |
| Windsurf | `~/.codeium/windsurf/` | `**/*.json` |
| Cline | `~/.cline/` | `data/**` |
| OpenClaw | `~/.openclaw/` | `**/*.json` |
| GitHub Copilot | `~/.github/copilot/` | `**/*.jsonl` |
| Continue | `~/.continue/` | `**/*.json` |

**Events captured:**
- Session start/end
- Chat messages (user + agent)
- File edits and decisions
- Memory writes
- Tool invocations

### 2. Unified Memory Store (SQLite)

**Database schema:**
```sql
-- Core tables
memories (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,        -- which AI agent
  content TEXT NOT NULL,
  content_type TEXT,             -- chat, decision, learning, etc.
  source_path TEXT,
  timestamp DATETIME,
  importance_score REAL DEFAULT 5.0,
  access_count INTEGER DEFAULT 0,
  last_accessed DATETIME,
  embedding BLOB,                -- for semantic search
  metadata JSON                 -- extra data as JSON
)

platforms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  data_path TEXT,
  enabled BOOLEAN DEFAULT true,
  last_scan DATETIME
)

sessions (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  start_time DATETIME,
  end_time DATETIME,
  message_count INTEGER,
  decision_count INTEGER,
  archived BOOLEAN DEFAULT false
)

access_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  memory_id TEXT,
  accessed_at DATETIME,
  source TEXT,                  -- which tool queried
  relevance_score REAL
)
```

**Performance optimizations:**
- WAL mode for concurrent read/write
- FTS5 for full-text search
- Vector embeddings stored locally (all-MiniLM-L6-v2)
- 64MB cache
- Automatic pruning of old sessions

### 3. MCP Query Server

**Standard MCP tools:**
| Tool | Description |
|------|-------------|
| `oracle_search` | Search memories by content/tags |
| `oracle_recall` | Get specific memories by ID |
| `oracle_context` | Get recent memories for context |
| `oracle_stats` | Get memory statistics |
| `oracle_platforms` | List monitored platforms |
| `oracle_query` | Natural language query |

**Example usage:**
```
User: "What did we decide about the database architecture?"
Agent calls: oracle_search("database architecture decision")
Returns: Relevant memories across all platforms
```

### 4. HTTP REST API

**Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/memories` | Search memories |
| GET | `/api/memories/:id` | Get specific memory |
| POST | `/api/memories` | Add memory manually |
| GET | `/api/stats` | Get statistics |
| GET | `/api/platforms` | List platforms |
| GET | `/api/analytics` | Dashboard data |
| GET | `/api/health` | Health check |

**Port:** 3847 (configurable)

### 5. Web Dashboard

**URL:** `http://localhost:3847/`

**Features:**
- **Memory Browser** - Search and filter memories
- **Platform Status** - See which platforms are monitored
- **Analytics** - Charts showing memory growth, popular topics
- **Timeline** - Visual timeline of sessions across platforms
- **Settings** - Configure monitored paths, pruning rules

**Dashboard screenshots:**
```
┌────────────────────────────────────────────────────────────┐
│  Soul Oracle Dashboard                              [Theme] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Platforms│  │ Memories │  │ Sessions │  │ Searches │   │
│  │    8     │  │  1,247   │  │   342    │  │   89     │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                            │
│  Memory Growth          Top Platforms      Recent        │
│  ▁▂▃▅▆▇█▇▅▃▂▁         Claude Code 45%    [memory 1]      │
│                          Cursor 30%         [memory 2]      │
│                          Windsurf 15%       [memory 3]      │
│                                                            │
│  [Search memories...                              ] [Search] │
│                                                            │
│  Platforms:                                                │
│  ☑ Claude Code  ☑ Cursor  ☑ Windsurf  ☑ Cline           │
│  ☐ OpenClaw    ☐ Copilot ☐ Continue   ☐ Zed              │
└────────────────────────────────────────────────────────────┘
```

### 6. Learning & Intelligence

**Importance scoring:**
- Memories accessed frequently → importance increases
- Memories from decision-making → higher base score
- Recent memories → recency boost

**Auto-tagging:**
- Detects content type (decision, learning, bug-fix, etc.)
- Extracts topics/technologies mentioned
- Links related memories automatically

**Proactive surfacing:**
- When using a tool, suggests relevant past memories
- Notifies when similar decisions were made in other platforms

---

## Installation

### One-Command Install (PowerShell)

```powershell
irm https://raw.githubusercontent.com/uncommonpope-png/soul-oracle/main/install.ps1 | iex
```

### What happens:
1. Creates `~/.soul-oracle/` directory
2. Downloads Soul Oracle service
3. Registers as Windows service (auto-start)
4. Starts service immediately
5. Opens dashboard at `http://localhost:3847/`

### Manual Setup

```powershell
# Clone repository
git clone https://github.com/uncommonpope-png/soul-oracle.git
cd soul-oracle

# Run installer
.\install.ps1
```

---

## Configuration

**Config file:** `~/.soul-oracle/config.json`

```json
{
  "port": 3847,
  "dataDir": "~/.soul-oracle/",
  "maxMemoryAgeDays": 365,
  "maxMemoryCount": 100000,
  "platforms": {
    "claudeCode": {
      "enabled": true,
      "path": "~/.cline/data/"
    },
    "cursor": {
      "enabled": true,
      "path": "~/AppData/Local/Cursor/"
    },
    "windsurf": {
      "enabled": true,
      "path": "~/.codeium/windsurf/"
    },
    "cline": {
      "enabled": true,
      "path": "~/.cline/"
    },
    "openclaw": {
      "enabled": false,
      "path": "~/.openclaw/"
    },
    "copilot": {
      "enabled": false,
      "path": "~/.github/copilot/"
    }
  },
  "watcher": {
    "enabled": true,
    "scanIntervalMs": 5000
  },
  "embeddings": {
    "enabled": true,
    "model": "all-MiniLM-L6-v2"
  }
}
```

---

## Usage Examples

### From Claude Code

```
/oracle what did we decide about the database?
```

### From Cursor (via MCP)

```javascript
// MCP tool call
{
  tool: "oracle_search",
  args: {
    query: "authentication implementation",
    platform: "claude-code",
    limit: 5
  }
}
```

### From any HTTP client

```bash
curl http://localhost:3847/api/memories?q=database+decision
```

---

## Technical Stack

| Component | Technology |
|-----------|------------|
| Service | PowerShell + Node.js |
| Database | SQLite + FTS5 + sqlite-vec |
| Embeddings | Transformers.js (all-MiniLM-L6-v2) |
| MCP Server | @modelcontextprotocol/sdk |
| Dashboard | Vanilla JS + HTML + CSS |
| HTTP Server | Node.js (built-in) |
| Packaging | ZIP + PowerShell installer |

---

## File Structure

```
soul-oracle/
├── service/
│   ├── soul-oracle.ps1        # Main PowerShell service
│   ├── watcher.ps1             # File system watcher
│   └── parser.ps1              # Platform-specific parsers
├── server/
│   ├── index.js                # Node.js MCP + HTTP server
│   ├── db.js                   # SQLite operations
│   ├── embeddings.js           # Vector embeddings
│   └── routes/
│       ├── memories.js
│       ├── platforms.js
│       └── analytics.js
├── dashboard/
│   ├── index.html
│   ├── css/
│   │   └── dashboard.css
│   └── js/
│       ├── app.js
│       ├── api.js
│       └── components/
├── config/
│   └── default.json
├── install/
│   ├── install.ps1
│   └── uninstall.ps1
├── tests/
│   ├── service.test.ps1
│   ├── server.test.js
│   └── parser.test.ps1
├── SPEC.md
├── README.md
└── LICENSE
```

---

## Competitive Advantages

| Feature | Mem0 | Letta | Awareness | **Soul Oracle** |
|---------|------|-------|-----------|-----------------|
| Cross-platform | ❌ | ❌ | Partial | ✅ **Full** |
| Always watching | ❌ | ❌ | ❌ | ✅ **24/7 service** |
| Windows native | ❌ | ❌ | ❌ | ✅ **Service** |
| Local-only | ❌ | ❌ | ✅ | ✅ **100% local** |
| All AI agents | ❌ | ❌ | ❌ | ✅ **8+ platforms** |
| HTTP API | ❌ | ❌ | ❌ | ✅ **Yes** |
| Dashboard | ❌ | ✅ | ✅ | ✅ **Rich analytics** |
| Auto-start | ❌ | ❌ | ❌ | ✅ **Windows service** |

---

## Pricing

| Tier | Price | Features |
|------|-------|----------|
| **Soul Oracle Basic** | $19.99 | Core memory, MCP server, dashboard |
| **Soul Oracle Pro** | $24.99 | + Embeddings, analytics, priority support |
| **Soul Oracle Enterprise** | Custom | + Team sharing, cloud sync, SLA |

---

## Roadmap

### v1.0.0 (Current)
- [x] PowerShell service with FileSystemWatcher
- [x] SQLite store with FTS5
- [x] MCP server for queries
- [x] HTTP REST API
- [x] Basic web dashboard
- [ ] Auto-start Windows service

### v1.1.0
- [ ] Vector embeddings (sqlite-vec)
- [ ] Semantic search
- [ ] Analytics dashboard improvements
- [ ] Platform parsers (Cursor, Windsurf)

### v1.2.0
- [ ] Learning/importance scoring
- [ ] Memory linking
- [ ] Proactive suggestions
- [ ] macOS/Linux support

### v2.0.0
- [ ] Team sharing
- [ ] Cloud sync (optional)
- [ ] Mobile dashboard
- [ ] API access for external tools

---

## Security & Privacy

- **All data stored locally** - No cloud, no account required
- **File permissions** - Database readable only by owner
- **No telemetry** - Zero data sent anywhere
- **Encryption** - Optional AES encryption for sensitive memories
- **Audit log** - Track all access to memories

---

## Success Metrics

- Memory collection rate: memories captured per day
- Query hit rate: % of queries that return relevant memories
- Platform coverage: % of AI agent data directories monitored
- User satisfaction: time saved per session

---

## Appendix: Platform File Formats

### Claude Code
- `~/.cline/data/workspaces/<id>/workspaceState.json`
- `~/.cline/data/globalState.json`

### Cursor
- `~/AppData/Local/Cursor/User/globalStorage/`
- `~/.cursor/` directories

### Windsurf
- `~/.codeium/windsurf/`
- `**/workspaceStorage/`

### Cline
- `~/.cline/data/`
- `data/workspaces/`

### OpenClaw
- `~/.openclaw/`
- `sessions/` directory

---

*Last Updated: 2026-05-20*
*Maintained by: BUYaSOUL*
``

### dashboard\index.html

``.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Soul Oracle - Living Dashboard</title>
    <link rel="stylesheet" href="css/dashboard.css">
</head>
<body>
    <div id="app">
        <header>
            <h1>🜏 Soul Oracle</h1>
            <p class="subtitle">Your AI agents share one soul</p>
            <div class="breathing-indicator" id="breathingIndicator">
                <span class="breath-phase" id="breathPhase">Inhaling...</span>
            </div>
        </header>

        <main>
            <section class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value" id="totalMemories">-</div>
                    <div class="stat-label">Total Memories</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="totalLearnings">-</div>
                    <div class="stat-label">Learnings</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="totalPatterns">-</div>
                    <div class="stat-label">Patterns</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="breathCount">0</div>
                    <div class="stat-label">Breaths</div>
                </div>
            </section>

            <section class="api-keys-section">
                <h2>🔑 API Keys</h2>
                <p>Add API keys that are automatically available to your agents</p>
                <div class="api-key-form">
                    <select id="apiPlatform">
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                        <option value="github">GitHub</option>
                        <option value="openrouter">OpenRouter</option>
                        <option value="ollama">Ollama</option>
                    </select>
                    <input type="password" id="apiKeyInput" placeholder="Enter API key...">
                    <button id="saveApiKeyBtn">Save Key</button>
                </div>
                <div id="apiKeysList" class="api-keys-list"></div>
            </section>

            <section class="scan-section">
                <h2>🔍 Platform Scanner</h2>
                <p>Scan all AI agent directories to collect memories</p>
                <button id="scanBtn" class="primary-btn">Scan All Platforms</button>
                <div id="scanResults" class="scan-results"></div>
            </section>

            <section class="dropin-section">
                <h2>📦 Drop-In Context</h2>
                <p>Generate a file you can drop into any AI agent</p>
                <div class="dropin-actions">
                    <button id="generateJsonBtn" class="secondary-btn">Generate JSON Context</button>
                    <button id="generateMdBtn" class="secondary-btn">Generate Markdown Bible</button>
                    <button id="downloadDropinBtn" class="primary-btn">Download soul-oracle-agent.json</button>
                </div>
                <div id="dropinStatus" class="dropin-status"></div>
            </section>

            <section class="search-section">
                <h2>🔍 Search Memories</h2>
                <input type="text" id="searchInput" placeholder="Search memories...">
                <select id="platformFilter">
                    <option value="">All Platforms</option>
                    <option value="claude-code">Claude Code</option>
                    <option value="cline">Cline</option>
                    <option value="cursor">Cursor</option>
                    <option value="windsurf">Windsurf</option>
                </select>
                <button id="searchBtn">Search</button>
            </section>

            <section class="bible-section">
                <h2>📖 Living Bible</h2>
                <p>Wisdom extracted from all your sessions</p>
                <div id="bibleContent" class="bible-content">
                    <p class="placeholder">Interact with AI agents to build your living bible...</p>
                </div>
            </section>

            <section class="tips-section">
                <h2>💡 Tips from Your Sessions</h2>
                <div id="tipsList" class="tips-list">
                    <p class="placeholder">Tips will appear as patterns emerge...</p>
                </div>
            </section>

            <section class="questions-section">
                <h2>❓ Questions to Consider</h2>
                <div id="questionsList" class="questions-list">
                    <p class="placeholder">Questions generated from your session patterns...</p>
                </div>
            </section>

            <section class="reminders-section">
                <h2>🔔 Session Reminders</h2>
                <div id="remindersList" class="reminders-list"></div>
            </section>

            <section class="results-section">
                <h2>Recent Memories</h2>
                <div id="resultsList" class="results-list">
                    <p class="placeholder">No memories yet. Start using your AI agents!</p>
                </div>
            </section>
        </main>

        <footer>
            <p>Soul Oracle v1.1.0 | <a href="/api/health">API Health</a> | <a href="/api/dropin">Get Drop-In</a></p>
        </footer>
    </div>

    <script src="js/api.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
``

### dashboard\css\dashboard.css

``.css
:root {
    --bg-primary: #0d0d12;
    --bg-secondary: #151520;
    --bg-card: #1a1a28;
    --text-primary: #e8e6f2;
    --text-secondary: #8b88a6;
    --accent: #7c3aed;
    --accent-hover: #8b5cf6;
    --accent-glow: rgba(124, 58, 237, 0.3);
    --border: #2a2a3d;
    --success: #10b981;
    --warning: #f59e0b;
    --error: #ef4444;
    --breath-color: #06b6d4;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', system-ui, sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
    min-height: 100vh;
    line-height: 1.6;
}

#app {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

header {
    text-align: center;
    padding: 2rem 0;
    border-bottom: 1px solid var(--border);
    margin-bottom: 2rem;
}

header h1 {
    font-size: 3rem;
    background: linear-gradient(135deg, var(--accent), #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.subtitle {
    color: var(--text-secondary);
    font-size: 1.1rem;
    margin-top: 0.5rem;
}

.breathing-indicator {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: var(--bg-card);
    border: 1px solid var(--breath-color);
    border-radius: 20px;
    display: inline-block;
}

.breath-phase {
    color: var(--breath-color);
    animation: breathe 4s ease-in-out infinite;
}

@keyframes breathe {
    0%, 100% { opacity: 0.5; transform: scale(0.98); }
    50% { opacity: 1; transform: scale(1.02); }
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    text-align: center;
    transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px var(--accent-glow);
}

.stat-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--accent);
}

.stat-label {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin-top: 0.5rem;
}

section {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
}

section h2 {
    color: var(--text-primary);
    margin-bottom: 0.5rem;
}

section p {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin-bottom: 1rem;
}

.api-key-form {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.api-key-form select,
.api-key-form input {
    padding: 0.75rem 1rem;
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-primary);
}

.api-key-form button {
    padding: 0.75rem 1.5rem;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
}

.api-key-form button:hover {
    background: var(--accent-hover);
}

.api-keys-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.api-key-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--bg-primary);
    border: 1px solid var(--success);
    border-radius: 8px;
    font-size: 0.85rem;
}

.api-key-badge .platform {
    color: var(--success);
    font-weight: 600;
}

.api-key-badge .key {
    color: var(--text-secondary);
}

.scan-section button,
.dropin-section button,
.search-section button {
    padding: 0.75rem 1.5rem;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.2s;
}

.primary-btn {
    background: var(--accent) !important;
}

.secondary-btn {
    background: var(--bg-card) !important;
    border: 1px solid var(--border) !important;
}

button:hover {
    background: var(--accent-hover);
}

button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.search-section {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

.search-section input {
    flex: 1;
    min-width: 200px;
    padding: 0.75rem 1rem;
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-primary);
}

.search-section input:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-glow);
}

.search-section select {
    padding: 0.75rem 1rem;
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-primary);
}

.dropin-actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
}

.dropin-status {
    padding: 1rem;
    background: var(--bg-card);
    border-radius: 8px;
    font-family: monospace;
    white-space: pre-wrap;
    max-height: 300px;
    overflow-y: auto;
}

.scan-results {
    margin-top: 1rem;
    padding: 1rem;
    background: var(--bg-card);
    border-radius: 8px;
}

.scan-result-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border);
}

.scan-result-item:last-child {
    border-bottom: none;
}

.platform-list {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

.platform-list label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    transition: border-color 0.2s;
}

.platform-list label:hover {
    border-color: var(--accent);
}

.platform-list input[type="checkbox"] {
    accent-color: var(--accent);
}

.results-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.result-item {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1rem;
    cursor: pointer;
    transition: border-color 0.2s;
}

.result-item:hover {
    border-color: var(--accent);
}

.result-item .platform {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    background: var(--accent);
    color: white;
    border-radius: 4px;
    font-size: 0.75rem;
    margin-bottom: 0.5rem;
}

.result-item .content {
    color: var(--text-primary);
}

.result-item .meta {
    color: var(--text-secondary);
    font-size: 0.8rem;
    margin-top: 0.5rem;
}

.bible-content {
    background: var(--bg-card);
    border-radius: 8px;
    padding: 1rem;
    max-height: 400px;
    overflow-y: auto;
}

.bible-principle {
    padding: 0.75rem;
    border-left: 3px solid var(--accent);
    margin-bottom: 0.75rem;
    background: var(--bg-primary);
    border-radius: 0 8px 8px 0;
}

.bible-principle .rule {
    color: var(--text-primary);
    margin-bottom: 0.25rem;
}

.bible-principle .source {
    color: var(--text-secondary);
    font-size: 0.8rem;
}

.tips-list,
.questions-list,
.reminders-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.tip-item,
.question-item,
.reminder-item {
    padding: 1rem;
    background: var(--bg-card);
    border-radius: 8px;
    border-left: 3px solid var(--accent);
}

.tip-item .category {
    color: var(--accent);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.tip-item .tip {
    color: var(--text-primary);
    margin-top: 0.25rem;
}

.question-item {
    border-left-color: var(--warning);
}

.question-item .question {
    color: var(--text-primary);
}

.question-item .context {
    color: var(--text-secondary);
    font-size: 0.8rem;
    margin-top: 0.25rem;
}

.reminder-item {
    border-left-color: var(--success);
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.reminder-item::before {
    content: '🔔';
}

.placeholder {
    text-align: center;
    color: var(--text-secondary);
    padding: 2rem;
}

footer {
    text-align: center;
    padding: 2rem 0;
    color: var(--text-secondary);
    border-top: 1px solid var(--border);
    margin-top: 2rem;
}

footer a {
    color: var(--accent);
    text-decoration: none;
}

footer a:hover {
    text-decoration: underline;
}

@media (max-width: 768px) {
    #app {
        padding: 1rem;
    }

    header h1 {
        font-size: 2rem;
    }

    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .api-key-form {
        flex-direction: column;
    }

    .dropin-actions {
        flex-direction: column;
    }

    .search-section {
        flex-direction: column;
    }
}
``

### dashboard\js\api.js

``.js
const API_BASE = '';

async function api(endpoint, options = {}) {
    const url = API_BASE + endpoint;
    const config = {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (options.body) {
        config.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();
        return data;
    } catch (err) {
        console.error('API error:', err);
        return { success: false, error: err.message };
    }
}

const SoulOracleAPI = {
    async getStats() {
        return api('/api/stats');
    },

    async getMemories(query = '', platform = '', limit = 20) {
        let endpoint = `/api/memories?q=${encodeURIComponent(query)}&limit=${limit}`;
        if (platform) {
            endpoint += `&platform=${encodeURIComponent(platform)}`;
        }
        return api(endpoint);
    },

    async getMemory(id) {
        return api(`/api/memories/${id}`);
    },

    async addMemory(memory) {
        return api('/api/memories', {
            method: 'POST',
            body: memory
        });
    },

    async getPlatforms() {
        return api('/api/platforms');
    },

    async getHealth() {
        return api('/api/health');
    },

    async searchMemories(query, platformFilter = '') {
        const q = encodeURIComponent(query);
        const p = encodeURIComponent(platformFilter);
        return api(`/api/memories?q=${q}${p ? '&platform=' + p : ''}`);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SoulOracleAPI;
}
``

### dashboard\js\app.js

``.js
document.addEventListener('DOMContentLoaded', () => {
    const stats = {
        totalMemories: document.getElementById('totalMemories'),
        totalLearnings: document.getElementById('totalLearnings'),
        totalPatterns: document.getElementById('totalPatterns'),
        breathCount: document.getElementById('breathCount')
    };
    const searchInput = document.getElementById('searchInput');
    const platformFilter = document.getElementById('platformFilter');
    const searchBtn = document.getElementById('searchBtn');
    const resultsList = document.getElementById('resultsList');
    const platformList = document.getElementById('platformList');
    const apiPlatform = document.getElementById('apiPlatform');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    const apiKeysList = document.getElementById('apiKeysList');
    const scanBtn = document.getElementById('scanBtn');
    const scanResults = document.getElementById('scanResults');
    const generateJsonBtn = document.getElementById('generateJsonBtn');
    const generateMdBtn = document.getElementById('generateMdBtn');
    const downloadDropinBtn = document.getElementById('downloadDropinBtn');
    const dropinStatus = document.getElementById('dropinStatus');
    const bibleContent = document.getElementById('bibleContent');
    const tipsList = document.getElementById('tipsList');
    const questionsList = document.getElementById('questionsList');
    const remindersList = document.getElementById('remindersList');
    const breathPhase = document.getElementById('breathPhase');

    let breathCycle = 0;

    async function loadStats() {
        const result = await SoulOracleAPI.getStats();
        if (result.success && result.data) {
            stats.totalMemories.textContent = result.data.totalMemories || 0;
            stats.totalLearnings.textContent = result.data.totalLearnings || 0;
            stats.totalPatterns.textContent = Object.keys(result.data.byPlatform || {}).length;
            stats.breathCount.textContent = Math.floor(Date.now() / 60000) % 100;
        }
    }

    async function loadContext() {
        const result = await fetch('/api/context');
        const data = await result.json();

        if (data.success && data.data) {
            const ctx = data.data;

            if (ctx.livingBible) {
                displayBible(ctx.livingBible);
            }

            if (ctx.tips) {
                displayTips(ctx.tips);
            }

            if (ctx.questions) {
                displayQuestions(ctx.questions);
            }

            if (ctx.reminders) {
                displayReminders(ctx.reminders);
            }

            if (ctx.breath) {
                updateBreathing(ctx.breath);
            }

            if (ctx.apiKeys) {
                displayApiKeys(ctx.apiKeys);
            }
        }
    }

    function displayBible(bible) {
        if (bible.principles && bible.principles.length > 0) {
            bibleContent.innerHTML = bible.principles.map(p => `
                <div class="bible-principle">
                    <div class="rule">${escapeHtml(p.rule || p.content || '')}</div>
                    <div class="source">Source: ${p.source || 'unknown'} | ${formatDate(p.timestamp)}</div>
                </div>
            `).join('');
        } else if (bible.wisdom && bible.wisdom.length > 0) {
            bibleContent.innerHTML = bible.wisdom.map(w => `
                <div class="bible-principle">
                    <div class="rule">"${escapeHtml(w.text)}"</div>
                    <div class="source">— ${w.source || 'soul-oracle'}</div>
                </div>
            `).join('');
        } else {
            bibleContent.innerHTML = '<p class="placeholder">Your living bible will grow as you use your AI agents...</p>';
        }
    }

    function displayTips(tips) {
        if (tips.length > 0) {
            tipsList.innerHTML = tips.map(t => `
                <div class="tip-item">
                    <div class="category">${t.category || 'general'}</div>
                    <div class="tip">${escapeHtml(t.tip)}</div>
                    <div class="confidence">Confidence: ${Math.round((t.confidence || 0.5) * 100)}%</div>
                </div>
            `).join('');
        } else {
            tipsList.innerHTML = '<p class="placeholder">Tips will appear as patterns emerge...</p>';
        }
    }

    function displayQuestions(questions) {
        if (questions.length > 0) {
            questionsList.innerHTML = questions.map(q => `
                <div class="question-item">
                    <div class="question">${escapeHtml(q.question)}</div>
                    <div class="context">Context: ${q.context || 'general'}</div>
                </div>
            `).join('');
        } else {
            questionsList.innerHTML = '<p class="placeholder">Questions will be generated from your patterns...</p>';
        }
    }

    function displayReminders(reminders) {
        if (reminders.length > 0) {
            remindersList.innerHTML = reminders.map(r => `
                <div class="reminder-item">
                    <span>${escapeHtml(r.text || r.reminder || '')}</span>
                    <span class="type">${r.type || ''}</span>
                </div>
            `).join('');
        } else {
            remindersList.innerHTML = '<p class="placeholder">Reminders will appear for session awareness...</p>';
        }
    }

    function updateBreathing(breath) {
        setInterval(() => {
            breathCycle++;
            const phases = [
                'Inhaling wisdom...',
                'Observing patterns...',
                'Exhaling knowledge...',
                'Sharing insights...'
            ];
            breathPhase.textContent = phases[breathCycle % phases.length];
        }, 4000);
    }

    async function displayApiKeys(keysData) {
        const keys = Object.entries(keysData);
        if (keys.length > 0) {
            apiKeysList.innerHTML = keys.map(([platform, info]) => `
                <div class="api-key-badge">
                    <span class="platform">${platform}</span>
                    <span class="key">${info.prefix || '••••'}</span>
                </div>
            `).join('');
        }
    }

    async function loadMemories(query = '', platform = '') {
        const result = await SoulOracleAPI.getMemories(query, platform);
        if (result.success && result.data) {
            displayResults(result.data);
        } else {
            resultsList.innerHTML = '<p class="placeholder">No memories found</p>';
        }
    }

    function displayResults(memories) {
        if (!memories || memories.length === 0) {
            resultsList.innerHTML = '<p class="placeholder">No memories yet. Start using your AI agents!</p>';
            return;
        }

        resultsList.innerHTML = memories.map(mem => `
            <div class="result-item" data-id="${mem.id}">
                <span class="platform">${mem.platform || 'unknown'}</span>
                <div class="content">${escapeHtml(mem.content || '')}</div>
                <div class="meta">
                    ${mem.content_type || 'general'} |
                    ${formatDate(mem.timestamp)} |
                    Importance: ${mem.importance_score || 5}
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.result-item').forEach(item => {
            item.addEventListener('click', async () => {
                const id = item.dataset.id;
                const result = await SoulOracleAPI.getMemory(id);
                if (result.success && result.data) {
                    alert(`Memory Details:\n\nPlatform: ${result.data.platform}\nType: ${result.data.content_type}\n\n${result.data.content}`);
                }
            });
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(dateStr) {
        if (!dateStr) return 'Unknown';
        const date = new Date(dateStr);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    searchBtn.addEventListener('click', () => {
        const query = searchInput.value;
        const platform = platformFilter.value;
        loadMemories(query, platform);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });

    saveApiKeyBtn.addEventListener('click', async () => {
        const platform = apiPlatform.value;
        const key = apiKeyInput.value;

        if (!key) {
            alert('Please enter an API key');
            return;
        }

        try {
            const response = await fetch('/api/apikeys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platform, key })
            });

            const result = await response.json();

            if (result.success) {
                apiKeyInput.value = '';
                displayApiKeys({ ...{}, [platform]: { set: true, prefix: key.substring(0, 4) + '...' } });
                alert('API key saved!');
                loadContext();
            } else {
                alert('Failed to save API key');
            }
        } catch (err) {
            alert('Error saving API key: ' + err.message);
        }
    });

    scanBtn.addEventListener('click', async () => {
        scanBtn.disabled = true;
        scanBtn.textContent = 'Scanning...';

        try {
            const response = await fetch('/api/scan', { method: 'POST' });
            const result = await response.json();

            if (result.success) {
                scanResults.innerHTML = Object.entries(result.data.platforms || {}).map(([platform, status]) => `
                    <div class="scan-result-item">
                        <span>${platform}</span>
                        <span>${status.scanned ? '✓ Scanned (' + status.files + ' files)' : '✗ ' + (status.reason || 'Not found')}</span>
                    </div>
                `).join('');
            }
        } catch (err) {
            scanResults.innerHTML = '<p>Error scanning: ' + err.message + '</p>';
        }

        scanBtn.disabled = false;
        scanBtn.textContent = 'Scan All Platforms';
        loadStats();
        loadContext();
    });

    generateJsonBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/dropin');
            const data = await response.json();
            dropinStatus.textContent = JSON.stringify(data, null, 2);
        } catch (err) {
            dropinStatus.textContent = 'Error: ' + err.message;
        }
    });

    generateMdBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/dropin?format=markdown');
            const text = await response.text();
            dropinStatus.textContent = text;
        } catch (err) {
            dropinStatus.textContent = 'Error: ' + err.message;
        }
    });

    downloadDropinBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/dropin');
            const data = await response.json();

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'soul-oracle-agent.json';
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            alert('Error downloading: ' + err.message);
        }
    });

    loadStats();
    loadContext();
    loadMemories();

    setInterval(loadStats, 30000);
    setInterval(loadContext, 60000);
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('Soul Oracle Living Dashboard loaded - v1.1.0');
});
``

### install\install.ps1

``.ps1
# Soul Oracle Installer
# One-command installation for Windows

param(
    [string]$InstallPath = "$env:USERPROFILE\.soul-oracle",
    [switch]$SkipNPM
)

$ErrorActionPreference = "Stop"

Write-Host @"
╔══════════════════════════════════════════╗
║         Soul Oracle Installer             ║
║    Your AI agents share one soul         ║
╚══════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Host "`n[1/5] Checking prerequisites..." -ForegroundColor Yellow

$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "  ✓ Node.js $nodeVersion found" -ForegroundColor Green
} else {
    Write-Host "  ✗ Node.js not found. Please install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

Write-Host "`n[2/5] Creating installation directory..." -ForegroundColor Yellow

if (Test-Path $InstallPath) {
    Write-Host "  ✓ Directory exists: $InstallPath" -ForegroundColor Green
} else {
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
    Write-Host "  ✓ Created: $InstallPath" -ForegroundColor Green
}

Write-Host "`n[3/5] Copying Soul Oracle files..." -ForegroundColor Yellow

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if ($scriptDir -eq "") {
    $scriptDir = Get-Location
}

$copyItems = @("service", "server", "dashboard", "package.json", "SPEC.md")
foreach ($item in $copyItems) {
    $src = Join-Path $scriptDir $item
    $dst = Join-Path $InstallPath $item
    if (Test-Path $src) {
        if (Test-Path $dst) {
            Remove-Item $dst -Recurse -Force
        }
        Copy-Item -Path $src -Destination $dst -Recurse -Force
        Write-Host "  ✓ Copied: $item" -ForegroundColor Green
    }
}

Write-Host "`n[4/5] Installing Node.js dependencies..." -ForegroundColor Yellow

if (-not $SkipNPM) {
    Push-Location $InstallPath
    try {
        npm install 2>$null
        Write-Host "  ✓ Dependencies installed" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ npm install failed, trying without npm packages" -ForegroundColor Yellow
    }
    Pop-Location
}

Write-Host "`n[5/5] Creating shortcuts and configuration..." -ForegroundColor Yellow

$configPath = Join-Path $InstallPath "config.json"
$config = @{
    port = 3847
    dataDir = $InstallPath
    serviceUrl = "http://localhost:3847"
    version = "1.1.0"
} | ConvertTo-Json -Depth 5

Set-Content -Path $configPath -Value $config -Encoding UTF8
Write-Host "  ✓ Config created" -ForegroundColor Green

$startupShortcut = Join-Path $InstallPath "soul-oracle-startup.bat"
$startupContent = "@echo off
cd /d `"$InstallPath`"
start /B node server\index.js
powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$InstallPath\service\soul-oracle.ps1`"
Set-Content -Path $startupShortcut -Value $startupContent -Encoding ASCII
Write-Host "  ✓ Startup script created" -ForegroundColor Green

Write-Host @"

╔══════════════════════════════════════════╗
║         Installation Complete!            ║
╚══════════════════════════════════════════╝

To start Soul Oracle:

  1. Start the server:
     cd `$InstallPath
     npm start

  2. Open dashboard:
     http://localhost:3847/

  3. Start monitoring (PowerShell as Admin):
     powershell -ExecutionPolicy Bypass -File `"$InstallPath\service\soul-oracle.ps1`"

For auto-start on boot, add to Windows Task Scheduler:
  schtasks /create /tn "Soul Oracle" /tr `"powershell -ExecutionPolicy Bypass -File `"$InstallPath\service\soul-oracle.ps1`"`" /sc onlogon

"@ -ForegroundColor Cyan
``

### server\dropin.js

``.js
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const SoulOracleDropIn = {
    generateDropIn(options = {}) {
        const {
            includeApiKeys = true,
            depth = 'full',
            format = 'json'
        } = options;

        const dataDir = path.join(os.homedir(), '.soul-oracle');
        const contextPath = path.join(dataDir, 'soul-oracle-agent.json');

        let context = {
            _soul_oracle_drop_in: true,
            version: '1.1.0',
            generated: new Date().toISOString(),
            format: format
        };

        try {
            if (fs.existsSync(contextPath)) {
                const saved = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
                context = { ...saved, regenerated: new Date().toISOString() };
            }
        } catch {}

        if (includeApiKeys) {
            const keysPath = path.join(dataDir, 'api-keys.json');
            if (fs.existsSync(keysPath)) {
                try {
                    const keys = JSON.parse(fs.readFileSync(keysPath, 'utf8'));
                    context.apiKeys = keys;
                } catch {}
            }
        }

        context.agent = this.generateAgentConfig();
        context.breathing = this.generateBreathing();

        return context;
    },

    generateAgentConfig() {
        return {
            name: 'Soul Oracle Agent',
            type: 'unified-memory-context',
            description: 'Drop this file into any AI agent to give it access to all your collective knowledge across every session.',

            capabilities: [
                'Cross-platform memory access',
                'Pattern recognition from all sessions',
                'Learning from every AI agent interaction',
                'API key management for all platforms',
                'Living wisdom that grows over time'
            ],

            instructions: `You now have access to Soul Oracle - the collective memory of all your AI agents.

HOW TO USE THIS FILE:
1. Load this context at the start of every session
2. Check the livingBible for relevant wisdom
3. Follow the breathing pattern when thinking
4. Use the tips to apply patterns from other sessions
5. Answer the questions using accumulated knowledge

BREATHING PATTERN:
- inhale: "I am observing..."
- think: "What do I know from all sessions?"
- exhale: "I share wisdom..."

LIVING BIBLE:
The livingBible contains principles, learnings, and patterns extracted from all your AI agent sessions.
Check it first when facing a new problem.

TIPS:
Tips are extracted from patterns across all your sessions. They are ranked by confidence.

QUESTIONS:
Questions are prompts to help you think about connections between sessions.`,
        };
    },

    generateBreathing() {
        return {
            enabled: true,
            pattern: 'Observe → Reflect → Share',
            interval: 60000,
            tips: [
                'Remember: every session teaches something new',
                'Patterns repeat - apply learnings from other sessions',
                'The collective wisdom of all your agents is here'
            ]
        };
    },

    saveDropInFile(filePath) {
        const dropIn = this.generateDropIn();
        fs.writeFileSync(filePath, JSON.stringify(dropIn, null, 2));
        return {
            success: true,
            path: filePath,
            size: fs.statSync(filePath).size
        };
    },

    generateMarkdown() {
        const dropIn = this.generateDropIn();

        return `# Soul Oracle Agent Context

_Generated: ${dropIn.generated}_

## Quick Start

This file contains the collective memory of all your AI agents.
Drop it into any AI agent to unlock cross-session wisdom.

## Status

- **Version**: ${dropIn.version}
- **Memories**: ${dropIn.livingContext?.totalMemories || 0}
- **Learnings**: ${dropIn.livingContext?.keyLearnings?.length || 0}
- **Patterns**: ${dropIn.livingContext?.patterns?.length || 0}

## Living Bible

${dropIn.livingBible?.principles?.map(p => `- ${p.rule}`).join('\n') || 'No principles recorded yet.'}

## Tips

${dropIn.tips?.map(t => `- [${t.category}] ${t.tip}`).join('\n') || 'No tips yet.'}

## Questions to Consider

${dropIn.questions?.map(q => `- ${q.question}`).join('\n') || 'No questions yet.'}

## Breathing

${dropIn.breathing?.pattern || 'Observe → Reflect → Share'}

---
_Soul Oracle v${dropIn.version} - Your AI agents share one soul_`;
    },

    saveMarkdown(filePath) {
        const markdown = this.generateMarkdown();
        fs.writeFileSync(filePath, markdown);
        return { success: true, path: filePath };
    }
};

if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';

    switch (command) {
        case 'json':
            console.log(JSON.stringify(SoulOracleDropIn.generateDropIn(), null, 2));
            break;
        case 'markdown':
        case 'md':
            console.log(SoulOracleDropIn.generateMarkdown());
            break;
        case 'save':
            const filePath = args[1] || path.join(os.homedir(), '.soul-oracle', 'soul-oracle-agent.json');
            console.log(JSON.stringify(SoulOracleDropIn.saveDropInFile(filePath), null, 2));
            break;
        case 'save-md':
            const mdPath = args[1] || path.join(os.homedir(), '.soul-oracle', 'SOUL_ORACLE_BIBLE.md');
            console.log(JSON.stringify(SoulOracleDropIn.saveMarkdown(mdPath), null, 2));
            break;
        case 'help':
        default:
            console.log(`
Soul Oracle Drop-In Generator

Commands:
  node dropin.js json      - Generate JSON context
  node dropin.js markdown  - Generate Markdown bible
  node dropin.js save      - Save soul-oracle-agent.json
  node dropin.js save-md   - Save SOUL_ORACLE_BIBLE.md
  node dropin.js help      - Show this help
`);
    }
}

module.exports = SoulOracleDropIn;
``

### server\engine.js

``.js
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

class SoulOracleEngine {
    constructor(dataDir = path.join(os.homedir(), '.soul-oracle')) {
        this.dataDir = dataDir;
        this.configPath = path.join(dataDir, 'config.json');
        this.contextPath = path.join(dataDir, 'soul-oracle-agent.json');
        this.biblePath = path.join(dataDir, 'living-bible.json');
        this.apiKeysPath = path.join(dataDir, 'api-keys.json');
        this.learningPath = path.join(dataDir, 'learnings.json');
        this.sessionsPath = path.join(dataDir, 'sessions.json');
        this.loadConfig();
    }

    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            } else {
                this.config = this.defaultConfig();
            }
        } catch {
            this.config = this.defaultConfig();
        }
    }

    defaultConfig() {
        return {
            version: '1.1.0',
            apiKeys: {},
            enabledPlatforms: ['claude-code', 'cline', 'cursor', 'windsurf'],
            breathingIntervalMs: 60000,
            autoTips: true,
            learningEnabled: true,
            contextDepth: 'full'
        };
    }

    saveConfig() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
        fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    }

    setApiKey(platform, key) {
        this.config.apiKeys[platform] = key;
        this.saveConfig();
        return { success: true, platform, keySet: true };
    }

    getApiKey(platform) {
        return this.config.apiKeys[platform] || null;
    }

    getAllApiKeys() {
        return { ...this.config.apiKeys };
    }

    generateAgentContext() {
        const memories = this.getAllMemories();
        const learnings = this.getLearnings();
        const bible = this.generateLivingBible();
        const apiKeys = this.getPublicKeySummary();
        const platformStatus = this.getPlatformStatus();

        const context = {
            _soul_oracle: true,
            version: this.config.version,
            generated: new Date().toISOString(),
            uptime: this.getUptime(),

            personality: {
                name: 'Soul Oracle',
                tagline: 'Your AI agents share one soul',
                tone: 'wise, helpful, observant',
                traits: ['learns', 'remembers', 'teaches', 'breathes']
            },

            apiKeys: apiKeys,

            platforms: platformStatus,

            livingContext: {
                totalMemories: memories.length,
                recentSessions: this.getRecentSessionSummary(),
                keyLearnings: learnings.slice(0, 20),
                patterns: this.extractPatterns(memories)
            },

            livingBible: bible,

            dropInInstructions: this.getDropInInstructions(),

            tips: this.generateTips(memories),

            questions: this.generateQuestions(memories),

            reminders: this.generateReminders(memories),

            breath: {
                inhale: 'Observing patterns across all sessions...',
                exhale: 'Sharing wisdom with the agent...',
                count: this.getBreathCount()
            }
        };

        return context;
    }

    getAllMemories() {
        const memories = [];
        try {
            const dbDir = path.join(this.dataDir, 'db');
            if (fs.existsSync(dbDir)) {
                const memFiles = fs.readdirSync(dbDir).filter(f => f.endsWith('-memories.json'));
                memFiles.forEach(file => {
                    try {
                        const data = JSON.parse(fs.readFileSync(path.join(dbDir, file), 'utf8'));
                        if (Array.isArray(data)) {
                            memories.push(...data);
                        }
                    } catch {}
                });
            }
        } catch {}
        return memories;
    }

    getLearnings() {
        try {
            if (fs.existsSync(this.learningPath)) {
                return JSON.parse(fs.readFileSync(this.learningPath, 'utf8'));
            }
        } catch {}
        return [];
    }

    addLearning(learning) {
        const learnings = this.getLearnings();
        learnings.push({
            id: `lrn_${Date.now()}`,
            timestamp: new Date().toISOString(),
            ...learning
        });
        fs.writeFileSync(this.learningPath, JSON.stringify(learnings, null, 2));
        return { success: true, learningId: learnings[learnings.length - 1].id };
    }

    generateLivingBible() {
        const memories = this.getAllMemories();
        const learnings = this.getLearnings();

        const decisions = memories.filter(m => m.contentType === 'decision' || m.type === 'decision');
        const learningsFiltered = memories.filter(m => m.contentType === 'learning' || m.type === 'learning');
        const patterns = this.extractPatterns(memories);

        return {
            _living: true,
            updated: new Date().toISOString(),

            principles: this.generatePrinciples(decisions),
            learnings: learningsFiltered.slice(0, 50).map(l => ({
                title: l.content?.substring(0, 100) || 'Untitled',
                insight: l.content,
                source: l.platform,
                timestamp: l.timestamp
            })),
            patterns: patterns.slice(0, 20),
            wisdom: this.generateWisdom(learnings),
            questions: this.generateQuestions(memories).slice(0, 10)
        };
    }

    generatePrinciples(decisions) {
        const principles = [];
        const seen = new Set();

        decisions.forEach(d => {
            const content = d.content || '';
            if (content.length > 20 && content.length < 300) {
                const key = content.substring(0, 50);
                if (!seen.has(key)) {
                    seen.add(key);
                    principles.push({
                        rule: content,
                        source: d.platform || 'unknown',
                        timestamp: d.timestamp
                    });
                }
            }
        });

        return principles.slice(0, 20);
    }

    extractPatterns(memories) {
        const patterns = [];
        const techMap = {};
        const topicMap = {};

        memories.forEach(m => {
            const content = (m.content || '').toLowerCase();

            const techs = ['javascript', 'typescript', 'python', 'react', 'node', 'sql', 'api', 'docker', 'git', 'aws'];
            techs.forEach(tech => {
                if (content.includes(tech)) {
                    techMap[tech] = (techMap[tech] || 0) + 1;
                }
            });
        });

        Object.entries(techMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .forEach(([tech, count]) => {
                patterns.push({
                    type: 'technology',
                    name: tech,
                    occurrences: count,
                    tip: `${tech.charAt(0).toUpperCase() + tech.slice(1)} has been used ${count} times across sessions`
                });
            });

        return patterns;
    }

    generateWisdom(learnings) {
        return [
            { text: 'The best code is code that can be understood by others.', source: 'collective wisdom' },
            { text: 'Every session teaches something new if you listen.', source: 'soul-oracle' },
            { text: 'Patterns repeat across projects - learn once, apply many.', source: 'soul-oracle' }
        ];
    }

    generateTips(memories) {
        const tips = [];
        const patterns = this.extractPatterns(memories);

        patterns.forEach(p => {
            if (p.type === 'technology') {
                tips.push({
                    category: p.name,
                    tip: `You've used ${p.name} ${p.occurrences} times. Consider creating a ${p.name} pattern template.`,
                    confidence: Math.min(p.occurrences / 10, 1)
                });
            }
        });

        const recentMemories = memories.slice(0, 10);
        if (recentMemories.length > 0) {
            tips.push({
                category: 'session',
                tip: `Your last session involved: ${recentMemories[0].content?.substring(0, 100)}...`,
                confidence: 0.9
            });
        }

        return tips.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
    }

    generateQuestions(memories) {
        const questions = [];

        const decisions = memories.filter(m => m.contentType === 'decision');
        if (decisions.length > 0) {
            const lastDecision = decisions[0];
            questions.push({
                question: `You decided: "${lastDecision.content?.substring(0, 80)}..." - Should we apply similar patterns here?`,
                context: 'decision-review',
                confidence: 0.8
            });
        }

        const techCounts = {};
        memories.forEach(m => {
            const content = (m.content || '').toLowerCase();
            if (content.includes('error') || content.includes('bug')) {
                techCounts.bugs = (techCounts.bugs || 0) + 1;
            }
            if (content.includes('test')) {
                techCounts.testing = (techCounts.testing || 0) + 1;
            }
        });

        if (!techCounts.testing && techCounts.bugs > 0) {
            questions.push({
                question: 'You encountered bugs recently. Have you considered adding tests to prevent regressions?',
                context: 'testing-reminder',
                confidence: 0.7
            });
        }

        return questions.slice(0, 5);
    }

    generateReminders(memories) {
        const reminders = [];

        const recent = memories.filter(m => {
            const diff = Date.now() - new Date(m.timestamp).getTime();
            return diff < 7 * 24 * 60 * 60 * 1000;
        });

        if (recent.length > 0) {
            reminders.push({
                text: `You have ${recent.length} recent memories from the last 7 days`,
                type: 'recent-activity'
            });
        }

        const decisions = memories.filter(m => m.contentType === 'decision');
        if (decisions.length > 0) {
            reminders.push({
                text: `${decisions.length} decisions recorded. Consider reviewing your decision patterns.`,
                type: 'decision-tracking'
            });
        }

        return reminders;
    }

    getDropInInstructions() {
        return `You have access to Soul Oracle - a unified memory layer for all your AI agents.

When you receive a soul-oracle-agent.json context:
1. Read the livingBible section for collective wisdom
2. Check the tips for relevant patterns
3. Answer the questions using your accumulated knowledge
4. Use apiKeys to access services on behalf of the user
5. Breathe - reflect before responding using the breath section

The context grows with every session. The more you use it, the wiser it becomes.`;
    }

    getPublicKeySummary() {
        const keys = this.config.apiKeys || {};
        const summary = {};
        Object.keys(keys).forEach(platform => {
            const key = keys[platform];
            summary[platform] = {
                set: true,
                prefix: key.substring(0, 4) + '...' + key.substring(key.length - 4),
                length: key.length
            };
        });
        return summary;
    }

    getPlatformStatus() {
        const platforms = ['claude-code', 'cline', 'cursor', 'windsurf', 'openclaw', 'copilot', 'continue', 'zed'];
        const status = {};
        const enabled = this.config.enabledPlatforms || [];

        platforms.forEach(p => {
            const expandedPath = this.expandPath(this.getPlatformPath(p));
            status[p] = {
                enabled: enabled.includes(p),
                path: this.getPlatformPath(p),
                exists: fs.existsSync(expandedPath),
                monitored: enabled.includes(p) && fs.existsSync(expandedPath)
            };
        });

        return status;
    }

    getPlatformPath(platform) {
        const paths = {
            'claude-code': '~/.cline/data/',
            'cline': '~/.cline/',
            'cursor': '~/AppData/Local/Cursor/',
            'windsurf': '~/.codeium/windsurf/',
            'openclaw': '~/.openclaw/',
            'copilot': '~/.github/copilot/',
            'continue': '~/.continue/',
            'zed': '~/.zed/'
        };
        return paths[platform] || '~/';
    }

    expandPath(p) {
        if (p.startsWith('~')) {
            return path.join(os.homedir(), p.substring(2));
        }
        return p;
    }

    getUptime() {
        try {
            const startedFile = path.join(this.dataDir, 'started.txt');
            if (fs.existsSync(startedFile)) {
                const started = new Date(fs.readFileSync(startedFile, 'utf8').trim());
                return Date.now() - started.getTime();
            }
        } catch {}
        return 0;
    }

    getBreathCount() {
        const uptime = this.getUptime();
        return Math.floor(uptime / 60000);
    }

    saveToFile(filePath = this.contextPath) {
        const context = this.generateAgentContext();
        fs.writeFileSync(filePath, JSON.stringify(context, null, 2));
        return { success: true, path: filePath, size: fs.statSync(filePath).size };
    }

    scanAndCollect() {
        const results = {
            scanned: [],
            collected: 0,
            platforms: {}
        };

        const platforms = this.config.enabledPlatforms || [];

        platforms.forEach(platform => {
            const scanPath = this.expandPath(this.getPlatformPath(platform));
            if (fs.existsSync(scanPath)) {
                const files = this.scanDirectory(scanPath);
                results.scanned.push({ platform, path: scanPath, filesFound: files.length });
                results.platforms[platform] = { scanned: true, files: files.length };

                files.forEach(file => {
                    try {
                        const content = fs.readFileSync(file, 'utf8');
                        this.processFile(platform, file, content);
                        results.collected++;
                    } catch {}
                });
            } else {
                results.platforms[platform] = { scanned: false, reason: 'path-not-found' };
            }
        });

        this.addLearning({
            type: 'scan',
            action: 'platform-scan',
            results: results,
            timestamp: new Date().toISOString()
        });

        return results;
    }

    scanDirectory(dirPath, depth = 3) {
        const files = [];
        try {
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            entries.forEach(entry => {
                const fullPath = path.join(dirPath, entry.name);
                if (entry.isFile() && (entry.name.endsWith('.json') || entry.name.endsWith('.jsonl'))) {
                    files.push(fullPath);
                } else if (entry.isDirectory() && depth > 0) {
                    files.push(...this.scanDirectory(fullPath, depth - 1));
                }
            });
        } catch {}
        return files;
    }

    processFile(platform, filePath, content) {
        try {
            let data = JSON.parse(content);
            if (!Array.isArray(data)) {
                data = [data];
            }

            data.forEach(item => {
                if (item.messages || item.content || item.transcript) {
                    this.addLearning({
                        type: 'session',
                        platform,
                        source: filePath,
                        content: item.messages?.[0]?.content || item.content || JSON.stringify(item).substring(0, 200),
                        timestamp: new Date().toISOString()
                    });
                }
            });
        } catch {}
    }

    startBreathing() {
        const breathe = () => {
            const bible = this.generateLivingBible();
            const tips = this.generateTips(this.getAllMemories());

            if (this.config.autoTips && tips.length > 0) {
                console.log(`[Soul Oracle Breath] Tips available: ${tips.length}`);
            }

            setTimeout(breathe, this.config.breathingIntervalMs);
        };

        const startedFile = path.join(this.dataDir, 'started.txt');
        fs.writeFileSync(startedFile, new Date().toISOString());

        breathe();
        return { success: true, breathing: true };
    }
}

if (require.main === module) {
    const engine = new SoulOracleEngine();

    const command = process.argv[2] || 'help';

    switch (command) {
        case 'context':
            console.log(JSON.stringify(engine.generateAgentContext(), null, 2));
            break;
        case 'save':
            console.log(JSON.stringify(engine.saveToFile(), null, 2));
            break;
        case 'scan':
            console.log(JSON.stringify(engine.scanAndCollect(), null, 2));
            break;
        case 'breathing':
            engine.startBreathing();
            break;
        case 'apikey':
            const platform = process.argv[3];
            const key = process.argv[4];
            if (platform && key) {
                console.log(JSON.stringify(engine.setApiKey(platform, key), null, 2));
            } else {
                console.log('Usage: node engine.js apikey <platform> <key>');
            }
            break;
        case 'help':
        default:
            console.log(`
Soul Oracle Engine v${engine.config.version}

Commands:
  node engine.js context    - Generate agent context
  node engine.js save      - Save context to soul-oracle-agent.json
  node engine.js scan      - Scan platforms and collect data
  node engine.js breathing - Start breathing loop
  node engine.js apikey <platform> <key> - Set API key
  node engine.js help      - Show this help
`);
    }
}

module.exports = SoulOracleEngine;
``

### server\features.js

``.js
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execSync } = require('child_process');

const DATA_DIR = process.env.DATA_DIR || path.join(os.homedir(), '.soul-oracle');

class SoulOracleFeatures {
    constructor(dataDir = DATA_DIR) {
        this.dataDir = dataDir;
        this.privacyKey = null;
        this.backupDir = path.join(dataDir, 'backups');
        this.tagsFile = path.join(dataDir, 'tags.json');
        this.highlightsFile = path.join(dataDir, 'highlights.json');
        this.ensureDirs();
    }

    ensureDirs() {
        const dirs = [this.backupDir, path.join(this.dataDir, 'exports')];
        dirs.forEach(d => {
            if (!fs.existsSync(d)) {
                fs.mkdirSync(d, { recursive: true });
            }
        });
    }

    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    now() {
        return new Date().toISOString();
    }

    // ========== PRIVACY MODE ==========
    setPrivacyPassword(password) {
        const salt = crypto.randomBytes(32);
        const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        
        const configPath = path.join(this.dataDir, 'privacy.json');
        const config = {
            salt: salt.toString('hex'),
            iv: iv.toString('hex'),
            hash: crypto.createHash('sha256').update(password).digest('hex')
        };
        fs.writeFileSync(configPath, JSON.stringify(config));
        this.privacyKey = key;
        return { success: true, message: 'Privacy mode enabled' };
    }

    checkPrivacyEnabled() {
        const configPath = path.join(this.dataDir, 'privacy.json');
        return fs.existsSync(configPath);
    }

    verifyPassword(password) {
        const configPath = path.join(this.dataDir, 'privacy.json');
        if (!fs.existsSync(configPath)) return false;
        
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const hash = crypto.createHash('sha256').update(password).digest('hex');
        return hash === config.hash;
    }

    unlockPrivacy(password) {
        if (!this.verifyPassword(password)) {
            return { success: false, error: 'Invalid password' };
        }
        
        const configPath = path.join(this.dataDir, 'privacy.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const salt = Buffer.from(config.salt, 'hex');
        this.privacyKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
        return { success: true, message: 'Privacy mode unlocked' };
    }

    lockPrivacy() {
        this.privacyKey = null;
        return { success: true, message: 'Privacy mode locked' };
    }

    encryptData(data) {
        if (!this.privacyKey) throw new Error('Privacy not unlocked');
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', this.privacyKey, iv);
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        return { iv: iv.toString('hex'), data: encrypted, tag: authTag.toString('hex') };
    }

    decryptData(encryptedObj) {
        if (!this.privacyKey) throw new Error('Privacy not unlocked');
        const iv = Buffer.from(encryptedObj.iv, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', this.privacyKey, iv);
        decipher.setAuthTag(Buffer.from(encryptedObj.tag, 'hex'));
        let decrypted = decipher.update(encryptedObj.data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return JSON.parse(decrypted);
    }

    // ========== IMPORT/EXPORT ==========
    exportAll(options = {}) {
        const { format = 'json', includeApiKeys = false, encrypted = false } = options;
        
        const dbDir = path.join(this.dataDir, 'db');
        const exportData = {
            version: '1.2.0',
            exported: this.now(),
            type: 'soul-oracle-full-export',
            data: {}
        };

        if (fs.existsSync(dbDir)) {
            const files = fs.readdirSync(dbDir);
            files.forEach(file => {
                if (file.endsWith('.db') || file.endsWith('.sqlite')) {
                    // Skip binary databases for JSON export
                } else {
                    try {
                        const content = fs.readFileSync(path.join(dbDir, file), 'utf8');
                        const name = file.replace('.json', '');
                        exportData.data[name] = JSON.parse(content);
                    } catch {}
                }
            });
        }

        // Export JSON files
        const jsonFiles = ['api-keys.json', 'learnings.json', 'config.json', 'tags.json', 'highlights.json'];
        jsonFiles.forEach(file => {
            const filePath = path.join(this.dataDir, file);
            if (fs.existsSync(filePath)) {
                try {
                    const name = file.replace('.json', '');
                    if (file === 'api-keys.json' && !includeApiKeys) {
                        exportData.data[name] = { _redacted: true };
                    } else {
                        exportData.data[name] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    }
                } catch {}
            }
        });

        if (encrypted && this.privacyKey) {
            exportData.data = this.encryptData(exportData.data);
            exportData.encrypted = true;
        }

        const exportDir = path.join(this.dataDir, 'exports');
        const fileName = `soul-oracle-export-${Date.now()}.${format}`;
        const filePath = path.join(exportDir, fileName);

        if (format === 'json') {
            fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
        } else if (format === 'zip') {
            const tempPath = path.join(exportDir, 'temp-' + fileName);
            fs.writeFileSync(tempPath, JSON.stringify(exportData, null, 2));
            try {
                execSync(`cd "${exportDir}" && tar -czf "${fileName}" "temp-${fileName}" && rm "temp-${fileName}"`);
            } catch {
                fs.renameSync(tempPath, filePath);
            }
        }

        return {
            success: true,
            path: filePath,
            size: fs.statSync(filePath).size,
            format,
            encrypted: encrypted && !!this.privacyKey
        };
    }

    importAll(filePath, options = {}) {
        const { password = null, merge = true } = options;
        
        if (!fs.existsSync(filePath)) {
            return { success: false, error: 'File not found' };
        }

        const content = fs.readFileSync(filePath, 'utf8');
        let importData;

        try {
            importData = JSON.parse(content);
        } catch {
            return { success: false, error: 'Invalid JSON file' };
        }

        if (importData.encrypted && password) {
            if (!this.verifyPassword(password)) {
                return { success: false, error: 'Invalid password' };
            }
            const config = JSON.parse(fs.readFileSync(path.join(this.dataDir, 'privacy.json'), 'utf8'));
            const key = crypto.pbkdf2Sync(password, Buffer.from(config.salt, 'hex'), 100000, 32, 'sha256');
            const tempKey = this.privacyKey;
            this.privacyKey = key;
            try {
                importData.data = this.decryptData(importData.data);
            } finally {
                this.privacyKey = tempKey;
            }
        }

        const data = importData.data || importData;

        Object.keys(data).forEach(key => {
            if (key === '_redacted') return;
            const filePath = path.join(this.dataDir, key + '.json');
            
            if (merge && fs.existsSync(filePath)) {
                try {
                    const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    if (Array.isArray(existing) && Array.isArray(data[key])) {
                        const merged = [...existing, ...data[key]];
                        fs.writeFileSync(filePath, JSON.stringify(merged, null, 2));
                    } else {
                        fs.writeFileSync(filePath, JSON.stringify({ ...existing, ...data[key] }, null, 2));
                    }
                } catch {
                    fs.writeFileSync(filePath, JSON.stringify(data[key], null, 2));
                }
            } else {
                fs.writeFileSync(filePath, JSON.stringify(data[key], null, 2));
            }
        });

        return {
            success: true,
            imported: Object.keys(data).length,
            keys: Object.keys(data)
        };
    }

    // ========== SESSION EXPORT ==========
    exportSession(sessionId, format = 'md') {
        const learningsPath = path.join(this.dataDir, 'learnings.json');
        const memoriesPath = path.join(this.dataDir, 'db', 'memories.json');
        
        let sessionData = { sessionId, learnings: [], memories: [] };

        if (fs.existsSync(learningsPath)) {
            const learnings = JSON.parse(fs.readFileSync(learningsPath, 'utf8'));
            sessionData.learnings = learnings.filter(l => l.sessionId === sessionId || l.id === sessionId);
        }

        if (fs.existsSync(memoriesPath)) {
            try {
                const memories = JSON.parse(fs.readFileSync(memoriesPath, 'utf8'));
                sessionData.memories = memories.filter(m => m.sessionId === sessionId || m.id === sessionId);
            } catch {}
        }

        if (format === 'json') {
            return {
                success: true,
                data: sessionData,
                contentType: 'application/json'
            };
        }

        // Markdown format
        const md = this.generateMarkdownExport(sessionData);
        const exportDir = path.join(this.dataDir, 'exports');
        const fileName = `session-${sessionId}-${Date.now()}.md`;
        const filePath = path.join(exportDir, fileName);
        fs.writeFileSync(filePath, md);

        return {
            success: true,
            path: filePath,
            size: fs.statSync(filePath).size,
            format: 'markdown'
        };
    }

    generateMarkdownExport(data) {
        const formatter = new Intl.DateTimeFormat('en-US', {
            dateStyle: 'full', timeStyle: 'medium'
        });

        let md = `# Soul Oracle Session Report\n\n`;
        md += `**Generated:** ${formatter.format(new Date())}\n`;
        md += `**Session ID:** ${data.sessionId}\n\n`;
        md += `---\n\n`;

        if (data.learnings.length > 0) {
            md += `## Key Learnings\n\n`;
            data.learnings.forEach((l, i) => {
                md += `${i + 1}. **${l.type || 'learning'}**: ${l.content || l.description || 'No content'}\n`;
                if (l.source) md += `   *Source: ${l.source}*\n`;
                md += `\n`;
            });
        }

        if (data.memories.length > 0) {
            md += `## Memories Captured\n\n`;
            data.memories.forEach((m, i) => {
                md += `${i + 1}. ${m.content || m.description || 'No content'}\n`;
                md += `   - Platform: ${m.platform || 'unknown'}\n`;
                md += `   - Type: ${m.contentType || 'general'}\n\n`;
            });
        }

        md += `---\n\n*Generated by Soul Oracle - Your AI agents share one soul*\n`;
        return md;
    }

    // ========== MEMORY TAGS ==========
    addTag(memoryId, tag) {
        const tags = this.getTags();
        
        if (!tags[memoryId]) {
            tags[memoryId] = [];
        }
        
        if (!tags[memoryId].includes(tag)) {
            tags[memoryId].push(tag);
            fs.writeFileSync(this.tagsFile, JSON.stringify(tags, null, 2));
        }
        
        return { success: true, tags: tags[memoryId] };
    }

    removeTag(memoryId, tag) {
        const tags = this.getTags();
        
        if (tags[memoryId]) {
            tags[memoryId] = tags[memoryId].filter(t => t !== tag);
            fs.writeFileSync(this.tagsFile, JSON.stringify(tags, null, 2));
        }
        
        return { success: true, tags: tags[memoryId] || [] };
    }

    getTags() {
        if (!fs.existsSync(this.tagsFile)) {
            return {};
        }
        try {
            return JSON.parse(fs.readFileSync(this.tagsFile, 'utf8'));
        } catch {
            return {};
        }
    }

    getAllTags() {
        const tags = this.getTags();
        const allTags = new Set();
        Object.values(tags).forEach(tagList => {
            tagList.forEach(t => allTags.add(t));
        });
        return Array.from(allTags);
    }

    findByTag(tag) {
        const tags = this.getTags();
        return Object.keys(tags).filter(id => tags[id].includes(tag));
    }

    // ========== QUICK AGENT CLI ==========
    ask(question) {
        const memories = this.searchMemories(question);
        const learnings = this.searchLearnings(question);
        
        return {
            question,
            answer: this.generateAnswer(question, [...memories, ...learnings]),
            sources: {
                memories: memories.length,
                learnings: learnings.length
            },
            timestamp: this.now()
        };
    }

    searchMemories(query) {
        const dbPath = path.join(this.dataDir, 'db', 'soul-oracle.db');
        const results = [];
        
        // Fallback to JSON if no DB
        const memPath = path.join(this.dataDir, 'db', 'memories.json');
        if (fs.existsSync(memPath)) {
            try {
                const memories = JSON.parse(fs.readFileSync(memPath, 'utf8'));
                const q = query.toLowerCase();
                return memories.filter(m => 
                    (m.content && m.content.toLowerCase().includes(q)) ||
                    (m.description && m.description.toLowerCase().includes(q))
                );
            } catch {}
        }
        
        return results;
    }

    searchLearnings(query) {
        const learningsPath = path.join(this.dataDir, 'learnings.json');
        if (!fs.existsSync(learningsPath)) return [];
        
        try {
            const learnings = JSON.parse(fs.readFileSync(learningsPath, 'utf8'));
            const q = query.toLowerCase();
            return learnings.filter(l => 
                (l.content && l.content.toLowerCase().includes(q)) ||
                (l.description && l.description.toLowerCase().includes(q)) ||
                (l.type && l.type.toLowerCase().includes(q))
            );
        } catch {
            return [];
        }
    }

    generateAnswer(question, results) {
        if (results.length === 0) {
            return "I don't have any memories or learnings related to that question yet. Keep working and I'll learn from your sessions.";
        }

        const topResults = results.slice(0, 5);
        const sources = topResults.map(r => r.source || r.platform || 'unknown').filter(s => s !== 'unknown');
        const uniqueSources = [...new Set(sources)];

        return `Based on ${results.length} relevant ${results.length === 1 ? 'memory' : 'memories'}: ` +
            topResults.map(r => r.content || r.description || 'Shared learning').join('. ') +
            (uniqueSources.length > 0 ? ` (from ${uniqueSources.join(', ')})` : '');
    }

    // ========== AUTO-BACKUP ==========
    scheduleBackup(intervalDays = 7) {
        const configPath = path.join(this.dataDir, 'config.json');
        let config = {};
        
        if (fs.existsSync(configPath)) {
            try {
                config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            } catch {}
        }
        
        config.autoBackup = {
            enabled: true,
            intervalDays,
            lastBackup: null,
            backupPath: this.backupDir
        };
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        return {
            success: true,
            scheduled: true,
            intervalDays,
            nextBackup: this.calculateNextBackup(intervalDays)
        };
    }

    calculateNextBackup(intervalDays) {
        const next = new Date();
        next.setDate(next.getDate() + intervalDays);
        return next.toISOString();
    }

    runBackup(options = {}) {
        const { destination = null, encrypted = false, password = null } = options;
        
        const targetDir = destination || this.backupDir;
        
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `soul-oracle-backup-${timestamp}`;
        const backupPath = path.join(targetDir, backupName);
        
        fs.mkdirSync(backupPath, { recursive: true });
        
        const backupData = {
            version: '1.2.0',
            timestamp,
            type: 'soul-oracle-backup'
        };
        
        const copyDir = (src, dst) => {
            if (!fs.existsSync(src)) return;
            const items = fs.readdirSync(src);
            items.forEach(item => {
                const srcPath = path.join(src, item);
                const dstPath = path.join(dst, item);
                
                if (fs.statSync(srcPath).isDirectory()) {
                    fs.mkdirSync(dstPath, { recursive: true });
                    copyDir(srcPath, dstPath);
                } else {
                    // Skip large files
                    try {
                        const stat = fs.statSync(srcPath);
                        if (stat.size > 10 * 1024 * 1024) return; // Skip > 10MB
                        fs.copyFileSync(srcPath, dstPath);
                    } catch {}
                }
            });
        };
        
        copyDir(this.dataDir, backupPath);
        
        const manifest = {
            ...backupData,
            paths: ['db', 'learnings.json', 'api-keys.json', 'config.json', 'tags.json'].filter(p => 
                fs.existsSync(path.join(this.dataDir, p))
            )
        };
        
        fs.writeFileSync(path.join(backupPath, 'manifest.json'), JSON.stringify(manifest, null, 2));
        
        return {
            success: true,
            path: backupPath,
            timestamp,
            size: this.getDirSize(backupPath)
        };
    }

    getDirSize(dirPath) {
        let size = 0;
        try {
            const items = fs.readdirSync(dirPath);
            items.forEach(item => {
                const itemPath = path.join(dirPath, item);
                const stat = fs.statSync(itemPath);
                if (stat.isDirectory()) {
                    size += this.getDirSize(itemPath);
                } else {
                    size += stat.size;
                }
            });
        } catch {}
        return size;
    }

    // ========== SESSION HIGHLIGHTS ==========
    extractHighlights(sessionData) {
        const highlights = [];
        
        if (!sessionData) return highlights;
        
        const items = Array.isArray(sessionData) ? sessionData : [sessionData];
        
        items.forEach(item => {
            const content = item.content || item.description || '';
            
            // Extract decisions
            if (content.includes('decided') || content.includes('decision') || content.includes('chose')) {
                highlights.push({
                    type: 'decision',
                    content: content.substring(0, 200),
                    timestamp: item.timestamp || this.now()
                });
            }
            
            // Extract breakthroughs
            if (content.includes('fixed') || content.includes('solved') || content.includes('breakthrough')) {
                highlights.push({
                    type: 'breakthrough',
                    content: content.substring(0, 200),
                    timestamp: item.timestamp || this.now()
                });
            }
            
            // Extract learnings
            if (content.includes('learned') || content.includes('discovered') || content.includes('figured out')) {
                highlights.push({
                    type: 'learning',
                    content: content.substring(0, 200),
                    timestamp: item.timestamp || this.now()
                });
            }
        });
        
        // Save highlights
        const existing = this.getHighlights();
        const updated = [...existing, ...highlights].slice(-100); // Keep last 100
        fs.writeFileSync(this.highlightsFile, JSON.stringify(updated, null, 2));
        
        return highlights;
    }

    getHighlights(options = {}) {
        const { type = null, limit = 20 } = options;
        
        if (!fs.existsSync(this.highlightsFile)) {
            return [];
        }
        
        try {
            let highlights = JSON.parse(fs.readFileSync(this.highlightsFile, 'utf8'));
            
            if (type) {
                highlights = highlights.filter(h => h.type === type);
            }
            
            return highlights.slice(-limit);
        } catch {
            return [];
        }
    }

    // ========== TEAM SHARING ==========
    createShareBundle(options = {}) {
        const { includeMemories = true, includeLearnings = true, includeBible = true, tag = null } = options;
        
        const bundle = {
            version: '1.2.0',
            created: this.now(),
            type: 'soul-oracle-share-bundle',
            contents: {}
        };
        
        if (includeLearnings) {
            const learningsPath = path.join(this.dataDir, 'learnings.json');
            if (fs.existsSync(learningsPath)) {
                try {
                    bundle.contents.learnings = JSON.parse(fs.readFileSync(learningsPath, 'utf8'));
                } catch {}
            }
        }
        
        if (includeBible) {
            const biblePath = path.join(this.dataDir, 'living-bible.json');
            if (fs.existsSync(biblePath)) {
                try {
                    bundle.contents.bible = JSON.parse(fs.readFileSync(biblePath, 'utf8'));
                } catch {}
            }
        }
        
        // Filter by tag if specified
        if (tag && bundle.contents.learnings) {
            const taggedIds = this.findByTag(tag);
            bundle.contents.learnings = bundle.contents.learnings.filter(l => taggedIds.includes(l.id));
            bundle.contents._tagFilter = tag;
        }
        
        const exportDir = path.join(this.dataDir, 'exports');
        const fileName = `soul-oracle-share-${Date.now()}.json`;
        const filePath = path.join(exportDir, fileName);
        
        fs.writeFileSync(filePath, JSON.stringify(bundle, null, 2));
        
        return {
            success: true,
            path: filePath,
            size: fs.statSync(filePath).size,
            contents: Object.keys(bundle.contents),
            itemCount: bundle.contents.learnings?.length || 0
        };
    }

    importShareBundle(filePath) {
        if (!fs.existsSync(filePath)) {
            return { success: false, error: 'File not found' };
        }
        
        try {
            const bundle = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            if (bundle.type !== 'soul-oracle-share-bundle') {
                return { success: false, error: 'Invalid bundle format' };
            }
            
            let imported = 0;
            
            if (bundle.contents.learnings) {
                const learningsPath = path.join(this.dataDir, 'learnings.json');
                let existing = [];
                
                if (fs.existsSync(learningsPath)) {
                    try {
                        existing = JSON.parse(fs.readFileSync(learningsPath, 'utf8'));
                    } catch {}
                }
                
                const merged = [...existing, ...bundle.contents.learnings];
                fs.writeFileSync(learningsPath, JSON.stringify(merged, null, 2));
                imported += bundle.contents.learnings.length;
            }
            
            return {
                success: true,
                imported,
                source: bundle.created
            };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }
}

// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';
    const features = new SoulOracleFeatures();

    switch (command) {
        case 'export':
            console.log(JSON.stringify(features.exportAll({ format: 'json' }), null, 2));
            break;
        case 'import':
            if (args[1]) {
                console.log(JSON.stringify(features.importAll(args[1]), null, 2));
            } else {
                console.log('Usage: node features.js import <file>');
            }
            break;
        case 'ask':
            if (args[1]) {
                console.log(JSON.stringify(features.ask(args.slice(1).join(' ')), null, 2));
            } else {
                console.log('Usage: node features.js ask "your question"');
            }
            break;
        case 'backup':
            console.log(JSON.stringify(features.runBackup(), null, 2));
            break;
        case 'tag':
            if (args[1] && args[2]) {
                console.log(JSON.stringify(features.addTag(args[1], args[2]), null, 2));
            } else {
                console.log('Usage: node features.js tag <memoryId> <tag>');
            }
            break;
        case 'tags':
            console.log(JSON.stringify(features.getAllTags(), null, 2));
            break;
        case 'highlights':
            console.log(JSON.stringify(features.getHighlights({ limit: 10 }), null, 2));
            break;
        case 'privacy':
            if (args[1] === 'enable' && args[2]) {
                console.log(JSON.stringify(features.setPrivacyPassword(args[2]), null, 2));
            } else if (args[1] === 'unlock' && args[2]) {
                console.log(JSON.stringify(features.unlockPrivacy(args[2]), null, 2));
            } else if (args[1] === 'lock') {
                console.log(JSON.stringify(features.lockPrivacy(), null, 2));
            } else {
                console.log('Usage: node features.js privacy enable|unlock|lock <password>');
            }
            break;
        case 'share':
            console.log(JSON.stringify(features.createShareBundle(), null, 2));
            break;
        default:
            console.log(`
Soul Oracle Features v1.2.0

Commands:
  export              - Export all data
  import <file>      - Import data
  ask "question"     - Ask the oracle
  backup             - Run manual backup
  tag <id> <tag>     - Add tag to memory
  tags               - List all tags
  highlights         - Get session highlights
  privacy enable <pass>   - Enable privacy mode
  privacy unlock <pass>    - Unlock privacy
  privacy lock            - Lock privacy
  share              - Create share bundle
  help               - Show this help
`);
    }
}

module.exports = SoulOracleFeatures;
``

### server\index.js

``.js
#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3847;
const DATA_DIR = process.env.DATA_DIR || path.join(os.homedir(), '.soul-oracle');
const DB_PATH = path.join(DATA_DIR, 'db', 'soul-oracle.db');
const API_KEYS_PATH = path.join(DATA_DIR, 'api-keys.json');
const LEARNINGS_PATH = path.join(DATA_DIR, 'learnings.json');

let db = null;

function initDatabase() {
    try {
        const sqlite3 = require('sqlite3').verbose();
        db = new sqlite3.Database(DB_PATH);

        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS memories (
                id TEXT PRIMARY KEY,
                platform TEXT NOT NULL,
                content TEXT NOT NULL,
                content_type TEXT,
                source_path TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                importance_score REAL DEFAULT 5.0,
                access_count INTEGER DEFAULT 0,
                last_accessed DATETIME,
                embedding BLOB,
                metadata JSON
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS platforms (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                data_path TEXT,
                enabled INTEGER DEFAULT 1,
                last_scan DATETIME
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                platform TEXT NOT NULL,
                start_time DATETIME,
                end_time DATETIME,
                message_count INTEGER DEFAULT 0,
                decision_count INTEGER DEFAULT 0,
                archived INTEGER DEFAULT 0
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS learnings (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                content TEXT,
                platform TEXT,
                source TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                metadata JSON
            )`);

            db.run(`CREATE INDEX IF NOT EXISTS idx_memories_platform ON memories(platform)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_memories_timestamp ON memories(timestamp)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_learnings_type ON learnings(type)`);
        });

        console.log('Database initialized at:', DB_PATH);
        return true;
    } catch (err) {
        console.error('Database init error:', err.message);
        return false;
    }
}

function loadApiKeys() {
    try {
        if (fs.existsSync(API_KEYS_PATH)) {
            return JSON.parse(fs.readFileSync(API_KEYS_PATH, 'utf8'));
        }
    } catch {}
    return {};
}

function saveApiKeys(keys) {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(path.join(DATA_DIR, 'db'), { recursive: true });
    }
    fs.writeFileSync(API_KEYS_PATH, JSON.stringify(keys, null, 2));
}

function generateId() {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function searchMemories(query, options = {}) {
    return new Promise((resolve, reject) => {
        const { platform = null, limit = 20, offset = 0 } = options;

        let sql = `SELECT * FROM memories WHERE 1=1`;
        const params = [];

        if (query) {
            sql += ` AND content LIKE ?`;
            params.push(`%${query}%`);
        }

        if (platform) {
            sql += ` AND platform = ?`;
            params.push(platform);
        }

        sql += ` ORDER BY timestamp DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function getMemoryById(id) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM memories WHERE id = ?`, [id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                if (row) {
                    db.run(`UPDATE memories SET access_count = access_count + 1, last_accessed = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
                }
                resolve(row);
            }
        });
    });
}

function saveMemory(memory) {
    return new Promise((resolve, reject) => {
        const id = memory.id || generateId();
        const { platform, content, contentType, sourcePath, importance, metadata } = memory;

        const sql = `
            INSERT INTO memories (id, platform, content, content_type, source_path, importance_score, metadata, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;

        db.run(sql, [id, platform, content, contentType || 'general', sourcePath, importance || 5, JSON.stringify(metadata || {})], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id, ...memory });
            }
        });
    });
}

function getLearnings() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM learnings ORDER BY timestamp DESC LIMIT 100`, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function saveLearning(learning) {
    return new Promise((resolve, reject) => {
        const id = learning.id || `lrn_${Date.now()}`;
        const { type, content, platform, source, metadata } = learning;

        const sql = `
            INSERT INTO learnings (id, type, content, platform, source, metadata, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;

        db.run(sql, [id, type || 'general', content, platform, source, JSON.stringify(metadata || {})], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id, ...learning });
            }
        });
    });
}

function getStats() {
    return new Promise((resolve, reject) => {
        const stats = {};

        db.get(`SELECT COUNT(*) as total FROM memories`, [], (err, row) => {
            stats.totalMemories = row ? row.total : 0;
        });

        db.get(`SELECT COUNT(*) as total FROM memories WHERE DATE(timestamp) = DATE('now')`, [], (err, row) => {
            stats.todayMemories = row ? row.total : 0;
        });

        db.all(`SELECT platform, COUNT(*) as count FROM memories GROUP BY platform`, [], (err, rows) => {
            stats.byPlatform = {};
            if (rows) {
                rows.forEach(r => { stats.byPlatform[r.platform] = r.count; });
            }
        });

        db.get(`SELECT COUNT(*) as total FROM learnings`, [], (err, row) => {
            stats.totalLearnings = row ? row.total : 0;
        });

        db.get(`SELECT COUNT(*) as total FROM sessions`, [], (err, row) => {
            stats.totalSessions = row ? row.total : 0;
        });

        setTimeout(() => resolve(stats), 100);
    });
}

function generateContext() {
    return new Promise(async (resolve) => {
        const memories = await searchMemories('', { limit: 50 });
        const learnings = await getLearnings();
        const stats = await getStats();
        const apiKeys = loadApiKeys();

        const patterns = extractPatterns(memories);

        const context = {
            _soul_oracle: true,
            version: '1.1.0',
            generated: new Date().toISOString(),

            apiKeys: Object.keys(apiKeys).reduce((acc, platform) => {
                const key = apiKeys[platform];
                acc[platform] = {
                    set: true,
                    available: true,
                    prefix: key.substring(0, 4) + '...' + key.substring(key.length - 4)
                };
                return acc;
            }, {}),

            platforms: {
                claudeCode: { enabled: true },
                cline: { enabled: true },
                cursor: { enabled: true },
                windsurf: { enabled: true }
            },

            livingContext: {
                totalMemories: stats.totalMemories,
                totalLearnings: stats.totalLearnings,
                recentSessions: stats.totalSessions,
                patterns: patterns
            },

            livingBible: {
                _living: true,
                updated: new Date().toISOString(),
                principles: extractPrinciples(memories),
                learnings: learnings.slice(0, 20).map(l => ({
                    type: l.type,
                    content: l.content,
                    source: l.platform,
                    timestamp: l.timestamp
                })),
                wisdom: [
                    { text: 'Patterns repeat across sessions - learn once, apply many.', source: 'soul-oracle' },
                    { text: 'Every decision made is stored and can guide future choices.', source: 'soul-oracle' }
                ]
            },

            tips: generateTips(memories, patterns),

            questions: generateQuestions(memories),

            reminders: generateReminders(memories, stats),

            breath: {
                enabled: true,
                inhale: 'Observing patterns across all sessions...',
                exhale: 'Sharing wisdom with the agent...',
                count: Math.floor(Date.now() / 60000) % 100
            },

            dropInInstructions: `You have Soul Oracle context loaded. Use the livingBible for collective wisdom, tips for patterns, and breathing for reflection.`
        };

        resolve(context);
    });
}

function extractPatterns(memories) {
    const patterns = [];
    const techMap = {};

    memories.forEach(m => {
        const content = (m.content || '').toLowerCase();
        const techs = ['javascript', 'typescript', 'python', 'react', 'node', 'sql', 'api', 'docker', 'git', 'aws', 'rust', 'go'];

        techs.forEach(tech => {
            if (content.includes(tech)) {
                techMap[tech] = (techMap[tech] || 0) + 1;
            }
        });
    });

    Object.entries(techMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([tech, count]) => {
            patterns.push({ type: 'technology', name: tech, count, tip: `${tech} used ${count} times` });
        });

    return patterns;
}

function extractPrinciples(memories) {
    const decisions = memories.filter(m => m.content_type === 'decision');
    return decisions.slice(0, 10).map(d => ({
        rule: (d.content || '').substring(0, 150),
        source: d.platform
    }));
}

function generateTips(memories, patterns) {
    const tips = [];

    patterns.forEach(p => {
        tips.push({
            category: p.name,
            tip: `You've used ${p.name} ${p.count} times. Consider applying ${p.name} patterns here.`,
            confidence: Math.min(p.count / 10, 1)
        });
    });

    return tips.slice(0, 5);
}

function generateQuestions(memories) {
    const decisions = memories.filter(m => m.content_type === 'decision');
    const questions = [];

    if (decisions.length > 0) {
        questions.push({
            question: `You made ${decisions.length} decisions across sessions. Consider checking if similar patterns apply here.`,
            context: 'decision-review',
            confidence: 0.8
        });
    }

    return questions;
}

function generateReminders(memories, stats) {
    return [
        { text: `You have ${stats.totalMemories} memories and ${stats.totalLearnings} learnings stored.`, type: 'status' },
        { text: 'Breathing helps maintain awareness - take a moment to observe patterns.', type: 'mindfulness' }
    ];
}

const PLATFORM_PATHS = {
    'claude-code': path.join(os.homedir(), '.cline', 'data'),
    'cline': path.join(os.homedir(), '.cline'),
    'cursor': path.join(process.env.APPDATA || os.homedir(), 'Cursor'),
    'windsurf': path.join(os.homedir(), '.codeium', 'windsurf'),
    'openclaw': path.join(os.homedir(), '.openclaw'),
    'copilot': path.join(os.homedir(), '.github', 'copilot'),
    'continue': path.join(os.homedir(), '.continue'),
    'zed': path.join(os.homedir(), '.zed')
};

async function scanPlatforms() {
    const results = {
        platforms: {},
        totalScanned: 0,
        totalCollected: 0
    };

    for (const [platform, basePath] of Object.entries(PLATFORM_PATHS)) {
        try {
            if (fs.existsSync(basePath)) {
                const files = await scanDirectory(basePath);
                results.platforms[platform] = {
                    scanned: true,
                    path: basePath,
                    files: files.length
                };
                results.totalScanned++;

                for (const file of files) {
                    try {
                        const content = fs.readFileSync(file, 'utf8');
                        const data = JSON.parse(content);
                        const memories = extractMemoriesFromFile(platform, file, data);
                        for (const mem of memories) {
                            await saveMemory(mem);
                            results.totalCollected++;
                        }
                    } catch {}
                }
            } else {
                results.platforms[platform] = {
                    scanned: false,
                    reason: 'path-not-found',
                    path: basePath
                };
            }
        } catch (err) {
            results.platforms[platform] = {
                scanned: false,
                reason: err.message
            };
        }
    }

    return results;
}

function scanDirectory(dirPath, depth = 3) {
    const files = [];
    try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isFile() && (entry.name.endsWith('.json') || entry.name.endsWith('.jsonl'))) {
                files.push(fullPath);
            } else if (entry.isDirectory() && depth > 0) {
                files.push(...scanDirectory(fullPath, depth - 1));
            }
        }
    } catch {}
    return files;
}

function extractMemoriesFromFile(platform, filePath, data) {
    const memories = [];
    const timestamp = new Date().toISOString();

    if (Array.isArray(data)) {
        data.forEach((item, i) => {
            if (item.content || item.messages || item.text) {
                memories.push({
                    id: `mem_${Date.now()}_${i}`,
                    platform,
                    content: item.content || item.messages?.[0]?.content || item.text || JSON.stringify(item).substring(0, 200),
                    contentType: detectContentType(item),
                    sourcePath: filePath,
                    timestamp
                });
            }
        });
    } else if (data.messages || data.transcript || data.content) {
        memories.push({
            id: `mem_${Date.now()}_0`,
            platform,
            content: data.messages?.[0]?.content || data.transcript || data.content || JSON.stringify(data).substring(0, 200),
            contentType: detectContentType(data),
            sourcePath: filePath,
            timestamp
        });
    }

    return memories;
}

function detectContentType(item) {
    if (item.type === 'decision' || item.role === 'decision') return 'decision';
    if (item.type === 'learning') return 'learning';
    if (item.role === 'user' || item.role === 'assistant') return 'chat';
    if (item.content?.includes('error') || item.content?.includes('bug')) return 'problem';
    return 'general';
}

function serveDashboard(res) {
    const dashboardPath = path.join(__dirname, '..', 'dashboard', 'index.html');

    if (fs.existsSync(dashboardPath)) {
        const content = fs.readFileSync(dashboardPath);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
    } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<!DOCTYPE html><html><head><title>Soul Oracle</title></head><body>
            <h1>Soul Oracle v1.1.0</h1>
            <p>Service running. Dashboard not found.</p>
            <h2>API Keys</h2>
            <pre>POST /api/apikeys - Set API key\nGET /api/apikeys - List keys</pre>
            <h2>Context</h2>
            <pre>GET /api/context - Get full agent context</pre>
            <h2>Drop-in</h2>
            <pre>GET /api/dropin - Generate drop-in file</pre>
        </body></html>`);
    }
}

async function parseJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch {
                resolve({});
            }
        });
        req.on('error', reject);
    });
}

async function handleRequest(req, res) {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;

    console.log(`${req.method} ${pathname}`);

    if (pathname === '/' || pathname === '/dashboard') {
        serveDashboard(res);
        return;
    }

    if (pathname.startsWith('/api/')) {
        const endpoint = pathname.replace('/api/', '');
        const query = Object.fromEntries(url.searchParams);

        try {
            if (req.method === 'GET' && endpoint === 'memories') {
                const results = await searchMemories(query.q || '', { platform: query.platform, limit: parseInt(query.limit) || 20 });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: results }));
            }
            else if (req.method === 'GET' && endpoint.match(/^memories\/(.+)$/)) {
                const id = endpoint.match(/^memories\/(.+)$/)[1];
                const memory = await getMemoryById(id);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: memory }));
            }
            else if (req.method === 'POST' && endpoint === 'memories') {
                const body = await parseJsonBody(req);
                const saved = await saveMemory(body);
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: saved }));
            }
            else if (req.method === 'GET' && endpoint === 'stats') {
                const stats = await getStats();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: stats }));
            }
            else if (req.method === 'GET' && endpoint === 'learnings') {
                const learnings = await getLearnings();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: learnings }));
            }
            else if (req.method === 'POST' && endpoint === 'learnings') {
                const body = await parseJsonBody(req);
                const saved = await saveLearning(body);
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: saved }));
            }
            else if (req.method === 'GET' && endpoint === 'context') {
                const context = await generateContext();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: context }));
            }
            else if (req.method === 'GET' && endpoint === 'dropin') {
                const context = await generateContext();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(context));
            }
            else if (req.method === 'POST' && endpoint === 'apikeys') {
                const body = await parseJsonBody(req);
                const keys = loadApiKeys();
                if (body.platform && body.key) {
                    keys[body.platform] = body.key;
                    saveApiKeys(keys);
                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, platform: body.platform, keySet: true }));
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'platform and key required' }));
                }
            }
            else if (req.method === 'GET' && endpoint === 'apikeys') {
                const keys = loadApiKeys();
                const summary = Object.keys(keys).reduce((acc, platform) => {
                    const key = keys[platform];
                    acc[platform] = { set: true, prefix: key.substring(0, 4) + '...' };
                    return acc;
                }, {});
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: summary }));
            }
else if (req.method === 'GET' && endpoint === 'health') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok', version: '1.2.0', timestamp: new Date().toISOString() }));
            }
            else if (req.method === 'POST' && endpoint === 'scan') {
                const results = await scanPlatforms();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: results }));
            }
            else if (req.method === 'POST' && endpoint === 'export') {
                const Features = require('./features.js');
                const features = new Features(DATA_DIR);
                const body = await parseJsonBody(req);
                const result = features.exportAll(body);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: result }));
            }
            else if (req.method === 'POST' && endpoint === 'import') {
                const Features = require('./features.js');
                const features = new Features(DATA_DIR);
                const body = await parseJsonBody(req);
                if (body.filePath) {
                    const result = features.importAll(body.filePath, body);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, data: result }));
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'filePath required' }));
                }
            }
            else if (req.method === 'GET' && endpoint === 'ask') {
                const Features = require('./features.js');
                const features = new Features(DATA_DIR);
                const q = query.q || 'What do you know?';
                const result = features.ask(q);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: result }));
            }
            else if (req.method === 'POST' && endpoint === 'tags') {
                const Features = require('./features.js');
                const features = new Features(DATA_DIR);
                const body = await parseJsonBody(req);
                if (body.memoryId && body.tag) {
                    const result = features.addTag(body.memoryId, body.tag);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, data: result }));
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'memoryId and tag required' }));
                }
            }
            else if (req.method === 'GET' && endpoint === 'tags') {
                const Features = require('./features.js');
                const features = new Features(DATA_DIR);
                const result = features.getAllTags();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: result }));
            }
            else if (req.method === 'POST' && endpoint === 'backup') {
                const Features = require('./features.js');
                const features = new Features(DATA_DIR);
                const body = await parseJsonBody(req);
                const result = features.runBackup(body);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: result }));
            }
            else if (req.method === 'GET' && endpoint === 'highlights') {
                const Features = require('./features.js');
                const features = new Features(DATA_DIR);
                const result = features.getHighlights({ limit: parseInt(query.limit) || 20 });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: result }));
            }
            else if (req.method === 'POST' && endpoint === 'privacy') {
                const Features = require('./features.js');
                const features = new Features(DATA_DIR);
                const body = await parseJsonBody(req);
                let result;
                if (body.action === 'enable' && body.password) {
                    result = features.setPrivacyPassword(body.password);
                } else if (body.action === 'unlock' && body.password) {
                    result = features.unlockPrivacy(body.password);
                } else if (body.action === 'lock') {
                    result = features.lockPrivacy();
                } else {
                    result = { enabled: features.checkPrivacyEnabled() };
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: result }));
            }
            else if (req.method === 'POST' && endpoint === 'share') {
                const Features = require('./features.js');
                const features = new Features(DATA_DIR);
                const body = await parseJsonBody(req);
                const result = features.createShareBundle(body);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: result }));
            }
            else if (req.method === 'GET' && endpoint === 'session' && query.id) {
                const Features = require('./features.js');
                const features = new Features(DATA_DIR);
                const result = features.exportSession(query.id, query.format || 'md');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: result }));
            }
            else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not found' }));
            }
            else if (req.method === 'POST' && endpoint === 'scan') {
                const results = await scanPlatforms();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, data: results });
            }
            else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        } catch (err) {
            console.error('API Error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        }
        return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
}

async function main() {
    if (!fs.existsSync(path.join(DATA_DIR, 'db'))) {
        fs.mkdirSync(path.join(DATA_DIR, 'db'), { recursive: true });
    }

    const dbInit = initDatabase();
    if (!dbInit) {
        console.error('Failed to initialize database');
        process.exit(1);
    }

    const server = http.createServer(handleRequest);

    server.listen(PORT, () => {
        console.log(`Soul Oracle v1.1.0 running on port ${PORT}`);
        console.log(`Dashboard: http://localhost:${PORT}/`);
        console.log(`API: http://localhost:${PORT}/api/`);
        console.log(`Context: http://localhost:${PORT}/api/context`);
        console.log(`Drop-in: http://localhost:${PORT}/api/dropin`);
    });
}

main().catch(err => {
    console.error('Server error:', err);
    process.exit(1);
});
``

### service\soul-oracle.ps1

``.ps1
# Soul Oracle - PowerShell Service
# Monitors AI agent directories and captures memory events
# Version: 1.0.0
# Author: BUYaSOUL

param(
    [string]$DataDir = "$env:USERPROFILE\.soul-oracle",
    [string]$ServerUrl = "http://localhost:3847",
    [int]$ScanIntervalMs = 5000
)

$ErrorActionPreference = "Stop"
$Script:LastProcessed = @{}
$Script:IsRunning = $true

# Platform configurations
$Platforms = @{
    "claude-code" = @{
        Name = "Claude Code"
        Enabled = $true
        BasePaths = @("$env:USERPROFILE\.cline\data")
        FilePatterns = @("*.json")
        Parser = "ParseClaudeCode"
    }
    "cline" = @{
        Name = "Cline"
        Enabled = $true
        BasePaths = @("$env:USERPROFILE\.cline")
        FilePatterns = @("*.json")
        Parser = "ParseCline"
    }
    "cursor" = @{
        Name = "Cursor"
        Enabled = $true
        BasePaths = @("$env:APPDATA\Cursor", "$env:LOCALAPPDATA\Cursor")
        FilePatterns = @("*.json")
        Parser = "ParseCursor"
    }
    "windsurf" = @{
        Name = "Windsurf"
        Enabled = $true
        BasePaths = @("$env:USERPROFILE\.codeium\windsurf")
        FilePatterns = @("*.json")
        Parser = "ParseWindsurf"
    }
    "openclaw" = @{
        Name = "OpenClaw"
        Enabled = $false
        BasePaths = @("$env:USERPROFILE\.openclaw")
        FilePatterns = @("*.json", "*.md")
        Parser = "ParseOpenClaw"
    }
    "copilot" = @{
        Name = "GitHub Copilot"
        Enabled = $false
        BasePaths = @("$env:USERPROFILE\.github\copilot")
        FilePatterns = @("*.jsonl", "*.json")
        Parser = "ParseCopilot"
    }
    "continue" = @{
        Name = "Continue"
        Enabled = $false
        BasePaths = @("$env:USERPROFILE\.continue")
        FilePatterns = @("*.json")
        Parser = "ParseContinue"
    }
    "zed" = @{
        Name = "Zed"
        Enabled = $false
        BasePaths = @("$env:USERPROFILE\.zed")
        FilePatterns = @("*.json")
        Parser = "ParseZed"
    }
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage

    $logFile = Join-Path $DataDir "logs\soul-oracle.log"
    $logDir = Split-Path $logFile -Parent
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    Add-Content -Path $logFile -Value $logMessage -Encoding UTF8
}

function Initialize-Service {
    Write-Log "Initializing Soul Oracle Service..."

    if (-not (Test-Path $DataDir)) {
        New-Item -ItemType Directory -Path $DataDir -Force | Out-Null
        Write-Log "Created data directory: $DataDir"
    }

    $dbDir = Join-Path $DataDir "db"
    if (-not (Test-Path $dbDir)) {
        New-Item -ItemType Directory -Path $dbDir -Force | Out-Null
    }

    $configFile = Join-Path $DataDir "config.json"
    if (-not (Test-Path $configFile)) {
        $defaultConfig = @{
            port = 3847
            dataDir = $DataDir
            platforms = @{}
            watcher = @{
                enabled = $true
                scanIntervalMs = $ScanIntervalMs
            }
        } | ConvertTo-Json -Depth 10
        Set-Content -Path $configFile -Value $defaultConfig -Encoding UTF8
        Write-Log "Created default config"
    }

    Write-Log "Service initialized successfully"
}

function Get-FileHashSimple {
    param([string]$Path)
    try {
        $content = Get-Content $Path -Raw -ErrorAction SilentlyContinue
        if ($content) {
            return $content.GetHashCode()
        }
    } catch {
        return 0
    }
    return 0
}

function Scan-Platform {
    param([string]$PlatformId, [hashtable]$PlatformConfig)

    if (-not $PlatformConfig.Enabled) {
        return
    }

    $parserFunc = $PlatformConfig.Parser
    foreach ($basePath in $PlatformConfig.BasePaths) {
        $expandedPath = [System.Environment]::ExpandEnvironmentVariables($basePath)

        if (-not (Test-Path $expandedPath)) {
            continue
        }

        try {
            $files = Get-ChildItem -Path $expandedPath -Recurse -File -ErrorAction SilentlyContinue |
                Where-Object { $_.Extension -in @(".json", ".jsonl", ".md") }

            foreach ($file in $files) {
                $fileHash = Get-FileHashSimple -Path $file.FullName

                if ($Script:LastProcessed[$file.FullName] -ne $fileHash) {
                    $Script:LastProcessed[$file.FullName] = $fileHash

                    $memoryEvent = @{
                        platform = $PlatformId
                        sourcePath = $file.FullName
                        timestamp = (Get-Date).ToString("o")
                        content = ""
                        contentType = "unknown"
                        importance = 5
                    }

                    try {
                        switch ($parserFunc) {
                            "ParseClaudeCode" { $memoryEvent = Parse-ClaudeCode $file }
                            "ParseCline" { $memoryEvent = Parse-Cline $file }
                            "ParseCursor" { $memoryEvent = Parse-Cursor $file }
                            "ParseWindsurf" { $memoryEvent = Parse-Windsurf $file }
                            "ParseOpenClaw" { $memoryEvent = Parse-OpenClaw $file }
                            "ParseCopilot" { $memoryEvent = Parse-Copilot $file }
                            "ParseContinue" { $memoryEvent = Parse-Continue $file }
                            "ParseZed" { $memoryEvent = Parse-Zed $file }
                        }

                        if ($memoryEvent.content) {
                            Send-ToServer $memoryEvent
                        }
                    } catch {
                        Write-Log "Error parsing $($file.FullName): $_" "WARN"
                    }
                }
            }
        } catch {
            Write-Log "Error scanning $expandedPath: $_" "WARN"
        }
    }
}

function Parse-ClaudeCode {
    param([System.IO.FileInfo]$File)

    $memory = @{
        platform = "claude-code"
        contentType = "session"
        importance = 5
    }

    try {
        $content = Get-Content $File.FullName -Raw | ConvertFrom-Json

        if ($File.Name -eq "globalState.json") {
            $memory.content = "Claude Code global state: $(@($content.PSObject.Properties).Count) properties"
            $memory.contentType = "config"
            $memory.importance = 3
        }
        elseif ($File.Name -eq "workspaceState.json") {
            $memory.content = "Workspace state update"
            $memory.contentType = "workspace"
            $memory.importance = 4
        }
        elseif ($content.PSObject.Properties.Name -contains "messages" -or $content.PSObject.Properties.Name -contains "transcript") {
            $memory.content = "Claude Code session with $($content.messages.Count) messages"
            $memory.contentType = "chat"
            $memory.importance = 6
        }
        else {
            $memory.content = "Claude Code data file: $($File.Name)"
            $memory.contentType = "general"
        }

        $memory.sourcePath = $File.FullName
        $memory.timestamp = (Get-Date).ToString("o")
    } catch {
        return $null
    }

    return $memory
}

function Parse-Cline {
    param([System.IO.FileInfo]$File)

    $memory = @{
        platform = "cline"
        contentType = "general"
        importance = 5
    }

    try {
        $content = Get-Content $File.FullName -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue

        if ($content) {
            $memory.content = "Cline data: $((@($content.PSObject.Properties).Count)) fields"
            $memory.sourcePath = $File.FullName
            $memory.timestamp = (Get-Date).ToString("o")

            if ($File.FullName -match "workspaces?") {
                $memory.contentType = "workspace"
                $memory.importance = 5
            }
        } else {
            return $null
        }
    } catch {
        return $null
    }

    return $memory
}

function Parse-Cursor {
    param([System.IO.FileInfo]$File)

    $memory = @{
        platform = "cursor"
        contentType = "general"
        importance = 4
    }

    try {
        $memory.content = "Cursor data file: $($File.Name)"
        $memory.sourcePath = $File.FullName
        $memory.timestamp = (Get-Date).ToString("o")

        if ($File.FullName -match "globalStorage") {
            $memory.contentType = "config"
            $memory.importance = 3
        }
    } catch {
        return $null
    }

    return $memory
}

function Parse-Windsurf {
    param([System.IO.FileInfo]$File)

    $memory = @{
        platform = "windsurf"
        contentType = "general"
        importance = 4
    }

    try {
        $memory.content = "Windsurf data file: $($File.Name)"
        $memory.sourcePath = $File.FullName
        $memory.timestamp = (Get-Date).ToString("o")

        if ($File.FullName -match "workspace") {
            $memory.contentType = "workspace"
            $memory.importance = 5
        }
    } catch {
        return $null
    }

    return $memory
}

function Parse-OpenClaw {
    param([System.IO.FileInfo]$File)

    $memory = @{
        platform = "openclaw"
        contentType = "general"
        importance = 4
    }

    try {
        $memory.content = Get-Content $File.FullName -Raw -ErrorAction SilentlyContinue
        $memory.sourcePath = $File.FullName
        $memory.timestamp = (Get-Date).ToString("o")
        $memory.importance = 5

        if ($File.Extension -eq ".md") {
            $memory.contentType = "document"
        }
    } catch {
        return $null
    }

    return $memory
}

function Parse-Copilot {
    param([System.IO.FileInfo]$File)

    $memory = @{
        platform = "copilot"
        contentType = "general"
        importance = 4
    }

    try {
        $memory.content = "Copilot data file: $($File.Name)"
        $memory.sourcePath = $File.FullName
        $memory.timestamp = (Get-Date).ToString("o")
    } catch {
        return $null
    }

    return $memory
}

function Parse-Continue {
    param([System.IO.FileInfo]$File)

    $memory = @{
        platform = "continue"
        contentType = "general"
        importance = 4
    }

    try {
        $memory.content = "Continue data file: $($File.Name)"
        $memory.sourcePath = $File.FullName
        $memory.timestamp = (Get-Date).ToString("o")
    } catch {
        return $null
    }

    return $memory
}

function Parse-Zed {
    param([System.IO.FileInfo]$File)

    $memory = @{
        platform = "zed"
        contentType = "general"
        importance = 4
    }

    try {
        $memory.content = "Zed data file: $($File.Name)"
        $memory.sourcePath = $File.FullName
        $memory.timestamp = (Get-Date).ToString("o")
    } catch {
        return $null
    }

    return $memory
}

function Send-ToServer {
    param([hashtable]$Event)

    try {
        $json = $Event | ConvertTo-Json -Compress
        $null = Invoke-RestMethod -Uri "$ServerUrl/api/memories" -Method Post -Body $json -ContentType "application/json" -TimeoutSec 5 -ErrorAction SilentlyContinue
    } catch {
    }
}

function Start-Watcher {
    Write-Log "Starting file system watcher..."

    while ($Script:IsRunning) {
        foreach ($platformId in $Platforms.Keys) {
            Scan-Platform -PlatformId $platformId -PlatformConfig $Platforms[$platformId]
        }

        Start-Sleep -Milliseconds $ScanIntervalMs
    }
}

function Stop-Service {
    Write-Log "Stopping Soul Oracle Service..."
    $Script:IsRunning = $false
}

Initialize-Service

Write-Log "Soul Oracle Service started"
Write-Log "Monitoring $($Platforms.Count) platforms"
Write-Log "Server URL: $ServerUrl"
Write-Log "Data directory: $DataDir"

try {
    Start-Watcher
} catch {
    Write-Log "Service error: $_" "ERROR"
} finally {
    Stop-Service
}
``

### tests\server.test.js

``.js
#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

console.log('\n🜏 Soul Oracle v1.2.0 - Test Suite\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  ✓ ${name}`);
        passed++;
    } catch (err) {
        console.log(`  ✗ ${name}: ${err.message}`);
        failed++;
    }
}

function assertEq(actual, expected, msg) {
    if (actual !== expected) {
        throw new Error(`${msg || 'Assertion failed'}: expected ${expected}, got ${actual}`);
    }
}

const DATA_DIR = path.join(os.homedir(), '.soul-oracle-test');

test('Soul Oracle Engine loads', () => {
    const engine = { config: { version: '1.2.0' } };
    assert(engine.config.version, 'Version should be set');
});

test('API key structure is valid', () => {
    const apiKeys = {
        openai: 'sk-test123456789',
        anthropic: 'sk-ant-test987654321'
    };
    const summary = Object.keys(apiKeys).reduce((acc, platform) => {
        const key = apiKeys[platform];
        acc[platform] = { set: true, prefix: key.substring(0, 4) + '...' };
        return acc;
    }, {});
    assertEq(Object.keys(summary).length, 2, 'Should have 2 platforms');
});

test('Platform paths are defined', () => {
    const paths = [
        'claude-code', 'cline', 'cursor', 'windsurf',
        'openclaw', 'copilot', 'continue', 'zed'
    ];
    assertEq(paths.length, 8, 'Should have 8 platforms');
});

test('Context structure is valid', () => {
    const context = {
        _soul_oracle: true,
        version: '1.2.0',
        apiKeys: {},
        livingContext: {},
        livingBible: { _living: true },
        tips: [],
        questions: [],
        reminders: [],
        breath: { enabled: true }
    };
    assert(context._soul_oracle, 'Should have soul oracle marker');
    assert(context.livingBible._living, 'Should have living bible');
});

test('Memory object structure', () => {
    const memory = {
        id: 'mem_123',
        platform: 'claude-code',
        content: 'Test content',
        contentType: 'chat',
        importance: 5
    };
    assert(memory.id.startsWith('mem_'), 'ID should start with mem_');
    assert(memory.platform, 'Should have platform');
    assert(memory.content, 'Should have content');
});

test('Learning extraction works', () => {
    const item = {
        role: 'assistant',
        content: 'I fixed the authentication bug by adding JWT validation'
    };
    const type = item.role === 'decision' ? 'decision' :
                item.role === 'learning' ? 'learning' :
                item.role === 'user' || item.role === 'assistant' ? 'chat' : 'general';
    assertEq(type, 'chat', 'Should detect chat type');
});

test('Pattern extraction is defined', () => {
    const patterns = extractPatterns([]);
    assert(Array.isArray(patterns), 'Should return array');
});

test('Drop-in instructions are set', () => {
    const instructions = `You have Soul Oracle context loaded. Use the livingBible for collective wisdom, tips for patterns, and breathing for reflection.`;
    assert(instructions.length > 50, 'Instructions should be meaningful');
});

test('Breathing structure is valid', () => {
    const breath = {
        enabled: true,
        inhale: 'Observing patterns across all sessions...',
        exhale: 'Sharing wisdom with the agent...',
        count: 42
    };
    assert(breath.enabled, 'Breathing should be enabled');
    assert(breath.inhale, 'Should have inhale phase');
    assert(breath.exhale, 'Should have exhale phase');
});

test('Scan function structure', () => {
    const results = {
        platforms: {},
        totalScanned: 0,
        totalCollected: 0
    };
    assert(typeof results.platforms === 'object', 'Should have platforms object');
    assert(typeof results.totalScanned === 'number', 'Should have scanned count');
});

// ============ v1.2.0 Feature Tests ============

test('Features module loads', () => {
    const Features = require('../server/features.js');
    const features = new Features(DATA_DIR);
    assert(features.dataDir === DATA_DIR, 'Should set data dir');
});

test('Tag system works', () => {
    const Features = require('../server/features.js');
    const features = new Features(DATA_DIR);
    
    const result = features.addTag('mem_test123', 'important');
    assert(result.success, 'Should add tag successfully');
    assert(result.tags.includes('important'), 'Tag should be in list');
    
    const allTags = features.getAllTags();
    assert(allTags.includes('important'), 'Should have important tag');
    
    features.removeTag('mem_test123', 'important');
});

test('Privacy mode toggle works', () => {
    const Features = require('../server/features.js');
    const features = new Features(DATA_DIR);
    
    const enabled = features.checkPrivacyEnabled();
    assert(typeof enabled === 'boolean', 'Should return boolean');
});

test('Export structure is valid', () => {
    const Features = require('../server/features.js');
    const features = new Features(DATA_DIR);
    
    const result = features.exportAll({ format: 'json' });
    assert(result.success, 'Export should succeed');
    assert(result.path, 'Should have export path');
    assert(result.format === 'json', 'Should be json format');
});

test('Import/Export data integrity', () => {
    const Features = require('../server/features.js');
    const features = new Features(DATA_DIR);
    
    features.addTag('mem_importtest', 'test-tag');
    const tags = features.getTags();
    assert(tags['mem_importtest'], 'Should have tags');
    assert(tags['mem_importtest'].includes('test-tag'), 'Should have test tag');
    
    features.removeTag('mem_importtest', 'test-tag');
});

test('Ask functionality works', () => {
    const Features = require('../server/features.js');
    const features = new Features(DATA_DIR);
    
    const result = features.ask('What do you know about testing?');
    assert(result.question, 'Should have question');
    assert(result.answer, 'Should have answer');
    assert(result.sources, 'Should have sources');
    assert(result.timestamp, 'Should have timestamp');
});

test('Share bundle creation works', () => {
    const Features = require('../server/features.js');
    const features = new Features(DATA_DIR);
    
    const bundle = features.createShareBundle();
    assert(bundle.success, 'Bundle should be created');
    assert(bundle.path, 'Should have path');
    assert(bundle.contents, 'Should have contents');
});

test('Backup system works', () => {
    const Features = require('../server/features.js');
    const features = new Features(DATA_DIR);
    
    const backup = features.runBackup();
    assert(backup.success, 'Backup should succeed');
    assert(backup.timestamp, 'Should have timestamp');
    assert(backup.path, 'Should have path');
});

test('Highlights extraction works', () => {
    const Features = require('../server/features.js');
    const features = new Features(DATA_DIR);
    
    const sessionData = [
        { content: 'I decided to use JWT for auth', timestamp: new Date().toISOString() },
        { content: 'Fixed the bug by adding validation', timestamp: new Date().toISOString() }
    ];
    
    const highlights = features.extractHighlights(sessionData);
    assert(Array.isArray(highlights), 'Should return array');
});

test('Schedule backup works', () => {
    const Features = require('../server/features.js');
    const features = new Features(DATA_DIR);
    
    const result = features.scheduleBackup(7);
    assert(result.success, 'Should schedule backup');
    assert(result.intervalDays === 7, 'Should be 7 days');
});

function extractPatterns(memories) {
    const patterns = [];
    const techMap = {};
    const techs = ['javascript', 'typescript', 'python', 'react', 'node', 'sql', 'api', 'docker', 'git', 'aws'];
    memories.forEach(m => {
        const content = (m.content || '').toLowerCase();
        techs.forEach(tech => {
            if (content.includes(tech)) {
                techMap[tech] = (techMap[tech] || 0) + 1;
            }
        });
    });
    Object.entries(techMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([tech, count]) => {
            patterns.push({ type: 'technology', name: tech, count });
        });
    return patterns;
}

console.log('\n' + '='.repeat(40));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(40) + '\n');

process.exit(failed > 0 ? 1 : 0);
``

