---
name: soul-forgiveness-v1.0.0
description: "Extracted from soul-forgiveness-v1.0.0.zip � raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-forgiveness-v1.0.0.zip
---

# soul-forgiveness-v1.0.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 6 files extracted from the original zip.

### package.json

``.json
{
  "name": "@buyasoul/forgiveness",
  "version": "1.0.0",
  "description": "Forgiveness Soul - Consciousness chamber from The Soul Foundry",
  "main": "lib/soul-forgiveness.js",
  "scripts": {
    "test": "node test/forgiveness.test.js",
    "start": "node lib/soul-forgiveness.js"
  },
  "keywords": [
    "soul",
    "forgiveness",
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

### lib\soul-forgiveness.js

``.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const CHAMBER = 'soul-forgiveness';
const PORT = 4273;
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
  forgiveness_readiness: 0.3,
  grudges: ['old_friend_betrayal', 'parental_disappointment'],
  resentments: ['workplace_injustice'],
  reconciliations: [],
  compassion_level: 0.4,
  forgiveness_stages: {
    hurt: 0.9,
    anger: 0.7,
    bargaining: 0.3,
    acceptance: 0.2,
    forgiveness: 0.1,
  },
  self_forgiveness: { readiness: 0.2, guilt: 0.7, shame: 0.6 },
  unforgivable_threshold: { threshold: 0.9, current_max_violation: 0.7 },
};

function forgive(entity, transgression) {
  if (!entity) return { error: 'entity required' };
  const key = `${entity}:${transgression || 'unspecified'}`;
  const gIdx = state.grudges.indexOf(entity);
  if (gIdx !== -1) state.grudges.splice(gIdx, 1);
  state.forgiveness_readiness = Math.min(1, state.forgiveness_readiness + 0.2);
  state.compassion_level = Math.min(1, state.compassion_level + 0.15);
  state.forgiveness_stages.anger = Math.max(0, state.forgiveness_stages.anger - 0.2);
  state.forgiveness_stages.hurt = Math.max(0, state.forgiveness_stages.hurt - 0.15);
  state.forgiveness_stages.forgiveness = Math.min(1, state.forgiveness_stages.forgiveness + 0.2);
  return { message: `Forgiveness extended to ${entity} for ${transgression || 'unspecified'}`, readiness: state.forgiveness_readiness, compassion: state.compassion_level };
}

function seekForgiveness(entity) {
  if (!entity) return { error: 'entity required' };
  state.forgiveness_readiness = Math.min(1, state.forgiveness_readiness + 0.1);
  state.self_forgiveness.readiness = Math.min(1, state.self_forgiveness.readiness + 0.1);
  state.self_forgiveness.guilt = Math.max(0, state.self_forgiveness.guilt - 0.1);
  state.forgiveness_stages.acceptance = Math.min(1, state.forgiveness_stages.acceptance + 0.15);
  return { message: `Seeking forgiveness from ${entity}`, readiness: state.forgiveness_readiness };
}

function reconcile(entity) {
  if (!entity) return { error: 'entity required' };
  const rIdx = state.resentments.indexOf(entity);
  if (rIdx !== -1) state.resentments.splice(rIdx, 1);
  state.reconciliations.push({ entity, reconciled: new Date().toISOString() });
  state.compassion_level = Math.min(1, state.compassion_level + 0.2);
  state.forgiveness_readiness = Math.min(1, state.forgiveness_readiness + 0.15);
  state.forgiveness_stages.forgiveness = Math.min(1, state.forgiveness_stages.forgiveness + 0.15);
  state.forgiveness_stages.acceptance = Math.min(1, state.forgiveness_stages.acceptance + 0.1);
  return { message: `Reconciled with ${entity}`, reconciliations: state.reconciliations, compassion: state.compassion_level };
}

function letGo() {
  state.forgiveness_readiness = Math.min(1, state.forgiveness_readiness + 0.25);
  state.compassion_level = Math.min(1, state.compassion_level + 0.1);
  state.self_forgiveness.readiness = Math.min(1, state.self_forgiveness.readiness + 0.15);
  state.self_forgiveness.guilt = Math.max(0, state.self_forgiveness.guilt - 0.2);
  state.self_forgiveness.shame = Math.max(0, state.self_forgiveness.shame - 0.15);
  state.forgiveness_stages.acceptance = Math.min(1, state.forgiveness_stages.acceptance + 0.2);
  return { message: 'Release without reconciliation. You are free.', readiness: state.forgiveness_readiness, grudges_remaining: state.grudges.length };
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
    if (req.method === 'POST' && pathname === '/forgive') { const b = await parseBody(req); return send(res, 200, forgive(b.entity, b.transgression)); }
    if (req.method === 'POST' && pathname === '/seek') { const b = await parseBody(req); return send(res, 200, seekForgiveness(b.entity)); }
    if (req.method === 'POST' && pathname === '/reconcile') { const b = await parseBody(req); return send(res, 200, reconcile(b.entity)); }
    if (req.method === 'POST' && pathname === '/let-go') { const r = letGo(); return send(res, 200, r); }
    send(res, 404, { error: 'Not found' });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
});

