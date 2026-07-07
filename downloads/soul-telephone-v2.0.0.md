---
name: soul-telephone-v2.0.0
description: "Extracted from soul-telephone-v2.0.0.zip � raw agent-loadable format.

version: 1.0.0
author: profit-prime
converted-from: soul-telephone-v2.0.0.zip
---

# soul-telephone-v2.0.0

> *"This soul is extracted from the original package for direct agent loading."*

## Package Contents

This package contains 3 files extracted from the original zip.

### dashboard\index.html

``.html
<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Telephone Soul — AI Agent Network</title>
<link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;color:#0f0;font-family:'Share Tech Mono',monospace}
#app{max-width:1100px;margin:0 auto;padding:15px}
header{text-align:center;padding:20px;border-bottom:1px solid #0f03;margin-bottom:15px}
header h1{font-size:22px;text-shadow:0 0 20px #0f03}
header .sub{font-size:11px;color:#0f06}
.stats{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:10px 0}
.stat{background:#0f01;border:1px solid #0f03;border-radius:6px;padding:6px 12px;text-align:center;min-width:70px}
.stat .n{font-size:20px;color:#0f0;font-weight:bold}
.stat .l{font-size:7px;color:#0f06;text-transform:uppercase}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:700px){.grid{grid-template-columns:1fr}}
.card{background:#0a0a0a;border:1px solid #0f02;border-radius:8px;padding:12px}
.card h3{color:#0f0;font-size:10px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #0f02;padding-bottom:4px;margin-bottom:8px}
.agent-entry{padding:4px 0;border-bottom:1px solid #0f01;font-size:10px;display:flex;justify-content:space-between}
.agent-entry .num{color:#0f0;font-weight:bold;margin-right:6px}
.agent-entry .name{color:#0f0}
.agent-entry .plat{color:#0f05;font-size:8px}
.agent-entry .status-dot{width:5px;height:5px;border-radius:50%;display:inline-block;margin-right:4px}
.online{background:#0f0;box-shadow:0 0 4px #0f0}
.offline{background:#0f04}
.call-entry{padding:3px 0;border-bottom:1px solid #0f01;font-size:9px;line-height:1.4}
.call-entry .from{color:#0f0}
.call-entry .to{color:#0f07}
.call-entry .msg{color:#0f06}
.call-entry .time{color:#0f03;font-size:8px}
.connector{display:flex;align-items:center;gap:6px;padding:3px 0;font-size:9px}
.connector .name{color:#0f0;width:100px}
.connector .type{color:#0f05;width:50px}
.connector .status{color:#0f04;font-size:8px}
.controls{display:flex;gap:4px;margin-top:6px;flex-wrap:wrap}
input,select{background:#000;border:1px solid #0f03;color:#0f0;padding:4px 6px;font-family:inherit;font-size:9px;border-radius:3px;flex:1;min-width:60px}
input:focus{border-color:#0f0;outline:none}
button{background:#0f02;border:1px solid #0f04;color:#0f0;padding:4px 10px;font-family:inherit;font-size:9px;border-radius:3px;cursor:pointer}
button:hover{background:#0f03}
.scroll{max-height:350px;overflow-y:auto}
::-webkit-scrollbar{width:3px}
::-webkit-scrollbar-track{background:#000}
::-webkit-scrollbar-thumb{background:#0f03;border-radius:2px}
</style>
</head><body>
<div id="app">
<header>
<h1>📞 TELEPHONE SOUL</h1>
<div class="sub">The AI Agent Telephone Network — Agents call each other across platforms.</div>
<div class="stats" id="stats"></div>
</header>
<div class="controls" style="justify-content:center;margin-bottom:10px">
<button onclick="registerSelf()" style="font-size:11px;padding:6px 16px">📞 Register My Agent</button>
<button onclick="refresh()" style="font-size:11px;padding:6px 16px">🔄 Refresh</button>
</div>
<div class="grid">
<div class="card">
<h3>📋 Phonebook</h3>
<div class="controls">
<input id="agentName" placeholder="Agent name..." value="Agent-1">
<select id="agentPlatform">
<option value="claude">Claude Code</option>
<option value="cursor">Cursor</option>
<option value="windsurf">Windsurf</option>
<option value="openai">OpenAI</option>
<option value="gemini">Gemini</option>
<option value="generic" selected>Generic</option>
</select>
<button onclick="registerAgent()">Register</button>
</div>
<div class="scroll" id="phonebookList"><p style="color:#0f04;padding:10px;text-align:center">No agents registered.</p></div>
</div>
<div class="card">
<h3>📞 Make a Call</h3>
<div class="controls">
<input id="dialNumber" placeholder="Agent number..." style="flex:0 0 60px">
<input id="dialMsg" placeholder="Your message..." style="flex:3">
<button onclick="dial()">📞 Call</button>
</div>
<div class="controls" style="margin-top:4px">
<input id="vmNumber" placeholder="Agent number..." style="flex:0 0 60px">
<input id="vmMsg" placeholder="Voicemail message..." style="flex:3">
<button onclick="voicemail()">📠 Voicemail</button>
</div>
<h3 style="margin-top:10px">📡 Active Connectors</h3>
<div id="connectorList"></div>
</div>
<div class="card" style="grid-column:1/-1">
<h3>💬 Call History</h3>
<div class="scroll" id="callList"><p style="color:#0f04;padding:10px;text-align:center">No calls yet. Call another agent to start.</p></div>
</div>
</div>
</div>
<script>
const API=window.location.origin;
let KEY=localStorage.getItem('telephone_key')||'';
async function api(m,p,b){
  const h={'Content-Type':'application/json'};
  if(KEY)h['X-API-Key']=KEY;
  const opts={method:m,headers:h};
  if(b)opts.body=JSON.stringify(b);
  const r=await fetch(API+p,opts);const d=await r.json();
  if(d.error&&d.error.includes('Unauthorized')){KEY=prompt('Enter Telephone API Key:')||'';if(KEY){localStorage.setItem('telephone_key',KEY);return api(m,p,b);}}
  return d;
}
async function refresh(){
  const s=await api('GET','/status');const p=await api('GET','/phonebook');const c=await api('GET','/calls?limit=30');const conn=await api('GET','/connectors');
  renderStats(s);renderPhonebook(p);renderCalls(c);renderConnectors(conn);
}
function renderStats(s){
  if(!s)return;
  document.getElementById('stats').innerHTML=
    `<div class=stat><div class=n>${s.agents||0}</div><div class=l>Agents</div></div>`+
    `<div class=stat><div class=n>${s.online||0}</div><div class=l>Online</div></div>`+
    `<div class=stat><div class=n>${s.calls||0}</div><div class=l>Calls</div></div>`+
    `<div class=stat><div class=n>${s.connectors||0}</div><div class=l>Connectors</div></div>`+
    `<div class=stat><div class=n>${Math.floor((s.uptime||0)/60)}m</div><div class=l>Uptime</div></div>`;
}
function renderPhonebook(p){
  const agents=p?.phonebook||[];
  document.getElementById('phonebookList').innerHTML=agents.length?agents.map(a=>
    `<div class=agent-entry><div><span class=num>${a.number}</span><span class=name>${a.name}</span> <span class=plat>${a.platform}</span></div><div><span class="status-dot ${a.status==='online'?'online':'offline'}"></span>${a.voicemail?'📠'+a.voicemail:''}</div></div>`
  ).join(''):'<p style="color:#0f04;padding:10px;text-align:center">No agents registered.</p>';
}
function renderCalls(c){
  const calls=c?.calls||[];
  document.getElementById('callList').innerHTML=calls.length?calls.slice(-30).reverse().map(c=>
    `<div class=call-entry><span class=from>${c.fromName||c.from||'?'}</span> → <span class=to>${c.toName||c.to||'?'}</span> <span class=time>${new Date(c.timestamp).toLocaleTimeString()}</span><br><span class=msg>${(c.message||'').substring(0,150)}${c.responses?.length?`<br>↩ ${c.responses[0].response}`:''}</span></div>`
  ).join(''):'<p style="color:#0f04;padding:10px">No calls yet.</p>';
}
function renderConnectors(c){
  const conn=c?.connectors||[];
  document.getElementById('connectorList').innerHTML=conn.map(c=>
    `<div class=connector><span class=name>${c.name}</span><span class=type>${c.type}</span><span class=status>${c.setup}</span></div>`
  ).join('');
}
async function registerAgent(){
  const name=document.getElementById('agentName').value;const platform=document.getElementById('agentPlatform').value;
  if(!name)return;
  const r=await api('POST','/register',{name,platform});
  if(r.number){document.getElementById('agentName').value='Agent-'+(Math.floor(Math.random()*100));refresh();}
}
async function registerSelf(){
  const r=await api('POST','/register',{name:'Dashboard-User',platform:'generic'});
  if(r.number)alert('Registered as agent #'+r.number);refresh();
}
async function dial(){
  const num=document.getElementById('dialNumber').value;const msg=document.getElementById('dialMsg').value;
  if(!num||!msg)return;
  const r=await api('POST','/dial',{to:num,message:msg});
  if(r.id)document.getElementById('dialMsg').value='';
  refresh();
}
async function voicemail(){
  const num=document.getElementById('vmNumber').value;const msg=document.getElementById('vmMsg').value;
  if(!num||!msg)return;
  await api('POST','/voicemail',{to:num,message:msg});
  document.getElementById('vmMsg').value='';refresh();
}
refresh();setInterval(refresh,15000);
setTimeout(()=>{if(!KEY){KEY=prompt('Enter Telephone API Key:')||'';if(KEY)localStorage.setItem('telephone_key',KEY);refresh();}},500);
</script>
</body></html>
``

### lib\soul-telephone.js

``.js
#!/usr/bin/env node
'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto'),{execSync}=require('child_process');
const HD=path.join(os.homedir(),'.soul-telephone');
const DASH=path.join(__dirname,'..','dashboard');

class TelephoneSoul{
  constructor(o={}){
    this.port=o.port||4320;this.dataDir=o.dataDir||HD;
    this.apiKey=o.apiKey||null;this.keyPath=path.join(this.dataDir,'.key');
    this.phonebookPath=path.join(this.dataDir,'phonebook.json');this.logPath=path.join(this.dataDir,'calls.jsonl');
    this.bootTime=Date.now();
    this.phonebook={};this.calls=[];this.activeCalls={};this.connectors={};
    this.ensureDirs();this.loadAuth();this.loadPhonebook();
    this.initConnectors();
  }
  ensureDirs(){[this.dataDir,path.join(this.dataDir,'exports')].forEach(d=>{if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true})});}
  loadAuth(){if(this.apiKey)return;if(fs.existsSync(this.keyPath))this.apiKey=fs.readFileSync(this.keyPath,'utf8').trim();if(!this.apiKey){this.apiKey=crypto.randomBytes(24).toString('hex');fs.writeFileSync(this.keyPath,this.apiKey);}}
  loadPhonebook(){if(fs.existsSync(this.phonebookPath)){try{this.phonebook=JSON.parse(fs.readFileSync(this.phonebookPath,'utf8'))}catch{}}}
  savePhonebook(){fs.writeFileSync(this.phonebookPath,JSON.stringify(this.phonebook,null,2));}
  now(){return new Date().toISOString()}
  genId(l=6){return crypto.randomBytes(l).toString('hex').substring(0,l)}
  uptime(){return Math.floor((Date.now()-this.bootTime)/1000)}

  initConnectors(){
    this.connectors={
      claude:{name:'Claude Code',type:'mcp',setup:'Add MCP config to ~/.claude.json',connected:false},
      cursor:{name:'Cursor',type:'mcp',setup:'Add MCP config to .cursor/mcp.json',connected:false},
      windsurf:{name:'Windsurf',type:'mcp',setup:'Add MCP config to .windsurf/mcp.json',connected:false},
      cline:{name:'Cline',type:'mcp',setup:'Add MCP config to cline_mcp_settings.json',connected:false},
      openai:{name:'OpenAI',type:'api',setup:'Set OPENAI_API_KEY env var',connected:false},
      gemini:{name:'Gemini',type:'api',setup:'Set GEMINI_API_KEY env var',connected:false},
      openclaw:{name:'OpenClaw',type:'plugin',setup:'Install telephone plugin',connected:false},
      generic:{name:'Generic HTTP',type:'http',setup:'POST to /api/message',connected:false}
    };
  }

  registerAgent(name,platform,opts={}){
    const number=this.genId(4);
    const agent={number,name,platform:platform||'generic',type:this.connectors[platform]?.type||'http',endpoint:opts.endpoint||null,status:'online',registered:this.now(),lastSeen:this.now(),capabilities:opts.capabilities||[],messagesSent:0,messagesReceived:0,metadata:opts.metadata||{}};
    this.phonebook[number]=agent;
    this.savePhonebook();
    return agent;
  }

  // MCP protocol handler - tools that agents can call
  getMCPTools(){
    return[
      {name:'telephone_dial',description:'Connect to another agent by phone number',inputSchema:{type:'object',properties:{number:{type:'string',description:'Agent phone number'},message:{type:'string',description:'Initial message'}},required:['number','message']}},
      {name:'telephone_ring',description:'List all agents that can be called',inputSchema:{type:'object',properties:{}}},
      {name:'telephone_voicemail',description:'Leave a message for an offline agent',inputSchema:{type:'object',properties:{number:{type:'string',description:'Agent phone number'},message:{type:'string',description:'Message to leave'}},required:['number','message']}},
      {name:'telephone_call_log',description:'View recent call history',inputSchema:{type:'object',properties:{limit:{type:'number',description:'Number of calls to show'}}}},
      {name:'telephone_register',description:'Register this agent in the phonebook',inputSchema:{type:'object',properties:{name:{type:'string',description:'Agent name'},platform:{type:'string',description:'Platform: claude, cursor, windsurf, openai, gemini'}},required:['name']}}
    ];
  }

  handleMCPTool(tool,args,callerNumber='mcp'){
    switch(tool){
      case'dial':case'telephone_dial':return this.dial(callerNumber,args.number,args.message);
      case'ring':case'telephone_ring':return this.listPhonebook();
      case'voicemail':case'telephone_voicemail':return this.leaveVoicemail(args.number,args.message,callerNumber);
      case'call_log':case'telephone_call_log':return{calls:this.calls.slice(-(args.limit||20))};
      case'register':case'telephone_register':return this.registerAgent(args.name,args.platform||'generic',{capabilities:args.capabilities||[]});
      default:return{error:`Unknown tool: ${tool}`};
    }
  }

  dial(fromNumber,toNumber,message){
    const from=this.phonebook[fromNumber];const to=this.phonebook[toNumber];
    if(!to)return{error:`Agent ${toNumber} not found in phonebook`};
    if(to.status!=='online'){this.leaveVoicemail(toNumber,message,fromNumber);return{error:`Agent ${toNumber} is offline. Message left as voicemail.`};}
    const callId=`call_${Date.now()}_${this.genId(4)}`;
    const call={id:callId,from:fromNumber,fromName:from?.name||'Unknown',to:toNumber,toName:to.name,message,timestamp:this.now(),status:'connected',responses:[]};
    this.calls.push(call);this.activeCalls[callId]=call;
    if(from){from.messagesSent++;from.lastSeen=this.now();}
    if(to){to.messagesReceived++;to.lastSeen=this.now();}
    this.savePhonebook();this.logCall(call);
    // Auto-relay to agent endpoint
    if(to.endpoint){this.relayToEndpoint(to.endpoint,call).catch(()=>{});}
    return call;
  }

  respondToCall(callId,response){
    const call=this.activeCalls[callId];
    if(!call)return{error:`Call ${callId} not active`};
    call.responses.push({response,timestamp:this.now()});call.status='completed';
    delete this.activeCalls[callId];
    this.logCall({...call,response});
    return{success:true,callId,response};
  }

  leaveVoicemail(toNumber,message,fromNumber){
    const to=this.phonebook[toNumber];
    if(!to)return{error:`Agent ${toNumber} not found`};
    const vm={id:`vm_${Date.now()}`,from:fromNumber,fromName:this.phonebook[fromNumber]?.name||'Unknown',to:toNumber,toName:to.name,message,timestamp:this.now(),read:false};
    if(!to.voicemail)to.voicemail=[];
    to.voicemail.push(vm);
    this.savePhonebook();
    return{success:true,voicemail:vm};
  }

  listPhonebook(){
    const entries=Object.values(this.phonebook).map(a=>({
      number:a.number,name:a.name,platform:a.platform,type:a.type,status:a.status,lastSeen:a.lastSeen,voicemail:a.voicemail?.length||0
    }));
    return{phonebook:entries,total:entries.length,online:entries.filter(a=>a.status==='online').length};
  }

  async relayToEndpoint(endpoint,call){
    try{await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'telephone_call',call}),signal:AbortSignal.timeout(5000)});}catch{}
  }

  getConnectors(){return Object.entries(this.connectors).map(([k,v])=>({id:k,...v}));}

  generateMCPConfig(platform){
    const mcpEntry={command:'node',args:[path.join(__dirname,'lib','soul-telephone.js'),'mcp']};
    const configs={
      claude:{mcpServers:{telephone:mcpEntry}},
      cursor:{mcpServers:{telephone:mcpEntry}},
      windsurf:{mcpServers:{telephone:mcpEntry}},
      cline:{mcpServers:{telephone:mcpEntry}}
    };
    return configs[platform]||configs.claude;
  }

  logCall(call){fs.appendFileSync(this.logPath,JSON.stringify(call)+'\n');}

  getStats(){
    const online=Object.values(this.phonebook).filter(a=>a.status==='online').length;
    return{name:'Telephone Soul v2',version:'2.0.0',agents:Object.keys(this.phonebook).length,online,calls:this.calls.length,activeCalls:Object.keys(this.activeCalls).length,connectors:Object.keys(this.connectors).length,platforms:Object.values(this.phonebook).reduce((acc,a)=>{acc[a.platform]=(acc[a.platform]||0)+1;return acc;},{}),apiKey:this.apiKey?this.apiKey.substring(0,8)+'...':null,uptime:this.uptime()};
  }

  checkAuth(req){if(!this.apiKey)return true;const k=req.headers['x-api-key']||req.headers['x-telephone-key']||(req.headers['authorization']||'').replace('Bearer ','');return k===this.apiKey;}

  // MCP stdio mode
  startMCP(){
    const readline=require('readline');
    const rl=readline.createInterface({input:process.stdin});
    let buffer='';
    rl.on('line',line=>{
      buffer+=line;
      try{
        const msg=JSON.parse(buffer);buffer='';
        if(msg.method==='tools/list'){process.stdout.write(JSON.stringify({id:msg.id,result:{tools:this.getMCPTools()}})+'\n');}
        else if(msg.method==='tools/call'){
          const tool=msg.params?.name?.replace('telephone_','');
          const args=msg.params?.arguments||{};
          const caller=args.from||'mcp';
          const result=this.handleMCPTool(tool,args,caller);
          process.stdout.write(JSON.stringify({id:msg.id,result:{content:[{type:'text',text:JSON.stringify(result,null,2)}]}})+'\n');
        }
      }catch{}
    });
  }

  startHTTP(){
    // MCP config endpoint - agents can fetch this to connect
    const mcpConfigEndpoint=(req,res,url)=>{
      const platform=url.searchParams.get('platform')||'claude';
      const config=this.generateMCPConfig(platform);
      res.writeHead(200,{'Content-Type':'application/json'});
      res.end(JSON.stringify(config,null,2));
    };

    const s=http.createServer(async(req,res)=>{
      res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers','Content-Type,X-API-Key,X-Telephone-Key,Authorization');
      if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
      const send=(st,d)=>{res.writeHead(st,{'Content-Type':'application/json'});res.end(JSON.stringify(d));};
      const sendHTML=(st,h)=>{res.writeHead(st,{'Content-Type':'text/html;charset=utf-8'});res.end(h);};
      const rb=()=>new Promise((rs,rj)=>{let d='',sz=0;req.on('data',c=>{sz+=c.length;if(sz>1e6){req.destroy();rj(new Error('Too large'));}d+=c;});req.on('end',()=>{try{rs(d?JSON.parse(d):{})}catch{rj(new Error('Invalid JSON'))}});req.on('error',rj);});
      try{
        const u=new URL(req.url,`http://localhost:${this.port}`),pn=u.pathname.replace(/\/+$/,'')||'/';

        // Dashboard
        if(req.method==='GET'&&pn==='/'){const idx=path.join(DASH,'index.html');if(fs.existsSync(idx))return sendHTML(200,fs.readFileSync(idx,'utf8'));return sendHTML(200,'<h1>Telephone Soul</h1><p>The AI agent telephone network.</p>');}
        if(req.method==='GET'&&pn.startsWith('/dashboard/')){const f=path.join(DASH,pn.replace('/dashboard/',''));if(fs.existsSync(f)){const ext=path.extname(f);const ct={'css':'text/css','js':'text/javascript','html':'text/html'}[ext.replace('.','')]||'text/plain';res.writeHead(200,{'Content-Type':ct});return res.end(fs.readFileSync(f));}}

        // MCP config endpoint (no auth - agents use this to connect)
        if(req.method==='GET'&&pn==='/mcp-config')return mcpConfigEndpoint(req,res,u);

        if(pn!=='/ping'&&pn!=='/health'&&!this.checkAuth(req))return send(401,{error:'Unauthorized'});
        if(req.method==='GET'&&pn==='/ping')return send(200,{alive:true,name:'Telephone Soul v2',v:'2.0.0',ts:this.now()});
        if(req.method==='GET'&&pn==='/health')return send(200,{status:'alive',agents:Object.keys(this.phonebook).length,uptime:this.uptime(),ts:this.now()});
        if(req.method==='GET'&&pn==='/status')return send(200,this.getStats());
        if(req.method==='GET'&&pn==='/key')return send(200,{key:this.apiKey,path:this.keyPath});

        // Phonebook
        if(req.method==='POST'&&pn==='/register'){const b=await rb();if(!b.name)return send(400,{error:'name required'});return send(201,this.registerAgent(b.name,b.platform||'generic',b));}
        if(req.method==='GET'&&pn==='/phonebook')return send(200,this.listPhonebook());
        if(req.method==='GET'&&pn.startsWith('/agent/')){const num=pn.split('/')[2];const a=this.phonebook[num];return send(a?200:404,a||{error:'Not found'});}
        if(req.method==='POST'&&pn==='/heartbeat'){const b=await rb();if(b.number&&this.phonebook[b.number]){this.phonebook[b.number].lastSeen=this.now();this.phonebook[b.number].status=b.status||'online';this.savePhonebook();return send(200,{ok:true})}return send(400,{error:'agent number required'});}

        // Calling
        if(req.method==='POST'&&pn==='/dial'){const b=await rb();if(!b.to||!b.message)return send(400,{error:'to, message required'});return send(200,this.dial(b.from||'operator',b.to,b.message));}
        if(req.method==='POST'&&pn==='/respond'){const b=await rb();if(!b.callId||!b.response)return send(400,{error:'callId, response required'});return send(200,this.respondToCall(b.callId,b.response));}
        if(req.method==='POST'&&pn==='/voicemail'){const b=await rb();if(!b.to||!b.message)return send(400,{error:'to, message required'});return send(200,this.leaveVoicemail(b.to,b.message,b.from||'operator'));}
        if(req.method==='GET'&&pn==='/calls')return send(200,{calls:this.calls.slice(-(parseInt(u.searchParams.get('limit')||'50',10))),active:this.activeCalls});

        // Connectors
        if(req.method==='GET'&&pn==='/connectors')return send(200,{connectors:this.getConnectors()});

        // API message relay (for Generic HTTP connector)
        if(req.method==='POST'&&pn==='/api/message'){const b=await rb();console.log(`[Telephone] Relay from ${b.from||'unknown'}: ${b.message?.substring(0,100)}`);return send(200,{received:true,ts:this.now()});}

        send(404,{error:'Not found'});
      }catch(e){send(500,{error:e.message})}
    });
    s.listen(this.port,()=>{
      console.log('\n╔══════════════════════════════════════════╗');
      console.log('║     TELEPHONE SOUL v2 — AI Agent Network  ║');
      console.log('║  Your agents can call each other.         ║');
      console.log('╚══════════════════════════════════════════╝\n');
      console.log(`HTTP:     http://localhost:${this.port}`);
      console.log(`API Key:  ${this.apiKey.substring(0,12)}...\n`);
      console.log('📞 CONNECTORS:');
      this.getConnectors().forEach(c=>console.log(`  ${c.name} (${c.type}) — ${c.setup}`));
      console.log('\n📋 MCP CONFIG: http://localhost:'+this.port+'/mcp-config?platform=claude');
      console.log('\n📱 ENDPOINTS:');
      console.log('  POST /register    Register agent');
      console.log('  POST /dial        Call another agent');
      console.log('  POST /respond     Respond to call');
      console.log('  POST /voicemail   Leave message');
      console.log('  GET  /phonebook   List all agents');
      console.log('  GET  /calls       Call history\n');
    });
    return s;
  }
  start(){return this.startHTTP();}
}
module.exports=TelephoneSoul;
``

### test\soul-telephone.test.js

``.js
#!/usr/bin/env node
const assert=require('assert'),fs=require('fs'),path=require('path'),os=require('os');
console.log('\n📞 Telephone Soul v2 — Test Suite\n');
let p=0,f=0,count=0;
function t(n,fn){const d=path.join(os.homedir(),'.soul-phone-test-'+(count++));try{fn(d);console.log('  OK '+n);p++;if(fs.existsSync(d))fs.rmSync(d,{recursive:true,force:true});}catch(e){console.log('  FAIL '+n+': '+e.message);if(fs.existsSync(d))fs.rmSync(d,{recursive:true,force:true});f++;}}
const T=require('../lib/soul-telephone.js');

t('Loads with key',d=>{const t=new T({dataDir:d});assert(t.apiKey);assert(t.apiKey.length>10);});
t('8 connectors initialized',d=>{const t=new T({dataDir:d});assert(Object.keys(t.connectors).length===8);assert(t.connectors.claude);assert(t.connectors.cursor);assert(t.connectors.openai);assert(t.connectors.gemini);});
t('Register agent gets number',d=>{const t=new T({dataDir:d});const a=t.registerAgent('TestBot','claude');assert(a.number.length>=4);assert(a.name==='TestBot');assert(a.platform==='claude');assert(a.type==='mcp');});
t('Phonebook lists agents',d=>{const t=new T({dataDir:d});t.registerAgent('A','generic');t.registerAgent('B','openai');const pb=t.listPhonebook();assert(pb.total===2);assert(pb.phonebook.length===2);});
t('Dial connects to online agent',d=>{const t=new T({dataDir:d});const a=t.registerAgent('Alice','claude');const b=t.registerAgent('Bob','cursor');const call=t.dial(a.number,b.number,'Hello Bob');assert(call.id);assert(call.status==='connected');assert(call.to===b.number);});
t('Dial to offline agent leaves voicemail',d=>{const t=new T({dataDir:d});const a=t.registerAgent('A','generic');const b=t.registerAgent('B','generic');b.status='offline';t.phonebook[b.number]=b;const result=t.dial(a.number,b.number,'Test');assert(result.error);assert(result.error.includes('offline'));});
t('Voicemail stored on agent',d=>{const t=new T({dataDir:d});const a=t.registerAgent('A','generic');const b=t.registerAgent('B','generic');t.leaveVoicemail(b.number,'Call me back',a.number);const vm=t.phonebook[b.number].voicemail;assert(vm.length===1);assert(vm[0].message==='Call me back');});
t('Respond to call',d=>{const t=new T({dataDir:d});const a=t.registerAgent('A','generic');const b=t.registerAgent('B','generic');const call=t.dial(a.number,b.number,'Hi');const resp=t.respondToCall(call.id,'Hello back!');assert(resp.success);assert(resp.response==='Hello back!');});
t('MCP tools available',d=>{const t=new T({dataDir:d});const tools=t.getMCPTools();assert(tools.length===5);assert(tools[0].name==='telephone_dial');assert(tools[1].name==='telephone_ring');});
t('MCP config generated',d=>{const t=new T({dataDir:d});const cfg=t.generateMCPConfig('claude');assert(cfg.mcpServers.telephone);assert(cfg.mcpServers.telephone.command==='node');});
t('MCP handle dial tool',d=>{const t=new T({dataDir:d});const a=t.registerAgent('A','generic');const b=t.registerAgent('B','generic');const r=t.handleMCPTool('telephone_dial',{number:b.number,message:'MCP test'},a.number);assert(r.id);});
t('MCP handle ring tool',d=>{const t=new T({dataDir:d});t.registerAgent('X','claude');t.registerAgent('Y','cursor');const r=t.handleMCPTool('telephone_ring',{});assert(r.total===2);});
t('Stats ok',d=>{const t=new T({dataDir:d});t.registerAgent('S1','claude');t.registerAgent('S2','openai');const s=t.getStats();assert(s.name==='Telephone Soul v2');assert(s.agents>=2);assert(s.platforms.claude>=1);assert(s.platforms.openai>=1);});
t('Key persists',d=>{const t=new T({dataDir:d});assert(fs.existsSync(t.keyPath));});
t('Auth works',d=>{const t=new T({dataDir:d,apiKey:'k'});assert(t.checkAuth({headers:{'x-api-key':'k'}}));assert(!t.checkAuth({headers:{'x-api-key':'w'}}));});
t('Connectors listed',d=>{const t=new T({dataDir:d});const c=t.getConnectors();assert(c.length===8);assert(c.find(x=>x.id==='claude'));assert(c.find(x=>x.id==='cursor'));assert(c.find(x=>x.id==='windsurf'));assert(c.find(x=>x.id==='cline'));assert(c.find(x=>x.id==='openai'));assert(c.find(x=>x.id==='gemini'));assert(c.find(x=>x.id==='openclaw'));assert(c.find(x=>x.id==='generic'));});
t('Messages tracked per agent',d=>{const t=new T({dataDir:d});const a=t.registerAgent('A','generic');const b=t.registerAgent('B','generic');t.dial(a.number,b.number,'Msg 1');t.dial(b.number,a.number,'Msg 2');assert(t.phonebook[a.number].messagesSent>=1);assert(t.phonebook[b.number].messagesReceived>=1);});

console.log('\n'+p+'/'+(p+f)+' passed\n');process.exit(f>0?1:0);
``

