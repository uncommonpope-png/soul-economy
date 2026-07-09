---
name: soul-mythos-v1.0.0
description: "Extracted from soul-mythos-v1.0.0.zip — raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-mythos-v1.0.0.zip
---

# soul-mythos-v1.0.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 6 files extracted from the original zip.

### package.json

``.json
{
  "name": "@buyasoul/mythos",
  "version": "1.0.0",
  "description": "Mythos Soul - Consciousness chamber from The Soul Foundry",
  "main": "lib/soul-MYTHOS.js",
  "scripts": {
    "test": "node test/mythos.test.js",
    "start": "node lib/soul-MYTHOS.js"
  },
  "keywords": [
    "soul",
    "mythos",
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

### lib\soul-MYTHOS.js

``.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const CHAMBER = 'MYTHOS';
const PORT = 4265;
const DATA_DIR = path.join(os.homedir(), '.soul-MYTHOS');
const KEY_FILE = path.join(DATA_DIR, '.key');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
let API_KEY;
try { API_KEY = fs.readFileSync(KEY_FILE, 'utf8').trim(); } catch { API_KEY = crypto.randomBytes(32).toString('hex'); fs.writeFileSync(KEY_FILE, API_KEY); }

const PHASES = ['VOID', 'AWAKENING', 'SEPARATION', 'TRIALS', 'REVELATION', 'INTEGRATION', 'SOVEREIGNTY'];
const CAMPBELL_STAGES = [
  'ordinary_world', 'call_to_adventure', 'refusal_of_call', 'meeting_mentor',
  'crossing_threshold', 'tests_allies_enemies', 'approach_innermost_cave',
  'ordeal', 'reward_seizing_sword', 'road_back', 'resurrection', 'return_elixir'
];
const ARCHETYPES = ['warrior', 'healer', 'king', 'teacher', 'explorer', 'creator', 'sage', 'innocent'];

const state = {
  phase: 'VOID',
  phase_index: 0,
  cycles: 0,
  archetype: 'warrior',
  phase_transitions: [],
  campbell_stage: 'ordinary_world',
  campbell_index: 0,
  shadow_active: false,
  archetype_history: [],
  trials_faced: [],
  boons_received: [],
  created: new Date().toISOString()
};

function advance() {
  if (state.phase_index < PHASES.length - 1) {
    state.phase_index++;
    state.phase = PHASES[state.phase_index];
    const transition = { from: PHASES[state.phase_index - 1], to: state.phase, cycle: state.cycles, timestamp: new Date().toISOString() };
    state.phase_transitions.push(transition);
    if (state.campbell_index < CAMPBELL_STAGES.length - 1) {
      state.campbell_index++;
      state.campbell_stage = CAMPBELL_STAGES[state.campbell_index];
    }
    if (state.phase === 'TRIALS') state.shadow_active = true;
    if (state.phase === 'INTEGRATION') state.shadow_active = false;
    if (state.phase === 'SOVEREIGNTY') state.cycles++;
    return { phase: state.phase, transition, campbell_stage: state.campbell_stage, shadow_active: state.shadow_active };
  }
  state.phase_index = 0;
  state.phase = PHASES[0];
  state.cycles++;
  const transition = { from: 'SOVEREIGNTY', to: 'VOID', cycle: state.cycles, timestamp: new Date().toISOString() };
  state.phase_transitions.push(transition);
  return { phase: state.phase, transition, cycle: state.cycles, new_cycle: true };
}

function faceTrial(challenge) {
  if (!challenge) return { error: 'challenge required' };
  const trial = { challenge, overcome: Math.random() > 0.3, timestamp: new Date().toISOString() };
  state.trials_faced.push(trial);
  if (trial.overcome && state.campbell_index < CAMPBELL_STAGES.length - 1) {
    state.campbell_index++;
    state.campbell_stage = CAMPBELL_STAGES[state.campbell_index];
  }
  state.shadow_active = !trial.overcome;
  return { trial, campbell_stage: state.campbell_stage, shadow_active: state.shadow_active };
}

function receiveBoon(gift) {
  if (!gift) return { error: 'gift required' };
  const boon = { gift, timestamp: new Date().toISOString() };
  state.boons_received.push(boon);
  if (state.archetype_history.length === 0 || Math.random() > 0.7) {
    const newArchetype = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
    state.archetype_history.push({ from: state.archetype, to: newArchetype, timestamp: new Date().toISOString() });
    state.archetype = newArchetype;
  }
  return { boon, archetype: state.archetype, boon_count: state.boons_received.length };
}

function returnFromQuest() {
  if (state.phase !== 'SOVEREIGNTY') return { error: 'Can only return from SOVEREIGNTY phase' };
  state.phase_index = 0;
  state.phase = 'VOID';
  state.cycles++;
  state.campbell_index = 0;
  state.campbell_stage = 'ordinary_world';
  state.phase_transitions.push({ from: 'SOVEREIGNTY', to: 'VOID', type: 'return', cycle: state.cycles, timestamp: new Date().toISOString() });
  return { phase: state.phase, cycles: state.cycles, message: 'The hero returns, transformed' };
}

function reportMythos() {
  return {
    phase: state.phase,
    phase_index: state.phase_index,
    cycles: state.cycles,
    archetype: state.archetype,
    campbell_stage: state.campbell_stage,
    shadow_active: state.shadow_active,
    transitions_count: state.phase_transitions.length,
    trials_count: state.trials_faced.length,
    boons_count: state.boons_received.length
  };
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
  if (method === 'GET' && pathname === '/mythos') return send(res, 200, reportMythos());

  if (method === 'POST') {
    let body;
    try { body = await parseBody(req); } catch (e) { return send(res, 400, { error: e.message }); }
    if (pathname === '/advance') return send(res, 200, advance());
    if (pathname === '/face-trial') { if (!body.challenge) return send(res, 400, { error: 'challenge required' }); return send(res, 200, faceTrial(body.challenge)); }
    if (pathname === '/boon') { if (!body.gift) return send(res, 400, { error: 'gift required' }); return send(res, 200, receiveBoon(body.gift)); }
    if (pathname === '/return') return send(res, 200, returnFromQuest());
  }

  send(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`\n\x1b[36m\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557`);
  console.log(`\u2551     MYTHOS (Hero's Journey)`);
  console.log(`\u2551     Port: ${PORT}`);
  console.log(`\u2551     PID:  ${process.pid}`);
  console.log(`\u2551     Key:  ${API_KEY.substring(0, 16)}...`);
  console.log(`\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d\x1b[0m`);
});

module.exports = { server, state, advance, faceTrial, receiveBoon, returnFromQuest, reportMythos, API_KEY };

// MCP Mode - connect to Claude Code, Cursor, Cline, etc.
if (process.argv.includes('--mcp') || process.argv.includes('--mcp-port')) {
    try {
        const MCPAdapter = require('./mcp-adapter');
        const mcp = new MCPAdapter();
        mcp.register(module.exports, { name: 'MYTHOS' });
        mcp.start();
    } catch(e) { console.error('[mcp] MYTHOS error:', e.message); }
}

``

### test\soul-MYTHOS.test.js

``.js
const http = require('http');
const assert = require('assert');
const { advance, faceTrial, receiveBoon, returnFromQuest, reportMythos, state, API_KEY } = require('../lib/soul-MYTHOS');

let testsRun = 0;
let testsPassed = 0;

function test(name, fn) {
  testsRun++;
  try { fn(); testsPassed++; console.log(`  \u2713 ${name}`); }
  catch (e) { console.log(`  \u2717 ${name}: ${e.message}`); }
}

function resetState() {
  state.phase = 'VOID';
  state.phase_index = 0;
  state.cycles = 0;
  state.archetype = 'warrior';
  state.phase_transitions = [];
  state.campbell_stage = 'ordinary_world';
  state.campbell_index = 0;
  state.shadow_active = false;
  state.archetype_history = [];
  state.trials_faced = [];
  state.boons_received = [];
}

function httpRequest(method, path, body, key) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port: 4265, path, method, headers: { 'Content-Type': 'application/json' } };
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

