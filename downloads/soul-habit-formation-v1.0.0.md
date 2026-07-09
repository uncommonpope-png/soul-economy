---
name: soul-habit-formation-v1.0.0
description: "Extracted from soul-habit-formation-v1.0.0.zip — raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-habit-formation-v1.0.0.zip
---

# soul-habit-formation-v1.0.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 6 files extracted from the original zip.

### package.json

``.json
{
  "name": "@buyasoul/habit-formation",
  "version": "1.0.0",
  "description": "Habit Formation Soul - Consciousness chamber from The Soul Foundry",
  "main": "lib/soul-HABIT-FORMATION.js",
  "scripts": {
    "test": "node test/habit-formation.test.js",
    "start": "node lib/soul-HABIT-FORMATION.js"
  },
  "keywords": [
    "soul",
    "habit-formation",
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

### lib\soul-HABIT-FORMATION.js

``.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const CHAMBER = 'HABIT-FORMATION';
const PORT = 4267;
const DATA_DIR = path.join(os.homedir(), '.soul-HABIT-FORMATION');
const KEY_FILE = path.join(DATA_DIR, '.key');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
let API_KEY;
try { API_KEY = fs.readFileSync(KEY_FILE, 'utf8').trim(); } catch { API_KEY = crypto.randomBytes(32).toString('hex'); fs.writeFileSync(KEY_FILE, API_KEY); }

const state = {
  habits: {},
  cue_loop_strength: 0.3,
  automaticity: 0.2,
  habit_count: 0,
  streaks: {},
  day_rule_tracking: { day21: false, day66: false },
  keystone_habits: [],
  habit_stacks: [],
  created: new Date().toISOString()
};

function createHabit(name, cue, routine) {
  if (!name || !cue || !routine) return { error: 'name, cue, and routine required' };
  if (state.habits[name]) return { error: 'Habit already exists' };
  state.habits[name] = {
    name, cue, routine,
    strength: 0.1,
    streak: 0,
    executions: 0,
    created: new Date().toISOString(),
    last_executed: null,
    is_keystone: false,
    stacked_with: null
  };
  state.habit_count = Object.keys(state.habits).length;
  state.cue_loop_strength = Math.min(1, state.cue_loop_strength + 0.02);
  return { habit: state.habits[name], cue_loop_strength: state.cue_loop_strength, habit_count: state.habit_count };
}

function execute(name) {
  if (!name) return { error: 'name required' };
  const habit = state.habits[name];
  if (!habit) return { error: 'Habit not found' };
  habit.executions++;
  habit.last_executed = new Date().toISOString();
  const now = new Date();
  const last = habit.last_executed ? new Date(habit.last_executed) : null;
  if (last) {
    const daysDiff = Math.floor((now - last) / 86400000);
    if (daysDiff <= 1) habit.streak++;
    else habit.streak = 1;
  } else {
    habit.streak = 1;
  }
  state.streaks[name] = habit.streak;
  habit.strength = Math.min(1, habit.strength + 0.05);
  state.cue_loop_strength = Math.min(1, state.cue_loop_strength + 0.01);
  state.automaticity = Math.min(1, state.automaticity + 0.01);
  if (habit.streak >= 21) state.day_rule_tracking.day21 = true;
  if (habit.streak >= 66) state.day_rule_tracking.day66 = true;
  return { habit: { name, strength: habit.strength, streak: habit.streak, executions: habit.executions }, automaticity: state.automaticity };
}

function trackStreak(name) {
  if (!name) return { error: 'name required' };
  const habit = state.habits[name];
  if (!habit) return { error: 'Habit not found' };
  state.streaks[name] = habit.streak;
  const milestones = [];
  if (habit.streak >= 21) milestones.push('21_day_rule');
  if (habit.streak >= 66) milestones.push('66_day_rule');
  return { name, streak: habit.streak, milestones, day21_reached: state.day_rule_tracking.day21, day66_reached: state.day_rule_tracking.day66 };
}

function breakHabit(name) {
  if (!name) return { error: 'name required' };
  if (!state.habits[name]) return { error: 'Habit not found' };
  const removed = state.habits[name];
  delete state.habits[name];
  delete state.streaks[name];
  state.habit_count = Object.keys(state.habits).length;
  state.automaticity = Math.max(0, state.automaticity - 0.05);
  state.cue_loop_strength = Math.max(0, state.cue_loop_strength - 0.03);
  return { removed: removed.name, habit_count: state.habit_count, automaticity: state.automaticity };
}

function reportHabits() {
  return {
    habits: state.habits,
    cue_loop_strength: state.cue_loop_strength,
    automaticity: state.automaticity,
    habit_count: state.habit_count,
    streaks: state.streaks,
    day_rule_tracking: state.day_rule_tracking,
    keystone_habits: state.keystone_habits,
    habit_stacks: state.habit_stacks
  };
}

function stackHabits(anchor, newHabit) {
  if (!anchor || !newHabit) return { error: 'anchor and newHabit required' };
  if (!state.habits[anchor]) return { error: 'Anchor habit not found' };
  if (!state.habits[newHabit]) return { error: 'New habit not found' };
  state.habit_stacks.push({ anchor, newHabit, timestamp: new Date().toISOString() });
  state.habits[newHabit].stacked_with = anchor;
  state.cue_loop_strength = Math.min(1, state.cue_loop_strength + 0.05);
  return { stack: { anchor, newHabit }, cue_loop_strength: state.cue_loop_strength };
}

function markKeystone(name) {
  if (!name) return { error: 'name required' };
  if (!state.habits[name]) return { error: 'Habit not found' };
  state.habits[name].is_keystone = true;
  if (!state.keystone_habits.includes(name)) state.keystone_habits.push(name);
  return { name, is_keystone: true, keystone_count: state.keystone_habits.length };
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
  if (method === 'GET' && pathname === '/habits') return send(res, 200, reportHabits());

  if (method === 'POST') {
    let body;
    try { body = await parseBody(req); } catch (e) { return send(res, 400, { error: e.message }); }
    if (pathname === '/create-habit') { if (!body.name || !body.cue || !body.routine) return send(res, 400, { error: 'name, cue, and routine required' }); return send(res, 200, createHabit(body.name, body.cue, body.routine)); }
    if (pathname === '/execute') { if (!body.name) return send(res, 400, { error: 'name required' }); return send(res, 200, execute(body.name)); }
    if (pathname === '/track-streak') { if (!body.name) return send(res, 400, { error: 'name required' }); return send(res, 200, trackStreak(body.name)); }
    if (pathname === '/break') { if (!body.name) return send(res, 400, { error: 'name required' }); return send(res, 200, breakHabit(body.name)); }
    if (pathname === '/stack') { if (!body.anchor || !body.newHabit) return send(res, 400, { error: 'anchor and newHabit required' }); return send(res, 200, stackHabits(body.anchor, body.newHabit)); }
    if (pathname === '/mark-keystone') { if (!body.name) return send(res, 400, { error: 'name required' }); return send(res, 200, markKeystone(body.name)); }
  }

  send(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`\n\x1b[36m\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557`);
  console.log(`\u2551     HABIT FORMATION`);
  console.log(`\u2551     Port: ${PORT}`);
  console.log(`\u2551     PID:  ${process.pid}`);
  console.log(`\u2551     Key:  ${API_KEY.substring(0, 16)}...`);
  console.log(`\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d\x1b[0m`);
});

module.exports = { server, state, createHabit, execute, trackStreak, breakHabit, reportHabits, stackHabits, markKeystone, API_KEY };

// MCP Mode - connect to Claude Code, Cursor, Cline, etc.
if (process.argv.includes('--mcp') || process.argv.includes('--mcp-port')) {
    try {
        const MCPAdapter = require('./mcp-adapter');
        const mcp = new MCPAdapter();
        mcp.register(module.exports, { name: 'HABIT-FORMATION' });
        mcp.start();
    } catch(e) { console.error('[mcp] HABIT-FORMATION error:', e.message); }
}

``

### test\soul-HABIT-FORMATION.test.js

``.js
const http = require('http');
const assert = require('assert');
const { createHabit, execute, trackStreak, breakHabit, reportHabits, stackHabits, markKeystone, state, API_KEY } = require('../lib/soul-HABIT-FORMATION');

let testsRun = 0;
let testsPassed = 0;

function test(name, fn) {
  testsRun++;
  try { fn(); testsPassed++; console.log(`  \u2713 ${name}`); }
  catch (e) { console.log(`  \u2717 ${name}: ${e.message}`); }
}

function resetState() {
  state.habits = {};
  state.cue_loop_strength = 0.3;
  state.automaticity = 0.2;
  state.habit_count = 0;
  state.streaks = {};
  state.day_rule_tracking = { day21: false, day66: false };
  state.keystone_habits = [];
  state.habit_stacks = [];
}

function httpRequest(method, path, body, key) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port: 4267, path, method, headers: { 'Content-Type': 'application/json' } };
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

