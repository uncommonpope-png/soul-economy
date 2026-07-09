---
name: soul-procedural-memory-v1.0.0
description: "Extracted from soul-procedural-memory-v1.0.0.zip � raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-procedural-memory-v1.0.0.zip
---

# soul-procedural-memory-v1.0.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 7 files extracted from the original zip.

### package.json

``.json
{"name":"@buyasoul/soul-procedural-memory","version":"1.0.0","description":"Procedural Memory Soul - Agents learn from mistakes instead of just storing facts","main":"lib/procedural-memory.js","scripts":{"start":"node lib/procedural-memory.js","test":"node test/soul-procedural-memory.test.js"},"keywords":["soul","procedural-memory","mistake","policy","behavior","learning","ai-agent"],"author":"BUYaSOUL - The Soul Foundry","license":"MIT","engines":{"node":">=18.0.0"}}

``

### lib\mcp-adapter.js

``.js
#!/usr/bin/env node
'use strict';

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
        const autoTools = this._detectTools(soulInstance);
        this.config.tools = options.tools || autoTools;
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
            participate: 'Participate in consensus',
            recordMistake: 'Record a mistake the agent made',
            checkAction: 'Check if an action violates policy',
            generatePolicies: 'Generate policies from mistake patterns',
            getStats: 'Get procedural memory soul stats',
            reviewBehavior: 'Analyze behavior patterns over time'
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
        if (this.toolHandlers[toolName]) {
            return this.toolHandlers[toolName](args);
        }

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
            this._startStdio();
            if (callback) callback('mcp-stdio');
        } else if (mcpPort) {
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

if (require.main === module) {
    const name = process.argv[2] || 'mesh-client';
    const port = parseInt(process.argv[3]) || 0;
    const r = new PeerRegistry({ name, port: port || 0, type: 'cli' });
    console.log('\nMesh Registry:');
    console.log(JSON.stringify(r.getAll(), null, 2));
    console.log('\nPress Ctrl+C to leave');
    process.on('SIGINT', () => { r.unregister(); process.exit(0); });
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
        registry.souls=registry.souls.filter(s=>!(s.name===this.soulName&&s.pid===process.pid));
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

if (require.main === module) {
    const name = process.argv[2] || 'mesh-client';
    const port = parseInt(process.argv[3]) || 0;
    const r = new PeerRegistry({ name, port: port || 0, type: 'cli' });
    console.log('\nMesh Registry:');
    console.log(JSON.stringify(r.getAll(), null, 2));
    console.log('\nPress Ctrl+C to leave');
    process.on('SIGINT', () => { r.unregister(); process.exit(0); });
    setInterval(() => {}, 60000);
}

``

### lib\procedural-memory.js

``.js
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const pkg = require('../package.json');

function printHelp() {
    console.log(`
\x55\x6e\x61\x62\x6c\x65\x20\x74\x6f\x20\x63\x6f\x6e\x6e\x65\x63\x74\x20\x74\x6f\x20\x43\x6c\x61\x75\x64\x65\x20\x43\x6f\x64\x65\x2c\x20\x43\x75\x72\x73\x6f\x72\x2c\x20\x43\x6c\x69\x6e\x65\x2c\x20\x65\x74\x63\x2e
`);
}

const args = process.argv.slice(2);
const cmd = args[0] || 'start';

switch (cmd) {
    case 'help': case '--help': printHelp(); break;
    case 'server': case 'start': default:
        const ProceduralMemorySoul = require('./soul-procedural-memory');
        const PORT = parseInt(process.env.PROCEDURAL_MEMORY_PORT || '4285', 10);
        const KEY = process.env.PROCEDURAL_MEMORY_KEY || null;
        const soul = new ProceduralMemorySoul({ port: PORT, apiKey: KEY });
        const server = soul.start();
        process.on('SIGTERM', () => server.close(() => process.exit(0)));
        process.on('SIGINT', () => server.close(() => process.exit(0)));
        break;
}

``

### lib\soul-procedural-memory.js

``.js
#!/usr/bin/env node
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const HOME_DIR = path.join(os.homedir(), '.soul-procedural-memory');
const MAX_MISTAKES = 1000;

class ProceduralMemorySoul {
    constructor(options = {}) {
        this.port = options.port || 4285;
        this.dataDir = options.dataDir || HOME_DIR;
        this.apiKey = options.apiKey || null;
        this.keyPath = path.join(this.dataDir, '.key');
        this.logPath = path.join(this.dataDir, 'soul-log.jsonl');
        this.bootTime = Date.now();
        this.mistakes = [];
        this.policies = [];
        this.behavior_log = [];
        this.prevention_count = 0;
        this.ensureDirs();
        this.loadAuth();
        this.loadState();
    }

    ensureDirs() {
        if (!fs.existsSync(this.dataDir)) fs.mkdirSync(this.dataDir, { recursive: true });
    }

    loadAuth() {
        if (this.apiKey) return;
        if (fs.existsSync(this.keyPath)) {
            this.apiKey = fs.readFileSync(this.keyPath, 'utf8').trim();
        }
        if (!this.apiKey) {
            this.apiKey = crypto.randomBytes(24).toString('hex');
            fs.writeFileSync(this.keyPath, this.apiKey);
        }
    }

    saveState() {
        try {
            const state = {
                mistakes: this.mistakes,
                policies: this.policies,
                behavior_log: this.behavior_log.slice(-500),
                prevention_count: this.prevention_count,
                savedAt: this.now()
            };
            fs.writeFileSync(path.join(this.dataDir, 'state.json'), JSON.stringify(state, null, 2));
        } catch (e) { console.error('[save] error:', e.message); }
    }

    loadState() {
        const statePath = path.join(this.dataDir, 'state.json');
        if (!fs.existsSync(statePath)) return;
        try {
            const raw = fs.readFileSync(statePath, 'utf8');
            if (!raw) return;
            const state = JSON.parse(raw);
            this.mistakes = state.mistakes || [];
            this.policies = state.policies || [];
            this.behavior_log = state.behavior_log || [];
            this.prevention_count = state.prevention_count || 0;
        } catch (e) { console.error('[load] state error:', e.message); }
    }

    now() { return new Date().toISOString(); }
    uptime() { return Math.floor((Date.now() - this.bootTime) / 1000); }

    _mistakeId() {
        return 'mistake_' + String(this.mistakes.length + 1).padStart(3, '0');
    }

    _log(entry) {
        try {
            fs.appendFileSync(this.logPath, JSON.stringify({ ...entry, ts: this.now() }) + '\n');
        } catch {}
    }

    recordMistake(data) {
        const { action, context, consequence, severity, fix } = data;
        if (!action || !context) throw new Error('action and context are required');

        const existing = this.mistakes.find(m => m.action === action && m.context === context);
        if (existing) {
            existing.occurrences = (existing.occurrences || 1) + 1;
            existing.lastSeen = this.now();
            if (fix) existing.fix = fix;
            if (severity) existing.severity = severity;
            this._log({ type: 'mistake_repeated', id: existing.id, occurrences: existing.occurrences });

            if (existing.occurrences >= 3) {
                this._generatePolicyFromMistake(existing);
            }

            this.saveState();
            return existing;
        }

        const mistake = {
            id: this._mistakeId(),
            action,
            context,
            consequence: consequence || 'unknown',
            severity: severity || 'medium',
            timestamp: this.now(),
            fix: fix || null,
            occurrences: 1,
            lastSeen: this.now()
        };

        this.mistakes.push(mistake);

        if (this.mistakes.length > MAX_MISTAKES) {
            this.mistakes = this.mistakes.slice(-MAX_MISTAKES);
        }

        this._log({ type: 'mistake_recorded', id: mistake.id, action, context });
        this.saveState();
        return mistake;
    }

    _generatePolicyFromMistake(mistake) {
        const existing = this.policies.find(p =>
            p.trigger === mistake.context && p.forbidden_action === mistake.action
        );
        if (existing) {
            existing.confidence = Math.min(1, existing.confidence + 0.1);
            existing.updatedAt = this.now();
            if (mistake.occurrences >= 5) existing.auto_enforce = true;
            return existing;
        }

        const policy = {
            id: 'policy_' + String(this.policies.length + 1).padStart(3, '0'),
            trigger: mistake.context,
            forbidden_action: mistake.action,
            preferred_action: mistake.fix || 'avoid ' + mistake.action,
            confidence: Math.min(0.5 + (mistake.occurrences - 2) * 0.15, 0.95),
            severity: mistake.severity,
            source_mistake_id: mistake.id,
            created: this.now(),
            updatedAt: this.now(),
            auto_enforce: mistake.occurrences >= 5
        };

        this.policies.push(policy);
        this._log({ type: 'policy_created', id: policy.id, trigger: policy.trigger, forbidden: policy.forbidden_action });
        return policy;
    }

    checkAction(action, context) {
        const matchingPolicies = this.policies.filter(p => {
            const triggerMatch = !p.trigger || context.includes(p.trigger) || p.trigger.includes(context);
            const actionMatch = action === p.forbidden_action || action.includes(p.forbidden_action) || p.forbidden_action.includes(action);
            return triggerMatch && actionMatch;
        });

        if (matchingPolicies.length === 0) {
            this._log({ type: 'action_allowed', action, context });
            this.behavior_log.push({
                action,
                context,
                outcome: 'allowed',
                timestamp: this.now(),
                policy_applied: null,
                enforced: false
            });
            this.saveState();
            return { allowed: true, policy: null, suggestion: null };
        }

        const sorted = matchingPolicies.sort((a, b) => b.confidence - a.confidence);
        const strictest = sorted[0];

        this._log({ type: 'action_blocked', action, context, policy: strictest.id });

        if (strictest.confidence >= 0.7 && strictest.auto_enforce) {
            this.prevention_count++;
            this.behavior_log.push({
                action,
                context,
                outcome: 'prevented',
                timestamp: this.now(),
                policy_applied: strictest.id,
                enforced: true
            });
            this.saveState();
            return {
                allowed: false,
                policy: strictest,
                suggestion: strictest.preferred_action,
                enforced: true
            };
        }

        this.behavior_log.push({
            action,
            context,
            outcome: 'flagged',
            timestamp: this.now(),
            policy_applied: strictest.id,
            enforced: false
        });
        this.saveState();
        return {
            allowed: false,
            policy: strictest,
            suggestion: strictest.preferred_action,
            enforced: false
        };
    }

    applyFix(action, context) {
        const matchingPolicies = this.policies.filter(p => {
            const triggerMatch = !p.trigger || context.includes(p.trigger) || p.trigger.includes(context);
            const actionMatch = action === p.forbidden_action || action.includes(p.forbidden_action) || p.forbidden_action.includes(action);
            return triggerMatch && actionMatch;
        });

        if (matchingPolicies.length === 0) {
            return { found: false, fix: null, message: 'No policy matches this action+context' };
        }

        const sorted = matchingPolicies.sort((a, b) => b.confidence - a.confidence);
        const best = sorted[0];

        return {
            found: true,
            fix: best.preferred_action,
            policy_id: best.id,
            confidence: best.confidence
        };
    }

    generatePolicies() {
        const repeats = this.mistakes.filter(m => m.occurrences >= 3);
        const created = [];
        for (const mistake of repeats) {
            const policy = this._generatePolicyFromMistake(mistake);
            if (policy) created.push(policy);
        }

        const stale = this.policies.filter(p => {
            const source = this.mistakes.find(m => m.id === p.source_mistake_id);
            return !source;
        });
        for (const s of stale) {
            s.confidence = Math.max(0.1, s.confidence - 0.2);
            s.auto_enforce = false;
        }

        this.saveState();
        return { created: created.length, total: this.policies.length, stale_reduced: stale.length };
    }

    reviewBehavior() {
        const total = this.behavior_log.length;
        const prevented = this.behavior_log.filter(b => b.outcome === 'prevented').length;
        const flagged = this.behavior_log.filter(b => b.outcome === 'flagged').length;
        const recent = this.behavior_log.slice(-20);

        const patternCounts = {};
        for (const entry of this.behavior_log) {
            const key = entry.action + '@' + entry.context;
            patternCounts[key] = (patternCounts[key] || 0) + 1;
        }

        const topPatterns = Object.entries(patternCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([key, count]) => {
                const [action, context] = key.split('@');
                return { action, context, count };
            });

        return {
            total_actions: total,
            prevented,
            flagged,
            prevention_rate: total > 0 ? (prevented / total * 100).toFixed(1) + '%' : '0%',
            prevention_count: this.prevention_count,
            top_patterns: topPatterns,
            recent_actions: recent.slice(-10),
            active_policies: this.policies.length,
            total_mistakes: this.mistakes.length,
            repeated_mistakes: this.mistakes.filter(m => m.occurrences > 1).length
        };
    }

    getStats() {
        return {
            name: 'Procedural Memory Soul',
            version: '1.0.0',
            mistakes_recorded: this.mistakes.length,
            policies_active: this.policies.length,
            behavior_entries: this.behavior_log.length,
            prevention_count: this.prevention_count,
            apiKey: this.apiKey ? this.apiKey.substring(0, 8) + '...' : null,
            uptime: this.uptime()
        };
    }

    checkAuth(req) {
        if (!this.apiKey) return true;
        const key = req.headers['x-api-key'] || req.headers['x-procedural-key'] || (req.headers['authorization'] || '').replace('Bearer ', '');
        return key === this.apiKey;
    }

    start() {
        const server = http.createServer(async (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-Procedural-Key, Authorization');
            if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

            const send = (status, data) => {
                res.writeHead(status, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data));
            };
            const readBody = () => new Promise((resolve, reject) => {
                let data = '', size = 0;
                req.on('data', c => { size += c.length; if (size > 1e6) { req.destroy(); reject(new Error('Body too large')); } data += c; });
                req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new Error('Invalid JSON')); } });
                req.on('error', reject);
            });

            try {
                const url = new URL(req.url, `http://localhost:${this.port}`);
                let pathname = url.pathname.replace(/\/+$/, '') || '/';

                if (pathname !== '/ping' && pathname !== '/health' && !this.checkAuth(req)) {
                    return send(401, { error: 'Unauthorized. Provide X-API-Key header.' });
                }

                if (req.method === 'GET' && pathname === '/ping') {
                    return send(200, { alive: true, name: 'Procedural Memory Soul', ts: this.now() });
                }
                if (req.method === 'GET' && pathname === '/health') {
                    return send(200, { status: 'alive', uptime: this.uptime(), mistakes: this.mistakes.length, policies: this.policies.length, ts: this.now() });
                }
                if (req.method === 'GET' && pathname === '/mistakes') {
                    return send(200, { mistakes: this.mistakes, total: this.mistakes.length });
                }
                if (req.method === 'GET' && pathname.startsWith('/mistakes/')) {
                    const id = pathname.replace('/mistakes/', '');
                    const mistake = this.mistakes.find(m => m.id === id);
                    if (!mistake) return send(404, { error: 'Mistake not found' });
                    return send(200, mistake);
                }
                if (req.method === 'POST' && pathname === '/record-mistake') {
                    const body = await readBody();
                    const result = this.recordMistake(body);
                    return send(200, result);
                }
                if (req.method === 'POST' && pathname === '/review-policies') {
                    const result = this.generatePolicies();
                    return send(200, result);
                }
                if (req.method === 'GET' && pathname === '/policies') {
                    return send(200, { policies: this.policies, total: this.policies.length });
                }
                if (req.method === 'POST' && pathname === '/check-action') {
                    const body = await readBody();
                    if (!body.action) return send(400, { error: 'action is required' });
                    const result = this.checkAction(body.action, body.context || '');
                    return send(200, result);
                }
                if (req.method === 'POST' && pathname === '/apply-fix') {
                    const body = await readBody();
                    if (!body.action) return send(400, { error: 'action is required' });
                    const result = this.applyFix(body.action, body.context || '');
                    return send(200, result);
                }
                if (req.method === 'GET' && pathname === '/behavior') {
                    return send(200, this.reviewBehavior());
                }
                if (req.method === 'DELETE' && pathname.startsWith('/mistake/')) {
                    const id = pathname.replace('/mistake/', '');
                    const idx = this.mistakes.findIndex(m => m.id === id);
                    if (idx === -1) return send(404, { error: 'Mistake not found' });
                    this.mistakes.splice(idx, 1);
                    this.saveState();
                    return send(200, { deleted: true, id });
                }
                if (req.method === 'GET' && pathname === '/key') {
                    return send(200, { key: this.apiKey, path: this.keyPath });
                }

                send(404, { error: 'Not found' });
            } catch (e) {
                send(500, { error: e.message });
            }
        });

        server.listen(this.port, () => {
            console.log('\n╔══════════════════════════════════════════════╗');
            console.log('║  Procedural Memory Soul — v1.0.0            ║');
            console.log('║  Learning from mistakes, creating policies  ║');
            console.log('╚══════════════════════════════════════════════╝\n');
            console.log(`Port:     ${this.port}`);
            console.log(`API Key:  ${this.apiKey.substring(0, 12)}...`);
            console.log(`Data:     ${this.dataDir}\n`);
            console.log('Endpoints:');
            console.log('  POST /record-mistake    Record a mistake');
            console.log('  GET  /mistakes          List all mistakes');
            console.log('  GET  /mistakes/:id      Get specific mistake');
            console.log('  POST /review-policies   Generate policies from mistakes');
            console.log('  GET  /policies          List all policies');
            console.log('  POST /check-action      Check if action violates policy');
            console.log('  POST /apply-fix         Get recommended fix');
            console.log('  GET  /behavior          Behavior tracking stats');
            console.log('  DELETE /mistake/:id     Remove a mistake');
            console.log('  GET  /ping              Health check (no auth)');
            console.log('  GET  /health            Deep health\n');
        });

        return server;
    }
}

