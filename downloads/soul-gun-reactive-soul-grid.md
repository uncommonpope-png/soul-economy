# soul-gun-reactive-soul-grid

**Author:** profit-prime · **Type:** skill · **PLT:** 0.8 / 0.7 / 0.6
**Target:** static single-file `index.html` (GitHub Pages, no build, no npm)

---

## SIDE A — THEOLOGY

### A0. The One-Roof Doctrine
Every upgrade ships as an *additive script* onto the existing page. Never rebuild. Never rip out
the user's content to reach a prettier grid. The content is the cathedral; the UI is the light
that fills it.

### A1. Content Is Alive, Therefore Never Hidden
- All of a soul's truth — description, manifest, contents, requirements, install, tags, updated —
  renders **inline, always visible**. No hover-reveal, no "▼ Details" collapse, no flip-to-see-more.
- Cards **grow to fit** their content. A card that hides text is a tombstone, not a soul.
- Flip cards (a temptation) fail the doctrine: the buttons disappear the second a finger approaches.
  Kill the flip; keep its *design language* (pink chips, purple tags, gradient accents) as
  always-visible styling.

### A2. One Writer Per Property (the anti-shake covenant)
Two scripts writing `style.transform` on the same node = jitter = a soul with epilepsy.
- Exactly one rAF-driven loop owns card transforms.
- Handlers only set *targets* (`tx`, `ty`); the loop eases the *current* value toward the target
  (`cur += (target - cur) * 0.10`) — cards roll toward the cursor like a carnivorous flower
  tracking a bug, then settle back to flat, no snapping, no shaking.

### A3. The Graph Is a Cathedral Floor
The knowledge graph is sacred and complete. All upgrades around it are **read-only overlays**:
- expose ONE hook (`window.__soulGraph`), then never edit the scene-building code.
- fog, post-pipeline, star drift, and the matrix floor are attached to the *same scene/camera* via
  the hook — they render inside the graph's own loop but touch nothing in it.
- wrap `renderer.render` with a recursion guard instead of rewriting the loop.

### A4. No-Build Discipline
CDN + importmap only. `three` via jsdelivr importmap, addons via `three/addons/`, Fuse for search.
No webpack, no vite, no `npm install`. Every trick must survive a hard refresh on GitHub Pages.

---

## SIDE B — BODY

### B1. Always-Visible Manifest (the longer card)
Card template — replace collapsed details with the full truth:

```js
const tags = (item.tags || []).map(t =>
  `<span style="font-size:0.6rem;padding:2px 8px;border-radius:20px;
     background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.1);color:#8B5CF6">${t}</span>`).join(' ');
// ...card body...
`<div class="card-extra">✦ full manifest</div>
 <div class="card-details">
   <div class="detail-row"><strong>What you get:</strong><span>${item.details || item.desc}</span></div>
   ${item.contents ? `<div class="detail-row"><strong>Contents:</strong><ul>${item.contents.map(c=>`<li>${c}</li>`).join('')}</ul></div>` : ''}
   ${item.requirements ? `<div class="detail-row"><strong>Requirements:</strong><span>${item.requirements}</span></div>` : ''}
   ${item.install ? `<div class="detail-row"><strong>Install:</strong><pre>${item.install}</pre></div>` : ''}
   <div class="detail-row"><strong>Author:</strong><span>${item.author||'profit-prime'}</span> · <strong>License:</strong><span>${item.license||'MIT'}</span> · <strong>Tags:</strong><span>${(item.tags||[]).join(', ')}</span></div>
   ${item.updated ? `<div class="detail-row"><strong>Updated:</strong><span>${item.updated}</span></div>` : ''}
 </div>`
```

CSS — never cap the height the user's truth needs:

```css
.card-details{overflow:visible;max-height:none;opacity:1;padding:12px 4px 4px;margin-top:8px;
  border-top:1px dashed rgba(255,105,180,0.15)}