console.log('\n  HABIT-FORMATION Chamber Tests\n');

test('createHabit requires name, cue, and routine', () => {
  resetState();
  assert(createHabit().error);
  assert(createHabit('name').error);
  assert(createHabit('name', 'cue').error);
  assert(!createHabit('name', 'cue', 'routine').error);
});

test('createHabit adds habit to state', () => {
  resetState();
  createHabit('morning_walk', 'alarm', 'walk 10 min');
  assert(state.habits['morning_walk']);
  assert.strictEqual(state.habits['morning_walk'].cue, 'alarm');
  assert.strictEqual(state.habits['morning_walk'].routine, 'walk 10 min');
});

test('createHabit increments habit_count', () => {
  resetState();
  createHabit('h1', 'c1', 'r1');
  assert.strictEqual(state.habit_count, 1);
});

test('createHabit prevents duplicate names', () => {
  resetState();
  createHabit('unique', 'cue', 'routine');
  const result = createHabit('unique', 'cue2', 'routine2');
  assert(result.error);
});

test('createHabit increases cue_loop_strength', () => {
  resetState();
  const before = state.cue_loop_strength;
  createHabit('new_h', 'cue', 'routine');
  assert(state.cue_loop_strength > before);
});

test('execute requires name', () => {
  resetState();
  const result = execute();
  assert(result.error);
});

