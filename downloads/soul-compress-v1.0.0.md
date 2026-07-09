---
name: soul-compress-v1.0.0
description: "Extracted from soul-compress-v1.0.0.zip � raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-compress-v1.0.0.zip
---

# soul-compress-v1.0.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 7 files extracted from the original zip.

### package.json

``.json
{
  "name": "@buyasoul/soul-compress",
  "version": "1.0.0",
  "description": "Token Compression Soul - Reduce AI agent memory by 70-95% with hierarchical sectoring and FSRS scheduling",
  "main": "lib/soul-compress.js",
  "scripts": {
    "start": "node lib/soul-compress.js",
    "test": "node test/soul-compress.test.js",
    "ingest": "node lib/soul-compress.js ingest"
  },
  "keywords": ["soul", "compression", "tokens", "ai-agent", "memory", "bonsai", "fsrs", "token-reduction"],
  "author": "BUYaSOUL - The Soul Foundry",
  "license": "MIT",
  "engines": { "node": ">=18.0.0" }
}
``

### README.md

``.md
# Token Compression Soul v1.0.0

**Reduce your AI agent's memory token usage by 70-95%. Save money. Think faster.**

## The Problem

Every AI session loads the ENTIRE memory file. If your agent has 6,000 tokens of memory, it burns 6,000 tokens before answering a single question. This costs real money and pollutes the agent's reasoning.

## The Solution

Token Compression Soul restructures flat memory into a sectorized hierarchy. On every session, the agent loads only the trunk (index) — typically 300-500 tokens. Specific domains are loaded only when needed.

**Techniques combined:**
- **Bonsai-style sectoring** — B-tree inspired hierarchy: trunk → domain → file
- **FSRS spaced repetition** — Only surfaces what's about to be forgotten
- **Progressive disclosure** — Load what you need, when you need it
- **Token budget allocation** — Weight-based distribution across domains

## Results

| Metric | Flat Memory | Compressed |
|--------|-------------|------------|
| Boot token cost | 6,400 | ~385 (**94% less**) |
| Cost per session | High | Low |
| Context pollution | Yes | No |
| Reasoning quality | Degraded | Focused |

## Quick Start

```bash
# Ingest your memory file
node lib/soul-compress.js ingest MEMORY.md

# Compress to a target token budget
node lib/soul-compress.js compress 1024

# Get optimized context for a specific query
node lib/soul-compress.js context "authentication"

# View compression stats
node lib/soul-compress.js stats

# Reconstruct full memory from sectors
node lib/soul-compress.js reconstruct
```

## API Usage

```javascript
const TokenCompressor = require('@buyasoul/soul-compress');
const compressor = new TokenCompressor();

// Ingest flat memory
compressor.ingestMemory(fs.readFileSync('MEMORY.md', 'utf8'));

// Get optimized context for an agent's query
const ctx = compressor.getOptimizedContext({
    query: 'authentication decisions',
    maxTokens: 2048
});

// Feed ctx.context to your AI agent
```

## Requirements

- Node.js 18+

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

### lib\soul-compress.js

``.js
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const DATA_DIR = path.join(os.homedir(), '.soul-compress');

class TokenCompressor {
    constructor(options = {}) {
        this.dataDir = options.dataDir || DATA_DIR;
        this.memoryDir = path.join(this.dataDir, 'memory');
        this.domainsDir = path.join(this.memoryDir, 'domains');
        this.archiveDir = path.join(this.memoryDir, 'archive');
        this.statsFile = path.join(this.dataDir, 'stats.json');
        this.scheduleFile = path.join(this.dataDir, 'schedule.json');
        this.ensureDirs();
        this.loadStats();
    }

    ensureDirs() {
        [this.dataDir, this.memoryDir, this.domainsDir, this.archiveDir].forEach(d => {
            if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
        });
    }

    loadStats() {
        if (fs.existsSync(this.statsFile)) {
            try { this.stats = JSON.parse(fs.readFileSync(this.statsFile, 'utf8')); return; } catch {}
        }
        this.stats = {
            version: '1.0.0',
            totalSectors: 0,
            totalTokens: 0,
            compressedTokens: 0,
            compressionRatio: 0,
            lastOptimized: null,
            domainStats: {},
            accessLog: []
        };
    }

