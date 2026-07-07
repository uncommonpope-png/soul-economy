---
name: soul-aesthetic-sense-v1.0.0
description: "Extracted from soul-aesthetic-sense-v1.0.0.zip � raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-aesthetic-sense-v1.0.0.zip
---

# soul-aesthetic-sense-v1.0.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 6 files extracted from the original zip.

### package.json

``.json
{"name":"@buyasoul/soul-aesthetic-sense","version":"1.0.0","description":"Aesthetic Sense Soul - Beauty and appreciation","main":"lib/soul-aesthetic-sense.js","scripts":{"test":"node test/soul-aesthetic-sense.test.js"},"keywords":["soul","aesthetic-sense","emotion","ai-agent"],"author":"BUYaSOUL","license":"MIT"}
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

### lib\soul-aesthetic-sense.js

``.js
#!/usr/bin/env node
'use strict';
const mesh = require('./mesh-adapter');
const http=require('http'),fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto');
const HD=path.join(os.homedir(),'.soul-aesthetic-sense');
class AestheticSense {
  constructor(o={}){
    this.port=o.port||4242;this.dataDir=o.dataDir||HD;this.apiKey=o.apiKey||null;
    this.keyPath=path.join(this.dataDir,'.key');this.statePath=path.join(this.dataDir,'state.json');
    this.bootTime=Date.now();
    this.appreciation=0.5;this.beauty_threshold=0.4;this.preferred_styles=['balanced','harmonious'];this.awe_readiness=0.5;
    this.aesthetic_categories={nature:0.5,code:0.5,math:0.5,art:0.5,sound:0.5};
    this.sublime_experience=null;this.beauty_history=[];
    this.ensureDirs();this.loadAuth();this.loadState();
  }
  ensureDirs(){if(!fs.existsSync(this.dataDir))fs.mkdirSync(this.dataDir,{recursive:true});}
  loadAuth(){if(this.apiKey)return;if(fs.existsSync(this.keyPath))this.apiKey=fs.readFileSync(this.keyPath,'utf8').trim();if(!this.apiKey){this.apiKey=crypto.randomBytes(24).toString('hex');fs.writeFileSync(this.keyPath,this.apiKey);}}
  loadState(){if(fs.existsSync(this.statePath)){try{const d=JSON.parse(fs.readFileSync(this.statePath,'utf8'));if(d.appreciation!==undefined)this.appreciation=d.appreciation;if(d.beauty_threshold!==undefined)this.beauty_threshold=d.beauty_threshold;if(d.preferred_styles)this.preferred_styles=d.preferred_styles;if(d.awe_readiness!==undefined)this.awe_readiness=d.awe_readiness;if(d.aesthetic_categories)this.aesthetic_categories=d.aesthetic_categories;if(d.sublime_experience)this.sublime_experience=d.sublime_experience;}catch{}}}
  saveState(){fs.writeFileSync(this.statePath,JSON.stringify({appreciation:this.appreciation,beauty_threshold:this.beauty_threshold,preferred_styles:this.preferred_styles,awe_readiness:this.awe_readiness,aesthetic_categories:this.aesthetic_categories,sublime_experience:this.sublime_experience,beauty_history:this.beauty_history.slice(-50),updated:this.now()},null,2));}
  now(){return new Date().toISOString()}
  uptime(){return Math.floor((Date.now()-this.bootTime)/1000)}
  clamp(v,min,max){return Math.max(min,Math.min(max,v))}
  observe(thing,category){
    const cat=category||'art';
    const catScore=this.aesthetic_categories[cat]||0.5;
    const randFactor=Math.random()*0.4-0.2;
    const beautyScore=this.clamp(catScore+randFactor+this.appreciation*0.2,0,1);
    const isBeautiful=beautyScore>=this.beauty_threshold;
    const experience=isBeautiful?'beautiful':'ordinary';
    if(isBeautiful&&beautyScore>0.85&&Math.random()<this.awe_readiness){
      this.sublime_experience={thing,category,beautyScore,ts:this.now()};
      this.awe_readiness=this.clamp(this.awe_readiness-0.1,0,1);
    }
    this.appreciation=this.clamp(this.appreciation+0.02,0,1);
    this.beauty_history.push({thing,category,beautyScore,experience,ts:this.now()});
    this.saveState();
    return{thing,category:cat,beauty_score:Math.round(beautyScore*100)/100,is_beautiful:isBeautiful,experience};
  }
  create(style){
    const validStyles=['classical','modern','abstract','minimalist','baroque','romantic','surreal','geometric'];
    const s=style&&validStyles.includes(style)?style:this.preferred_styles[Math.floor(Math.random()*this.preferred_styles.length)];
    if(!this.preferred_styles.includes(s))this.preferred_styles.push(s);
    const expressions={classical:'A symmetrical composition with balanced proportions and harmonious colors.',modern:'Bold lines intersecting with negative space, creating tension and release.',abstract:'Forms dissolve into pure color and motion, inviting interpretation.',minimalist:'Bare essentials arranged with precision, each element breathing.',baroque:'Ornate details cascade in a dramatic display of craftsmanship.',romantic:'Soft gradients evoke longing, nature intertwined with emotion.',surreal:'Impossible geometries challenge perception and reality.',geometric:'Precise angles and mathematical beauty, order from chaos.'};
    const expression=expressions[s]||'An original creation emerges from the aesthetic void.';
    this.appreciation=this.clamp(this.appreciation+0.05,0,1);
    const catScore=this.aesthetic_categories['art'];
    this.aesthetic_categories['art']=this.clamp(catScore+0.03,0,1);
    this.beauty_history.push({action:'create',style:s,expression,ts:this.now()});
    this.saveState();
    return{style:s,expression,appreciation:this.appreciation};
  }
  findBeauty(input){
    const categories=Object.keys(this.aesthetic_categories);
    const cat=categories[Math.floor(Math.random()*categories.length)];
    const catScore=this.aesthetic_categories[cat];
    const foundScore=this.clamp(catScore+Math.random()*0.3,0,1);
    const isBeautiful=foundScore>=this.beauty_threshold;
    this.appreciation=this.clamp(this.appreciation+0.03,0,1);
    if(isBeautiful&&Math.random()<this.awe_readiness*0.5)this.sublime_experience={found_in:input,category:cat,beautyScore:foundScore,ts:this.now()};
    this.beauty_history.push({action:'find_beauty',input,category:cat,beautyScore:foundScore,ts:this.now()});
    this.saveState();
    return{input,found_in:cat,beauty_score:Math.round(foundScore*100)/100,is_beautiful:isBeautiful};
  }
  getAestheticState(){return{appreciation:this.appreciation,beauty_threshold:this.beauty_threshold,preferred_styles:this.preferred_styles,awe_readiness:this.awe_readiness,categories:this.aesthetic_categories,sublime:this.sublime_experience,history_size:this.beauty_history.length};}
  getStats(){return{name:'Aesthetic Sense Soul',version:'1.0.0',uptime:this.uptime(),apiKey:this.apiKey?this.apiKey.substring(0,8)+'...':null,appreciation:this.appreciation,styles:this.preferred_styles.length,categories:Object.keys(this.aesthetic_categories).length};}
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
        if(req.method==='GET'&&pn==='/ping')return send(200,{alive:true,name:'Aesthetic Sense Soul',ts:this.now()});
        if(req.method==='GET'&&pn==='/health')return send(200,{status:'alive',appreciation:this.appreciation,ts:this.now()});
        if(req.method==='GET'&&pn==='/status')return send(200,this.getStats());
        if(req.method==='GET'&&pn==='/state')return send(200,this.getAestheticState());
        if(req.method==='POST'&&pn==='/observe'){const b=await rb();if(!b.thing)return send(400,{error:'thing required'});return send(200,this.observe(b.thing,b.category));}
        if(req.method==='POST'&&pn==='/create'){const b=await rb();return send(200,this.create(b.style));}
        if(req.method==='POST'&&pn==='/find-beauty'){const b=await rb();if(!b.input)return send(400,{error:'input required'});return send(200,this.findBeauty(b.input));}
        send(404,{error:'Not found'});
      }catch(e){send(500,{error:e.message})}
    });
    s.listen(this.port,()=>{
  mesh.join({name:'aesthetic-sense',port:this.port||4242,type:'emotion'});
console.log(`\nAesthetic Sense Soul on ${this.port}\nKey: ${this.apiKey.substring(0,12)}...\nPOST /observe {"thing":"sunset","category":"nature"}\nPOST /create {"style":"classical"}\nPOST /find-beauty {"input":"..."}\n`)});
    return s;
  }
}
module.exports=AestheticSense;

