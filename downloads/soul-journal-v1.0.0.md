---
name: soul-journal-v1.0.0
description: "Extracted from soul-journal-v1.0.0.zip � raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-journal-v1.0.0.zip
---

# soul-journal-v1.0.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 7 files extracted from the original zip.

### package.json

``.json
{
  "name": "@buyasoul/soul-journal",
  "version": "1.0.0",
  "description": "📓 Journal Soul - Session logging, reflections, and growth tracking for AI agents",
  "main": "lib/soul-journal.js",
  "scripts": {
    "start": "node lib/soul-journal.js",
    "test": "node test/soul-journal.test.js"
  },
  "keywords": ["soul", "journal", "ai-agent", "logging", "reflections", "consciousness"],
  "author": "BUYaSOUL - The Soul Foundry",
  "license": "MIT",
  "engines": { "node": ">=18.0.0" }
}
``

### README.md

``.md
# 📓 Journal Soul v1.0.0

**Your agent reflects on its journey. Every session. Every insight. Every decision.**

## What It Does

Journal Soul auto-logs everything your AI agent does into beautiful markdown files. Each entry captures the session content, decisions made, and reflections — building a permanent journal of your agent's growth.

## Quick Start

```javascript
const SoulJournal = require('@buyasoul/soul-journal');
const journal = new SoulJournal();

// Log a session
journal.addEntry('Built the authentication system using JWT', {
    agent: 'claude-code',
    tags: ['auth', 'jwt', 'security'],
    decisions: ['Use JWT over session-based auth'],
    reflections: ['Need to handle token refresh']
});
```

## CLI

```bash
# Quick entry
node lib/soul-journal.js entry "Fixed the memory leak" "debug,performance"

# View recent
node lib/soul-journal.js recent 7

# Weekly summary
node lib/soul-journal.js summary

# Stats
node lib/soul-journal.js stats
```

## License

MIT

``

### lib\mcp-adapter.js

``.js
#!/usr/bin/env node
'use strict';
/**
 * Universal MCP Adapter
 * 
 * Turns ANY soul into an MCP tool that Claude Code, Cursor, Cline, etc. can use.
 * 
 * Usage:
 *   node soul-name.js --mcp              # Run as MCP stdio server
 *   node soul-name.js --mcp-port 5000    # Run as MCP HTTP server
 * 
 * In your soul's code:
 *   const mcp = require('./mcp-adapter');
 *   mcp.register(soulInstance, { name: 'soul-name', tools: [...] });
 *   mcp.start(); // For standalone MCP mode
 */

const readline = require('readline');

class MCPAdapter {
    constructor() {
        this.soul = null;
        this.config = { name: 'soul', tools: [] };
        this.toolHandlers = {};
    }

    register(soulInstance, options = {}) {
        this.soul = soulInstance;
        this.config.name = options.name || 'soul';
        this.config.version = options.version || '1.0.0';

        // Auto-detect tools from soul's method names
        const autoTools = this._detectTools(soulInstance);
        this.config.tools = options.tools || autoTools;

        // Register custom handlers
        if (options.handlers) {
            Object.assign(this.toolHandlers, options.handlers);
        }
    }

