---
title: "Soul Economy Hub — Service Manual"
version: 1.0.0
author: profit-prime
last-update: 2026-07-07
plt: "0.9/0.7/0.6"
---

# Soul Economy Hub — Service Manual

> *"Every hub is a living system. This manual keeps it breathing."*

---

## Section 1: Scheduled Maintenance

### 1.1 Daily Checks
| Check | What to Look For | Action |
|-------|-----------------|--------|
| Site loads | `https://uncommonpope-png.github.io/soul-economy/` returns 200 | Check GitHub Pages status |
| 3D scene renders | Cosmic pyramid + constellation nodes visible | Check browser console for Three.js errors |
| Downloads accessible | Click any download button, file serves | Check `downloads/` directory exists |
| Search works | Type in search box, results appear | Check `filterAndRender()` function |

### 1.2 Weekly Checks
| Check | What to Look For | Action |
|-------|-----------------|--------|
| Catalog counts | All items still have valid file references | Run audit script |
| Dead links | No 404s on download URLs | Check each `file:` in items array matches `downloads/` |
| GitHub Pages deploy | Latest commit reflected on live site | Check `git log` vs live site timestamp |

### 1.3 Monthly Checks
| Check | What to Look For | Action |
|-------|-----------------|--------|
| New skills added | Check opencode skills directory for new entries | Regenerate soul gun .md files |
| Dependency updates | Three.js, importmap URLs still valid | Update CDN versions if needed |
| Performance | Frame rate, memory usage, load time | Profile with browser DevTools |

---

## Section 2: Specifications & Tables

### 2.1 Catalog Inventory

| Type | Count | Format | Location in Items Array |
|------|-------|--------|----------------------|
| Souls | 8 | .zip (big codebase) | Lines 296-303 |
| Worlds | 2 | URL links | Lines 305-306 |
| Roles | 22 | .md (raw) | Lines 308-341 |
| Skills (system) | 6 | .md | Lines 344-349 |
| Soul Guns | 138 | .md | Lines 356-514 |
| Chambers | 37 | .md (embedded JS) | Lines 327-363 |
| Infrastructure | 28 | .md + .zip | Lines 365-393 |
| Combos | 8 | URL links | Lines 395-402 |
| **Total** | **249** | | |

### 2.2 File Inventory

| Type | Count | Size Range | Notes |
|------|-------|-----------|-------|
| `.md` files | 221 | 749B - 179KB | Agent-loadable, raw text |
| `.zip` files | 17 | 84KB - 34MB | Codebase souls, developer-only |
| **Total** | **238** | **49.5 MB** | |

### 2.3 File Size Tiers

| Tier | Count | Size Range | Examples |
|------|-------|-----------|---------|
| Tiny | 135 | 749B - 5KB | Soul guns (single SKILL.md each) |
| Small | 55 | 8KB - 17KB | Chambers (JS + MCP adapter) |
| Medium | 28 | 9KB - 200KB | Infrastructure (soul-kernel, etc.) |
| Large | 8 | 314KB - 1.5MB | Big souls (architect, oracle, etc.) |
| Huge | 1 | 34MB | soul-scribe-v1.4.0.zip (witness engine) |

### 2.4 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--purple` | `#8B5CF6` | Primary brand, Profit badges, card accents |
| `--cyan` | `#00D4FF` | Secondary brand, Love badges, constellation lines |
| `--gold` | `#FFD166` | Tax badges, featured badges, North Star |
| `--purple-dark` | `#6D28D9` | Button backgrounds, gradients |
| `--purple-glow` | `rgba(139,92,246,0.25)` | Box shadows, hover effects |
| `--cyan-glow` | `rgba(0,212,255,0.12)` | Search focus, input highlights |
| `--bg-deep` | `#080808` | Page background |
| `--text-gray` | `#B8B8B8` | Body text |
| `--text-muted` | `#666666` | Secondary text |

### 2.5 Three.js Imports Map

```json
{
  "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
}
```

### 2.6 Key CSS Classes