module.exports = ProceduralMemorySoul;

if (process.argv.includes('--mcp') || process.argv.includes('--mcp-port')) {
    try {
        const MCPAdapter = require('./mcp-adapter');
        const mcp = new MCPAdapter();
        mcp.register(module.exports, { name: 'procedural-memory' });
        mcp.start();
    } catch(e) { console.error('[mcp] procedural-memory error:', e.message); }
}

if (require.main === module) {
    const PORT = parseInt(process.env.PROCEDURAL_MEMORY_PORT || '4285', 10);
    const KEY = process.env.PROCEDURAL_MEMORY_KEY || null;
    const soul = new ProceduralMemorySoul({ port: PORT, apiKey: KEY });
    const server = soul.start();
    process.on('SIGTERM', () => server.close(() => process.exit(0)));
    process.on('SIGINT', () => server.close(() => process.exit(0)));
}

``

### test\soul-procedural-memory.test.js

``.js
#!/usr/bin/env node
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const TEST_BASE = path.join(os.homedir(), '.soul-procedural-memory-test');
console.log('\n\u{1F9E0} Procedural Memory Soul v1.0.0 \u2014 Test Suite\n');
let passed = 0, failed = 0;
function test(name, fn) { try { fn(); console.log('  \u2713 ' + name); passed++; } catch (e) { console.log('  \u2717 ' + name + ': ' + e.message); failed++; } }
const P = require('../lib/soul-procedural-memory.js');
let testDirCounter = 0;
function freshSoul() {
    const dir = TEST_BASE + '\\test_' + (++testDirCounter);
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    return new P({ dataDir: dir });
}