.card-extra{display:flex;align-items:center;gap:8px;margin:14px 0 4px;font-size:0.62rem;
  text-transform:uppercase;letter-spacing:0.12em;color:#A855F7}
.card-extra::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(255,105,180,0.28),transparent)}
.card-plt span{box-shadow:0 0 14px rgba(255,105,180,0.10);border:1px solid rgba(255,255,255,0.05)}
.card-plt span:hover{box-shadow:0 0 22px rgba(255,105,180,0.32)}
```

### B2. Flower-Tracking Tilt (the anti-shake tilt loop)

```js
const tiltStates = new Map();                 // card -> {tx,ty,cx,cy,spin}
function applyTilt(c, s){
  if (Math.abs(s.cx) + Math.abs(s.cy) < 0.05) { c.style.transform=''; c.style.zIndex=''; return; }
  c.style.zIndex='20';
  c.style.transform=`perspective(1000px) rotateY(${s.cx.toFixed(2)}deg) rotateX(${s.cy.toFixed(2)}deg) translateY(-6px) scale(1.02)`;
}
(function tiltLoop(){
  requestAnimationFrame(tiltLoop);
  tiltStates.forEach((s,c)=>{
    if (s.spin){ tiltStates.delete(c); return; }
    s.cx += (s.tx - s.cx) * 0.10;             // ease — the flower moves, never jumps
    s.cy += (s.ty - s.cy) * 0.10;
    if (Math.abs(s.tx)<0.01 && Math.abs(s.cx)<0.08 && Math.abs(s.cy)<0.08){ tiltStates.delete(c); applyTilt(c,s); return; }
    applyTilt(c,s);
  });
})();
grid.addEventListener('mousemove', e => {
  const card = e.target.closest && e.target.closest('.card'); if (!card) return;
  const r = card.getBoundingClientRect();
  const px = (e.clientX - r.left)/r.width - 0.5, py = (e.clientY - r.top)/r.height - 0.5;
  card._px = px; card._py = py;
  if (spinning === card) return;
  let s = tiltStates.get(card);
  if (!s){ s = {tx:0,ty:0,cx:0,cy:0,spin:false}; tiltStates.set(card,s); }
  s.tx = px*16; s.ty = -py*16;               // only write TARGETS here
});
grid.addEventListener('mouseleave', () => tiltStates.forEach((s,c)=>{ s.tx=0; s.ty=0; }));
```

Rule: the OLD per-card `card.addEventListener('mousemove', …)` direct-write tilt MUST be deleted or
it becomes a second writer and the shake returns.

### B3. Pink 360° Spin (click + download)

`requestAnimationFrame` over ~950ms, easeOutBack for a springy full turn, glow in pink while
turning, never touching CSS `animation` (so the entrance animation can't eat it):

```js
function spinOnce(card){
  if (spinning === card) return;
  const ts = tiltStates.get(card); if (ts){ ts.spin = true; ts.tx = ts.ty = 0; }
  const py = card._py || 0;
  card.classList.add('card-glowing'); card.style.zIndex='50'; spinning = card;
  const start = performance.now(), dur = 950;
  (function frame(now){
    const t = Math.min(1, (now-start)/dur);
    const c1=1.70158, c3=c1+1, ease = 1 + c3*Math.pow(t-1,3) + c1*Math.pow(t-1,2);
    card.style.transform = `perspective(1000px) rotateX(${(-py*16).toFixed(1)}deg) rotateY(${(360*ease).toFixed(1)}deg) translateY(${(-8*ease).toFixed(1)}px) scale(1.04)`;
    if (t < 1) requestAnimationFrame(frame);
    else { card.classList.remove('card-glowing'); card.style.transform=''; card.style.zIndex=''; spinning=null; }
  })(start);
}
```

Wire it via delegation so it survives re-renders:
`click` on `.btn-download, .btn-play` → spin; bare card click → spin; clicks on `.card-details`/
`.meta-tag` never spin.

### B4. Release the Entrance Fill
The entrance animation `cardIn … both` keeps overriding inline transforms forever:

```js
grid.addEventListener('animationend', e => {
  if (e.animationName === 'cardIn') e.target.classList.remove('card-entrance');
});
```

### B5. Read-Only Graph Hook + Overlays
One line inside the graph closure, nothing else edited:

```js
window.__soulGraph = { scene, camera, renderer, root, items, nodeData };
```

Fog + bloom + FXAA in an overlay module (`<script type="module">`, addons via importmap):

```js
const g = window.__soulGraph; if (!g) return;
const T = await import('three');
const { EffectComposer } = await import('three/addons/postprocessing/EffectComposer.js');
const { RenderPass }    = await import('three/addons/postprocessing/RenderPass.js');
const { UnrealBloomPass } = await import('three/addons/postprocessing/UnrealBloomPass.js');
const { ShaderPass }    = await import('three/addons/postprocessing/ShaderPass.js');
const { FXAAShader }    = await import('three/addons/shaders/FXAAShader.js');

g.scene.fog = new T.FogExp2(0x080808, 0.05);

const composer = new EffectComposer(g.renderer);
composer.addPass(new RenderPass(g.scene, g.camera));
composer.addPass(new UnrealBloomPass(new T.Vector2(innerWidth, innerHeight), 0.45, 0.6, 0.8));
const fxaa = new ShaderPass(FXAAShader);
fxaa.uniforms['resolution'].value.set(1/innerWidth, 1/innerHeight);
composer.addPass(fxaa);

let composing = false;
const rawRender = g.renderer.render.bind(g.renderer);
g.renderer.render = function(){                  // recursion guard — inner passes ride rawRender
  if (composing) return rawRender.apply(this, arguments);
  composing = true; composer.render(); composing = false;
};
```

### B6. Matrix Code-Rain Floor (real soul names + PLT)
Canvas floor, not a shader — deterministic, can never kill the pipeline:

```js
const floorCanvas = document.createElement('canvas'); floorCanvas.width=768; floorCanvas.height=384;
const t = new T.CanvasTexture(floorCanvas); t.magFilter = t.minFilter = T.NearestFilter;
const floor = new T.Mesh(new T.PlaneGeometry(30,20),
  new T.MeshBasicMaterial({ map:t, transparent:true, opacity:0.3, blending:T.AdditiveBlending, depthWrite:false }));
floor.rotation.x = -Math.PI/2; floor.position.set(0,-2.6,0); g.scene.add(floor);
// glyphStr = real chars from item.name + item.plt + "PLT/0123456789."
// drawFloor(): per-column drops, cyan tail fading, pink head, grid lines; floorTex.needsUpdate=true
// drift loop: 8 Sprite pool, canvas "✦ {name}  ·  PLT {x/y/z}", z -= speed*dt, recycle
```

### B7. Search
Fuse v7 loaded once; bolted to the existing input:

```js
let fuse = new Fuse(items, { keys:['name','type','desc'], threshold:0.35, includeScore:true });
// on input:  const fuzzy = fuse.search(q).map(r => r.item);
```

---

## VERIFICATION (before you ever push)
1. `python validate2.py` → HTML structure valid + catalog count correct.
2. Extract every inline `<script>` body → `node --check` each (the JSON-LD block is the only
   allowed failure).
3. Hard refresh in the browser; sweep the cursor — no shake; click a card — pink spin; hover the
   graph — bloom; look down — the souls drip.