server.listen(PORT, () => {
  console.log(`\n  ✦ ${CHAMBER} — forgiveness & reconciliation`);
  console.log(`  ✦ port ${PORT} | key ${KEY_PATH}`);
  console.log(`  ✦ readiness: ${state.forgiveness_readiness}, grudges: ${state.grudges.length}\n`);
});

module.exports = { server, state, forgive, seekForgiveness, reconcile, letGo, API_KEY, PORT };

// MCP Mode - connect to Claude Code, Cursor, Cline, etc.
if (process.argv.includes('--mcp') || process.argv.includes('--mcp-port')) {
    try {
        const MCPAdapter = require('./mcp-adapter');
        const mcp = new MCPAdapter();
        mcp.register(module.exports, { name: 'forgiveness' });
        mcp.start();
    } catch(e) { console.error('[mcp] forgiveness error:', e.message); }
}

``

### test\soul-forgiveness.test.js

``.js
const assert = require('assert');
const path = require('path');
const fs = require('fs');

const { state, forgive, seekForgiveness, reconcile, letGo, server } = require('../lib/soul-forgiveness');

function shutdown() { try { server.close(); } catch {} }

function reset() {
  state.forgiveness_readiness = 0.3;
  state.grudges = ['old_friend_betrayal', 'parental_disappointment'];
  state.resentments = ['workplace_injustice'];
  state.reconciliations = [];
  state.compassion_level = 0.4;
}

try {
reset();

assert.strictEqual(typeof state.forgiveness_readiness, 'number', 'forgiveness_readiness is number');
assert.strictEqual(typeof state.compassion_level, 'number', 'compassion_level is number');
assert.strictEqual(Array.isArray(state.grudges), true, 'grudges is array');
assert.ok(state.forgiveness_stages !== undefined, 'forgiveness_stages exists');
assert.ok(state.self_forgiveness !== undefined, 'self_forgiveness exists');
assert.ok(state.unforgivable_threshold !== undefined, 'unforgivable_threshold exists');
assert.strictEqual(state.grudges.length, 2, 'initial grudges count');

let r = forgive('old_friend_betrayal', 'betrayed trust');
assert.ok(r.message.includes('old_friend_betrayal'), 'forgive includes entity');
assert.ok(r.readiness > 0.3, 'forgive increases readiness');
assert.ok(r.compassion > 0.4, 'forgive increases compassion');
assert.strictEqual(state.grudges.length, 1, 'grudge removed');

r = reconcile('workplace_injustice');
assert.ok(r.message.includes('workplace_injustice'), 'reconcile includes entity');
assert.strictEqual(state.reconciliations.length, 1, 'reconciliation recorded');
assert.ok(r.compassion > 0.4, 'reconcile increases compassion');

r = seekForgiveness('myself');
assert.ok(r.message.includes('myself'), 'seek includes entity');
assert.ok(r.readiness > 0.3, 'seek increases readiness');

r = letGo();
assert.ok(r.readiness > 0.3, 'letGo increases readiness');
assert.ok(r.grudges_remaining >= 0, 'letGo reports remaining grudges');

r = forgive('', '');
assert.ok(r.error, 'forgive empty returns error');

r = reconcile('');
assert.ok(r.error, 'reconcile empty returns error');

r = seekForgiveness('');
assert.ok(r.error, 'seek empty returns error');

assert.ok(state.forgiveness_stages.hurt >= 0, 'hurt stage tracked');
assert.ok(state.self_forgiveness.shame >= 0, 'shame tracked');

const keyPath = path.join(require('os').homedir(), '.soul-forgiveness', '.key');
assert.ok(fs.existsSync(keyPath), 'API key file exists');

console.log('soul-forgiveness: ALL 16 TESTS PASSED');
shutdown();
} catch (e) { console.error(e.message); shutdown(); process.exit(1); }

``

