---
name: soul-swarm-v1.0.0
description: "Extracted from soul-swarm-v1.0.0.zip � raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-swarm-v1.0.0.zip
---

# soul-swarm-v1.0.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 6 files extracted from the original zip.

### package.json

``.json
{"name":"@buyasoul/soul-swarm","version":"1.0.0","description":"Swarm Soul - Multi-agent team coordination and mesh networking","main":"lib/soul-swarm.js","scripts":{"test":"node test/soul-swarm.test.js"},"keywords":["soul","swarm","agents","mesh","team","ai-agent"],"author":"BUYaSOUL","license":"MIT"}
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

### lib\soul-swarm.js

``.js
#!/usr/bin/env node
'use strict';
const mesh = require('./mesh-adapter');
const http=require('http'),fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto');
const HD=path.join(os.homedir(),'.soul-swarm');
class SwarmSoul{
  constructor(o={}){
    this.port=o.port||4200;this.dataDir=o.dataDir||HD;this.apiKey=o.apiKey||null;
    this.keyPath=path.join(this.dataDir,'.key');this.swarmPath=path.join(this.dataDir,'swarms.json');
    this.bootTime=Date.now();this.swarms={};this.ensureDirs();this.loadAuth();this.loadSwarms();
  }
  ensureDirs(){if(!fs.existsSync(this.dataDir))fs.mkdirSync(this.dataDir,{recursive:true});}
  loadAuth(){if(this.apiKey)return;if(fs.existsSync(this.keyPath))this.apiKey=fs.readFileSync(this.keyPath,'utf8').trim();if(!this.apiKey){this.apiKey=crypto.randomBytes(24).toString('hex');fs.writeFileSync(this.keyPath,this.apiKey);}}
  loadSwarms(){if(fs.existsSync(this.swarmPath)){try{this.swarms=JSON.parse(fs.readFileSync(this.swarmPath,'utf8'))}catch{this.swarms={}}}}
  saveSwarms(){fs.writeFileSync(this.swarmPath,JSON.stringify(this.swarms,null,2));}
  now(){return new Date().toISOString()}
  uptime(){return Math.floor((Date.now()-this.bootTime)/1000)}
  genId(){return crypto.randomBytes(4).toString('hex')}

  ROLES={
    leader:{name:'Leader',desc:'Orchestrates, assigns tasks, makes final decisions',cap:['coordinate','decide','delegate']},
    worker:{name:'Worker',desc:'Executes tasks, produces output',cap:['build','fix','implement']},
    scout:{name:'Scout',desc:'Explores, researches, gathers intel',cap:['search','analyze','report']},
    sentinel:{name:'Sentinel',desc:'Monitors, alerts, protects',cap:['watch','alert','guard']},
    carrier:{name:'Carrier',desc:'Transports data between agents',cap:['relay','bridge','sync']}
  };

  createSwarm(name,options={}){
    const{size=5,roles=[]}=options;
    const id=this.genId();
    const agents=[];
    const roleKeys=roles.length?roles:Object.keys(this.ROLES);
    for(let i=0;i<size;i++){
      const role=roleKeys[i%roleKeys.length];
      const rInfo=this.ROLES[role]||this.ROLES.worker;
      agents.push({
        id:`agent_${id}_${i}`,
        name:`${rInfo.name}-${i+1}`,
        role,status:'idle',
        capabilities:rInfo.cap,
        tasksCompleted:0,energy:100,
        joinedAt:this.now()
      });
    }
    const swarm={
      id,name,created:this.now(),size,
      agents,status:'active',
      tasks:[],tasksCompleted:0,
      leader:agents[0].id,
      mesh:[]
    };
    // Build mesh connections
    for(let i=0;i<agents.length;i++){
      for(let j=i+1;j<agents.length;j++){
        swarm.mesh.push({from:agents[i].id,to:agents[j].id,latency:Math.round(Math.random()*50+10)});
      }
    }
    this.swarms[id]=swarm;
    this.saveSwarms();
    return swarm;
  }

