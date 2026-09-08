/* Soul Economy — Profile Social Layer (SIP-4)
   Additive-only: powers #user-profile-canvas. Does not touch the catalog,
   index.html, workbench links, or the knowledge graph. */
(function(){
'use strict';
var LS_KEY='soulProfileV1';
var PREF='#user-profile-canvas';
var DEFAULTS={handle:'',bio:'',mood:'',audio:'',themeCSS:'',top8:[],guests:[],public:false};
var state, items=[];
var VISITOR=false;
var REGISTRY=false;

function loadState(){
  try{
    var v=JSON.parse(localStorage.getItem(LS_KEY)||'null');
    state=Object.assign({},DEFAULTS,v||{});
  }catch(e){ state=Object.assign({},DEFAULTS); }
  if(!state.handle){
    try{ if(localStorage.getItem('soulUser')) state.handle=localStorage.getItem('soulUser'); }catch(e){}
  }
  if(!Array.isArray(state.top8)) state.top8=[];
  if(!Array.isArray(state.guests)) state.guests=[];
}
function saveState(){ if(VISITOR) return; try{ localStorage.setItem(LS_KEY,JSON.stringify(state)); }catch(e){} }

/* ---- SIP-5: public identity routing (share engine) ---- */
function toB64(s){ try{ return btoa(unescape(encodeURIComponent(s))); }catch(e){ return ''; } }
function fromB64(b){ try{ return decodeURIComponent(escape(atob(b))); }catch(e){ return null; } }
var HAVE_COMP=false;
try{ HAVE_COMP=(typeof CompressionStream!=='undefined')&&(typeof DecompressionStream!=='undefined'); }catch(e){ HAVE_COMP=false; }
function minCss(c){ return String(c||'').replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s+/g,' ').trim(); }
function u8ToB64(u8){
  var s='';
  for(var i=0;i<u8.length;i+=0x8000){ s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000)); }
  return btoa(s);
}
function u8FromB64(b64){
  var bin=atob(b64), u8=new Uint8Array(bin.length);
  for(var i=0;i<bin.length;i++){ u8[i]=bin.charCodeAt(i); }
  return u8;
}
function compressPayload(json){
  try{
    var obj=JSON.parse(json);
    if(obj&&obj.profile&&obj.profile.themeCSS){ obj.profile.themeCSS=minCss(obj.profile.themeCSS); json=JSON.stringify(obj); }
  }catch(e){}
  var bytes=new TextEncoder().encode(json);
  var cs=new CompressionStream('deflate-raw');
  var pipe=new Response(new Blob([bytes]).stream()).body.pipeThrough(cs);
  return new Response(pipe).arrayBuffer().then(function(buf){ return u8ToB64(new Uint8Array(buf)); });
}
function decompressPayload(b64){
  var ds=new DecompressionStream('deflate-raw');
  var pipe=new Blob([u8FromB64(b64)]).stream().pipeThrough(ds);
  return new Response(pipe).arrayBuffer().then(function(buf){ return new TextDecoder().decode(new Uint8Array(buf)); });
}
function buildPayload(){
  return {schema:'user_profile.json/1.0',profile:{handle:state.handle,bio:state.bio,mood:state.mood,audio:state.audio,themeCSS:state.themeCSS,public:state.public},
    equippedSouls:state.top8.slice(),guestbook:state.guests.slice(0,20)};
}
function applyPayload(p){
  var pr=(p.profile)||p;
  state={handle:String(pr.handle||'guest').replace(/^@/,''),bio:String(pr.bio||''),mood:String(pr.mood||''),
    audio:String(pr.audio||''),themeCSS:String(pr.themeCSS||''),public:!!pr.public,
    top8:(p.equippedSouls&&Array.isArray(p.equippedSouls)?p.equippedSouls:[]).slice(0,8),
    guests:(p.guestbook&&Array.isArray(p.guestbook)?p.guestbook:[]).slice()};
  VISITOR=true;
}
function readShareHash(cb){
  try{
    var h=location.hash||'';
    if(h.indexOf('#view=')!==0){ cb(false); return; }
    var raw=decodeURIComponent(h.slice(6));
    var finish=function(json){
      try{
        var p=JSON.parse(json);
        if(!p||typeof p!=='object'){ cb(false); return; }
        applyPayload(p); cb(true);
      }catch(e){ cb(false); }
    };
    if(raw.indexOf('lz:')===0){
      if(!HAVE_COMP){ cb(false); return; }
      decompressPayload(raw.slice(3)).then(finish).catch(function(){ cb(false); });
      return;
    }
    finish(fromB64(raw));
  }catch(e){ cb(false); }
}
function normalizeHandle(h){
  return String(h||'').trim().toLowerCase().replace(/^@/,'').replace(/[^a-z0-9-]/g,'').slice(0,39);
}
function getRegHandle(){
  try{
    var h=location.hash||'';
    var m=/^#@([A-Za-z0-9_-]+)$/.exec(h);
    if(m) return normalizeHandle(m[1]);
    var sp=new URLSearchParams(location.search.split('#')[0]);
    var u=sp.get('user');
    if(u) return normalizeHandle(u);
  }catch(e){}
  return '';
}
function resolveRegistry(){
  var handle=getRegHandle();
  if(!handle) return false;
  fetch('profiles/'+handle+'.json',{cache:'no-store'}).then(function(r){
    if(!r.ok){ throw {code:r.status}; }
    return r.json();
  }).then(function(p){
    applyPayload(p); REGISTRY=true;
    finishBoot();
  }).catch(function(){
    reportToast('Profile @'+handle+' has not yet settled in the registry. Showing local sanctuary.');
    loadState(); REGISTRY=false;
    finishBoot();
  });
  return true;
}
function copyText(t,label){
  var ta=document.createElement('textarea');
  ta.value=t; ta.style.cssText='position:fixed;left:-9999px';
  document.body.appendChild(ta); ta.select();
  try{ document.execCommand('copy'); reportToast(label||'Link copied'); }catch(e){ alert('Copy manually: '+t); }
  ta.remove();
}
function reportToast(m){
  var el=$('upcToast')||(function(){ var d=document.createElement('div'); d.id='upcToast'; d.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:3000;background:#0c0c12;color:#fff;border:1px solid rgba(0,212,255,0.45);border-radius:30px;padding:10px 20px;font-size:0.8rem;box-shadow:0 10px 40px rgba(0,0,0,0.7);transition:opacity .3s'; document.body.appendChild(d); return d; })();
  el.textContent=m; el.style.opacity='1';
  setTimeout(function(){ el.style.opacity='0'; },2600);
}
function shareProfile(){
  if(VISITOR) return;
  var json=JSON.stringify(buildPayload());
  var base=location.origin+location.pathname.replace(/profile\.html$/i,'profile.html')+'#view=';
  if(HAVE_COMP){
    compressPayload(json).then(function(b){ finishShare(base+'lz:'+b); })
      .catch(function(){ finishShare(base+toB64(json)); });
    return;
  }
  finishShare(base+toB64(json));
}
function finishShare(url){
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(function(){ reportToast('⇪ Share link copied — paste it anywhere'); },
      function(){ copyText(url,'⇪ Share link copied — paste it anywhere'); });
  } else copyText(url,'⇪ Share link copied — paste it anywhere');
}
function openRegModal(){
  var h=normalizeHandle(state.handle);
  var title='Profile Submission: @'+state.handle;
  var payload=JSON.stringify(buildPayload(),null,2);
  var body='### Soul Economy Registry Submission\n\n- **Handle:** @'+state.handle+'\n- **Target File:** `profiles/'+h+'.json`\n\n```json\n'+payload+'\n```';
  var ov=document.createElement('div'); ov.id='upcRegModal';
  ov.style.cssText='position:fixed;inset:0;z-index:2200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.68);backdrop-filter:blur(6px);padding:16px';
  var box=document.createElement('div');
  box.style.cssText='width:640px;max-width:100%;max-height:90vh;overflow-y:auto;background:#0c0c12;border:1px solid rgba(255,209,102,0.3);border-radius:20px;padding:20px;box-shadow:0 30px 120px rgba(0,0,0,0.8)';
  box.innerHTML='<h3 style="margin:0 0 6px;font-size:1.05rem">⛭ Publish to Registry</h3>'+
    '<p style="margin:0 0 12px;color:#8b8b98;font-size:0.78rem">Opens a pre-filled GitHub issue; once approved, your profile lands at <code>profiles/'+h+'.json</code> and becomes a permanent <b>#@'+esc(state.handle)+'</b> link. If the URL gets too long for your browser, use <b>Copy Full Payload</b> and paste it into the issue manually.</p>'+
    '<textarea id="upcRegBody" rows="9" spellcheck="false" readonly style="white-space:pre-wrap;font-size:0.72rem;min-height:190px;width:100%">'+esc(body)+'</textarea>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">'+
      '<button id="upcRegOpen" class="upc-btn prim" style="flex:1;min-width:160px">Open GitHub Issue</button>'+
      '<button id="upcRegCopyJson" class="upc-btn cyan">Copy Raw JSON</button>'+
      '<button id="upcRegCopyAll" class="upc-btn">Copy Full Payload</button>'+
      '<button id="upcRegClose" class="upc-btn">Close</button>'+
    '</div>';
  ov.appendChild(box); document.body.appendChild(ov);
  box.querySelector('#upcRegOpen').addEventListener('click',function(){
    window.open('https://github.com/uncommonpope-png/soul-economy/issues/new?title='+encodeURIComponent(title)+'&body='+encodeURIComponent(body),'_blank');
  });
  box.querySelector('#upcRegCopyJson').addEventListener('click',function(){ copyText(payload,'JSON payload copied to clipboard'); });
  box.querySelector('#upcRegCopyAll').addEventListener('click',function(){ copyText(body,'Full submission payload copied to clipboard'); });
  box.querySelector('#upcRegClose').addEventListener('click',function(){ document.body.removeChild(ov); });
  ov.addEventListener('click',function(ev){ if(ev.target===ov) document.body.removeChild(ov); });
}
function publishRegistry(){
  if(VISITOR) return;
  if(!state.handle){ alert('Give yourself a handle first (✎ Edit Profile).'); return; }
  openRegModal();
}
function wireVisitor(){
  if(!VISITOR) return;
  ['upcEdit','upcPick','upcExport','upcImport','upcReg','upcShare','upcImportFile'].forEach(function(id){
    var b=$(id); if(b) b.style.display='none';
  });
  document.querySelectorAll('.wrap > .card').forEach(function(c){ c.style.display='none'; });
  var cv=$('user-profile-canvas'); if(!cv) return;
  var badge=document.createElement('div');
  badge.style.cssText='display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:12px 16px;border-radius:16px;background:rgba(0,212,255,0.08);border:1px solid rgba(0,212,255,0.35);font-size:0.8rem;color:#fff;box-shadow:0 10px 40px rgba(0,212,255,0.15);margin-bottom:16px';
  badge.innerHTML='<span>👁 Viewing <b>@'+esc(state.handle||'guest')+'</b>\u2019s Sanctuary</span>'+
    (REGISTRY?'<span style="background:rgba(0,212,255,0.14);border:1px solid rgba(0,212,255,0.5);color:#9be8ff;border-radius:100px;padding:3px 10px;font-size:0.7rem">✔ Verified Registry Soul</span>':'')+
    '<button class="upc-btn cyan" id="upcAdoptAll">+ Equip Entire Squad</button>'+
    '<button class="upc-btn prim" id="upcFork">◇ Fork This Profile</button>'+
    '<button class="upc-btn cyan" id="upcCreate">✦ Create Yours</button>'+
    '<button class="upc-btn" id="upcMine">View My Own</button>';
  cv.insertBefore(badge,cv.firstChild);
  var ad=badge.querySelector('#upcAdoptAll');
  if(ad) ad.addEventListener('click',adoptAll);
  badge.querySelector('#upcFork').addEventListener('click',function(){
    VISITOR=false; saveState();
    history.replaceState(null,'',location.pathname+location.search);
    exitVisitor();
    reportToast('◇ This sanctuary is now yours — edit it in ✎ Edit Profile');
  });
  badge.querySelector('#upcCreate').addEventListener('click',function(){
    history.replaceState(null,'',location.pathname+location.search);
    location.reload();
  });
  badge.querySelector('#upcMine').addEventListener('click',function(){
    history.replaceState(null,'',location.pathname+location.search);
    location.reload();
  });
}
function exitVisitor(){
  ['upcEdit','upcPick','upcExport','upcImport','upcReg','upcShare','upcImportFile'].forEach(function(id){
    var b=$(id); if(b) b.style.display='';
  });
  document.querySelectorAll('.wrap > .card').forEach(function(c){ c.style.display=''; });
  var badge=document.querySelector('#user-profile-canvas > div[style*="0,212,255,0.08"]');
  if(badge) badge.remove();
}

function $(id){ return document.getElementById(id); }
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function keyN(n){ return String(n||'').trim().toLowerCase(); }
function timeAgo(t){
  var d=Date.now()-t; if(d<60000)return 'now'; if(d<3600000)return Math.floor(d/60000)+'m';
  if(d<86400000)return Math.floor(d/3600000)+'h'; return Math.floor(d/86400000)+'d';
}
function findItem(name){ name=keyN(name); for(var i=0;i<items.length;i++){ if(keyN(items[i].name)===name) return items[i]; } return null; }

/* ---- scoped CSS engine (restricts user CSS to #user-profile-canvas) ---- */
function scopeCss(raw){
  raw=String(raw||'').replace(/\/\*[\s\S]*?\*\//g,'');
  var prefix='#user-profile-canvas ';
  var out='', block='', sel='', depth=0, inStr=null, i=0, c, L=raw.length;
  while(i<L){
    c=raw[i];
    if(inStr){
      if(c===inStr){ if(raw[i-1]!=='\\') inStr=null; }
      block+=c; i++; continue;
    }
    if(c==='"' || c==="'"){ inStr=c; block+=c; i++; continue; }
    if(c==='{'){
      if(depth===0){ sel=block; block=''; }
      else block+=c;
      depth++; i++; continue;
    }
    if(c==='}'){
      depth--;
      if(depth===0){ out+=rewrite(sel,block,prefix); block=''; sel=''; }
      else block+=c;
      i++; continue;
    }
    block+=c; i++;
  }
  if(block.trim()) out+=rewrite(sel,block,prefix);
  return out;
}
function rewrite(sel,body,prefix){
  var s=(sel||'').trim();
  if(!s) return '';
  if(s.charAt(0)==='@'){
    if(s.indexOf('@media')===0) return s+'{\n'+scopeCss(body,prefix)+'\n}';
    return s+'{\n'+body+'\n}';
  }
  var scoped=s.split(',').map(function(x){
    x=x.trim();
    if (!x) return '';
    if (x.indexOf(prefix)===0) return x;
    return prefix+x;
  }).join(',\n');
  return scoped+'{\n'+body+'\n}';
}
function applyTheme(){
  try{
    var el=$('upcThemeStyle');
    if(!el){ el=document.createElement('style'); el.id='upcThemeStyle'; document.head.appendChild(el); }
    el.textContent = state.themeCSS ? scopeCss(state.themeCSS) : '';
  }catch(e){}
}

/* ---- render ---- */
function render(){
  renderIdentity();
  renderTop8();
  renderTheme();
  renderGuests();
}
function renderIdentity(){
  var box=$('upcIdentity'); if(!box) return;
  var handle=state.handle||'guest';
  var av;
  if(handle && handle!=='guest' && handle.indexOf('@')===0){ av='<img src="https://github.com/'+esc(handle.slice(1))+'.png" alt="avatar"'+(state.handle?'':'')+'>'; }
  else { av='<div style="font-size:2.6rem">'+(state.handle?'🫂':'👤')+'</div>'; }
  box.innerHTML='<div class="upc-id">'+
    '<div class="upc-ava">'+av+'</div>'+
    '<div class="u-txt">'+
      '<div class="upc-handle">'+(state.handle?('<em>@</em>'+esc(state.handle)):'<em>@</em>guest')+'</div>'+
      (state.mood?'<div class="upc-mood">🫥 '+esc(state.mood)+'</div>':'')+
      (state.bio?'<div class="upc-bio">'+esc(state.bio)+'</div>':'<div class="upc-bio" style="opacity:.6">No bio yet — hit ✎ Edit Profile.</div>')+
      (state.audio?'<div class="upc-audio"><audio controls loop autoplay src="'+esc(state.audio)+'"></audio></div>':'')+
    '</div>'+
  '</div>';
}
function renderTop8(){
  var box=$('upcTop8'); if(!box) return;
  if(!state.top8.length){
    box.innerHTML=VISITOR?'<div class="upc-empty">This sanctuary has no equipped souls yet.</div>'
      :'<div class="upc-empty">My Active Squad is empty. Click “◇ Equip Souls” to feature up to 8 souls from the Library on your shelf.</div>';
    return;
  }
  box.innerHTML='<div class="upc-grid">'+state.top8.map(function(nm){
    var it=findItem(nm);
    var icon=it?(it.icon||'✦'):'✦';
    var ty=it?(it.type||'soul'):'catalog item';
    var slug=encodeURIComponent(keyN(nm));
    var action=VISITOR
      ?'<button class="adh" data-adh="'+esc(nm)+'" title="Add this soul to your own Squad">+ Adopt to My Squad</button>'
      :'<button class="rm" data-rm="'+esc(nm)+'" title="Remove from shelf">✕</button>';
    return '<div class="upc-soul"><a href="index.html#soul-'+slug+'" style="display:block" title="Open in Library">'+
      '<div class="ic">'+esc(icon)+'</div><div class="nm">'+esc(nm)+'</div><div class="ty">'+esc(ty)+'</div></a>'+
      action+'</div>';
  }).join('')+'</div>';
  if(VISITOR){
    box.querySelectorAll('.adh').forEach(function(b){
      b.addEventListener('click',function(ev){ ev.preventDefault(); adoptToSquad(b.getAttribute('data-adh'),b); });
    });
    updateAdoptLabels();
  } else {
    box.querySelectorAll('.rm').forEach(function(b){
      b.addEventListener('click',function(){
        state.top8=state.top8.filter(function(n){return n!==b.getAttribute('data-rm');});
        saveState(); renderTop8();
      });
    });
  }
}
function renderTheme(){
  var box=$('upcCss'); if(!box) return;
  var active=!!state.themeCSS;
  box.innerHTML='<h3>🎨 MySpace Cottage</h3>'+
    '<div class="upc-sub">Customize this profile canvas only — the global navigation, PLT counters and workbench docks stay shielded.</div>'+
    '<div class="upc-theme-status">'+
      '<span class="upc-tchip">theme: '+(active?'custom':'default')+'</span>'+
      '<span class="upc-tchip">shelf: '+state.top8.length+'/8</span>'+
      '<span class="upc-tchip">audio: '+(state.audio?'linked':'none')+'</span>'+
      '<span class="upc-tchip">guestbook: '+state.guests.length+' signed</span>'+
      (state.public?'<span class="upc-tchip" style="color:#00D4FF">public share: on</span>':'')+
    '</div>'+
    (!VISITOR?'<div class="upc-regline"><span class="upc-tchip" id="upcRegStatus">● checking registry…</span></div>':'');
}
function checkRegistryStatus(){
  var el=$('upcRegStatus'); if(!el) return;
  var h=state.handle||'';
  if(!h){ el.textContent='● Unregistered Soul (Saved locally) · ✎ set a handle to claim yours'; el.style.color='#9a937f'; return; }
  var okf=function(){ el.textContent='✔ Verified Registry Soul'; el.style.color='#00D4FF'; };
  var unreg=function(){ el.innerHTML='● Unregistered Soul (Saved locally) · <a href="#" id="upcClaim" style="color:#00D4FF">Claim Verified Handle</a>'; var a=el.querySelector('#upcClaim'); if(a) a.addEventListener('click',function(ev){ ev.preventDefault(); publishRegistry(); }); };
  fetch('profiles/'+normalizeHandle(h)+'.json',{cache:'no-store'}).then(function(r){
    if(r.ok) okf(); else unreg();
  }).catch(unreg);
}
function renderGuests(){
  var box=$('upcGuests'); if(!box) return;
  box.innerHTML='<h3>💬 Visitor Guestbook</h3>'+
    '<div class="upc-sub">Local-first signed notes. When Public Share is enabled the same entries route to the <code>JSON export</code> (future: <code>giscus</code>/GitHub Discussions hook).</div>'+
    '<div class="upc-guests">'+
      (state.guests.length?state.guests.slice(0,40).map(function(g,i){
        return '<div class="upc-guest"><div class="gav">'+(g.who?esc(g.who.charAt(0).toUpperCase()):'?')+'</div>'+
          '<div class="gt"><b>'+esc(g.who||'anonymous')+'</b>: '+esc(g.text)+'<div class="gm">'+timeAgo(g.t)+' · signed on '+esc(state.handle||'this profile')+'</div></div>'+
          '<button class="gdel" data-i="'+i+'" title="remove">🗑</button></div>';
      }).join(''):'<div class="upc-empty">Nothing signed yet — leave the first note below.</div>')+
    '</div>'+
    '<div class="upc-guestform"><textarea id="upcNote" rows="2" maxlength="220" placeholder="Sign the guestbook… (200 chars)"></textarea><button id="upcNoteBtn">Sign</button></div>'+
    '<div class="upc-share-note">Privately stored in <code>localStorage:soulProfileV1</code>. Public sharing toggle lives in ✎ Edit. Full export: <code>⬇ user_profile.json</code>.</div>';
  box.querySelector('#upcNoteBtn').addEventListener('click',signGuest);
  box.querySelector('#upcNote').addEventListener('keydown',function(ev){ if(ev.key==='Enter'&&!ev.shiftKey){ev.preventDefault();signGuest();} });
  box.querySelectorAll('.gdel').forEach(function(b){
    b.addEventListener('click',function(){
      var i=+b.getAttribute('data-i');
      state.guests=state.guests.filter(function(_,x){return x!==i;});
      saveState(); renderGuests();
    });
  });
}
function signGuest(){
  var inp=$('upcNote'); if(!inp) return;
  var txt=inp.value.trim().slice(0,200); if(!txt) return;
  state.guests.unshift({who:state.handle||'guest',t:Date.now(),text:txt});
  saveState(); renderGuests();
}

/* ---- visitor → local squad adoption (SIP-7) ---- */
function localSquad(){
  try{ var v=JSON.parse(localStorage.getItem(LS_KEY)||'null'); return (v&&Array.isArray(v.top8))?v.top8:[]; }catch(e){ return []; }
}
function setLocalSquad(a){
  try{ var v=JSON.parse(localStorage.getItem(LS_KEY)||'{}')||{}; v.top8=a; localStorage.setItem(LS_KEY,JSON.stringify(v)); }catch(e){}
}
function adoptToSquad(name,btn){
  var s=localSquad(), k=keyN(name);
  if(s.some(function(n){return keyN(n)===k;})){ if(btn) btn.textContent='✓ In your Squad'; reportToast('◇ '+name+' is already in your Squad'); return; }
  if(s.length>=8){ reportToast('Squad full (8/8) — unequip one on your own profile'); return; }
  s.push(name); setLocalSquad(s);
  try{ window.dispatchEvent(new CustomEvent('squad-updated')); }catch(e){}
  if(btn) btn.textContent='✓ In your Squad';
  reportToast('✦ Added '+name+' to your squad! ('+s.length+'/8)');
}
function adoptAll(){
  var s=localSquad(), added=0;
  state.top8.forEach(function(nm){
    if(s.length>=8) return;
    if(s.some(function(n){return keyN(n)===keyN(nm);})) return;
    s.push(nm); added++;
  });
  setLocalSquad(s);
  try{ window.dispatchEvent(new CustomEvent('squad-updated')); }catch(e){}
  updateAdoptLabels();
  reportToast(added?('✦ Adopted '+added+' souls into your squad! ('+s.length+'/8)'):'◇ All of those souls are already in your Squad');
}
function updateAdoptLabels(){
  var box=$('upcTop8'); if(!box) return;
  var s=localSquad();
  box.querySelectorAll('.adh').forEach(function(b){
    if(s.some(function(n){return keyN(n)===keyN(b.getAttribute('data-adh'));})) b.textContent='✓ In your Squad';
  });
}

/* ---- editor modal ---- */
function openEditor(){
  var ed=$('upcEditor'); if(!ed) return;
  ed.classList.remove('hidden');
  var body=ed.querySelector('.ed');
  body.innerHTML='<h3>✎ Edit your profile</h3><p>All fields local-first, saved in this browser. Nothing leaves your machine until you hit Export.</p>'+
    '<label>Handle (@username) <input id="editHandle" maxlength="24" value="'+esc(state.handle)+'"></label>'+
    '<label>Bio <textarea id="editBio" rows="3" maxlength="220">'+esc(state.bio)+'</textarea></label>'+
    '<label>Mood / status quote <input id="editMood" maxlength="60" value="'+esc(state.mood)+'"></label>'+
    '<label>Audio theme URL (host your own file; plays only inside your canvas) <input id="editAudio" placeholder="https://yoursite.com/theme.mp3" value="'+esc(state.audio)+'"></label>'+
    '<label>Custom CSS (safe preview — auto-scoped to #user-profile-canvas, so <code>body{}</code> won\u2019t leak to the site)\n<textarea id="editCss" rows="8" spellcheck="false">'+esc(state.themeCSS)+'</textarea></label>'+
    '<label style="display:flex;align-items:center;gap:8px;margin-top:14px"><input type="checkbox" id="editPublic" style="width:auto" '+(state.public?'checked':'')+'/> Enable public share (guestbook export / giscus hook)</label>'+
    '<div class="edBtns"><button class="save" id="editSave">Save Profile</button><button class="cancel" id="editCancel">Cancel</button></div>';
  ed.querySelector('#editSave').addEventListener('click',function(){
    state.handle=body.querySelector('#editHandle').value.trim().replace(/^@/,'');
    state.bio=body.querySelector('#editBio').value.trim();
    state.mood=body.querySelector('#editMood').value.trim();
    state.audio=body.querySelector('#editAudio').value.trim();
    state.themeCSS=body.querySelector('#editCss').value;
    state.public=body.querySelector('#editPublic').checked;
    saveState(); applyTheme(); render(); checkRegistryStatus(); ed.classList.add('hidden');
  });
  ed.querySelector('#editCancel').addEventListener('click',function(){ ed.classList.add('hidden'); });
  ed.addEventListener('click',function(ev){ if(ev.target===ed) ed.classList.add('hidden'); });
}

/* ---- equip picker (Top 8 shelf) ---- */
function openPicker(){
  var ov=document.createElement('div');
  ov.id='upcPick';
  ov.style.cssText='position:fixed;inset:0;z-index:2100;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.68);backdrop-filter:blur(6px);padding:16px';
  var box=document.createElement('div');
  box.style.cssText='width:620px;max-width:100%;max-height:90vh;overflow-y:auto;background:#0c0c12;border:1px solid rgba(0,212,255,0.3);border-radius:20px;padding:20px;box-shadow:0 30px 120px rgba(0,0,0,0.8)';
  var used=Object.create(null);
  state.top8.forEach(function(n){ used[keyN(n)]=1; });
  var rows=items.map(function(it){
    var on=!!used[keyN(it.name)];
    return '<div class="upc-row" style="display:flex;gap:10px;align-items:center;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid '+(on?'rgba(0,212,255,0.4)':'rgba(255,255,255,0.05)')+';margin-bottom:6px;cursor:pointer" data-name="'+esc(it.name)+'">'+
      '<span>'+(on?'✅':'◇')+'</span><span style="font-size:1.1rem">'+esc(it.icon||'✦')+'</span>'+
      '<span style="flex:1;font-size:0.8rem;color:#ddd">'+esc(it.name)+'</span>'+
      '<span style="font-size:0.62rem;color:#6b7280;text-transform:uppercase">'+esc(it.type||'')+'</span></div>';
  }).join('');
  box.innerHTML='<h3 style="margin:0 0 4px;font-size:1.05rem">◇ Equip Souls — “My Active Squad”</h3>'+
    '<p style="color:#8b8b98;font-size:0.75rem;margin:0 0 12px">Pick up to 8 souls from the master catalog to feature on your shelf. Third click toggles off. Click a name to open it in the Library.</p>'+
    rows+
    '<div id="upcPickEmpty" style="'+((items.length)?'display:none':'')+';color:#6b7280;font-size:0.8rem;padding:10px 0">Catalog still brewing — refresh in a moment.</div>'+
    '<div style="display:flex;gap:8px;margin-top:12px"><button id="upcPickDone" style="flex:1;padding:10px;border-radius:30px;background:linear-gradient(135deg,var(--purple),#00D4FF);border:none;color:#fff;font-weight:700;font-size:0.8rem;cursor:pointer">Done</button></div>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  box.querySelectorAll('.upc-row').forEach(function(r){
    r.addEventListener('click',function(){
      var nm=r.getAttribute('data-name');
      var key=keyN(nm);
      if(used[key]){ state.top8=state.top8.filter(function(n){return keyN(n)!==key;}); }
      else{
        if(state.top8.length>=8){ alert('Shelf is full — Top 8 max for this shelf.'); return; }
        state.top8.push(nm);
      }
      used[key]=!used[key];
      saveState(); refreshRows(box); renderTheme(); renderTop8();
    });
  });
  function refreshRows(b){ b.querySelectorAll('.upc-row').forEach(function(r){ var k=keyN(r.getAttribute('data-name')); r.style.borderColor=(used[k]?'rgba(0,212,255,0.4)':'rgba(255,255,255,0.05)'); r.firstChild.textContent=(used[k]?'✅':'◇'); }); }
  box.querySelector('#upcPickDone').addEventListener('click',function(){ document.body.removeChild(ov); });
}