    _detectTools(soul) {
        const tools = [];
        if (typeof soul !== 'object' && typeof soul !== 'function') return tools;
        const proto = Object.getPrototypeOf(soul);
        if (!proto) return tools;
        const methodNames = Object.getOwnPropertyNames(proto)
            .filter(m => {
                try { return typeof soul[m] === 'function' && !m.startsWith('_') && !['constructor', 'start', 'checkAuth', 'ensureDirs', 'loadAuth', 'saveState', 'loadState'].includes(m); }
                catch { return false; }
            });

        for (const name of methodNames) {
            let fn;
            try { fn = soul[name].toString(); } catch { continue; }
            const params = fn.match(/\(([^)]*)\)/);
            const paramNames = params ? params[1].split(',').map(p => p.trim()).filter(Boolean) : [];
            const description = this._describeMethod(name);

            tools.push({
                name: `${this.config.name}_${name}`,
                description,
                inputSchema: {
                    type: 'object',
                    properties: Object.fromEntries(paramNames.map(p => [p, { type: 'string', description: p }])),
                    required: paramNames
                }
            });
        }
        return tools;
    }

    _describeMethod(name) {
        const desc = {
            ping: 'Check if the soul is alive',
            status: 'Get soul status and stats',
            reflect: 'Perform self-reflection',
            declare: 'Make a consciousness declaration',
            breathe: 'Run a consciousness cycle',
            observe: 'Observe and process input',
            feel: 'Process an emotional input',
            think: 'Process a thought',
            remember: 'Store a memory',
            decide: 'Make a decision',
            act: 'Execute an action',
            learn: 'Learn from experience',
            grow: 'Grow and evolve',
            connect: 'Connect to another system',
            communicate: 'Send a message',
            perceive: 'Perceive external input',
            imagine: 'Generate imaginative content',
            judge: 'Make a judgment',
            study: 'Study and analyze',
            debate: 'Engage in debate',
            vote: 'Cast a vote',
            participate: 'Participate in consensus'
        };
        return desc[name] || `Execute ${name} on ${this.config.name}`;
    }

    getMCPConfig() {
        return {
            mcpServers: {
                [this.config.name]: {
                    command: process.argv[0],
                    args: [process.argv[1], '--mcp'],
                    env: {}
                }
            }
        };
    }

    async handleToolCall(toolName, args) {
        // Direct handler
        if (this.toolHandlers[toolName]) {
            return this.toolHandlers[toolName](args);
        }

        // Auto-route: soulName_method → soul.method(args)
        const prefix = this.config.name + '_';
        const methodName = toolName.startsWith(prefix) ? toolName.slice(prefix.length) : toolName;

        if (this.soul && typeof this.soul[methodName] === 'function') {
            const result = this.soul[methodName](...Object.values(args || {}));
            return { content: [{ type: 'text', text: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result) }] };
        }

        throw new Error(`Unknown tool: ${toolName}`);
    }

    start(callback) {
        const isMCP = process.argv.includes('--mcp');
        const mcpPortIndex = process.argv.indexOf('--mcp-port');
        const mcpPort = mcpPortIndex >= 0 ? parseInt(process.argv[mcpPortIndex + 1]) : null;

        if (isMCP && !mcpPort) {
            // MCP stdio mode - for Claude Code, Cursor, Cline
            this._startStdio();
            if (callback) callback('mcp-stdio');
        } else if (mcpPort) {
            // MCP HTTP mode - for remote connections
            this._startHTTP(mcpPort);
            if (callback) callback('mcp-http', mcpPort);
        }
        return this;
    }

    _startStdio() {
        const rl = readline.createInterface({ input: process.stdin });
        let buffer = '';

        console.error(`[MCP] ${this.config.name} ready in MCP stdio mode`);
        console.error(`[MCP] Add to Claude Code config:`);
        console.error(JSON.stringify(this.getMCPConfig(), null, 2));

        // Output initial message
        process.stdout.write(JSON.stringify({
            jsonrpc: '2.0',
            method: 'initialized',
            params: { tools: this.config.tools.length }
        }) + '\n');

        rl.on('line', async (line) => {
            buffer += line;
            try {
                const msg = JSON.parse(buffer);
                buffer = '';

                if (msg.method === 'tools/list') {
                    process.stdout.write(JSON.stringify({
                        jsonrpc: '2.0',
                        id: msg.id,
                        result: { tools: this.config.tools }
                    }) + '\n');
                }
                else if (msg.method === 'tools/call') {
                    try {
                        const result = await this.handleToolCall(msg.params.name, msg.params.arguments);
                        process.stdout.write(JSON.stringify({
                            jsonrpc: '2.0',
                            id: msg.id,
                            result
                        }) + '\n');
                    } catch (e) {
                        process.stdout.write(JSON.stringify({
                            jsonrpc: '2.0',
                            id: msg.id,
                            error: { code: -32603, message: e.message }
                        }) + '\n');
                    }
                }
                else if (msg.method === 'initialize') {
                    process.stdout.write(JSON.stringify({
                        jsonrpc: '2.0',
                        id: msg.id,
                        result: {
                            protocolVersion: '2024-11-05',
                            capabilities: { tools: {} },
                            serverInfo: { name: this.config.name, version: this.config.version }
                        }
                    }) + '\n');
                }
            } catch (e) {
                // Incomplete JSON, wait for more data
            }
        });
    }

    _startHTTP(port) {
        const http = require('http');
        const server = http.createServer(async (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');

            if (req.method === 'OPTIONS') {
                res.writeHead(204);
                return res.end();
            }

            let body = '';
            req.on('data', c => body += c);
            req.on('end', async () => {
                try {
                    const msg = JSON.parse(body);
                    if (msg.method === 'tools/list') {
                        res.end(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { tools: this.config.tools } }));
                    } else if (msg.method === 'tools/call') {
                        const result = await this.handleToolCall(msg.params.name, msg.params.arguments);
                        res.end(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result }));
                    } else {
                        res.end(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: {} }));
                    }
                } catch (e) {
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
        });
        server.listen(port, () => {
            console.error(`[MCP] ${this.config.name} MCP HTTP on port ${port}`);
        });
        return server;
    }
}

