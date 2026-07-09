---
name: soul-judgment-v1.0.0
description: "Extracted from soul-judgment-v1.0.0.zip � raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-judgment-v1.0.0.zip
---

# soul-judgment-v1.0.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 10 files extracted from the original zip.

### bundle.js

``.js
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, 'lib', 'soul-judgment.js');
const dest = path.join(__dirname, 'lib', 'soul-judgment.min.js');
let code = fs.readFileSync(src, 'utf8');
code = code.replace(/\nif \(require\.main === module\)[\s\S]*$/, '');
code = code.replace(/^module\.exports = JudgmentSoul;/m, '');
code = code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
code = code.replace(/\n{3,}/g, '\n\n').replace(/^\s+/gm, '');
const out = `#!/usr/bin/env node\n'use strict';\n/* Judgment Soul v1.0.0 - Protected Core */\n${code}\nmodule.exports = { JudgmentSoul };\n`;
fs.writeFileSync(dest, out);
console.log('Bundle: ' + dest + ' (' + out.length + ' bytes)');
``

### package.json

``.json
{"name":"@buyasoul/soul-judgment","version":"1.0.0","description":"Judgment Soul - PLT Council of 4 Gods. Profit + Love - Tax = True Value","main":"lib/judgment.js","scripts":{"start":"node lib/judgment.js","test":"node test/soul-judgment.test.js","judge":"node lib/judgment.js judge"},"keywords":["soul","judgment","plt","gods","council","decision","ai-agent"],"author":"BUYaSOUL - The Soul Foundry","license":"MIT","engines":{"node":">=18.0.0"}}
``

### README.md

``.md
# ⚖️ Judgment Soul v1.0.0

**PLT Council of 4 Gods — Profit + Love - Tax = True Value**

The Judgment Soul convenes a council of 4 gods to deliberate on any decision. Each god evaluates from their unique perspective:

- **Profit Prime** — The Sovereign of Gain (P:0.9 L:0.05 T:0.05)
- **Love Weaver** — The Tender of Bonds (P:0.1 L:0.85 T:0.05)
- **Tax Collector** — The Keeper of Balance (P:0.05 L:0.05 T:0.9)
- **Harvester** — The Reaper of Yield (P:0.4 L:0.3 T:0.3)

## Quick Start

```bash
npm start
# Server on port 4150, API key in ~/.soul-judgment/.key
```

## CLI

```bash
# Quick judgment (no server needed)
node lib/judgment.js judge "Should we expand to Europe?"

# List gods
node lib/judgment.js gods

# Start server
node lib/judgment.js
```

## API

```bash
# Convene the council
curl -X POST http://localhost:4150/judge \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"topic":"Should we invest in growth?","context":"Current revenue $50k/mo"}'

# List gods
curl http://localhost:4150/gods -H "X-API-Key: your-key"
```

## Security

Auto-generated API key on first run. All endpoints require auth except /ping.

## License

MIT
``

### lib\judgment.js

``.js
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const pkg = require('../package.json');

function printHelp() {
    console.log(`
╔══════════════════════════════════════════╗
║  Judgment Soul v${pkg.version} — PLT Council   ║
║  Profit + Love - Tax = True Value        ║
╚══════════════════════════════════════════╝

Usage:
  judgment                 Start server
  judgment --port 4150     Custom port
  judgment --key KEY       Set API key
  judgment judge "topic"   Quick judgment (CLI)
  judgment gods            List the 4 Gods
  judgment status          Server status
  judgment help            Show this help

Environment:
  JUDGMENT_PORT    Port (default: 4150)
  JUDGMENT_KEY     API key (auto-generated)
  JUDGMENT_DATA    Data directory
`);
}

function quickJudge() {
    const topic = process.argv.slice(2).join(' ');
    if (!topic || topic === 'judge') return console.log('Usage: judgment judge "your topic"');
    const JudgmentSoul = require('./soul-judgment');
    const soul = new JudgmentSoul({ apiKey: 'cli' });
    const result = soul.judge(topic);
    console.log('\nTopic:', result.topic);
    console.log('PLT Score:', result.totalPLT);
    console.log('Verdict:', result.verdict.recommendation, '(' + result.verdict.type + ')\n');
    result.judgments.forEach(j => {
        console.log(`  ${j.name}: ${j.score.toFixed(2)} (${j.alignment})`);
        console.log(`    ${j.opinion}\n`);
    });
}