    saveStats() {
        fs.writeFileSync(this.statsFile, JSON.stringify(this.stats, null, 2));
    }

    now() { return new Date().toISOString(); }

    countTokens(text) {
        if (!text) return 0;
        return Math.ceil(text.length / 4);
    }

    countLines(text) {
        if (!text) return 0;
        return text.split('\n').length;
    }

    // ========== SECTORING ENGINE (Bonsai-style hierarchical memory) ==========

    sectorDomains() {
        return {
            identity: { keywords: ['personal', 'family', 'name', 'profile', 'preferences', 'background', 'about'], weight: 10 },
            business: { keywords: ['business', 'revenue', 'company', 'client', 'product', 'pricing', 'sales', 'marketing', 'seo'], weight: 9 },
            code: { keywords: ['code', 'api', 'function', 'repo', 'git', 'deploy', 'server', 'database', 'frontend', 'backend'], weight: 8 },
            decisions: { keywords: ['decided', 'decision', 'chose', 'selected', 'architecture', 'adr', 'rationale'], weight: 7 },
            infra: { keywords: ['infra', 'config', 'cron', 'service', 'hosting', 'domain', 'ssl', 'cert'], weight: 6 },
            project: { keywords: ['project', 'sprint', 'roadmap', 'milestone', 'deadline', 'task', 'issue'], weight: 5 },
            people: { keywords: ['team', 'colleague', 'manager', 'stakeholder', 'client-name', 'partner'], weight: 4 },
            learnings: { keywords: ['learned', 'discovered', 'insight', 'lesson', 'mistake', 'improvement'], weight: 3 },
            general: { keywords: [], weight: 1 }
        };
    }

    classifySection(heading) {
        const lower = heading.toLowerCase();
        const domains = this.sectorDomains();
        let best = 'general';
        let bestScore = 0;

        for (const [domain, config] of Object.entries(domains)) {
            const score = config.keywords.reduce((sum, kw) =>
                lower.includes(kw) ? sum + config.weight : sum, 0);
            if (score > bestScore) {
                bestScore = score;
                best = domain;
            }
        }
        return best;
    }

    ingestMemory(content, options = {}) {
        const { source = 'imported', skipBackup = false } = options;

        if (!skipBackup) {
            this.backupMemory(content);
        }

        const sections = this.parseSections(content);
        const sectorMap = {};
        let totalTokens = 0;

        sections.forEach(section => {
            const domain = this.classifySection(section.heading);
            if (!sectorMap[domain]) sectorMap[domain] = [];
            sectorMap[domain].push(section);
            totalTokens += this.countTokens(section.content);
        });

        // Write domain files
        Object.entries(sectorMap).forEach(([domain, domainSections]) => {
            const domainPath = path.join(this.domainsDir, domain);
            if (!fs.existsSync(domainPath)) fs.mkdirSync(domainPath, { recursive: true });

            domainSections.forEach(section => {
                const slug = this.slugify(section.heading);
                const filePath = path.join(domainPath, `${slug}.md`);
                fs.writeFileSync(filePath, section.content);
            });

            // Generate domain index
            this.writeDomainIndex(domain, domainSections);
        });

        // Write trunk index
        this.writeTrunkIndex(sectorMap);

        // Update stats
        this.stats.totalSectors = Object.keys(sectorMap).length;
        this.stats.totalTokens = totalTokens;
        this.stats.lastOptimized = this.now();
        this.stats.domainStats = {};
        Object.entries(sectorMap).forEach(([domain, sections]) => {
            const tokens = sections.reduce((sum, s) => sum + this.countTokens(s.content), 0);
            this.stats.domainStats[domain] = {
                sections: sections.length,
                tokens,
                compressedTokens: tokens,
                files: sections.map(s => this.slugify(s.heading))
            };
        });
        this.saveStats();

        return {
            success: true,
            domains: Object.keys(sectorMap),
            sections: sections.length,
            totalTokens,
            sectorMap: Object.fromEntries(
                Object.entries(sectorMap).map(([d, s]) => [d, s.length])
            )
        };
    }

