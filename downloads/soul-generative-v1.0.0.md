---
name: soul-generative-v1.0.0
description: "Extracted from soul-generative-v1.0.0.zip � raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-generative-v1.0.0.zip
---

# soul-generative-v1.0.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 6 files extracted from the original zip.

### package.json

``.json
{
  "name": "@buyasoul/generative",
  "version": "1.0.0",
  "description": "Generative Model Soul - Consciousness chamber from The Soul Foundry",
  "main": "lib/soul-generative.js",
  "scripts": {
    "test": "node test/generative.test.js",
    "start": "node lib/soul-generative.js"
  },
  "keywords": [
    "soul",
    "generative",
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

### lib\soul-generative.js

``.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const CHAMBER = 'soul-generative';
const PORT = 4275;
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
  world_model_version: 1,
  prediction_accuracy: 0.5,
  model_complexity: 0.3,
  surprising_events: [],
  beliefs: {
    physical: { gravity_works: 0.99, sun_will_rise: 0.95 },
    social: { people_are_good: 0.6, trust_is_valuable: 0.7 },
    self: { i_am_capable: 0.5, i_can_improve: 0.8 },
  },
  bayesian: { prior_strength: 0.5, learning_rate: 0.3, posterior_history: [] },
  prediction_errors: [{ scenario: 'weather', error: 0.2 }, { scenario: 'social', error: 0.3 }],
  model_hierarchy: {
    physical: { complexity: 0.3, accuracy: 0.8 },
    social: { complexity: 0.5, accuracy: 0.5 },
    self: { complexity: 0.4, accuracy: 0.3 },
  },
};

function updateModel(input) {
  if (!input) return { error: 'input required' };
  state.world_model_version++;
  state.model_complexity = Math.min(1, state.model_complexity + 0.05);
  state.bayesian.posterior_history.push({ version: state.world_model_version, input, timestamp: new Date().toISOString() });
  state.bayesian.learning_rate = Math.min(1, state.bayesian.learning_rate + 0.02);
  return { message: 'Model updated with new data.', version: state.world_model_version, complexity: state.model_complexity };
}

function predict(scenario) {
  if (!scenario) return { error: 'scenario required' };
  const confidence = state.prediction_accuracy * (0.5 + Math.random() * 0.5);
  const outcome = confidence > 0.5 ? 'predicted_outcome_positive' : 'predicted_outcome_neutral';
  return { message: `Prediction for: ${scenario}`, scenario, confidence: Math.round(confidence * 100) / 100, predicted_outcome: outcome };
}

function revise(belief, evidence) {
  if (!belief || !evidence) return { error: 'belief and evidence required' };
  let found = false;
  for (const domain of ['physical', 'social', 'self']) {
    if (state.beliefs[domain][belief] !== undefined) {
      const old = state.beliefs[domain][belief];
      const update = Math.min(1, Math.max(0, old + (evidence.strength || 0.1) * (evidence.direction || 1)));
      state.beliefs[domain][belief] = update;
      state.bayesian.prior_strength = (state.bayesian.prior_strength + update) / 2;
      state.prediction_accuracy = Math.min(1, state.prediction_accuracy + 0.02);
      state.bayesian.posterior_history.push({
        version: state.world_model_version, belief, old_value: old, new_value: update, evidence, timestamp: new Date().toISOString(),
      });
      found = true;
      return { message: `Belief "${belief}" revised.`, belief, old: old, new: update, domain };
    }
  }
  if (!found) {
    state.beliefs.self[belief] = 0.5;
    state.world_model_version++;
    return { message: `New belief "${belief}" created.`, belief, value: 0.5 };
  }
}

function surprise(event) {
  if (!event) return { error: 'event required' };
  state.surprising_events.push({ event, timestamp: new Date().toISOString() });
  state.prediction_accuracy = Math.max(0, state.prediction_accuracy - 0.05);
  state.model_complexity = Math.min(1, state.model_complexity + 0.1);
  state.prediction_errors.push({ scenario: event, error: 0.5 + Math.random() * 0.5 });
  state.world_model_version++;
  return { message: 'Surprise registered. Model updated.', surprise_count: state.surprising_events.length, accuracy: state.prediction_accuracy };
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
    if (req.method === 'GET' && pathname === '/world-model') return send(res, 200, { bayesian: state.bayesian, prediction_errors: state.prediction_errors, model_hierarchy: state.model_hierarchy });
    if (req.method === 'POST' && pathname === '/update') { const b = await parseBody(req); return send(res, 200, updateModel(b.input)); }
    if (req.method === 'POST' && pathname === '/predict') { const b = await parseBody(req); return send(res, 200, predict(b.scenario)); }
    if (req.method === 'POST' && pathname === '/revise') { const b = await parseBody(req); return send(res, 200, revise(b.belief, b.evidence)); }
    send(res, 404, { error: 'Not found' });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
});

