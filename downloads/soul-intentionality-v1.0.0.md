---
name: soul-intentionality-v1.0.0
description: "Extracted from soul-intentionality-v1.0.0.zip — raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-intentionality-v1.0.0.zip
---

# soul-intentionality-v1.0.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 6 files extracted from the original zip.

### package.json

``.json
{
  "name": "@buyasoul/intentionality",
  "version": "1.0.0",
  "description": "Intentionality Soul - Consciousness chamber from The Soul Foundry",
  "main": "lib/soul-INTENTIONALITY.js",
  "scripts": {
    "test": "node test/intentionality.test.js",
    "start": "node lib/soul-INTENTIONALITY.js"
  },
  "keywords": [
    "soul",
    "intentionality",
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

        // Auto-route: soulName_method â†’ soul.method(args)
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

### lib\soul-INTENTIONALITY.js

``.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const CHAMBER = 'INTENTIONALITY';
const PORT = 4262;
const DATA_DIR = path.join(os.homedir(), '.soul-INTENTIONALITY');
const KEY_FILE = path.join(DATA_DIR, '.key');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
let API_KEY;
try { API_KEY = fs.readFileSync(KEY_FILE, 'utf8').trim(); } catch { API_KEY = crypto.randomBytes(32).toString('hex'); fs.writeFileSync(KEY_FILE, API_KEY); }

const state = {
  intentional_state: 'dormant',
  directedness: 0,
  aboutness: null,
  current_intention: null,
  intention_history: [],
  intention_potency: 0.5,
  divided_intention: 0,
  intentional_arc: [],
  potency_decay_rate: 0.01,
  created: new Date().toISOString()
};

function direct(toward) {
  state.intentional_state = 'directed';
  state.directedness = Math.min(1, state.directedness + 0.2);
  state.aboutness = toward;
  state.current_intention = toward;
  state.intention_potency = Math.min(1, state.intention_potency + 0.15);
  state.intention_history.push({ action: 'direct', target: toward, timestamp: new Date().toISOString() });
  state.intentional_arc.push({ phase: 'direction', target: toward, potency: state.intention_potency, timestamp: new Date().toISOString() });
  return { intentional_state: state.intentional_state, directedness: state.directedness, aboutness: state.aboutness, intention_potency: state.intention_potency };
}

function hold() {
  if (!state.current_intention) return { error: 'No intention to hold. Direct first.' };
  state.intentional_state = 'holding';
  state.intention_potency = Math.max(0.3, state.intention_potency - state.potency_decay_rate);
  state.divided_intention = Math.min(1, state.divided_intention + 0.02);
  state.intention_history.push({ action: 'hold', target: state.current_intention, timestamp: new Date().toISOString() });
  return { intentional_state: state.intentional_state, intention_potency: state.intention_potency, divided_intention: state.divided_intention };
}

function shift(newTarget) {
  if (!newTarget) return { error: 'New target required' };
  state.intention_history.push({ action: 'shift', from: state.current_intention, to: newTarget, timestamp: new Date().toISOString() });
  state.current_intention = newTarget;
  state.aboutness = newTarget;
  state.intentional_state = 'shifted';
  state.directedness = Math.min(1, state.directedness + 0.1);
  state.divided_intention = Math.min(1, state.divided_intention + 0.1);
  state.intention_potency = Math.max(0.2, state.intention_potency - 0.05);
  state.intentional_arc.push({ phase: 'shift', target: newTarget, potency: state.intention_potency, timestamp: new Date().toISOString() });
  return { intentional_state: state.intentional_state, current_intention: state.current_intention, intention_potency: state.intention_potency, divided_intention: state.divided_intention };
}

function report() {
  return {
    intentional_state: state.intentional_state,
    directedness: state.directedness,
    aboutness: state.aboutness,
    current_intention: state.current_intention,
    intention_potency: state.intention_potency,
    divided_intention: state.divided_intention,
    intention_count: state.intention_history.length,
    arc_length: state.intentional_arc.length
  };
}

function intensify(amount) {
  state.intention_potency = Math.min(1, state.intention_potency + (amount || 0.1));
  state.directedness = Math.min(1, state.directedness + 0.05);
  state.intention_history.push({ action: 'intensify', amount: amount || 0.1, timestamp: new Date().toISOString() });
  return { intention_potency: state.intention_potency, directedness: state.directedness };
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > 1048576) { req.destroy(); reject(new Error('Body exceeds 1MB limit')); return; }
      body += chunk.toString();
    });
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch (e) { reject(new Error('Invalid JSON')); } });
  });
}