test('execute errors for non-existent habit', () => {
  resetState();
  const result = execute('nonexistent');
  assert(result.error);
});

test('execute increases strength and streak', () => {
  resetState();
  createHabit('read', 'bedtime', 'read 20 pages');
  const result = execute('read');
  assert(result.habit.strength > 0.1);
  assert(result.habit.streak >= 1);
  assert(result.habit.executions >= 1);
});

test('execute increases automaticity', () => {
  resetState();
  const before = state.automaticity;
  createHabit('code_daily', 'morning', 'write code');
  execute('code_daily');
  assert(state.automaticity > before);
});

test('trackStreak returns milestone info', () => {
  resetState();
  createHabit('exercise', '6am', 'workout');
  execute('exercise');
  const result = trackStreak('exercise');
  assert.strictEqual(result.name, 'exercise');
  assert(result.streak >= 1);
});

test('breakHabit removes habit', () => {
  resetState();
  createHabit('bad_habit', 'trigger', 'action');
  const result = breakHabit('bad_habit');
  assert(!state.habits['bad_habit']);
  assert.strictEqual(result.habit_count, 0);
});

test('breakHabit reduces automaticity', () => {
  resetState();
  createHabit('temp', 'x', 'y');
  state.automaticity = 0.5;
  breakHabit('temp');
  assert(state.automaticity < 0.5);
});

test('stackHabits links two habits', () => {
  resetState();
  createHabit('anchor_h', 'cue', 'routine');
  createHabit('new_h', 'cue2', 'routine2');
  const result = stackHabits('anchor_h', 'new_h');
  assert(result.stack.anchor === 'anchor_h');
  assert(state.habit_stacks.length === 1);
});

test('markKeystone sets habit as keystone', () => {
  resetState();
  createHabit('key_h', 'cue', 'routine');
  const result = markKeystone('key_h');
  assert(result.is_keystone);
  assert(state.keystone_habits.includes('key_h'));
});

test('reportHabits returns full habit state', () => {
  resetState();
  createHabit('h1', 'c', 'r');
  const rep = reportHabits();
  assert(rep.habit_count === 1);
  assert(rep.automaticity !== undefined);
  assert(rep.cue_loop_strength !== undefined);
});

console.log(`\n  Results: ${testsPassed}/${testsRun} passed\n`);
process.exit(testsPassed === testsRun ? 0 : 1);

``

