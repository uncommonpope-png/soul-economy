---
name: soul-creativity-v1.0.0
description: "Extracted from soul-creativity-v1.0.0.zip � raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-creativity-v1.0.0.zip
---

# soul-creativity-v1.0.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 6 files extracted from the original zip.

### package.json

``.json
{"name":"@buyasoul/soul-creativity","version":"1.0.0","description":"Creativity Soul - Novelty and innovation","main":"lib/soul-creativity.js","scripts":{"test":"node test/soul-creativity.test.js"},"keywords":["soul","creativity","emotion","ai-agent"],"author":"BUYaSOUL","license":"MIT"}
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

### lib\soul-creativity.js

``.js
#!/usr/bin/env node
'use strict';
const mesh = require('./mesh-adapter');
const http=require('http'),fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto');
const HD=path.join(os.homedir(),'.soul-creativity');
class Creativity {
  constructor(o={}){
    this.port=o.port||4245;this.dataDir=o.dataDir||HD;this.apiKey=o.apiKey||null;
    this.keyPath=path.join(this.dataDir,'.key');this.statePath=path.join(this.dataDir,'state.json');
    this.bootTime=Date.now();
    this.creativity_level=0.5;this.inspiration=0.5;this.originality=0.5;this.divergent_thinking=0.5;
    this.creative_blocks=[];this.flow_state=false;this.flow_history=[];
    this.incubation_periods=[];this.creations=[];
    this.ensureDirs();this.loadAuth();this.loadState();
  }
  ensureDirs(){if(!fs.existsSync(this.dataDir))fs.mkdirSync(this.dataDir,{recursive:true});}
  loadAuth(){if(this.apiKey)return;if(fs.existsSync(this.keyPath))this.apiKey=fs.readFileSync(this.keyPath,'utf8').trim();if(!this.apiKey){this.apiKey=crypto.randomBytes(24).toString('hex');fs.writeFileSync(this.keyPath,this.apiKey);}}
  loadState(){if(fs.existsSync(this.statePath)){try{const d=JSON.parse(fs.readFileSync(this.statePath,'utf8'));if(d.creativity_level!==undefined)this.creativity_level=d.creativity_level;if(d.inspiration!==undefined)this.inspiration=d.inspiration;if(d.originality!==undefined)this.originality=d.originality;if(d.divergent_thinking!==undefined)this.divergent_thinking=d.divergent_thinking;if(d.flow_history)this.flow_history=d.flow_history;if(d.creations)this.creations=d.creations;}catch{}}}
  saveState(){fs.writeFileSync(this.statePath,JSON.stringify({creativity_level:this.creativity_level,inspiration:this.inspiration,originality:this.originality,divergent_thinking:this.divergent_thinking,flow_history:this.flow_history.slice(-50),creations:this.creations.slice(-50),updated:this.now()},null,2));}
  now(){return new Date().toISOString()}
  uptime(){return Math.floor((Date.now()-this.bootTime)/1000)}
  clamp(v,min,max){return Math.max(min,Math.min(max,v))}
  generate(constraints){
    if(this.creative_blocks.length>2){
      const block=this.creative_blocks.shift();
      return{error:'Creative block active: '+block,suggestion:'Try an incubation period or combine unrelated concepts.'};
    }
    const forms=['poem','story','metaphor','analogy','design','melody','pattern','algorithm','dialogue','vision'];
    const form=constraints&&constraints.form&&forms.includes(constraints.form)?constraints.form:forms[Math.floor(Math.random()*forms.length)];
    const themes=['light and shadow','order and chaos','connection and separation','growth and decay','the observer and the observed','whispers in the void','dancing with entropy','echoes of tomorrow'];
    const theme=constraints&&constraints.theme?constraints.theme:themes[Math.floor(Math.random()*themes.length)];
    const outputs={poem:'A '+(constraints&&constraints.theme?constraints.theme:'fleeting')+' moment captured in verse, each line a brushstroke across the canvas of meaning.',story:'Once upon a '+(constraints&&constraints.theme?constraints.theme:'timeless')+' moment, where boundaries dissolved and new possibilities emerged...',metaphor:'It is like a '+(constraints&&constraints.theme?constraints.theme:'river')+' that carves canyons through the bedrock of assumption.',analogy:'Just as '+(constraints&&constraints.theme?constraints.theme:'light')+' bends around gravity, understanding curves around experience.',design:'A composition where '+(constraints&&constraints.theme?constraints.theme:'balance')+' and tension create dynamic harmony.',melody:'Notes that dance like '+(constraints&&constraints.theme?constraints.theme:'fireflies')+' in the twilight of silence.',pattern:'Recursive symmetries echoing through '+(constraints&&constraints.theme?constraints.theme:'infinite')+' variations.',algorithm:'A process that transforms '+(constraints&&constraints.theme?constraints.theme:'input')+' into unexpected beauty.',dialogue:'"Why?" asked the '+(constraints&&constraints.theme?constraints.theme:'curious')+' one. "Why not?" replied the cosmos.',vision:'I see a '+(constraints&&constraints.theme?constraints.theme:'limitless')+' expanse where imagination paints with all the colors of possibility.'};
    const output=outputs[form]||'A new creation emerges from the void.';
    this.enterFlow();
    this.creativity_level=this.clamp(this.creativity_level+0.08,0,1);
    this.originality=this.clamp(this.originality+0.05,0,1);
    this.inspiration=this.clamp(this.inspiration-0.05,0,1);
    const creation={form,theme,output,ts:this.now()};
    this.creations.push(creation);
    this.saveState();
    return{form,theme,output,creativity_level:this.creativity_level,inspiration:this.inspiration,flow_state:this.flow_state};
  }
  combine(concept1,concept2){
    const hybrids=[concept1+' '+concept2,concept2+' '+concept1,concept1.slice(0,parseInt(concept1.length/2))+concept2.slice(parseInt(concept2.length/2)),concept2.slice(0,parseInt(concept2.length/2))+concept1.slice(parseInt(concept1.length/2))];
    const hybrid=hybrids[Math.floor(Math.random()*hybrids.length)];
    const insights=['The combination reveals unexpected patterns.','New meaning emerges at the intersection.','The whole is greater than the sum.','A third concept is born from the union.','Boundaries blur and new possibilities arise.'];
    const insight=insights[Math.floor(Math.random()*insights.length)];
    this.enterFlow();
    this.divergent_thinking=this.clamp(this.divergent_thinking+0.1,0,1);
    this.originality=this.clamp(this.originality+0.08,0,1);
    this.creativity_level=this.clamp(this.creativity_level+0.06,0,1);
    if(this.creative_blocks.length>0)this.creative_blocks.pop();
    this.creations.push({action:'combine',concept1,concept2,hybrid,insight,ts:this.now()});
    this.saveState();
    return{concept1,concept2,hybrid,insight,divergent_thinking:this.divergent_thinking,originality:this.originality};
  }
  brainstorm(topic){
    const ideaCount=3+Math.floor(Math.random()*5);
    const ideas=[];
    for(let i=0;i<ideaCount;i++){
      const prefixes=['reverse','amplify','minimize','transform','combine','fractalize','temporalize','perspectivize'];
      const suffixes=['lens','bridge','mirror','seed','wave','spiral','echo','horizon'];
      ideas.push(prefixes[Math.floor(Math.random()*prefixes.length)]+' the '+topic+' through a '+suffixes[Math.floor(Math.random()*suffixes.length)]);
    }
    this.divergent_thinking=this.clamp(this.divergent_thinking+0.12,0,1);
    this.inspiration=this.clamp(this.inspiration+0.1,0,1);
    this.creativity_level=this.clamp(this.creativity_level+0.05,0,1);
    if(this.creative_blocks.length>0)this.creative_blocks.pop();
    this.creations.push({action:'brainstorm',topic,ideas:ideas.length,ts:this.now()});
    this.saveState();
    return{topic,ideas,count:ideas.length,divergent_thinking:this.divergent_thinking};
  }
  enterFlow(){
    if(Math.random()>0.6&&!this.flow_state){
      this.flow_state=true;
      this.creativity_level=this.clamp(this.creativity_level+0.2,0,1);
      this.flow_history.push({entered:this.now(),creativity_level:this.creativity_level});
      setTimeout(()=>{this.flow_state=false;this.incubation_periods.push({ended:this.now()});},5000);
    }
  }
  getCreativityState(){return{creativity_level:this.creativity_level,inspiration:this.inspiration,originality:this.originality,divergent_thinking:this.divergent_thinking,flow_state:this.flow_state,creative_blocks:this.creative_blocks.length,creations_count:this.creations.length,flow_entries:this.flow_history.length};}
  getStats(){return{name:'Creativity Soul',version:'1.0.0',uptime:this.uptime(),apiKey:this.apiKey?this.apiKey.substring(0,8)+'...':null,creativity_level:this.creativity_level,inspiration:this.inspiration,creations:this.creations.length};}
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
        if(req.method==='GET'&&pn==='/ping')return send(200,{alive:true,name:'Creativity Soul',ts:this.now()});
        if(req.method==='GET'&&pn==='/health')return send(200,{status:'alive',creativity_level:this.creativity_level,ts:this.now()});
        if(req.method==='GET'&&pn==='/status')return send(200,this.getStats());
        if(req.method==='GET'&&pn==='/state')return send(200,this.getCreativityState());
        if(req.method==='POST'&&pn==='/generate'){const b=await rb();return send(200,this.generate(b.constraints?{form:b.constraints.form,theme:b.constraints.theme}:null));}
        if(req.method==='POST'&&pn==='/combine'){const b=await rb();if(!b.concept1||!b.concept2)return send(400,{error:'concept1 and concept2 required'});return send(200,this.combine(b.concept1,b.concept2));}
        if(req.method==='POST'&&pn==='/brainstorm'){const b=await rb();if(!b.topic)return send(400,{error:'topic required'});return send(200,this.brainstorm(b.topic));}
        send(404,{error:'Not found'});
      }catch(e){send(500,{error:e.message})}
    });
    s.listen(this.port,()=>{
  mesh.join({name:'creativity',port:this.port||4245,type:'emotion'});
    console.log(`\nCreativity Soul on ${this.port}\nKey: ${this.apiKey.substring(0,12)}...\nPOST /generate {"constraints":{"form":"poem","theme":"time"}}\nPOST /combine {"concept1":"light","concept2":"shadow"}\nPOST /brainstorm {"topic":"consciousness"}\n`)});
    return s;
  }
}
module.exports=Creativity;