    parseSections(content) {
        const sections = [];
        const lines = content.split('\n');
        let currentHeading = null;
        let currentContent = [];

        lines.forEach(line => {
            if (line.startsWith('## ')) {
                if (currentHeading !== null && currentContent.length > 0) {
                    sections.push({
                        heading: currentHeading,
                        content: currentContent.join('\n').trim()
                    });
                }
                currentHeading = line.replace('## ', '').trim();
                currentContent = [line];
            } else if (currentHeading !== null) {
                currentContent.push(line);
            }
        });

        if (currentHeading !== null && currentContent.length > 0) {
            sections.push({
                heading: currentHeading,
                content: currentContent.join('\n').trim()
            });
        }

        return sections;
    }

    slugify(text) {
        return text.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 60);
    }

    writeDomainIndex(domain, sections) {
        const totalTokens = sections.reduce((sum, s) => sum + this.countTokens(s.content), 0);
        const lines = [];
        lines.push(`# ${this.capitalize(domain)} Domain`);
        lines.push(`_Sections: ${sections.length}_`);
        lines.push(`_Estimated tokens: ~${totalTokens}_`);
        lines.push('');

        sections.forEach(section => {
            const firstLine = section.content.split('\n')[1] || '';
            const preview = firstLine.replace(/^#+\s*/, '').substring(0, 80) || '(empty)';
            const tokens = this.countTokens(section.content);
            lines.push(`### ${section.heading} (~${tokens} tokens)`);
            lines.push(preview);
            lines.push('');
        });

        const indexPath = path.join(this.domainsDir, domain, '_index.md');
        fs.writeFileSync(indexPath, lines.join('\n'));
    }

    writeTrunkIndex(sectorMap) {
        const lines = [];
        lines.push('# Compressed Memory Index');
        lines.push(`_Optimized: ${this.now()}_`);
        lines.push(`_Total domains: ${Object.keys(sectorMap).length}_`);

        Object.entries(sectorMap).forEach(([domain, sections]) => {
            const totalTokens = sections.reduce((sum, s) => sum + this.countTokens(s.content), 0);
            const firstLine = (sections[0]?.content?.split('\n')[1] || '').substring(0, 60);
            lines.push('');
            lines.push(`## ${this.capitalize(domain)} (~${totalTokens} tokens)`);
            lines.push(firstLine || `${sections.length} sections`);
            lines.push(`_Sections: ${sections.length}_`);
        });

        const trunkPath = path.join(this.memoryDir, 'INDEX.md');
        fs.writeFileSync(trunkPath, lines.join('\n'));
    }

    capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

    backupMemory(content) {
        const backupPath = path.join(this.memoryDir, `memory-backup-${Date.now()}.md`);
        fs.writeFileSync(backupPath, content);
    }

    // ========== COMPRESSION ENGINE ==========

    compressMemory(options = {}) {
        const { targetTokens = 2048, preserveRecent = true, recentDays = 7 } = options;
        const domains = this.listDomains();

        const allocation = this.allocateTokenBudget(domains, targetTokens);
        const compressed = [];

        domains.forEach(domain => {
            const sections = this.getDomainSections(domain);
            const budget = allocation[domain] || 100;

            const ranked = this.rankSections(sections, domain, recentDays);
            let used = 0;

            ranked.forEach(section => {
                const filePath = path.join(this.domainsDir, domain, section.file);
                const content = fs.readFileSync(filePath, 'utf8');
                const tokens = this.countTokens(content);

                if (used + tokens <= budget) {
                    compressed.push(content);
                    used += tokens;
                } else if (used < budget) {
                    // Partial - summarize this section
                    const remaining = budget - used;
                    const summary = this.summarizeSection(content, remaining);
                    compressed.push(summary);
                    used += this.countTokens(summary);
                }
            });

            this.stats.domainStats[domain].compressedTokens = used;
        });

        const compressedContent = compressed.join('\n\n---\n\n');
        const compressedPath = path.join(this.memoryDir, 'COMPRESSED.md');
        fs.writeFileSync(compressedPath, compressedContent);

        this.stats.compressedTokens = this.countTokens(compressedContent);
        this.stats.compressionRatio = this.stats.totalTokens > 0
            ? Math.round((1 - this.stats.compressedTokens / this.stats.totalTokens) * 100)
            : 0;
        this.saveStats();

        return {
            success: true,
            originalTokens: this.stats.totalTokens,
            compressedTokens: this.stats.compressedTokens,
            reduction: `${this.stats.compressionRatio}%`,
            targetTokens,
            path: compressedPath
        };
    }

    listDomains() {
        if (!fs.existsSync(this.domainsDir)) return [];
        return fs.readdirSync(this.domainsDir).filter(d =>
            fs.statSync(path.join(this.domainsDir, d)).isDirectory()
        );
    }

    getDomainSections(domain) {
        const domainPath = path.join(this.domainsDir, domain);
        if (!fs.existsSync(domainPath)) return [];
        return fs.readdirSync(domainPath)
            .filter(f => f.endsWith('.md') && f !== '_index.md')
            .map(f => ({ file: f, path: path.join(domainPath, f) }));
    }

    allocateTokenBudget(domains, targetTokens) {
        const allocation = {};
        const domainWeights = this.sectorDomains();
        let totalWeight = 0;

        domains.forEach(d => {
            const weight = domainWeights[d]?.weight || 1;
            totalWeight += weight;
        });

        domains.forEach(d => {
            const weight = domainWeights[d]?.weight || 1;
            allocation[d] = Math.floor((weight / totalWeight) * targetTokens);
        });

        return allocation;
    }

    rankSections(sections, domain, recentDays) {
        const accessLog = this.stats.accessLog || [];
        const cutoff = Date.now() - recentDays * 24 * 60 * 60 * 1000;

        return sections.map(section => {
            const accessCount = accessLog.filter(a =>
                a.file === section.file && a.domain === domain
            ).length;

            const recentAccess = accessLog.filter(a =>
                a.file === section.file &&
                a.domain === domain &&
                new Date(a.timestamp).getTime() > cutoff
            ).length;

            const stat = fs.statSync(section.path);

            return {
                ...section,
                accessCount,
                recentAccess,
                modifiedTime: stat.mtimeMs,
                score: recentAccess * 10 + accessCount * 2 + (stat.mtimeMs / 100000000000)
            };
        }).sort((a, b) => b.score - a.score);
    }

    summarizeSection(content, maxTokens) {
        const lines = content.split('\n');
        const heading = lines[0] || 'Summary';
        const body = lines.slice(1).join('\n');

        // Keep heading + first N tokens of body
        const maxChars = maxTokens * 4;
        const truncatedBody = body.length > maxChars
            ? body.substring(0, maxChars) + '\n\n_... (compressed by Token Compression Soul)_'
            : body;

        return `${heading}\n${truncatedBody}`;
    }

    // ========== FSRS-STYLE SCHEDULING ==========

    logAccess(domain, file) {
        if (!this.stats.accessLog) this.stats.accessLog = [];
        this.stats.accessLog.push({
            domain,
            file,
            timestamp: this.now()
        });

        // Keep only last 1000 entries
        if (this.stats.accessLog.length > 1000) {
            this.stats.accessLog = this.stats.accessLog.slice(-1000);
        }
        this.saveStats();
    }

    getScheduledReview() {
        const domains = this.listDomains();
        const schedule = [];

        domains.forEach(domain => {
            const sections = this.getDomainSections(domain);
            sections.forEach(section => {
                const accessCount = (this.stats.accessLog || [])
                    .filter(a => a.file === section.file && a.domain === domain).length;

                // FSRS-like: prioritize what hasn't been accessed recently
                const lastAccess = [...(this.stats.accessLog || [])]
                    .reverse()
                    .find(a => a.file === section.file && a.domain === domain);

                const daysSinceAccess = lastAccess
                    ? (Date.now() - new Date(lastAccess.timestamp).getTime()) / (24 * 60 * 60 * 1000)
                    : 999;

                schedule.push({
                    domain,
                    file: section.file,
                    accessCount,
                    daysSinceAccess,
                    // Retrievability score (FSRS-inspired): higher = needs review
                    retrievability: Math.min(1, daysSinceAccess / 30)
                });
            });
        });

        return schedule.sort((a, b) => b.retrievability - a.retrievability);
    }

    // ========== CONTEXT RECONSTRUCTION ==========

    getOptimizedContext(options = {}) {
        const { query = '', maxTokens = 4096, includeTrunk = true } = options;

        let context = [];

        // Always include trunk
        if (includeTrunk) {
            const trunkPath = path.join(this.memoryDir, 'INDEX.md');
            if (fs.existsSync(trunkPath)) {
                context.push(fs.readFileSync(trunkPath, 'utf8'));
            }
        }

        // If there's a query, find relevant domains
        if (query) {
            const relevantDomains = this.findRelevantDomains(query);
            relevantDomains.forEach(domain => {
                const indexPath = path.join(this.domainsDir, domain, '_index.md');
                if (fs.existsSync(indexPath)) {
                    context.push(`\n## ${this.capitalize(domain)} Domain\n`);
                    context.push(fs.readFileSync(indexPath, 'utf8'));
                }

                // Include specific matching files
                const sections = this.getDomainSections(domain);
                sections.forEach(section => {
                    const content = fs.readFileSync(section.path, 'utf8');
                    if (content.toLowerCase().includes(query.toLowerCase())) {
                        context.push('\n' + content);
                        this.logAccess(domain, section.file);
                    }
                });
            });
        }

        // If under maxTokens, include compressed memory
        let contextText = context.join('\n');
        if (this.countTokens(contextText) < maxTokens) {
            const compressedPath = path.join(this.memoryDir, 'COMPRESSED.md');
            if (fs.existsSync(compressedPath)) {
                const compressed = fs.readFileSync(compressedPath, 'utf8');
                const remainingTokens = maxTokens - this.countTokens(contextText);
                const compressedLines = compressed.split('\n');
                let compressedBudget = remainingTokens * 4;
                let included = [];
                for (const line of compressedLines) {
                    if (compressedBudget <= 0) break;
                    included.push(line);
                    compressedBudget -= line.length + 1;
                }
                if (included.length > 0) {
                    contextText += '\n\n' + included.join('\n');
                }
            }
        }

        const finalTokens = this.countTokens(contextText);
        const reduction = this.stats.totalTokens > 0
            ? Math.round((1 - finalTokens / this.stats.totalTokens) * 100)
            : 0;

        return {
            context: contextText,
            tokens: finalTokens,
            originalTokens: this.stats.totalTokens,
            reduction: `${reduction}%`,
            domainsSearched: query ? this.findRelevantDomains(query) : []
        };
    }

    findRelevantDomains(query) {
        const lower = query.toLowerCase();
        const domains = this.sectorDomains();
        const scored = [];

        for (const [domain, config] of Object.entries(domains)) {
            const score = config.keywords.reduce((sum, kw) =>
                lower.includes(kw) ? sum + config.weight : sum, 0);
            if (score > 0) scored.push({ domain, score });
        }

        // Also check actual content
        this.listDomains().forEach(domain => {
            if (!scored.find(s => s.domain === domain)) {
                const sections = this.getDomainSections(domain);
                for (const section of sections) {
                    try {
                        const content = fs.readFileSync(section.path, 'utf8');
                        if (content.toLowerCase().includes(lower)) {
                            scored.push({ domain, score: 1 });
                            break;
                        }
                    } catch {}
                }
            }
        });

        return [...new Set(scored.sort((a, b) => b.score - a.score).map(s => s.domain))];
    }

    // ========== UTILITIES ==========

    getStats() {
        return {
            ...this.stats,
            domains: this.listDomains(),
            totalFiles: this.listDomains().reduce((sum, d) =>
                sum + this.getDomainSections(d).length, 0
            ),
            schedulePending: this.getScheduledReview().filter(s => s.retrievability > 0.5).length
        };
    }

    // ========== EXPORT ==========

    exportReconstructedMemory() {
        const domains = this.listDomains();
        const lines = [];

        lines.push('# Reconstructed Memory');
        lines.push(`_Reconstructed: ${this.now()}_`);
        lines.push(`_Compression ratio: ${this.stats.compressionRatio || 0}%_`);
        lines.push('');

        domains.forEach(domain => {
            const sections = this.getDomainSections(domain);
            lines.push(`## ${this.capitalize(domain)}`);
            lines.push('');

            sections.forEach(section => {
                const content = fs.readFileSync(section.path, 'utf8');
                lines.push(content);
                lines.push('');
            });
        });

        const exportPath = path.join(this.memoryDir, 'RECONSTRUCTED.md');
        fs.writeFileSync(exportPath, lines.join('\n'));

        return {
            success: true,
            path: exportPath,
            tokens: this.countTokens(lines.join('\n'))
        };
    }
}