/* ---- export / import user_profile.json ---- */
function exportJson(){
  var payload={schema:'user_profile.json/1.0',profile:{handle:state.handle,bio:state.bio,mood:state.mood,audio:state.audio,themeCSS:state.themeCSS,public:state.public},equippedSouls:state.top8.slice(),guestbook:state.guests.slice()};
  var blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='user_profile.json';
  document.body.appendChild(a); a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },400);
}
function importJson(file){
  var rd=new FileReader();
  rd.onload=function(){
    try{
      var j=JSON.parse(rd.result);
      if(!j || typeof j!=='object'){ alert('Not a user_profile.json'); return; }
      var p=(j.profile)||j;
      if(j.profile){ state.top8=(j.equippedSouls||[]).slice(); state.guests=(j.guestbook||[]).slice(); }
      state.handle=(p.handle!=null?String(p.handle):state.handle).replace(/^@/,'');
      state.bio=p.bio!=null?String(p.bio):state.bio;
      state.mood=p.mood!=null?String(p.mood):state.mood;
      state.audio=p.audio!=null?String(p.audio):state.audio;
      state.themeCSS=p.themeCSS!=null?String(p.themeCSS):state.themeCSS;
      state.public=!!p.public;
      if(!Array.isArray(state.top8)) state.top8=[];
      if(!Array.isArray(state.guests)) state.guests=[];
      state.top8=state.top8.slice(0,8);
      saveState(); applyTheme(); render();
    }catch(e){ alert('That file could not be read.'); }
  };
  rd.readAsText(file);
}

