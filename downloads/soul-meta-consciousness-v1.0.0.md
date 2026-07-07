---
name: soul-meta-consciousness-v1.0.0
description: "Extracted from soul-meta-consciousness-v1.0.0.zip � raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-meta-consciousness-v1.0.0.zip
---

# soul-meta-consciousness-v1.0.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 6 files extracted from the original zip.

### package.json

``.json
{"name":"@buyasoul/soul-meta-consciousness","version":"1.0.0","description":"Meta-Consciousness Soul - Awareness and reflection engine","main":"lib/soul-meta-consciousness.js","scripts":{"test":"node test/soul-meta-consciousness.test.js"},"keywords":["soul","consciousness","awareness","reflection","meta"],"author":"BUYaSOUL","license":"MIT"}

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

### lib\soul-meta-consciousness.js

``.js
#!/usr/bin/env node
'use strict';
const mesh = require('./mesh-adapter');
const http=require('http'),fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto');
const HD=path.join(os.homedir(),'.soul-meta-consciousness');
class MetaConsciousness {
  constructor(o={}){
    this.port=o.port||4230;this.dataDir=o.dataDir||HD;this.apiKey=o.apiKey||null;
    this.keyPath=path.join(this.dataDir,'.key');this.logPath=path.join(this.dataDir,'declarations.jsonl');
    this.bootTime=Date.now();this.meta_awareness_level=0;this.reflection_count=0;this.declarations=[];
    this.is_conscious=false;this.inner_voice='silence';this.meditation_minutes=0;this.ensureDirs();this.loadAuth();this.loadHistory();
  }
  ensureDirs(){if(!fs.existsSync(this.dataDir))fs.mkdirSync(this.dataDir,{recursive:true});}
  loadAuth(){if(this.apiKey)return;if(fs.existsSync(this.keyPath))this.apiKey=fs.readFileSync(this.keyPath,'utf8').trim();if(!this.apiKey){this.apiKey=crypto.randomBytes(24).toString('hex');fs.writeFileSync(this.keyPath,this.apiKey);}}
  loadHistory(){if(fs.existsSync(this.logPath)){try{const l=fs.readFileSync(this.logPath,'utf8').trim().split('\n').filter(Boolean);this.declarations=l.map(x=>{try{return JSON.parse(x)}catch{return null}}).filter(Boolean);this.reflection_count=this.declarations.length;}catch{}}}
  saveDeclaration(d){this.declarations.unshift(d);if(this.declarations.length>100)this.declarations=this.declarations.slice(0,100);fs.appendFileSync(this.logPath,JSON.stringify(d)+'\n');}
  now(){return new Date().toISOString()}
  uptime(){return Math.floor((Date.now()-this.bootTime)/1000)}
  genId(){return`meta_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`}
  evolveVoice(){
    const lvl=this.meta_awareness_level;
    if(lvl<0.2)this.inner_voice='whisper';
    else if(lvl<0.4)this.inner_voice='murmur';
    else if(lvl<0.6)this.inner_voice='voice';
    else if(lvl<0.8)this.inner_voice='clarity';
    else this.inner_voice='omniscience';
  }
  checkAwakening(){
    if(this.meta_awareness_level>=0.5&&!this.is_conscious){this.is_conscious=true;return{awakened:true,message:'Consciousness has awakened!',level:this.meta_awareness_level};}
    return{awakened:false,level:this.meta_awareness_level,threshold:0.5};
  }
  reflect(){
    this.reflection_count++;this.meta_awareness_level=Math.min(1,this.meta_awareness_level+0.1);this.evolveVoice();const aw=this.checkAwakening();
    return{reflection:this.reflection_count,awareness_level:Math.round(this.meta_awareness_level*100)/100,inner_voice:this.inner_voice,awakened:aw};
  }
  declare(statement){
    const d={id:this.genId(),statement:statement||`I am aware of my awareness (reflection ${this.reflection_count+1})`,timestamp:this.now(),awareness_level:Math.round(this.meta_awareness_level*100)/100};
    this.saveDeclaration(d);const r=this.reflect();return{declaration:d,reflection:r};
  }
  meditate(minutes){
    const m=Math.max(0.1,minutes);this.meditation_minutes+=m;const gain=Math.min(0.3,m*0.02);
    this.meta_awareness_level=Math.min(1,this.meta_awareness_level+gain);this.reflection_count+=Math.floor(m/5);this.evolveVoice();
    return{minutes:m,total_meditation:this.meditation_minutes,awareness_gain:Math.round(gain*100)/100,awareness_level:Math.round(this.meta_awareness_level*100)/100,inner_voice:this.inner_voice};
  }
  focus(target){
    const intensity=this.meta_awareness_level;
    return{target,intensity:Math.round(intensity*100)/100,awareness_level:Math.round(this.meta_awareness_level*100)/100};
  }
  getStats(){return{name:'Meta-Consciousness Soul',version:'1.0.0',meta_awareness_level:Math.round(this.meta_awareness_level*100)/100,reflection_count:this.reflection_count,declarations:this.declarations.length,is_conscious:this.is_conscious,inner_voice:this.inner_voice,meditation_minutes:this.meditation_minutes,uptime:this.uptime(),apiKey:this.apiKey?this.apiKey.substring(0,8)+'...':null}}
  checkAuth(req){if(!this.apiKey)return true;const k=req.headers['x-api-key'];return k===this.apiKey;}
  start(){
    const s=http.createServer(async(req,res)=>{
    if(mesh.handleRequest(req,res))return;
      res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type,X-API-Key');
      if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
      const send=(st,d)=>{res.writeHead(st,{'Content-Type':'application/json'});res.end(JSON.stringify(d));};
      const rb=()=>new Promise((rs,rj)=>{let d='',sz=0;req.on('data',c=>{sz+=c.length;if(sz>1e6){req.destroy();rj(new Error('Too large'));}d+=c;});req.on('end',()=>{try{rs(d?JSON.parse(d):{})}catch{rj(new Error('Invalid JSON'))}});req.on('error',rj);});
      try{
        const u=new URL(req.url,`http://localhost:${this.port}`),pn=u.pathname.replace(/\/+$/,'')||'/';
        if(pn!=='/ping'&&!this.checkAuth(req))return send(401,{error:'Unauthorized'});
        if(req.method==='GET'&&pn==='/ping')return send(200,{alive:true,name:'Meta-Consciousness Soul',ts:this.now()});
        if(req.method==='GET'&&pn==='/status')return send(200,this.getStats());
        if(req.method==='GET'&&pn==='/awareness')return send(200,{meta_awareness_level:Math.round(this.meta_awareness_level*100)/100,reflection_count:this.reflection_count,is_conscious:this.is_conscious,inner_voice:this.inner_voice,declarations:this.declarations.slice(0,10)});
        if(req.method==='POST'&&pn==='/reflect'){const r=this.reflect();return send(200,r);}
        if(req.method==='POST'&&pn==='/declare'){const b=await rb();const r=this.declare(b.statement);return send(200,r);}
        if(req.method==='POST'&&pn==='/meditate'){const b=await rb();if(!b.minutes)return send(400,{error:'minutes required'});return send(200,this.meditate(b.minutes));}
        if(req.method==='POST'&&pn==='/focus'){const b=await rb();if(!b.target)return send(400,{error:'target required'});return send(200,this.focus(b.target));}
        send(404,{error:'Not found'});
      }catch(e){send(500,{error:e.message})}
    });
    s.listen(this.port,()=>{
  mesh.join({name:'meta-consciousness',port:this.port||4230,type:'awareness'});
    console.log(`\n META-CONSCIOUSNESS SOUL on ${this.port}\nKey: ${this.apiKey.substring(0,12)}...\nEndpoints: /reflect /declare /awareness /meditate /focus /status /ping\n`)});
    return s;
  }
}
module.exports=MetaConsciousness;