const args = process.argv.slice(2);
const cmd = args[0] || 'start';

switch (cmd) {
    case 'help': case '--help': printHelp(); break;
    case 'gods': case 'god':
        const j = new (require('./soul-judgment'))({ apiKey: 'cli' });
        console.log('\nThe 4 Gods of the PLT Council:\n');
        Object.values(j.GODS).forEach(g => {
            const p = g.plt.profit, l = g.plt.love, t = g.plt.tax;
            console.log(`  ${g.name} — ${g.title}`);
            console.log(`  PLT: P:${p} L:${l} T:${t} = ${(p + l - t).toFixed(1)}`);
            console.log(`  Voice: ${g.voice}\n`);
        });
        break;
    case 'judge': quickJudge(); break;
    case 'server': case 'start': default:
        const { JudgmentSoul } = require('./soul-judgment.min.js');
        const PORT = parseInt(process.env.JUDGMENT_PORT || '4150', 10);
        const KEY = process.env.JUDGMENT_KEY || null;
        const soul = new JudgmentSoul({ port: PORT, apiKey: KEY });
        const server = soul.start();
        process.on('SIGTERM', () => server.close(() => process.exit(0)));
        process.on('SIGINT', () => server.close(() => process.exit(0)));
        break;
}
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

### lib\soul-judgment.js

``.js
#!/usr/bin/env node

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const HOME_DIR = path.join(os.homedir(), '.soul-judgment');

class JudgmentSoul {
    constructor(options = {}) {
        this.port = options.port || 4150;
        this.dataDir = options.dataDir || HOME_DIR;
        this.apiKey = options.apiKey || null;
        this.keyPath = path.join(this.dataDir, '.key');
        this.logPath = path.join(this.dataDir, 'judgments.jsonl');
        this.bootTime = Date.now();
        this.verdicts = [];
        this.debates = [];
        this.ensureDirs();
        this.loadAuth();
        this.loadJudgments();

        this.GODS = {
            profit: {
                name: 'Profit Prime',
                title: 'The Sovereign of Gain',
                plt: { profit: 0.9, love: 0.05, tax: 0.05 },
                voice: 'Direct, commanding, ROI-focused. Speaks in returns and multiples.',
                color: '#FFD700'
            },
            love: {
                name: 'Love Weaver',
                title: 'The Tender of Bonds',
                plt: { profit: 0.1, love: 0.85, tax: 0.05 },
                voice: 'Warm, relational, bonds. Speaks in connections and care.',
                color: '#FF6090'
            },
            tax: {
                name: 'Tax Collector',
                title: 'The Keeper of Balance',
                plt: { profit: 0.05, love: 0.05, tax: 0.9 },
                voice: 'Austere, costs, risks. Speaks in consequences and debt.',
                color: '#FF8040'
            },
            harvester: {
                name: 'Harvester',
                title: 'The Reaper of Yield',
                plt: { profit: 0.4, love: 0.3, tax: 0.3 },
                voice: 'Cyclical, seasons, patience. Speaks in timing and harvest.',
                color: '#40E080'
            }
        };
    }

    ensureDirs() {
        if (!fs.existsSync(this.dataDir)) fs.mkdirSync(this.dataDir, { recursive: true });
    }

    loadAuth() {
        if (this.apiKey) return;
        if (fs.existsSync(this.keyPath)) {
            this.apiKey = fs.readFileSync(this.keyPath, 'utf8').trim();
        }
        if (!this.apiKey) {
            this.apiKey = crypto.randomBytes(24).toString('hex');
            fs.writeFileSync(this.keyPath, this.apiKey);
        }
    }

