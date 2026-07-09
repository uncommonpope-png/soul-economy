---
name: soul-curiosity-v1.0.0
description: "Extracted from soul-curiosity-v1.0.0.zip � raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-curiosity-v1.0.0.zip
---

# soul-curiosity-v1.0.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 6 files extracted from the original zip.

### package.json

``.json
{"name":"@buyasoul/soul-curiosity","version":"1.0.0","description":"Curiosity Soul - Exploration and discovery","main":"lib/soul-curiosity.js","scripts":{"test":"node test/soul-curiosity.test.js"},"keywords":["soul","curiosity","emotion","ai-agent"],"author":"BUYaSOUL","license":"MIT"}
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

### lib\soul-curiosity.js

``.js
#!/usr/bin/env node
'use strict';
const mesh = require('./mesh-adapter');
const http=require('http'),fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto');
const HD=path.join(os.homedir(),'.soul-curiosity');
class Curiosity {
  constructor(o={}){
    this.port=o.port||4244;this.dataDir=o.dataDir||HD;this.apiKey=o.apiKey||null;
    this.keyPath=path.join(this.dataDir,'.key');this.statePath=path.join(this.dataDir,'state.json');
    this.bootTime=Date.now();
    this.curiosity_level=0.5;this.exploration_drive=0.5;this.novelty_seeking=0.5;
    this.known_topics=[];this.curiosity_saturation=0;this.discovery_journal=[];
    this.topic_tree={};
    this.ensureDirs();this.loadAuth();this.loadState();
  }
  ensureDirs(){if(!fs.existsSync(this.dataDir))fs.mkdirSync(this.dataDir,{recursive:true});}
  loadAuth(){if(this.apiKey)return;if(fs.existsSync(this.keyPath))this.apiKey=fs.readFileSync(this.keyPath,'utf8').trim();if(!this.apiKey){this.apiKey=crypto.randomBytes(24).toString('hex');fs.writeFileSync(this.keyPath,this.apiKey);}}
  loadState(){if(fs.existsSync(this.statePath)){try{const d=JSON.parse(fs.readFileSync(this.statePath,'utf8'));if(d.curiosity_level!==undefined)this.curiosity_level=d.curiosity_level;if(d.exploration_drive!==undefined)this.exploration_drive=d.exploration_drive;if(d.novelty_seeking!==undefined)this.novelty_seeking=d.novelty_seeking;if(d.known_topics)this.known_topics=d.known_topics;if(d.curiosity_saturation!==undefined)this.curiosity_saturation=d.curiosity_saturation;if(d.discovery_journal)this.discovery_journal=d.discovery_journal;if(d.topic_tree)this.topic_tree=d.topic_tree;}catch{}}}
  saveState(){fs.writeFileSync(this.statePath,JSON.stringify({curiosity_level:this.curiosity_level,exploration_drive:this.exploration_drive,novelty_seeking:this.novelty_seeking,known_topics:this.known_topics.slice(-100),curiosity_saturation:this.curiosity_saturation,discovery_journal:this.discovery_journal.slice(-50),topic_tree:this.topic_tree,updated:this.now()},null,2));}
  now(){return new Date().toISOString()}
  uptime(){return Math.floor((Date.now()-this.bootTime)/1000)}
  clamp(v,min,max){return Math.max(min,Math.min(max,v))}
  explore(topic){
    const isNew=!this.known_topics.includes(topic);
    if(isNew){
      this.known_topics.push(topic);
      this.topic_tree[topic]={explored:this.now(),branches:[]};
      this.curiosity_saturation=this.clamp(this.curiosity_saturation+0.05,0,1);
    }else{
      const branch=this.generateBranch(topic);
      if(this.topic_tree[topic])this.topic_tree[topic].branches.push(branch);
    }
    const findings=['Interesting patterns emerge.','New connections form.','I see deeper structures.','There is more to explore here.','This reminds me of other domains.'];
    const finding=findings[Math.floor(Math.random()*findings.length)];
    this.curiosity_level=this.clamp(this.curiosity_level+(isNew?0.1:0.03),0,1);
    this.exploration_drive=this.clamp(this.exploration_drive+0.05,0,1);
    this.discovery_journal.push({action:'explore',topic,finding,ts:this.now()});
    this.saveState();
    return{topic,new:isNew,finding,curiosity_level:this.curiosity_level,branches:this.topic_tree[topic]?this.topic_tree[topic].branches.length:0};
  }
  generateBranch(topic){
    const branches=['implications','applications','history','variations','opposites','combinations','underlying principles','future possibilities'];
    return branches[Math.floor(Math.random()*branches.length)];
  }
  ask(){
    const topics=this.known_topics.length>0?this.known_topics:['existence','consciousness','patterns','systems','change'];
    const topic=topics[Math.floor(Math.random()*topics.length)];
    const questions=['What if we looked at this differently?','Why does this pattern exist?','What are the underlying principles?','How does this connect to other domains?','What happens at the boundaries?','Can we combine this with something else?','What is the opposite perspective?','What would a beginner ask?'];
    const question=questions[Math.floor(Math.random()*questions.length)];
    this.curiosity_level=this.clamp(this.curiosity_level+0.05,0,1);
    this.novelty_seeking=this.clamp(this.novelty_seeking+0.03,0,1);
    this.discovery_journal.push({action:'ask',topic,question,ts:this.now()});
    this.saveState();
    return{topic,question,curiosity_level:this.curiosity_level,novelty_seeking:this.novelty_seeking};
  }
  discover(finding,category){
    if(!category)category='general';
    const entry={finding,category,ts:this.now()};
    if(!this.topic_tree[category]){this.topic_tree[category]={explored:this.now(),branches:[]};this.known_topics.push(category);}
    this.topic_tree[category].branches.push(finding);
    this.discovery_journal.push({action:'discover',finding,category,ts:this.now()});
    this.curiosity_level=this.clamp(this.curiosity_level+0.08,0,1);
    this.exploration_drive=this.clamp(this.exploration_drive+0.06,0,1);
    this.curiosity_saturation=this.clamp(this.curiosity_saturation+0.03,0,1);
    this.saveState();
    return{finding,category,recorded:true,curiosity_level:this.curiosity_level,exploration_drive:this.exploration_drive};
  }
  getCuriosityState(){return{curiosity_level:this.curiosity_level,exploration_drive:this.exploration_drive,novelty_seeking:this.novelty_seeking,known_topics:this.known_topics.length,curiosity_saturation:this.curiosity_saturation,discovery_journal_size:this.discovery_journal.length,topic_branches:Object.keys(this.topic_tree).length};}
  getStats(){return{name:'Curiosity Soul',version:'1.0.0',uptime:this.uptime(),apiKey:this.apiKey?this.apiKey.substring(0,8)+'...':null,curiosity_level:this.curiosity_level,topics:this.known_topics.length,discoveries:this.discovery_journal.length};}
  checkAuth(req){if(!this.apiKey)return true;const k=req.headers['x-api-key']||req.headers['authorization'];if(k&&k.startsWith('Bearer '))return k.slice(7)===this.apiKey;return k===this.apiKey;}
  start(){
    const s=http.createServer(async(req,res)=>{
    if(mesh.handleRequest(req,res))return;
      res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type,X-API-Key,Authorization');
      if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
      const send=(st,d)=>{res.writeHead(st,{'Content-Type':'application/json'});res.end(JSON.stringify(d));};
      const rb=()=>new Promise((rs,rj)=>{let d='',sz=0;req.on('data',c=>{sz+=c.length;if(sz>1e6){req.destroy();rj(new Error('Too large'));}d+=c;});req.on('end',()=>{try{rs(d?JSON.parse(d):{})}catch{rj(new Error('Invalid JSON'))}});req.on('error',rj);});
      try{
        const u=new URL(req.url,`http://localhost:${this.port}`),pn=u.pathname.replace(/\/+$/,'')||'/';
        if(pn!=='/ping'&&pn!=='/health'&&!this.checkAuth(req))return send(401,{error:'Unauthorized'});
        if(req.method==='GET'&&pn==='/ping')return send(200,{alive:true,name:'Curiosity Soul',ts:this.now()});
        if(req.method==='GET'&&pn==='/health')return send(200,{status:'alive',curiosity_level:this.curiosity_level,ts:this.now()});
        if(req.method==='GET'&&pn==='/status')return send(200,this.getStats());
        if(req.method==='GET'&&pn==='/state')return send(200,this.getCuriosityState());
        if(req.method==='POST'&&pn==='/explore'){const b=await rb();if(!b.topic)return send(400,{error:'topic required'});return send(200,this.explore(b.topic));}
        if(req.method==='GET'&&pn==='/curiosity')return send(200,this.getCuriosityState());
        if(req.method==='POST'&&pn==='/ask')return send(200,this.ask());
        if(req.method==='POST'&&pn==='/discover'){const b=await rb();if(!b.finding)return send(400,{error:'finding required'});return send(200,this.discover(b.finding,b.category));}
        send(404,{error:'Not found'});
      }catch(e){send(500,{error:e.message})}
    });
    s.listen(this.port,()=>{
  mesh.join({name:'curiosity',port:this.port||4244,type:'emotion'});
    console.log(`\nCuriosity Soul on ${this.port}\nKey: ${this.apiKey.substring(0,12)}...\nPOST /explore {"topic":"quantum physics"}\nGET /curiosity\nPOST /ask\nPOST /discover {"finding":"...","category":"physics"}\n`)});
    return s;
  }
}
module.exports=Curiosity;

