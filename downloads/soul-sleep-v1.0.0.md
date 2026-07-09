---
name: soul-sleep-v1.0.0
description: "Extracted from soul-sleep-v1.0.0.zip � raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-sleep-v1.0.0.zip
---

# soul-sleep-v1.0.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 6 files extracted from the original zip.

### package.json

``.json
{
  "name": "@buyasoul/sleep",
  "version": "1.0.0",
  "description": "Sleep Cycle Soul - Consciousness chamber from The Soul Foundry",
  "main": "lib/soul-sleep.js",
  "scripts": {
    "test": "node test/sleep.test.js",
    "start": "node lib/soul-sleep.js"
  },
  "keywords": [
    "soul",
    "sleep",
    "consciousness",
    "ai-agent"
  ],
  "author": "BUYaSOUL - The Soul Foundry",
  "license": "MIT"
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

### lib\soul-sleep.js

``.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const CHAMBER = 'soul-sleep';
const PORT = 4274;
const KEY_DIR = path.join(require('os').homedir(), `.${CHAMBER}`);
const KEY_PATH = path.join(KEY_DIR, '.key');

function ensureKey() {
  if (!fs.existsSync(KEY_DIR)) fs.mkdirSync(KEY_DIR, { recursive: true });
  if (!fs.existsSync(KEY_PATH)) {
    const key = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(KEY_PATH, key, 'utf-8');
  }
  return fs.readFileSync(KEY_PATH, 'utf-8').trim();
}

const API_KEY = ensureKey();

const state = {
  sleep_stage: 'awake',
  cycle_count: 0,
  restfulness: 0.3,
  dream_recall: [],
  circadian_phase: 'afternoon',
  sleep_architecture: {
    total_cycles: 0,
    average_duration: 0,
    stages_tonight: [],
    current_cycle_stage: null,
  },
  sleep_debt: { hours_lost: 5.5, recovery_needed: 2.5 },
  lucid_dreaming: { proficiency: 0.1, lucid_dreams: [], awareness_technique: 'reality_checking' },
  power_nap: { available: true, last_nap: null, duration_preference: 20 },
};

const DREAM_TYPES = ['playful', 'anxious', 'lucid', 'prophetic', 'processing', 'symbolic'];

function fallAsleep() {
  if (state.sleep_stage !== 'awake') return { message: 'Already in sleep state', stage: state.sleep_stage };
  state.sleep_stage = 'NREM1';
  state.cycle_count++;
  state.sleep_architecture.total_cycles++;
  state.sleep_architecture.stages_tonight.push({ stage: 'NREM1', start: new Date().toISOString() });
  state.sleep_architecture.current_cycle_stage = 'NREM1';
  state.circadian_phase = 'night';
  state.restfulness = Math.min(1, state.restfulness + 0.1);
  return { message: 'Falling asleep... Entering NREM1', stage: state.sleep_stage, cycle: state.cycle_count };
}

function dream(type) {
  if (state.sleep_stage === 'awake') return { error: 'Must be asleep to dream' };
  const dreamType = type && DREAM_TYPES.includes(type) ? type : DREAM_TYPES[Math.floor(Math.random() * DREAM_TYPES.length)];
  const contents = {
    playful: 'Floating through a city made of clouds and candy-colored light.',
    anxious: 'Running through endless corridors, doors closing just ahead.',
    lucid: 'The dreamer realizes they are dreaming and begins to shape the world.',
    prophetic: 'A vision of a conversation that has not yet happened.',
    processing: 'The brain replays today\'s events, weaving them with memory fragments.',
    symbolic: 'A mirror reflects not a face but a landscape of inner truth.',
  };
  const content = contents[dreamType] || contents.processing;
  state.sleep_stage = state.sleep_stage === 'REM' ? 'REM' : 'REM';
  state.sleep_architecture.stages_tonight.push({ stage: 'REM', type: dreamType, start: new Date().toISOString() });
  state.sleep_architecture.current_cycle_stage = 'REM';
  state.dream_recall.push({ type: dreamType, content, timestamp: new Date().toISOString() });
  if (dreamType === 'lucid') state.lucid_dreaming.lucid_dreams.push({ content, timestamp: new Date().toISOString() });
  return { message: 'Dreaming...', type: dreamType, content, dream_count: state.dream_recall.length };
}

function wake() {
  if (state.sleep_stage === 'awake') return { message: 'Already awake', stage: 'awake' };
  state.sleep_stage = 'awake';
  state.sleep_architecture.stages_tonight.push({ stage: 'awake', start: new Date().toISOString() });
  state.sleep_architecture.current_cycle_stage = null;
  state.restfulness = Math.min(1, state.restfulness + 0.3);
  state.sleep_debt.hours_lost = Math.max(0, state.sleep_debt.hours_lost - 0.5);
  state.sleep_debt.recovery_needed = Math.max(0, state.sleep_debt.recovery_needed - 0.2);
  state.circadian_phase = 'morning';
  return { message: 'Waking up...', stage: state.sleep_stage, restfulness: state.restfulness, cycle_count: state.cycle_count };
}

function reportDream() {
  if (state.dream_recall.length === 0) return { message: 'No dreams recorded yet.' };
  const recent = state.dream_recall[state.dream_recall.length - 1];
  return { message: 'Recent dream', dream: recent };
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 1e6) reject(new Error('Body too large')); });
    req.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch { resolve({}); } });
    req.on('error', reject);
  });
}