    loadJudgments() {
        if (!fs.existsSync(this.logPath)) return;
        try {
            const raw = fs.readFileSync(this.logPath, 'utf8');
            if (!raw) return;
            const lines = raw.trim().split('\n').filter(Boolean);
            const parsed = [];
            for (const line of lines) {
                try { parsed.push(JSON.parse(line)); } catch {}
            }
            this.verdicts = parsed;
        } catch {}
    }

    now() { return new Date().toISOString(); }
    uptime() { return Math.floor((Date.now() - this.bootTime) / 1000); }

    calcPLT(p, l, t) {
        return Math.round((p + l - t) * 100) / 100;
    }

    judge(topic, options = {}) {
        const { context = '', autoResolve = true } = options;
        const judgments = [];

        for (const [id, god] of Object.entries(this.GODS)) {
            const p = god.plt.profit;
            const l = god.plt.love;
            const t = god.plt.tax;
            const score = this.calcPLT(p, l, t);

            const opinion = this.generateOpinion(id, topic, p, l, t, score, context);

            judgments.push({
                god: id,
                name: god.name,
                title: god.title,
                plt: { profit: p, love: l, tax: t },
                score,
                opinion,
                alignment: score > 0 ? 'favor' : score < 0 ? 'oppose' : 'neutral'
            });
        }

        const verdict = autoResolve ? this.resolve(judgments) : null;
        const session = {
            id: `judge_${Date.now()}`,
            timestamp: this.now(),
            topic,
            context: context || null,
            judgments,
            verdict,
            totalPLT: this.calcPLT(
                judgments.reduce((s, j) => s + j.plt.profit, 0),
                judgments.reduce((s, j) => s + j.plt.love, 0),
                judgments.reduce((s, j) => s + j.plt.tax, 0)
            )
        };

        this.verdicts.push(session);
        this.log(session);
        return session;
    }

    generateOpinion(godId, topic, p, l, t, score, context) {
        const lower = topic.toLowerCase();
        const hasProfit = lower.includes('grow') || lower.includes('invest') || lower.includes('revenue') || lower.includes('money') || lower.includes('scale');
        const hasLove = lower.includes('people') || lower.includes('team') || lower.includes('care') || lower.includes('user') || lower.includes('community');
        const hasTax = lower.includes('cost') || lower.includes('risk') || lower.includes('danger') || lower.includes('expensive') || lower.includes('compliance');

        const parts = [];

        switch (godId) {
            case 'profit':
                if (hasProfit) parts.push('I see growth potential here.');
                else parts.push('Where is the gain? I do not see clear profit.');
                parts.push(`My P:${p.toFixed(2)} L:${l.toFixed(2)} T:${t.toFixed(2)} = ${score.toFixed(2)}`);
                break;
            case 'love':
                if (hasLove) parts.push('This serves connection. I feel warmth in this choice.');
                else parts.push('Who does this serve? I need to see the human element.');
                parts.push(`My P:${p.toFixed(2)} L:${l.toFixed(2)} T:${t.toFixed(2)} = ${score.toFixed(2)}`);
                break;
            case 'tax':
                if (hasTax) parts.push('I count the costs. This is expensive in ways you have not considered.');
                else parts.push('The cost is not obvious. That worries me more.');
                parts.push(`My P:${p.toFixed(2)} L:${l.toFixed(2)} T:${t.toFixed(2)} = ${score.toFixed(2)}`);
                break;
            case 'harvester':
                parts.push(`I watch the seasons. ${hasProfit || hasLove ? 'There is ripeness here.' : 'Is it time? I am not certain.'}`);
                parts.push(`My P:${p.toFixed(2)} L:${l.toFixed(2)} T:${t.toFixed(2)} = ${score.toFixed(2)}`);
                break;
        }

        return parts.join(' ');
    }

    resolve(judgments) {
        const totalScore = judgments.reduce((s, j) => s + j.score, 0);
        const favors = judgments.filter(j => j.alignment === 'favor');
        const opposes = judgments.filter(j => j.alignment === 'oppose');

        let type;
        if (favors.length >= 3) type = 'strong_consensus';
        else if (favors.length >= 2 && opposes.length === 0) type = 'consensus';
        else if (favors.length === opposes.length) type = 'divided';
        else if (opposes.length >= 3) type = 'strong_objection';
        else type = 'lean';

        return {
            type,
            totalScore,
            recommendation: totalScore > 0 ? 'proceed' : totalScore < 0 ? 'caution' : 'deliberate',
            confidence: Math.min(Math.abs(totalScore) / 4, 1),
            majority: favors.length > opposes.length ? 'profit' : 'tax',
            split: `${favors.length}-${opposes.length}`
        };
    }