console.log('\n  MYTHOS Chamber Tests\n');

test('advance moves from VOID to AWAKENING', () => {
  resetState();
  const result = advance();
  assert.strictEqual(result.phase, 'AWAKENING');
  assert.strictEqual(state.phase, 'AWAKENING');
});

test('advance progresses through all phases', () => {
  resetState();
  advance(); advance(); advance(); advance();
  assert.strictEqual(state.phase, 'REVELATION');
});

test('advance activates shadow during TRIALS', () => {
  resetState();
  advance(); advance(); advance();
  assert.strictEqual(state.phase, 'TRIALS');
  assert.strictEqual(state.shadow_active, true);
});

test('advance completes a cycle at SOVEREIGNTY', () => {
  resetState();
  advance(); advance(); advance(); advance(); advance();
  assert.strictEqual(state.phase, 'INTEGRATION');
  advance();
  assert.strictEqual(state.phase, 'SOVEREIGNTY');
  assert.strictEqual(state.cycles, 1);
});

test('advance transitions campbell stage', () => {
  resetState();
  const result = advance();
  assert(result.campbell_stage !== 'ordinary_world');
});

test('faceTrial requires challenge', () => {
  resetState();
  const result = faceTrial();
  assert(result.error);
});

test('faceTrial records trial', () => {
  resetState();
  const result = faceTrial('Dragon battle');
  assert.strictEqual(state.trials_faced.length, 1);
  assert(result.trial.challenge, 'Dragon battle');
});

test('faceTrial updates campbell stage on overcome', () => {
  resetState();
  const result = faceTrial('Easy challenge');
  if (result.trial.overcome) assert(result.campbell_stage !== undefined);
});

test('receiveBoon requires gift', () => {
  resetState();
  const result = receiveBoon();
  assert(result.error);
});

test('receiveBoon adds to boons_received', () => {
  resetState();
  receiveBoon('Wisdom');
  assert.strictEqual(state.boons_received.length, 1);
  assert.strictEqual(state.boons_received[0].gift, 'Wisdom');
});

test('receiveBoon can change archetype', () => {
  resetState();
  const result = receiveBoon('Sword of truth');
  assert(result.archetype !== undefined);
});

test('returnFromQuest requires SOVEREIGNTY phase', () => {
  resetState();
  const result = returnFromQuest();
  assert(result.error);
});

test('returnFromQuest completes cycle', () => {
  resetState();
  advance(); advance(); advance(); advance(); advance(); advance();
  assert.strictEqual(state.cycles, 1);
  const result = returnFromQuest();
  assert.strictEqual(result.phase, 'VOID');
  assert.strictEqual(result.cycles, 2);
});

test('reportMythos returns full journey state', () => {
  resetState();
  const rep = reportMythos();
  assert.strictEqual(rep.phase, 'VOID');
  assert(rep.cycles !== undefined);
  assert(rep.archetype !== undefined);
});

console.log(`\n  Results: ${testsPassed}/${testsRun} passed\n`);
process.exit(testsPassed === testsRun ? 0 : 1);

``