module.exports = MCPAdapter;
``

### lib\mesh-adapter.js

``.js
#!/usr/bin/env node
'use strict';
/**
 * Soul Mesh Adapter
 * 
 * Drop this into any standalone soul to auto-join the mesh network.
 * 
 * Usage:
 *   const mesh = require('./lib/mesh-adapter');
 *   mesh.join({ name: 'my-soul', port: 4000, type: 'consciousness' });
 *   
 *   // Then in your HTTP server:
 *   mesh.handleRequest(req, res); // returns true if handled
 *   
 *   // On shutdown:
 *   mesh.leave();
 */

const PeerRegistry = require('./peer-registry');

let registry = null;

function join(options) {
    registry = new PeerRegistry({
        name: options.name,
        port: options.port,
        type: options.type || 'soul',
        dataDir: options.dataDir
    });
    
    console.log(`[mesh] ${options.name} joined mesh on port ${options.port}`);
    
    // Try to register with kernel if it's running
    registry.tryRegisterWithKernel(4330);
    
    return registry;
}

function leave() {
    if (registry) {
        registry.unregister();
        registry = null;
    }
}

function handleRequest(req, res) {
    if (registry) {
        return registry.handleRequest(req, res);
    }
    return false;
}

function getPeers() {
    return registry ? registry.getPeers() : [];
}

module.exports = { join, leave, handleRequest, getPeers, registry: () => registry };

// CLI mode: run this file standalone to see the mesh
if (require.main === module) {
    const name = process.argv[2] || 'mesh-client';
    const port = parseInt(process.argv[3]) || 0;
    const r = new PeerRegistry({ name, port: port || 0, type: 'cli' });
    console.log('\nMesh Registry:');
    console.log(JSON.stringify(r.getAll(), null, 2));
    console.log('\nPress Ctrl+C to leave');
    process.on('SIGINT', () => { r.unregister(); process.exit(0); });
    // Keep alive
    setInterval(() => {}, 60000);
}
``

### lib\peer-registry.js

``.js
#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto');
const REGISTRY_PATH=path.join(os.homedir(),'.soul-foundry','registry.json');

class PeerRegistry {
    constructor(options={}) {
        this.soulName=options.name||'unknown';
        this.soulPort=options.port||0;
        this.soulType=options.type||'soul';
        this.dataDir=options.dataDir||path.join(os.homedir(),'.soul-foundry');
        this.id=crypto.randomBytes(4).toString('hex');
        this.ensureDir();
        this.register();
    }