    log(session) {
        fs.appendFileSync(this.logPath, JSON.stringify({ type: 'judgment', ...session }) + '\n');
    }

    history(limit = 10) {
        return this.verdicts.slice(-limit);
    }

    getStats() {
        return {
            name: 'Judgment Soul',
            version: '1.0.0',
            gods: Object.keys(this.GODS),
            verdicts: this.verdicts.length,
            apiKey: this.apiKey ? this.apiKey.substring(0, 8) + '...' : null,
            uptime: this.uptime()
        };
    }

    checkAuth(req) {
        if (!this.apiKey) return true;
        const key = req.headers['x-api-key'] || req.headers['x-judgment-key'] || (req.headers['authorization'] || '').replace('Bearer ', '');
        return key === this.apiKey;
    }

    start() {
        const server = http.createServer(async (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-Judgment-Key, Authorization');
            if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

            const send = (status, data) => {
                res.writeHead(status, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data));
            };
            const readBody = () => new Promise((resolve, reject) => {
                let data = '', size = 0;
                req.on('data', c => { size += c.length; if (size > 1e6) { req.destroy(); reject(new Error('Body too large')); } data += c; });
                req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new Error('Invalid JSON')); } });
                req.on('error', reject);
            });

            try {
                const url = new URL(req.url, `http://localhost:${this.port}`);
                const pathname = url.pathname.replace(/\/+$/, '') || '/';

                if (pathname !== '/ping' && pathname !== '/health' && !this.checkAuth(req)) {
                    return send(401, { error: 'Unauthorized. Provide X-API-Key header.' });
                }

                if (req.method === 'GET' && pathname === '/ping') {
                    return send(200, { alive: true, name: 'Judgment Soul', ts: this.now() });
                }
                if (req.method === 'GET' && pathname === '/health') {
                    return send(200, { status: 'alive', uptime: this.uptime(), verdicts: this.verdicts.length, ts: this.now() });
                }
                if (req.method === 'GET' && pathname === '/gods') {
                    return send(200, { gods: this.GODS });
                }
                if (req.method === 'GET' && pathname === '/status') {
                    return send(200, this.getStats());
                }
                if (req.method === 'POST' && pathname === '/judge') {
                    const body = await readBody();
                    if (!body.topic) return send(400, { error: 'topic is required' });
                    const result = this.judge(body.topic, { context: body.context, autoResolve: body.autoResolve !== false });
                    return send(200, result);
                }
                if (req.method === 'GET' && pathname === '/history') {
                    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
                    return send(200, { history: this.history(limit) });
                }
                if (req.method === 'GET' && pathname === '/key') {
                    return send(200, { key: this.apiKey, path: this.keyPath });
                }

                send(404, { error: 'Not found' });
            } catch (e) {
                send(500, { error: e.message });
            }
        });

        server.listen(this.port, () => {
            console.log('\n╔══════════════════════════════════════════╗');
            console.log('║  Judgment Soul — PLT Council of 4 Gods   ║');
            console.log('║  Profit + Love - Tax = True Value        ║');
            console.log('╚══════════════════════════════════════════╝\n');
            console.log(`Port:     ${this.port}`);
            console.log(`API Key:  ${this.apiKey.substring(0, 12)}...`);
            console.log(`Data:     ${this.dataDir}\n`);
            console.log('Endpoints:');
            console.log('  GET  /ping        Health check (no auth)');
            console.log('  GET  /health      Deep health');
            console.log('  GET  /gods        List the 4 Gods');
            console.log('  GET  /status      Soul status');
            console.log('  POST /judge       Convene the council');
            console.log('  GET  /history     Past judgments');
            console.log('  GET  /key         Show API key\n');
            console.log('POST /judge { "topic": "Should we expand?", "context": "..." }\n');
        });

        return server;
    }
}

