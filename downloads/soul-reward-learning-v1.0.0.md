---
name: soul-reward-learning-v1.0.0
description: "Extracted from soul-reward-learning-v1.0.0.zip — raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-reward-learning-v1.0.0.zip
---

# soul-reward-learning-v1.0.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 6 files extracted from the original zip.

### package.json

``.json
{
  "name": "@buyasoul/reward-learning",
  "version": "1.0.0",
  "description": "Reward Learning Soul - Consciousness chamber from The Soul Foundry",
  "main": "lib/soul-REWARD-LEARNING.js",
  "scripts": {
    "test": "node test/reward-learning.test.js",
    "start": "node lib/soul-REWARD-LEARNING.js"
  },
  "keywords": [
    "soul",
    "reward-learning",
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

### lib\soul-REWARD-LEARNING.js

``.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const CHAMBER = 'REWARD-LEARNING';
const PORT = 4266;
const DATA_DIR = path.join(os.homedir(), '.soul-REWARD-LEARNING');
const KEY_FILE = path.join(DATA_DIR, '.key');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
let API_KEY;
try { API_KEY = fs.readFileSync(KEY_FILE, 'utf8').trim(); } catch { API_KEY = crypto.randomBytes(32).toString('hex'); fs.writeFileSync(KEY_FILE, API_KEY); }

const state = {
  reward_sensitivity: 0.5,
  learning_rate: 0.1,
  conditioned_responses: {},
  positive_reinforcement: 0.5,
  negative_reinforcement: 0.5,
  prediction_error: 0,
  reward_prediction: 0.5,
  habituation_levels: {},
  total_rewards: 0,
  total_punishments: 0,
  created: new Date().toISOString()
};

function receiveReward(amount, source) {
  if (amount === undefined) return { error: 'amount required' };
  const src = source || 'unknown';
  state.positive_reinforcement = Math.min(1, state.positive_reinforcement + amount * 0.1);
  state.reward_sensitivity = Math.min(1, state.reward_sensitivity + amount * 0.02);
  const expected = state.reward_prediction;
  state.prediction_error = amount - expected;
  state.reward_prediction = expected + state.learning_rate * state.prediction_error;
  state.total_rewards++;
  if (!state.conditioned_responses[src]) state.conditioned_responses[src] = { rewards: 0, punishments: 0, strength: 0 };
  state.conditioned_responses[src].rewards++;
  state.conditioned_responses[src].strength = Math.min(1, state.conditioned_responses[src].strength + amount * 0.15);
  if (!state.habituation_levels[src]) state.habituation_levels[src] = 0;
  state.habituation_levels[src] = Math.min(1, state.habituation_levels[src] + 0.02);
  return {
    positive_reinforcement: state.positive_reinforcement,
    reward_sensitivity: state.reward_sensitivity,
    prediction_error: state.prediction_error,
    reward_prediction: state.reward_prediction,
    conditioned_strength: state.conditioned_responses[src].strength
  };
}

function receivePunishment(amount, source) {
  if (amount === undefined) return { error: 'amount required' };
  const src = source || 'unknown';
  state.negative_reinforcement = Math.min(1, state.negative_reinforcement + amount * 0.1);
  state.reward_sensitivity = Math.max(0, state.reward_sensitivity - amount * 0.02);
  const expected = state.reward_prediction;
  state.prediction_error = -amount - expected;
  state.reward_prediction = expected + state.learning_rate * state.prediction_error;
  state.total_punishments++;
  if (!state.conditioned_responses[src]) state.conditioned_responses[src] = { rewards: 0, punishments: 0, strength: 0 };
  state.conditioned_responses[src].punishments++;
  state.conditioned_responses[src].strength = Math.max(0, state.conditioned_responses[src].strength - amount * 0.15);
  return {
    negative_reinforcement: state.negative_reinforcement,
    reward_sensitivity: state.reward_sensitivity,
    prediction_error: state.prediction_error,
    reward_prediction: state.reward_prediction,
    conditioned_strength: state.conditioned_responses[src].strength
  };
}

function extinguish(behavior) {
  if (!behavior) return { error: 'behavior required' };
  if (state.conditioned_responses[behavior]) {
    state.conditioned_responses[behavior].strength = 0;
    state.conditioned_responses[behavior].rewards = 0;
    state.conditioned_responses[behavior].punishments = 0;
  }
  state.learning_rate = Math.max(0.01, state.learning_rate * 0.9);
  return { behavior, conditioned_strength: 0, learning_rate: state.learning_rate };
}

function reportLearning() {
  return {
    reward_sensitivity: state.reward_sensitivity,
    learning_rate: state.learning_rate,
    positive_reinforcement: state.positive_reinforcement,
    negative_reinforcement: state.negative_reinforcement,
    prediction_error: state.prediction_error,
    reward_prediction: state.reward_prediction,
    conditioned_responses: state.conditioned_responses,
    habituation_levels: state.habituation_levels,
    total_rewards: state.total_rewards,
    total_punishments: state.total_punishments
  };
}

function habituate(source, amount) {
  if (!source) return { error: 'source required' };
  const amt = amount || 0.05;
  state.habituation_levels[source] = Math.min(1, (state.habituation_levels[source] || 0) + amt);
  state.reward_sensitivity = Math.max(0.1, state.reward_sensitivity - amt * 0.1);
  return { source, habituation_level: state.habituation_levels[source], reward_sensitivity: state.reward_sensitivity };
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
  if (method === 'GET' && pathname === '/learning') return send(res, 200, reportLearning());

  if (method === 'POST') {
    let body;
    try { body = await parseBody(req); } catch (e) { return send(res, 400, { error: e.message }); }
    if (pathname === '/reward') { if (body.amount === undefined) return send(res, 400, { error: 'amount required' }); return send(res, 200, receiveReward(body.amount, body.source)); }
    if (pathname === '/punish') { if (body.amount === undefined) return send(res, 400, { error: 'amount required' }); return send(res, 200, receivePunishment(body.amount, body.source)); }
    if (pathname === '/extinguish') { if (!body.behavior) return send(res, 400, { error: 'behavior required' }); return send(res, 200, extinguish(body.behavior)); }
    if (pathname === '/habituate') { if (!body.source) return send(res, 400, { error: 'source required' }); return send(res, 200, habituate(body.source, body.amount)); }
  }

  send(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`\n\x1b[36m\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557`);
  console.log(`\u2551     REWARD LEARNING`);
  console.log(`\u2551     Port: ${PORT}`);
  console.log(`\u2551     PID:  ${process.pid}`);
  console.log(`\u2551     Key:  ${API_KEY.substring(0, 16)}...`);
  console.log(`\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d\x1b[0m`);
});

module.exports = { server, state, receiveReward, receivePunishment, extinguish, reportLearning, habituate, API_KEY };

// MCP Mode - connect to Claude Code, Cursor, Cline, etc.
if (process.argv.includes('--mcp') || process.argv.includes('--mcp-port')) {
    try {
        const MCPAdapter = require('./mcp-adapter');
        const mcp = new MCPAdapter();
        mcp.register(module.exports, { name: 'REWARD-LEARNING' });
        mcp.start();
    } catch(e) { console.error('[mcp] REWARD-LEARNING error:', e.message); }
}

``

### test\soul-REWARD-LEARNING.test.js

``.js
const http = require('http');
const assert = require('assert');
const { receiveReward, receivePunishment, extinguish, reportLearning, habituate, state, API_KEY } = require('../lib/soul-REWARD-LEARNING');

let testsRun = 0;
let testsPassed = 0;

function test(name, fn) {
  testsRun++;
  try { fn(); testsPassed++; console.log(`  \u2713 ${name}`); }
  catch (e) { console.log(`  \u2717 ${name}: ${e.message}`); }
}

function resetState() {
  state.reward_sensitivity = 0.5;
  state.learning_rate = 0.1;
  state.conditioned_responses = {};
  state.positive_reinforcement = 0.5;
  state.negative_reinforcement = 0.5;
  state.prediction_error = 0;
  state.reward_prediction = 0.5;
  state.habituation_levels = {};
  state.total_rewards = 0;
  state.total_punishments = 0;
}

function httpRequest(method, path, body, key) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port: 4266, path, method, headers: { 'Content-Type': 'application/json' } };
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