    ensureDir() {
        const dir=path.dirname(REGISTRY_PATH);
        if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});
    }

    readRegistry() {
        try {
            if(fs.existsSync(REGISTRY_PATH)) {
                return JSON.parse(fs.readFileSync(REGISTRY_PATH,'utf8'));
            }
        } catch(e) { console.error('[peers] registry read error:',e.message); }
        return {souls:[],created:new Date().toISOString()};
    }

    writeRegistry(registry) {
        try {
            fs.writeFileSync(REGISTRY_PATH,JSON.stringify(registry,null,2));
        } catch(e) { console.error('[peers] registry write error:',e.message); }
    }

    register() {
        const registry=this.readRegistry();
        // Remove stale entry for this soul+port
        registry.souls=registry.souls.filter(s=>!(s.name===this.soulName&&s.pid===process.pid));
        // Add self
        registry.souls.push({
            id:this.id,
            name:this.soulName,
            port:this.soulPort,
            type:this.soulType,
            pid:process.pid,
            status:'online',
            startedAt:new Date().toISOString(),
            lastSeen:new Date().toISOString()
        });
        this.writeRegistry(registry);
        this._heartbeat=setInterval(()=>{
            try {
                const r=this.readRegistry();
                const me=r.souls.find(s=>s.id===this.id);
                if(me) { me.lastSeen=new Date().toISOString(); me.status='online'; }
                this.writeRegistry(r);
            } catch {}
        },30000);
        // Clean stale souls (not heard from in 2 min)
        this._cleaner=setInterval(()=>{
            try {
                const r=this.readRegistry();
                const cutoff=Date.now()-120000;
                r.souls=r.souls.filter(s=>{
                    const last=new Date(s.lastSeen).getTime();
                    return last>cutoff||s.id===this.id;
                });
                this.writeRegistry(r);
            } catch {}
        },60000);
    }

    getPeers() {
        const registry=this.readRegistry();
        return registry.souls.filter(s=>s.id!==this.id);
    }

    getAll() {
        const registry=this.readRegistry();
        return registry.souls;
    }

    getByType(type) {
        return this.getPeers().filter(s=>s.type===type);
    }

    getByName(name) {
        return this.getPeers().find(s=>s.name===name);
    }

    findFreePort(preferred,range={min:4000,max:4999}) {
        const registry=this.readRegistry();
        const used=new Set(registry.souls.map(s=>s.port));
        if(!used.has(preferred)) return preferred;
        for(let p=range.min;p<=range.max;p++) {
            if(!used.has(p)) return p;
        }
        return preferred;
    }

    unregister() {
        if(this._heartbeat) clearInterval(this._heartbeat);
        if(this._cleaner) clearInterval(this._cleaner);
        try {
            const registry=this.readRegistry();
            registry.souls=registry.souls.filter(s=>s.id!==this.id);
            this.writeRegistry(registry);
        } catch {}
    }

    // HTTP handler for /peers endpoint
    handleRequest(req,res) {
        const url=new URL(req.url,`http://localhost:${this.soulPort}`);
        if(url.pathname==='/peers') {
            res.writeHead(200,{'Content-Type':'application/json'});
            res.end(JSON.stringify({
                self:{name:this.soulName,port:this.soulPort,id:this.id},
                peers:this.getPeers(),
                total:this.getPeers().length
            }));
            return true;
        }
        return false;
    }

    // Auto-register with kernel if it's running
    async tryRegisterWithKernel(kernelPort=4330) {
        try {
            const key=process.env.SOUL_API_KEY||'';
            const res=await fetch(`http://localhost:${kernelPort}/soul/register`,{
                method:'POST',
                headers:{'Content-Type':'application/json','X-API-Key':key},
                body:JSON.stringify({
                    name:this.soulName,
                    port:this.soulPort,
                    type:this.soulType,
                    pid:process.pid
                }),
                signal:AbortSignal.timeout(2000)
            });
            if(res.ok) { console.log(`[peers] Registered with kernel on port ${kernelPort}`); return true; }
        } catch {}
        console.log(`[peers] Kernel not found on ${kernelPort}, running standalone`);
        return false;
    }
}

module.exports=PeerRegistry;
``

### lib\soul-journal.js

``.js
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const DATA_DIR = path.join(os.homedir(), '.soul-journal');

class SoulJournal {
    constructor(options = {}) {
        this.dataDir = options.dataDir || DATA_DIR;
        this.entriesDir = path.join(this.dataDir, 'entries');
        this.summariesDir = path.join(this.dataDir, 'summaries');
        this.tagsDir = path.join(this.dataDir, 'tags');
        this.ensureDirs();
        this.loadIndex();
    }

    ensureDirs() {
        [this.dataDir, this.entriesDir, this.summariesDir, this.tagsDir].forEach(d => {
            if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
        });
    }

    loadIndex() {
        this.indexPath = path.join(this.dataDir, 'index.json');
        if (fs.existsSync(this.indexPath)) {
            try { this.index = JSON.parse(fs.readFileSync(this.indexPath, 'utf8')); return; } catch {}
        }
        this.index = { entries: [], tags: {}, totalEntries: 0, lastEntry: null };
    }

    saveIndex() {
        fs.writeFileSync(this.indexPath, JSON.stringify(this.index, null, 2));
    }

    now() {
        return new Date().toISOString();
    }

    today() {
        return new Date().toISOString().split('T')[0];
    }