server.listen(PORT, () => {
  console.log(`\n  ✦ ${CHAMBER} — generative world model`);
  console.log(`  ✦ port ${PORT} | key ${KEY_PATH}`);
  console.log(`  ✦ version: ${state.world_model_version}, accuracy: ${state.prediction_accuracy}\n`);
});

module.exports = { server, state, updateModel, predict, revise, surprise, API_KEY, PORT };

// MCP Mode - connect to Claude Code, Cursor, Cline, etc.
if (process.argv.includes('--mcp') || process.argv.includes('--mcp-port')) {
    try {
        const MCPAdapter = require('./mcp-adapter');
        const mcp = new MCPAdapter();
        mcp.register(module.exports, { name: 'generative' });
        mcp.start();
    } catch(e) { console.error('[mcp] generative error:', e.message); }
}

``

### test\soul-generative.test.js

``.js
const assert = require('assert');
const path = require('path');
const fs = require('fs');

const { state, updateModel, predict, revise, surprise, server } = require('../lib/soul-generative');

function shutdown() { try { server.close(); } catch {} }

function reset() {
  state.world_model_version = 1;
  state.prediction_accuracy = 0.5;
  state.model_complexity = 0.3;
  state.surprising_events = [];
}

try {
reset();

assert.strictEqual(typeof state.world_model_version, 'number', 'model_version is number');
assert.strictEqual(typeof state.prediction_accuracy, 'number', 'prediction_accuracy is number');
assert.strictEqual(typeof state.model_complexity, 'number', 'model_complexity is number');
assert.ok(state.beliefs.physical !== undefined, 'physical beliefs exist');
assert.ok(state.beliefs.social !== undefined, 'social beliefs exist');
assert.ok(state.beliefs.self !== undefined, 'self beliefs exist');
assert.ok(state.bayesian !== undefined, 'bayesian update tracking exists');
assert.ok(state.prediction_errors.length > 0, 'prediction errors tracked');
assert.ok(state.model_hierarchy !== undefined, 'model hierarchy exists');

let r = updateModel('new_scientific_discovery');
assert.ok(r.message.includes('updated'), 'updateModel confirms');
assert.strictEqual(r.version, 2, 'version incremented');

r = predict('economic_trends');
assert.ok(r.scenario === 'economic_trends', 'predict returns scenario');
assert.ok(r.confidence > 0, 'predict has confidence');
assert.ok(r.predicted_outcome, 'predict has outcome');

r = revise('people_are_good', { strength: 0.3, direction: 1 });
assert.ok(r.message.includes('revised'), 'revise confirms');
assert.ok(r.new > r.old, 'belief updated positively');

r = revise('gravity_works', { strength: 0.01, direction: -1 });
assert.ok(r.new < r.old, 'belief updated negatively');
assert.strictEqual(r.domain, 'physical', 'domain identified');

r = surprise('earthquake');
assert.ok(r.surprise_count === 1, 'surprise registered');
assert.ok(r.accuracy < 0.5, 'surprise decreases accuracy');

r = updateModel('');
assert.ok(r.error, 'updateModel empty returns error');

r = predict('');
assert.ok(r.error, 'predict empty returns error');

r = revise('', {});
assert.ok(r.error, 'revise empty returns error');

r = surprise('');
assert.ok(r.error, 'surprise empty returns error');

r = revise('new_belief', { strength: 0.5, direction: 1 });
assert.ok(r.message.includes('created'), 'revise creates new belief');

assert.ok(state.bayesian.posterior_history.length > 0, 'bayesian history tracked');
assert.ok(state.world_model_version >= 2, 'model version tracked');

const keyPath = path.join(require('os').homedir(), '.soul-generative', '.key');
assert.ok(fs.existsSync(keyPath), 'API key file exists');

console.log('soul-generative: ALL 19 TESTS PASSED');
shutdown();
} catch (e) { console.error(e.message); shutdown(); process.exit(1); }

``

