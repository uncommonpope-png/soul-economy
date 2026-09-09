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
  bgScene:null, bgCamera:null, bgMat:null, lastT:0, _tmpV:null,
  mNX:0, mNY:0, mVel:0,
  vis:{}, hover:null, sel:null,
  dist:80, vx:0, vy:0, dragOn:false, dragX:0, dragY:0, moved:0,
  prevScroll:'', bound:{}
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.autoClear=false;
  container.appendChild(renderer.domElement);
  Lens.scene=scene; Lens.camera=camera; Lens.renderer=renderer;
  Lens.disposables.push(renderer);

  // SIP-17 PHASE 1: matrix code-rain background quad (own scene/camera, zero DOM cost)
  var bgMat=new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0},uResolution:{value:new THREE.Vector2(window.innerWidth,window.innerHeight)}},
    vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.0); }',
    fragmentShader:[
      'uniform float uTime; uniform vec2 uResolution; varying vec2 vUv;',
      'float random(vec2 st){ return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123); }',
      'void main(){',
      ' vec2 st=gl_FragCoord.xy/uResolution.xy;',
      ' st.y*=uResolution.y/uResolution.x;',
      ' float columns=60.0;',
      ' vec2 ipos=floor(st*vec2(columns,columns));',
      ' float speed=0.4+random(vec2(ipos.x,0.0))*0.7;',
      ' float drop=fract(uTime*speed+random(vec2(ipos.x,1.0)));',
      ' float trail=smoothstep(0.0,0.4,drop-fract(st.y*3.0));',
      ' float glyph=step(0.5,random(ipos+floor(uTime*12.0)));',
      ' vec3 greenCode=vec3(0.0,1.0,0.4)*trail*glyph;',
      ' vec3 deepVoid=vec3(0.04,0.04,0.06);',
      ' gl_FragColor=vec4(mix(deepVoid,greenCode,0.25),1.0);',
      '}'
    ].join('\n'),
    depthWrite:false, depthTest:false
  });
  var bgGeo=new THREE.PlaneGeometry(2,2);
  var bgQuad=new THREE.Mesh(bgGeo,bgMat);
  bgQuad.frustumCulled=false;
  var bgScene=new THREE.Scene(); bgScene.add(bgQuad);
  Lens.bgScene=bgScene; Lens.bgCamera=new THREE.Camera(); Lens.bgMat=bgMat;
  Lens.disposables.push(bgGeo,bgMat);

  // starfield depth layer (cheap points under the matrix wash)
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
    mesh.userData={name:item.name,type:t,plt:String(item.plt||''),desc:String(item.desc||item.details||''),icon:String(item.icon||'✦'),base:base,pv:pv,item:item,billboard:null,
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
  // SIP-17 PHASE 3: stapled mini-cards for top-64 PLT (rest on-demand on select)
  Lens.nodes.slice().sort(function(a,b){ return b.userData.pv-a.userData.pv; }).slice(0,64).forEach(function(n){
    Lens.ensureBillboard(n);
  });
  Lens.buildLegend(counts);
  var cc=$('soulverse-count');
  if(cc) cc.textContent=N+' NODES · '+Object.keys(counts).length+' TYPES';

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
    if(Lens.dragOn||!Lens.active) return;
    Lens.setHover(Lens.castAt(ev.clientX,ev.clientY),ev.clientX,ev.clientY);
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
    if(Lens.bgMat) Lens.bgMat.uniforms.uResolution.value.set(window.innerWidth,window.innerHeight);
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
  Lens.lastT=performance.now();
  (function tick(){
    if(!Lens.active) return;
    Lens.raf=requestAnimationFrame(tick);
    var now=performance.now(), dt=Math.min(0.05,(now-Lens.lastT)/1000);
    Lens.lastT=now;
    var t=now/1000;
    // SIP-17 PHASE 4: synced uniforms — matrix rain + all breathing nodes
    if(Lens.bgMat) Lens.bgMat.uniforms.uTime.value=t;
    for(var i=0;i<Lens.shaders.length;i++){ Lens.shaders[i].uniforms.uTime.value+=dt; }
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
    // SIP-17 ADDENDUM: predatory kinematics before render (wind/water/slime/bloom)
    Lens.updateKinematics(t,dt);
    // SIP-17 PHASE 4: dynamic distance fade — billboards dissolve past focus range
    if(Lens.camera){
      var tmp=Lens._tmpV||(Lens._tmpV=new Lens.THREE.Vector3());
      for(var k2=0;k2<Lens.sprites.length;k2++){
        var rec=Lens.sprites[k2];
        if(!rec.node.visible){ rec.sp.visible=false; continue; }
        // stapled: billboard rides the node's drifted position
        rec.sp.position.copy(rec.node.position); rec.sp.position.y+=4.2;
        rec.node.getWorldPosition(tmp);
        var dist=Lens.camera.position.distanceTo(tmp);
        var op=clamp(1-(dist-30)/60,0,1);
        if(rec.node===Lens.hover||rec.node===Lens.sel) op=Math.max(op,0.95);
        rec.sp.material.opacity=op;
        rec.sp.visible=op>0.02;
      }
    }
    try{
      Lens.renderer.clear();
      if(Lens.bgScene) Lens.renderer.render(Lens.bgScene,Lens.bgCamera);
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
  Lens.ensureBillboard(node);
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
    '<button id="soulverse-open" data-name="'+esc(u.name)+'" style="margin-top:10px;padding:8px 16px;border-radius:20px;background:linear-gradient(135deg,#FFD166,#8B5CF6);border:none;color:#000;font-weight:800;font-size:0.75rem;cursor:pointer">Open Real Card →</button>';
  hud.style.display='block';
  var b=$('soulverse-open');
  if(b) b.onclick=function(){ Lens.openCard(b.getAttribute('data-name')); };
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
// SIP-17 PHASE 3: HTML5 canvas mini-card → sprite stapled above a node
function makeBillboard(THREE,item,colorCss){
  var canvas=document.createElement('canvas');
  canvas.width=512; canvas.height=256;
  var ctx=canvas.getContext('2d');
  ctx.fillStyle='rgba(10,10,15,0.88)'; ctx.fillRect(0,0,512,256);
  ctx.strokeStyle='#ffd700'; ctx.lineWidth=6; ctx.strokeRect(10,10,492,236);
  ctx.fillStyle=colorCss||'#00ffcc'; ctx.font='bold 24px monospace';
  ctx.fillText('['+String(item.type||'SOUL').toUpperCase()+']',30,50);
  ctx.fillStyle='#ffffff'; ctx.font='bold 34px monospace';
  var name=String(item.name||'?');
  if(name.length>20) name=name.substring(0,18)+'..';
  ctx.fillText(name,30,100);
  ctx.fillStyle='#a5b4fc'; ctx.font='20px monospace';
  var desc=String(item.desc||item.details||'Autonomous sovereign entity');
  if(desc.length>48) desc=desc.substring(0,48)+'...';
  ctx.fillText(desc,30,145);
  ctx.fillStyle='#1e1b4b'; ctx.fillRect(30,175,452,45);
  ctx.strokeStyle='#00ffcc'; ctx.lineWidth=2; ctx.strokeRect(30,175,452,45);
  ctx.fillStyle='#ffd700'; ctx.font='bold 22px monospace';
  ctx.fillText('PLT SCORE: '+String(item.plt||'∞')+' TRUE VALUE',45,206);
  var tex=new THREE.CanvasTexture(canvas);
  tex.minFilter=THREE.LinearFilter;
  var mat=new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false});
  var sprite=new THREE.Sprite(mat);
  sprite.scale.set(16,8,1);
  return {sprite:sprite,tex:tex,mat:mat};
}
Lens.ensureBillboard=function(node){
  if(!node||!Lens.group||node.userData.billboard) return node?node.userData.billboard:null;
  var u=node.userData;
  var b=makeBillboard(Lens.THREE,u.item,PALCSS[u.type]||'#00ffcc');
  b.sprite.position.copy(node.position);
  b.sprite.position.y+=4.2;
  b.sprite.userData.node=node;
  u.billboard=b.sprite;
  Lens.group.add(b.sprite);
  Lens.sprites.push({sp:b.sprite,node:node});
  Lens.disposables.push(b.tex,b.mat);
  return b.sprite;
};
// unified raycast: nodes first, then visible billboards (both open the real card)
Lens.castAt=function(x,y){
  if(!Lens.THREE||!Lens.camera) return null;
  var ptr=new Lens.THREE.Vector2((x/window.innerWidth)*2-1,-(y/window.innerHeight)*2+1);
  var ray=new Lens.THREE.Raycaster();
  ray.setFromCamera(ptr,Lens.camera);
  var hits=ray.intersectObjects(Lens.nodes.filter(function(n){ return n.visible; }),false);
  if(hits.length) return hits[0].object;
  var sps=Lens.sprites.filter(function(s){ return s.sp.visible&&s.sp.material.opacity>0.1; }).map(function(s){ return s.sp; });
  var hits2=ray.intersectObjects(sps,false);
  if(hits2.length&&hits2[0].object.userData.node) return hits2[0].object.userData.node;
  return null;
};
// SIP-17 ADDENDUM: bio-fluid predatory kinematics (wind / water / slime / bloom)
// Layers A–C run here; Layer D (billboard fade) lives in the existing fade pass.
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
  Lens.bgScene=null; Lens.bgCamera=null; Lens.bgMat=null;
  Lens.nodes=[]; Lens.shaders=[]; Lens.sprites=[]; Lens.beams=[];
  Lens.hover=null; Lens.sel=null; Lens.vx=0; Lens.vy=0;
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
console.info('[soulverse] lens v3 loaded (matrix + breath + billboards + kinematics)');
})();
