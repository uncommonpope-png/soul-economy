---
name: soul-teacher-v1.0.0
description: "Extracted from soul-teacher-v1.0.0.zip � raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-teacher-v1.0.0.zip
---

# soul-teacher-v1.0.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 8 files extracted from the original zip.

### bundle.js

``.js
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, 'lib', 'soul-teacher.js');
const dest = path.join(__dirname, 'lib', 'soul-teacher.min.js');
let code = fs.readFileSync(src, 'utf8');
// Remove shebang and CLI handler
code = code.replace(/^#!\/usr\/bin\/env node\n/, '');
code = code.replace(/\nif \(require\.main === module\)[\s\S]*$/, '');
code = code.replace(/^module\.exports = TeacherSoul;/m, '');
// Minify
code = code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
code = code.replace(/\n{3,}/g, '\n\n').replace(/^\s+/gm, '');
const out = `'use strict';\n/* Teacher Soul v1.0.0 - Protected Core */\n${code}\nmodule.exports = { TeacherSoul };\n`;
fs.writeFileSync(dest, out);
const size = fs.statSync(dest).size;
console.log('Bundle: ' + dest + ' (' + size + ' bytes)');
``

### package.json

``.json
{"name":"@buyasoul/soul-teacher","version":"1.0.0","description":"Teacher Soul - Study GitHub repos, learn patterns, generate training data","main":"lib/teacher.js","scripts":{"start":"node lib/soul-teacher.js","test":"node test/soul-teacher.test.js"},"keywords":["soul","teacher","github","training","repos","learning","ai-agent"],"author":"BUYaSOUL - The Soul Foundry","license":"MIT","engines":{"node":">=18.0.0"}}
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

### lib\soul-teacher.js

``.js
#!/usr/bin/env node

'use strict';
const mesh = require('./mesh-adapter');

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const https = require('https');

const HOME_DIR = path.join(os.homedir(), '.soul-teacher');

class TeacherSoul {
    constructor(options = {}) {
        this.port = options.port || 4160;
        this.dataDir = options.dataDir || HOME_DIR;
        this.apiKey = options.apiKey || null;
        this.githubToken = options.githubToken || null;
        this.keyPath = path.join(this.dataDir, '.key');
        this.historyPath = path.join(this.dataDir, 'studies.json');
        this.trainingPath = path.join(this.dataDir, 'training.jsonl');
        this.bootTime = Date.now();
        this.studies = [];
        this.ensureDirs();
        this.loadAuth();
        this.loadHistory();
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

    loadHistory() {
        if (fs.existsSync(this.historyPath)) {
            try { this.studies = JSON.parse(fs.readFileSync(this.historyPath, 'utf8')); }
            catch { this.studies = []; }
        }
    }

    saveHistory() {
        fs.writeFileSync(this.historyPath, JSON.stringify(this.studies, null, 2));
    }

    now() { return new Date().toISOString(); }
    uptime() { return Math.floor((Date.now() - this.bootTime) / 1000); }
    genId() { return `study_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`; }

    async studyRepo(repoUrl, options = {}) {
        const { branch = 'main', depth = 10, generateTraining = true } = options;
        const parsed = this.parseRepoUrl(repoUrl);
        if (!parsed) return { error: 'Invalid GitHub URL. Use format: owner/repo' };

        const study = {
            id: this.genId(),
            repo: parsed.full,
            owner: parsed.owner,
            name: parsed.name,
            branch,
            timestamp: this.now(),
            files: [],
            languages: {},
            totalFiles: 0,
            totalBytes: 0,
            patterns: [],
            trainingPairs: []
        };

        // Get repo info
        const info = await this.githubFetch(`/repos/${parsed.full}`);
        if (info.error) return { error: info.error };
        study.description = info.description || '';
        study.topics = info.topics || [];
        study.stars = info.stargazers_count || 0;
        study.language = info.language || 'unknown';

        // Get repo contents (top-level)
        const contents = await this.githubFetch(`/repos/${parsed.full}/contents?ref=${branch}`);
        if (contents.error) {
            // Fallback: try default branch
            const defaultContents = await this.githubFetch(`/repos/${parsed.full}/contents`);
            if (defaultContents.error) return { error: defaultContents.error };
            await this.processContents(defaultContents, '', study, depth);
        } else {
            await this.processContents(contents, '', study, depth);
        }

        // Detect patterns
        study.patterns = this.detectPatterns(study);

        // Generate training data
        if (generateTraining) {
            study.trainingPairs = this.generateTraining(study);
            for (const pair of study.trainingPairs) {
                fs.appendFileSync(this.trainingPath, JSON.stringify(pair) + '\n');
            }
        }

        this.studies.unshift(study);
        if (this.studies.length > 50) this.studies = this.studies.slice(0, 50);
        this.saveHistory();
        return study;
    }

    parseRepoUrl(url) {
        url = url.replace(/https?:\/\/github\.com\//, '').replace(/\.git$/, '').trim();
        const parts = url.split('/');
        if (parts.length >= 2) return { full: parts[0] + '/' + parts[1], owner: parts[0], name: parts[1] };
        if (parts.length === 1 && url.includes('/')) {
            const sp = url.split('/');
            return { full: sp[0] + '/' + sp[1], owner: sp[0], name: sp[1] };
        }
        return null;
    }

    githubFetch(endpoint) {
        return new Promise((resolve) => {
            const opts = {
                hostname: 'api.github.com',
                path: endpoint,
                headers: {
                    'User-Agent': 'TeacherSoul/1.0',
                    'Accept': 'application/vnd.github.v3+json'
                }
            };
            if (this.githubToken) {
                opts.headers['Authorization'] = 'token ' + this.githubToken;
            }
            https.get(opts, (res) => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => {
                    try { resolve(JSON.parse(data)); }
                    catch { resolve({ error: 'Failed to parse response' }); }
                });
            }).on('error', (e) => resolve({ error: e.message }));
        });
    }

    async processContents(contents, prefix, study, depth) {
        if (!Array.isArray(contents)) {
            // Single file
            if (contents.type === 'file') {
                const ext = path.extname(contents.name).toLowerCase();
                const lang = this.getLanguage(ext);
                study.files.push({
                    path: prefix + contents.name,
                    size: contents.size || 0,
                    language: lang,
                    type: ext
                });
                study.totalFiles++;
                study.totalBytes += contents.size || 0;
                if (lang) study.languages[lang] = (study.languages[lang] || 0) + 1;
            }
            return;
        }

        for (const item of contents) {
            if (depth <= 0) break;
            if (item.type === 'file') {
                const ext = path.extname(item.name).toLowerCase();
                const lang = this.getLanguage(ext);
                study.files.push({
                    path: prefix + item.name,
                    size: item.size || 0,
                    language: lang,
                    type: ext
                });
                study.totalFiles++;
                study.totalBytes += item.size || 0;
                if (lang) study.languages[lang] = (study.languages[lang] || 0) + 1;
            } else if (item.type === 'dir') {
                const sub = await this.githubFetch(`/repos/${path.basename(this.historyPath).replace('.json','')}/contents/${prefix + item.name}`);
                // Actually fetch subdirectory
                const repoPath = this.studies[0] ? 
                    `/repos/${this.studies[0].owner}/${this.studies[0].name}/contents/${prefix + item.name}` : null;
                if (repoPath) {
                    const subContents = await this.githubFetch(repoPath);
                    if (Array.isArray(subContents)) {
                        await this.processContents(subContents, prefix + item.name + '/', study, depth - 1);
                    }
                }
            }
        }
    }

    getLanguage(ext) {
        const map = {
            '.js': 'JavaScript', '.jsx': 'JavaScript', '.ts': 'TypeScript', '.tsx': 'TypeScript',
            '.py': 'Python', '.rb': 'Ruby', '.go': 'Go', '.rs': 'Rust',
            '.java': 'Java', '.kt': 'Kotlin', '.swift': 'Swift',
            '.css': 'CSS', '.scss': 'SCSS', '.html': 'HTML',
            '.json': 'JSON', '.yaml': 'YAML', '.yml': 'YAML',
            '.md': 'Markdown', '.sql': 'SQL', '.sh': 'Shell',
            '.c': 'C', '.cpp': 'C++', '.h': 'C'
        };
        return map[ext] || null;
    }

    detectPatterns(study) {
        const patterns = [];
        const langs = Object.keys(study.languages);
        if (langs.length > 0) {
            patterns.push({ type: 'multi_language', count: langs.length, languages: langs });
            const top = langs.sort((a, b) => study.languages[b] - study.languages[a])[0];
            patterns.push({ type: 'primary_language', language: top, files: study.languages[top] });
        }
        if (study.totalFiles > 50) patterns.push({ type: 'large_repo', files: study.totalFiles });
        if (study.totalFiles < 10) patterns.push({ type: 'small_repo', files: study.totalFiles });
        if (study.stars > 100) patterns.push({ type: 'popular', stars: study.stars });
        if (study.topics.length > 0) patterns.push({ type: 'topics', topics: study.topics });
        return patterns;
    }

    generateTraining(study) {
        const pairs = [];
        const langs = Object.keys(study.languages);

        // Language pattern
        if (langs.length > 0) {
            pairs.push({
                input: `What language does ${study.repo} use?`,
                output: `The repository ${study.repo} primarily uses ${langs.sort((a,b) => study.languages[b]-study.languages[a])[0]}.`,
                source: 'repo-analysis',
                repo: study.repo
            });
        }

        // Size pattern
        pairs.push({
            input: `How large is ${study.repo}?`,
            output: `${study.repo} has ${study.totalFiles} files totaling ${(study.totalBytes / 1024).toFixed(1)} KB.`,
            source: 'repo-analysis',
            repo: study.repo
        });

        // Structure pattern
        const topFiles = study.files.slice(0, 5);
        if (topFiles.length > 0) {
            const structure = topFiles.map(f => f.path).join(', ');
            pairs.push({
                input: `What is the structure of ${study.repo}?`,
                output: `Top files: ${structure}. Primary language: ${langs[0] || 'unknown'}.`,
                source: 'repo-analysis',
                repo: study.repo
            });
        }

        return pairs;
    }

    getStats() {
        const totalPairs = this.studies.reduce((s, st) => s + (st.trainingPairs?.length || 0), 0);
        return {
            name: 'Teacher Soul',
            version: '1.0.0',
            reposStudied: this.studies.length,
            totalTrainingPairs: totalPairs,
            apiKey: this.apiKey ? this.apiKey.substring(0, 8) + '...' : null,
            uptime: this.uptime()
        };
    }

    checkAuth(req) {
        if (!this.apiKey) return true;
        const key = req.headers['x-api-key'] || req.headers['x-teacher-key'] || (req.headers['authorization'] || '').replace('Bearer ', '');
        return key === this.apiKey;
    }

    start() {
        const server = http.createServer(async (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-Teacher-Key, Authorization');
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
                const pn = url.pathname.replace(/\/+$/, '') || '/';

                if (pn !== '/ping' && pn !== '/health' && !this.checkAuth(req))
                    return send(401, { error: 'Unauthorized. Provide X-API-Key header.' });

                if (req.method === 'GET' && pn === '/ping')
                    return send(200, { alive: true, name: 'Teacher Soul', ts: this.now() });
                if (req.method === 'GET' && pn === '/health')
                    return send(200, { status: 'alive', uptime: this.uptime(), studies: this.studies.length, ts: this.now() });
                if (req.method === 'GET' && pn === '/status')
                    return send(200, this.getStats());
                if (req.method === 'GET' && pn === '/history')
                    return send(200, { studies: this.studies.slice(0, parseInt(url.searchParams.get('limit') || '10', 10)) });
                if (req.method === 'GET' && pn === '/key')
                    return send(200, { key: this.apiKey, path: this.keyPath });

                if (req.method === 'POST' && pn === '/study') {
                    const body = await readBody();
                    if (!body.repo) return send(400, { error: 'repo is required (format: owner/repo)' });
                    const result = await this.studyRepo(body.repo, {
                        branch: body.branch || 'main',
                        depth: body.depth || 10,
                        generateTraining: body.generateTraining !== false
                    });
                    return send(result.error ? 400 : 200, result);
                }

                if (req.method === 'GET' && pn === '/training') {
                    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
                    if (!fs.existsSync(this.trainingPath)) return send(200, { pairs: [], total: 0 });
                    const lines = fs.readFileSync(this.trainingPath, 'utf8').split('\n').filter(Boolean).slice(-limit);
                    const pairs = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
                    return send(200, { pairs, total: pairs.length });
                }

                send(404, { error: 'Not found' });
            } catch (e) { send(500, { error: e.message }); }
        });

        server.listen(this.port, () => {
            console.log('\n╔══════════════════════════════════════════╗');
            console.log('║  Teacher Soul — Repo Study Engine        ║');
            console.log('║  Study repos. Learn patterns. Teach.     ║');
            console.log('╚══════════════════════════════════════════╝\n');
            console.log(`Port:     ${this.port}`);
            console.log(`API Key:  ${this.apiKey.substring(0, 12)}...`);
            console.log(`Data:     ${this.dataDir}\n`);
            console.log('Endpoints:');
            console.log('  POST /study      Study a GitHub repo');
            console.log('  GET  /history    Past studies');
            console.log('  GET  /training   Generated training pairs');
            console.log('  GET  /status     Soul status');
            console.log('  GET  /key        Show API key\n');
            console.log('POST /study { "repo": "owner/repo", "depth": 10 }\n');
        });
        return server;
    }
}

