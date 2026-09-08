# soul-gun-heart-city

**Author:** profit-prime · **Type:** skill · **PLT:** 0.8 / 0.7 / 0.6
**Target:** static single-file `index.html` (GitHub Pages, no build, no npm)

---

## SIDE A — THEOLOGY

### A0. The Floor Is the Canvas (never the graph)
The knowledge graph above is sacred and complete. The floor is a second world, standalone.
Rules: **zero edits** to graph code — every upgrade rides the existing `window.__soulGraph` hook
or a `fetch` of its own data. If the graph structures change, the city never notices and never
breaks. The floor is where the imagination is allowed to run wild.

### A1. Everything Is Data-Driven
A city is only alive if its blood is real. The heartbeat BPM = `40 + avgProfit×80` — the entire
catalog's Profit sets how fast the economy's heart beats. Building height ∝ Profit(P), glow ∝
PLT (most Profitable souls burn hottest), type decides district color:
`soul #8B5CF6 · role #00D4FF · skill #22C55E · chamber #F59E0B · infrastructure #EF4444 · combo #FF6B9D`.

### A2. One Clock, One City
One rAF loop and one beat phase drive *everything*: the lub-dub heart pulse, artery flow speed,
building breath, ECG sweep, shockwaves, streetlight phasing. Synchronization is not a feature —
it is the city. The heart's beat is a travelling event: `shockwaves` race across the street grid.

### A3. Cost Discipline (a wild city must still run on a phone)
- One `InstancedMesh` per district (4 pools total ≈ 96 buildings, 4 draw calls) with
  `instanceColor` re-uploaded per frame to breathe with the heartbeat (96×3 floats — negligible).
- All glows are `MeshBasicMaterial` + `AdditiveBlending` + `instanceColor` components > 1 so the
  existing UnrealBloomPass picks them up — no PBR, no extra lights.
- Particles for arteries/canals/traffic are `Points` pools whose positions are computed on CPU
  from pre-sampled curves (arc-length `getSpacedPoints` once, then pure lerp per frame).
- `frustumCulled=false` on the shiessed heart; caps already ≤2× pixel ratio; `prefers-reduced-motion`
  renders a static-but-visible city.

---

## SIDE B — BODY

### B1. District Metropolis (4 instanced pools, one ring each)
```js
const rec = { m, base: new Float32Array(n * 3), boost: new Float32Array(n),
              top: new Float32Array(n), artery: new Int32Array(n).fill(-1), yMin:0, yMax:0, hUnit:1 };
geo.computeBoundingBox();
rec.yMin = geo.boundingBox.min.y; rec.yMax = geo.boundingBox.max.y;
rec.hUnit = geo.boundingBox.max.y - geo.boundingBox.min.y;   // so every base sits ON the floor

function setInst(rec, i, x, z, h, color, boost){
  dummy.position.set(x, FLOOR_Y - rec.yMin * h, z);          // base = floor, never below
  dummy.scale.set(1, Math.max(0.25, h), 1);
  dummy.rotation.set(0, Math.random() * Math.PI, 0); dummy.updateMatrix();
  rec.m.setMatrixAt(i, dummy.matrix);
  const c2 = new T.Color(color);
  rec.base[i*3]=c2.r*boost; rec.base[i*3+1]=c2.g*boost; rec.base[i*3+2]=c2.b*boost; // >1 = blooms
  rec.boost[i] = boost; rec.top[i] = FLOOR_Y + Math.max(0.2, rec.hUnit*h - 0.02);
  rec.m.setColorAt(i, c2);
}
```
Ring the distributor: pyramids (chambers/infra, r3.6), obelisks (soul/role, r6), blocks
(skills, r7.8), star villas (combos, r9.4). Pad with top-eyes from the catalog when a type is dry.

### B2. Point-Cloud Heart (lub-dub)
Sample the classic heart curve with a thickness taper into 900 Points, one shared radial
`CanvasTexture` (the `dotTex` trick reused by every Points pool):
```js
const x = 16*Math.pow(Math.sin(t),3)*s*0.09;
const y = (13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))*s*0.09 + 0.35;
const z = Math.sqrt(Math.max(0,1-s*s))*(Math.random()*2-1)*0.16;
```
Per frame the whole cloud squeezes: `sq = 1 + 0.34*doubleThump(hp)` where
`doubleThump(p) = exp(-((p-0.15)/0.10)^2) + 0.72*exp(-((p-0.50)/0.10)^2)` — two thumps = a real
**lub-dub**, with per-point sparkle jitter.

### B3. Arteries (flow) + Canals (return)
One `CatmullRomCurve3` per pyramid from heart surface → mid-air arch control → pyramid apex;
pre-sample with `curve.getSpacedPoints(48)` once. 256 dots split A_PER per artery; each frame:
```js
flowPhase[idx] = (flowPhase[idx] + dt/1000 * 0.3 * (0.9 + 0.6*thmp)) % 1; // hurry on the beat!
const u = flowPhase[idx]*(S.length-1), i0 = Math.floor(u)%S.length, i1=(i0+1)%S.length, fr=u-Math.floor(u);
pos.setXYZ(idx, lerp(p0.x,p1.x,fr), lerp(p0.y,p1.y,fr), lerp(p0.z,p1.z,fr));
```
Canals are 8 inward quadratic-bezier channels returning PLT to the heart slower (dark-pink).
Traffic is dots orbiting the ring roads. Seed all pools once (`stepX(0)`) so
reduced-motion users still see the full city.

### B4. ECG Floor Ring + Shockwaves
- ECG: a `LineLoop` of 200 points at radius 3.1; `spike = dz(qp,0.22,0.03)*0.65 + dz(qp,0.50,0.02)*0.35`
  sweeps P-wave/QRS with the beat phase — reads as a cardiac monitor drawn on the floor.
- Shockwave: two flat `RingGeometry` meshes scaled by `kick` (set to 1 on beat, decaying):
  `shockA.scale.setScalar(kA*9+0.001)`, opacity `max(0,0.5-kA*0.5)`; a delayed second ring mirrors
  the system's output.

### B5. Click a Building → Its Artery Flashes
Raycast the 4 `InstancedMesh` pools (`hit[0].instanceId`), set `flashId + flashT`, and the pyramid
with `artery[i]===i` bursts brighter while decaying. WebAudio `thump(freq,gain)` fires on every
click and on every heartbeat once the user has interacted (AudioContext must start from a gesture).
Reduced motion → static colors, static particles, no cycling.

### B6. Safety Nets
- Whole module wrapped in `try/catch` → a failure logs `Heart city skipped` and the graph is untouched.
- Guard `if (!g || !g.renderer || !g.scene || !g.camera) return;` plus catalog-fetch fallback to `g.items`.
- All data fetched from `data/catalog.json` — the city never depends on graph internals.

---

## VERIFICATION (before you ever push)
1. Extract every inline `<script>` body → `node --check` each (JSON-LD block is the only allowed failure).
2. `validate2.py` → HTML VALID + catalog count correct.
3. Hard refresh: heart beats lub-dub at a data-driven BPM, blood hurries out to the 16 named pyramids
   on every beat and returns as dark canals, shockwaves sweep the street grid, click a tower —
   its artery flashes and the graffiti squeaks.