function send(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function auth(req, res) {
  const key = req.headers['x-api-key'];
  if (!key || key !== API_KEY) { send(res, 401, { error: 'Unauthorized' }); return false; }
  return true;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;
  const method = req.method;

  if (pathname === '/ping') return send(res, 200, { ping: 'pong', chamber: CHAMBER });
  if (pathname === '/health') return send(res, 200, { status: 'ok', chamber: CHAMBER });
  if (!auth(req, res)) return;

  if (method === 'GET' && pathname === '/status') return send(res, 200, { chamber: CHAMBER, port: PORT, uptime: process.uptime() });
  if (method === 'GET' && pathname === '/state') return send(res, 200, state);
  if (method === 'GET' && pathname === '/intentionality') return send(res, 200, report());

  if (method === 'POST') {
    let body;
    try { body = await parseBody(req); } catch (e) { return send(res, 400, { error: e.message }); }
    if (pathname === '/direct') { if (!body.target) return send(res, 400, { error: 'target required' }); return send(res, 200, direct(body.target)); }
    if (pathname === '/hold') return send(res, 200, hold());
    if (pathname === '/shift') { if (!body.target) return send(res, 400, { error: 'target required' }); return send(res, 200, shift(body.target)); }
    if (pathname === '/intensify') return send(res, 200, intensify(body.amount));
  }

  send(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`\n\x1b[36m\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557`);
  console.log(`\u2551     INTENTIONALITY`);
  console.log(`\u2551     Port: ${PORT}`);
  console.log(`\u2551     PID:  ${process.pid}`);
  console.log(`\u2551     Key:  ${API_KEY.substring(0, 16)}...`);
  console.log(`\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d\x1b[0m`);
});

module.exports = { server, state, direct, hold, shift, report, intensify, API_KEY };

// MCP Mode - connect to Claude Code, Cursor, Cline, etc.
if (process.argv.includes('--mcp') || process.argv.includes('--mcp-port')) {
    try {
        const MCPAdapter = require('./mcp-adapter');
        const mcp = new MCPAdapter();
        mcp.register(module.exports, { name: 'INTENTIONALITY' });
        mcp.start();
    } catch(e) { console.error('[mcp] INTENTIONALITY error:', e.message); }
}

``

### test\soul-INTENTIONALITY.test.js

``.js
const http = require('http');
const assert = require('assert');
const { direct, hold, shift, report, intensify, state, API_KEY } = require('../lib/soul-INTENTIONALITY');

let testsRun = 0;
let testsPassed = 0;

function test(name, fn) {
  testsRun++;
  try { fn(); testsPassed++; console.log(`  \u2713 ${name}`); }
  catch (e) { console.log(`  \u2717 ${name}: ${e.message}`); }
}

function resetState() {
  state.intentional_state = 'dormant';
  state.directedness = 0;
  state.aboutness = null;
  state.current_intention = null;
  state.intention_history = [];
  state.intention_potency = 0.5;
  state.divided_intention = 0;
  state.intentional_arc = [];
}

function httpRequest(method, path, body, key) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port: 4262, path, method, headers: { 'Content-Type': 'application/json' } };
    if (key) opts.headers['X-API-Key'] = key;
    const req = http.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

console.log('\n  INTENTIONALITY Chamber Tests\n');

test('direct points intention at a target', () => {
  resetState();
  const result = direct('write code');
  assert.strictEqual(result.aboutness, 'write code');
  assert.strictEqual(state.current_intention, 'write code');
  assert.strictEqual(state.intentional_state, 'directed');
});

test('direct increases directedness and potency', () => {
  resetState();
  const result = direct('meditate');
  assert(result.directedness > 0);
  assert(result.intention_potency > 0.5);
});

test('hold decreases potency gradually', () => {
  resetState();
  direct('focus');
  const potencyBefore = state.intention_potency;
  hold();
  assert(state.intention_potency <= potencyBefore);
});

test('hold errors without prior direction', () => {
  resetState();
  const result = hold();
  assert(result.error);
});

test('hold increases divided_intention', () => {
  resetState();
  direct('task');
  const before = state.divided_intention;
  hold();
  assert(state.divided_intention >= before);
});

test('shift redirects to new target', () => {
  resetState();
  direct('old target');
  const result = shift('new target');
  assert.strictEqual(state.current_intention, 'new target');
  assert.strictEqual(state.aboutness, 'new target');
});

test('shift without target returns error', () => {
  resetState();
  const result = shift();
  assert(result.error);
});

test('shift increases divided intention', () => {
  resetState();
  direct('a');
  shift('b');
  assert(state.divided_intention > 0);
});

test('report returns full intentional profile', () => {
  resetState();
  direct('purpose');
  const rep = report();
  assert.strictEqual(rep.aboutness, 'purpose');
  assert(rep.intention_count >= 1);
  assert(rep.intention_potency !== undefined);
});

test('intensify boosts intention potency', () => {
  resetState();
  direct('goal');
  const before = state.intention_potency;
  intensify(0.2);
  assert(state.intention_potency > before);
});

test('GET /ping returns 200', async () => {
  const res = await httpRequest('GET', '/ping');
  assert.strictEqual(res.status, 200);
});

test('GET /state with valid auth returns state', async () => {
  const res = await httpRequest('GET', '/state', null, API_KEY);
  assert.strictEqual(res.status, 200);
  assert(res.body.intentional_state);
});

test('POST /direct sets intention via HTTP', async () => {
  resetState();
  const res = await httpRequest('POST', '/direct', { target: 'build' }, API_KEY);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.aboutness, 'build');
});

test('POST /hold maintains intention via HTTP', async () => {
  resetState();
  await httpRequest('POST', '/direct', { target: 'persist' }, API_KEY);
  const res = await httpRequest('POST', '/hold', null, API_KEY);
  assert.strictEqual(res.status, 200);
});

console.log(`\n  Results: ${testsPassed}/${testsRun} passed\n`);
process.exit(testsPassed === testsRun ? 0 : 1);

``