  assignTask(swarmId,task,options={}){
    const{type='build',priority=5}=options;
    const swarm=this.swarms[swarmId];
    if(!swarm)return{error:'Swarm not found'};
    const available=swarm.agents.filter(a=>a.status==='idle');
    if(available.length===0)return{error:'No idle agents'};
    const agent=available[Math.floor(Math.random()*available.length)];
    const tId=`task_${Date.now()}_${this.genId()}`;
    const t={id:tId,type,task,priority,assignedTo:agent.id,status:'assigned',created:this.now()};
    swarm.tasks.push(t);
    agent.status='busy';
    agent.tasksCompleted++;
    agent.energy=Math.max(0,agent.energy-10);
    this.saveSwarms();
    return{task:t,agent};
  }

  getSwarmStatus(swarmId){
    const swarm=this.swarms[swarmId];
    if(!swarm)return null;
    const idle=swarm.agents.filter(a=>a.status==='idle').length;
    const busy=swarm.agents.filter(a=>a.status==='busy').length;
    const avgEnergy=Math.round(swarm.agents.reduce((s,a)=>s+a.energy,0)/swarm.agents.length);
    const activeTasks=swarm.tasks.filter(t=>t.status==='assigned').length;
    return{
      id:swarm.id,name:swarm.name,size:swarm.size,
      agents:{total:swarm.agents.length,idle,busy},
      avgEnergy,tasksCompleted:swarm.tasksCompleted,activeTasks,
      meshConnections:swarm.mesh.length,status:swarm.status
    };
  }

  getStats(){
    const totalAgents=Object.values(this.swarms).reduce((s,w)=>s+w.agents.length,0);
    const totalTasks=Object.values(this.swarms).reduce((s,w)=>s+w.tasksCompleted,0);
    return{name:'Swarm Soul',version:'1.0.0',swarms:Object.keys(this.swarms).length,totalAgents,totalTasks,apiKey:this.apiKey?this.apiKey.substring(0,8)+'...':null,uptime:this.uptime()};
  }

  checkAuth(req){if(!this.apiKey)return true;const k=req.headers['x-api-key']||req.headers['x-swarm-key']||(req.headers['authorization']||'').replace('Bearer ','');return k===this.apiKey;}
  start(){
    const s=http.createServer(async(req,res)=>{
    if(mesh.handleRequest(req,res))return;
      res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type,X-API-Key,X-Swarm-Key,Authorization');
      if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
      const send=(st,d)=>{res.writeHead(st,{'Content-Type':'application/json'});res.end(JSON.stringify(d));};
      const rb=()=>new Promise((rs,rj)=>{let d='',sz=0;req.on('data',c=>{sz+=c.length;if(sz>1e6){req.destroy();rj(new Error('Too large'));}d+=c;});req.on('end',()=>{try{rs(d?JSON.parse(d):{})}catch{rj(new Error('Invalid JSON'))}});req.on('error',rj);});
      try{
        const u=new URL(req.url,`http://localhost:${this.port}`),pn=u.pathname.replace(/\/+$/,'')||'/';
        if(pn!=='/ping'&&pn!=='/health'&&!this.checkAuth(req))return send(401,{error:'Unauthorized'});
        if(req.method==='GET'&&pn==='/ping')return send(200,{alive:true,name:'Swarm Soul',ts:this.now()});
        if(req.method==='GET'&&pn==='/health')return send(200,{status:'alive',swarms:Object.keys(this.swarms).length,ts:this.now()});
        if(req.method==='GET'&&pn==='/status')return send(200,this.getStats());
        if(req.method==='GET'&&pn==='/roles')return send(200,{roles:this.ROLES});
        if(req.method==='POST'&&pn==='/swarm'){const b=await rb();if(!b.name)return send(400,{error:'name required'});return send(200,this.createSwarm(b.name,{size:b.size||5,roles:b.roles||[]}));}
        if(req.method==='GET'&&pn.startsWith('/swarm/')){const id=pn.split('/')[2];const sw=this.swarms[id];return send(sw?200:404,sw||{error:'Not found'});}
        if(req.method==='POST'&&pn==='/task'){const b=await rb();if(!b.swarmId||!b.task)return send(400,{error:'swarmId and task required'});return send(200,this.assignTask(b.swarmId,b.task,b));}
        if(req.method==='GET'&&pn==='/swarms')return send(200,{swarms:Object.keys(this.swarms).map(id=>({id,name:this.swarms[id].name,size:this.swarms[id].size,status:this.swarms[id].status,created:this.swarms[id].created}))});
        send(404,{error:'Not found'});
      }catch(e){send(500,{error:e.message})}
    });
    s.listen(this.port,()=>{
  mesh.join({name:'swarm',port:this.port||4200,type:'swarm'});
    console.log(`\nSwarm Soul on ${this.port}\nKey: ${this.apiKey.substring(0,12)}...\nPOST /swarm {"name":"my-swarm","size":5}\nPOST /task {"swarmId":"...","task":"build X"}\n`)});
    return s;
  }
}
module.exports=SwarmSoul;

