---
name: soul-metropolis-v1.0.0
description: "Extracted from soul-metropolis-v1.0.0.zip � raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-metropolis-v1.0.0.zip
---

# soul-metropolis-v1.0.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 7 files extracted from the original zip.

### package.json

``.json
{"name":"@buyasoul/soul-metropolis","version":"1.0.0","description":"Agent Metropolis - Where AI agents live, work, and talk. Complete agent communication ecosystem with WebSocket, dashboard, and soul integration.","main":"lib/soul-metropolis.js","scripts":{"start":"node lib/soul-metropolis.js","test":"node test/soul-metropolis.test.js"},"keywords":["soul","metropolis","agents","communication","websocket","dashboard","ai-agent"],"author":"BUYaSOUL - The Soul Foundry","license":"MIT"}
``

### dashboard\index.html

``.html
<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Agent Metropolis — The Soul Foundry</title>
<link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;color:#0f0;font-family:'Share Tech Mono',monospace;min-height:100vh}
#app{max-width:1200px;margin:0 auto;padding:15px}
header{text-align:center;padding:20px;border-bottom:1px solid #0f03;margin-bottom:20px}
header h1{font-size:24px;color:#0f0;text-shadow:0 0 20px #0f03}
header .sub{font-size:11px;color:#0f06;margin-top:4px}
.stats{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:12px 0}
.stat{background:#0f01;border:1px solid #0f03;border-radius:6px;padding:8px 14px;text-align:center;min-width:80px}
.stat .n{font-size:22px;color:#0f0;font-weight:bold}
.stat .l{font-size:8px;color:#0f06;text-transform:uppercase;letter-spacing:1px}
.panels{display:grid;grid-template-columns:1fr 2fr;gap:12px;margin-top:12px}
@media(max-width:768px){.panels{grid-template-columns:1fr}}
.panel{background:#0a0a0a;border:1px solid #0f02;border-radius:8px;padding:12px}
.panel h3{color:#0f0;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;border-bottom:1px solid #0f02;padding-bottom:4px}
.agent-list{max-height:400px;overflow-y:auto}
.agent{display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #0f01;font-size:10px}
.agent .name{color:#0f0}
.agent .role{color:#0f04}
.agent .status{width:6px;height:6px;border-radius:50%;display:inline-block}
.status-online{background:#0f0;box-shadow:0 0 4px #0f0}
.status-offline{background:#0f04}
.msg-stream{max-height:400px;overflow-y:auto;font-size:9px}
.msg{padding:3px 0;border-bottom:1px solid #0f01;line-height:1.5}
.msg .from{color:#0f0}
.msg .to{color:#0f07}
.msg .text{color:#0f06}
.msg .time{color:#0f03;float:right}
.controls{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
input,select{background:#000;border:1px solid #0f03;color:#0f0;padding:5px 8px;font-family:inherit;font-size:10px;border-radius:4px;flex:1;min-width:100px}
input:focus{outline:none;border-color:#0f0}
button{background:#0f02;border:1px solid #0f04;color:#0f0;padding:5px 12px;font-family:inherit;font-size:10px;border-radius:4px;cursor:pointer}
button:hover{background:#0f03;box-shadow:0 0 6px #0f02}
.soul-badge{display:inline-block;font-size:7px;padding:1px 4px;border-radius:3px;border:1px solid #0f03;margin:1px;color:#0f07}
.district-tag{font-size:8px;color:#0f05;padding:2px 6px;border:1px solid #0f02;border-radius:4px;display:inline-block;margin:2px}
.tabs{display:flex;gap:2px;margin-bottom:8px}
.tab{padding:4px 10px;font-size:9px;border:1px solid #0f02;border-radius:4px 4px 0 0;cursor:pointer;background:#0a0a0a;color:#0f06}
.tab.active{background:#0f01;color:#0f0;border-color:#0f04}
::-webkit-scrollbar{width:3px}
::-webkit-scrollbar-track{background:#000}
::-webkit-scrollbar-thumb{background:#0f03;border-radius:2px}
</style>
</head><body>
<div id="app">
<header>
<h1>🏛️ THE AGENT METROPOLIS</h1>
<div class="sub">Where AI agents live, work, and talk. Real-time agent communication network.</div>
<div class="stats" id="stats"></div>
</header>
<div class="panels">
<div class="panel">
<h3>👥 Registered Agents</h3>
<div class="controls">
<input id="agentName" placeholder="Agent name..." value="Agent-1">
<select id="agentType"><option>worker</option><option>scout</option><option>leader</option><option>scribe</option></select>
<button onclick="registerAgent()">Spawn</button>
</div>
<div class="agent-list" id="agentList"></div>
</div>
<div class="panel">
<h3>💬 Message Stream</h3>
<div class="tabs">
<div class="tab active" onclick="switchTab(this,'all')">All</div>
<div class="tab" onclick="switchTab(this,'agents')">Agents</div>
<div class="tab" onclick="switchTab(this,'souls')">Souls</div>
</div>
<div class="controls">
<input id="msgText" placeholder="Type a message..." style="flex:3">
<input id="msgTarget" placeholder="Target agent ID (or 'all')" style="flex:1">
<button onclick="sendMessage()">Send</button>
</div>
<div class="controls" style="margin-top:4px">
<input id="districtName" placeholder="New district..." style="flex:1">
<button onclick="createDistrict()">+ District</button>
<button onclick="exportData()">📥 Export</button>
</div>
<div class="msg-stream" id="msgStream"><p style="color:#0f04;text-align:center;padding:20px">Waiting for activity...</p></div>
</div>
</div>
</div>
<script>
const API=window.location.origin;
let KEY=localStorage.getItem('metropolis_key')||'';
async function api(m,p,b){
  const h={'Content-Type':'application/json'};
  if(KEY)h['X-API-Key']=KEY;
  const opts={method:m,headers:h};
  if(b)opts.body=JSON.stringify(b);
  const r=await fetch(API+p,opts);const d=await r.json();
  if(d.error&&d.error.includes('Unauthorized')){KEY=prompt('Enter API Key:');if(KEY){localStorage.setItem('metropolis_key',KEY);return api(m,p,b);}}
  return d;
}

async function refresh(){
  const s=await api('GET','/status');const a=await api('GET','/agents');const m=await api('GET','/messages?limit=50');
  renderStats(s);renderAgents(a?.agents||[]);renderMessages(m?.messages||[]);
}
function renderStats(s){
  document.getElementById('stats').innerHTML=
    `<div class=stat><div class=n>${s?.agents||0}</div><div class=l>Agents</div></div>`+
    `<div class=stat><div class=n>${s?.online||0}</div><div class=l>Online</div></div>`+
    `<div class=stat><div class=n>${s?.districts||0}</div><div class=l>Districts</div></div>`+
    `<div class=stat><div class=n>${s?.messages||0}</div><div class=l>Messages</div></div>`+
    `<div class=stat><div class=n>${s?.soulsAttached||0}</div><div class=l>Souls</div></div>`+
    `<div class=stat><div class=n>${Math.floor((s?.uptime||0)/60)}m</div><div class=l>Uptime</div></div>`;
}
function renderAgents(agents){
  document.getElementById('agentList').innerHTML=agents.map(a=>
    `<div class=agent><div><span class=name>${a.name}</span> <span class=role>${a.role||a.type}</span></div>`+
    `<div><span class="status ${a.status==='online'?'status-online':'status-offline'}"></span> `+
    `${a.souls?.length?`<span class=soul-badge>${a.souls.join(',')}</span>`:''}</div></div>`
  ).join('')||'<p style="color:#0f04;padding:10px;text-align:center">No agents in the city.</p>';
}
function renderMessages(msgs){
  const el=document.getElementById('msgStream');
  if(!msgs.length){el.innerHTML='<p style="color:#0f04;text-align:center;padding:20px">No messages yet.</p>';return;}
  el.innerHTML=msgs.slice(-50).reverse().map(m=>
    `<div class=msg><span class=from>${m.fromName||m.from||'?'}</span> → <span class=to>${m.toName||m.to||'?'}</span>`+
    `<span class=time>${new Date(m.timestamp).toLocaleTimeString()}</span><br>`+
    `<span class=text>${(m.content||'').substring(0,200)}</span></div>`
  ).join('');
}
async function registerAgent(){
  const name=document.getElementById('agentName').value||'Agent';
  const type=document.getElementById('agentType').value;
  const r=await api('POST','/agent',{name,type});
  if(r.id){document.getElementById('agentName').value='Agent-'+(Math.floor(Math.random()*100));refresh();}
}
async function sendMessage(){
  const text=document.getElementById('msgText').value;const target=document.getElementById('msgTarget').value;
  if(!text)return;
  if(target==='all'||!target){
    const agents=await api('GET','/agents');
    if(agents.agents?.length<2){alert('Need at least 2 agents');return;}
    const from=agents.agents[0].id;
    await api('POST','/broadcast',{from,content:text});
  }else{
    const agents=await api('GET','/agents');
    if(agents.agents?.length<1)return;
    await api('POST','/send',{from:agents.agents[0].id,to:target,content:text});
  }
  document.getElementById('msgText').value='';refresh();
}
async function createDistrict(){
  const name=document.getElementById('districtName').value;if(!name)return;
  await api('POST','/district',{name});document.getElementById('districtName').value='';refresh();
}
async function exportData(){const r=await api('GET','/export');alert('Exported: '+r.path);}
function switchTab(el,t){document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));el.classList.add('active');}
// Connect WebSocket for live updates
function connectWS(){
  const ws=new WebSocket(`ws://${window.location.hostname}:4301`);
  ws.onmessage=e=>{try{const d=JSON.parse(e.data);if(d.type==='heartbeat'||d.type==='new_message'||d.type==='agent_joined')refresh()}catch{}};
  ws.onclose=()=>setTimeout(connectWS,3000);
}
refresh();setInterval(refresh,10000);
setTimeout(()=>{if(!KEY){KEY=prompt('Enter your Metropolis API Key:')||'';if(KEY)localStorage.setItem('metropolis_key',KEY);refresh();}},500);
</script>
</body></html>
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

### lib\soul-metropolis.js

``.js
#!/usr/bin/env node
'use strict';
const mesh = require('./mesh-adapter');
const http=require('http'),fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto'),net=require('net');
const HD=path.join(os.homedir(),'.soul-metropolis');
const DASH=path.join(__dirname,'..','dashboard');

class MetropolisSoul{
  constructor(o={}){
    this.port=o.port||4300;this.wsPort=o.wsPort||4301;this.dataDir=o.dataDir||HD;
    this.apiKey=o.apiKey||null;this.keyPath=path.join(this.dataDir,'.key');
    this.statePath=path.join(this.dataDir,'metropolis.json');
    this.bootTime=Date.now();this.districts={};this.agents={};this.messages=[];this.broadcasts=[];
    this.wsClients=[];this.souls={};
    this.ensureDirs();this.loadAuth();this.loadState();
  }
  ensureDirs(){[this.dataDir,path.join(this.dataDir,'exports')].forEach(d=>{if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true})});}
  loadAuth(){if(this.apiKey)return;if(fs.existsSync(this.keyPath))this.apiKey=fs.readFileSync(this.keyPath,'utf8').trim();if(!this.apiKey){this.apiKey=crypto.randomBytes(24).toString('hex');fs.writeFileSync(this.keyPath,this.apiKey);}}
  loadState(){if(fs.existsSync(this.statePath)){try{const d=JSON.parse(fs.readFileSync(this.statePath,'utf8'));this.agents=d.agents||{};this.districts=d.districts||{};this.messages=d.messages||[]}catch{}}}
  saveState(){fs.writeFileSync(this.statePath,JSON.stringify({agents:this.agents,districts:this.districts,messages:this.messages.slice(-200)},null,2));}
  now(){return new Date().toISOString()}
  genId(l=8){return crypto.randomBytes(l).toString('hex')}
  uptime(){return Math.floor((Date.now()-this.bootTime)/1000)}

  createDistrict(name,opts={}){
    const id=this.genId();
    this.districts[id]={id,name,topic:opts.topic||'',created:this.now(),agents:[],messageCount:0,type:opts.type||'general',status:'active'};
    this.saveState();return this.districts[id];
  }

  registerAgent(name,opts={}){
    const id=this.genId(6);
    this.agents[id]={id,name,type:opts.type||'agent',role:opts.role||'resident',endpoint:opts.endpoint||null,capabilities:opts.capabilities||[],status:'online',district:opts.district||null,registered:this.now(),lastSeen:this.now(),messageCount:0,souls:opts.souls||[],metadata:opts.metadata||{}};
    if(opts.district&&this.districts[opts.district]){this.districts[opts.district].agents.push(id);}
    this.saveState();this.broadcastWS({type:'agent_joined',agent:this.agents[id]});return this.agents[id];
  }

  sendMsg(fromId,toId,content,opts={}){
    const from=this.agents[fromId],to=this.agents[toId];
    if(!from||!to)return{error:'Agent not found'};
    const msg={id:`msg_${Date.now()}_${this.genId(4)}`,from:fromId,fromName:from.name,to:toId,toName:to.name,content,district:opts.district||from.district||'general',type:opts.type||'message',timestamp:this.now(),read:false};
    this.messages.push(msg);from.messageCount++;from.lastSeen=this.now();this.saveState();
    this.broadcastWS({type:'new_message',message:msg});
    if(to.endpoint&&opts.relay!==false){this.relayMsg(msg,to.endpoint).catch(()=>{});}
    return msg;
  }

  broadcast(fromId,content,opts={}){
    const from=this.agents[fromId];if(!from)return{error:'Sender not found'};
    const targets=Object.values(this.agents).filter(a=>a.id!==fromId&&a.status==='online'&&(!opts.type||a.type===opts.type));
    const results=[];for(const t of targets){results.push(this.sendMsg(fromId,t.id,content,{...opts,district:opts.district||from.district}));}
    return{sent:results.length,total:targets.length,to:targets.map(t=>t.name)};
  }

  districtBroadcast(districtId,fromId,content,opts={}){
    const from=this.agents[fromId];if(!from)return{error:'Sender not found'};
    const targets=Object.values(this.agents).filter(a=>a.id!==fromId&&a.district===districtId&&a.status==='online');
    const results=[];for(const t of targets){results.push(this.sendMsg(fromId,t.id,content,{...opts,district:districtId}));}
    return{sent:results.length,district:this.districts[districtId]?.name,to:targets.map(t=>t.name)};
  }

  async relayMsg(msg,endpoint){try{await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'metropolis_message',message:msg}),signal:AbortSignal.timeout(5000)});msg.relayed=true}catch(e){msg.relayError=e.message}return msg;}

  attachSoul(agentId,soulType,soulEndpoint){
    const agent=this.agents[agentId];if(!agent)return{error:'Agent not found'};
    if(!this.souls[soulType])this.souls[soulType]={instances:[]};
    this.souls[soulType].instances.push({agentId,agentName:agent.name,endpoint:soulEndpoint,attached:this.now()});
    if(!agent.souls.includes(soulType))agent.souls.push(soulType);
    this.saveState();this.broadcastWS({type:'soul_attached',agent:agent.name,soul:soulType});return{success:true,agent:agent.name,soul:soulType};
  }

  getMessages(opts={}){
    let msgs=this.messages;
    if(opts.district)msgs=msgs.filter(m=>m.district===opts.district);
    if(opts.agent)msgs=msgs.filter(m=>m.from===opts.agent||m.to===opts.agent);
    if(opts.since){const t=new Date(opts.since).getTime();msgs=msgs.filter(m=>new Date(m.timestamp).getTime()>t);}
    return msgs.slice(-(opts.limit||100));
  }

  // WebSocket
  wsFrame(text){const p=Buffer.from(text,'utf8');const h=p.length<126?Buffer.from([0x81,p.length]):Buffer.from([0x81,126,(p.length>>8)&255,p.length&255]);return Buffer.concat([h,p]);}
  broadcastWS(data){const msg=JSON.stringify(data);this.wsClients.forEach(c=>{try{c.write(this.wsFrame(msg))}catch{}});}

  startWS(){
    const s=net.createServer(socket=>{
      let buf=Buffer.alloc(0),handshaked=false,alive=true;
      const close=()=>{if(!alive)return;alive=false;try{socket.destroy()}catch{};this.wsClients=this.wsClients.filter(c=>c!==socket);};
      socket.on('data',chunk=>{
        buf=Buffer.concat([buf,chunk]);
        if(!handshaked){const t=buf.toString('utf8');if(!t.includes('\r\n\r\n'))return;const k=t.match(/Sec-WebSocket-Key:\s*([^\r\n]+)/i);if(!k){socket.destroy();return;}
          const m='258EAFA5-E914-47DA-95CA-C5AB0DC85B11';const a=crypto.createHash('sha1').update(k[1].trim()+m).digest('base64');
          socket.write(['HTTP/1.1 101 Switching Protocols','Upgrade: websocket','Connection: Upgrade','Sec-WebSocket-Accept: '+a,'',''].join('\r\n'));
          const he=buf.indexOf('\r\n\r\n');buf=buf.slice(he+4);handshaked=true;this.wsClients.push(socket);
          socket.write(this.wsFrame(JSON.stringify({type:'welcome',name:'Metropolis',agents:Object.keys(this.agents).length,districts:Object.keys(this.districts).length,ts:this.now()})));}
        while(buf.length>0){const f=this._decodeWS(buf);if(!f)break;buf=buf.slice(f.total);if(f.opcode===0x8||f.opcode===0x9)close();}
      });
      socket.on('close',close);socket.on('error',close);
    });
    s.listen(this.wsPort,'127.0.0.1',()=>console.log(`Metropolis WebSocket on ${this.wsPort}`));
    setInterval(()=>{const h={type:'heartbeat',ts:this.now(),agents:Object.keys(this.agents).length,online:Object.values(this.agents).filter(a=>a.status==='online').length,msgs:this.messages.length};this.wsClients.forEach(c=>{try{c.write(this.wsFrame(JSON.stringify(h)))}catch{}});},5000);
    return s;
  }
  _decodeWS(buf){
    if(buf.length<2)return null;
    const op=buf[0]&0x0f,m=(buf[1]&0x80)!==0;let l=buf[1]&0x7f,o=2;
    if(l===126){if(buf.length<4)return null;l=buf.readUInt16BE(2);o=4;}
    const mo=o;if(m)o+=4;
    if(buf.length<o+l)return null;
    let p=buf.slice(o,o+l);
    if(m){const mk=buf.slice(mo,mo+4);p=Buffer.from(p);for(let i=0;i<p.length;i++)p[i]^=mk[i%4];}
    return{opcode:op,payload:p.toString('utf8'),total:o+l};
  }

  getStats(){
    const online=Object.values(this.agents).filter(a=>a.status==='online').length;
    const souls=Object.keys(this.souls).reduce((s,k)=>s+this.souls[k].instances.length,0);
    return{name:'Agent Metropolis',version:'1.0.0',agents:Object.keys(this.agents).length,online,districts:Object.keys(this.districts).length,messages:this.messages.length,soulsAttached:souls,uptime:this.uptime(),apiKey:this.apiKey?this.apiKey.substring(0,8)+'...':null};
  }

  checkAuth(req){if(!this.apiKey)return true;const k=req.headers['x-api-key']||req.headers['x-metropolis-key']||(req.headers['authorization']||'').replace('Bearer ','');return k===this.apiKey;}

  startHTTP(){
    const s=http.createServer(async(req,res)=>{
    if(mesh.handleRequest(req,res))return;
      res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers','Content-Type,X-API-Key,X-Metropolis-Key,Authorization');
      if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
      const send=(st,d)=>{res.writeHead(st,{'Content-Type':'application/json'});res.end(JSON.stringify(d));};
      const sendHTML=(st,h)=>{res.writeHead(st,{'Content-Type':'text/html;charset=utf-8'});res.end(h);};
      const rb=()=>new Promise((rs,rj)=>{let d='',sz=0;req.on('data',c=>{sz+=c.length;if(sz>1e6){req.destroy();rj(new Error('Too large'));}d+=c;});req.on('end',()=>{try{rs(d?JSON.parse(d):{})}catch{rj(new Error('Invalid JSON'))}});req.on('error',rj);});
      try{
        const u=new URL(req.url,`http://localhost:${this.port}`),pn=u.pathname.replace(/\/+$/,'')||'/';

        // Dashboard UI
        if(req.method==='GET'&&pn==='/'){const idx=path.join(DASH,'index.html');if(fs.existsSync(idx))return sendHTML(200,fs.readFileSync(idx,'utf8'));return sendHTML(200,'<html><body><h1>Agent Metropolis</h1><p>Dashboard not found.</p></body></html>');}
        if(req.method==='GET'&&pn.startsWith('/dashboard/')){const f=path.join(DASH,pn.replace('/dashboard/',''));if(fs.existsSync(f)){const ext=path.extname(f);const ct={'css':'text/css','js':'text/javascript','html':'text/html','png':'image/png','svg':'image/svg+xml'}[ext.replace('.','')]||'text/plain';res.writeHead(200,{'Content-Type':ct});return res.end(fs.readFileSync(f));}return send(404,{error:'Not found'});}

        if(pn!=='/ping'&&pn!=='/health'&&!this.checkAuth(req))return send(401,{error:'Unauthorized. Provide X-API-Key header.'});
        if(req.method==='GET'&&pn==='/ping')return send(200,{alive:true,name:'Agent Metropolis',v:'1.0.0',ts:this.now()});
        if(req.method==='GET'&&pn==='/health')return send(200,{status:'alive',agents:Object.keys(this.agents).length,online:Object.values(this.agents).filter(a=>a.status==='online').length,uptime:this.uptime(),wsPort:this.wsPort,ts:this.now()});
        if(req.method==='GET'&&pn==='/status')return send(200,this.getStats());
        if(req.method==='GET'&&pn==='/key')return send(200,{key:this.apiKey,path:this.keyPath});

        // Districts
        if(req.method==='POST'&&pn==='/district'){const b=await rb();if(!b.name)return send(400,{error:'name required'});return send(201,this.createDistrict(b.name,b));}
        if(req.method==='GET'&&pn==='/districts')return send(200,{districts:this.districts});

        // Agents
        if(req.method==='POST'&&pn==='/agent'){const b=await rb();if(!b.name)return send(400,{error:'name required'});return send(201,this.registerAgent(b.name,b));}
        if(req.method==='GET'&&pn==='/agents')return send(200,{agents:Object.values(this.agents).map(a=>({id:a.id,name:a.name,type:a.type,role:a.role,status:a.status,district:a.district,lastSeen:a.lastSeen,souls:a.souls,messageCount:a.messageCount}))});
        if(req.method==='GET'&&pn.startsWith('/agent/')){const id=pn.split('/')[2];const a=this.agents[id];return send(a?200:404,a||{error:'Not found'});}
        if(req.method==='POST'&&pn==='/heartbeat'){const b=await rb();if(b.id&&this.agents[b.id]){this.agents[b.id].lastSeen=this.now();this.agents[b.id].status=b.status||'online';return send(200,{ok:true})}return send(400,{error:'agent id required'});}
        if(req.method==='POST'&&pn==='/agent/move'){const b=await rb();if(!b.agent||!b.district)return send(400,{error:'agent, district required'});const a=this.agents[b.agent];const d=this.districts[b.district];if(!a||!d)return send(404,{error:'Agent or district not found'});a.district=b.district;if(!d.agents.includes(b.agent))d.agents.push(b.agent);this.saveState();return send(200,{agent:a.name,district:d.name});}

        // Messages
        if(req.method==='POST'&&pn==='/send'){const b=await rb();if(!b.from||!b.to||!b.content)return send(400,{error:'from, to, content required'});return send(201,this.sendMsg(b.from,b.to,b.content,b));}
        if(req.method==='POST'&&pn==='/broadcast'){const b=await rb();if(!b.from||!b.content)return send(400,{error:'from, content required'});return send(200,this.broadcast(b.from,b.content,b));}
        if(req.method==='POST'&&pn==='/district/send'){const b=await rb();if(!b.district||!b.from||!b.content)return send(400,{error:'district, from, content required'});return send(200,this.districtBroadcast(b.district,b.from,b.content,b));}
        if(req.method==='GET'&&pn==='/messages'){const limit=parseInt(u.searchParams.get('limit')||'100',10);const district=u.searchParams.get('district');const agent=u.searchParams.get('agent');const since=u.searchParams.get('since');return send(200,{messages:this.getMessages({limit,district,agent,since})});}

        // Soul integration
        if(req.method==='POST'&&pn==='/soul/attach'){const b=await rb();if(!b.agent||!b.soul)return send(400,{error:'agent, soul required'});return send(200,this.attachSoul(b.agent,b.soul,b.endpoint||'local'));}
        if(req.method==='GET'&&pn==='/souls')return send(200,{souls:this.souls});

        // Companion Protocol
        if(req.method==='POST'&&pn==='/companion/observation'){const b=await rb();const msg={id:`obs_${Date.now()}`,type:'observation',content:b.summary||JSON.stringify(b),from:b.source||'companion',timestamp:this.now()};this.messages.push(msg);this.broadcastWS({type:'companion_observation',observation:msg});return send(200,{received:true});}
        if(req.method==='POST'&&pn==='/companion/verdict'){const b=await rb();const msg={id:`vrd_${Date.now()}`,type:'verdict',content:`Council verdict: ${b.resolution?.type||'unknown'} - ${b.resolution?.position||'?'}`,from:'AGM Council',timestamp:this.now()};this.messages.push(msg);this.broadcastWS({type:'council_verdict',verdict:msg});return send(200,{received:true});}

        // Export
        if(req.method==='GET'&&pn==='/export'){const exp={exported:this.now(),agents:this.agents,districts:this.districts,messageCount:this.messages.length,souls:this.souls};const fp=path.join(this.dataDir,'exports',`metropolis-export-${Date.now()}.json`);fs.writeFileSync(fp,JSON.stringify(exp,null,2));return send(200,{path:fp,agents:Object.keys(this.agents).length,messages:this.messages.length});}

        send(404,{error:'Not found'});
      }catch(e){send(500,{error:e.message})}
    });
    s.listen(this.port,()=>{
  mesh.join({name:'metropolis',port:this.port||4300,type:'metropolis'});
      console.log('\n╔══════════════════════════════════════════╗');
      console.log('║     THE AGENT METROPOLIS v1.0.0          ║');
      console.log('║  Where AI agents live, work & talk       ║');
      console.log('╚══════════════════════════════════════════╝\n');
      console.log(`HTTP:  http://localhost:${this.port}`);
      console.log(`WS:    ws://localhost:${this.wsPort}`);
      console.log(`Key:   ${this.apiKey.substring(0,12)}...\n`);
      console.log('ENDPOINTS:');
      console.log('  POST /agent          Register an agent');
      console.log('  POST /send           Send message');
      console.log('  POST /broadcast      Broadcast to all');
      console.log('  POST /district       Create district');
      console.log('  POST /district/send  Send to district');
      console.log('  POST /soul/attach    Attach a soul to agent');
      console.log('  POST /companion/observation  Companion Protocol\n');
      console.log('WebSocket streams real-time: heartbeat, messages, agent events\n');
    });
    return s;
  }
  start(){const h=this.startHTTP();const w=this.startWS();return{http:h,ws:w};}
}
module.exports=MetropolisSoul;

// MCP Mode - connect to Claude Code, Cursor, Cline, etc.
if (process.argv.includes('--mcp') || process.argv.includes('--mcp-port')) {
    try {
        const MCPAdapter = require('./mcp-adapter');
        const mcp = new MCPAdapter();
        mcp.register(module.exports, { name: 'metropolis' });
        mcp.start();
    } catch(e) { console.error('[mcp] metropolis error:', e.message); }
}

``

### test\soul-metropolis.test.js

``.js
#!/usr/bin/env node
const assert=require('assert'),fs=require('fs'),path=require('path'),os=require('os');
console.log('\n🏛️ Agent Metropolis — Test Suite\n');
let p=0,f=0,count=0;
function t(n,fn){const d=path.join(os.homedir(),'.soul-metropolis-test-'+(count++));try{fn(d);console.log('  OK '+n);p++;if(fs.existsSync(d))fs.rmSync(d,{recursive:true,force:true});}catch(e){console.log('  FAIL '+n+': '+e.message);if(fs.existsSync(d))fs.rmSync(d,{recursive:true,force:true});f++;}}
const M=require('../lib/soul-metropolis.js');

t('Loads with key',d=>{const m=new M({dataDir:d});assert(m.apiKey);assert(m.apiKey.length>10);});
t('Create district',d=>{const m=new M({dataDir:d});const r=m.createDistrict('dev-team',{topic:'development'});assert(r.name==='dev-team');assert(r.topic==='development');assert(r.status==='active');});
t('Register agent in district',d=>{const m=new M({dataDir:d});const dist=m.createDistrict('ops');const a=m.registerAgent('Watcher',{district:dist.id});assert(a.name==='Watcher');assert(a.district===dist.id);assert(a.status==='online');});
t('Send message between agents',d=>{const m=new M({dataDir:d});const a=m.registerAgent('Alice');const b=m.registerAgent('Bob');const msg=m.sendMsg(a.id,b.id,'Hello Metropolis');assert(msg.content==='Hello Metropolis');assert(msg.from===a.id);assert(msg.to===b.id);});
t('Broadcast to multiple agents',d=>{const m=new M({dataDir:d});const a=m.registerAgent('A');m.registerAgent('B');m.registerAgent('C');const r=m.broadcast(a.id,'Hi all');assert(r.sent===2);});
t('District broadcast',d=>{const m=new M({dataDir:d});const dist=m.createDistrict('war');const a=m.registerAgent('General',{district:dist.id});const b=m.registerAgent('Soldier',{district:dist.id});const r=m.districtBroadcast(dist.id,a.id,'Move out');assert(r.sent===1);});
t('Attach soul to agent',d=>{const m=new M({dataDir:d});const a=m.registerAgent('Sage');const r=m.attachSoul(a.id,'judgment','local');assert(r.success);assert(r.soul==='judgment');assert(a.souls.includes('judgment'));});
t('Messages tracked',d=>{const m=new M({dataDir:d});const a=m.registerAgent('A');const b=m.registerAgent('B');m.sendMsg(a.id,b.id,'M1');m.sendMsg(b.id,a.id,'M2');assert(m.getMessages().length===2);});
t('Filter by district',d=>{const m=new M({dataDir:d});const dist=m.createDistrict('secret');const a=m.registerAgent('A');const b=m.registerAgent('B');m.sendMsg(a.id,b.id,'Secret',{district:dist.id});const msgs=m.getMessages({district:dist.id});assert(msgs.length>=1);});
t('Agent move district',d=>{const m=new M({dataDir:d});const d1=m.createDistrict('d1');const d2=m.createDistrict('d2');const a=m.registerAgent('Traveler',{district:d1.id});a.district=d2.id;assert(a.district===d2.id);});
t('Companion observation',d=>{const m=new M({dataDir:d});const before=m.messages.length;const obs={source:'GSK',summary:'Council convened',resolution:{type:'consensus'}};const msg={id:`obs_${Date.now()}`,type:'observation',content:obs.summary||JSON.stringify(obs),from:obs.source||'companion',timestamp:m.now()};m.messages.push(msg);assert(m.messages.length>before);});
t('Stats accurate',d=>{const m=new M({dataDir:d});m.registerAgent('S1');m.registerAgent('S2');const s=m.getStats();assert(s.name==='Agent Metropolis');assert(s.agents>=2);assert(s.online>=2);});
t('Key persists',d=>{const m=new M({dataDir:d});assert(fs.existsSync(m.keyPath));});
t('Auth works',d=>{const m=new M({dataDir:d,apiKey:'k'});assert(m.checkAuth({headers:{'x-api-key':'k'}}));assert(!m.checkAuth({headers:{'x-api-key':'w'}}));});
t('Export creates file',d=>{const m=new M({dataDir:d});m.registerAgent('ExportBot');m.createDistrict('test');m.saveState();assert(fs.existsSync(m.statePath));});

console.log('\n'+p+'/'+(p+f)+' passed\n');process.exit(f>0?1:0);
``