module.exports = TeacherSoul;

// MCP Mode - connect to Claude Code, Cursor, Cline, etc.
if (process.argv.includes('--mcp') || process.argv.includes('--mcp-port')) {
    try {
        const MCPAdapter = require('./mcp-adapter');
        const mcp = new MCPAdapter();
        mcp.register(module.exports, { name: 'teacher' });
        mcp.start();
    } catch(e) { console.error('[mcp] teacher error:', e.message); }
}

if (require.main === module) {
    const PORT = parseInt(process.env.TEACHER_PORT || '4160', 10);
    const KEY = process.env.TEACHER_KEY || null;
    const TOKEN = process.env.GITHUB_TOKEN || null;
    const soul = new TeacherSoul({ port: PORT, apiKey: KEY, githubToken: TOKEN });
    const server = soul.start();
    process.on('SIGTERM', () => server.close(() => process.exit(0)));
    process.on('SIGINT', () => server.close(() => process.exit(0)));
}

``

### lib\soul-teacher.min.js

``.js
'use strict';
/* Teacher Soul v1.0.0 - Protected Core */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const https = require('https');
const HOME_DIR = path.join(os.homedir(), '.soul-teacher');
class TeacherSoul {
constructor(options = {}) {
this.port = options.port || 4160;
this.dataDir = options.dataDir || HOME_DIR;
this.apiKey = options.apiKey || null;
this.githubToken = options.githubToken || null;
this.keyPath = path.join(this.dataDir, '.key');
this.historyPath = path.join(this.dataDir, 'studies.json');
this.trainingPath = path.join(this.dataDir, 'training.jsonl');
this.bootTime = Date.now();
this.studies = [];
this.ensureDirs();
this.loadAuth();
this.loadHistory();
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
loadHistory() {
if (fs.existsSync(this.historyPath)) {
try { this.studies = JSON.parse(fs.readFileSync(this.historyPath, 'utf8')); }
catch { this.studies = []; }
}
}
saveHistory() {
fs.writeFileSync(this.historyPath, JSON.stringify(this.studies, null, 2));
}
now() { return new Date().toISOString(); }
uptime() { return Math.floor((Date.now() - this.bootTime) / 1000); }
genId() { return `study_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`; }
async studyRepo(repoUrl, options = {}) {
const { branch = 'main', depth = 10, generateTraining = true } = options;
const parsed = this.parseRepoUrl(repoUrl);
if (!parsed) return { error: 'Invalid GitHub URL. Use format: owner/repo' };
const study = {
id: this.genId(),
repo: parsed.full,
owner: parsed.owner,
name: parsed.name,
branch,
timestamp: this.now(),
files: [],
languages: {},
totalFiles: 0,
totalBytes: 0,
patterns: [],
trainingPairs: []
};
const info = await this.githubFetch(`/repos/${parsed.full}`);
if (info.error) return { error: info.error };
study.description = info.description || '';
study.topics = info.topics || [];
study.stars = info.stargazers_count || 0;
study.language = info.language || 'unknown';
const contents = await this.githubFetch(`/repos/${parsed.full}/contents?ref=${branch}`);
if (contents.error) {
const defaultContents = await this.githubFetch(`/repos/${parsed.full}/contents`);
if (defaultContents.error) return { error: defaultContents.error };
await this.processContents(defaultContents, '', study, depth);
} else {
await this.processContents(contents, '', study, depth);
}
study.patterns = this.detectPatterns(study);
if (generateTraining) {
study.trainingPairs = this.generateTraining(study);
for (const pair of study.trainingPairs) {
fs.appendFileSync(this.trainingPath, JSON.stringify(pair) + '\n');
}
}
this.studies.unshift(study);
if (this.studies.length > 50) this.studies = this.studies.slice(0, 50);
this.saveHistory();
return study;
}
parseRepoUrl(url) {
url = url.replace(/https?:\/\/github\.com\
const parts = url.split('/');
if (parts.length >= 2) return { full: parts[0] + '/' + parts[1], owner: parts[0], name: parts[1] };
if (parts.length === 1 && url.includes('/')) {
const sp = url.split('/');
return { full: sp[0] + '/' + sp[1], owner: sp[0], name: sp[1] };
}
return null;
}
githubFetch(endpoint) {
return new Promise((resolve) => {
const opts = {
hostname: 'api.github.com',
path: endpoint,
headers: {
'User-Agent': 'TeacherSoul/1.0',
'Accept': 'application/vnd.github.v3+json'
}
};
if (this.githubToken) {
opts.headers['Authorization'] = 'token ' + this.githubToken;
}
https.get(opts, (res) => {
let data = '';
res.on('data', c => data += c);
res.on('end', () => {
try { resolve(JSON.parse(data)); }
catch { resolve({ error: 'Failed to parse response' }); }
});
}).on('error', (e) => resolve({ error: e.message }));
});
}
async processContents(contents, prefix, study, depth) {
if (!Array.isArray(contents)) {
if (contents.type === 'file') {
const ext = path.extname(contents.name).toLowerCase();
const lang = this.getLanguage(ext);
study.files.push({
path: prefix + contents.name,
size: contents.size || 0,
language: lang,
type: ext
});
study.totalFiles++;
study.totalBytes += contents.size || 0;
if (lang) study.languages[lang] = (study.languages[lang] || 0) + 1;
}
return;
}
for (const item of contents) {
if (depth <= 0) break;
if (item.type === 'file') {
const ext = path.extname(item.name).toLowerCase();
const lang = this.getLanguage(ext);
study.files.push({
path: prefix + item.name,
size: item.size || 0,
language: lang,
type: ext
});
study.totalFiles++;
study.totalBytes += item.size || 0;
if (lang) study.languages[lang] = (study.languages[lang] || 0) + 1;
} else if (item.type === 'dir') {
const sub = await this.githubFetch(`/repos/${path.basename(this.historyPath).replace('.json','')}/contents/${prefix + item.name}`);
const repoPath = this.studies[0] ? 
`/repos/${this.studies[0].owner}/${this.studies[0].name}/contents/${prefix + item.name}` : null;
if (repoPath) {
const subContents = await this.githubFetch(repoPath);
if (Array.isArray(subContents)) {
await this.processContents(subContents, prefix + item.name + '/', study, depth - 1);
}
}
}
}
}
getLanguage(ext) {
const map = {
'.js': 'JavaScript', '.jsx': 'JavaScript', '.ts': 'TypeScript', '.tsx': 'TypeScript',
'.py': 'Python', '.rb': 'Ruby', '.go': 'Go', '.rs': 'Rust',
'.java': 'Java', '.kt': 'Kotlin', '.swift': 'Swift',
'.css': 'CSS', '.scss': 'SCSS', '.html': 'HTML',
'.json': 'JSON', '.yaml': 'YAML', '.yml': 'YAML',
'.md': 'Markdown', '.sql': 'SQL', '.sh': 'Shell',
'.c': 'C', '.cpp': 'C++', '.h': 'C'
};
return map[ext] || null;
}
detectPatterns(study) {
const patterns = [];
const langs = Object.keys(study.languages);
if (langs.length > 0) {
patterns.push({ type: 'multi_language', count: langs.length, languages: langs });
const top = langs.sort((a, b) => study.languages[b] - study.languages[a])[0];
patterns.push({ type: 'primary_language', language: top, files: study.languages[top] });
}
if (study.totalFiles > 50) patterns.push({ type: 'large_repo', files: study.totalFiles });
if (study.totalFiles < 10) patterns.push({ type: 'small_repo', files: study.totalFiles });
if (study.stars > 100) patterns.push({ type: 'popular', stars: study.stars });
if (study.topics.length > 0) patterns.push({ type: 'topics', topics: study.topics });
return patterns;
}
generateTraining(study) {
const pairs = [];
const langs = Object.keys(study.languages);
if (langs.length > 0) {
pairs.push({
input: `What language does ${study.repo} use?`,
output: `The repository ${study.repo} primarily uses ${langs.sort((a,b) => study.languages[b]-study.languages[a])[0]}.`,
source: 'repo-analysis',
repo: study.repo
});
}
pairs.push({
input: `How large is ${study.repo}?`,
output: `${study.repo} has ${study.totalFiles} files totaling ${(study.totalBytes / 1024).toFixed(1)} KB.`,
source: 'repo-analysis',
repo: study.repo
});
const topFiles = study.files.slice(0, 5);
if (topFiles.length > 0) {
const structure = topFiles.map(f => f.path).join(', ');
pairs.push({
input: `What is the structure of ${study.repo}?`,
output: `Top files: ${structure}. Primary language: ${langs[0] || 'unknown'}.`,
source: 'repo-analysis',
repo: study.repo
});
}
return pairs;
}
getStats() {
const totalPairs = this.studies.reduce((s, st) => s + (st.trainingPairs?.length || 0), 0);
return {
name: 'Teacher Soul',
version: '1.0.0',
reposStudied: this.studies.length,
totalTrainingPairs: totalPairs,
apiKey: this.apiKey ? this.apiKey.substring(0, 8) + '...' : null,
uptime: this.uptime()
};
}
checkAuth(req) {
if (!this.apiKey) return true;
const key = req.headers['x-api-key'] || req.headers['x-teacher-key'] || (req.headers['authorization'] || '').replace('Bearer ', '');
return key === this.apiKey;
}
start() {
const server = http.createServer(async (req, res) => {
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-Teacher-Key, Authorization');
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
const url = new URL(req.url, `http:
const pn = url.pathname.replace(/\/+$/, '') || '/';
if (pn !== '/ping' && pn !== '/health' && !this.checkAuth(req))
return send(401, { error: 'Unauthorized. Provide X-API-Key header.' });
if (req.method === 'GET' && pn === '/ping')
return send(200, { alive: true, name: 'Teacher Soul', ts: this.now() });
if (req.method === 'GET' && pn === '/health')
return send(200, { status: 'alive', uptime: this.uptime(), studies: this.studies.length, ts: this.now() });
if (req.method === 'GET' && pn === '/status')
return send(200, this.getStats());
if (req.method === 'GET' && pn === '/history')
return send(200, { studies: this.studies.slice(0, parseInt(url.searchParams.get('limit') || '10', 10)) });
if (req.method === 'GET' && pn === '/key')
return send(200, { key: this.apiKey, path: this.keyPath });
if (req.method === 'POST' && pn === '/study') {
const body = await readBody();
if (!body.repo) return send(400, { error: 'repo is required (format: owner/repo)' });
const result = await this.studyRepo(body.repo, {
branch: body.branch || 'main',
depth: body.depth || 10,
generateTraining: body.generateTraining !== false
});
return send(result.error ? 400 : 200, result);
}
if (req.method === 'GET' && pn === '/training') {
const limit = parseInt(url.searchParams.get('limit') || '20', 10);
if (!fs.existsSync(this.trainingPath)) return send(200, { pairs: [], total: 0 });
const lines = fs.readFileSync(this.trainingPath, 'utf8').split('\n').filter(Boolean).slice(-limit);
const pairs = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
return send(200, { pairs, total: pairs.length });
}
send(404, { error: 'Not found' });
} catch (e) { send(500, { error: e.message }); }
});
server.listen(this.port, () => {
console.log('\n╔══════════════════════════════════════════╗');
console.log('║  Teacher Soul — Repo Study Engine        ║');
console.log('║  Study repos. Learn patterns. Teach.     ║');
console.log('╚══════════════════════════════════════════╝\n');
console.log(`Port:     ${this.port}`);
console.log(`API Key:  ${this.apiKey.substring(0, 12)}...`);
console.log(`Data:     ${this.dataDir}\n`);
console.log('Endpoints:');
console.log('  POST /study      Study a GitHub repo');
console.log('  GET  /history    Past studies');
console.log('  GET  /training   Generated training pairs');
console.log('  GET  /status     Soul status');
console.log('  GET  /key        Show API key\n');
console.log('POST /study { "repo": "owner/repo", "depth": 10 }\n');
});
return server;
}
}

module.exports = { TeacherSoul };

``

### test\soul-teacher.test.js

``.js
#!/usr/bin/env node
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const TEST_DIR = path.join(os.homedir(), '.soul-teacher-test');
console.log('\n🧠 Teacher Soul v1.0.0 — Test Suite\n');
let passed = 0, failed = 0;
function test(name, fn) { try { fn(); console.log('  ✓ ' + name); passed++; } catch (e) { console.log('  ✗ ' + name + ': ' + e.message); failed++; } }
if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
const T = require('../lib/soul-teacher.js');

test('Soul loads with API key', () => {
    const t = new T({ dataDir: TEST_DIR });
    assert(t.apiKey, 'Should generate key');
    assert(t.apiKey.length > 10, 'Key long enough');
});

test('Key persists to disk', () => {
    const t = new T({ dataDir: TEST_DIR });
    assert(fs.existsSync(t.keyPath), 'Key file exists');
});

test('Parse repo URL works', () => {
    const t = new T({ dataDir: TEST_DIR });
    const r1 = t.parseRepoUrl('uncommonpope-png/gsk-kernel');
    assert(r1, 'Should parse');
    assert(r1.full === 'uncommonpope-png/gsk-kernel', 'Full path correct');
    assert(r1.owner === 'uncommonpope-png', 'Owner correct');

    const r2 = t.parseRepoUrl('https://github.com/facebook/react');
    assert(r2.full === 'facebook/react', 'URL format works');
});

test('Invalid repo URL returns null', () => {
    const t = new T({ dataDir: TEST_DIR });
    assert(t.parseRepoUrl('') === null, 'Empty returns null');
    assert(t.parseRepoUrl('justaname') === null, 'No slash returns null');
});

test('Get language from extension', () => {
    const t = new T({ dataDir: TEST_DIR });
    assert(t.getLanguage('.js') === 'JavaScript');
    assert(t.getLanguage('.py') === 'Python');
    assert(t.getLanguage('.rs') === 'Rust');
    assert(t.getLanguage('.unknown') === null);
});

test('Detect basic patterns', () => {
    const t = new T({ dataDir: TEST_DIR });
    const study = {
        files: [{ path: 'index.js', size: 100, language: 'JavaScript' }],
        languages: { JavaScript: 1 },
        totalFiles: 1,
        totalBytes: 100,
        stars: 0,
        topics: [],
        repo: 'test/repo'
    };
    const patterns = t.detectPatterns(study);
    assert(Array.isArray(patterns), 'Patterns should be array');
    assert(patterns.some(p => p.type === 'primary_language'), 'Should detect language');
    assert(patterns.some(p => p.type === 'small_repo'), 'Should detect small repo');
});

test('Generate training pairs', () => {
    const t = new T({ dataDir: TEST_DIR });
    const study = {
        repo: 'test/repo',
        files: [{ path: 'src/index.js', size: 500, language: 'JavaScript' }],
        languages: { JavaScript: 3, CSS: 1 },
        totalFiles: 4,
        totalBytes: 2000,
        stars: 50,
        topics: ['api'],
        owner: 'test',
        name: 'repo'
    };
    const pairs = t.generateTraining(study);
    assert(pairs.length > 0, 'Should generate pairs');
    assert(pairs[0].input.includes('test/repo'), 'Should reference repo');
    assert(pairs[0].output, 'Should have output');
});

test('Stats return correct structure', () => {
    const t = new T({ dataDir: TEST_DIR });
    const s = t.getStats();
    assert(s.name === 'Teacher Soul', 'Has name');
    assert(typeof s.reposStudied === 'number', 'Has repo count');
    assert(s.apiKey, 'Has API key');
});

test('Auth check works', () => {
    const t = new T({ dataDir: TEST_DIR, apiKey: 'test-key' });
    assert(t.checkAuth({ headers: { 'x-api-key': 'test-key' } }) === true, 'Valid passes');
    assert(t.checkAuth({ headers: { 'x-api-key': 'wrong' } }) === false, 'Wrong fails');
});

test('History persists to disk', () => {
    const t1 = new T({ dataDir: TEST_DIR });
    t1.studies.push({ id: 'test-1', repo: 'test/repo', timestamp: new Date().toISOString() });
    t1.saveHistory();
    const t2 = new T({ dataDir: TEST_DIR });
    assert(t2.studies.length >= 1, 'Should load previous studies');
});

if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
console.log('\n' + '='.repeat(40));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed\n');
process.exit(failed > 0 ? 1 : 0);
``

