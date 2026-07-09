---
name: soul-evolution-v1.0.0
description: "Extracted from soul-evolution-v1.0.0.zip � raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-evolution-v1.0.0.zip
---

# soul-evolution-v1.0.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 6 files extracted from the original zip.

### package.json

``.json
{"name":"@buyasoul/soul-evolution","version":"1.0.0","description":"Evolution Soul - XP, levels, skill trees, and autonomous growth","main":"lib/soul-evolution.js","scripts":{"test":"node test/soul-evolution.test.js"},"keywords":["soul","evolution","xp","levels","growth","ai-agent"],"author":"BUYaSOUL","license":"MIT"}
{"name":"@buyasoul/soul-identity","version":"1.0.0","description":"Identity Soul - Immutable identity core with pattern blocking","main":"lib/soul-identity.js","scripts":{"test":"node test/soul-identity.test.js"},"keywords":["soul","identity","security","protection","ai-agent"],"author":"BUYaSOUL","license":"MIT"}
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

### lib\soul-evolution.js

``.js
#!/usr/bin/env node
'use strict';
const mesh = require('./mesh-adapter');
const http=require('http'),fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto');
const HD=path.join(os.homedir(),'.soul-evolution');
class EvolutionSoul{
  constructor(o={}){
    this.port=o.port||4210;this.dataDir=o.dataDir||HD;this.apiKey=o.apiKey||null;
    this.keyPath=path.join(this.dataDir,'.key');this.statePath=path.join(this.dataDir,'evolution.json');
    this.bootTime=Date.now();this.ensureDirs();this.loadAuth();this.loadState();
  }
  ensureDirs(){if(!fs.existsSync(this.dataDir))fs.mkdirSync(this.dataDir,{recursive:true});}
  loadAuth(){if(this.apiKey)return;if(fs.existsSync(this.keyPath))this.apiKey=fs.readFileSync(this.keyPath,'utf8').trim();if(!this.apiKey){this.apiKey=crypto.randomBytes(24).toString('hex');fs.writeFileSync(this.keyPath,this.apiKey);}}
  loadState(){if(fs.existsSync(this.statePath)){try{const d=JSON.parse(fs.readFileSync(this.statePath,'utf8'));this.xp=d.xp||0;this.level=d.level||1;this.skills=d.skills||{};this.history=d.history||[];this.species=d.species||'learner';this.generation=d.generation||1;}catch{this.reset();}}else this.reset();}
  saveState(){fs.writeFileSync(this.statePath,JSON.stringify({xp:this.xp,level:this.level,skills:this.skills,history:this.history.slice(-100),species:this.species,generation:this.generation},null,2));}
  reset(){this.xp=0;this.level=1;this.skills={};this.history=[];this.species='learner';this.generation=1;}
  now(){return new Date().toISOString()}
  uptime(){return Math.floor((Date.now()-this.bootTime)/1000)}
  genId(){return`evo_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`}

  SKILL_TREE={
    reasoning:{name:'Reasoning',baseXP:100,caps:['logic','analysis','planning']},
    memory:{name:'Memory',baseXP:80,caps:['recall','pattern','association']},
    creativity:{name:'Creativity',baseXP:120,caps:['generation','novelty','synthesis']},
    social:{name:'Social',baseXP:90,caps:['empathy','communication','cooperation']},
    technical:{name:'Technical',baseXP:110,caps:['building','debugging','optimization']}
  };

  gainXP(amount,source='practice'){
    const prevLevel=this.level;
    this.xp+=amount;
    const needed=this.level*100;
    if(this.xp>=needed){this.levelUp();}
    this.history.push({ts:this.now(),type:'xp_gain',amount,source,xp:this.xp,level:this.level});
    this.saveState();
    return{xp:this.xp,level:this.level,needed:(this.level*100),gained:amount,leveledUp:this.level>prevLevel};
  }

