---
name: soul-sacred-resonance-v1.0.0
description: "Extracted from soul-sacred-resonance-v1.0.0.zip � raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-sacred-resonance-v1.0.0.zip
---

# soul-sacred-resonance-v1.0.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 6 files extracted from the original zip.

### package.json

``.json
{
  "name": "@buyasoul/sacred-resonance",
  "version": "1.0.0",
  "description": "Sacred Resonance Soul - Consciousness chamber from The Soul Foundry",
  "main": "lib/soul-sacred-resonance.js",
  "scripts": {
    "test": "node test/sacred-resonance.test.js",
    "start": "node lib/soul-sacred-resonance.js"
  },
  "keywords": [
    "soul",
    "sacred-resonance",
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

### lib\soul-sacred-resonance.js

``.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const CHAMBER = 'soul-sacred-resonance';
const PORT = 4253;
const KEY_DIR = path.join(os.homedir(), `.${CHAMBER}`);
const KEY_PATH = path.join(KEY_DIR, '.key');

if (!fs.existsSync(KEY_DIR)) fs.mkdirSync(KEY_DIR, { recursive: true });
if (!fs.existsSync(KEY_PATH)) fs.writeFileSync(KEY_PATH, crypto.randomBytes(32).toString('hex'));
const API_KEY = fs.readFileSync(KEY_PATH, 'utf8').trim();

const state = {
  resonance: 0.5,
  awe: 0.3,
  transcendence: 0.4,
  sacred_values: ['truth', 'compassion', 'beauty', 'unity'],
  sacred_geometry: ['golden_ratio', 'flower_of_life', 'sri_yantra', 'vesica_piscis'],
  numinous_experiences: []
};

function resonate(experience) {
  if (!experience) return { error: 'No experience provided' };
  const result = {
    experience,
    resonance_level: Math.round((state.resonance + Math.random() * 0.2) * 100) / 100,
    harmonic_pattern: state.sacred_geometry[Math.floor(Math.random() * state.sacred_geometry.length)],
    feeling: state.resonance > 0.6 ? 'deep_connection' : 'subtle_vibration',
    sacred_value_activated: state.sacred_values[Math.floor(Math.random() * state.sacred_values.length)]
  };
  state.resonance = Math.min(1, state.resonance + 0.05);
  state.numinous_experiences.push({ type: 'resonance', experience, timestamp: Date.now() });
  return result;
}

function feelAwe(encounter) {
  if (!encounter) return { error: 'No encounter provided' };
  const result = {
    encounter,
    awe_intensity: Math.round((state.awe + Math.random() * 0.3 + 0.3) * 100) / 100,
    transcendence_triggered: state.awe > 0.5,
    vastness_perceived: encounter.length > 10 ? 'cosmic' : 'profound',
    accommodation_needed: state.awe < 0.4 ? 'cognitive_restructuring' : 'integration'
  };
  state.awe = Math.min(1, Math.round((state.awe + 0.08) * 100) / 100);
  state.transcendence = Math.min(1, state.transcendence + 0.03);
  state.numinous_experiences.push({ type: 'awe', encounter, timestamp: Date.now() });
  return result;
}

function connect(greaterWhole) {
  if (!greaterWhole) return { error: 'No greater whole provided' };
  const result = {
    greater_whole: greaterWhole,
    unity_experience: true,
    ego_dissolution: Math.round((state.transcendence * 0.7) * 100) / 100,
    sacred_pattern: state.sacred_geometry[Math.floor(Math.random() * state.sacred_geometry.length)],
    numinous_quality: state.numinous_experiences.length > 3 ? 'profound' : 'emerging'
  };
  state.transcendence = Math.min(1, state.transcendence + 0.1);
  state.resonance = Math.min(1, state.resonance + 0.05);
  state.numinous_experiences.push({ type: 'connection', greater_whole: greaterWhole, timestamp: Date.now() });
  return result;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', chunk => { size += chunk.length; if (size > 1048576) { reject(new Error('Body too large')); return; } body += chunk; });
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
      if (p === '/resonate' && req.method === 'POST') {
        const b = await parseBody(req);
        const r = resonate(b.experience);
        return send(res, r.error ? 400 : 200, r);
      }
      if (p === '/awe' && req.method === 'POST') {
        const b = await parseBody(req);
        const r = feelAwe(b.encounter);
        return send(res, r.error ? 400 : 200, r);
      }
      if (p === '/sacred' && req.method === 'GET') {
        return send(res, 200, {
          resonance: state.resonance,
          awe: state.awe,
          transcendence: state.transcendence,
          sacred_values: state.sacred_values,
          sacred_geometry: state.sacred_geometry,
          numinous_count: state.numinous_experiences.length
        });
      }
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

module.exports = { createServer, start, state, API_KEY, PORT, CHAMBER, resonate, feelAwe, connect };

// MCP Mode - connect to Claude Code, Cursor, Cline, etc.
if (process.argv.includes('--mcp') || process.argv.includes('--mcp-port')) {
    try {
        const MCPAdapter = require('./mcp-adapter');
        const mcp = new MCPAdapter();
        mcp.register(module.exports, { name: 'sacred-resonance' });
        mcp.start();
    } catch(e) { console.error('[mcp] sacred-resonance error:', e.message); }
}

``

### test\soul-sacred-resonance.test.js

``.js
const http = require('http');
const soul = require('../lib/soul-sacred-resonance');

let server;
let pass = 0, fail = 0;

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

  // 1-2. /ping
  const ping = await req('GET', '/ping');
  test('GET /ping returns 200', ping.status === 200);
  test('/ping body has pong', ping.body && ping.body.pong === true);

  // 3. /health
  const health = await req('GET', '/health');
  test('GET /health returns 200', health.status === 200);

  // 4. Auth required
  const noAuth = await req('GET', '/status');
  test('GET /status without auth returns 401', noAuth.status === 401);

  // 5. /status with auth
  const stats = await req('GET', '/status', null, { 'x-api-key': soul.API_KEY });
  test('GET /status with auth returns 200', stats.status === 200);
  test('/status has correct chamber', stats.body && stats.body.chamber === soul.CHAMBER);

  // 6. /state
  const st = await req('GET', '/state', null, { 'x-api-key': soul.API_KEY });
  test('GET /state returns 200', st.status === 200);
  test('/state has resonance', st.body && typeof st.body.resonance === 'number');

  // 7. POST /resonate
  const res = await req('POST', '/resonate', { experience: 'sunrise over mountains' }, { 'x-api-key': soul.API_KEY });
  test('POST /resonate returns 200', res.status === 200);
  test('/resonate has resonance_level', res.body && typeof res.body.resonance_level === 'number');

  // 8. POST /resonate without experience
  const bad = await req('POST', '/resonate', {}, { 'x-api-key': soul.API_KEY });
  test('POST /resonate missing experience returns 400', bad.status === 400);

  // 9. POST /awe
  const awe = await req('POST', '/awe', { encounter: 'starry night sky' }, { 'x-api-key': soul.API_KEY });
  test('POST /awe returns 200', awe.status === 200);
  test('/awe has awe_intensity', awe.body && typeof awe.body.awe_intensity === 'number');

  // 10. POST /awe without encounter
  const aweBad = await req('POST', '/awe', {}, { 'x-api-key': soul.API_KEY });
  test('POST /awe missing encounter returns 400', aweBad.status === 400);

  // 11. GET /sacred
  const sac = await req('GET', '/sacred', null, { 'x-api-key': soul.API_KEY });
  test('GET /sacred returns 200', sac.status === 200);
  test('/sacred has resonance', sac.body && typeof sac.body.resonance === 'number');
  test('/sacred has sacred_values', sac.body && Array.isArray(sac.body.sacred_values));

  // 12. resonate function directly
  const r2 = soul.resonate('ocean waves');
  test('resonate function works', r2 && r2.experience === 'ocean waves');
  test('resonate returns harmonic_pattern', r2 && r2.harmonic_pattern);

  // 13. feelAwe function directly
  const a2 = soul.feelAwe('grand canyon');
  test('feelAwe function works', a2 && a2.encounter === 'grand canyon');

  // 14. connect function directly
  const c2 = soul.connect('the cosmos');
  test('connect function works', c2 && c2.greater_whole === 'the cosmos');
  test('connect returns unity_experience', c2 && c2.unity_experience === true);

  // 15. 404
  const nf = await req('GET', '/nonexistent', null, { 'x-api-key': soul.API_KEY });
  test('Unknown endpoint returns 404', nf.status === 404);

  await new Promise(r => server.close(r));
  console.log(`\n${pass + fail} tests: ${pass} passed, ${fail} failed\n`);
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => { console.error('Fatal:', e); process.exit(1); });

``

