/* js/auth-client.js — zero-cost GitHub OAuth via Cloudflare Worker (SIP-11)
   Plain IIFE (no modules). Config lives at the top: drop in your GitHub OAuth
   Client ID and your deployed Worker URL, then hard-refresh. Everything below
   stays additive and fails safe when the gateway is unconfigured. */
(function(){
'use strict';
var CONFIG={
  CLIENT_ID:'YOUR_GITHUB_CLIENT_ID_HERE',   // ← GitHub OAuth App client id
  GATEWAY_URL:'https://auth.buyasoul.workers.dev', // ← Cloudflare Worker URL
  STORAGE_KEY:'soulUserAuthV1',
  SCOPE:'read:user'
};
function configured(){
  return CONFIG.CLIENT_ID && CONFIG.CLIENT_ID.indexOf('YOUR_')!==0
      && CONFIG.GATEWAY_URL && CONFIG.GATEWAY_URL.indexOf('https://')===0;
}
function profilePageUrl(){
  return window.location.origin + window.location.pathname.replace(/[^/]*$/, 'profile.html');
}
window.SoulAuth={
  enabled:configured,
  config:CONFIG,
  login:function(){
    if(!configured()){
      alert('Auth gateway not configured yet — set your GitHub Client ID in js/auth-client.js (SIP-11).');
      return;
    }
    try{
      window.location.href='https://github.com/login/oauth/authorize'
        +'?client_id='+encodeURIComponent(CONFIG.CLIENT_ID)
        +'&redirect_uri='+encodeURIComponent(profilePageUrl())
        +'&scope='+encodeURIComponent(CONFIG.SCOPE)
        +'&state='+Date.now();
    }catch(e){ alert('Could not start GitHub sign-in.'); }
  },
  handleRedirectCallback:function(){
    if(!configured()){
      if(/[?&]code=/.test(window.location.search)||/[?&]error=/.test(window.location.search)) stripParams();
      return null;
    }
    var params=new URLSearchParams(window.location.search);
    var code=params.get('code');
    var err=params.get('error');
    if(err){ stripParams(); return null; }
    if(!code) return null;
    return fetch(CONFIG.GATEWAY_URL,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({code:code})
    }).then(function(res){ return res.json(); }).then(function(data){
      if(!data.access_token){ stripParams(); return null; }
      return fetch('https://api.github.com/user',{
        headers:{'Authorization':'Bearer '+data.access_token}
      }).then(function(ur){ return ur.json(); }).then(function(user){
        var session={
          token:data.access_token,
          handle:user.login||'',
          name:user.name||user.login||'',
          avatar:user.avatar_url||'',
          bio:user.bio||'',
          github_url:user.html_url||''
        };
        if(!session.handle){ stripParams(); window.SoulAuth._notify(); return null; }
        try{ localStorage.setItem(CONFIG.STORAGE_KEY,JSON.stringify(session)); }catch(e){}
        stripParams();
        window.SoulAuth._notify();
        return session;
      });
    }).catch(function(err){
      console.error('Auth token exchange failed:',err);
      stripParams();
      return null;
    });
  },
  getUser:function(){
    try{
      var raw=localStorage.getItem(CONFIG.STORAGE_KEY);
      if(!raw) return null;
      var s=JSON.parse(raw);
      return (s&&s.handle)?s:null;
    }catch(e){ return null; }
  },
  logout:function(){
    try{ localStorage.removeItem(CONFIG.STORAGE_KEY); }catch(e){}
    window.location.reload();
  },
  _notify:function(){
    try{ window.dispatchEvent(new CustomEvent('soul-auth')); }catch(e){}
  },
  mountAll:function(){
    if(!configured()) return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-auth-nav]'),function(el){ window.SoulAuth.mount(el); });
  },
  mount:function(el){
    if(!el) return;
    var a=window.SoulAuth.getUser();
    var base='display:inline-flex;align-items:center;gap:8px;font-size:0.85rem';
    var btn='padding:6px 14px;border:1px solid rgba(255,255,255,0.12);border-radius:30px;color:var(--text-gray,#B8B8B8);text-decoration:none;cursor:pointer;background:none;font-family:inherit';
    if(a&&a.handle){
      el.innerHTML='<a href="profile.html" style="'+base+';font-weight:600;color:#fff;text-decoration:none" title="Verified GitHub identity">✦ @'+String(a.handle).replace(/[<>&"]/g,'')+'</a>'+
        '<button type="button" title="Sign out" style="'+btn+'">⏻ Sign Out</button>';
      var x=el.querySelector('button'); if(x) x.addEventListener('click',function(){ window.SoulAuth.logout(); });
    } else {
      el.innerHTML='<a href="#" title="Sign in with GitHub" style="'+base+';font-weight:600;text-decoration:none">✦ Sign in</a>';
      var y=el.querySelector('a'); if(y) y.addEventListener('click',function(e){ e.preventDefault(); window.SoulAuth.login(); });
    }
  }
};
function stripParams(){
  try{
    var clean=window.location.origin+window.location.pathname+window.location.hash;
    window.history.replaceState({},document.title,clean);
  }catch(e){}
}
/* auto-run: exchange an incoming ?code= the moment this deferred script loads */
if(configured()){
  window.SoulAuth.handleRedirectCallback();
} else if(/[?&]code=/.test(window.location.search)){
  stripParams();
}
document.addEventListener('DOMContentLoaded',function(){ window.SoulAuth.mountAll(); });
})();