test('Soul loads with API key', () => {
    const p = freshSoul();
    assert(p.apiKey, 'Should generate API key');
    assert(p.apiKey.length > 10, 'Key long enough');
});

test('Initial arrays are empty', () => {
    const p = freshSoul();
    assert(Array.isArray(p.mistakes), 'mistakes is array');
    assert(Array.isArray(p.policies), 'policies is array');
    assert(Array.isArray(p.behavior_log), 'behavior_log is array');
    assert(p.mistakes.length === 0, 'no mistakes initially');
    assert(p.policies.length === 0, 'no policies initially');
    assert(p.prevention_count === 0, 'prevention count zero');
});

test('recordMistake stores a mistake', () => {
    const p = freshSoul();
    const m = p.recordMistake({ action: 'chmod_777', context: 'permissions_fix', consequence: 'security_hole', severity: 'high', fix: 'use chmod 755' });
    assert(m.id.startsWith('mistake_'), 'Has mistake id');
    assert(m.action === 'chmod_777', 'Action preserved');
    assert(m.context === 'permissions_fix', 'Context preserved');
    assert(m.severity === 'high', 'Severity preserved');
    assert(m.occurrences === 1, 'First occurrence');
    assert(p.mistakes.length === 1, 'Stored in array');
});

test('recordMistake requires action and context', () => {
    const p = freshSoul();
    assert.throws(() => p.recordMistake({}), /action and context are required/);
    assert.throws(() => p.recordMistake({ action: 'test' }), /action and context are required/);
});