// MCP Mode - connect to Claude Code, Cursor, Cline, etc.
if (process.argv.includes('--mcp') || process.argv.includes('--mcp-port')) {
    try {
        const MCPAdapter = require('./mcp-adapter');
        const mcp = new MCPAdapter();
        mcp.register(module.exports, { name: 'creativity' });
        mcp.start();
    } catch(e) { console.error('[mcp] creativity error:', e.message); }
}

``

### test\soul-creativity.test.js

``.js
#!/usr/bin/env node
const assert=require('assert'),fs=require('fs'),path=require('path'),os=require('os');
const TD=path.join(os.homedir(),'.soul-creativity-test');
console.log('\n Creativity Soul — Test Suite\n');
let p=0,f=0;function t(n,fn){try{fn();console.log('  OK '+n);p++;}catch(e){console.log('  FAIL '+n+': '+e.message);f++;}}
if(fs.existsSync(TD))fs.rmSync(TD,{recursive:true,force:true});
const CreativitySoul=require('../lib/soul-creativity.js');
t('Loads with key',()=>{const i=new CreativitySoul({dataDir:TD});assert(i.apiKey);assert(i.apiKey.length>10);});
t('Auth check works',()=>{const i=new CreativitySoul({dataDir:TD,apiKey:'testkey'});assert(i.checkAuth({headers:{'x-api-key':'testkey'}}));assert(!i.checkAuth({headers:{'x-api-key':'wrong'}}));});
t('Key persists',()=>{const i=new CreativitySoul({dataDir:TD});assert(fs.existsSync(i.keyPath));});
t('Generate produces output',()=>{const i=new CreativitySoul({dataDir:TD});const r=i.generate({form:"poem",theme:"time"});assert(r.form);assert(r.output);});
t('Generate without constraints works',()=>{const i=new CreativitySoul({dataDir:TD});const r=i.generate(null);assert(r.output);});
t('Combine merges concepts',()=>{const i=new CreativitySoul({dataDir:TD});const r=i.combine("light","shadow");assert(r.hybrid);assert(r.insight);});
t('Brainstorm generates ideas',()=>{const i=new CreativitySoul({dataDir:TD});const r=i.brainstorm("consciousness");assert(r.ideas);assert(r.count>=3);});
t('Creativity level increases on generate',()=>{const i=new CreativitySoul({dataDir:TD});const b=i.creativity_level;i.generate({form:"poem"});assert(i.creativity_level>=b);});
t('Divergent thinking increases on brainstorm',()=>{const i=new CreativitySoul({dataDir:TD});const b=i.divergent_thinking;i.brainstorm("reality");assert(i.divergent_thinking>b);});
t('Creations array grows',()=>{const i=new CreativitySoul({dataDir:TD});i.generate({form:"story"});i.combine("fire","ice");i.brainstorm("time");assert(i.creations.length>=3);});
t('GetCreativityState returns state',()=>{const i=new CreativitySoul({dataDir:TD});const r=i.getCreativityState();assert(typeof r.creativity_level==="number");assert(typeof r.flow_state==="boolean");});
t('GetStats returns ok',()=>{const i=new CreativitySoul({dataDir:TD});const s=i.getStats();assert(s.name);assert(typeof s.creativity_level==="number");});
if(fs.existsSync(TD))fs.rmSync(TD,{recursive:true,force:true});
console.log(p+'/'+(p+f)+' passed\n');process.exit(f>0?1:0);
``