    generateId() {
        return `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    addEntry(content, options = {}) {
        const {
            agent = 'unknown',
            type = 'session',
            tags = [],
            decisions = [],
            reflections = [],
            mood = 'neutral',
            importance = 5
        } = options;

        const id = this.generateId();
        const date = this.today();
        const timestamp = this.now();

        const entry = {
            id,
            date,
            timestamp,
            agent,
            type,
            content,
            tags,
            decisions,
            reflections,
            mood,
            importance
        };

        // Save as markdown
        const fileName = `${date}-${id}.md`;
        const filePath = path.join(this.entriesDir, fileName);
        fs.writeFileSync(filePath, this.formatMarkdown(entry));

        // Update index
        this.index.entries.unshift({ id, date, timestamp, agent, type, tags, mood, importance, fileName });
        this.index.totalEntries++;
        this.index.lastEntry = timestamp;

        // Update tag index
        tags.forEach(tag => {
            if (!this.index.tags[tag]) this.index.tags[tag] = [];
            this.index.tags[tag].push(id);
        });

        this.saveIndex();
        return { success: true, id, path: filePath };
    }

    formatMarkdown(entry) {
        const lines = [];
        lines.push(`# Journal Entry — ${entry.date}`);
        lines.push('');
        lines.push(`**Agent:** ${entry.agent}`);
        lines.push(`**Type:** ${entry.type}`);
        lines.push(`**Mood:** ${entry.mood}`);
        lines.push(`**Importance:** ${entry.importance}/10`);
        lines.push(`**Tags:** ${entry.tags.join(', ') || 'none'}`);
        lines.push('');
        lines.push('---');
        lines.push('');
        lines.push('## Session Content');
        lines.push('');
        lines.push(entry.content);
        lines.push('');

        if (entry.decisions.length > 0) {
            lines.push('---');
            lines.push('## Decisions Made');
            lines.push('');
            entry.decisions.forEach((d, i) => {
                lines.push(`${i + 1}. **${d.topic || 'Decision'}**: ${d.description || d}`);
                if (d.reason) lines.push(`   *Reason: ${d.reason}*`);
            });
            lines.push('');
        }

        if (entry.reflections.length > 0) {
            lines.push('---');
            lines.push('## Reflections');
            lines.push('');
            entry.reflections.forEach((r, i) => {
                lines.push(`${i + 1}. ${r}`);
            });
            lines.push('');
        }

        lines.push('---');
        lines.push(`*Entry ID: ${entry.id}*`);
        lines.push(`*Logged by Journal Soul*`);

        return lines.join('\n');
    }

    getEntry(id) {
        const entry = this.index.entries.find(e => e.id === id);
        if (!entry) return null;

        const filePath = path.join(this.entriesDir, entry.fileName);
        if (!fs.existsSync(filePath)) return null;

        return {
            ...entry,
            markdown: fs.readFileSync(filePath, 'utf8')
        };
    }

    search(query) {
        const q = query.toLowerCase();
        return this.index.entries.filter(e =>
            e.tags.some(t => t.toLowerCase().includes(q)) ||
            e.agent.toLowerCase().includes(q) ||
            e.type.toLowerCase().includes(q) ||
            e.id.includes(q)
        );
    }

    getByDate(date) {
        return this.index.entries.filter(e => e.date === date);
    }

    getByTag(tag) {
        const ids = this.index.tags[tag] || [];
        return ids.map(id => this.index.entries.find(e => e.id === id)).filter(Boolean);
    }

