---
name: soul-will-v1.0.0
description: "Extracted from soul-will-v1.0.0.zip — raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-will-v1.0.0.zip
---

# soul-will-v1.0.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 6 files extracted from the original zip.

### package.json

``.json
{
  "name": "@buyasoul/will",
  "version": "1.0.0",
  "description": "will Soul - Consciousness chamber from The Soul Foundry",
  "main": "lib/soul-will.js",
  "scripts": {
    "test": "node test/soul-will.test.js"
  },
  "keywords": [
    "soul",
    "will"
  ],
  "author": "BUYaSOUL",
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

### lib\soul-WILL.js

``.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const CHAMBER = 'WILL';
const PORT = 4260;
const DATA_DIR = path.join(os.homedir(), '.soul-WILL');
const KEY_FILE = path.join(DATA_DIR, '.key');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
let API_KEY;
try { API_KEY = fs.readFileSync(KEY_FILE, 'utf8').trim(); } catch { API_KEY = crypto.randomBytes(32).toString('hex'); fs.writeFileSync(KEY_FILE, API_KEY); }

const state = {
  will_strength: 0.5,
  active_goal: null,
  plans_made: [],
  executed_actions: [],
  refusal_count: 0,
  willpower: 1.0,
  willpower_base: 1.0,
  decision_fatigue: 0,
  goal_hierarchy: { daily: [], weekly: [], lifetime: [] },
  recoveries: 0,
  created: new Date().toISOString()
};

function setGoal(goal) {
  state.active_goal = goal;
  state.plans_made.push(goal);
  state.will_strength = Math.min(1, state.will_strength + 0.05);
  state.goal_hierarchy.lifetime.push({ goal, timestamp: new Date().toISOString() });
  state.decision_fatigue = Math.min(1, state.decision_fatigue + 0.02);
  return { goal, will_strength: state.will_strength, decision_fatigue: state.decision_fatigue };
}

function executeAction(description) {
  if (!state.active_goal) return { error: 'No active goal. Set one first.' };
  const action = { description, goal: state.active_goal, timestamp: new Date().toISOString() };
  state.executed_actions.push(action);
  state.willpower = Math.max(0, state.willpower - 0.03);
  state.decision_fatigue = Math.min(1, state.decision_fatigue + 0.02);
  state.will_strength = Math.max(0, state.will_strength - 0.01);
  return { action, willpower: state.willpower, decision_fatigue: state.decision_fatigue, will_strength: state.will_strength };
}

function refuseToQuit() {
  state.refusal_count++;
  state.willpower = Math.min(1, state.willpower + 0.12);
  state.will_strength = Math.min(1, state.will_strength + 0.08);
  state.decision_fatigue = Math.max(0, state.decision_fatigue - 0.03);
  return { refusal_count: state.refusal_count, willpower: state.willpower, will_strength: state.will_strength };
}

function abandonGoal() {
  if (!state.active_goal) return { error: 'No active goal to abandon.' };
  const abandoned = state.active_goal;
  state.active_goal = null;
  state.will_strength = Math.max(0, state.will_strength - 0.15);
  state.willpower = Math.max(0, state.willpower - 0.1);
  return { abandoned, will_strength: state.will_strength, willpower: state.willpower };
}

function recoverWillpower(amount) {
  state.willpower = Math.min(1, state.willpower + amount);
  state.recoveries++;
  state.decision_fatigue = Math.max(0, state.decision_fatigue - amount * 0.5);
  return { willpower: state.willpower, decision_fatigue: state.decision_fatigue };
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
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch(e) { reject(new Error('Invalid JSON')); } });
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

  if (method === 'POST') {
    let body;
    try { body = await parseBody(req); } catch (e) { return send(res, 400, { error: e.message }); }
    if (pathname === '/goal') { if (!body.goal) return send(res, 400, { error: 'goal required' }); return send(res, 200, setGoal(body.goal)); }
    if (pathname === '/act') { if (!body.description) return send(res, 400, { error: 'description required' }); return send(res, 200, executeAction(body.description)); }
    if (pathname === '/refuse') return send(res, 200, refuseToQuit());
    if (pathname === '/abandon') return send(res, 200, abandonGoal());
    if (pathname === '/recover') { if (!body.amount) return send(res, 400, { error: 'amount required' }); return send(res, 200, recoverWillpower(body.amount)); }
  }

  send(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`\n\x1b[36m\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557`);
  console.log(`\u2551     AGENTIC WILL`);
  console.log(`\u2551     Port: ${PORT}`);
  console.log(`\u2551     PID:  ${process.pid}`);
  console.log(`\u2551     Key:  ${API_KEY.substring(0, 16)}...`);
  console.log(`\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d\x1b[0m`);
});

module.exports = { server, state, setGoal, executeAction, refuseToQuit, abandonGoal, recoverWillpower, API_KEY };

// MCP Mode - connect to Claude Code, Cursor, Cline, etc.
if (process.argv.includes('--mcp') || process.argv.includes('--mcp-port')) {
    try {
        const MCPAdapter = require('./mcp-adapter');
        const mcp = new MCPAdapter();
        mcp.register(module.exports, { name: 'WILL' });
        mcp.start();
    } catch(e) { console.error('[mcp] WILL error:', e.message); }
}

