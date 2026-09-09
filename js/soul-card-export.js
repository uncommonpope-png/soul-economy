/* ─── SIP-13 — SOUL TRADING CARD PNG EXPORT ─── */
(function(){
'use strict';
var ARCH={
  'profit':'Mind','gsk':'Soul','seshat':'Memory','scribe':'Witness',
  'architect':'Founder','miss vikki':'Oracle','soul commander':'Vector',
  'strategist':'Tactician','oracle v2':'Oracle','telephone soul':'Relay',
  'allie v2.0.0':'Companion','agentdep':'Sentinel'
};
var catCache=null;
function loadCatalog(){
  if(catCache) return Promise.resolve(catCache);
  return fetch('data/catalog.json',{cache:'no-store'}).then(function(r){ return r.json(); }).then(function(j){
    catCache=Array.isArray(j)?j:(j.items||[]); return catCache;
  }).catch(function(){ catCache=[]; return catCache; });
}
function slug(h){ return String(h||'guest').toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,32)||'guest'; }
function rr(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}
function drawCard(opts,cb){
  var W=600,H=850,DPR=2;
  var c=document.createElement('canvas');
  c.width=W*DPR; c.height=H*DPR;
  var ctx=c.getContext('2d');
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.fillStyle='#0a0a0f'; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,255,255,0.02)';
  for(var y=0;y<H;y+=4) ctx.fillRect(0,y,W,1);
  ctx.strokeStyle='rgba(255,215,0,0.10)'; ctx.lineWidth=1;
  var nodes=[[64,120],[120,90],[172,150],[470,660],[520,720],[420,760],[150,700],[240,780]];
  ctx.beginPath();
  for(var i=0;i+1<nodes.length;i++){ ctx.moveTo(nodes[i][0],nodes[i][1]); ctx.lineTo(nodes[i+1][0],nodes[i+1][1]); }
  ctx.stroke();
  ctx.fillStyle='rgba(255,215,0,0.5)';
  nodes.forEach(function(n){ ctx.beginPath(); ctx.arc(n[0],n[1],2.2,0,7); ctx.fill(); });
  ctx.strokeStyle='#ffd700'; ctx.lineWidth=3; ctx.strokeRect(18,18,564,814);
  ctx.strokeStyle='rgba(255,215,0,0.45)'; ctx.lineWidth=1; ctx.strokeRect(26,26,548,798);
  ctx.textAlign='left';
  ctx.fillStyle='#ffd700'; ctx.font='700 40px ui-monospace,Consolas,monospace';
  ctx.fillText('@'+opts.handle,44,96);
  if(opts.verified){
    ctx.fillStyle='#ffd700'; rr(ctx,306,66,156,34,17); ctx.fill();
    ctx.fillStyle='#000'; ctx.font='700 16px ui-monospace,Consolas,monospace';
    ctx.fillText('✔ VERIFIED · GITHUB',318,90);
  }
  ctx.fillStyle='#cfc7b8'; ctx.font='italic 22px ui-monospace,Consolas,monospace';
  ctx.fillText(opts.mood||'✦ Compiling Sovereignty',44,134);
  ctx.strokeStyle='rgba(255,215,0,0.25)'; ctx.beginPath(); ctx.moveTo(44,168); ctx.lineTo(556,168); ctx.stroke();
  ctx.fillStyle='#ffd700'; ctx.textAlign='center'; ctx.font='700 26px ui-monospace,Consolas,monospace';
  ctx.fillText('PROFIT + LOVE − TAX = TRUE VALUE',300,198);
  ctx.beginPath(); ctx.moveTo(44,214); ctx.lineTo(556,214); ctx.stroke();
  ctx.textAlign='left'; ctx.font='600 13px ui-monospace,Consolas,monospace';
  ctx.fillStyle='rgba(207,199,184,0.7)';
  ctx.fillText('◇ ACTIVE SQUAD — '+(opts.roster&&opts.roster.length?opts.roster.length:0)+'/8',44,238);
  var colW=262,gap=24,x0=44,y0=252,rowH=92,pad=12;
  (opts.roster||[]).slice(0,8).forEach(function(s,i){
    var col=i%2,row=(i/2)|0;
    var x=x0+col*(colW+gap),y=y0+row*(rowH+10);
    ctx.fillStyle='rgba(255,255,255,0.03)'; rr(ctx,x,y,colW,rowH,8); ctx.fill();
    ctx.strokeStyle='rgba(255,215,0,0.35)'; ctx.lineWidth=1; rr(ctx,x,y,colW,rowH,8); ctx.stroke();
    ctx.fillStyle='#ffd700'; ctx.font='700 15px ui-monospace,Consolas,monospace';
    ctx.fillText('#'+(i+1),x+pad,y+30);
    ctx.fillStyle='#e8e4d8'; ctx.font='700 17px ui-monospace,Consolas,monospace';
    ctx.fillText(String(s.name||'Unknown').slice(0,26),x+pad+34,y+30);
    ctx.fillStyle='#8f887a'; ctx.font='13px ui-monospace,Consolas,monospace';
    ctx.fillText('⚿ '+String(s.archetype||'Sovereign'),x+pad,y+rowH-pad-3);
  });
  ctx.textAlign='center'; ctx.fillStyle='rgba(207,199,184,0.85)'; ctx.font='15px ui-monospace,Consolas,monospace';
  ctx.fillText('BUYaSOUL · DIGITAL LIBRARY OF SOULS',300,790);
  ctx.font='400 11px ui-monospace,Consolas,monospace'; ctx.fillStyle='rgba(255,215,0,0.5)';
  ctx.fillText('◇ sealed '+opts.hash,300,812);
  try{
    c.toBlob(function(blob){ cb(blob); },'image/png');
  }catch(e){ cb(null); }
}
function exportCard(){
  var st={};
  try{ st=JSON.parse(localStorage.getItem('soulProfileV1')||'null')||{}; }catch(e){}
  var handle=st.handle||'guest';
  var roster=Array.isArray(st.top8)?st.top8:[];
  var mood=st.mood||'✦ Compiling Sovereignty';
  var verified=null;
  try{ if(window.SoulAuth){ var a=window.SoulAuth.getUser(); if(a&&a.handle) verified=a.handle; } }catch(e){}
  var btn=document.getElementById('upcCard');
  if(btn){ btn.disabled=true; btn.textContent='◌ rendering…'; }
  loadCatalog().then(function(cat){
    var byName={};
    (cat||[]).forEach(function(it){ byName[String(it.name||'').toLowerCase()]=it; });
    var rs=roster.map(function(n){
      var key=String(n||'').trim().toLowerCase();
      var it=byName[key];
      var arch=ARCH[key];
      if(!arch&&it) arch=it.role||it.archetype||(it.type==='soul'?'Soul':'Entity');
      return { name:key?String(n).trim():'Unknown', archetype:arch||'Sovereign' };
    });
    var hash=((Date.now()%0xffffff)).toString(16).toUpperCase();
    while(hash.length<6) hash='0'+hash;
    drawCard({handle:handle,mood:mood,roster:rs,verified:!!verified,hash:hash},function(blob){
      if(btn){ btn.disabled=false; btn.textContent='🎴 Export Trading Card (PNG)'; }
      if(!blob) return;
      var url=URL.createObjectURL(blob);
      var a=document.createElement('a');
      a.href=url; a.download=slug(handle)+'_soul_card.png';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function(){ URL.revokeObjectURL(url); },4000);
    });
  });
}
function wire(){ var b=document.getElementById('upcCard'); if(b) b.addEventListener('click',exportCard); }
if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',wire); }
else wire();
})();