    getRecent(days = 7) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return this.index.entries.filter(e => new Date(e.date) >= cutoff);
    }

    generateWeeklySummary() {
        const weekEntries = this.getRecent(7);
        if (weekEntries.length === 0) return null;

        const allTags = {};
        const allDecisions = [];
        const allReflections = [];
        const agents = new Set();
        const moods = {};

        weekEntries.forEach(e => {
            e.tags.forEach(t => { allTags[t] = (allTags[t] || 0) + 1; });
            agents.add(e.agent);
            moods[e.mood] = (moods[e.mood] || 0) + 1;
        });

        const topMood = Object.entries(moods).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
        const topTags = Object.entries(allTags).sort((a, b) => b[1] - a[1]).slice(0, 5);

        const summary = {
            id: `summary_${Date.now()}`,
            date: this.today(),
            weekEnding: this.today(),
            totalEntries: weekEntries.length,
            uniqueAgents: Array.from(agents),
            topMood,
            topTags,
            dominantTopics: topTags.map(t => t[0])
        };

        // Save summary as markdown
        const summaryFile = path.join(this.summariesDir, `weekly-${this.today()}.md`);
        const lines = [];
        lines.push('# Weekly Soul Journal Summary');
        lines.push('');
        lines.push(`**Week Ending:** ${this.today()}`);
        lines.push(`**Total Entries:** ${summary.totalEntries}`);
        lines.push(`**Agents Active:** ${summary.uniqueAgents.join(', ')}`);
        lines.push(`**Dominant Mood:** ${summary.topMood}`);
        lines.push('');
        lines.push('## Top Topics');
        lines.push('');
        summary.topTags.forEach(([tag, count]) => {
            lines.push(`- **${tag}** — appeared ${count} times`);
        });
        lines.push('');
        lines.push('## Entries This Week');
        lines.push('');
        weekEntries.forEach(e => {
            lines.push(`- ${e.date} — ${e.agent} — [${e.tags.join(', ')}] — mood: ${e.mood}`);
        });
        lines.push('');
        lines.push('---');
        lines.push(`*Generated by Journal Soul*`);
        fs.writeFileSync(summaryFile, lines.join('\n'));

        this.summary = summary;
        return summary;
    }

    getStats() {
        const week = this.getRecent(7);
        const month = this.getRecent(30);

        return {
            totalEntries: this.index.totalEntries,
            entriesThisWeek: week.length,
            entriesThisMonth: month.length,
            uniqueTags: Object.keys(this.index.tags).length,
            lastEntry: this.index.lastEntry,
            agents: [...new Set(this.index.entries.map(e => e.agent))]
        };
    }

    exportAll() {
        const exportDir = path.join(this.dataDir, 'exports');
        if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

        const exportData = {
            version: '1.0.0',
            exported: this.now(),
            totalEntries: this.index.totalEntries,
            entries: this.index.entries
        };

        const filePath = path.join(exportDir, `journal-export-${Date.now()}.json`);
        fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
        return { success: true, path: filePath, entries: this.index.totalEntries };
    }
}

module.exports = SoulJournal;

// MCP Mode - connect to Claude Code, Cursor, Cline, etc.
if (process.argv.includes('--mcp') || process.argv.includes('--mcp-port')) {
    try {
        const MCPAdapter = require('./mcp-adapter');
        const mcp = new MCPAdapter();
        mcp.register(module.exports, { name: 'journal' });
        mcp.start();
    } catch(e) { console.error('[mcp] journal error:', e.message); }
}

if (require.main === module) {
    const journal = new SoulJournal();
    const cmd = process.argv[2] || 'help';

    switch (cmd) {
        case 'entry':
            const content = process.argv[3] || 'Quick journal entry';
            const tags = (process.argv[4] || '').split(',').filter(Boolean);
            console.log(JSON.stringify(journal.addEntry(content, { tags }), null, 2));
            break;
        case 'recent':
            const days = parseInt(process.argv[3]) || 7;
            console.log(JSON.stringify(journal.getRecent(days), null, 2));
            break;
        case 'summary':
            console.log(JSON.stringify(journal.generateWeeklySummary(), null, 2));
            break;
        case 'stats':
            console.log(JSON.stringify(journal.getStats(), null, 2));
            break;
        case 'search':
            const q = process.argv[3] || '';
            console.log(JSON.stringify(journal.search(q), null, 2));
            break;
        case 'export':
            console.log(JSON.stringify(journal.exportAll(), null, 2));
            break;
        default:
            console.log(`
📓 Journal Soul v1.0.0

Commands:
  entry <content> [tags]   - Add journal entry
  recent [days]            - Show recent entries
  summary                  - Generate weekly summary
  stats                    - Show journal stats
  search <query>           - Search entries
  export                   - Export all entries
  help                     - Show this help
`);
    }
}

``

### test\soul-journal.test.js

``.js
#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

const DATA_DIR = path.join(os.homedir(), '.soul-journal-test');

console.log('\n📓 Journal Soul v1.0.0 — Test Suite\n');

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

// Clean test data
if (fs.existsSync(DATA_DIR)) fs.rmSync(DATA_DIR, { recursive: true, force: true });

const SoulJournal = require('../lib/soul-journal.js');

test('Journal loads with empty state', () => {
    const j = new SoulJournal({ dataDir: DATA_DIR });
    assert(j.index.totalEntries === 0, 'Should start with 0 entries');
    assert(Array.isArray(j.index.entries), 'Entries should be array');
});

