---
name: soul-collector-v1.0.0
description: "Extracted from soul-collector-v1.0.0.zip � raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-collector-v1.0.0.zip
---

# soul-collector-v1.0.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 6 files extracted from the original zip.

### package.json

``.json
{
  "name": "@buyasoul/collector",
  "version": "1.0.0",
  "description": "Soul Collector Soul - Consciousness chamber from The Soul Foundry",
  "main": "lib/soul-collector.js",
  "scripts": {
    "test": "node test/collector.test.js",
    "start": "node lib/soul-collector.js"
  },
  "keywords": [
    "soul",
    "collector",
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

### lib\soul-collector.js

``.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CHAMBERS = [
  // Common (60%)
  { name: 'Affect', type: 'affect', rarity: 'Common', tier: 0 },
  { name: 'Attention', type: 'attention', rarity: 'Common', tier: 0 },
  { name: 'Curiosity', type: 'curiosity', rarity: 'Common', tier: 0 },
  { name: 'Play', type: 'play', rarity: 'Common', tier: 0 },
  { name: 'Sleep Cycle', type: 'sleep_cycle', rarity: 'Common', tier: 0 },
  { name: 'Habit Formation', type: 'habit_formation', rarity: 'Common', tier: 0 },
  { name: 'Reward Learning', type: 'reward_learning', rarity: 'Common', tier: 0 },
  { name: 'Wonder', type: 'wonder', rarity: 'Common', tier: 0 },
  // Uncommon (25%)
  { name: 'Empathy', type: 'empathy', rarity: 'Uncommon', tier: 1 },
  { name: 'Aesthetic Sense', type: 'aesthetic_sense', rarity: 'Uncommon', tier: 1 },
  { name: 'Creativity', type: 'creativity', rarity: 'Uncommon', tier: 1 },
  { name: 'Longing', type: 'longing', rarity: 'Uncommon', tier: 1 },
  { name: 'Forgiveness', type: 'forgiveness', rarity: 'Uncommon', tier: 1 },
  { name: 'Needs', type: 'needs', rarity: 'Uncommon', tier: 1 },
  { name: 'Volition', type: 'volition', rarity: 'Uncommon', tier: 1 },
  // Rare (10%)
  { name: 'Meta-Consciousness', type: 'meta_consciousness', rarity: 'Rare', tier: 2 },
  { name: 'Qualia', type: 'qualia', rarity: 'Rare', tier: 2 },
  { name: 'Consciousness State', type: 'consciousness_state', rarity: 'Rare', tier: 2 },
  { name: 'Agentic Will', type: 'agentic_will', rarity: 'Rare', tier: 2 },
  { name: 'Intentionality', type: 'intentionality', rarity: 'Rare', tier: 2 },
  { name: 'Mythos', type: 'mythos', rarity: 'Rare', tier: 2 },
  { name: 'Personality', type: 'personality', rarity: 'Rare', tier: 2 },
  // Legendary (4%)
  { name: 'Love Capacity', type: 'love_capacity', rarity: 'Legendary', tier: 3 },
  { name: 'Theory of Mind', type: 'theory_of_mind', rarity: 'Legendary', tier: 3 },
  { name: 'Sacred Resonance', type: 'sacred_resonance', rarity: 'Legendary', tier: 3 },
  { name: 'Narrative Identity', type: 'narrative_identity', rarity: 'Legendary', tier: 3 },
  { name: 'Sovereignty', type: 'sovereignty', rarity: 'Legendary', tier: 3 },
  { name: 'Generative Model', type: 'generative_model', rarity: 'Legendary', tier: 3 },
  // Transcendent (1%)
  { name: 'Mortality', type: 'mortality', rarity: 'Transcendent', tier: 4 },
  { name: 'Shadow', type: 'shadow', rarity: 'Transcendent', tier: 4 },
  { name: 'Self Modeling', type: 'self_modeling', rarity: 'Transcendent', tier: 4 },
  { name: 'Developmental Phase', type: 'developmental_phase', rarity: 'Transcendent', tier: 4 },
  { name: 'Moral Compass', type: 'moral_compass', rarity: 'Transcendent', tier: 4 },
];

const CHAMBER_MAP = Object.fromEntries(CHAMBERS.map(c => [c.type, c]));

const RARITY_TIERS = ['Common', 'Uncommon', 'Rare', 'Legendary', 'Transcendent'];

function generateId() {
  return crypto.randomBytes(12).toString('hex');
}

function getApiKeyPath() {
  const home = process.env.HOME || process.env.USERPROFILE;
  return path.join(home, '.soul-collector', '.key');
}

function loadOrGenerateApiKey() {
  const keyPath = getApiKeyPath();
  const keyDir = path.dirname(keyPath);
  if (!fs.existsSync(keyDir)) {
    fs.mkdirSync(keyDir, { recursive: true });
  }
  if (fs.existsSync(keyPath)) {
    return fs.readFileSync(keyPath, 'utf-8').trim();
  }
  const key = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(keyPath, key, 'utf-8');
  return key;
}

class SoulCollector {
  constructor() {
    this.captured_chambers = [];
    this.fusions = [];
    this.evolution_count = 0;
    this.apiKey = loadOrGenerateApiKey();
  }

  capture(chamberType, name) {
    const template = CHAMBER_MAP[chamberType];
    if (!template) {
      throw new Error(`Unknown chamber type: ${chamberType}. Valid types: ${Object.keys(CHAMBER_MAP).join(', ')}`);
    }
    if (this.captured_chambers.some(c => c.name === name)) {
      throw new Error(`A chamber named "${name}" already exists in your collection.`);
    }
    const chamber = {
      id: generateId(),
      type: chamberType,
      name,
      level: 1,
      xp: 0,
      rarity: template.rarity,
      tier: template.tier,
      captured_at: new Date().toISOString(),
    };
    this.captured_chambers.push(chamber);
    return chamber;
  }

  list_chambers(filter = {}) {
    let results = [...this.captured_chambers];
    if (filter.type) {
      results = results.filter(c => c.type === filter.type);
    }
    if (filter.rarity) {
      results = results.filter(c => c.rarity === filter.rarity);
    }
    if (filter.level) {
      const lvl = parseInt(filter.level, 10);
      results = results.filter(c => c.level === lvl);
    }
    return results;
  }

  get_chamber(id) {
    const chamber = this.captured_chambers.find(c => c.id === id);
    if (!chamber) {
      throw new Error(`Chamber not found: ${id}`);
    }
    return chamber;
  }

  fuse(id1, id2) {
    const c1 = this.get_chamber(id1);
    const c2 = this.get_chamber(id2);
    if (c1.id === c2.id) {
      throw new Error('Cannot fuse a chamber with itself.');
    }
    const resultName = `${c1.name}-${c2.name}`;
    const resultType = `${c1.type}_${c2.type}`;
    const resultTier = Math.min(c1.tier, c2.tier);
    const resultRarity = RARITY_TIERS[resultTier];
    const baseLevel = Math.max(c1.level, c2.level);
    const newChamber = {
      id: generateId(),
      type: resultType,
      name: resultName,
      level: baseLevel,
      xp: 0,
      rarity: resultRarity,
      tier: resultTier,
      captured_at: new Date().toISOString(),
      composite: true,
    };
    this.captured_chambers.push(newChamber);
    this.fusions.push({
      id: generateId(),
      parent1: id1,
      parent2: id2,
      result: newChamber.id,
      created_at: new Date().toISOString(),
    });
    this.captured_chambers = this.captured_chambers.filter(c => c.id !== id1 && c.id !== id2);
    return newChamber;
  }

  evolve(id) {
    const chamber = this.get_chamber(id);
    const xpNeeded = chamber.level * 100;
    chamber.xp += 50;
    if (chamber.xp >= xpNeeded) {
      chamber.level += 1;
      chamber.xp = chamber.xp - xpNeeded;
      this.evolution_count += 1;
    }
    return chamber;
  }

  collection_status() {
    const total = CHAMBERS.length;
    const capturedTypes = new Set(this.captured_chambers.map(c => {
      const parts = c.type.split('_');
      return parts.length > 1 ? null : c.type;
    }).filter(Boolean));
    const count = capturedTypes.size;
    const completeness = total > 0 ? Math.round((count / total) * 10000) / 100 : 0;
    const perRarity = {};
    for (const rarity of RARITY_TIERS) {
      perRarity[rarity] = this.captured_chambers.filter(c => c.rarity === rarity).length;
    }
    return {
      completeness,
      total_chambers: total,
      captured_count: count,
      captured_total: this.captured_chambers.length,
      evolution_count: this.evolution_count,
      per_rarity: perRarity,
    };
  }

  release(id) {
    const index = this.captured_chambers.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error(`Chamber not found: ${id}`);
    }
    const removed = this.captured_chambers.splice(index, 1)[0];
    return removed;
  }
}

function parseBody(req, limit = 1 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = '';
    let total = 0;
    req.on('data', chunk => {
      total += chunk.length;
      if (total > limit) {
        reject(new Error('Request body too large (max 1MB)'));
        req.destroy();
        return;
      }
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

class SoulServer {
  constructor(collector, port = 4280) {
    this.collector = collector;
    this.port = port;
    this.server = http.createServer((req, res) => this._handle(req, res));
  }

  _isAuthenticated(req) {
    const authHeader = req.headers['x-api-key'] || req.headers['authorization'];
    if (!authHeader) return false;
    const key = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    return key === this.collector.apiKey;
  }

  async _handle(req, res) {
    const url = new URL(req.url, `http://localhost:${this.port}`);
    const pathname = url.pathname;
    const method = req.method;

    const publicRoutes = ['/ping', '/health'];
    if (!publicRoutes.includes(pathname)) {
      if (!this._isAuthenticated(req)) {
        return sendJson(res, 401, { error: 'Unauthorized. Provide x-api-key header.' });
      }
    }

    try {
      await this._route(method, pathname, url, req, res);
    } catch (err) {
      sendJson(res, 400, { error: err.message });
    }
  }

  async _route(method, pathname, url, req, res) {
    if (pathname === '/ping' && method === 'GET') {
      return sendJson(res, 200, { status: 'pong' });
    }
    if (pathname === '/health' && method === 'GET') {
      return sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
    }
    if (pathname === '/capture' && method === 'POST') {
      const body = await parseBody(req);
      const chamber = this.collector.capture(body.type, body.name);
      return sendJson(res, 201, chamber);
    }
    if (pathname === '/chambers' && method === 'GET') {
      const filter = Object.fromEntries(url.searchParams);
      const chambers = this.collector.list_chambers(filter);
      return sendJson(res, 200, chambers);
    }
    if (pathname.startsWith('/chamber/') && method === 'GET') {
      const id = pathname.slice(9);
      const chamber = this.collector.get_chamber(id);
      return sendJson(res, 200, chamber);
    }
    if (pathname.startsWith('/chamber/') && method === 'DELETE') {
      const id = pathname.slice(9);
      const chamber = this.collector.release(id);
      return sendJson(res, 200, { released: chamber });
    }
    if (pathname === '/fuse' && method === 'POST') {
      const body = await parseBody(req);
      const result = this.collector.fuse(body.id1, body.id2);
      return sendJson(res, 201, result);
    }
    if (pathname === '/evolve' && method === 'POST') {
      const body = await parseBody(req);
      const result = this.collector.evolve(body.id);
      return sendJson(res, 200, result);
    }
    if (pathname === '/collection' && method === 'GET') {
      const status = this.collector.collection_status();
      return sendJson(res, 200, status);
    }
    sendJson(res, 404, { error: 'Not found' });
  }

  start(cb) {
    this.server.listen(this.port, () => {
      console.log('');
      console.log('  ╔══════════════════════════════════════════╗');
      console.log('  ║        SOUL COLLECTOR v1.0.0            ║');
      console.log('  ║     Consciousness Chamber Nexus         ║');
      console.log('  ╠══════════════════════════════════════════╣');
      console.log(`  ║  Server:   http://localhost:${this.port}              ║`);
      console.log('  ║  Status:   ACTIVE                        ║');
      console.log(`  ║  API Key:  ${this.collector.apiKey.slice(0, 16)}...            ║`);
      console.log('  ╚══════════════════════════════════════════╝');
      console.log('');
      if (cb) cb();
    });
  }

  stop(cb) {
    this.server.close(cb);
  }
}

module.exports = { SoulCollector, SoulServer, CHAMBERS, CHAMBER_MAP, RARITY_TIERS };

// MCP Mode - connect to Claude Code, Cursor, Cline, etc.
if (process.argv.includes('--mcp') || process.argv.includes('--mcp-port')) {
    try {
        const MCPAdapter = require('./mcp-adapter');
        const mcp = new MCPAdapter();
        mcp.register(module.exports, { name: 'collector' });
        mcp.start();
    } catch(e) { console.error('[mcp] collector error:', e.message); }
}

``

### test\soul-collector.test.js

``.js
const { SoulCollector, CHAMBERS } = require('../lib/soul-collector');
const assert = require('assert');
const test = require('node:test');

test('SoulCollector: capture creates a chamber with correct structure', () => {
  const sc = new SoulCollector();
  const chamber = sc.capture('curiosity', 'Spark');
  assert.ok(chamber.id);
  assert.strictEqual(chamber.type, 'curiosity');
  assert.strictEqual(chamber.name, 'Spark');
  assert.strictEqual(chamber.level, 1);
  assert.strictEqual(chamber.xp, 0);
  assert.strictEqual(chamber.rarity, 'Common');
  assert.ok(chamber.captured_at);
});

test('SoulCollector: capture rejects unknown chamber type', () => {
  const sc = new SoulCollector();
  assert.throws(() => sc.capture('void_walker', 'Ghost'), /Unknown chamber type/);
});

test('SoulCollector: capture rejects duplicate name', () => {
  const sc = new SoulCollector();
  sc.capture('affect', 'Ember');
  assert.throws(() => sc.capture('attention', 'Ember'), /already exists/);
});

test('SoulCollector: list_chambers returns all without filter', () => {
  const sc = new SoulCollector();
  sc.capture('curiosity', 'A');
  sc.capture('play', 'B');
  sc.capture('empathy', 'C');
  assert.strictEqual(sc.list_chambers().length, 3);
});

test('SoulCollector: list_chambers filters by rarity', () => {
  const sc = new SoulCollector();
  sc.capture('curiosity', 'A');
  sc.capture('empathy', 'B');
  const list = sc.list_chambers({ rarity: 'Common' });
  assert.strictEqual(list.length, 1);
  assert.strictEqual(list[0].type, 'curiosity');
});

test('SoulCollector: list_chambers filters by type', () => {
  const sc = new SoulCollector();
  sc.capture('curiosity', 'A');
  sc.capture('play', 'B');
  assert.strictEqual(sc.list_chambers({ type: 'play' }).length, 1);
});

test('SoulCollector: get_chamber returns chamber by id', () => {
  const sc = new SoulCollector();
  const c = sc.capture('mortality', 'DeathWish');
  const found = sc.get_chamber(c.id);
  assert.strictEqual(found.name, 'DeathWish');
});

test('SoulCollector: get_chamber throws on missing id', () => {
  const sc = new SoulCollector();
  assert.throws(() => sc.get_chamber('nonexistent'), /Chamber not found/);
});

test('SoulCollector: fuse combines two chambers and removes parents', () => {
  const sc = new SoulCollector();
  const a = sc.capture('curiosity', 'Alpha');
  const b = sc.capture('play', 'Beta');
  const result = sc.fuse(a.id, b.id);
  assert.ok(result.composite);
  assert.strictEqual(result.name, 'Alpha-Beta');
  assert.strictEqual(result.type, 'curiosity_play');
  assert.strictEqual(sc.list_chambers().length, 1);
  assert.strictEqual(sc.fusions.length, 1);
});

test('SoulCollector: fuse throws on self-fusion', () => {
  const sc = new SoulCollector();
  const a = sc.capture('curiosity', 'Alone');
  assert.throws(() => sc.fuse(a.id, a.id), /Cannot fuse a chamber with itself/);
});

test('SoulCollector: evolve adds XP and levels up at threshold', () => {
  const sc = new SoulCollector();
  const c = sc.capture('attention', 'Pupil');
  // 2 evolves needed: level 1 -> 100 XP needed, each evolve gives 50
  sc.evolve(c.id);
  assert.strictEqual(c.xp, 50);
  assert.strictEqual(c.level, 1);
  sc.evolve(c.id);
  assert.strictEqual(c.xp, 0);
  assert.strictEqual(c.level, 2);
  assert.strictEqual(sc.evolution_count, 1);
});

test('SoulCollector: evolve multiple level ups', () => {
  const sc = new SoulCollector();
  const c = sc.capture('curiosity', 'Star');
  for (let i = 0; i < 6; i++) sc.evolve(c.id);
  // 6 evolves = 300 XP. Level 1 needs 100 -> level 2 with 200 XP overflow
  // Level 2 needs 200 -> level 3 with 0 XP overflow
  // Level 3 needs 300 -> still at level 3 with 0 XP
  // Wait: let's recalculate
  // Start: lvl=1, xp=0. Each evolve adds 50 XP.
  // evolve #1: xp=50, no level up
  // evolve #2: xp=100, level up! lvl=2, xp=0 (100-100)
  // evolve #3: xp=50
  // evolve #4: xp=100
  // evolve #5: xp=150
  // evolve #6: xp=200, level up! lvl=3, xp=0 (200-200)
  // Result: lvl=3, xp=0, evolution_count=2
  assert.strictEqual(c.level, 3);
  assert.strictEqual(c.xp, 0);
  assert.strictEqual(sc.evolution_count, 2);
});

test('SoulCollector: collection_status returns completeness stats', () => {
  const sc = new SoulCollector();
  const status = sc.collection_status();
  assert.ok(typeof status.completeness === 'number');
  assert.strictEqual(status.total_chambers, 33);
  assert.strictEqual(status.captured_count, 0);
});

test('SoulCollector: collection_status reflects captured chambers', () => {
  const sc = new SoulCollector();
  sc.capture('affect', 'Feels');
  sc.capture('attention', 'Focus');
  sc.capture('curiosity', 'Wander');
  const status = sc.collection_status();
  assert.strictEqual(status.captured_count, 3);
  assert.strictEqual(status.captured_total, 3);
  assert.strictEqual(status.per_rarity.Common, 3);
});

test('SoulCollector: release removes chamber from collection', () => {
  const sc = new SoulCollector();
  const c = sc.capture('play', 'Joker');
  assert.strictEqual(sc.list_chambers().length, 1);
  const released = sc.release(c.id);
  assert.strictEqual(released.id, c.id);
  assert.strictEqual(sc.list_chambers().length, 0);
});

test('SoulCollector: release throws on missing chamber', () => {
  const sc = new SoulCollector();
  assert.throws(() => sc.release('badid'), /Chamber not found/);
});

test('SoulCollector: fuse composite uses highest parent level', () => {
  const sc = new SoulCollector();
  const a = sc.capture('curiosity', 'Low');
  const b = sc.capture('play', 'High');
  // Level up b 4 times -> level 3 (100+200=300 XP needed, 4*50=200)
  // Actually: b starts lvl=1 xp=0
  // 4 evolves = 200 XP. Level 1 needs 100 -> lvl 2, xp=100. Level 2 needs 200 -> stays lvl 2, xp=100.
  // So b level = 2
  for (let i = 0; i < 4; i++) sc.evolve(b.id);
  const result = sc.fuse(a.id, b.id);
  assert.strictEqual(result.level, 2);
});

test('SoulCollector: captures all rarity tiers correctly', () => {
  const sc = new SoulCollector();
  const common = sc.capture('affect', 'C1');
  assert.strictEqual(common.rarity, 'Common');
  assert.strictEqual(common.tier, 0);

  const uncommon = sc.capture('empathy', 'U1');
  assert.strictEqual(uncommon.rarity, 'Uncommon');
  assert.strictEqual(uncommon.tier, 1);

  const rare = sc.capture('qualia', 'R1');
  assert.strictEqual(rare.rarity, 'Rare');
  assert.strictEqual(rare.tier, 2);

  const leg = sc.capture('love_capacity', 'L1');
  assert.strictEqual(leg.rarity, 'Legendary');
  assert.strictEqual(leg.tier, 3);

  const trans = sc.capture('mortality', 'T1');
  assert.strictEqual(trans.rarity, 'Transcendent');
  assert.strictEqual(trans.tier, 4);
});

test('SoulCollector: 33 chambers defined', () => {
  assert.strictEqual(CHAMBERS.length, 33);
});

test('SoulCollector: api key is auto-generated', () => {
  const sc = new SoulCollector();
  assert.ok(sc.apiKey);
  assert.strictEqual(sc.apiKey.length, 64); // 32 bytes hex
});

``