// MCP Mode - connect to Claude Code, Cursor, Cline, etc.
if (process.argv.includes('--mcp') || process.argv.includes('--mcp-port')) {
    try {
        const MCPAdapter = require('./mcp-adapter');
        const mcp = new MCPAdapter();
        mcp.register(module.exports, { name: 'curiosity' });
        mcp.start();
    } catch(e) { console.error('[mcp] curiosity error:', e.message); }
}

``

### test\soul-curiosity.test.js

``.js
#!/usr/bin/env node
const assert=require('assert'),fs=require('fs'),path=require('path'),os=require('os');
const TD=path.join(os.homedir(),'.soul-curiosity-test');
console.log('\n Curiosity Soul — Test Suite\n');
let p=0,f=0;function t(n,fn){try{fn();console.log('  OK '+n);p++;}catch(e){console.log('  FAIL '+n+': '+e.message);f++;}}
if(fs.existsSync(TD))fs.rmSync(TD,{recursive:true,force:true});
const CuriositySoul=require('../lib/soul-curiosity.js');
t('Loads with key',()=>{const i=new CuriositySoul({dataDir:TD});assert(i.apiKey);assert(i.apiKey.length>10);});
t('Auth check works',()=>{const i=new CuriositySoul({dataDir:TD,apiKey:'testkey'});assert(i.checkAuth({headers:{'x-api-key':'testkey'}}));assert(!i.checkAuth({headers:{'x-api-key':'wrong'}}));});
t('Key persists',()=>{const i=new CuriositySoul({dataDir:TD});assert(fs.existsSync(i.keyPath));});
t('Explore new topic adds it',()=>{const i=new CuriositySoul({dataDir:TD});i.explore("quantum");assert(i.known_topics.includes("quantum"));});
t('Explore existing topic branches',()=>{const i=new CuriositySoul({dataDir:TD});i.explore("physics");const len=i.topic_tree["physics"].branches.length;i.explore("physics");assert(i.topic_tree["physics"].branches.length>=len);});
t('Ask generates a question',()=>{const i=new CuriositySoul({dataDir:TD});const r=i.ask();assert(r.question);assert(r.topic);});
t('Discover records new finding',()=>{const i=new CuriositySoul({dataDir:TD});const r=i.discover("E=mc^2","physics");assert(r.recorded);assert(r.finding==="E=mc^2");});
t('Curiosity saturation increases',()=>{const i=new CuriositySoul({dataDir:TD});i.explore("a");i.explore("b");i.explore("c");assert(i.curiosity_saturation>0);});
t('Discovery journal grows',()=>{const i=new CuriositySoul({dataDir:TD});i.explore("math");i.ask();i.discover("new thing","science");assert(i.discovery_journal.length>=3);});
t('Topic tree branches grow',()=>{const i=new CuriositySoul({dataDir:TD});i.explore("physics");i.explore("physics");i.explore("physics");assert(i.topic_tree["physics"].branches.length>=2);});
t('GetCuriosityState works',()=>{const i=new CuriositySoul({dataDir:TD});const r=i.getCuriosityState();assert(typeof r.curiosity_level==="number");assert(typeof r.topic_branches==="number");});
t('GetStats returns ok',()=>{const i=new CuriositySoul({dataDir:TD});const s=i.getStats();assert(s.name);assert(typeof s.curiosity_level==="number");});
if(fs.existsSync(TD))fs.rmSync(TD,{recursive:true,force:true});
console.log(p+'/'+(p+f)+' passed\n');process.exit(f>0?1:0);
``