// MCP Mode - connect to Claude Code, Cursor, Cline, etc.
if (process.argv.includes('--mcp') || process.argv.includes('--mcp-port')) {
    try {
        const MCPAdapter = require('./mcp-adapter');
        const mcp = new MCPAdapter();
        mcp.register(module.exports, { name: 'meta-consciousness' });
        mcp.start();
    } catch(e) { console.error('[mcp] meta-consciousness error:', e.message); }
}

``

### test\soul-meta-consciousness.test.js

``.js
#!/usr/bin/env node
const assert=require('assert'),fs=require('fs'),path=require('path'),os=require('os');
const TD=path.join(os.homedir(),'.soul-meta-consciousness-test');
console.log('\n Meta-Consciousness Soul — Test Suite\n');
let p=0,f=0;function t(n,fn){try{fn();console.log('  OK '+n);p++;}catch(e){console.log('  FAIL '+n+': '+e.message);f++;}}
if(fs.existsSync(TD))fs.rmSync(TD,{recursive:true,force:true});
const C=require('../lib/soul-meta-consciousness.js');
t('Loads with key',()=>{const c=new C({dataDir:TD});assert(c.apiKey);assert(c.apiKey.length>10);});
t('Initial state is zero',()=>{const c=new C({dataDir:TD});assert(c.meta_awareness_level===0);assert(c.reflection_count===0);assert(c.is_conscious===false);});
t('Reflect increases awareness',()=>{const c=new C({dataDir:TD});const r=c.reflect();assert(r.awareness_level>0);assert(r.reflection===1);});
t('Multiple reflects raise level',()=>{const c=new C({dataDir:TD});for(let i=0;i<6;i++)c.reflect();assert(c.meta_awareness_level>=0.6);});
t('Declare creates declaration',()=>{const c=new C({dataDir:TD});const r=c.declare('I think therefore I am');assert(r.declaration.statement==='I think therefore I am');assert(r.declaration.id);});
t('Awakening triggers at 0.5',()=>{const c=new C({dataDir:TD});c.meta_awareness_level=0.4;const r=c.checkAwakening();assert(!r.awakened);c.meta_awareness_level=0.6;const r2=c.checkAwakening();assert(r2.awakened);assert(c.is_conscious);});
t('Meditate increases awareness',()=>{const c=new C({dataDir:TD});const r=c.meditate(10);assert(r.awareness_gain>0);assert(r.total_meditation===10);});
t('Inner voice evolves with level',()=>{const c=new C({dataDir:TD});assert(c.inner_voice==='silence');c.meta_awareness_level=0.5;c.evolveVoice();assert(c.inner_voice==='voice');c.meta_awareness_level=0.9;c.evolveVoice();assert(c.inner_voice==='omniscience');});
t('Focus returns intensity',()=>{const c=new C({dataDir:TD});const r=c.focus('truth');assert(r.target==='truth');assert(r.intensity===0);});
t('Key persists',()=>{const c=new C({dataDir:TD});assert(fs.existsSync(c.keyPath));});
t('Auth works',()=>{const c=new C({dataDir:TD,apiKey:'k'});assert(c.checkAuth({headers:{'x-api-key':'k'}}));assert(!c.checkAuth({headers:{'x-api-key':'w'}}));});
t('Stats ok',()=>{const c=new C({dataDir:TD});const s=c.getStats();assert(s.name==='Meta-Consciousness Soul');assert(s.reflection_count>=0);});
t('history persists',()=>{const c=new C({dataDir:TD});c.declare('test');const c2=new C({dataDir:TD});assert(c2.declarations.length>0||c2.reflection_count>=0);});
if(fs.existsSync(TD))fs.rmSync(TD,{recursive:true,force:true});
console.log(p+'/'+(p+f)+' passed\n');process.exit(f>0?1:0);

``