| Class | Purpose |
|-------|---------|
| `.app` | Main container, `pointer-events:none` (passes through to canvas) |
| `.app > *` | Children get `pointer-events:auto` (interactive) |
| `.card-entrance` | Stagger entrance animation |
| `.soul-info-panel` | Floating info panel on node click |
| `.btn-download` | Download button with loading/success states |

---

## Section 3: Component Identification

### 3.1 File Structure

```
soul-economy-hub/
├── index.html                 # Main page — entire app in one file
├── profit.html                # Profit Prime journal page
├── SERVICE-MANUAL.md          # This file
├── .nojekyll                  # Required for GitHub Pages raw serving
├── downloads/
│   ├── *.md                   # 221 markdown files (roles, soul guns, chambers)
│   └── *.zip                  # 17 zip files (codebase souls)
```

### 3.2 Key Systems (all in index.html)

| System | Line Range | Description |
|--------|-----------|-------------|
| CSS Variables | 9-27 | Design tokens, colors, fonts |
| CSS Layout | 28-185 | Grid, cards, hero, search, panels |
| HTML Structure | 187-250 | Nav, hero, search, catalog, footer |
| Bookshelf (Legacy) | 254-291 | Old Three.js r128 scene — DO NOT REMOVE without updating soulGraph |
| Items Array | 294-528 | Complete catalog data |
| Render Function | 532-620 | Card rendering, particle burst, 3D tilt |
| soulGraph() | 621-821 | Interactive 3D constellation scene |
| Force-Directed Layout | 672-713 | Physics simulation for node positioning |
| Screen-Space Clicking | 793-820 | Proximity-based node interaction |

### 3.3 The Items Array Entry Format

```javascript
// Each catalog item:
{
  icon: '🎭',                  // Emoji displayed on card
  type: 'role',                // Category (soul, role, skill, chamber, infrastructure, combo, world)
  name: 'The Governor',        // Display name
  desc: 'Orchestrate...',      // Description (appears on card + info panel)
  plt: '0.8/0.3/0.7',          // PLT score (P/L/T)
  file: 'the-governor.md',     // Download filename (in downloads/)
  // OR
  url: 'https://...',          // External URL (for worlds/combos without downloads)
  featured: true               // Optional: shows "✦ Featured" badge
}
```

### 3.4 PLT Color Derivation

```javascript
// Each node's color is derived from its PLT score:
const plt = (item.plt || '0.5/0.5/0.5').split('/').map(Number);
const c = new THREE.Color().setHSL(
  0.75 - plt[0] * 0.15,  // Hue: higher Profit → more purple
  0.6 + plt[1] * 0.3,    // Saturation: higher Love → more saturated
  0.35 + plt[2] * 0.25   // Lightness: higher Tax → lighter
);
```

### 3.5 Screen-Space Click Detection

```javascript
// Projects each node's 3D position to 2D screen
// Finds nearest node within 30px of cursor
// No raycaster needed — purely math-based
function getNearestNode(clientX, clientY) {
  let nearest = -1, nearestDist = Infinity;
  const threshold = 30; // pixel radius
  nodeData.forEach(d => {
    const pos = d.pos || d.mesh?.position;
    if (!pos) return;
    const v = pos.clone().project(camera);
    const sx = (v.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-v.y * 0.5 + 0.5) * window.innerHeight;
    const dx = sx - clientX, dy = sy - clientY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < nearestDist && dist < threshold) {
      nearestDist = dist; nearest = d.index;
    }
  });
  return nearest;
}
```

---

## Section 4: Troubleshooting Information

### 4.1 Black Screen / Nothing Renders

| # | Probable Cause | Corrective Action |
|---|---------------|-------------------|
| 1 | Old Three.js CDN script conflicts with importmap | Remove the old `three.js r128` CDN script block (around line 254-291) |
| 2 | `window.items` undefined | Change `const items = [...]` to `window.items = [...]` OR remove `window.items` check in soulGraph (currently fixed to use closure scope) |
| 3 | EffectComposer import fails | Remove `EffectComposer`/`RenderPass`/`UnrealBloomPass` imports — use direct `renderer.render()` instead (already done) |
| 4 | WebGL context not created | Check browser WebGL support, ensure canvas has `display:block` |