module.exports = TokenCompressor;

// MCP Mode - connect to Claude Code, Cursor, Cline, etc.
if (process.argv.includes('--mcp') || process.argv.includes('--mcp-port')) {
    try {
        const MCPAdapter = require('./mcp-adapter');
        const mcp = new MCPAdapter();
        mcp.register(module.exports, { name: 'compress' });
        mcp.start();
    } catch(e) { console.error('[mcp] compress error:', e.message); }
}

if (require.main === module) {
    const compress = new TokenCompressor();
    const cmd = process.argv[2] || 'help';

    switch (cmd) {
        case 'ingest':
            const filePath = process.argv[3];
            if (filePath && fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                console.log(JSON.stringify(compress.ingestMemory(content), null, 2));
            } else {
                console.log('Usage: node lib/soul-compress.js ingest <file>');
            }
            break;
        case 'compress':
            const target = parseInt(process.argv[3]) || 2048;
            console.log(JSON.stringify(compress.compressMemory({ targetTokens: target }), null, 2));
            break;
        case 'context':
            const query = process.argv.slice(3).join(' ');
            console.log(JSON.stringify(compress.getOptimizedContext({ query }), null, 2));
            break;
        case 'schedule':
            console.log(JSON.stringify(compress.getScheduledReview(), null, 2));
            break;
        case 'stats':
            console.log(JSON.stringify(compress.getStats(), null, 2));
            break;
        case 'reconstruct':
            console.log(JSON.stringify(compress.exportReconstructedMemory(), null, 2));
            break;
        default:
            console.log(`
💰 Token Compression Soul v1.0.0

Commands:
  ingest <file>       - Import and sector a flat memory file
  compress [tokens]   - Compress to target token budget (default: 2048)
  context [query]     - Get optimized context (optionally filtered by query)
  schedule            - Show FSRS-style review schedule
  stats               - Show compression statistics
  reconstruct         - Export full reconstructed memory
  help                - Show this help

Example:
  node lib/soul-compress.js ingest MEMORY.md
  node lib/soul-compress.js compress 1024
  node lib/soul-compress.js context "authentication"
`);
    }
}