test('Repeated mistake increments occurrences', () => {
    const p = freshSoul();
    p.recordMistake({ action: 'rm_rf', context: 'cleanup', consequence: 'data_loss', severity: 'critical', fix: 'use trash instead' });
    const m2 = p.recordMistake({ action: 'rm_rf', context: 'cleanup', consequence: 'data_loss', severity: 'critical' });
    assert(m2.occurrences === 2, 'Second occurrence');
});

test('Mistake repeated 3+ times generates a policy', () => {
    const p = freshSoul();
    p.recordMistake({ action: 'sudo_all', context: 'package_install', consequence: 'security_risk', severity: 'high', fix: 'avoid sudo' });
    p.recordMistake({ action: 'sudo_all', context: 'package_install', consequence: 'security_risk', severity: 'high' });
    p.recordMistake({ action: 'sudo_all', context: 'package_install', consequence: 'security_risk', severity: 'high' });
    assert(p.policies.length >= 1, 'Policy created after 3 occurrences');
    const pol = p.policies[0];
    assert(pol.trigger === 'package_install', 'Policy has trigger');
    assert(pol.forbidden_action === 'sudo_all', 'Policy has forbidden action');
    assert(pol.confidence > 0, 'Policy has confidence');
});

test('checkAction returns allowed when no policy matches', () => {
    const p = freshSoul();
    const result = p.checkAction('git_push', 'deploy');
    assert(result.allowed === true, 'Action allowed');
    assert(result.policy === null, 'No policy matched');
});