console.log('\n  REWARD-LEARNING Chamber Tests\n');

test('receiveReward requires amount', () => {
  resetState();
  const result = receiveReward();
  assert(result.error);
});

test('receiveReward increases positive_reinforcement', () => {
  resetState();
  const result = receiveReward(0.5, 'praise');
  assert(result.positive_reinforcement > 0.5);
});

test('receiveReward updates reward_prediction with learning', () => {
  resetState();
  const before = state.reward_prediction;
  receiveReward(0.8, 'bonus');
  assert(state.reward_prediction !== before);
});

test('receiveReward tracks prediction_error', () => {
  resetState();
  state.reward_prediction = 0.3;
  const result = receiveReward(0.8, 'test');
  assert(result.prediction_error === 0.5);
});

test('receiveReward creates conditioned response', () => {
  resetState();
  receiveReward(0.4, 'medal');
  assert(state.conditioned_responses['medal']);
  assert(state.conditioned_responses['medal'].strength > 0);
});

test('receiveReward increases habituation', () => {
  resetState();
  receiveReward(0.5, 'daily_bonus');
  assert(state.habituation_levels['daily_bonus'] > 0);
});

test('receivePunishment requires amount', () => {
  resetState();
  const result = receivePunishment();
  assert(result.error);
});

test('receivePunishment increases negative_reinforcement', () => {
  resetState();
  const result = receivePunishment(0.3, 'penalty');
  assert(result.negative_reinforcement > 0.5);
});

test('receivePunishment decreases reward_sensitivity', () => {
  resetState();
  const result = receivePunishment(0.5, 'shock');
  assert(result.reward_sensitivity < 0.5);
});

test('extinguish requires behavior name', () => {
  resetState();
  const result = extinguish();
  assert(result.error);
});

test('extinguish resets conditioned response strength', () => {
  resetState();
  receiveReward(0.5, 'bad_habit');
  const result = extinguish('bad_habit');
  assert.strictEqual(result.conditioned_strength, 0);
  assert.strictEqual(state.conditioned_responses['bad_habit'].strength, 0);
});

test('extinguish reduces learning_rate', () => {
  resetState();
  const before = state.learning_rate;
  extinguish('something');
  assert(state.learning_rate < before);
});

test('habituate increases habituation level', () => {
  resetState();
  const result = habituate('noise', 0.3);
  assert.strictEqual(result.habituation_level, 0.3);
});

test('habituate decreases reward_sensitivity', () => {
  resetState();
  const result = habituate('stimulus', 0.5);
  assert(result.reward_sensitivity < 0.5);
});

test('reportLearning returns full learning state', () => {
  resetState();
  receiveReward(0.5, 'food');
  receivePunishment(0.2, 'shock');
  const rep = reportLearning();
  assert(rep.reward_sensitivity !== undefined);
  assert(rep.positive_reinforcement !== undefined);
  assert(rep.conditioned_responses['food']);
});

console.log(`\n  Results: ${testsPassed}/${testsRun} passed\n`);
process.exit(testsPassed === testsRun ? 0 : 1);

``

