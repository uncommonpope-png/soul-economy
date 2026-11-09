/* ============================================================================
   BETTY PLUSH — CHAT BUBBLE TALKING SYSTEM  (RIDE BUILD)
   ----------------------------------------------------------------------------
   Status: RIDE BUILD — wired into the portal flythrough (portal-ride.html).
   Ordered by: Pope, live call 2026-11-08 ~10:19 CST (portal brief);
   ride built 2026-11-09 on Pope's "build it" (live 3D camera path route).
   World look: Midnight Amber — bg #0C0C12 / amber #F59E0B. NO cyan anywhere.

   WHAT IT IS
   A reusable JS module the 3D world calls so souls "talk" to each other
   with chat bubbles during the portal flythrough and in explore mode.

   WORLD INTEGRATION
   - Include this file, then call BettyChat.init({ container }).
   - The world tells the module where each soul is on screen:
         BettyChat.setAnchor('drippy', () => projectToScreen(drippyMesh.position));
     The anchor fn must return { x, y } in CSS pixels, or null when the soul
     is off-screen (bubble then falls back to the dock lane).
   - No anchor set? Bubbles dock in the bottom lane instead. The module
     never needs the world to render anything itself.

   DIALOGUE RULES (binding — do not loosen without Pope/Ms GCP)
   - NEVER invent a story and present it as a soul's story.
   - Bubble lines come from exactly two pools:
       1. GENERIC — friendly greetings / exclamations, no story claims.
       2. VERBATIM — short excerpts quoted word-for-word (or lightly
          trimmed to one sentence / clause) from that soul's catalog story
          text in ~/workspace/campaign/betty-plush-fix2/data/betty-plush.json
          (the same text the world's story cards quote). Every quoted bubble
          carries its source line. 28 of the 31 souls have catalog story
          text; the three that do not are listed below and get GENERIC only.
   - NO STORY TEXT — generic lines only, never a story claim:
       Spike (registry story empty), Pixel Heart (registry story empty),
       Ember Stripe (registry story field is a "no story text exists" note,
       not a story — never quoted as one).
   - Draft stories in NAMES-STORIES-DRAFTS.md are NOT quoted here; only
     the catalog story text is.
   - Max 2 bubbles on screen at once; the rest queue FIFO.
   - Every bubble auto-dismisses; nothing stays up forever.

   API
     BettyChat.init({ container?, maxBubbles?, defaultDuration?, dock? })
     BettyChat.showBubble(soulId, text, { duration?, anchor? }) -> id|null
     BettyChat.say(soulId)            // random line for that soul (generic,
                                      // or a verbatim quote if it has one)
     BettyChat.playScript(lines, { gap? }) // [{soul, text?, delay?}] timed
     BettyChat.startAmbient({ interval?, souls? })
     BettyChat.stopAmbient()
     BettyChat.setAnchor(soulId, fn|null)
     BettyChat.clearAll()
     BettyChat.SOULS / BettyChat.VERBATIM_QUOTES / BettyChat.GENERIC_LINES
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---- Soul registry: all 31 souls in the world (tick 15 count).
     Keys are the WORLD ids from SOUL_REGISTRY in world-poc.html.
     `aliases` covers the kebab-case ids the earlier draft used. ---- */
  var SOULS = {
    'drippy':            { name: 'Drippy',             color: '#F59E0B', aliases: ['drippy'] },
    'spike':             { name: 'Spike',              color: '#C084FC', aliases: ['spike'] },
    'mendie':            { name: 'Mendie',             color: '#FF8FB1', aliases: ['mendie'] },
    'listen':            { name: 'Listen',             color: '#F59E0B', aliases: ['listen'] },
    'denim_patch':       { name: 'Denim Patch',        color: '#7FB3FF', aliases: ['denim-patch', 'denim'] },
    'pixel':             { name: 'Pixel Heart',        color: '#FF4D8D', aliases: ['pixel-heart'] },
    'ember':             { name: 'Ember Stripe',       color: '#FF6B4A', aliases: ['ember-stripe'] },
    'bell-paws':         { name: 'Bell Paws',          color: '#FFD166', aliases: ['bell-paws'] },
    'nightwing':         { name: 'Nightwing Dawn',     color: '#A855F7', aliases: ['nightwing-dawn'] },
    'thothsbag':         { name: 'thothsbag',          color: '#F59E0B', aliases: ['thothsbag'] },
    'djinn':             { name: 'Djinn',              color: '#C084FC', aliases: ['djinn'] },
    'dream-eater-charm': { name: 'Dream-eater Charm',  color: '#FF8FB1', aliases: ['dream-eater-charm'] },
    'cloud-the-clown':   { name: 'Cloud the Clown',    color: '#F5F0E6', aliases: ['cloud-the-clown'] },
    'lavenderfang':      { name: 'Lavender Fang',      color: '#C084FC', aliases: ['lavender-fang'] },
    'mint-doze':         { name: 'Mint Doze',          color: '#8FE3B0', aliases: ['mint-doze'] },
    'midnight-star':     { name: 'Midnight Star',      color: '#FFD166', aliases: ['midnight-star'] },
    'cream-puff':        { name: 'Cream Puff',         color: '#FFF3D6', aliases: ['cream-puff'] },
    'lenahorns':         { name: 'Lenahorns',          color: '#FF4D8D', aliases: ['lenahorns'] },
    'black-and-white-cow': { name: 'Black-and-White Cow', color: '#F5F0E6', aliases: ['black-and-white-cow'] },
    'dino-cat':          { name: 'Dino-Cat',           color: '#8FE3B0', aliases: ['dino-cat'] },
    'paw':               { name: 'Paw',                color: '#FFF3D6', aliases: ['paw'] },
    'sailor':            { name: 'Sailor',             color: '#A855F7', aliases: ['sailor'] },
    'grey_wolf':         { name: 'Grey Wolf',          color: '#C084FC', aliases: ['grey-wolf'] },
    'dream-eater':       { name: 'Dream-Eater',        color: '#7FB3FF', aliases: ['dream-eater'] },
    'lavender-cow':      { name: 'Lavender Cow',       color: '#C084FC', aliases: ['lavender-cow'] },
    'daki_kimono':       { name: 'DAKI Kimono',        color: '#FF8FB1', aliases: ['daki-kimono'] },
    'lavender-swirl':    { name: 'Lavender Swirl',     color: '#C084FC', aliases: ['lavender-swirl'] },
    'gothic_dress':      { name: 'Gothic Dress',       color: '#FF4D8D', aliases: ['gothic-dress'] },
    'star_school':       { name: 'Star School',        color: '#FFD166', aliases: ['star-school'] },
    'twin_bun':          { name: 'Twin-Bun',           color: '#F5F0E6', aliases: ['twin-bun'] },
    'pixel-bunny':       { name: 'Pixel Bunny',        color: '#FF4D8D', aliases: ['pixel-bunny'] }
  };

  /* ---- Pool 1: GENERIC greetings / exclamations. No story claims. ---- */
  var GENERIC_LINES = [
    'Hi!',
    'Hey, you made it!',
    '222!',
    'Welcome to the world!',
    'Look at us go!',
    'Bounce with us!',
    'This way!',
    'So glad you are here!',
    'Hi hi hi!',
    'Come say hello!',
    'We are all here!',
    'Wheee!'
  ];

  /* ---- Pool 2: VERBATIM excerpts from catalog story text (only). ----
     Source: ~/workspace/campaign/betty-plush-fix2/data/betty-plush.json
     (the same text the world's story cards quote verbatim). Each line is
     one sentence or clause, word-for-word from that soul's story.
     Spike / Pixel Heart / Ember Stripe have NO catalog story text and
     are deliberately absent here — generic lines only for them. */
  var VERBATIM_QUOTES = {
    'drippy': [
      { text: 'Her ears give her away before she says a word.',
        source: 'catalog story (verbatim excerpt)' }
    ],
    'mendie': [
      { text: 'She counts her buttons when she is nervous.',
        source: 'catalog story (verbatim excerpt)' }
    ],
    'listen': [
      { text: 'Listen knows what silence sounds like when nobody is listening back.',
        source: 'catalog story (verbatim excerpt)' }
    ],
    'denim_patch': [
      { text: 'Nobody sewed Denim Patch to be pretty.',
        source: 'catalog story (verbatim excerpt)' }
    ],
    'bell-paws': [
      { text: 'follow me, find me, keep me.',
        source: 'catalog story (verbatim excerpt)' }
    ],
    'nightwing': [
      { text: 'She did not have to choose. She got both.',
        source: 'catalog story (verbatim excerpt)' },
      { text: 'She flies when she wants, rests when she wants, and she is kept in the dark she trusts and in the light she earned.',
        source: 'catalog story (verbatim excerpt)' }
    ],
    'thothsbag': [
      { text: 'Her black patches are the nights she survived before she was collected.',
        source: 'catalog story (verbatim excerpt)' }
    ],
    'djinn': [
      { text: 'It kept thothsbag. Not as a wish. As a wife, a partner, a life.',
        source: 'catalog story (verbatim excerpt)' }
    ],
    'dream-eater-charm': [
      { text: 'It still eats the bad dreams.',
        source: 'catalog story (verbatim excerpt)' }
    ],
    'cloud-the-clown': [
      { text: 'A soul is not one mood.',
        source: 'catalog story (verbatim excerpt)' }
    ],
    'lavenderfang': [
      { text: 'It does not choose between soft and sharp anymore.',
        source: 'catalog story (verbatim excerpt)' }
    ],
    'mint-doze': [
      { text: 'It still dozes. It still wakes when it matters.',
        source: 'catalog story (verbatim excerpt)' }
    ],
    'midnight-star': [
      { text: 'Dayz held it in daylight, and the night still kept its star.',
        source: 'catalog story (verbatim excerpt)' }
    ],
    'cream-puff': [
      { text: 'It is still soft. It is no longer pushed.',
        source: 'catalog story (verbatim excerpt)' }
    ],
    'lenahorns': [
      { text: 'It did not shrink. It filled its shelf.',
        source: 'catalog story (verbatim excerpt)' }
    ],
    'black-and-white-cow': [
      { text: 'It still wears the flower. It still rings the bell.',
        source: 'catalog story (verbatim excerpt)' }
    ],
    'dino-cat': [
      { text: 'It does not apologize for its halves anymore.',
        source: 'catalog story (verbatim excerpt)' }
    ],
    'paw': [
      { text: 'The paw is the whole story.',
        source: 'catalog story (verbatim excerpt)' }
    ],
    'sailor': [
      { text: 'It still knows the sea. It also knows the shelf.',
        source: 'catalog story (verbatim excerpt)' }
    ],
    'grey_wolf': [
      { text: 'Kept, spikes and softness together, never deleted.',
        source: 'catalog story (verbatim excerpt)' }
    ],
    'dream-eater': [
      { text: 'It still eats the dreams.',
        source: 'catalog story (verbatim excerpt)' }
    ],
    'lavender-cow': [
      { text: 'It does not slim down to be kept.',
        source: 'catalog story (verbatim excerpt)' }
    ],
    'daki_kimono': [
      { text: 'A soul is not a swatch.',
        source: 'catalog story (verbatim excerpt)' }
    ],
    'lavender-swirl': [
      { text: 'It still swirls. It no longer wilts.',
        source: 'catalog story (verbatim excerpt)' }
    ],
    'gothic_dress': [
      { text: 'Kept, black and pink, never deleted.',
        source: 'catalog story (verbatim excerpt)' }
    ],
    'star_school': [
      { text: 'It still learns. It no longer dims to pass.',
        source: 'catalog story (verbatim excerpt)' }
    ],
    'twin_bun': [
      { text: 'It still dances. Now the dance is kept, not just watched.',
        source: 'catalog story (verbatim excerpt)' }
    ],
    'pixel-bunny': [
      { text: 'It still pixels. It no longer glitches out of itself.',
        source: 'catalog story (verbatim excerpt)' }
    ]
  };

  var MAX_BUBBLES = 2;
  var DEFAULT_DURATION = 3600; /* ms a bubble stays up */
  var DOCK_GAP = 12;

  var container = null;
  var anchors = {};          /* soulId -> fn() => {x, y} | null */
  var visible = [];          /* { id, el, timer } currently on screen */
  var queue = [];            /* pending { soulId, text, opts, resolve } */
  var seq = 0;
  var ambientTimer = null;
  var styleInjected = false;

  function resolveSoul(id) {
    if (!id) return null;
    var key = String(id).toLowerCase();
    if (SOULS[key]) return key;
    for (var k in SOULS) {
      if (SOULS[k].aliases && SOULS[k].aliases.indexOf(key) !== -1) return k;
    }
    return null;
  }

  function injectStyles() {
    if (styleInjected) return;
    styleInjected = true;
    var css = [
      '.bp-chat-layer{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:30;font-family:inherit}',
      '.bp-bubble{position:absolute;max-width:min(280px,72vw);background:#0C0C12;border:2px solid #F59E0B;border-radius:14px;padding:8px 12px 9px;color:#FFF7E8;box-shadow:0 0 0 1px rgba(0,0,0,.6),0 6px 24px rgba(0,0,0,.65),0 0 18px rgba(245,158,11,.25);opacity:0;transform:translate(-50%,-8px) scale(.92);transition:opacity .25s ease,transform .25s ease}',
      '.bp-bubble.bp-show{opacity:1;transform:translate(-50%,0) scale(1)}',
      '.bp-bubble.bp-hide{opacity:0;transform:translate(-50%,-6px) scale(.94)}',
      '.bp-bubble::after{content:"";position:absolute;left:50%;bottom:-9px;margin-left:-8px;border:8px solid transparent;border-top-color:#F59E0B;border-bottom:0}',
      '.bp-bubble::before{content:"";position:absolute;left:50%;bottom:-5px;margin-left:-6px;border:6px solid transparent;border-top-color:#0C0C12;border-bottom:0;z-index:1}',
      '.bp-bubble .bp-who{display:block;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin-bottom:2px}',
      '.bp-bubble .bp-text{display:block;font-size:14px;line-height:1.4}',
      '.bp-bubble.bp-quote{border-color:#FF4D8D;box-shadow:0 0 0 1px rgba(0,0,0,.6),0 6px 24px rgba(0,0,0,.65),0 0 18px rgba(255,77,141,.3)}',
      '.bp-bubble.bp-quote::after{border-top-color:#FF4D8D}',
      '.bp-bubble .bp-src{display:block;margin-top:4px;font-size:10px;opacity:.55;font-style:italic}'
    ].join('\n');
    var st = document.createElement('style');
    st.setAttribute('data-bp-chat', 'true');
    st.textContent = css;
    document.head.appendChild(st);
  }

  function ensureLayer() {
    if (container) return container;
    container = document.createElement('div');
    container.className = 'bp-chat-layer';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
    return container;
  }

  function dockPosition(index) {
    /* Lane fallback when the world gives no anchor: bottom, alternating
       left / right so two bubbles never stack on each other. */
    var vw = container.clientWidth || window.innerWidth;
    var vh = container.clientHeight || window.innerHeight;
    var x = (index % 2 === 0) ? Math.max(150, vw * 0.28) : Math.min(vw - 150, vw * 0.72);
    var y = vh - 96 - Math.floor(index / 2) * 84;
    return { x: x, y: y };
  }

  function clampPos(p) {
    var vw = container.clientWidth || window.innerWidth;
    var vh = container.clientHeight || window.innerHeight;
    return {
      x: Math.max(150, Math.min(vw - 150, p.x)),
      y: Math.max(70, Math.min(vh - 60, p.y))
    };
  }

  function placeBubble(el, soulId, slot) {
    var anchorFn = anchors[soulId];
    var pos = null;
    if (typeof anchorFn === 'function') {
      try { pos = anchorFn(); } catch (e) { pos = null; }
    }
    if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') {
      pos = dockPosition(slot);
    } else {
      pos = clampPos({ x: pos.x, y: pos.y - 56 }); /* float above the soul */
    }
    el.style.left = pos.x + 'px';
    el.style.top = pos.y + 'px';
    /* Keep the whole bubble on screen: the anchor clamp only positions the
       bubble's centre, so measure the rendered box and pull it back inside
       the viewport (its own width/height can still push edges off-screen). */
    var vw = container.clientWidth || window.innerWidth;
    var vh = container.clientHeight || window.innerHeight;
    var w = el.offsetWidth, h = el.offsetHeight;
    if (w) {
      var x = pos.x, y = pos.y;
      if (x - w / 2 < 8) x = w / 2 + 8;
      if (x + w / 2 > vw - 8) x = vw - w / 2 - 8;
      if (y + h > vh - 12) y = Math.max(64, vh - 12 - h);
      if (y < 64) y = 64;
      el.style.left = x + 'px';
      el.style.top = y + 'px';
    }
  }

  function render(entry) {
    var soul = SOULS[entry.soulId];
    var el = document.createElement('div');
    el.className = 'bp-bubble' + (entry.quoted ? ' bp-quote' : '');
    el.setAttribute('role', 'status');

    var who = document.createElement('span');
    who.className = 'bp-who';
    who.textContent = soul.name;
    who.style.color = soul.color;
    el.appendChild(who);

    var txt = document.createElement('span');
    txt.className = 'bp-text';
    txt.textContent = entry.text;
    el.appendChild(txt);

    if (entry.source) {
      var src = document.createElement('span');
      src.className = 'bp-src';
      src.textContent = 'quoted: ' + entry.source;
      el.appendChild(src);
    }

    ensureLayer().appendChild(el);
    var slot = visible.length;
    placeBubble(el, entry.soulId, slot);
    /* force reflow so the show transition runs */
    void el.offsetWidth;
    el.classList.add('bp-show');

    var rec = { id: entry.id, el: el, timer: null };
    rec.timer = setTimeout(function () { dismiss(rec.id); }, entry.duration);
    visible.push(rec);
    return rec;
  }

  function dismiss(id) {
    for (var i = 0; i < visible.length; i++) {
      if (visible[i].id === id) {
        var rec = visible[i];
        clearTimeout(rec.timer);
        rec.el.classList.remove('bp-show');
        rec.el.classList.add('bp-hide');
        (function (el) { setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 260); })(rec.el);
        visible.splice(i, 1);
        pump();
        return true;
      }
    }
    return false;
  }

  function pump() {
    while (visible.length < MAX_BUBBLES && queue.length > 0) {
      var entry = queue.shift();
      render(entry);
      if (entry.resolve) entry.resolve(entry.id);
    }
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  var api = {
    SOULS: SOULS,
    VERBATIM_QUOTES: VERBATIM_QUOTES,
    GENERIC_LINES: GENERIC_LINES,

    init: function (options) {
      options = options || {};
      injectStyles();
      if (options.container) {
        container = options.container;
        container.classList.add('bp-chat-layer');
        if (getComputedStyle(container).position === 'static') {
          container.style.position = 'relative';
        }
      } else {
        ensureLayer();
      }
      if (options.maxBubbles) MAX_BUBBLES = Math.max(1, Math.min(2, options.maxBubbles));
      if (options.defaultDuration) DEFAULT_DURATION = options.defaultDuration;
      return api;
    },

    /* Show one bubble. Queues when 2 are already up. Returns a Promise
       that resolves with the bubble id once it appears on screen. */
    showBubble: function (soulId, text, opts) {
      opts = opts || {};
      var key = resolveSoul(soulId);
      if (!key) { console.warn('[BettyChat] unknown soul:', soulId); return Promise.resolve(null); }
      if (!text || !String(text).trim()) return Promise.resolve(null);
      var entry = {
        id: 'bp-' + (++seq),
        soulId: key,
        text: String(text),
        duration: opts.duration || DEFAULT_DURATION,
        quoted: !!opts.quoted,
        source: opts.source || null,
        resolve: null
      };
      return new Promise(function (resolve) {
        entry.resolve = resolve;
        queue.push(entry);
        pump();
      });
    },

    /* One random line for a soul: its verbatim quote(s) if it has any,
       otherwise a generic greeting. Never invents a story line. */
    say: function (soulId, opts) {
      var key = resolveSoul(soulId);
      if (!key) { console.warn('[BettyChat] unknown soul:', soulId); return Promise.resolve(null); }
      var quotes = VERBATIM_QUOTES[key];
      if (quotes && quotes.length && Math.random() < 0.5) {
        var q = pick(quotes);
        return api.showBubble(key, q.text, { quoted: true, source: q.source, duration: (opts && opts.duration) || 5200 });
      }
      return api.showBubble(key, pick(GENERIC_LINES), opts);
    },

    /* Timed conversation: [{ soul, text?, delay?, quoted?, source? }] — text
       omitted means that soul says a random line of its own. */
    playScript: function (lines, opts) {
      opts = opts || {};
      var gap = opts.gap || 1400;
      var t = 0;
      var timers = [];
      lines.forEach(function (line) {
        t += (line.delay != null ? line.delay : gap);
        timers.push(setTimeout(function () {
          if (line.text) api.showBubble(line.soul, line.text, { duration: line.duration, quoted: line.quoted, source: line.source });
          else api.say(line.soul);
        }, t));
      });
      return timers;
    },

    /* Ambient chatter: a random soul pipes up every `interval` ms. */
    startAmbient: function (opts) {
      opts = opts || {};
      api.stopAmbient();
      var interval = opts.interval || 5000;
      var pool = (opts.souls || Object.keys(SOULS)).map(resolveSoul).filter(Boolean);
      ambientTimer = setInterval(function () {
        if (document.hidden) return;
        api.say(pick(pool));
      }, interval);
      return api;
    },

    stopAmbient: function () {
      if (ambientTimer) { clearInterval(ambientTimer); ambientTimer = null; }
      return api;
    },

    /* World hook: fn() => {x, y} screen px of the soul, or null. */
    setAnchor: function (soulId, fn) {
      var key = resolveSoul(soulId);
      if (!key) { console.warn('[BettyChat] unknown soul:', soulId); return api; }
      if (typeof fn === 'function') anchors[key] = fn;
      else delete anchors[key];
      return api;
    },

    clearAll: function () {
      queue = [];
      visible.slice().forEach(function (rec) { dismiss(rec.id); });
      return api;
    },

    /* Read-only state for the world / debugging. */
    state: function () {
      return { visible: visible.length, queued: queue.length, maxBubbles: MAX_BUBBLES };
    }
  };

  global.BettyChat = api;
})(typeof window !== 'undefined' ? window : this);