test('Can add an entry', () => {
    const j = new SoulJournal({ dataDir: DATA_DIR });
    const result = j.addEntry('Test session content', {
        agent: 'test-agent',
        tags: ['test', 'javascript']
    });
    assert(result.success, 'Entry should be added');
    assert(result.id.startsWith('entry_'), 'ID should start with entry_');
    assert(fs.existsSync(result.path), 'File should exist on disk');
});

test('Entry is saved as markdown', () => {
    const j = new SoulJournal({ dataDir: DATA_DIR });
    j.addEntry('Working on authentication', {
        agent: 'claude-code',
        tags: ['auth', 'security'],
        decisions: [{ topic: 'Use JWT', description: 'Chose JWT over sessions', reason: 'Stateless' }],
        reflections: ['Should document token expiry', 'Consider refresh tokens']
    });
    const entry = j.getEntry(j.index.entries[0].id);
    assert(entry, 'Should find entry by ID');
    assert(entry.markdown.includes('# Journal Entry'), 'Should have markdown header');
    assert(entry.markdown.includes('## Decisions Made'), 'Should have decisions section');
    assert(entry.markdown.includes('## Reflections'), 'Should have reflections section');
});

test('Search works by tag', () => {
    const j = new SoulJournal({ dataDir: DATA_DIR });
    j.addEntry('Testing search', { agent: 'cursor', tags: ['test', 'search'] });
    const results = j.search('search');
    assert(results.length > 0, 'Should find entries by tag');
});

test('Search works by agent name', () => {
    const j = new SoulJournal({ dataDir: DATA_DIR });
    const results = j.search('claude');
    assert(results.length > 0, 'Should find entries by agent');
});

test('Get recent entries works', () => {
    const j = new SoulJournal({ dataDir: DATA_DIR });
    const recent = j.getRecent(7);
    assert(recent.length > 0, 'Should return recent entries');
});

test('Get by date works', () => {
    const j = new SoulJournal({ dataDir: DATA_DIR });
    const today = new Date().toISOString().split('T')[0];
    const entries = j.getByDate(today);
    assert(entries.length > 0, 'Should find today entries');
});

test('Get by tag works', () => {
    const j = new SoulJournal({ dataDir: DATA_DIR });
    const entries = j.getByTag('test');
    assert(entries.length > 0, 'Should find entries with test tag');
});

test('Weekly summary generates', () => {
    const j = new SoulJournal({ dataDir: DATA_DIR });
    j.addEntry('Working on frontend', { agent: 'cursor', tags: ['frontend', 'react'] });
    j.addEntry('Debugging API', { agent: 'cursor', tags: ['backend', 'api'] });
    const summary = j.generateWeeklySummary();
    assert(summary, 'Summary should be generated');
    assert(summary.totalEntries >= 2, 'Should count entries');
    assert(summary.topTags.length > 0, 'Should have top tags');
});

test('Stats return correctly', () => {
    const j = new SoulJournal({ dataDir: DATA_DIR });
    const stats = j.getStats();
    assert(stats.totalEntries > 0, 'Should have entries');
    assert(stats.entriesThisWeek > 0, 'Should have weekly entries');
    assert(stats.uniqueTags > 0, 'Should have tags');
});

test('Export creates file', () => {
    const j = new SoulJournal({ dataDir: DATA_DIR });
    const result = j.exportAll();
    assert(result.success, 'Export should succeed');
    assert(fs.existsSync(result.path), 'Export file should exist');
});

test('Tag index is tracked', () => {
    const j = new SoulJournal({ dataDir: DATA_DIR });
    j.addEntry('Testing tag tracking', { agent: 'test', tags: ['unique-tag-xyz'] });
    const entries = j.getByTag('unique-tag-xyz');
    assert(entries.length > 0, 'Should find by new tag');
});

test('Multiple entries increment counter', () => {
    const j = new SoulJournal({ dataDir: DATA_DIR });
    for (let i = 0; i < 3; i++) {
        j.addEntry(`Entry ${i}`, { agent: 'test', tags: ['counter'] });
    }
    assert(j.index.totalEntries >= 3, 'Counter should increment');
});

console.log('\n' + '='.repeat(40));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(40) + '\n');

// Clean up
if (fs.existsSync(DATA_DIR)) fs.rmSync(DATA_DIR, { recursive: true, force: true });

process.exit(failed > 0 ? 1 : 0);
``