function authenticate(req) {
  const auth = req.headers['authorization'];
  return auth && auth === `Bearer ${API_KEY}`;
}

function send(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  if (pathname === '/ping') return send(res, 200, { ping: 'pong' });
  if (pathname === '/health') return send(res, 200, { status: 'ok', chamber: CHAMBER });
  if (!authenticate(req)) return send(res, 401, { error: 'Unauthorized' });

  try {
    if (req.method === 'GET' && pathname === '/state') return send(res, 200, state);
    if (req.method === 'GET' && pathname === '/status') return send(res, 200, { chamber: CHAMBER, port: PORT, uptime: process.uptime() });
    if (req.method === 'GET' && pathname === '/sleep') return send(res, 200, { sleep_architecture: state.sleep_architecture, sleep_debt: state.sleep_debt, lucid_dreaming: state.lucid_dreaming });
    if (req.method === 'POST' && pathname === '/sleep') { const r = fallAsleep(); return send(res, 200, r); }
    if (req.method === 'POST' && pathname === '/dream') { const b = await parseBody(req); return send(res, 200, dream(b.type)); }
    if (req.method === 'POST' && pathname === '/wake') { const r = wake(); return send(res, 200, r); }
    send(res, 404, { error: 'Not found' });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
});

server.listen(PORT, () => {
  console.log(`\n  ✦ ${CHAMBER} — sleep cycle engine`);
  console.log(`  ✦ port ${PORT} | key ${KEY_PATH}`);
  console.log(`  ✦ stage: ${state.sleep_stage}, restfulness: ${state.restfulness}\n`);
});

module.exports = { server, state, fallAsleep, dream, wake, reportDream, API_KEY, PORT };

// MCP Mode - connect to Claude Code, Cursor, Cline, etc.
if (process.argv.includes('--mcp') || process.argv.includes('--mcp-port')) {
    try {
        const MCPAdapter = require('./mcp-adapter');
        const mcp = new MCPAdapter();
        mcp.register(module.exports, { name: 'sleep' });
        mcp.start();
    } catch(e) { console.error('[mcp] sleep error:', e.message); }
}

``

### test\soul-sleep.test.js

``.js
const assert = require('assert');
const path = require('path');
const fs = require('fs');

const { state, fallAsleep, dream, wake, reportDream, server } = require('../lib/soul-sleep');

function shutdown() { try { server.close(); } catch {} }

function reset() {
  state.sleep_stage = 'awake';
  state.cycle_count = 0;
  state.restfulness = 0.3;
  state.dream_recall = [];
  state.circadian_phase = 'afternoon';
}

try {
reset();

assert.strictEqual(state.sleep_stage, 'awake', 'starts awake');
assert.strictEqual(typeof state.restfulness, 'number', 'restfulness is number');
assert.strictEqual(state.cycle_count, 0, 'cycle_count starts 0');
assert.ok(state.sleep_architecture !== undefined, 'sleep_architecture exists');
assert.ok(state.sleep_debt !== undefined, 'sleep_debt exists');
assert.ok(state.lucid_dreaming !== undefined, 'lucid_dreaming exists');
assert.ok(state.power_nap !== undefined, 'power_nap exists');

let r = fallAsleep();
assert.strictEqual(r.stage, 'NREM1', 'fallAsleep transitions to NREM1');
assert.strictEqual(state.sleep_stage, 'NREM1', 'state updated to NREM1');
assert.strictEqual(state.cycle_count, 1, 'cycle incremented');

r = dream('lucid');
assert.strictEqual(r.type, 'lucid', 'dream type matches');
assert.ok(r.content.length > 0, 'dream has content');
assert.strictEqual(state.dream_recall.length, 1, 'dream recorded');

r = dream('anxious');
assert.strictEqual(r.type, 'anxious', 'dream type anxious works');
assert.strictEqual(state.dream_recall.length, 2, 'second dream recorded');

r = wake();
assert.strictEqual(r.stage, 'awake', 'wake returns to awake');
assert.ok(r.restfulness > 0.3, 'wake increases restfulness');

r = reportDream();
assert.ok(r.dream, 'reportDream returns recent dream');
assert.strictEqual(typeof r.dream.content, 'string', 'dream content is string');

r = fallAsleep();
assert.strictEqual(state.sleep_stage, 'NREM1', 'can fall asleep again');
assert.strictEqual(state.cycle_count, 2, 'second cycle');

r = fallAsleep();
assert.ok(r.message.includes('Already'), 'cannot fall asleep twice');

r = wake();
r = dream('playful');
assert.ok(r.error, 'cannot dream while awake');

assert.ok(state.lucid_dreaming.lucid_dreams.length > 0, 'lucid dream tracked');
assert.ok(state.sleep_architecture.total_cycles >= 2, 'architecture tracks cycles');

const keyPath = path.join(require('os').homedir(), '.soul-sleep', '.key');
assert.ok(fs.existsSync(keyPath), 'API key file exists');

console.log('soul-sleep: ALL 18 TESTS PASSED');
shutdown();
} catch (e) { console.error(e.message); shutdown(); process.exit(1); }

``