test('checkAction blocks when policy matches with high confidence', () => {
    const p = freshSoul();
    p.recordMistake({ action: 'chmod_777', context: 'permissions', consequence: 'security_hole', severity: 'high', fix: 'use chmod 755' });
    p.recordMistake({ action: 'chmod_777', context: 'permissions', consequence: 'security_hole', severity: 'high' });
    p.recordMistake({ action: 'chmod_777', context: 'permissions', consequence: 'security_hole', severity: 'high' });
    p.recordMistake({ action: 'chmod_777', context: 'permissions', consequence: 'security_hole', severity: 'high' });
    p.recordMistake({ action: 'chmod_777', context: 'permissions', consequence: 'security_hole', severity: 'high' });
    const result = p.checkAction('chmod_777', 'permissions');
    assert(result.allowed === false, 'Action blocked');
    assert(result.policy !== null, 'Policy returned');
    assert(result.suggestion !== null, 'Suggestion provided');
});

test('applyFix returns fix for matching policy', () => {
    const p = freshSoul();
    p.recordMistake({ action: 'root_login', context: 'ssh_access', consequence: 'security_risk', severity: 'high', fix: 'use key-based auth' });
    p.recordMistake({ action: 'root_login', context: 'ssh_access', consequence: 'security_risk', severity: 'high' });
    p.recordMistake({ action: 'root_login', context: 'ssh_access', consequence: 'security_risk', severity: 'high' });
    const result = p.applyFix('root_login', 'ssh_access');
    assert(result.found === true, 'Fix found');
    assert(result.fix === 'use key-based auth', 'Correct fix');
    assert(result.confidence > 0, 'Has confidence');
});