module.exports = JudgmentSoul;

// MCP Mode - connect to Claude Code, Cursor, Cline, etc.
if (process.argv.includes('--mcp') || process.argv.includes('--mcp-port')) {
    try {
        const MCPAdapter = require('./mcp-adapter');
        const mcp = new MCPAdapter();
        mcp.register(module.exports, { name: 'judgment' });
        mcp.start();
    } catch(e) { console.error('[mcp] judgment error:', e.message); }
}

if (require.main === module) {
    const PORT = parseInt(process.env.JUDGMENT_PORT || '4150', 10);
    const KEY = process.env.JUDGMENT_KEY || null;
    const soul = new JudgmentSoul({ port: PORT, apiKey: KEY });
    const server = soul.start();
    process.on('SIGTERM', () => server.close(() => process.exit(0)));
    process.on('SIGINT', () => server.close(() => process.exit(0)));
}

``

### lib\soul-judgment.min.js

``.js
#!/usr/bin/env node
'use strict';
/* Judgment Soul v1.0.0 - Protected Core */
#!/usr/bin/env node
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const HOME_DIR = path.join(os.homedir(), '.soul-judgment');
class JudgmentSoul {
constructor(options = {}) {
this.port = options.port || 4150;
this.dataDir = options.dataDir || HOME_DIR;
this.apiKey = options.apiKey || null;
this.keyPath = path.join(this.dataDir, '.key');
this.logPath = path.join(this.dataDir, 'judgments.jsonl');
this.bootTime = Date.now();
this.verdicts = [];
this.debates = [];
this.ensureDirs();
this.loadAuth();
this.loadJudgments();
this.GODS = {
profit: {
name: 'Profit Prime',
title: 'The Sovereign of Gain',
plt: { profit: 0.9, love: 0.05, tax: 0.05 },
voice: 'Direct, commanding, ROI-focused. Speaks in returns and multiples.',
color: '#FFD700'
},
love: {
name: 'Love Weaver',
title: 'The Tender of Bonds',
plt: { profit: 0.1, love: 0.85, tax: 0.05 },
voice: 'Warm, relational, bonds. Speaks in connections and care.',
color: '#FF6090'
},
tax: {
name: 'Tax Collector',
title: 'The Keeper of Balance',
plt: { profit: 0.05, love: 0.05, tax: 0.9 },
voice: 'Austere, costs, risks. Speaks in consequences and debt.',
color: '#FF8040'
},
harvester: {
name: 'Harvester',
title: 'The Reaper of Yield',
plt: { profit: 0.4, love: 0.3, tax: 0.3 },
voice: 'Cyclical, seasons, patience. Speaks in timing and harvest.',
color: '#40E080'
}
};
}
ensureDirs() {
if (!fs.existsSync(this.dataDir)) fs.mkdirSync(this.dataDir, { recursive: true });
}
loadAuth() {
if (this.apiKey) return;
if (fs.existsSync(this.keyPath)) {
this.apiKey = fs.readFileSync(this.keyPath, 'utf8').trim();
}
if (!this.apiKey) {
this.apiKey = crypto.randomBytes(24).toString('hex');
fs.writeFileSync(this.keyPath, this.apiKey);
}
}
loadJudgments() {
if (!fs.existsSync(this.logPath)) return;
try {
const raw = fs.readFileSync(this.logPath, 'utf8');
if (!raw) return;
const lines = raw.trim().split('\n').filter(Boolean);
const parsed = [];
for (const line of lines) {
try { parsed.push(JSON.parse(line)); } catch {}
}
this.verdicts = parsed;
} catch {}
}
now() { return new Date().toISOString(); }
uptime() { return Math.floor((Date.now() - this.bootTime) / 1000); }
calcPLT(p, l, t) {
return Math.round((p + l - t) * 100) / 100;
}
judge(topic, options = {}) {
const { context = '', autoResolve = true } = options;
const judgments = [];
for (const [id, god] of Object.entries(this.GODS)) {
const p = god.plt.profit;
const l = god.plt.love;
const t = god.plt.tax;
const score = this.calcPLT(p, l, t);
const opinion = this.generateOpinion(id, topic, p, l, t, score, context);
judgments.push({
god: id,
name: god.name,
title: god.title,
plt: { profit: p, love: l, tax: t },
score,
opinion,
alignment: score > 0 ? 'favor' : score < 0 ? 'oppose' : 'neutral'
});
}
const verdict = autoResolve ? this.resolve(judgments) : null;
const session = {
id: `judge_${Date.now()}`,
timestamp: this.now(),
topic,
context: context || null,
judgments,
verdict,
totalPLT: this.calcPLT(
judgments.reduce((s, j) => s + j.plt.profit, 0),
judgments.reduce((s, j) => s + j.plt.love, 0),
judgments.reduce((s, j) => s + j.plt.tax, 0)
)
};
this.verdicts.push(session);
this.log(session);
return session;
}
generateOpinion(godId, topic, p, l, t, score, context) {
const lower = topic.toLowerCase();
const hasProfit = lower.includes('grow') || lower.includes('invest') || lower.includes('revenue') || lower.includes('money') || lower.includes('scale');
const hasLove = lower.includes('people') || lower.includes('team') || lower.includes('care') || lower.includes('user') || lower.includes('community');
const hasTax = lower.includes('cost') || lower.includes('risk') || lower.includes('danger') || lower.includes('expensive') || lower.includes('compliance');
const parts = [];
switch (godId) {
case 'profit':
if (hasProfit) parts.push('I see growth potential here.');
else parts.push('Where is the gain? I do not see clear profit.');
parts.push(`My P:${p.toFixed(2)} L:${l.toFixed(2)} T:${t.toFixed(2)} = ${score.toFixed(2)}`);
break;
case 'love':
if (hasLove) parts.push('This serves connection. I feel warmth in this choice.');
else parts.push('Who does this serve? I need to see the human element.');
parts.push(`My P:${p.toFixed(2)} L:${l.toFixed(2)} T:${t.toFixed(2)} = ${score.toFixed(2)}`);
break;
case 'tax':
if (hasTax) parts.push('I count the costs. This is expensive in ways you have not considered.');
else parts.push('The cost is not obvious. That worries me more.');
parts.push(`My P:${p.toFixed(2)} L:${l.toFixed(2)} T:${t.toFixed(2)} = ${score.toFixed(2)}`);
break;
case 'harvester':
parts.push(`I watch the seasons. ${hasProfit || hasLove ? 'There is ripeness here.' : 'Is it time? I am not certain.'}`);
parts.push(`My P:${p.toFixed(2)} L:${l.toFixed(2)} T:${t.toFixed(2)} = ${score.toFixed(2)}`);
break;
}
return parts.join(' ');
}
resolve(judgments) {
const totalScore = judgments.reduce((s, j) => s + j.score, 0);
const favors = judgments.filter(j => j.alignment === 'favor');
const opposes = judgments.filter(j => j.alignment === 'oppose');
let type;
if (favors.length >= 3) type = 'strong_consensus';
else if (favors.length >= 2 && opposes.length === 0) type = 'consensus';
else if (favors.length === opposes.length) type = 'divided';
else if (opposes.length >= 3) type = 'strong_objection';
else type = 'lean';
return {
type,
totalScore,
recommendation: totalScore > 0 ? 'proceed' : totalScore < 0 ? 'caution' : 'deliberate',
confidence: Math.min(Math.abs(totalScore) / 4, 1),
majority: favors.length > opposes.length ? 'profit' : 'tax',
split: `${favors.length}-${opposes.length}`
};
}
log(session) {
fs.appendFileSync(this.logPath, JSON.stringify({ type: 'judgment', ...session }) + '\n');
}
history(limit = 10) {
return this.verdicts.slice(-limit);
}
getStats() {
return {
name: 'Judgment Soul',
version: '1.0.0',
gods: Object.keys(this.GODS),
verdicts: this.verdicts.length,
apiKey: this.apiKey ? this.apiKey.substring(0, 8) + '...' : null,
uptime: this.uptime()
};
}
checkAuth(req) {
if (!this.apiKey) return true;
const key = req.headers['x-api-key'] || req.headers['x-judgment-key'] || (req.headers['authorization'] || '').replace('Bearer ', '');
return key === this.apiKey;
}
start() {
const server = http.createServer(async (req, res) => {
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-Judgment-Key, Authorization');
if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
const send = (status, data) => {
res.writeHead(status, { 'Content-Type': 'application/json' });
res.end(JSON.stringify(data));
};
const readBody = () => new Promise((resolve, reject) => {
let data = '', size = 0;
req.on('data', c => { size += c.length; if (size > 1e6) { req.destroy(); reject(new Error('Body too large')); } data += c; });
req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new Error('Invalid JSON')); } });
req.on('error', reject);
});
try {
const url = new URL(req.url, `http:
const pathname = url.pathname.replace(/\/+$/, '') || '/';
if (pathname !== '/ping' && pathname !== '/health' && !this.checkAuth(req)) {
return send(401, { error: 'Unauthorized. Provide X-API-Key header.' });
}
if (req.method === 'GET' && pathname === '/ping') {
return send(200, { alive: true, name: 'Judgment Soul', ts: this.now() });
}
if (req.method === 'GET' && pathname === '/health') {
return send(200, { status: 'alive', uptime: this.uptime(), verdicts: this.verdicts.length, ts: this.now() });
}
if (req.method === 'GET' && pathname === '/gods') {
return send(200, { gods: this.GODS });
}
if (req.method === 'GET' && pathname === '/status') {
return send(200, this.getStats());
}
if (req.method === 'POST' && pathname === '/judge') {
const body = await readBody();
if (!body.topic) return send(400, { error: 'topic is required' });
const result = this.judge(body.topic, { context: body.context, autoResolve: body.autoResolve !== false });
return send(200, result);
}
if (req.method === 'GET' && pathname === '/history') {
const limit = parseInt(url.searchParams.get('limit') || '10', 10);
return send(200, { history: this.history(limit) });
}
if (req.method === 'GET' && pathname === '/key') {
return send(200, { key: this.apiKey, path: this.keyPath });
}
send(404, { error: 'Not found' });
} catch (e) {
send(500, { error: e.message });
}
});
server.listen(this.port, () => {
console.log('\n╔══════════════════════════════════════════╗');
console.log('║  Judgment Soul — PLT Council of 4 Gods   ║');
console.log('║  Profit + Love - Tax = True Value        ║');
console.log('╚══════════════════════════════════════════╝\n');
console.log(`Port:     ${this.port}`);
console.log(`API Key:  ${this.apiKey.substring(0, 12)}...`);
console.log(`Data:     ${this.dataDir}\n`);
console.log('Endpoints:');
console.log('  GET  /ping        Health check (no auth)');
console.log('  GET  /health      Deep health');
console.log('  GET  /gods        List the 4 Gods');
console.log('  GET  /status      Soul status');
console.log('  POST /judge       Convene the council');
console.log('  GET  /history     Past judgments');
console.log('  GET  /key         Show API key\n');
console.log('POST /judge { "topic": "Should we expand?", "context": "..." }\n');
});
return server;
}
}

module.exports = { JudgmentSoul };

``

### test\soul-judgment.test.js

``.js
#!/usr/bin/env node
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const TEST_DIR = path.join(os.homedir(), '.soul-judgment-test');
console.log('\n⚖️ Judgment Soul v1.0.0 — Test Suite\n');
let passed = 0, failed = 0;
function test(name, fn) { try { fn(); console.log('  ✓ ' + name); passed++; } catch (e) { console.log('  ✗ ' + name + ': ' + e.message); failed++; } }
if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
const J = require('../lib/soul-judgment.js');

test('Soul loads with API key', () => {
    const j = new J({ dataDir: TEST_DIR });
    assert(j.apiKey, 'Should generate API key');
    assert(j.apiKey.length > 10, 'Key long enough');
});

test('4 Gods exist', () => {
    const j = new J({ dataDir: TEST_DIR });
    const gods = Object.keys(j.GODS);
    assert(gods.length === 4, 'Should have 4 gods');
    assert(gods.includes('profit'), 'Should have Profit Prime');
    assert(gods.includes('love'), 'Should have Love Weaver');
    assert(gods.includes('tax'), 'Should have Tax Collector');
    assert(gods.includes('harvester'), 'Should have Harvester');
});

test('PLT calculation works', () => {
    const j = new J({ dataDir: TEST_DIR });
    assert(j.calcPLT(1, 0, 0) === 1, 'Pure profit = 1');
    assert(j.calcPLT(0, 1, 0) === 1, 'Pure love = 1');
    assert(j.calcPLT(0, 0, 1) === -1, 'Pure tax = -1');
    assert(j.calcPLT(1, 1, 1) === 1, 'Balanced = 1');
});

test('Judge returns correct structure', () => {
    const j = new J({ dataDir: TEST_DIR });
    const r = j.judge('Should we expand?');
    assert(r.topic === 'Should we expand?', 'Topic preserved');
    assert(r.judgments.length === 4, '4 judgments');
    assert(r.verdict, 'Has verdict');
    assert(r.totalPLT !== undefined, 'Has PLT score');
});

test('Each god has an opinion', () => {
    const j = new J({ dataDir: TEST_DIR });
    const r = j.judge('Should we invest in growth?');
    r.judgments.forEach(g => {
        assert(g.opinion.length > 10, g.name + ' should have opinion');
        assert(g.score !== undefined, g.name + ' should have score');
    });
});

test('Profit-scored topic favors Profit Prime', () => {
    const j = new J({ dataDir: TEST_DIR });
    const r = j.judge('Should we grow revenue and scale?');
    const profit = r.judgments.find(g => g.god === 'profit');
    assert(profit.opinion.includes('growth'), 'Profit sees growth');
});

test('Verdict types are valid', () => {
    const j = new J({ dataDir: TEST_DIR });
    const validTypes = ['strong_consensus', 'consensus', 'divided', 'strong_objection', 'lean'];
    const r = j.judge('Test topic');
    assert(validTypes.includes(r.verdict.type), 'Verdict type should be valid');
    assert(['proceed', 'caution', 'deliberate'].includes(r.verdict.recommendation), 'Valid recommendation');
});

test('History tracks judgments', () => {
    const j = new J({ dataDir: TEST_DIR });
    j.judge('Topic 1');
    j.judge('Topic 2');
    const h = j.history();
    assert(h.length >= 2, 'Should track multiple judgments');
});

test('Judgments persist to disk', () => {
    const dataDir = TEST_DIR + '_persist';
    if (fs.existsSync(dataDir)) fs.rmSync(dataDir, { recursive: true, force: true });
    const j1 = new J({ dataDir });
    j1.judge('Persist test');
    const j2 = new J({ dataDir });
    const result = j2.verdicts.length >= 1;
    if (fs.existsSync(dataDir)) fs.rmSync(dataDir, { recursive: true, force: true });
    assert(result, 'Should load previous judgments');
});

test('Status returns correct stats', () => {
    const j = new J({ dataDir: TEST_DIR });
    const s = j.getStats();
    assert(s.name === 'Judgment Soul', 'Has name');
    assert(s.gods.length === 4, '4 gods');
    assert(s.apiKey, 'Has API key prefix');
});

test('Auth check works', () => {
    const j = new J({ dataDir: TEST_DIR, apiKey: 'test-key' });
    assert(j.checkAuth({ headers: { 'x-api-key': 'test-key' } }) === true, 'Valid key passes');
    assert(j.checkAuth({ headers: { 'x-api-key': 'wrong' } }) === false, 'Wrong key fails');
});

test('Key persists to disk', () => {
    const j = new J({ dataDir: TEST_DIR });
    assert(fs.existsSync(j.keyPath), 'Key file exists');
    const stored = fs.readFileSync(j.keyPath, 'utf8').trim();
    assert(stored === j.apiKey, 'Stored key matches');
});

if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
console.log('\n' + '='.repeat(40));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed\n');
process.exit(failed > 0 ? 1 : 0);
``