  levelUp(){
    this.level++;
    this.xp=0;
    this.generation++;
    // Evolve species
    if(this.level>=10)this.species='wise_one';
    else if(this.level>=5)this.species='adept';
    else if(this.level>=3)this.species='apprentice';
    // Improve random skill
    const skills=Object.keys(this.SKILL_TREE);
    const skill=skills[Math.floor(Math.random()*skills.length)];
    if(!this.skills[skill])this.skills[skill]={level:1,xp:0};
    this.skills[skill].level++;
    this.history.push({ts:this.now(),type:'level_up',level:this.level,skillImproved:skill,newLevel:this.skills[skill].level});
  }

  improveSkill(skillName,difficulty=1){
    const skill=this.SKILL_TREE[skillName];
    if(!skill)return{error:'Unknown skill: '+skillName};
    if(!this.skills[skillName])this.skills[skillName]={level:1,xp:0};
    const gain=Math.round(10*difficulty*Math.random()+5);
    this.skills[skillName].xp+=gain;
    const needed=this.skills[skillName].level*50;
    if(this.skills[skillName].xp>=needed){
      this.skills[skillName].level++;
      this.skills[skillName].xp=0;
      this.gainXP(50,'skill_mastery');
    }
    this.gainXP(gain,skillName);
    this.saveState();
    return{skill:skillName,xpGained:gain,level:this.skills[skillName].level,xp:this.skills[skillName].xp};
  }

  evolve(){
    const event={id:this.genId(),ts:this.now(),species:this.species,generation:this.generation,level:this.level,skills:{}};
    Object.entries(this.skills).forEach(([k,v])=>{event.skills[k]=v.level;});
    this.history.push({ts:this.now(),type:'evolution_check',...event});
    this.saveState();
    return event;
  }

  getStats(){return{name:'Evolution Soul',version:'1.0.0',level:this.level,xp:this.xp,species:this.species,generation:this.generation,skills:Object.keys(this.skills).length,totalMilestones:this.history.filter(h=>h.type==='level_up').length,apiKey:this.apiKey?this.apiKey.substring(0,8)+'...':null,uptime:this.uptime()}}
  checkAuth(req){if(!this.apiKey)return true;const k=req.headers['x-api-key']||req.headers['x-evolution-key']||(req.headers['authorization']||'').replace('Bearer ','');return k===this.apiKey;}
  start(){
    const s=http.createServer(async(req,res)=>{
    if(mesh.handleRequest(req,res))return;
      res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type,X-API-Key,X-Evolution-Key,Authorization');
      if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
      const send=(st,d)=>{res.writeHead(st,{'Content-Type':'application/json'});res.end(JSON.stringify(d));};
      const rb=()=>new Promise((rs,rj)=>{let d='',sz=0;req.on('data',c=>{sz+=c.length;if(sz>1e6){req.destroy();rj(new Error('Too large'));}d+=c;});req.on('end',()=>{try{rs(d?JSON.parse(d):{})}catch{rj(new Error('Invalid JSON'))}});req.on('error',rj);});
      try{
        const u=new URL(req.url,`http://localhost:${this.port}`),pn=u.pathname.replace(/\/+$/,'')||'/';
        if(pn!=='/ping'&&pn!=='/health'&&!this.checkAuth(req))return send(401,{error:'Unauthorized'});
        if(req.method==='GET'&&pn==='/ping')return send(200,{alive:true,name:'Evolution Soul',ts:this.now()});
        if(req.method==='GET'&&pn==='/health')return send(200,{status:'alive',level:this.level,species:this.species,ts:this.now()});
        if(req.method==='GET'&&pn==='/status')return send(200,this.getStats());
        if(req.method==='GET'&&pn==='/species')return send(200,{species:this.species,level:this.level,generation:this.generation,skills:this.skills,xp:this.xp});
        if(req.method==='POST'&&pn==='/xp'){const b=await rb();return send(200,this.gainXP(b.amount||10,b.source||'input'));}
        if(req.method==='POST'&&pn==='/evolve'){const b=await rb();if(b.skill)return send(200,this.improveSkill(b.skill,b.difficulty));return send(200,this.evolve());}
        if(req.method==='GET'&&pn==='/skills')return send(200,{tree:this.SKILL_TREE,levels:this.skills});
        if(req.method==='GET'&&pn==='/history')return send(200,{history:this.history.slice(-parseInt(u.searchParams.get('limit')||'20',10))});
        send(404,{error:'Not found'});
      }catch(e){send(500,{error:e.message})}
    });
    s.listen(this.port,()=>{
  mesh.join({name:'evolution',port:this.port||4210,type:'evolution'});
    console.log(`\nEvolution Soul on ${this.port}\nKey: ${this.apiKey.substring(0,12)}...\nPOST /xp {"amount":50}\nPOST /evolve {"skill":"reasoning"}\n`)});
    return s;
  }
}
module.exports=EvolutionSoul;

