/* js/soulverse-lens.js — ALIEN 3D LENS OVERLAY (replaces Best tab content)
   Non-destructive spatial discovery over the real catalog. Mounts only inside
   #soulverse-overlay; teardown disposes 100% of GPU. Three.js loads on demand.
   Does not touch cards, nav, catalog, graph, or build scripts. */
(function(){
'use strict';
var PALETTE={role:0x00ffcc,skill:0xffd700,chamber:0xff007f,soul:0x9945ff,infrastructure:0x3b82f6,infra:0x3b82f6,pack:0x10b981,world:0x38bdf8,agent:0x22c55e,book:0xf59e0b,combo:0xff6b9d};
var PALCSS={role:'#00ffcc',skill:'#ffd700',chamber:'#ff007f',soul:'#9945ff',infrastructure:'#3b82f6',infra:'#3b82f6',pack:'#10b981',world:'#38bdf8',agent:'#22c55e',book:'#f59e0b',combo:'#ff6b9d'};
function $(id){ return document.getElementById(id); }
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function pltVal(it){
  try{
    var m=String(it.plt||'').split('/');
    if(m.length<3) return 1;
    return (parseFloat(m[0])||0)+(parseFloat(m[1])||0)-(parseFloat(m[2])||0);
  }catch(e){ return 1; }
}
function catalogSync(){
  try{ if(typeof items!=='undefined'&&items&&items.length) return items; }catch(e){}
  try{ if(window.__soulGraph&&window.__soulGraph.items&&window.__soulGraph.items.length) return window.__soulGraph.items; }catch(e){}
  return [];
}
function toast(msg){
  var t=$('soulverse-toast'); if(!t) return;
  t.textContent=msg; t.style.display='block';
  clearTimeout(t._h); t._h=setTimeout(function(){ t.style.display='none'; },2600);
}

var Lens={
  active:false, opening:false, THREE:null,
  renderer:null, scene:null, camera:null, group:null,
  raf:0, nodes:[], disposables:[], shaders:[], sprites:[], beams:[],
  arcMesh:null, arcMat:null, zapPool:[],
  bgScene:null, bgCamera:null, bgMat:null, lastT:0, _tmpV:null,
  mNX:0, mNY:0, mVel:0, focusOpen:false, catalog:null,
  vis:{}, hover:null, sel:null,
  dist:80, vx:0, vy:0, dragOn:false, dragX:0, dragY:0, moved:0,
  prevScroll:'', bound:{}, focusNode:null, prevAccept:[]
};

Lens.open=function(){
  if(Lens.active||Lens.opening) return;
  console.info('[soulverse] open requested');
  Lens.opening=true;
  var btn=$('btn-ignite-universe');
  if(btn){ btn.disabled=true; btn.textContent='◌ LOADING UNIVERSE…'; }
  var done=function(){ Lens.opening=false; if(btn){ btn.disabled=false; btn.innerHTML='🌌 ENTER MODEL UNIVERSE [3D]'; } };
  var fail=function(m){ toast(m||'Universe failed to ignite (network or WebGL). Library untouched.'); done(); };
  var boot=function(catalog){
    if(!catalog.length){ fail('Catalog empty — open the Library first.'); return; }
    console.info('[soulverse] catalog ready:',catalog.length,'nodes');
    loadThree(0).then(function(THREE){
      console.info('[soulverse] three.js loaded');
      try{ Lens.build(THREE,catalog); console.info('[soulverse] universe live'); done(); }
      catch(e){ console.warn('[soulverse] build failed:',e); fail('WebGL unavailable in this browser.'); }
    }).catch(function(e){ console.warn('[soulverse] CDN failed:',e); fail('Could not fetch Three.js CDN — check connection.'); });
  };
  var cat=catalogSync();
  if(cat.length){ boot(cat); return; }
  fetch('data/catalog.json',{cache:'no-store'}).then(function(r){ return r.json(); }).then(function(j){
    var arr=Array.isArray(j)?j:(j.items||[]);
    boot(arr);
  }).catch(function(){ fail('Could not load catalog.'); });
};

Lens.build=function(THREE,catalog){
  Lens.THREE=THREE;
  var overlay=$('soulverse-overlay'), container=$('soulverse-canvas-container');
  if(!overlay||!container) return;
  overlay.style.display='block';
  Lens.prevScroll=document.body.style.overflow;
  document.body.style.overflow='hidden';

  var scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x0a0a0f,0.0025);
  var camera=new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,0.1,1000);
  camera.position.z=Lens.dist;
  var renderer;
  try{ renderer=new THREE.WebGLRenderer({antialias:true,alpha:true}); }
  catch(e){ overlay.style.display='none'; document.body.style.overflow=Lens.prevScroll; throw e; }
  renderer.setSize(window.innerWidth,window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
  container.appendChild(renderer.domElement);
  Lens.scene=scene; Lens.camera=camera; Lens.renderer=renderer;
  Lens.disposables.push(renderer);

  // starfield depth layer (cheap points over the CSS void gradient)
  var sg=new THREE.BufferGeometry(), sp=new Float32Array(900*3);
  for(var s=0;s<900;s++){ sp[s*3]=(Math.random()-0.5)*400; sp[s*3+1]=(Math.random()-0.5)*400; sp[s*3+2]=(Math.random()-0.5)*400; }
  sg.setAttribute('position',new THREE.BufferAttribute(sp,3));
  var sm=new THREE.PointsMaterial({color:0x8B5CF6,size:0.6,transparent:true,opacity:0.7});
  var stars=new THREE.Points(sg,sm);
  scene.add(stars);
  Lens.disposables.push(sg,sm);

  // SIP-17 PHASE 2: breathing plasma nodes (Node X = Catalog Item X)
  var group=new THREE.Group();
  scene.add(group);
  Lens.group=group;
  var geo=new THREE.SphereGeometry(0.8,16,16);
  Lens.disposables.push(geo);
  var N=catalog.length, R=45, GA=Math.PI*(3-Math.sqrt(5));
  var counts={};
  Lens.vis={}; Lens.nodes=[]; Lens.shaders=[]; Lens.sprites=[]; Lens.beams=[];
  catalog.forEach(function(item,i){
    var t=String(item.type||'soul');
    counts[t]=(counts[t]||0)+1;
    if(!(t in Lens.vis)) Lens.vis[t]=true;
    var y=1-(i/(N-1))*2, ph=Math.asin(clamp(y,-1,1)), th=GA*i;
    var pv=clamp(pltVal(item),0,2), pn=pv/2;
    var mesh=new THREE.Mesh(geo,Lens.breathingMat(PALETTE[t]||PALETTE.soul,pn));
    mesh.position.set(R*Math.cos(th)*Math.cos(ph),R*Math.sin(ph),R*Math.sin(th)*Math.cos(ph));
    var base=0.55+pn*1.1;
    mesh.scale.setScalar(base);
    mesh.userData={name:item.name,type:t,plt:String(item.plt||''),desc:String(item.desc||item.details||''),icon:String(item.icon||'✦'),base:base,pv:pv,item:item,billboard:null,idx:i,
      basePos:null,windPhase:Math.random()*6.2832,breathSpeed:0.8+Math.random()*0.4,visc:0,targetVisc:0,cur:{x:base,y:base,z:base},beam:null};
    mesh.userData.basePos=mesh.position.clone();
    group.add(mesh);
    Lens.nodes.push(mesh);
    // PLT energy beam for high true-value entities
    if(pv>1.2){
      var beam=Lens.pltBeam(PALETTE[t]||PALETTE.soul,3+pn*6);
      beam.position.copy(mesh.position);
      group.add(beam);
      mesh.userData.beam=beam;
      Lens.beams.push({mesh:beam,mat:beam.material,phase:Math.random()*6.28});
    }
  });

  Lens.catalog=catalog;
  Lens.buildLegend(counts);
  var cc=$('soulverse-count');
  if(cc) cc.textContent=N+' NODES · '+Object.keys(counts).length+' TYPES';
  var ov0=$('soulverse-overlay'), cardsBox=$('soulverse-cards');
  if(ov0&&cardsBox&&!$('soulverse-zaps')){
    var svgEl=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svgEl.id='soulverse-zaps';
    svgEl.setAttribute('style','position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2');
    ov0.insertBefore(svgEl,cardsBox);
  }
  Lens.buildArcs();

  // events (all removed on close)
  var B=Lens.bound;
  var el=renderer.domElement;
  B.move=function(ev){
    Lens.dragX=ev.clientX; Lens.dragY=ev.clientY;
    // ADDENDUM: hydrodynamic cursor tracker (NDC + instantaneous velocity)
    var nx=(ev.clientX/window.innerWidth)*2-1, ny=-(ev.clientY/window.innerHeight)*2+1;
    var dx=nx-Lens.mNX, dy=ny-Lens.mNY;
    Lens.mVel=Math.sqrt(dx*dx+dy*dy);
    Lens.mNX=nx; Lens.mNY=ny;
    if(Lens.focusOpen||Lens.dragOn||!Lens.active) return;
    Lens.setHover(Lens.castAt(ev.clientX,ev.clientY),ev.clientX,ev.clientY);
  };
  B.down=function(ev){ Lens.dragOn=true; Lens.moved=0; Lens.dragX=ev.clientX; Lens.dragY=ev.clientY; Lens.focusNode=null; var tip=$('soulverse-tip'); if(tip) tip.style.display='none'; };
  B.dbl=function(ev){ var node=Lens.castAt(ev.clientX,ev.clientY); if(node){ Lens.sel=node; Lens.showHud(node.userData); Lens.focusOn(node); } };
  B.up=function(ev){
    if(Lens.dragOn&&Lens.moved<6) Lens.pick(ev.clientX,ev.clientY);
    Lens.dragOn=false;
  };
  B.drag=function(ev){
    if(!Lens.dragOn||!Lens.group) return;
    var dx=ev.clientX-Lens.dragX, dy=ev.clientY-Lens.dragY;
    Lens.moved+=Math.abs(dx)+Math.abs(dy);
    Lens.dragX=ev.clientX; Lens.dragY=ev.clientY;
    Lens.group.rotation.y+=dx*0.005;
    Lens.group.rotation.x=clamp(Lens.group.rotation.x+dy*0.003,-0.9,0.9);
    Lens.vx=dx*0.005; Lens.vy=dy*0.003;
  };
  B.wheel=function(ev){
    ev.preventDefault();
    Lens.focusNode=null;
    Lens.dist=clamp(Lens.dist+(ev.deltaY>0?6:-6),30,160);
    if(Lens.camera) Lens.camera.position.z=Lens.dist;
  };
  B.key=function(ev){ if(ev.key==='Escape'){ if(Lens.focusOpen){ Lens.closeFocus(); } else Lens.close(); } };
  B.resize=function(){
    if(!Lens.camera||!Lens.renderer) return;
    Lens.camera.aspect=window.innerWidth/window.innerHeight;
    Lens.camera.updateProjectionMatrix();
    Lens.renderer.setSize(window.innerWidth,window.innerHeight);
  };
  window.addEventListener('pointermove',B.move);
  el.addEventListener('pointerdown',B.down);
  window.addEventListener('pointerup',B.up);
  window.addEventListener('pointermove',B.drag);
  el.addEventListener('wheel',B.wheel,{passive:false});
  el.addEventListener('dblclick',B.dbl);
  var sq=$('soulverse-search');
  if(sq){ B.searchkey=function(ev){ if(ev.key==='Enter'){ ev.preventDefault(); Lens.search(sq.value); } }; sq.addEventListener('keydown',B.searchkey); }
  window.addEventListener('keydown',B.key);
  window.addEventListener('resize',B.resize);

  var cb=$('soulverse-close');
  if(cb){ B.closeclick=function(){ Lens.close(); }; cb.addEventListener('click',B.closeclick); }

  Lens.active=true;
  Lens.lastT=performance.now();
  (function tick(){
    if(!Lens.active) return;
    Lens.raf=requestAnimationFrame(tick);
    if(document.hidden) return;
    var now=performance.now(), dt=Math.min(0.05,(now-Lens.lastT)/1000);
    Lens.lastT=now;
    var t=now/1000;
    // breathing node uniforms stay synced to wall-clock delta
    for(var i=0;i<Lens.shaders.length;i++){ Lens.shaders[i].uniforms.uTime.value+=dt; }
    if(Lens.arcMat) Lens.arcMat.uniforms.uTime.value=t;
    for(var j=0;j<Lens.beams.length;j++){
      var bm=Lens.beams[j];
      bm.mat.opacity=0.32+0.18*Math.sin(t*3+bm.phase);
    }
    if(Lens.group){
      if(!Lens.dragOn){
        Lens.group.rotation.y+=0.0012+Lens.vx;
        Lens.group.rotation.x=clamp(Lens.group.rotation.x+Lens.vy,-0.9,0.9);
        Lens.vx*=0.95; Lens.vy*=0.95;
      }
      Lens.group.updateMatrixWorld(true);
    }
    // focus flight: glide to the node and track it, release on drag/wheel
    if(Lens.focusNode&&Lens.camera){
      var fp=Lens._tmpF||(Lens._tmpF=new Lens.THREE.Vector3());
      Lens.focusNode.getWorldPosition(fp);
      if(!Lens.focusNode.visible){ Lens.focusNode=null; }
      else{
        var fdir=Lens._tmpD||(Lens._tmpD=new Lens.THREE.Vector3());
        fdir.copy(Lens.camera.position).sub(fp);
        var flen=fdir.length()||1; fdir.multiplyScalar(1/flen);
        var want=Lens._tmpW||(Lens._tmpW=new Lens.THREE.Vector3());
        want.copy(fp).add(fdir.multiplyScalar(20));
        Lens.camera.position.lerp(want,0.06);
        Lens.camera.lookAt(fp);
        Lens._wasFocus=true;
      }
    }else if(Lens.camera&&Lens._wasFocus){
      Lens.camera.lookAt(0,0,0); Lens._wasFocus=false;
    }
    // SIP-17 ADDENDUM: predatory kinematics before render (wind/water/slime/bloom)
    Lens.updateKinematics(t,dt);
    // projected real-card clones ride the nodes (originals never touched)
    Lens.syncCards();
    try{
      Lens.renderer.render(Lens.scene,Lens.camera);
    }catch(e){}
  })();
};

Lens.setHover=function(node,x,y){
  var tip=$('soulverse-tip');
  if(Lens.hover&&Lens.hover!==node) Lens.hover.scale.setScalar(Lens.hover.userData.base);
  Lens.hover=node;
  if(!node||!tip){ if(tip) tip.style.display='none'; document.body.style.cursor=''; return; }
  node.scale.setScalar(node.userData.base*1.7);
  var u=node.userData;
  tip.innerHTML='<b style="color:#fff">'+esc(u.icon+' '+u.name)+'</b><span style="color:#8b8b98;margin-left:6px">'+esc(u.type)+(u.plt?' · PLT '+esc(u.plt):'')+'</span>';
  tip.style.display='block';
  tip.style.left=(x+16)+'px'; tip.style.top=(y+12)+'px';
  document.body.style.cursor='pointer';
};

Lens.pick=function(x,y){
  if(!Lens.THREE||!Lens.active) return;
  var node=Lens.castAt(x,y);
  if(!node) return;
  Lens.sel=node;
  Lens.showHud(node.userData);
};

Lens.showHud=function(u){
  var hud=$('soulverse-hud'); if(!hud) return;
  var col=PALCSS[u.type]||'#fff';
  hud.innerHTML='<div style="font-size:1.4rem">'+esc(u.icon)+'</div>'+
    '<div style="font-size:1rem;font-weight:800;color:#fff;margin:2px 0">'+esc(u.name)+'</div>'+
    '<div style="font-size:0.65rem;letter-spacing:.08em;color:'+col+'">'+esc(u.type).toUpperCase()+(u.plt?' · PLT '+esc(u.plt):'')+'</div>'+
    (u.desc?'<div style="font-size:0.75rem;color:#B8B8B8;margin-top:6px;line-height:1.5">'+esc(u.desc.slice(0,160))+'</div>':'')+
    '<button id="soulverse-open" data-name="'+esc(u.name)+'" style="margin-top:10px;padding:8px 16px;border-radius:20px;background:linear-gradient(135deg,#FFD166,#8B5CF6);border:none;color:#000;font-weight:800;font-size:0.75rem;cursor:pointer">Open Real Card →</button>'+
    '<div style="display:flex;gap:6px;margin-top:8px">'+
    '<button id="soulverse-prev" style="flex:1;padding:6px 0;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);color:#fff;font-size:0.7rem;cursor:pointer">◀</button>'+
    '<button id="soulverse-focus" style="flex:2;padding:6px 0;border-radius:12px;background:rgba(0,212,255,.1);border:1px solid rgba(0,212,255,.4);color:#00D4FF;font-size:0.7rem;font-weight:700;cursor:pointer">◎ Focus</button>'+
    '<button id="soulverse-next" style="flex:1;padding:6px 0;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);color:#fff;font-size:0.7rem;cursor:pointer">▶</button></div>';
  hud.style.display='block';
  var b=$('soulverse-open');
  if(b) b.onclick=function(){ Lens.openFocus(b.getAttribute('data-name')); };
  var pv2=$('soulverse-prev'), nx2=$('soulverse-next'), fc2=$('soulverse-focus');
  if(pv2) pv2.onclick=function(){ Lens.step(-1); };
  if(nx2) nx2.onclick=function(){ Lens.step(1); };
  if(fc2) fc2.onclick=function(){ if(Lens.sel) Lens.focusOn(Lens.sel); };
};
// FOCUS WINDOW: standalone real card + similar souls + merge partners.
var STOPWORDS={the:1,a:1,an:1,and:1,or:1,of:1,to:1,in:1,on:1,for:1,with:1,by:1,from:1,that:1,this:1,is:1,are:1,it:1,as:1,at:1,be:1,you:1,your:1,all:1,new:1,one:1,soul:1,souls:1};
function wordsOf(it){
  var ws=String((it.name||'')+' '+(it.desc||it.details||'')).toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/);
  var set={};
  ws.forEach(function(w){ if(w.length>2&&!STOPWORDS[w]) set[w]=1; });
  return set;
}
function sharedWords(a,b){
  var A=wordsOf(a), B=wordsOf(b), sh=[];
  for(var w in A){ if(B[w]) sh.push(w); }
  return sh;
}
Lens.similar=function(item,n){
  var out=[];
  (Lens.catalog||[]).forEach(function(o){
    if(String(o.name).toLowerCase()===String(item.name).toLowerCase()) return;
    var s=0, why=[];
    if(String(o.type)===String(item.type)){ s+=3; why.push('same '+item.type); }
    if(Math.abs(pltVal(o)-pltVal(item))<0.3){ s+=2; why.push('PLT close'); }
    var sh=sharedWords(item,o).slice(0,3);
    s+=Math.min(sh.length,3);
    if(sh.length) why.push('shares '+sh.slice(0,2).join(', '));
    if(o.featured&&item.featured){ s+=1; why.push('both featured'); }
    out.push({item:o,s:s,why:why.join(' · ')||'in the family'});
  });
  out.sort(function(a,b){ return b.s-a.s; });
  return out.slice(0,n||5);
};
var COMPLEMENT={soul:['role','agent'],role:['soul','skill'],skill:['agent','role'],agent:['skill','soul'],world:['chamber','pack'],chamber:['world','soul'],pack:['world','combo'],combo:['pack','role'],book:['soul','role'],infrastructure:['agent','skill']};
Lens.mergers=function(item,n){
  var out=[], comp=COMPLEMENT[String(item.type)]||[];
  (Lens.catalog||[]).forEach(function(o){
    if(String(o.name).toLowerCase()===String(item.name).toLowerCase()) return;
    var s=0, why=[];
    if(String(o.type)!==String(item.type)){ s+=2; why.push('cross-type'); }
    if(comp.indexOf(String(o.type))>=0){ s+=3; why.push(item.type+'⊕'+o.type); }
    var ps=pltVal(o)+pltVal(item);
    s+=ps; why.push('PLT Σ '+ps.toFixed(2));
    var sh=sharedWords(item,o).slice(0,2);
    s+=sh.length; if(sh.length) why.push('shares '+sh.join(', '));
    out.push({item:o,s:s,why:why.join(' · ')});
  });
  out.sort(function(a,b){ return b.s-a.s; });
  return out.slice(0,n||5);
};
function recRow(r){
  return '<div data-focus="'+esc(r.item.name)+'" style="display:flex;gap:8px;align-items:center;padding:7px 9px;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);margin-bottom:6px;cursor:pointer">'+
    '<span style="font-size:1.1rem">'+esc(r.item.icon||'✦')+'</span>'+
    '<span style="flex:1;min-width:0"><b style="color:#fff;font-size:0.75rem;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(r.item.name)+'</b>'+
    '<span style="font-size:0.62rem;color:#8b8b98">'+esc(r.why)+'</span></span>'+
    '<button data-locate="'+esc(r.item.name)+'" title="Locate in 3D" style="background:none;border:1px solid rgba(0,212,255,.4);border-radius:10px;color:#00D4FF;font-size:0.65rem;padding:2px 8px;cursor:pointer">⌖</button></div>';
}
Lens.openFocus=function(name){
  Lens.closeFocus();
  var item=null, i;
  for(i=0;i<(Lens.catalog||[]).length;i++){
    if(String(Lens.catalog[i].name).toLowerCase()===String(name).toLowerCase()){ item=Lens.catalog[i]; break; }
  }
  if(!item){ toast('Soul not found'); return; }
  var ov=$('soulverse-overlay');
  if(!ov) return;
  var col=PALCSS[String(item.type)]||'#fff';
  var sim=Lens.similar(item,5), mrg=Lens.mergers(item,5);
  var win=document.createElement('div');
  win.id='soulverse-focuswin';
  win.style.cssText='position:absolute;inset:0;z-index:8;display:flex;align-items:center;justify-content:center;background:rgba(3,3,8,.72);padding:18px';
  win.innerHTML='<div style="width:880px;max-width:100%;max-height:92%;overflow-y:auto;background:rgba(8,8,14,.97);border:1px solid rgba(255,209,102,.35);border-radius:20px;padding:20px;box-shadow:0 30px 120px rgba(0,0,0,.85)">'+
    '<div style="display:flex;gap:10px;align-items:center;margin-bottom:12px">'+
    '<span style="font-size:1.6rem">'+esc(item.icon||'✦')+'</span>'+
    '<span style="flex:1;min-width:0"><b style="color:#fff;font-size:1.05rem">'+esc(item.name)+'</b>'+
    '<span style="display:block;font-size:0.65rem;letter-spacing:.08em;color:'+col+'">'+esc(String(item.type)).toUpperCase()+(item.plt?' · PLT '+esc(item.plt):'')+'</span></span>'+
    '<button id="svf-lib" style="padding:8px 16px;border-radius:20px;background:linear-gradient(135deg,#FFD166,#8B5CF6);border:none;color:#000;font-weight:800;font-size:0.72rem;cursor:pointer">Open in Library →</button>'+
    '<button id="svf-close" style="padding:8px 14px;border-radius:20px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:0.72rem;cursor:pointer">✕</button></div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">'+
    '<div><div style="font-size:0.7rem;letter-spacing:.08em;color:#8b8b98;margin-bottom:8px">STANDALONE CARD</div><div id="svf-card"></div></div>'+
    '<div><div style="font-size:0.7rem;letter-spacing:.08em;color:#8b8b98;margin-bottom:8px">🧬 SIMILAR SOULS</div>'+sim.map(recRow).join('')+
    '<div style="font-size:0.7rem;letter-spacing:.08em;color:#8b8b98;margin:12px 0 8px">⚗ MERGES WELL WITH</div>'+mrg.map(recRow).join('')+'</div>'+
    '</div></div>';
  ov.appendChild(win);
  Lens.focusOpen=true;
  var src=realCardEl(item.name), slot=win.querySelector('#svf-card');
  if(src&&slot){
    var c=cleanClone(src);
    c.style.width='100%';
    var act=c.querySelector('.ss-act'); if(act) act.remove();
    slot.appendChild(c);
  }
  win.querySelector('#svf-close').addEventListener('click',function(){ Lens.closeFocus(); });
  win.querySelector('#svf-lib').addEventListener('click',function(){ Lens.openCard(item.name); });
  win.addEventListener('click',function(ev){
    var loc=ev.target.closest('[data-locate]');
    if(loc){
      ev.stopPropagation();
      var nm=loc.getAttribute('data-locate');
      Lens.closeFocus();
      for(var k=0;k<Lens.nodes.length;k++){
        if(String(Lens.nodes[k].userData.name).toLowerCase()===String(nm).toLowerCase()){
          Lens.sel=Lens.nodes[k]; Lens.showHud(Lens.nodes[k].userData); Lens.focusOn(Lens.nodes[k]); break;
        }
      }
      return;
    }
    var fo=ev.target.closest('[data-focus]');
    if(fo) Lens.openFocus(fo.getAttribute('data-focus'));
  });
};
Lens.closeFocus=function(){
  var w=$('soulverse-focuswin');
  if(w&&w.parentNode) w.parentNode.removeChild(w);
  Lens.focusOpen=false;
};
Lens.step=function(dir){
  if(!Lens.nodes.length) return;
  var i=Lens.sel?Lens.sel.userData.idx:0;
  for(var k=0;k<Lens.nodes.length;k++){
    i=(i+dir+Lens.nodes.length)%Lens.nodes.length;
    if(Lens.nodes[i].visible) break;
  }
  var node=Lens.nodes[i];
  Lens.sel=node;
  Lens.showHud(node.userData);
  Lens.focusOn(node);
};
Lens.focusOn=function(node){ Lens.focusNode=node; };
Lens.search=function(q){
  q=String(q||'').trim().toLowerCase();
  if(!q) return;
  var hit=null;
  for(var i=0;i<Lens.nodes.length;i++){
    if(Lens.nodes[i].userData.name.toLowerCase().indexOf(q)>=0){ hit=Lens.nodes[i]; break; }
  }
  if(!hit){ toast('No soul matches that name'); return; }
  Lens.sel=hit;
  Lens.showHud(hit.userData);
  Lens.focusOn(hit);
};