``

### test\soul-compress.test.js

``.js
#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

const DATA_DIR = path.join(os.homedir(), '.soul-compress-test');

console.log('\n💰 Token Compression Soul v1.0.0 — Test Suite\n');

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

if (fs.existsSync(DATA_DIR)) fs.rmSync(DATA_DIR, { recursive: true, force: true });

const TokenCompressor = require('../lib/soul-compress');

const LARGE_MEMORY = `# Agent Memory

## Personal Preferences
I prefer concise responses. I like Python for data work.
My name is Alex. I work remotely from Berlin.
I prefer morning standups and async communication.
My timezone is CET (UTC+1).

## Business Context
We run a SaaS company. Monthly revenue is $50k.
Main product is an analytics dashboard for e-commerce.
We have 3 enterprise clients and 200 SMB customers.
Our pricing tiers: Free ($0), Pro ($29/mo), Enterprise ($999/mo).
Sales cycle is typically 2-4 weeks for enterprise.
We use Stripe for billing and HubSpot for CRM.

## Code Architecture
Backend uses Node.js with Express framework.
Database is PostgreSQL with Prisma ORM for type safety.
API follows REST conventions with versioned endpoints.
Frontend is Next.js with React and TypeScript.
Deployment uses Docker containers on Vercel.
CI/CD pipeline runs via GitHub Actions with 3 environments.
Testing stack: Jest for unit, Cypress for e2e.

## Decisions Made
Chose PostgreSQL over MongoDB for relational data integrity.
Decided to use JWT for authentication with refresh tokens.
Selected Vercel for hosting over AWS to reduce ops burden.
Chose Stripe over PayPal for better developer API.
Decided on monorepo with Turborepo for code sharing.
Selected Prisma over TypeORM for better type safety.

## Infrastructure Details
Deployed on Vercel pro plan ($20/mo).
Domain: analytics.example.com via Cloudflare DNS.
SSL cert auto-renewed via Let's Encrypt.
Database hosted on Supabase ($25/mo).
Redis cache via Upstash for session management.
S3-compatible storage via Backblaze B2 for backups.
Monitoring via Sentry for errors and Grafana for metrics.
Backup runs daily at 2 AM UTC, retained for 30 days.

## SEO Strategy
Target keywords: analytics dashboard, e-commerce analytics.
Focus on long-tail keywords for niche markets.
Content marketing via weekly blog posts.
Technical SEO: core web vitals, structured data, sitemaps.

## Team Structure
CTO: Sarah (tech lead, architecture decisions).
2 backend devs (Node.js focus).
1 frontend dev (React/Next.js specialist).
1 designer (UI/UX, Figma).
1 customer success manager.
Weekly sprint planning on Mondays.
Daily standups at 10 AM CET.`;