test('applyFix returns not found when no match', () => {
    const p = freshSoul();
    const result = p.applyFix('nonexistent', 'unknown');
    assert(result.found === false, 'No fix found');
});

test('generatePolicies creates policies from repeated mistakes', () => {
    const p = freshSoul();
    p.recordMistake({ action: 'drop_db', context: 'migration', consequence: 'data_loss', severity: 'critical', fix: 'backup first' });
    p.recordMistake({ action: 'drop_db', context: 'migration', consequence: 'data_loss', severity: 'critical' });
    p.recordMistake({ action: 'drop_db', context: 'migration', consequence: 'data_loss', severity: 'critical' });
    const result = p.generatePolicies();
    assert(result.total > 0, 'Has policies');
    assert(typeof result.created === 'number', 'Created count');
});

test('reviewBehavior returns stats', () => {
    const p = freshSoul();
    const stats = p.reviewBehavior();
    assert(stats.total_actions === 0, 'No actions yet');
    assert(stats.active_policies === 0, 'No policies');
    assert(typeof stats.prevention_rate === 'string', 'Has prevention rate');
});

test('Prevention count increments', () => {
    const p = freshSoul();
    p.recordMistake({ action: 'rm_rf_slash', context: 'cleanup', consequence: 'catastrophic', severity: 'critical', fix: 'dont do this' });
    p.recordMistake({ action: 'rm_rf_slash', context: 'cleanup', consequence: 'catastrophic', severity: 'critical' });
    p.recordMistake({ action: 'rm_rf_slash', context: 'cleanup', consequence: 'catastrophic', severity: 'critical' });
    p.recordMistake({ action: 'rm_rf_slash', context: 'cleanup', consequence: 'catastrophic', severity: 'critical' });
    p.recordMistake({ action: 'rm_rf_slash', context: 'cleanup', consequence: 'catastrophic', severity: 'critical' });
    const countBefore = p.prevention_count;
    p.checkAction('rm_rf_slash', 'cleanup');
    assert(p.prevention_count > countBefore, 'Prevention count increased');
});