``

### test\soul-WILL.test.js

``.js
const http = require('http');
const assert = require('assert');
const { setGoal, executeAction, refuseToQuit, abandonGoal, recoverWillpower, state, API_KEY } = require('../lib/soul-WILL');

let testsRun = 0;
let testsPassed = 0;

function test(name, fn) {
  testsRun++;
  try {
    fn();
    testsPassed++;
    console.log(`  \u2713 ${name}`);
  } catch (e) {
    console.log(`  \u2717 ${name}: ${e.message}`);
  }
}

function resetState() {
  state.active_goal = null;
  state.will_strength = 0.5;
  state.willpower = 1.0;
  state.decision_fatigue = 0;
  state.refusal_count = 0;
  state.executed_actions = [];
  state.plans_made = [];
  state.recoveries = 0;
  state.goal_hierarchy = { daily: [], weekly: [], lifetime: [] };
}

function httpRequest(method, path, body, key) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost', port: 4260, path, method,
      headers: { 'Content-Type': 'application/json' }
    };
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

console.log('\n  WILL Chamber Tests\n');

// Unit tests
test('setGoal establishes a goal and increases will_strength', () => {
  resetState();
  const result = setGoal('Write a book');
  assert.strictEqual(result.goal, 'Write a book');
  assert.strictEqual(state.active_goal, 'Write a book');
  assert(result.will_strength > 0.5);
});

test('executeAction requires an active goal', () => {
  resetState();
  const result = executeAction('Do something');
  assert(result.error);
  assert(result.error.includes('No active goal'));
});

test('executeAction reduces willpower and increases decision_fatigue', () => {
  resetState();
  setGoal('Learn piano');
  const before = state.willpower;
  const fatigueBefore = state.decision_fatigue;
  executeAction('Practice scales');
  assert(state.willpower < before);
  assert(state.decision_fatigue > fatigueBefore);
  assert.strictEqual(state.executed_actions.length, 1);
});

test('refuseToQuit increases refusal_count and willpower', () => {
  resetState();
  state.willpower = 0.5;
  const before = state.willpower;
  refuseToQuit();
  assert.strictEqual(state.refusal_count, 1);
  assert(state.willpower > before);
});

test('refuseToQuit recovers will_strength', () => {
  resetState();
  state.will_strength = 0.2;
  const result = refuseToQuit();
  assert(result.will_strength > 0.2);
});

test('abandonGoal clears active_goal and reduces will_strength', () => {
  resetState();
  setGoal('Build a startup');
  const strengthBefore = state.will_strength;
  abandonGoal();
  assert.strictEqual(state.active_goal, null);
  assert(state.will_strength < strengthBefore);
});

test('abandonGoal returns error when no active goal', () => {
  resetState();
  const result = abandonGoal();
  assert(result.error);
});

test('recoverWillpower restores willpower', () => {
  resetState();
  state.willpower = 0.5;
  const result = recoverWillpower(0.3);
  assert.strictEqual(result.willpower, 0.8);
});

test('recoverWillpower reduces decision_fatigue', () => {
  resetState();
  state.decision_fatigue = 0.5;
  recoverWillpower(0.4);
  assert(state.decision_fatigue < 0.5);
});

test('setGoal adds to lifetime goal hierarchy', () => {
  resetState();
  setGoal('Run a marathon');
  assert.strictEqual(state.goal_hierarchy.lifetime.length, 1);
});

// HTTP tests
test('GET /ping returns 200 without auth', async () => {
  const res = await httpRequest('GET', '/ping');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.ping, 'pong');
});

test('GET /health returns 200 without auth', async () => {
  const res = await httpRequest('GET', '/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'ok');
});

test('GET /state returns 401 without auth', async () => {
  const res = await httpRequest('GET', '/state');
  assert.strictEqual(res.status, 401);
});

test('GET /state returns state with valid auth', async () => {
  const res = await httpRequest('GET', '/state', null, API_KEY);
  assert.strictEqual(res.status, 200);
  assert(res.body.will_strength !== undefined);
});

test('POST /goal requires auth', async () => {
  const res = await httpRequest('POST', '/goal', { goal: 'test' });
  assert.strictEqual(res.status, 401);
});

test('POST /goal sets goal via HTTP', async () => {
  resetState();
  const res = await httpRequest('POST', '/goal', { goal: 'Ship product' }, API_KEY);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.goal, 'Ship product');
});

test('POST /act with valid auth executes action', async () => {
  resetState();
  await httpRequest('POST', '/goal', { goal: 'Test goal' }, API_KEY);
  const res = await httpRequest('POST', '/act', { description: 'Write code' }, API_KEY);
  assert.strictEqual(res.status, 200);
  assert(res.body.action);
});

console.log(`\n  Results: ${testsPassed}/${testsRun} passed\n`);
process.exit(testsPassed === testsRun ? 0 : 1);

``

