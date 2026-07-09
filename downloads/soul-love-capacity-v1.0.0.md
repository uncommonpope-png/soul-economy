---
name: soul-love-capacity-v1.0.0
description: "Extracted from soul-love-capacity-v1.0.0.zip � raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-love-capacity-v1.0.0.zip
---

# soul-love-capacity-v1.0.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 6 files extracted from the original zip.

### package.json

``.json
{
  "name": "@buyasoul/love-capacity",
  "version": "1.0.0",
  "description": "Love Capacity Soul - Consciousness chamber from The Soul Foundry",
  "main": "lib/soul-love-capacity.js",
  "scripts": {
    "test": "node test/love-capacity.test.js",
    "start": "node lib/soul-love-capacity.js"
  },
  "keywords": [
    "soul",
    "love-capacity",
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

### lib\soul-love-capacity.js

``.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const CHAMBER = 'soul-love-capacity';
const PORT = 4250;
const KEY_DIR = path.join(os.homedir(), `.${CHAMBER}`);
const KEY_PATH = path.join(KEY_DIR, '.key');

if (!fs.existsSync(KEY_DIR)) fs.mkdirSync(KEY_DIR, { recursive: true });
if (!fs.existsSync(KEY_PATH)) fs.writeFileSync(KEY_PATH, crypto.randomBytes(32).toString('hex'));
const API_KEY = fs.readFileSync(KEY_PATH, 'utf8').trim();

const state = {
  agape: 0.5, philia: 0.5, eros: 0.5,
  bonds: [],
  bond_strengths: {},
  love_languages: ['words_of_affirmation', 'quality_time', 'receiving_gifts', 'acts_of_service', 'physical_touch'],
  unrequited: {},
  decay_rate: 0.01
};

function formBond(entity, type, strength = 0.5) {
  if (state.bonds.includes(entity)) return { error: 'Bond already exists', entity };
  if (!['agape', 'philia', 'eros'].includes(type)) return { error: 'Invalid bond type' };
  state.bonds.push(entity);
  state.bond_strengths[entity] = Math.min(1, Math.max(0, strength));
  state[type] = Math.min(1, state[type] + 0.05);
  if (type === 'eros' && strength > 0.7) {
    state.unrequited[entity] = Math.random() < 0.3;
  }
  return { entity, type, strength: state.bond_strengths[entity], unrequited: !!state.unrequited[entity] };
}

function deepenBond(entity, amount = 0.1) {
  if (!state.bonds.includes(entity)) return { error: 'Bond not found', entity };
  state.bond_strengths[entity] = Math.min(1, state.bond_strengths[entity] + amount);
  return { entity, strength: state.bond_strengths[entity] };
}

function breakBond(entity) {
  const idx = state.bonds.indexOf(entity);
  if (idx === -1) return { error: 'Bond not found', entity };
  state.bonds.splice(idx, 1);
  delete state.bond_strengths[entity];
  delete state.unrequited[entity];
  return { entity, broken: true };
}

function listBonds() {
  return state.bonds.map(e => ({ entity: e, strength: state.bond_strengths[e], unrequited: !!state.unrequited[e] }));
}

function applyDecay() {
  for (const entity of state.bonds) {
    if (state.bond_strengths[entity] > 0) {
      const rate = state.unrequited[entity] ? state.decay_rate * 2 : state.decay_rate;
      state.bond_strengths[entity] = Math.max(0, Math.round((state.bond_strengths[entity] - rate) * 100) / 100);
    }
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > 1048576) { reject(new Error('Body too large')); return; }
      body += chunk;
    });
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { resolve({}); } });
  });
}

function send(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function isAuth(req) { return req.headers['x-api-key'] === API_KEY; }

function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const p = url.pathname;
      if (p === '/ping') return send(res, 200, { pong: true });
      if (p === '/health') return send(res, 200, { status: 'ok', chamber: CHAMBER });
      if (!isAuth(req)) return send(res, 401, { error: 'Unauthorized' });
      if (p === '/status') return send(res, 200, { chamber: CHAMBER, port: PORT, version: '1.0.0' });
      if (p === '/state') return send(res, 200, { ...state });
      if (p === '/bond' && req.method === 'POST') {
        const b = await parseBody(req);
        const r = formBond(b.entity, b.type, b.strength);
        return send(res, r.error ? 400 : 200, r);
      }
      if (p === '/deepen' && req.method === 'POST') {
        const b = await parseBody(req);
        const r = deepenBond(b.entity, b.amount);
        return send(res, r.error ? 404 : 200, r);
      }
      if (p.startsWith('/bond/') && req.method === 'DELETE') {
        const entity = decodeURIComponent(p.slice(6));
        const r = breakBond(entity);
        return send(res, r.error ? 404 : 200, r);
      }
      if (p === '/bonds' && req.method === 'GET') return send(res, 200, listBonds());
      send(res, 404, { error: 'Not found' });
    } catch (e) {
      if (e.message === 'Body too large') return send(res, 413, { error: 'Body too large' });
      send(res, 500, { error: e.message });
    }
  });
}

