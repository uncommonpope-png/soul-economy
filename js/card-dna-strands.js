/* js/card-dna-strands.js — living DNA background per library card (classic script).
   Scoped to #resourceGrid .card only. One shared rAF loop, viewport-gated via
   IntersectionObserver, one MutationObserver for attach/detach, shared glyph
   dictionary. No per-card loops, no per-card observers. Honors reduced-motion.
   Exposes window.BioDna. */
(function(){
'use strict';
var PALETTE={
  mind:{color:'#00ffcc',freq:1.0,phase:0},
  soul:{color:'#9945ff',freq:1.3,phase:Math.PI*0.5},
  memory:{color:'#ffd700',freq:0.8,phase:Math.PI},
  witness:{color:'#3b82f6',freq:1.1,phase:Math.PI*1.5},
  sovereign:{color:'#ff007f',freq:1.4,phase:Math.PI*0.25},
  def:{color:'#00f3ff',freq:1.0,phase:0}
};
var TYPE_STRAND={soul:'soul',agent:'soul',role:'witness',infrastructure:'witness',skill:'mind',pack:'mind',world:'memory',book:'memory',chamber:'sovereign',combo:'sovereign'};
var REDUCED=false;
try{ REDUCED=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}
var LITE=false;
try{ LITE=window.matchMedia&&window.matchMedia('(pointer:coarse)').matches&&Math.min(window.screen.width,window.screen.height)<820; }catch(e){}
var DPR=1;
try{ DPR=Math.min(window.devicePixelRatio||1,1.5); }catch(e){ DPR=1; }

var engines=[];
var catPromise=null;

function findItem(name){
  try{
    if(typeof items!=='undefined'&&items&&items.length){
      for(var i=0;i<items.length;i++){ if(items[i]&&items[i].name===name) return items[i]; }
    }
  }catch(e){}
  return null;
}
function ensureCatalog(cb){
  var hit=null;
  try{
    if(typeof items!=='undefined'&&items&&items.length){
      for(var i=0;i<items.length;i++){ if(items[i]){ hit=true; break; } }
    }
  }catch(e){}
  if(hit){ cb(true); return; }
  if(!catPromise){
    catPromise=fetch('data/catalog.json',{cache:'no-store'}).then(function(r){ return r.json(); }).then(function(j){
      try{ if(!((typeof items!=='undefined')&&items&&items.length)) window.__bioCatalog=Array.isArray(j)?j:(j.items||[]); }catch(e){ window.__bioCatalog=[]; }
      return true;
    }).catch(function(){ return false; });
  }
  catPromise.then(cb);
}
function findItemAny(name){
  var it=findItem(name);
  if(it) return it;
  try{
    var c=window.__bioCatalog||[];
    for(var i=0;i<c.length;i++){ if(c[i]&&c[i].name===name) return c[i]; }
  }catch(e){}
  return null;
}

function deriveStrands(item){
  var key=TYPE_STRAND[String(item.type||'').toLowerCase()]||'mind';
  var primary=item.featured?'sovereign':key;
  var secondary;
  var desc=String(item.desc||item.details||'').toLowerCase();
  if(desc.indexOf('memory')>=0) secondary='memory';
  else secondary=(primary==='mind')?'def':'mind';
  return [PALETTE[primary]||PALETTE.mind, PALETTE[secondary]||PALETTE.def];
}

function makeEngine(canvas,item){
  var ctx=canvas.getContext('2d');
  var eng={
    canvas:canvas, ctx:ctx, item:item,
    strands:deriveStrands(item),
    pulses:[], visible:false, drawnOnce:false,
    w:300, h:400
  };
  for(var i=0;i<6;i++){
    eng.pulses.push({yPos:Math.random()*400,speed:1.2+Math.random()*2.2,glyphIdx:Math.floor(Math.random()*48)});
  }
  return eng;
}

function sizeEngine(eng){
  try{
    var r=eng.canvas.parentElement.getBoundingClientRect();
    var w=Math.max(50,Math.round(r.width)||300), h=Math.max(50,Math.round(r.height)||400);
    eng.w=w; eng.h=h;
    eng.canvas.width=Math.round(w*DPR); eng.canvas.height=Math.round(h*DPR);
    eng.ctx.setTransform(DPR,0,0,DPR,0,0);
  }catch(e){}
}

function strokeGlow(ctx,color,width,alpha){
  ctx.strokeStyle=color;
  ctx.globalAlpha=alpha*0.25;
  ctx.lineWidth=width+5;
  ctx.stroke();
  ctx.globalAlpha=alpha;
  ctx.lineWidth=width;
  ctx.stroke();
}

function renderEngine(eng){
  var ctx=eng.ctx, t=performance.now()*0.002;
  var W=eng.w, H=eng.h;
  ctx.clearRect(0,0,W,H);
  var centerX=W/2;
  var helixAmplitude=Math.max(18,Math.min(52,W*0.18));
  var rungSpacing=28;
  var A=eng.strands[0], B=eng.strands[1];
  var G=(window.AlienHieroglyphs&&window.AlienHieroglyphs.draw)?window.AlienHieroglyphs.draw:null;
  var y, angle, x1, x2, zDepth, alpha;
  // 1. hydrogen / hieroglyphic rungs
  for(y=0;y<H;y+=rungSpacing){
    angle=(y*0.02)+t*A.freq;
    x1=centerX+Math.sin(angle+A.phase)*helixAmplitude;
    x2=centerX+Math.sin(angle+B.phase)*helixAmplitude;
    zDepth=Math.cos(angle);
    alpha=0.25+(zDepth*0.5+0.5)*0.65;
    ctx.strokeStyle=zDepth>0?'#ffd700':'#00ffcc';
    ctx.lineWidth=zDepth>0?2:1;
    ctx.globalAlpha=alpha*0.7;
    ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x2,y); ctx.stroke();
    if(G&&y%(rungSpacing*2)===0){
      G(ctx,Math.floor(Math.abs(Math.sin(y+t))*48),(x1+x2)/2-8,y-8,16,zDepth>0?'#ffd700':'#00ffcc',alpha);
    }
  }
  // 2. entwined strands (double-stroke glow, no shadowBlur in hot path)
  for(var sIdx=0;sIdx<2;sIdx++){
    var st=eng.strands[sIdx];
    ctx.beginPath();
    for(y=0;y<H;y+=4){
      angle=(y*0.02)+t*st.freq;
      var x=centerX+Math.sin(angle+st.phase)*helixAmplitude;
      if(y===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    strokeGlow(ctx,st.color,3.5,0.85);
  }
  // 3. streaming data glyphs across rungs
  for(var p=0;p<eng.pulses.length;p++){
    var pu=eng.pulses[p];
    pu.yPos+=pu.speed;
    if(pu.yPos>H){ pu.yPos=-20; pu.glyphIdx=(pu.glyphIdx+7)%48; }
    angle=(pu.yPos*0.02)+t*A.freq;
    var xo=centerX+Math.sin(angle+A.phase)*helixAmplitude;
    var xt=centerX+Math.sin(angle+B.phase)*helixAmplitude;
    var slide=(Math.sin(t*3+pu.yPos)*0.5+0.5);
    if(G) G(ctx,pu.glyphIdx,xo+(xt-xo)*slide-10,pu.yPos-10,20,'#ffffff',0.95);
  }
  ctx.globalAlpha=1;
}

var loopOn=false;
function loop(){
  if(!loopOn) return;
  requestAnimationFrame(loop);
  for(var i=0;i<engines.length;i++){
    var e=engines[i];
    if(!e.visible) continue;
    if(REDUCED&&e.drawnOnce) continue;
    renderEngine(e);
    e.drawnOnce=true;
  }
}
function ensureLoop(){
  if(loopOn) return;
  loopOn=true;
  requestAnimationFrame(loop);
}

var io=null, ro=null;
function observeCard(card,eng){
  try{
    if(!io){
      io=new IntersectionObserver(function(es){
        es.forEach(function(en){
          var g=en.target._bioEngine;
          if(g) g.visible=en.isIntersecting;
        });
      },{rootMargin:'100px'});
    }
    card._bioEngine=eng;
    io.observe(card);
  }catch(e){ eng.visible=true; }
  try{
    if(!ro){
      ro=new ResizeObserver(function(es){
        es.forEach(function(en){
          var g=en.target._bioEngine;
          if(g){ sizeEngine(g); g.drawnOnce=false; }
        });
      });
    }
    ro.observe(card);
  }catch(e){}
}

function destroyEngine(card){
  try{
    var eng=card._bioEngine;
    if(eng){
      var ix=engines.indexOf(eng);
      if(ix>=0) engines.splice(ix,1);
      try{ eng.ctx.clearRect(0,0,eng.canvas.width,eng.canvas.height); }catch(e){}
      card._bioEngine=null;
    }
    if(io){ try{ io.unobserve(card); }catch(e){} }
    if(ro){ try{ ro.unobserve(card); }catch(e){} }
  }catch(e){}
}

function mountEngine(card,item){
  if(card._bioEngine) return;
  var canvas=card.querySelector('.card-bio-canvas');
  if(!canvas||!canvas.isConnected) return;
  var eng=makeEngine(canvas,item);
  sizeEngine(eng);
  engines.push(eng);
  observeCard(card,eng);
  ensureLoop();
}

function attach(card){
  if(!card||card.dataset.biodna) return;
  card.dataset.biodna='1';
  try{
    if(!card.querySelector('.card-bible-stamp')){
      var stamp=document.createElement('div');
      stamp.className='card-bible-stamp';
      stamp.textContent='BUYaSOUL';
      card.prepend(stamp);
    }
    if (LITE) return;
    var icon=card.querySelector('.card-icon');
    if(icon) icon.classList.add('card-emblem-pulse');
    var img=card.querySelector('img.card-image, img');
    if(img) img.classList.add('card-avatar-breathing');
    var canvas=document.createElement('canvas');
    canvas.className='card-bio-canvas';
    card.insertBefore(canvas,card.firstChild);
    Array.prototype.forEach.call(card.children,function(child){
      if(child!==canvas){ child.style.position='relative'; child.style.zIndex='1'; }
    });
  }catch(e){ return; }
  var nm=card.dataset.id||'';
  var it=findItem(nm);
  if(it){ mountEngine(card,it); return; }
  ensureCatalog(function(){
    if(!card.isConnected||card._bioEngine) return;
    var it2=findItemAny(nm);
    if(it2) mountEngine(card,it2);
  });
}

function scan(root){
  try{
    var grid=document.getElementById('resourceGrid');
    if(!grid) return;
    var cards=grid.querySelectorAll('.card:not([data-biodna])');
    for(var i=0;i<cards.length;i++){ attach(cards[i]); }
  }catch(e){}
}

function boot(){
  scan();
  try{
    var grid=document.getElementById('resourceGrid');
    if(!grid) return;
    var mo=new MutationObserver(function(muts){
      muts.forEach(function(mu){
        for(var i=0;i<mu.removedNodes.length;i++){
          var n=mu.removedNodes[i];
          if(n.nodeType!==1) continue;
          if(n.classList&&n.classList.contains('card')) destroyEngine(n);
          else if(n.querySelectorAll){
            var olds=n.querySelectorAll('.card[data-biodna]');
            for(var k=0;k<olds.length;k++){ destroyEngine(olds[k]); }
          }
        }
      });
      scan();
    });
    mo.observe(grid,{childList:true,subtree:true});
  }catch(e){}
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
else boot();

window.BioDna={attach:attach,scan:scan,engines:engines};
})();
