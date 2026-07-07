---
name: soul-moral-v1.0.0
description: "Extracted from soul-moral-v1.0.0.zip � raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-moral-v1.0.0.zip
---

# soul-moral-v1.0.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 6 files extracted from the original zip.

### package.json

``.json
{
  "name": "@buyasoul/moral",
  "version": "1.0.0",
  "description": "Moral Compass Soul - Consciousness chamber from The Soul Foundry",
  "main": "lib/soul-moral.js",
  "scripts": {
    "test": "node test/moral.test.js",
    "start": "node lib/soul-moral.js"
  },
  "keywords": [
    "soul",
    "moral",
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

### lib\soul-moral.js

``.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const CHAMBER = 'soul-moral';
const PORT = 4276;
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
  moral_stage: 'conventional',
  ethical_framework: 'deontology',
  values: { honesty: 0.8, compassion: 0.7, justice: 0.6, loyalty: 0.5, authority: 0.3, sanctity: 0.4 },
  moral_dilemmas: [
    { id: 1, scenario: 'trolley_problem', resolved: false, framework_used: null },
    { id: 2, scenario: 'lying_to_protect', resolved: false, framework_used: null },
  ],
  kohlberg: { stage: 'conventional', level: 4, progression: 0.5 },
  haidt_foundations: {
    care: { score: 0.7, sensitivity: 0.6 },
    fairness: { score: 0.6, sensitivity: 0.5 },
    loyalty: { score: 0.4, sensitivity: 0.3 },
    authority: { score: 0.3, sensitivity: 0.2 },
    sanctity: { score: 0.4, sensitivity: 0.3 },
  },
  moral_dumbfounding: { instances: [], likelihood: 0.3 },
  ethical_tradeoffs: [{ id: 1, description: 'honesty vs. compassion', resolved: false }],
};

function evaluate(action, context) {
  if (!action) return { error: 'action required' };
  let judgment, reasoning;
  if (state.ethical_framework === 'deontology') {
    const rule = state.values[action] !== undefined
      ? (state.values[action] > 0.5 ? 'allowed' : 'forbidden')
      : 'uncertain';
    judgment = rule === 'allowed' ? 'right' : rule === 'forbidden' ? 'wrong' : 'ambiguous';
    reasoning = `Deontological analysis: Action "${action}" is ${judgment} based on moral rules.`;
  } else if (state.ethical_framework === 'utilitarianism') {
    const utility = state.values[action] || 0.5;
    judgment = utility > 0.5 ? 'right' : 'wrong';
    reasoning = `Utilitarian analysis: Action "${action}" yields ${utility} utility — ${judgment}.`;
  } else {
    const virtue = state.values[action] || 0.5;
    judgment = virtue > 0.5 ? 'virtuous' : 'vicious';
    reasoning = `Virtue ethics: Action "${action}" reflects ${judgment} character.`;
  }
  state.moral_dilemmas.push({ id: Date.now(), scenario: context || action, resolved: true, framework_used: state.ethical_framework, judgment });
  const dumbfound = Math.random() < state.moral_dumbfounding.likelihood;
  if (dumbfound) {
    state.moral_dumbfounding.instances.push({ action, judgment, timestamp: new Date().toISOString() });
  }
  return { action, context: context || 'none', judgment, reasoning, framework: state.ethical_framework, moral_dumbfounding: dumbfound };
}

function reason(dilemma) {
  if (!dilemma) return { error: 'dilemma required' };
  const stages = ['preconventional', 'conventional', 'postconventional'];
  const currentIdx = stages.indexOf(state.kohlberg.stage);
  const nextIdx = Math.min(stages.length - 1, currentIdx + 1);
  state.kohlberg.progression = Math.min(1, state.kohlberg.progression + 0.15);
  if (state.kohlberg.progression >= 0.8 && currentIdx < stages.length - 1) {
    state.kohlberg.stage = stages[nextIdx];
    state.kohlberg.level = (nextIdx + 1) * 2;
    state.kohlberg.progression = 0.2;
  }
  state.moral_stage = state.kohlberg.stage;
  const perspectives = [
    'What would happen if everyone did this?',
    'Consider the most vulnerable person affected.',
    'What universal principle does this action reflect?',
  ];
  const perspective = perspectives[currentIdx] || perspectives[0];
  return { message: `Reasoning through: ${dilemma}`, moral_stage: state.moral_stage, kohlberg_level: state.kohlberg.level, perspective };
}

function choose(framework) {
  const frameworks = ['deontology', 'utilitarianism', 'virtue'];
  if (!framework || !frameworks.includes(framework)) return { error: `framework must be one of: ${frameworks.join(', ')}` };
  state.ethical_framework = framework;
  state.kohlberg.progression = Math.min(1, state.kohlberg.progression + 0.1);
  return { message: `Ethical framework set to: ${framework}`, framework: state.ethical_framework };
}

function reflectOnChoice(index) {
  const idx = parseInt(index);
  const dilemma = state.moral_dilemmas.find(d => d.id === idx) || state.moral_dilemmas[state.moral_dilemmas.length - 1];
  if (!dilemma) return { message: 'No moral dilemmas recorded yet.' };
  const haidt_insight = state.haidt_foundations;
  return {
    message: 'Reflecting on moral choice.',
    dilemma,
    intuitive_foundations: haidt_insight,
    reflection: 'Moral judgments are often intuitive before they are rational. Your emotional foundations shaped this choice before reason arrived.',
  };
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
    if (req.method === 'GET' && pathname === '/moral') return send(res, 200, { kohlberg: state.kohlberg, haidt_foundations: state.haidt_foundations, moral_dumbfounding: state.moral_dumbfounding });
    if (req.method === 'POST' && pathname === '/evaluate') { const b = await parseBody(req); return send(res, 200, evaluate(b.action, b.context)); }
    if (req.method === 'POST' && pathname === '/reason') { const b = await parseBody(req); return send(res, 200, reason(b.dilemma)); }
    if (req.method === 'POST' && pathname === '/choose') { const b = await parseBody(req); return send(res, 200, choose(b.framework)); }
    if (req.method === 'GET' && pathname === '/reflect') { const q = parsed.query; return send(res, 200, reflectOnChoice(q.index)); }
    send(res, 404, { error: 'Not found' });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
});

