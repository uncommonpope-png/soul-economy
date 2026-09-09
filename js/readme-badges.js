/* ─── SIP-14 — DYNAMIC GITHUB README SHIELD GENERATOR ─── */
(function(){
'use strict';
var REPO='https://uncommonpope-png.github.io/soul-economy/profile.html';
var TOAST_T=null;
function normalize(h){
  return String(h||'').trim().toLowerCase().replace(/^@/,'').replace(/[^a-z0-9-]/g,'').slice(0,39);
}
function build(h,count){
  var badges=[
    '[![BUYaSOUL Sanctuary](https://img.shields.io/badge/BUYaSOUL-%40'+h+'-ffd700?style=for-the-badge&logo=ghost&logoColor=0a0a0f&labelColor=0a0a0f)]('+REPO+'#@'+h+')',
    '[![Squad Active](https://img.shields.io/badge/Squad-'+count+'%2F8%20Active-00ffcc?style=for-the-badge&labelColor=0a0a0f)]('+REPO+'#@'+h+')',
    '[![True Value](https://img.shields.io/badge/PLT-Sovereign-ffd700?style=for-the-badge&labelColor=0a0a0f)]('+REPO+'#@'+h+')'
  ];
  return badges;
}
function badgeImage(kind,h,count){
  if(kind==='b') return 'https://img.shields.io/badge/BUYaSOUL-%40'+h+'-ffd700?style=for-the-badge&logo=ghost&logoColor=0a0a0f&labelColor=0a0a0f';
  if(kind==='s') return 'https://img.shields.io/badge/Squad-'+count+'%2F8%20Active-00ffcc?style=for-the-badge&labelColor=0a0a0f';
  return 'https://img.shields.io/badge/PLT-Sovereign-ffd700?style=for-the-badge&labelColor=0a0a0f';
}
function toast(msg){
  var t=document.getElementById('badgeToast');
  if(!t){ t=document.createElement('div'); t.id='badgeToast'; document.body.appendChild(t); }
  t.innerHTML='<span style="display:inline-block;background:#0c0c12;border:1px solid rgba(255,209,102,0.4);color:#ffd166;padding:9px 18px;border-radius:30px;font-size:0.8rem;font-family:ui-monospace,Consolas,monospace;box-shadow:0 16px 50px rgba(0,0,0,0.7)">'+msg+'</span>';
  t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:3600;opacity:1;transition:opacity .4s';
  clearTimeout(TOAST_T);
  TOAST_T=setTimeout(function(){ t.style.opacity=0; },2600);
}
function copyText(t,okMsg){
  function fail(){ toast('⚠ Clipboard blocked — select the text manually'); }
  function done(){ toast(okMsg); }
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(t).then(done,fail);
  } else {
    var ta=document.createElement('textarea');
    ta.value=t; ta.style.cssText='position:fixed;opacity:0;left:-4000px';
    document.body.appendChild(ta); ta.select();
    var ok=false; try{ ok=document.execCommand('copy'); }catch(e){}
    document.body.removeChild(ta);
    if(ok) done(); else fail();
  }
}
function openModal(){
  var st={};
  try{ st=JSON.parse(localStorage.getItem('soulProfileV1')||'null')||{}; }catch(e){}
  var h=normalize(st.handle); if(!h) h='guest';
  var count=Array.isArray(st.top8)?st.top8.length:0;
  var md=build(h,count).join('\n');
  var ov=document.createElement('div');
  ov.id='badgesModal';
  ov.style.cssText='position:fixed;inset:0;z-index:3200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.72);backdrop-filter:blur(6px);padding:16px';
  var box=document.createElement('div');
  box.style.cssText='width:620px;max-width:100%;background:#0c0c12;border:1px solid rgba(255,209,102,0.4);border-radius:20px;padding:24px;box-shadow:0 30px 120px rgba(0,0,0,0.85);font-family:ui-monospace,Consolas,monospace';
  box.innerHTML=
    '<h3 style="margin:0 0 6px;font-size:1rem;color:#fff">🛡 GitHub README Badges — '+esc('@'+h)+'</h3>'+
    '<div class="badges-sub" style="font-size:0.72rem;color:#8f887a;margin-bottom:14px">Drop into your <code>README.md</code> (or any repo) — each badge deep-links back to this sanctuary. Re-copies fresh.<br>Click Copy after editing: it re-reads your handle + squad live.</div>'+
    '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:16px">'+
      '<a href="'+REPO+'#@'+h+'" target="_blank"><img src="'+badgeImage('b',h,count)+'" alt="BUYaSOUL Sanctuary"></a>'+
      '<a href="'+REPO+'#@'+h+'" target="_blank"><img src="'+badgeImage('s',h,count)+'" alt="Squad Active"></a>'+
      '<a href="'+REPO+'#@'+h+'" target="_blank"><img src="'+badgeImage('p',h,count)+'" alt="True Value"></a>'+
    '</div>'+
    '<textarea id="badgeMd" rows="5" spellcheck="false" readonly style="width:100%;box-sizing:border-box;padding:12px 14px;border-radius:12px;border:1px solid rgba(139,92,246,0.3);background:#05050a;color:#c9c4b8;font-family:ui-monospace,Consolas,monospace;font-size:0.72rem;line-height:1.5">'+md+'</textarea>'+
    '<div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">'+
      '<button id="badgeCopy" style="flex:1;min-width:160px;background:linear-gradient(135deg,#ffd700,#ffb800);border:none;color:#000;padding:10px 16px;border-radius:30px;cursor:pointer;font-family:inherit;font-weight:700;font-size:0.8rem">📋 Copy Markdown</button>'+
      '<button id="badgeClose" style="padding:10px 18px;border-radius:30px;cursor:pointer;font-family:inherit;font-size:0.8rem;background:transparent;border:1px solid rgba(255,255,255,0.15);color:#9a9a9a">✕ Close</button>'+
    '</div>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  box.querySelector('#badgeCopy').addEventListener('click',function(ev){
    ev.stopPropagation();
    var cur=document.getElementById('badgeMd');
    var txt=cur?cur.value:build(h,count).join('\n');
    copyText(txt,'✦ Markdown copied to clipboard — paste into your README');
  });
  box.querySelector('#badgeClose').addEventListener('click',function(ev){ ev.stopPropagation(); document.body.removeChild(ov); });
  ov.addEventListener('click',function(e){ if(e.target===ov) document.body.removeChild(ov); });
}
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
function wire(){ var b=document.getElementById('upcBadges'); if(b) b.addEventListener('click',openModal); }
if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',wire); }
else wire();
})();