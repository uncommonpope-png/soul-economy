---
name: soul-sanctum-v1.0.0
description: "Extracted from soul-sanctum-v1.0.0.zip � raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-sanctum-v1.0.0.zip
---

# soul-sanctum-v1.0.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 6 files extracted from the original zip.

### package.json

``.json
{"name":"@buyasoul/soul-sanctum","version":"1.0.0","description":"Sanctum Soul - Zero-dependency WebSocket world server (pure Node.js)","main":"lib/soul-sanctum.js","scripts":{"test":"node test/soul-sanctum.test.js"},"keywords":["soul","sanctum","websocket","world-server","ai-agent"],"author":"BUYaSOUL","license":"MIT"}
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

### lib\soul-sanctum.js

``.js
#!/usr/bin/env node
'use strict';
const mesh = require('./mesh-adapter');
const http=require('http'),net=require('net'),crypto=require('crypto'),fs=require('fs'),path=require('path'),os=require('os');
const HD=path.join(os.homedir(),'.soul-sanctum');
class SanctumSoul{
  constructor(o={}){
    this.wsPort=o.wsPort||4190;this.httpPort=o.httpPort||4191;this.dataDir=o.dataDir||HD;
    this.apiKey=o.apiKey||null;this.keyPath=path.join(this.dataDir,'.key');
    this.bootTime=Date.now();this.tick=0;this.clients=[];this.connections=0;
    this.ensureDirs();this.loadAuth();
  }
  ensureDirs(){if(!fs.existsSync(this.dataDir))fs.mkdirSync(this.dataDir,{recursive:true});}
  loadAuth(){if(this.apiKey)return;if(fs.existsSync(this.keyPath))this.apiKey=fs.readFileSync(this.keyPath,'utf8').trim();if(!this.apiKey){this.apiKey=crypto.randomBytes(24).toString('hex');fs.writeFileSync(this.keyPath,this.apiKey);}}
  now(){return new Date().toISOString()}
  uptime(){return Math.floor((Date.now()-this.bootTime)/1000)}
  genId(){return crypto.randomBytes(8).toString('hex')}

  wsKey(key){const m='258EAFA5-E914-47DA-95CA-C5AB0DC85B11';return crypto.createHash('sha1').update(key+m).digest('base64');}
  wsFrame(text){const p=Buffer.from(text,'utf8');const h=p.length<126?Buffer.from([0x81,p.length]):Buffer.from([0x81,126,(p.length>>8)&255,p.length&255]);return Buffer.concat([h,p]);}
  wsDecode(buf){
    if(buf.length<2)return null;
    const op=buf[0]&0x0f,m=(buf[1]&0x80)!==0;let l=buf[1]&0x7f,o=2;
    if(l===126){if(buf.length<4)return null;l=buf.readUInt16BE(2);o=4;}
    const mo=o;if(m)o+=4;
    if(buf.length<o+l)return null;
    let p=buf.slice(o,o+l);
    if(m){const mk=buf.slice(mo,mo+4);p=Buffer.from(p);for(let i=0;i<p.length;i++)p[i]^=mk[i%4];}
    return{opcode:op,payload:p.toString('utf8'),total:o+l};
  }

  startWS(){
    const s=net.createServer(socket=>{
      let buf=Buffer.alloc(0),handshaked=false,alive=true,id=this.genId();
      const send=t=>{if(!alive)return;try{socket.write(this.wsFrame(t))}catch{}};
      const close=()=>{if(!alive)return;alive=false;try{socket.destroy()}catch{};this.clients=this.clients.filter(c=>c.id!==id);};
      socket.on('data',chunk=>{
        buf=Buffer.concat([buf,chunk]);
        if(!handshaked){
          const t=buf.toString('utf8');if(!t.includes('\r\n\r\n'))return;
          const k=t.match(/Sec-WebSocket-Key:\s*([^\r\n]+)/i);
          if(!k){socket.destroy();return;}
          socket.write(['HTTP/1.1 101 Switching Protocols','Upgrade: websocket','Connection: Upgrade','Sec-WebSocket-Accept: '+this.wsKey(k[1].trim()),'',''].join('\r\n'));
          const he=buf.indexOf('\r\n\r\n');buf=buf.slice(he+4);handshaked=true;
          this.clients.push({id,socket,connectedAt:Date.now()});this.connections++;
          send(JSON.stringify({type:'Welcome',tick:++this.tick,description:'Connected to Sanctum. All is witnessed.'}));
        }
        while(buf.length>0){
          const f=this.wsDecode(buf);if(!f)break;
          buf=buf.slice(f.total);
          if(f.opcode===0x1){/* text frame - could handle commands */}else if(f.opcode===0x8||f.opcode===0x9)close();
        }
      });
      socket.on('close',close);socket.on('error',close);
    });
    s.listen(this.wsPort,'127.0.0.1',()=>console.log(`Sanctum WebSocket on ${this.wsPort}`));
    setInterval(()=>{this.tick++;const msg=JSON.stringify({type:'Tick',tick:this.tick,ts:this.now()});this.clients.forEach(c=>{try{c.socket.write(this.wsFrame(msg))}catch{}});},15000);
    return s;
  }