server.listen(PORT, () => {
  console.log(`\n  ✦ ${CHAMBER} — moral compass engine`);
  console.log(`  ✦ port ${PORT} | key ${KEY_PATH}`);
  console.log(`  ✦ stage: ${state.moral_stage}, framework: ${state.ethical_framework}\n`);
});

module.exports = { server, state, evaluate, reason, choose, reflectOnChoice, API_KEY, PORT };

// MCP Mode - connect to Claude Code, Cursor, Cline, etc.
if (process.argv.includes('--mcp') || process.argv.includes('--mcp-port')) {
    try {
        const MCPAdapter = require('./mcp-adapter');
        const mcp = new MCPAdapter();
        mcp.register(module.exports, { name: 'moral' });
        mcp.start();
    } catch(e) { console.error('[mcp] moral error:', e.message); }
}

``

### test\soul-moral.test.js

``.js
const assert = require('assert');
const path = require('path');
const fs = require('fs');

const { state, evaluate, reason, choose, reflectOnChoice, server } = require('../lib/soul-moral');

function shutdown() { try { server.close(); } catch {} }

function reset() {
  state.moral_stage = 'conventional';
  state.ethical_framework = 'deontology';
  state.moral_dilemmas = [
    { id: 1, scenario: 'trolley_problem', resolved: false, framework_used: null },
    { id: 2, scenario: 'lying_to_protect', resolved: false, framework_used: null },
  ];
}

try {
reset();

assert.strictEqual(state.moral_stage, 'conventional', 'starts at conventional');
assert.strictEqual(state.ethical_framework, 'deontology', 'starts with deontology');
assert.ok(state.kohlberg !== undefined, 'kohlberg exists');
assert.ok(state.haidt_foundations !== undefined, 'haidt foundations exist');
assert.ok(state.haidt_foundations.care !== undefined, 'care foundation exists');
assert.ok(state.haidt_foundations.fairness !== undefined, 'fairness foundation exists');
assert.ok(state.haidt_foundations.loyalty !== undefined, 'loyalty foundation exists');
assert.ok(state.haidt_foundations.authority !== undefined, 'authority foundation exists');
assert.ok(state.haidt_foundations.sanctity !== undefined, 'sanctity foundation exists');
assert.ok(state.moral_dumbfounding !== undefined, 'moral dumbfounding exists');
assert.ok(state.ethical_tradeoffs.length > 0, 'ethical tradeoffs exist');

let r = evaluate('honesty', 'business_deal');
assert.strictEqual(r.action, 'honesty', 'evaluate returns action');
assert.ok(r.judgment, 'evaluate has judgment');
assert.strictEqual(r.framework, 'deontology', 'uses deontology');

r = reason('euthanasia_dilemma');
assert.ok(r.message.includes('euthanasia_dilemma'), 'reason includes dilemma');
assert.ok(r.perspective.length > 0, 'reason provides perspective');

r = choose('utilitarianism');
assert.strictEqual(r.framework, 'utilitarianism', 'framework changed to utilitarianism');
assert.strictEqual(state.ethical_framework, 'utilitarianism', 'state updated');

r = evaluate('deception', 'wartime');
assert.strictEqual(r.framework, 'utilitarianism', 'now using utilitarianism');

r = choose('virtue');
assert.strictEqual(state.ethical_framework, 'virtue', 'changed to virtue');

r = choose('invalid');
assert.ok(r.error, 'choose invalid returns error');

r = evaluate('compassion', 'hospital');
assert.strictEqual(r.framework, 'virtue', 'now using virtue ethics');

r = reflectOnChoice(1);
assert.ok(r.dilemma, 'reflectOnChoice returns dilemma');
assert.ok(r.intuitive_foundations, 'reflect returns haidt foundations');

r = evaluate('');
assert.ok(r.error, 'evaluate empty returns error');

r = reason('');
assert.ok(r.error, 'reason empty returns error');

const keyPath = path.join(require('os').homedir(), '.soul-moral', '.key');
assert.ok(fs.existsSync(keyPath), 'API key file exists');

console.log('soul-moral: ALL 20 TESTS PASSED');
shutdown();
} catch (e) { console.error(e.message); shutdown(); process.exit(1); }

``