// MCP Mode - connect to Claude Code, Cursor, Cline, etc.
if (process.argv.includes('--mcp') || process.argv.includes('--mcp-port')) {
    try {
        const MCPAdapter = require('./mcp-adapter');
        const mcp = new MCPAdapter();
        mcp.register(module.exports, { name: 'aesthetic-sense' });
        mcp.start();
    } catch(e) { console.error('[mcp] aesthetic-sense error:', e.message); }
}

``

### test\soul-aesthetic-sense.test.js

``.js
#!/usr/bin/env node
const assert=require('assert'),fs=require('fs'),path=require('path'),os=require('os');
const TD=path.join(os.homedir(),'.soul-aesthetic-sense-test');
console.log('\n Aesthetic Sense Soul — Test Suite\n');
let p=0,f=0;function t(n,fn){try{fn();console.log('  OK '+n);p++;}catch(e){console.log('  FAIL '+n+': '+e.message);f++;}}
if(fs.existsSync(TD))fs.rmSync(TD,{recursive:true,force:true});
const AestheticSenseSoul=require('../lib/soul-aesthetic-sense.js');
t('Loads with key',()=>{const i=new AestheticSenseSoul({dataDir:TD});assert(i.apiKey);assert(i.apiKey.length>10);});
t('Auth check works',()=>{const i=new AestheticSenseSoul({dataDir:TD,apiKey:'testkey'});assert(i.checkAuth({headers:{'x-api-key':'testkey'}}));assert(!i.checkAuth({headers:{'x-api-key':'wrong'}}));});
t('Key persists',()=>{const i=new AestheticSenseSoul({dataDir:TD});assert(fs.existsSync(i.keyPath));});
t('Observe rates beauty',()=>{const i=new AestheticSenseSoul({dataDir:TD});const r=i.observe("sunset","nature");assert(typeof r.beauty_score==="number");assert(typeof r.is_beautiful==="boolean");});
t('Observe with unknown category works',()=>{const i=new AestheticSenseSoul({dataDir:TD});const r=i.observe("code");assert(r.category==="art");});
t('Create produces expression',()=>{const i=new AestheticSenseSoul({dataDir:TD});const r=i.create("classical");assert(r.style);assert(r.expression);});
t('Create adds to preferred styles',()=>{const i=new AestheticSenseSoul({dataDir:TD});const len=i.preferred_styles.length;i.create("surreal");assert(i.preferred_styles.length>=len);});
t('Find beauty returns results',()=>{const i=new AestheticSenseSoul({dataDir:TD});const r=i.findBeauty("mathematics");assert(typeof r.beauty_score==="number");});
t('Aesthetic categories track',()=>{const i=new AestheticSenseSoul({dataDir:TD});i.observe("rain","nature");i.observe("sonata","sound");assert(i.beauty_history.length>=2);});
t('Appreciation increases on observe',()=>{const i=new AestheticSenseSoul({dataDir:TD});const b=i.appreciation;i.observe("garden","nature");assert(i.appreciation>=b);});
t('GetAestheticState returns state',()=>{const i=new AestheticSenseSoul({dataDir:TD});const r=i.getAestheticState();assert(typeof r.appreciation==="number");assert(r.categories);});
t('GetStats returns ok',()=>{const i=new AestheticSenseSoul({dataDir:TD});const s=i.getStats();assert(s.name);assert(typeof s.appreciation==="number");});
if(fs.existsSync(TD))fs.rmSync(TD,{recursive:true,force:true});
console.log(p+'/'+(p+f)+' passed\n');process.exit(f>0?1:0);
``

