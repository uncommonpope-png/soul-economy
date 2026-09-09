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
  raf:0, nodes:[], disposables:[],
  vis:{}, hover:null, sel:null,
  dist:80, vx:0, vy:0, dragOn:false, dragX:0, dragY:0, moved:0,
  prevScroll:'', bound:{}
};

Lens.open=function(){
  if(Lens.active||Lens.opening) return;
  Lens.opening=true;
  var btn=$('btn-ignite-universe');
  if(btn){ btn.disabled=true; btn.textContent='◌ LOADING UNIVERSE…'; }
  var done=function(){ Lens.opening=false; if(btn){ btn.disabled=false; btn.innerHTML='🌌 ENTER MODEL UNIVERSE [3D]'; } };
  var fail=function(m){ toast(m||'Universe failed to ignite (network or WebGL). Library untouched.'); done(); };
  var boot=function(catalog){
    if(!catalog.length){ fail('Catalog empty — open the Library first.'); return; }
    import('https://esm.sh/three@0.160.0').then(function(THREE){
      try{ Lens.build(THREE,catalog); done(); }
      catch(e){ fail('WebGL unavailable in this browser.'); }
    }).catch(function(){ fail('Could not fetch Three.js CDN — check connection.'); });
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  container.appendChild(renderer.domElement);
  Lens.scene=scene; Lens.camera=camera; Lens.renderer=renderer;
  Lens.disposables.push(renderer);

  // starfield backdrop
  var sg=new THREE.BufferGeometry(), sp=new Float32Array(900*3);
  for(var s=0;s<900;s++){ sp[s*3]=(Math.random()-0.5)*400; sp[s*3+1]=(Math.random()-0.5)*400; sp[s*3+2]=(Math.random()-0.5)*400; }
  sg.setAttribute('position',new THREE.BufferAttribute(sp,3));
  var sm=new THREE.PointsMaterial({color:0x8B5CF6,size:0.6,transparent:true,opacity:0.7});
  var stars=new THREE.Points(sg,sm);
  scene.add(stars);
  Lens.disposables.push(sg,sm);

  // nodes: Node X = Catalog Item X, fibonacci sphere, size = PLT true value
  var group=new THREE.Group();
  scene.add(group);
  Lens.group=group;
  var geo=new THREE.SphereGeometry(0.8,16,16);
  Lens.disposables.push(geo);
  var mats={};
  Object.keys(PALETTE).forEach(function(t){
    var m=new THREE.MeshBasicMaterial({color:PALETTE[t],transparent:true,opacity:0.92});
    mats[t]=m; Lens.disposables.push(m);
  });
  var N=catalog.length, R=45, GA=Math.PI*(3-Math.sqrt(5));
  var counts={};
  Lens.vis={}; Lens.nodes=[];
  catalog.forEach(function(item,i){
    var t=String(item.type||'soul');
    counts[t]=(counts[t]||0)+1;
    if(!(t in Lens.vis)) Lens.vis[t]=true;
    var y=1-(i/(N-1))*2, ph=Math.asin(clamp(y,-1,1)), th=GA*i;
    var pv=clamp(pltVal(item),0,2);
    var mesh=new THREE.Mesh(geo,mats[t]||mats.soul);
    mesh.position.set(R*Math.cos(th)*Math.cos(ph),R*Math.sin(ph),R*Math.sin(th)*Math.cos(ph));
    var base=0.55+(pv/2)*1.1;
    mesh.scale.setScalar(base);
    mesh.userData={name:item.name,type:t,plt:String(item.plt||''),desc:String(item.desc||item.details||''),icon:String(item.icon||'✦'),base:base};
    group.add(mesh);
    Lens.nodes.push(mesh);
  });
  Lens.buildLegend(counts);
  var cc=$('soulverse-count');
  if(cc) cc.textContent=N+' NODES · '+Object.keys(counts).length+' TYPES';

  // events (all removed on close)
  var B=Lens.bound, ray=new THREE.Raycaster(), ptr=new THREE.Vector2();
  var el=renderer.domElement;
  B.move=function(ev){
    Lens.dragX=ev.clientX; Lens.dragY=ev.clientY;
    if(Lens.dragOn) return;
    ptr.x=(ev.clientX/window.innerWidth)*2-1;
    ptr.y=-(ev.clientY/window.innerHeight)*2+1;
    ray.setFromCamera(ptr,camera);
    var hits=ray.intersectObjects(Lens.nodes.filter(function(n){ return n.visible; }),false);
    Lens.setHover(hits.length?hits[0].object:null,ev.clientX,ev.clientY);
  };
  B.down=function(ev){ Lens.dragOn=true; Lens.moved=0; Lens.dragX=ev.clientX; Lens.dragY=ev.clientY; };
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
    Lens.dist=clamp(Lens.dist+(ev.deltaY>0?6:-6),30,160);
    if(Lens.camera) Lens.camera.position.z=Lens.dist;
  };
  B.key=function(ev){ if(ev.key==='Escape') Lens.close(); };
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
  window.addEventListener('keydown',B.key);
  window.addEventListener('resize',B.resize);

  var cb=$('soulverse-close');
  if(cb){ B.closeclick=function(){ Lens.close(); }; cb.addEventListener('click',B.closeclick); }

  Lens.active=true;
  (function tick(){
    if(!Lens.active) return;
    Lens.raf=requestAnimationFrame(tick);
    if(Lens.group){
      if(!Lens.dragOn){
        Lens.group.rotation.y+=0.0012+Lens.vx;
        Lens.group.rotation.x=clamp(Lens.group.rotation.x+Lens.vy,-0.9,0.9);
        Lens.vx*=0.95; Lens.vy*=0.95;
      }
    }
    Lens.renderer.render(Lens.scene,Lens.camera);
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
  if(!Lens.THREE) return;
  var ptr=new Lens.THREE.Vector2((x/window.innerWidth)*2-1,-(y/window.innerHeight)*2+1);
  var ray=new Lens.THREE.Raycaster();
  ray.setFromCamera(ptr,Lens.camera);
  var hits=ray.intersectObjects(Lens.nodes.filter(function(n){ return n.visible; }),false);
  if(!hits.length) return;
  Lens.sel=hits[0].object;
  Lens.showHud(Lens.sel.userData);
};

Lens.showHud=function(u){
  var hud=$('soulverse-hud'); if(!hud) return;
  var col=PALCSS[u.type]||'#fff';
  hud.innerHTML='<div style="font-size:1.4rem">'+esc(u.icon)+'</div>'+
    '<div style="font-size:1rem;font-weight:800;color:#fff;margin:2px 0">'+esc(u.name)+'</div>'+
    '<div style="font-size:0.65rem;letter-spacing:.08em;color:'+col+'">'+esc(u.type).toUpperCase()+(u.plt?' · PLT '+esc(u.plt):'')+'</div>'+
    (u.desc?'<div style="font-size:0.75rem;color:#B8B8B8;margin-top:6px;line-height:1.5">'+esc(u.desc.slice(0,160))+'</div>':'')+
    '<button id="soulverse-open" data-name="'+esc(u.name)+'" style="margin-top:10px;padding:8px 16px;border-radius:20px;background:linear-gradient(135deg,#FFD166,#8B5CF6);border:none;color:#000;font-weight:800;font-size:0.75rem;cursor:pointer">Open Real Card →</button>';
  hud.style.display='block';
  var b=$('soulverse-open');
  if(b) b.onclick=function(){ Lens.openCard(b.getAttribute('data-name')); };
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
    });
  });
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
  var overlay=$('soulverse-overlay');
  if(overlay) overlay.style.display='none';
  var hud=$('soulverse-hud'); if(hud){ hud.style.display='none'; hud.innerHTML=''; }
  var tip=$('soulverse-tip'); if(tip) tip.style.display='none';
  document.body.style.overflow=Lens.prevScroll||'';
  document.body.style.cursor='';
  Lens.renderer=null; Lens.scene=null; Lens.camera=null; Lens.group=null;
  Lens.nodes=[]; Lens.hover=null; Lens.sel=null; Lens.vx=0; Lens.vy=0;
  Lens.bound={};
};

window.SoulverseLens=Lens;
// Best tab branch calls initBestOrb() — panel is static, nothing to pre-init.
window.initBestOrb=function(){};
})();