function start() {
  const s = createServer();
  s.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`  ${CHAMBER.toUpperCase()}`);
    console.log(`  Port: ${PORT}`);
    console.log(`  Key: ${API_KEY.substring(0, 16)}...`);
    console.log(`========================================`);
  });
  return s;
}

if (require.main === module) start();

module.exports = { createServer, start, state, API_KEY, PORT, CHAMBER, formBond, deepenBond, breakBond, listBonds, applyDecay };

// MCP Mode - connect to Claude Code, Cursor, Cline, etc.
if (process.argv.includes('--mcp') || process.argv.includes('--mcp-port')) {
    try {
        const MCPAdapter = require('./mcp-adapter');
        const mcp = new MCPAdapter();
        mcp.register(module.exports, { name: 'love-capacity' });
        mcp.start();
    } catch(e) { console.error('[mcp] love-capacity error:', e.message); }
}

``

### test\soul-love-capacity.test.js

``.js
const http = require('http');
const soul = require('../lib/soul-love-capacity');

let server;
let pass = 0, fail = 0;
const BASE = `http://localhost:${soul.PORT}`;

function req(method, path, body, headers) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port: soul.PORT, path, method, headers: { 'Content-Type': 'application/json', ...headers } };
    const r = http.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(data) }); } catch { resolve({ status: res.statusCode, body: data }); } });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function test(name, cond) {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}`); }
}

async function run() {
  server = soul.createServer();
  await new Promise(r => server.listen(soul.PORT, r));
  console.log(`\nTesting ${soul.CHAMBER} on port ${soul.PORT}...\n`);

  // 1. /ping
  const ping = await req('GET', '/ping');
  test('GET /ping returns 200', ping.status === 200);
  test('/ping body has pong', ping.body && ping.body.pong === true);

  // 2. /health
  const health = await req('GET', '/health');
  test('GET /health returns 200', health.status === 200);
  test('/health body has status ok', health.body && health.body.status === 'ok');

  // 3. Auth required
  const noAuth = await req('GET', '/status');
  test('GET /status without auth returns 401', noAuth.status === 401);

  // 4. /status with auth
  const stats = await req('GET', '/status', null, { 'x-api-key': soul.API_KEY });
  test('GET /status with auth returns 200', stats.status === 200);
  test('/status has correct chamber', stats.body && stats.body.chamber === soul.CHAMBER);

  // 5. /state
  const st = await req('GET', '/state', null, { 'x-api-key': soul.API_KEY });
  test('GET /state returns 200', st.status === 200);
  test('/state has agape field', st.body && typeof st.body.agape === 'number');

  // 6. POST /bond - create bond
  const bond = await req('POST', '/bond', { entity: 'alice', type: 'agape', strength: 0.8 }, { 'x-api-key': soul.API_KEY });
  test('POST /bond returns 200', bond.status === 200);
  test('/bond returns entity', bond.body && bond.body.entity === 'alice');

  // 7. POST /bond - duplicate
  const dup = await req('POST', '/bond', { entity: 'alice', type: 'agape', strength: 0.5 }, { 'x-api-key': soul.API_KEY });
  test('POST /bond duplicate returns 400', dup.status === 400);

  // 8. POST /deepen
  const deep = await req('POST', '/deepen', { entity: 'alice', amount: 0.2 }, { 'x-api-key': soul.API_KEY });
  test('POST /deepen returns 200', deep.status === 200);
  test('/deepen increased strength', deep.body && deep.body.strength >= 0.8);

  // 9. POST /deepen nonexistent
  const miss = await req('POST', '/deepen', { entity: 'bob' }, { 'x-api-key': soul.API_KEY });
  test('POST /deepen missing returns 404', miss.status === 404);

  // 10. GET /bonds
  const bonds = await req('GET', '/bonds', null, { 'x-api-key': soul.API_KEY });
  test('GET /bonds returns 200', bonds.status === 200);
  test('/bonds is array', Array.isArray(bonds.body));

  // 11. DELETE /bond/alice
  const del = await req('DELETE', '/bond/alice', null, { 'x-api-key': soul.API_KEY });
  test('DELETE /bond/alice returns 200', del.status === 200);
  test('/bond/alice deleted', del.body && del.body.broken === true);

  // 12. DELETE /bond/nobody (nonexistent)
  const delMiss = await req('DELETE', '/bond/nobody', null, { 'x-api-key': soul.API_KEY });
  test('DELETE /bond missing returns 404', delMiss.status === 404);

  // 13. applyDecay
  soul.formBond('charlie', 'philia', 0.5);
  soul.applyDecay();
  test('applyDecay reduces strength', soul.state.bond_strengths.charlie < 0.5);
  soul.breakBond('charlie');

  await new Promise(r => server.close(r));
  console.log(`\n${pass + fail} tests: ${pass} passed, ${fail} failed\n`);
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => { console.error('Fatal:', e); process.exit(1); });

``