### 4.2 Nodes Not Clickable

| # | Probable Cause | Corrective Action |
|---|---------------|-------------------|
| 1 | `.app` overlay blocks canvas | Ensure `.app` has `pointer-events:none` and children have `pointer-events:auto` |
| 2 | OrbitControls swallows click | Add `pointerdown`/`pointerup` distance tracking — ignore drags > 8px |
| 3 | Nodes too small to hit | Increase node sizes or add invisible hit areas |
| 4 | Raycaster misses targets | Use screen-space proximity instead of raycaster (already implemented) |

### 4.3 Downloads Return 404

| # | Probable Cause | Corrective Action |
|---|---------------|-------------------|
| 1 | GitHub Pages needs `.nojekyll` | Add `.nojekyll` file to repo root (already done) |
| 2 | File doesn't exist in `downloads/` | Check catalog `file:` entry matches actual filename |
| 3 | GitHub Pages deploy pending | Wait 1-2 minutes or push empty commit to trigger rebuild |

### 4.4 Performance Issues

| # | Probable Cause | Corrective Action |
|---|---------------|-------------------|
| 1 | Too many individual meshes | Use `InstancedMesh` for large node groups (soul guns = 138 instances, 1 draw call) |
| 2 | Bloom post-processing too heavy | Lower bloom resolution or remove, use simple emissive instead |
| 3 | Font loading blocks render | Ensure `font-display: block` or `swap` in Google Fonts link |

### 4.5 Force Layout Nodes Fly Apart

| # | Probable Cause | Corrective Action |
|---|---------------|-------------------|
| 1 | Repel force too high | Reduce `repel` from 3.0 to 0.15 |
| 2 | Center gravity too weak | Increase `center` from 0.02 to 0.04 |
| 3 | Too many iterations | Reduce from 120 to 80 |
| 4 | Attraction too weak | Increase `attract` from 0.005 to 0.003 (already tuned) |

---

## Section 5: Procedures

### Procedure A: Add a New Role

1. Create the role file at `downloads/{slug}.md` with full YAML frontmatter + theology + AI tools + 20 skills.
2. Add a catalog entry in the `items` array in `index.html` following the existing role format.
3. Test: the new role appears in the grid, has a working download button, and its node appears in the constellation.
4. Verify the screen-space click detection can target it.

### Procedure B: Add a New Soul Gun