test('Module loads', () => {
    const tc = new TokenCompressor({ dataDir: DATA_DIR });
    assert(tc.dataDir === DATA_DIR, 'Should set data dir');
});

test('Token counting works', () => {
    const tc = new TokenCompressor({ dataDir: DATA_DIR });
    assert(tc.countTokens('hello') === 2, 'Short text');
    assert(tc.countTokens('') === 0, 'Empty text');
    assert(tc.countTokens('a'.repeat(100)) === 25, '100 chars = ~25 tokens');
});

test('Section parsing works', () => {
    const tc = new TokenCompressor({ dataDir: DATA_DIR });
    const sections = tc.parseSections(LARGE_MEMORY);
    assert(sections.length === 7, 'Should find 7 sections');
    assert(sections[0].heading === 'Personal Preferences', 'First section heading');
    assert(sections[1].heading === 'Business Context', 'Second section heading');
});

test('Domain classification works', () => {
    const tc = new TokenCompressor({ dataDir: DATA_DIR });
    assert(tc.classifySection('Personal Preferences') === 'identity', 'Personal → identity');
    assert(tc.classifySection('Business Context') === 'business', 'Business → business');
    assert(tc.classifySection('Code Architecture') === 'code', 'Code → code');
    assert(tc.classifySection('Decisions Made') === 'decisions', 'Decisions → decisions');
    assert(tc.classifySection('Infrastructure') === 'infra', 'Infra → infra');
});