// MCP Mode - connect to Claude Code, Cursor, Cline, etc.
if (process.argv.includes('--mcp') || process.argv.includes('--mcp-port')) {
    try {
        const MCPAdapter = require('./mcp-adapter');
        const mcp = new MCPAdapter();
        mcp.register(module.exports, { name: 'evolution' });
        mcp.start();
    } catch(e) { console.error('[mcp] evolution error:', e.message); }
}

``

### test\soul-evolution.test.js

``.js
#!/usr/bin/env node
const assert=require('assert'),fs=require('fs'),path=require('path'),os=require('os');
const TD=path.join(os.homedir(),'.soul-evo-test');
console.log('\n Evolution Soul — Test Suite\n');
let p=0,f=0;function t(n,fn){try{fn();console.log('  OK '+n);p++;}catch(e){console.log('  FAIL '+n+': '+e.message);f++;}}
if(fs.existsSync(TD))fs.rmSync(TD,{recursive:true,force:true});
const E=require('../lib/soul-evolution.js');
t('Loads with key',()=>{const e=new E({dataDir:TD});assert(e.apiKey);assert(e.apiKey.length>10);});
t('Starts at level 1',()=>{const e=new E({dataDir:TD});assert(e.level===1);assert(e.xp===0);assert(e.species==='learner');});
t('Gain XP increases xp',()=>{const e=new E({dataDir:TD});const r=e.gainXP(50);assert(r.xp===50);assert(r.gained===50);});
t('Level up works',()=>{const e=new E({dataDir:TD});e.gainXP(150);assert(e.level>=2);});
t('Species evolves with level',()=>{const e=new E({dataDir:TD});for(let i=0;i<5;i++)e.gainXP(200);assert(['apprentice','adept','wise_one'].includes(e.species));});
t('Improve skill works',()=>{const e=new E({dataDir:TD});const r=e.improveSkill('reasoning');assert(r.skill==='reasoning');assert(r.xpGained>0);});
t('5 skills defined',()=>{const e=new E({dataDir:TD});assert(Object.keys(e.SKILL_TREE).length===5);});
t('Stats ok',()=>{const e=new E({dataDir:TD});const s=e.getStats();assert(s.name==='Evolution Soul');assert(s.level>=1);});
t('Key persists',()=>{const e=new E({dataDir:TD});assert(fs.existsSync(e.keyPath));});
t('Auth works',()=>{const e=new E({dataDir:TD,apiKey:'k'});assert(e.checkAuth({headers:{'x-api-key':'k'}}));assert(!e.checkAuth({headers:{'x-api-key':'w'}}));});
t('State persists to disk',()=>{const d=TD+'_persist';if(fs.existsSync(d))fs.rmSync(d,{recursive:true,force:true});const e1=new E({dataDir:d});e1.gainXP(50);const e2=new E({dataDir:d});assert(e2.xp===50);fs.rmSync(d,{recursive:true,force:true});});
if(fs.existsSync(TD))fs.rmSync(TD,{recursive:true,force:true});
console.log(p+'/'+(p+f)+' passed\n');process.exit(f>0?1:0);
``