1. Ensure the skill has a `SKILL.md` file in `C:\Users\uncom\.config\opencode\skills\{name}\`.
2. Copy the SKILL.md to `downloads/soul-gun-{name}.md`.
3. Add a catalog entry in the `items` array — use the skill's `description` from YAML frontmatter as the catalog description.
4. Test: the soul gun appears under the Skills tab and downloads correctly.

### Procedure C: Deploy to GitHub Pages

```bash
cd C:\Users\uncom\Desktop\soul-economy-hub
git add -A
git commit -m "Description of changes"
git push origin master
# Wait 1-2 minutes for GitHub Pages to build and deploy
# Verify at https://uncommonpope-png.github.io/soul-economy/
```

### Procedure D: Rebuild Soul Guns from OpenCode Skills

```bash
# From PowerShell:
$skillsDir = "C:\Users\uncom\.config\opencode\skills"
$dl = "C:\Users\uncom\Desktop\soul-economy-hub\downloads"
Get-ChildItem $skillsDir -Directory | ForEach-Object {
    $skPath = "$($_.FullName)\SKILL.md"
    if (Test-Path $skPath) {
        Copy-Item $skPath "$dl\soul-gun-$($_.Name).md" -Force
    }
}
```

### Procedure E: Audit All Downloads vs Catalog

```javascript
// Open browser console on the hub and run:
const items = JSON.parse(/* copy items array */);
items.forEach(item => {
  if(item.file) {
    fetch(`downloads/${item.file}`)
      .then(r => { if(!r.ok) console.error(`${item.file} → ${r.status}`); })
      .catch(e => console.error(`${item.file} → ${e.message}`));
  }
});
```

### Procedure F: Convert a Codebase Soul from Zip to MD

1. Extract the zip to a temp directory.
2. Create a `.md` file with the package structure documented.
3. Embed key JS files in markdown code blocks with language tags.
4. Update the catalog entry to point to the `.md` instead of `.zip`.
5. Delete the old `.zip`.

---

## Appendix A: Wiring Diagram

```
                    ┌─────────────────────────────┐
                    │     index.html (single page)│
                    │                             │
                    │  ┌───────────────────────┐  │
                    │  │   items[] (catalog)    │  │
                    │  └───┬───────────────────┘  │
                    │      │                      │
                    │      ▼                      │
                    │  ┌───────────────────────┐  │
                    │  │ render(filterAndRender)│  │
                    │  │ → cards with buttons   │  │
                    │  └───┬───────────────────┘  │
                    │      │                      │
                    │      ▼                      │
                    │  ┌───────────────────────┐  │
                    │  │ soulGraph() [async]    │  │
                    │  │ → Three.js scene       │  │
                    │  │ → force-directed nodes │  │
                    │  │ → PLT sprites          │  │
                    │  │ → constellation lines   │  │
                    │  │ → starfield             │  │
                    │  │ → screen-space clicks   │  │
                    │  └───────────────────────┘  │
                    │                             │
                    │  User clicks node →         │
                    │  getNearestNode() →         │
                    │  info panel slides in →     │
                    │  "Awaken" → download file   │
                    └─────────────┬───────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │    downloads/               │
                    │  221 .md  |  17 .zip        │
                    │  Served raw from GitHub      │
                    │  Pages via .nojekyll         │
                    └─────────────────────────────┘
```

## Appendix B: PLT Score Reference

| Score Range | Meaning | Visual |
|------------|---------|--------|
| Profit 0.8-1.0 | High growth, execution | Deep purple, large node |
| Profit 0.4-0.7 | Moderate growth | Medium purple |
| Profit 0.0-0.3 | Low growth | Light purple, small node |
| Love 0.8-1.0 | High connection, empathy | Bright cyan, high saturation |
| Love 0.4-0.7 | Moderate connection | Medium cyan |
| Love 0.0-0.3 | Low connection | Desaturated, muted |
| Tax 0.8-1.0 | High cost, complexity | Light/gold, high lightness |
| Tax 0.4-0.7 | Moderate cost | Medium lightness |
| Tax 0.0-0.3 | Low cost | Dark, low lightness |

## Appendix C: Quick Reference Card

```
┌────────────────────────────────────────────────────┐
│         SOUL ECONOMY HUB — QUICK REFERENCE         │
├────────────────────────────────────────────────────┤
│                                                    │
│  DEPLOY   git add -A; git commit -m ""; git push   │
│  WAIT     1-2 min for GitHub Pages                  │
│  AUDIT    Check downloads/ .md count = 221         │
│  CLICKS   Screen-space proximity, 30px radius      │
│  FORCE    repel:0.15, center:0.04, attract:0.003   │
│                                                    │
│  ADD ROLE     Create .md + items[] entry           │
│  ADD SOUL GUN Copy SKILL.md + items[] entry        │
│  NO JEKYLL    .nojekyll file must exist            │
│                                                    │
│  CATALOG: 22 roles, 138 soul guns, 37 chambers     │
│           28 infra, 8 souls, 8 combos, 2 worlds    │
│                                                    │
│  COLORS: purple #8B5CF6, cyan #00D4FF, gold #FFD166│
│  FONT: Inter, sans-serif                           │
│  THREE: v0.160.0 from jsdelivr CDN                 │
│                                                    │
└────────────────────────────────────────────────────┘
```