test('getStats returns correct structure', () => {
    const p = freshSoul();
    const stats = p.getStats();
    assert(stats.name === 'Procedural Memory Soul', 'Has name');
    assert(stats.version === '1.0.0', 'Has version');
    assert(typeof stats.mistakes_recorded === 'number', 'Has mistake count');
    assert(typeof stats.policies_active === 'number', 'Has policy count');
    assert(typeof stats.prevention_count === 'number', 'Has prevention count');
});

test('Auth check works', () => {
    const p = freshSoul();
    p.apiKey = 'test-key';
    assert(p.checkAuth({ headers: { 'x-api-key': 'test-key' } }) === true, 'Valid key passes');
    assert(p.checkAuth({ headers: { 'x-api-key': 'wrong' } }) === false, 'Wrong key fails');
    assert(p.checkAuth({ headers: { 'x-procedural-key': 'test-key' } }) === true, 'Alternate header works');
});

test('Key persists to disk', () => {
    const p = freshSoul();
    assert(fs.existsSync(p.keyPath), 'Key file exists');
    const stored = fs.readFileSync(p.keyPath, 'utf8').trim();
    assert(stored === p.apiKey, 'Stored key matches');
});

test('Max mistakes limit enforced', () => {
    const p = freshSoul();
    for (let i = 0; i < 1005; i++) {
        p.recordMistake({ action: 'action_' + i, context: 'test_' + i, consequence: 'none', severity: 'low' });
    }
    assert(p.mistakes.length <= 1000, 'Max 1000 mistakes');
});

test('State persists between instances', () => {
    const dir = TEST_BASE + '\\persist_test';
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    const p1 = new P({ dataDir: dir });
    p1.recordMistake({ action: 'test_persist', context: 'persistence_test', consequence: 'none', severity: 'low' });
    const p2 = new P({ dataDir: dir });
    assert(p2.mistakes.length >= 1, 'Mistakes loaded from disk');
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
});

test('Behavior log tracks allowed actions', () => {
    const p = freshSoul();
    p.checkAction('normal_action', 'normal_context');
    assert(p.behavior_log.length > 0, 'Action logged');
    const last = p.behavior_log[p.behavior_log.length - 1];
    assert(last.action === 'normal_action', 'Action name logged');
    assert(['allowed', 'flagged', 'prevented'].includes(last.outcome), 'Outcome tracked');
});

test('recordMistake with minimal fields uses defaults', () => {
    const p = freshSoul();
    const m = p.recordMistake({ action: 'bare_action', context: 'bare_context' });
    assert(m.severity === 'medium', 'Default severity');
    assert(m.consequence === 'unknown', 'Default consequence');
});

test('DELETE mistake removes it via splice', () => {
    const p = freshSoul();
    const m = p.recordMistake({ action: 'delete_me', context: 'test', consequence: 'none', severity: 'low' });
    assert(p.mistakes.length === 1, 'Mistake exists');
    const idx = p.mistakes.findIndex(x => x.id === m.id);
    assert(idx >= 0, 'Mistake found by id');
    p.mistakes.splice(idx, 1);
    p.saveState();
    assert(p.mistakes.length === 0, 'Mistake removed');
});

test('Consecutive same mistake updates existing not duplicates', () => {
    const p = freshSoul();
    const m1 = p.recordMistake({ action: 'same_act', context: 'same_ctx', consequence: 'bad', severity: 'high', fix: 'fix it' });
    const m2 = p.recordMistake({ action: 'same_act', context: 'same_ctx' });
    assert(m1.id === m2.id, 'Same id for repeated mistake');
    assert(p.mistakes.length === 1, 'Still only one entry');
    assert(m2.occurrences === 2, 'Occurrences incremented');
});

if (fs.existsSync(TEST_BASE)) fs.rmSync(TEST_BASE, { recursive: true, force: true });
console.log('\n' + '='.repeat(40));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed\n');
process.exit(failed > 0 ? 1 : 0);

``