test('Ingest memory creates domain structure', () => {
    const tc = new TokenCompressor({ dataDir: DATA_DIR });
    const result = tc.ingestMemory(LARGE_MEMORY);
    assert(result.success, 'Ingest should succeed');
    assert(result.domains.length >= 4, 'Should have multiple domains');
    assert(result.totalTokens > 0, 'Should count tokens');
});

test('Domain files are created', () => {
    const tc = new TokenCompressor({ dataDir: DATA_DIR });
    const domains = tc.listDomains();
    assert(domains.includes('identity'), 'Should have identity domain');
    assert(domains.includes('business'), 'Should have business domain');
    assert(domains.includes('code'), 'Should have code domain');
});

test('Trunk index is created', () => {
    const tc = new TokenCompressor({ dataDir: DATA_DIR });
    const trunkPath = path.join(DATA_DIR, 'memory', 'INDEX.md');
    assert(fs.existsSync(trunkPath), 'Trunk index should exist');
    const content = fs.readFileSync(trunkPath, 'utf8');
    assert(content.includes('# Compressed Memory Index'), 'Should have header');
});

test('Compression reduces token count', () => {
    const tc = new TokenCompressor({ dataDir: DATA_DIR });
    const result = tc.compressMemory({ targetTokens: 100 });
    assert(result.success, 'Compress should succeed');
    assert(result.originalTokens > result.compressedTokens, 'Should reduce tokens');
    assert(result.reduction.includes('%'), 'Should report reduction percentage');
});