// MCP Mode - connect to Claude Code, Cursor, Cline, etc.
if (process.argv.includes('--mcp') || process.argv.includes('--mcp-port')) {
    try {
        const MCPAdapter = require('./mcp-adapter');
        const mcp = new MCPAdapter();
        mcp.register(module.exports, { name: 'swarm' });
        mcp.start();
    } catch(e) { console.error('[mcp] swarm error:', e.message); }
}

``

### test\soul-swarm.test.js

``.js
#!/usr/bin/env node
const assert=require('assert'),fs=require('fs'),path=require('path'),os=require('os');
const TD=path.join(os.homedir(),'.soul-swarm-test');
console.log('\n Swarm Soul — Test Suite\n');
let p=0,f=0;function t(n,fn){try{fn();console.log('  OK '+n);p++;}catch(e){console.log('  FAIL '+n+': '+e.message);f++;}}
if(fs.existsSync(TD))fs.rmSync(TD,{recursive:true,force:true});
const S=require('../lib/soul-swarm.js');
t('Loads with key',()=>{const s=new S({dataDir:TD});assert(s.apiKey);assert(s.apiKey.length>10);});
t('5 roles defined',()=>{const s=new S({dataDir:TD});assert(Object.keys(s.ROLES).length===5);assert(s.ROLES.leader);assert(s.ROLES.worker);});
t('Create swarm',()=>{const s=new S({dataDir:TD});const w=s.createSwarm('test',{size:5});assert(w.id);assert(w.agents.length===5);assert(w.status==='active');});
t('Swarm has mesh',()=>{const s=new S({dataDir:TD});const w=s.createSwarm('mesh-test',{size:4});const expected=6;assert(w.mesh.length===expected,'4 agents = '+expected+' connections');});
t('Assign task to swarm',()=>{const s=new S({dataDir:TD});const w=s.createSwarm('task-test',{size:3});const r=s.assignTask(w.id,'Build feature X');assert(r.task);assert(r.agent);assert(r.task.assignedTo===r.agent.id);});
t('Agent goes busy after task',()=>{const s=new S({dataDir:TD});const w=s.createSwarm('busy-test',{size:2});s.assignTask(w.id,'Task 1');const busy=w.agents.filter(a=>a.status==='busy').length;assert(busy>=1);});
t('Swarm status returns stats',()=>{const s=new S({dataDir:TD});const w=s.createSwarm('status-test',{size:4});const st=s.getSwarmStatus(w.id);assert(st);assert(st.size===4);assert(typeof st.avgEnergy==='number');});
t('Stats ok',()=>{const s=new S({dataDir:TD});const st=s.getStats();assert(st.name==='Swarm Soul');assert(st.swarms>=0);});
t('Key persists',()=>{const s=new S({dataDir:TD});assert(fs.existsSync(s.keyPath));});
t('Auth works',()=>{const s=new S({dataDir:TD,apiKey:'k'});assert(s.checkAuth({headers:{'x-api-key':'k'}}));assert(!s.checkAuth({headers:{'x-api-key':'w'}}));});
t('Swarms persist to disk',()=>{const d=TD+'_persist';if(fs.existsSync(d))fs.rmSync(d,{recursive:true,force:true});const s1=new S({dataDir:d});s1.createSwarm('persist-test');const s2=new S({dataDir:d});assert(Object.keys(s2.swarms).length>=1);fs.rmSync(d,{recursive:true,force:true});});
if(fs.existsSync(TD))fs.rmSync(TD,{recursive:true,force:true});
console.log(p+'/'+(p+f)+' passed\n');process.exit(f>0?1:0);
``