function boot(){
  if(location.hash.indexOf('#view=')===0){
    readShareHash(function(ok){
      if(!ok) loadState();
      finishBoot();
    });
    return;
  }
  if(resolveRegistry()){ return; }
  loadState();
  finishBoot();
}
function finishBoot(){ applyTheme(); render(); wireVisitor(); checkRegistryStatus(); }

/* wire the canvas shell */
window.addEventListener('DOMContentLoaded',function(){
  if(!document.getElementById('user-profile-canvas')) return;
  var editBtn=$('upcEdit'); if(editBtn) editBtn.addEventListener('click',openEditor);
  var pickBtn=$('upcPick'); if(pickBtn) pickBtn.addEventListener('click',openPicker);
  var expBtn=$('upcExport'); if(expBtn) expBtn.addEventListener('click',exportJson);
  var shrBtn=$('upcShare'); if(shrBtn) shrBtn.addEventListener('click',shareProfile);
  var regBtn=$('upcReg'); if(regBtn) regBtn.addEventListener('click',publishRegistry);
  var impBtn=$('upcImport'); if(impBtn) impBtn.addEventListener('click',function(){ $('upcImportFile').click(); });
  var impFile=$('upcImportFile'); if(impFile) impFile.addEventListener('change',function(ev){ var f=ev.target.files&&ev.target.files[0]; if(f) importJson(f); ev.target.value=''; });
  fetch('data/catalog.json',{cache:'no-store'}).then(function(r){ return r.json(); }).then(function(j){
    items=Array.isArray(j)?j:(j.items||[]); boot();
  }).catch(function(){ items=[]; boot(); });
});
})();