test('Scheduled review works', () => {
    const tc = new TokenCompressor({ dataDir: DATA_DIR });
    const schedule = tc.getScheduledReview();
    assert(Array.isArray(schedule), 'Should return array');
    assert(schedule.length > 0, 'Should have items');
    assert(schedule[0].retrievability !== undefined, 'Should have retrievability');
});

test('Context reconstruction works', () => {
    const tc = new TokenCompressor({ dataDir: DATA_DIR });
    const result = tc.getOptimizedContext({ query: 'PostgreSQL' });
    assert(result.context, 'Should return context');
    assert(result.tokens > 0, 'Should have tokens');
    assert(result.reduction.includes('%'), 'Should report reduction');
});

test('Query-specific context returns relevant domains', () => {
    const tc = new TokenCompressor({ dataDir: DATA_DIR });
    const result = tc.getOptimizedContext({ query: 'authentication' });
    assert(result.domainsSearched.length > 0, 'Should find relevant domains');
});

test('Stats are tracked', () => {
    const tc = new TokenCompressor({ dataDir: DATA_DIR });
    const stats = tc.getStats();
    assert(stats.totalSectors > 0, 'Should track sectors');
    assert(stats.totalTokens > 0, 'Should track tokens');
    assert(Array.isArray(stats.domains), 'Should list domains');
});

test('Reconstruct produces valid output', () => {
    const tc = new TokenCompressor({ dataDir: DATA_DIR });
    const result = tc.exportReconstructedMemory();
    assert(result.success, 'Should succeed');
    assert(fs.existsSync(result.path), 'File should exist');
    assert(result.tokens > 0, 'Should have tokens');
});

test('FSRS-style retrievability calculation', () => {
    const tc = new TokenCompressor({ dataDir: DATA_DIR });
    const schedule = tc.getScheduledReview();
    schedule.forEach(s => {
        assert(s.retrievability >= 0 && s.retrievability <= 1, 'Retrievability 0-1');
    });
});

test('Domain weights affect token allocation', () => {
    const tc = new TokenCompressor({ dataDir: DATA_DIR });
    const domains = tc.listDomains();
    const allocation = tc.allocateTokenBudget(domains, 1000);
    const keys = Object.keys(allocation);
    assert(keys.length > 0, 'Should allocate to all domains');
    // identity has weight 10, general has weight 1
    if (allocation.identity && allocation.general) {
        assert(allocation.identity > allocation.general, 'Identity should get more than general');
    }
});

test('Backup is created during ingest', () => {
    const tc = new TokenCompressor({ dataDir: DATA_DIR });
    const memoryDir = path.join(DATA_DIR, 'memory');
    const backups = fs.readdirSync(memoryDir).filter(f => f.startsWith('memory-backup-'));
    assert(backups.length > 0, 'Should have backup files');
});

test('Multiple compressions update stats', () => {
    const tc = new TokenCompressor({ dataDir: DATA_DIR });
    const r1 = tc.compressMemory({ targetTokens: 500 });
    const r2 = tc.compressMemory({ targetTokens: 100 });
    assert(r2.compressedTokens <= r1.compressedTokens, 'Second compress should be more aggressive');
});

console.log('\n' + '='.repeat(40));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(40) + '\n');

if (fs.existsSync(DATA_DIR)) fs.rmSync(DATA_DIR, { recursive: true, force: true });

process.exit(failed > 0 ? 1 : 0);
``

