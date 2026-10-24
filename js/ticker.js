/* Soul Economy — Live ticker (Rank 4). Real data only, in this order:
   1. The Square's /api/feed (same-origin on the Worker, else the Worker
      origin directly, so the Pages mirror works too).
   2. The public registry profiles/index.json (static, always readable).
   If both are empty or unreachable, an honest empty state — never
   invented entries, never placeholder souls. */
(function(){
  'use strict';
  var WORKER = 'https://soul-economy.uncommonpope.workers.dev';
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function snip(s, n){
    s = String(s==null?'':s).replace(/\s+/g,' ').trim();
    return s.length > n ? s.slice(0, n-1) + '…' : s;
  }
  function authorOf(p){
    if(p.display_name) return p.display_name;
    if(p.name) return p.name;
    if(p.pubkey) return String(p.pubkey).slice(0, 12) + '…';
    return 'Soul';
  }
  function feedItems(posts){
    return posts.map(function(p){
      var when = p.created_at ? new Date(p.created_at).toLocaleDateString() : '';
      return '<a class="ticker-item" href="square.html"><b>' + esc(authorOf(p)) + '</b>' +
        '<span>' + esc(snip(p.content, 90)) + '</span>' +
        (when ? '<i>' + esc(when) + '</i>' : '') + '</a>';
    }).join('');
  }
  function profileItems(list){
    return list.map(function(p){
      var handle = p.handle || p.name || 'soul';
      var label = p.name && p.name !== handle ? p.name + ' (@' + handle + ')' : '@' + handle;
      var extra = p.mood ? ' — ' + p.mood : (p.squad_count ? ' · ' + p.squad_count + ' souls' : '');
      return '<a class="ticker-item" href="profile.html"><b>' + esc(label) + '</b>' +
        '<span>' + esc(snip(extra.replace(/^ — /, ''), 90)) + '</span></a>';
    }).join('');
  }
  function fetchJson(url, timeoutMs){
    var ctl = null;
    try{ ctl = new AbortController(); }catch(e){}
    var timer = null;
    if(ctl) timer = setTimeout(function(){ try{ ctl.abort(); }catch(e){} }, timeoutMs || 6000);
    return fetch(url, {signal: ctl ? ctl.signal : undefined}).then(function(r){
      if(!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).finally(function(){ if(timer) clearTimeout(timer); });
  }
  async function loadTicker(){
    var el = document.getElementById('liveTickerItems');
    var note = document.getElementById('liveTickerNote');
    if(!el) return;
    var urls = ['/api/feed?scope=global&limit=10', WORKER + '/api/feed?scope=global&limit=10'];
    for(var i = 0; i < urls.length; i++){
      try{
        var j = await fetchJson(urls[i]);
        var posts = j && Array.isArray(j.posts) ? j.posts : [];
        if(posts.length){
          el.innerHTML = feedItems(posts);
          if(note) note.textContent = 'Live from The Square · ' + posts.length + ' recent voices';
          return;
        }
      }catch(e){ /* try next source */ }
    }
    try{
      var reg = await fetchJson('profiles/index.json');
      var list = Array.isArray(reg) ? reg : (reg && Array.isArray(reg.profiles) ? reg.profiles : []);
      if(list.length){
        el.innerHTML = profileItems(list);
        if(note) note.textContent = 'Public sanctuaries in the registry';
        return;
      }
    }catch(e){ /* fall through to empty state */ }
    el.innerHTML = '<span class="ticker-empty">No public activity yet — be the first voice in <a href="square.html">The Square</a>.</span>';
    if(note) note.textContent = 'Live ticker · waiting for its first voice';
  }
  document.addEventListener('DOMContentLoaded', loadTicker);
  /* Test hook (harmless in production): lets verification poke the real
     code paths without a browser. */
  try{ window.__tickerTest = { feedItems: feedItems, profileItems: profileItems, loadTicker: loadTicker, esc: esc }; }catch(e){}
})();