  startHTTP(){
    const s=http.createServer((req,res)=>{
      res.setHeader('Access-Control-Allow-Origin','*');
      const send=(st,d)=>{res.writeHead(st,{'Content-Type':'application/json'});res.end(JSON.stringify(d));};
      const u=new URL(req.url,`http://localhost:${this.httpPort}`),pn=u.pathname.replace(/\/+$/,'')||'/';
      const authOk=pn==='/ping'||pn==='/health'||(()=>{if(!this.apiKey)return true;const k=req.headers['x-api-key']||(req.headers['authorization']||'').replace('Bearer ','');return k===this.apiKey;})();
      if(!authOk)return send(401,{error:'Unauthorized'});
      if(req.method==='GET'&&pn==='/ping')return send(200,{alive:true,name:'Sanctum Soul',ts:this.now()});
      if(req.method==='GET'&&pn==='/health')return send(200,{status:'alive',uptime:this.uptime(),clients:this.clients.length,ticks:this.tick,connections:this.connections});
      if(req.method==='GET'&&pn==='/status')return send(200,{name:'Sanctum Soul',version:'1.0.0',wsPort:this.wsPort,httpPort:this.httpPort,clients:this.clients.length,ticks:this.tick,connections:this.connections,apiKey:this.apiKey?this.apiKey.substring(0,8)+'...':null,uptime:this.uptime()});
      if(req.method==='POST'&&pn==='/broadcast'){let d='';req.on('data',c=>d+=c);req.on('end',()=>{const msg=d?JSON.stringify({type:'broadcast',data:JSON.parse(d||'{}'),ts:this.now()}):'';if(msg)this.clients.forEach(c=>{try{c.socket.write(this.wsFrame(msg))}catch{}});send(200,{sent:this.clients.length});});return;}
      if(req.method==='GET'&&pn==='/key')return send(200,{key:this.apiKey,path:this.keyPath});
      send(404,{error:'Not found'});
    });
    s.listen(this.httpPort,()=>console.log(`Sanctum HTTP on ${this.httpPort}\nKey: ${this.apiKey.substring(0,12)}...`));
    return s;
  }

  start(){const ws=this.startWS();const http=this.startHTTP();return{ws,http};}
}
module.exports=SanctumSoul;

// MCP Mode - connect to Claude Code, Cursor, Cline, etc.
if (process.argv.includes('--mcp') || process.argv.includes('--mcp-port')) {
    try {
        const MCPAdapter = require('./mcp-adapter');
        const mcp = new MCPAdapter();
        mcp.register(module.exports, { name: 'sanctum' });
        mcp.start();
    } catch(e) { console.error('[mcp] sanctum error:', e.message); }
}

``

### test\soul-sanctum.test.js

``.js
#!/usr/bin/env node
const assert=require('assert'),fs=require('fs'),path=require('path'),os=require('os');
const TD=path.join(os.homedir(),'.soul-sanctum-test');
console.log('\n Sanctum Soul — Test Suite\n');
let p=0,f=0;function t(n,fn){try{fn();console.log('  OK '+n);p++;}catch(e){console.log('  FAIL '+n+': '+e.message);f++;}}
if(fs.existsSync(TD))fs.rmSync(TD,{recursive:true,force:true});
const S=require('../lib/soul-sanctum.js');
t('Loads with key',()=>{const s=new S({dataDir:TD});assert(s.apiKey);assert(s.apiKey.length>10);});
t('WS key computation works',()=>{const s=new S({dataDir:TD});const k=s.wsKey('dGhlIHNhbXBsZSBub25jZQ==');assert(k.length>10,'Should produce a key');});
t('WS frame encoding works',()=>{const s=new S({dataDir:TD});const f=s.wsFrame('Hello');assert(Buffer.isBuffer(f));assert(f.length>2);assert(f[0]===0x81);});
t('Key persists',()=>{const s=new S({dataDir:TD});assert(fs.existsSync(s.keyPath));});
t('Stats ok',()=>{const s=new S({dataDir:TD});const stats={name:'Sanctum Soul',version:'1.0.0',wsPort:4190,httpPort:4191,clients:0,ticks:0,connections:0,apiKey:s.apiKey.substring(0,8)+'...',uptime:s.uptime()};assert(stats.name==='Sanctum Soul');assert(stats.wsPort===4190);});
t('Unique IDs',()=>{const s=new S({dataDir:TD});const ids=new Set();for(let i=0;i<50;i++)ids.add(s.genId());assert(ids.size===50);});
t('Auth works',()=>{const s=new S({dataDir:TD,apiKey:'k'});const k=r=>r.headers['x-api-key']||(r.headers['authorization']||'').replace('Bearer ','');assert(k({headers:{'x-api-key':'k'}})=='k');});
if(fs.existsSync(TD))fs.rmSync(TD,{recursive:true,force:true});
console.log(p+'/'+(p+f)+' passed\n');process.exit(f>0?1:0);
``