// SIP-17: breathing plasma material (pulse rate tied to PLT), fresnel aura
Lens.breathingMat=function(colorHex,pltNorm){
  var m=new Lens.THREE.ShaderMaterial({
    uniforms:{uTime:{value:Math.random()*10},uColor:{value:new Lens.THREE.Color(colorHex)},uPlt:{value:10+pltNorm*90}},
    vertexShader:[
      'uniform float uTime; uniform float uPlt;',
      'varying vec3 vNormal;',
      'void main(){',
      ' vNormal=normalize(normalMatrix*normal);',
      ' float pulseSpeed=1.5+(uPlt*0.02);',
      ' float expansion=sin(uTime*pulseSpeed+position.x*2.0)*(0.08+uPlt*0.001);',
      ' vec3 newPosition=position+normal*expansion;',
      ' gl_Position=projectionMatrix*modelViewMatrix*vec4(newPosition,1.0);',
      '}'
    ].join('\n'),
    fragmentShader:[
      'uniform vec3 uColor; uniform float uTime; uniform float uPlt;',
      'varying vec3 vNormal;',
      'void main(){',
      ' float rim=1.0-max(dot(vNormal,vec3(0.0,0.0,1.0)),0.0);',
      ' float pulse=0.6+0.4*sin(uTime*2.0);',
      ' vec3 glowColor=mix(uColor,vec3(1.0,0.85,0.2),clamp((uPlt-50.0)/50.0,0.0,1.0));',
      ' vec3 finalColor=glowColor*(pow(rim,2.5)*2.0*pulse+0.3);',
      ' gl_FragColor=vec4(finalColor,0.9);',
      '}'
    ].join('\n'),
    transparent:true, blending:Lens.THREE.AdditiveBlending, depthWrite:false
  });
  Lens.shaders.push(m); Lens.disposables.push(m);
  return m;
};
// SIP-17: vertical PLT energy beam for high true-value entities
Lens.pltBeam=function(colorHex,h){
  var g=new Lens.THREE.CylinderGeometry(0.05,0.3,h,8,1,true);
  g.translate(0,h/2,0);
  var m=new Lens.THREE.MeshBasicMaterial({color:colorHex,transparent:true,opacity:0.45,blending:Lens.THREE.AdditiveBlending,side:Lens.THREE.DoubleSide,depthWrite:false});
  Lens.disposables.push(g,m);
  return new Lens.THREE.Mesh(g,m);
};
// REAL-CARD STAPLING: projected clones of the actual library cards.
// Originals in #resourceGrid are never moved — clones only. Clicks pass through
// (pointer-events:none) to the canvas raycast, which selects the node behind.
Lens.MAXCARDS=24;
Lens.cardPool=[];
function realCardEl(name){
  var nm=String(name||'').toLowerCase(), hit=null;
  var grid=$('resourceGrid');
  if(!grid) return null;
  var cards=grid.querySelectorAll('.card');
  for(var i=0;i<cards.length;i++){
    if(String(cards[i].dataset.id||'').toLowerCase()===nm){ hit=cards[i]; break; }
  }
  return hit;
}
function cleanClone(src){
  var c=src.cloneNode(true);
  c.removeAttribute('id');
  c.style.width='260px';
  var inner=c.querySelectorAll('[id]');
  for(var i=0;i<inner.length;i++){ inner[i].removeAttribute('id'); }
  // dead dock bar (listeners live on the original) → live soul-profile button
  var bar=c.querySelector('.ss-act');
  if(bar){
    var nm=c.dataset.id||'';
    bar.innerHTML='<button data-lens-open="'+esc(nm)+'" title="Open soul profile" style="flex:1;padding:7px 0;border-radius:14px;background:rgba(139,92,246,.16);border:1px solid rgba(139,92,246,.45);color:#c9b8ff;font-size:0.72rem;font-weight:700;cursor:pointer">👤 Open soul</button>';
  }
  return c;
}
Lens.syncCards=function(){
  var cont=$('soulverse-cards');
  if(!cont||!Lens.camera||!Lens.group||!Lens.active) return;
  cont.style.perspective='900px';
  while(Lens.cardPool.length<Lens.MAXCARDS){
    var d=document.createElement('div');
    d.style.cssText='position:absolute;left:0;top:0;pointer-events:none;will-change:transform,opacity;display:none';
    d._key=-1;
    cont.appendChild(d);
    Lens.cardPool.push(d);
  }
  var tmp=Lens._tmpV||(Lens._tmpV=new Lens.THREE.Vector3());
  var proj=new Lens.THREE.Vector3();
  var w=window.innerWidth, h=window.innerHeight;
  // project every visible in-range node once
  var cands=[];
  for(var i=0;i<Lens.nodes.length;i++){
    var n=Lens.nodes[i];
    if(!n.visible) continue;
    n.getWorldPosition(tmp);
    var dist=Lens.camera.position.distanceTo(tmp);
    if(dist>95) continue;
    proj.set(tmp.x,tmp.y,tmp.z).project(Lens.camera);
    if(proj.z>1) continue;
    cands.push({n:n,d:dist,x:(proj.x*0.5+0.5)*w,y:(-proj.y*0.5+0.5)*h});
  }
  cands.sort(function(a,b){ return a.d-b.d; });
  var byIdx={};
  cands.forEach(function(c){ byIdx[c.n.userData.idx]=c; });
  // focus pin: hovered/selected node's card always shows, wins overlaps
  var accepted=[], taken={};
  [Lens.hover,Lens.sel].forEach(function(nd){
    if(!nd) return;
    var fc=byIdx[nd.userData.idx];
    if(fc&&!taken[nd.userData.idx]){ accepted.push(fc); taken[nd.userData.idx]=1; }
  });
  // sticky pass: keep last frame's cards when still valid + uncluttered
  var overlaps=function(x,y){
    for(var q=0;q<accepted.length;q++){
      if(Math.abs(accepted[q].x-x)<170&&Math.abs(accepted[q].y-y)<120) return true;
    }
    return false;
  };
  (Lens.prevAccept||[]).forEach(function(idx){
    if(accepted.length>=Lens.MAXCARDS) return;
    var c=byIdx[idx];
    if(c&&!taken[idx]&&!overlaps(c.x,c.y)){ accepted.push(c); taken[idx]=1; }
  });
  // fill pass: nearest remaining that don't pile up
  for(var f=0;f<cands.length&&accepted.length<Lens.MAXCARDS;f++){
    var cc=cands[f], id=cc.n.userData.idx;
    if(!taken[id]&&!overlaps(cc.x,cc.y)){ accepted.push(cc); taken[id]=1; }
  }
  Lens.prevAccept=accepted.map(function(c){ return c.n.userData.idx; });
  Lens.updateZaps(accepted);
  for(var k=0;k<Lens.cardPool.length;k++){
    var el=Lens.cardPool[k];
    if(k>=accepted.length){ el.style.display='none'; el._key=-1; continue; }
    var rec=accepted[k], node=rec.n, idx=node.userData.idx;
    if(el._key!==idx){
      var src=realCardEl(node.userData.name);
      if(!src){ el.style.display='none'; el._key=-1; continue; }
      el.innerHTML='';
      el.appendChild(cleanClone(src));
      el._key=idx; el._act=false;
    }
    // spotlight: hovered/selected card goes full-lit, squares up, goes live
    var isA=(Lens.hover&&Lens.hover.userData.idx===idx)||(Lens.sel&&Lens.sel.userData.idx===idx);
    var sc=clamp(1.1-rec.d/120,0.45,0.85);
    if(isA) sc=Math.min(sc*1.3,1.05);
    var tF=isA?0.25:1;
    var ry=(((rec.x/w)-0.5)*-28*tF).toFixed(1), rx=(((rec.y/h)-0.5)*22*tF).toFixed(1);
    el.style.display='block';
    el.style.opacity=isA?'1':clamp(1.3-rec.d/70,0,1).toFixed(2);
    el.style.zIndex=isA?'4':'auto';
    if(isA&&!el._act){
      el._act=true;
      var inter=el.querySelectorAll('a,button');
      for(var q=0;q<inter.length;q++){ inter[q].style.pointerEvents='auto'; }
    }
    else if(!isA&&el._act){
      el._act=false;
      var inter2=el.querySelectorAll('a,button');
      for(var q2=0;q2<inter2.length;q2++){ inter2[q2].style.pointerEvents=''; }
    }
    el.style.transform='translate(-50%,-50%) translate('+Math.round(rec.x)+'px,'+Math.round(rec.y)+'px) rotateY('+ry+'deg) rotateX('+rx+'deg) scale('+sc.toFixed(2)+')';
  }
};
// unified raycast over visible nodes (clones pass clicks through to canvas)
Lens.castAt=function(x,y){
  if(!Lens.THREE||!Lens.camera) return null;
  var ptr=new Lens.THREE.Vector2((x/window.innerWidth)*2-1,-(y/window.innerHeight)*2+1);
  var ray=new Lens.THREE.Raycaster();
  ray.setFromCamera(ptr,Lens.camera);
  var hits=ray.intersectObjects(Lens.nodes.filter(function(n){ return n.visible; }),false);
  if(hits.length) return hits[0].object;
  return null;
};
// SIP-17 ADDENDUM: bio-fluid predatory kinematics (wind / water / slime / bloom)
// Layers A–C run here; Layer D (card fade) lives in syncCards below.
Lens.updateKinematics=function(t,dt){
  var stir=1+Math.min(Lens.mVel*8,0.6);
  for(var i=0;i<Lens.nodes.length;i++){
    var node=Lens.nodes[i], u=node.userData;
    var isT=(node===Lens.hover||node===Lens.sel);
    // LAYER A: wind — dual-sine lung (inhale/hold/exhale), phase-offset per node
    var lung=Math.sin(t*u.breathSpeed+u.windPhase)*Math.cos(t*0.5*u.breathSpeed+u.windPhase);
    var breath=1+(lung*0.06);
    var base=u.base, tx,ty,tz;
    if(isT){
      // LAYER B: carnivorous bloom — hungry-flower dilation + lean to cursor
      var bloom=1.38+0.08*Math.sin(t*3);
      tx=base*bloom; ty=base*bloom; tz=base*bloom;
      u.targetVisc=1;
      node.rotation.y+=(Lens.mNX*0.45-node.rotation.y)*0.045;
      node.rotation.x+=((-Lens.mNY*0.45)-node.rotation.x)*0.045;
    }else{
      tx=base*breath; ty=base*breath; tz=base*breath;
      u.targetVisc=0;
      node.rotation.x+=(0-node.rotation.x)*0.03;
    }
    // LAYER C: slime — syrup cling, stretch Y / compress XZ on departure
    u.visc+=(u.targetVisc-u.visc)*0.025;
    var sY=1+u.visc*0.22, sXZ=1-u.visc*0.08;
    var c=u.cur;
    c.x+=(tx*sXZ-c.x)*0.05; c.y+=(ty*sY-c.y)*0.05; c.z+=(tz*sXZ-c.z)*0.05;
    node.scale.set(c.x,c.y,c.z);
    // drift integration off the cloned base position, stirred by cursor water
    var bp=u.basePos;
    if(bp){
      node.position.set(
        bp.x+Math.sin(t*0.4+u.windPhase)*0.35*stir,
        bp.y+Math.cos(t*0.3+u.windPhase)*0.35*stir,
        bp.z+Math.sin(t*0.2+u.windPhase)*0.25*stir
      );
    }
    if(u.beam) u.beam.position.copy(node.position);
  }
};
// SYNAPSE WEB: nearest-neighbor arcs with a traveling fire pulse (one draw call).
// Rebuilt whenever type visibility changes so arcs never dangle off hidden nodes.
Lens.buildArcs=function(){
  if(!Lens.THREE||!Lens.group) return;
  if(Lens.arcMesh){
    try{ Lens.group.remove(Lens.arcMesh); }catch(e){}
    try{ if(Lens.arcMesh.geometry) Lens.arcMesh.geometry.dispose(); }catch(e){}
    try{ if(Lens.arcMesh.material) Lens.arcMesh.material.dispose(); }catch(e){}
    Lens.arcMesh=null; Lens.arcMat=null;
  }
  var nodes=Lens.nodes.filter(function(n){ return n.visible; });
  if(nodes.length<2) return;
  var seen={}, pairs=[], i, j;
  for(i=0;i<nodes.length;i++){
    var bi=-1, bd=1e18;
    for(j=0;j<nodes.length;j++){
      if(i===j) continue;
      var dd=nodes[i].position.distanceToSquared(nodes[j].position);
      if(dd<bd){ bd=dd; bi=j; }
    }
    if(bi>=0){
      var key=Math.min(i,bi)+':'+Math.max(i,bi);
      if(!seen[key]){ seen[key]=1; pairs.push([nodes[i],nodes[bi]]); }
    }
  }
  while(pairs.length>220){ pairs=pairs.filter(function(_,ix){ return ix%2===0; }); }
  var SEG=10, pos=[], ts=[], phs=[];
  var va=new Lens.THREE.Vector3(), vb=new Lens.THREE.Vector3(), vm=new Lens.THREE.Vector3();
  var p0=new Lens.THREE.Vector3(), p1=new Lens.THREE.Vector3();
  function bez(a,b,m,t,out){
    var u=1-t;
    out.set(u*u*a.x+2*u*t*m.x+t*t*b.x, u*u*a.y+2*u*t*m.y+t*t*b.y, u*u*a.z+2*u*t*m.z+t*t*b.z);
    return out;
  }
  pairs.forEach(function(p){
    va.copy(p[0].position); vb.copy(p[1].position);
    vm.copy(va).add(vb).multiplyScalar(0.5);
    var len=va.distanceTo(vb);
    vm.add(vm.clone().normalize().multiplyScalar(len*0.18));
    var phase=Math.random();
    for(var s=0;s<SEG;s++){
      bez(va,vb,vm,s/SEG,p0); bez(va,vb,vm,(s+1)/SEG,p1);
      pos.push(p0.x,p0.y,p0.z,p1.x,p1.y,p1.z);
      ts.push(s/SEG,(s+1)/SEG); phs.push(phase,phase);
    }
  });
  var g=new Lens.THREE.BufferGeometry();
  g.setAttribute('position',new Lens.THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('aT',new Lens.THREE.Float32BufferAttribute(ts,1));
  g.setAttribute('aPhase',new Lens.THREE.Float32BufferAttribute(phs,1));
  var m=new Lens.THREE.ShaderMaterial({
    uniforms:{uTime:{value:0}},
    vertexShader:['attribute float aT; attribute float aPhase; varying float vT; varying float vPh;',
      'void main(){ vT=aT; vPh=aPhase; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }'].join('\n'),
    fragmentShader:['uniform float uTime; varying float vT; varying float vPh;',
      'void main(){ float head=fract(uTime*0.7+vPh); float d=abs(vT-head); d=min(d,1.0-d);',
      ' float bolt=exp(-d*20.0);',
      ' vec3 col=mix(vec3(0.0,0.75,1.0),vec3(1.0,1.0,1.0),bolt);',
      ' gl_FragColor=vec4(col,0.08+bolt*0.9); }'].join('\n'),
    transparent:true, blending:Lens.THREE.AdditiveBlending, depthWrite:false
  });
  var lines=new Lens.THREE.LineSegments(g,m);
  lines.frustumCulled=false;
  Lens.group.add(lines);
  Lens.arcMesh=lines; Lens.arcMat=m;
  Lens.disposables.push(g,m);
  return pairs.length;
};
// SCREEN LIGHTNING: jagged live arcs crackling between floating cards.
function zapPoints(x1,y1,x2,y2){
  var dx=x2-x1, dy=y2-y1, len=Math.sqrt(dx*dx+dy*dy)||1;
  var nx=-dy/len, ny=dx/len, pts=[x1+','+y1];
  for(var s=1;s<5;s++){
    var f=s/5, off=(Math.random()-0.5)*22;
    pts.push((x1+dx*f+nx*off).toFixed(1)+','+(y1+dy*f+ny*off).toFixed(1));
  }
  pts.push(x2+','+y2);
  return pts.join(' ');
}
Lens.updateZaps=function(pts){
  var svg=$('soulverse-zaps');
  if(!svg||!Lens.active) return;
  var NS='http://www.w3.org/2000/svg';
  while(Lens.zapPool.length<12){
    var glow=document.createElementNS(NS,'polyline');
    glow.setAttribute('style','fill:none;stroke:#00D4FF;stroke-width:5;opacity:.25');
    var core=document.createElementNS(NS,'polyline');
    core.setAttribute('style','fill:none;stroke:#ffffff;stroke-width:1.6;opacity:.9');
    svg.appendChild(glow); svg.appendChild(core);
    Lens.zapPool.push({glow:glow,core:core,next:0,pts:'',op:1});
  }
  var now=performance.now(), used=0, i, j;
  for(i=0;i<pts.length&&used<12;i++){
    var best=-1, bd=1e9;
    for(j=0;j<pts.length;j++){
      if(j===i) continue;
      var dx=pts[j].x-pts[i].x, dy=pts[j].y-pts[i].y, dd=dx*dx+dy*dy;
      if(dd<bd){ bd=dd; best=j; }
    }
    if(best<0||bd>380*380) continue;
    var z=Lens.zapPool[used++];
    if(now>z.next){
      z.pts=zapPoints(pts[i].x,pts[i].y,pts[best].x,pts[best].y);
      z.op=(0.35+Math.random()*0.65).toFixed(2);
      z.next=now+90+Math.random()*140;
    }
    if(!z.pts) continue;
    z.core.setAttribute('points',z.pts); z.core.style.opacity=z.op;
    z.glow.setAttribute('points',z.pts); z.glow.style.opacity=(z.op*0.3).toFixed(2);
  }
  for(var k=used;k<Lens.zapPool.length;k++){
    Lens.zapPool[k].core.style.opacity='0'; Lens.zapPool[k].glow.style.opacity='0';
  }
};
Lens.buildLegend=function(counts){
  var lg=$('soulverse-legend'); if(!lg) return;
  var types=Object.keys(counts).sort(function(a,b){ return counts[b]-counts[a]; });
  lg.innerHTML=types.map(function(t){
    var c=PALCSS[t]||'#fff';
    return '<button data-lt="'+esc(t)+'" style="display:flex;align-items:center;padding:5px 10px;border-radius:14px;background:rgba(8,8,12,.72);border:1px solid '+c+';color:#fff;font-size:0.65rem;cursor:pointer;opacity:1"><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:'+c+';margin-right:6px"></i>'+esc(t)+' '+counts[t]+'</button>';
  }).join('');
  lg.querySelectorAll('[data-lt]').forEach(function(btn){
    btn.addEventListener('click',function(){
      var t=btn.getAttribute('data-lt');
      Lens.vis[t]=!Lens.vis[t];
      btn.style.opacity=Lens.vis[t]?'1':'0.35';
      Lens.nodes.forEach(function(n){ if(n.userData.type===t) n.visible=Lens.vis[t]; });
      if(Lens.hover&&!Lens.hover.visible) Lens.setHover(null,0,0);
  var arcN=Lens.buildArcs()||0;
  console.info('[soulverse] synapses built:',arcN,'arcs');
  var cc2v=$('soulverse-count');
  if(cc2v) cc2v.textContent=N+' NODES · '+Object.keys(counts).length+' TYPES · '+arcN+' SYNAPSES';
  var vv=$('soulverse-ver');
  if(vv) vv.textContent='lens v8';
  console.info('[soulverse] zap layer:',!!$('soulverse-zaps')?'ready':'MISSING');
    });
  });
  var cc2=$('soulverse-count');
  if(cc2){ cc2.style.cursor='pointer'; cc2.title='Reset all types'; cc2.onclick=function(){
    Lens.nodes.forEach(function(n){ n.visible=true; });
    Object.keys(Lens.vis).forEach(function(t){ Lens.vis[t]=true; });
    lg.querySelectorAll('[data-lt]').forEach(function(b){ b.style.opacity='1'; });
  Lens.buildArcs();
  if(!Lens._cardsWired){
    Lens._cardsWired=true;
    var cc0=$('soulverse-cards');
    if(cc0) cc0.addEventListener('click',function(ev){
      var b=ev.target.closest('[data-lens-open]');
      if(!b) return;
      ev.stopPropagation();
      try{
        if(window.__familySocial&&window.__familySocial.openProfile){
          window.__familySocial.openProfile(b.getAttribute('data-lens-open'));
          var m=$('ssModal'); if(m) m.style.zIndex='6000';
        }
      }catch(e){}
    });
  }
  }; }
};

// Card Anchor Drop: close → All tab → scroll to the REAL card → gold flash
Lens.openCard=function(name){
  Lens.close();
  try{
    var tab=document.querySelector('.category-tab[data-cat="all"]');
    if(tab) tab.click();
  }catch(e){}
  var tries=0;
  (function find(){
    tries++;
    var hit=null, nm=String(name||'').toLowerCase();
    document.querySelectorAll('#resourceGrid .card').forEach(function(c){
      if(String(c.dataset.id||'').toLowerCase()===nm) hit=c;
    });
    if(hit){
      try{ hit.scrollIntoView({behavior:'smooth',block:'center'}); }catch(e){}
      hit.style.transition='box-shadow .3s';
      hit.style.boxShadow='0 0 0 3px #FFD166,0 0 44px rgba(255,209,102,.65)';
      setTimeout(function(){ hit.style.boxShadow=''; },2200);
    }
    else if(tries<20) setTimeout(find,150);
  })();
};

Lens.close=function(){
  if(!Lens.active&&!Lens.renderer) return;
  Lens.closeFocus();
  Lens.active=false;
  if(Lens.raf) cancelAnimationFrame(Lens.raf);
  Lens.raf=0;
  try{
    window.removeEventListener('pointermove',Lens.bound.move);
    window.removeEventListener('pointerup',Lens.bound.up);
    window.removeEventListener('pointermove',Lens.bound.drag);
    window.removeEventListener('keydown',Lens.bound.key);
    window.removeEventListener('resize',Lens.bound.resize);
    var cb=$('soulverse-close');
    if(cb&&Lens.bound.closeclick) cb.removeEventListener('click',Lens.bound.closeclick);
    var sq2=$('soulverse-search');
    if(sq2&&Lens.bound.searchkey) sq2.removeEventListener('keydown',Lens.bound.searchkey);
  }catch(e){}
  try{
    if(Lens.renderer){
      Lens.renderer.dispose();
      try{ if(Lens.renderer.forceContextLoss) Lens.renderer.forceContextLoss(); }catch(e){}
    }
  }catch(e){}
  Lens.disposables.forEach(function(d){ try{ if(d&&d.dispose) d.dispose(); }catch(e){} });
  Lens.disposables=[];
  var container=$('soulverse-canvas-container');
  if(container) container.innerHTML='';
  var sc2=$('soulverse-cards');
  if(sc2){ for(var ci=0;ci<sc2.children.length;ci++){ sc2.children[ci].style.display='none'; sc2.children[ci]._key=-1; } }
  var smm=$('ssModal'); if(smm) smm.style.zIndex='';
  var zp=$('soulverse-zaps');
  if(zp&&zp.parentNode) zp.parentNode.removeChild(zp);
  var overlay=$('soulverse-overlay');
  if(overlay) overlay.style.display='none';
  var hud=$('soulverse-hud'); if(hud){ hud.style.display='none'; hud.innerHTML=''; }
  var tip=$('soulverse-tip'); if(tip) tip.style.display='none';
  document.body.style.overflow=Lens.prevScroll||'';
  document.body.style.cursor='';
  Lens.renderer=null; Lens.scene=null; Lens.camera=null; Lens.group=null;
  Lens.bgScene=null; Lens.bgCamera=null; Lens.bgMat=null;
  Lens.nodes=[]; Lens.shaders=[]; Lens.sprites=[]; Lens.beams=[];
  Lens.arcMesh=null; Lens.arcMat=null; Lens.zapPool=[];
  Lens.hover=null; Lens.sel=null; Lens.vx=0; Lens.vy=0;
  Lens.focusNode=null; Lens.prevAccept=[];
  Lens.bound={};
};

function loadThree(i){
  var CDNS=['https://esm.sh/three@0.160.0','https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'];
  return import(CDNS[i]).catch(function(e){
    if(i+1<CDNS.length) return loadThree(i+1);
    throw e;
  });
}
window.SoulverseLens=Lens;
// Best tab IS the universe: entering the tab ignites it (button re-enters after close).
window.initBestOrb=function(){
  try{ if(window.SoulverseLens&&!SoulverseLens.active&&!SoulverseLens.opening){ console.info('[soulverse] tab entry — igniting'); SoulverseLens.open(); } }catch(e){}
};
console.info('[soulverse] lens v8 loaded (hover spotlight + live cards + 3D tilt)');
})();
