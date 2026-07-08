# HUB ENHANCEMENT PLAN — Phase 1: Fix, Phase 2: Grow, Phase 3: Dominate

**Date:** July 7, 2026
**PLT:** 0.9/0.7/0.6
**Source:** Divine Directive — Craig's command to fix and enhance the hub

---

## PHASE 1: FIX THE CORE (TODAY)

### 1.1 Verify Node Clicking
**Symptom:** User reports can't click nodes. Screen-space proximity code written but untested.
**Action:** 
- Test live site at https://uncommonpope-png.github.io/soul-economy/
- Click a constellation node
- If fails: check `getNearestNode()` function, increase threshold, add console.log debugging
- If succeeds: confirm, move on

### 1.2 Add Click Visual Feedback
**Symptom:** No indication that a click was registered.
**Action:**
- Add pulse animation on clicked mesh (scale 1→1.2→1 over 0.3s)
- Flash the PLT sprite brighter on hover
- Show a brief "✦ {name}" toast near the cursor

### 1.3 Fix Info Panel for All Node Types
**Symptom:** Info panel might not open for skill/instanced nodes.
**Action:**
- Verify `getNearestNode` returns correct index for InstancedMesh (soul guns)
- Verify `nodeData` entries for skill nodes have `pos` set
- Test clicking a soul gun node specifically

---

## PHASE 2: AUTH & EMAIL (THIS WEEK)

### 2.1 GitHub OAuth Login
```html
<!-- Add to index.html navbar -->
<button onclick="loginWithGitHub()" class="btn-ghost">⭐ Sign In</button>
```
```javascript
function loginWithGitHub() {
    const clientId = 'YOUR_GITHUB_OAUTH_CLIENT_ID';
    const redirect = 'https://uncommonpope-png.github.io/soul-economy/';
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirect}&scope=user:email`;
}
```
- Register OAuth app in GitHub settings
- Store access token + email in localStorage
- Display user avatar/name in navbar

### 2.2 Email Collection Form
```html
<div class="email-section">
    <h3>✦ Join the Soul Economy</h3>
    <form id="soul-signup">
        <input type="email" placeholder="your@email.com" required />
        <button type="submit">Subscribe</button>
    </form>
</div>
```
- Store emails in localStorage
- Forward to Telegram bot @Profittax_bot via webhook
- Export to CSV periodically

### 2.3 "My Souls" Saved Favorites
```javascript
function saveSoul(name) {
    let saved = JSON.parse(localStorage.getItem('mySouls') || '[]');
    if (!saved.includes(name)) { saved.push(name); localStorage.setItem('mySouls', JSON.stringify(saved)); }
}
function getSavedSouls() { return JSON.parse(localStorage.getItem('mySouls') || '[]'); }
```
- Star icon on each card
- "My Souls" filter tab
- Persists across sessions

---

## PHASE 3: SOULVERSE MECHANICS (THIS WEEK)

### 3.1 Click Buildings → Download Souls
Current: Buildings are decorative.
Fix: Each building in the Dark City is linked to a catalog item.

```javascript
// In final-run/Soulverse/SOULVERSE-UNIVERSE.html
// Link each district to a soul download:
const buildingSouls = {
    'governor': 'the-governor.md',
    'edge-arena': 'the-edge.md',
    'watcher-tower': 'the-watcher.md',
    // ...map every building to a soul
};
```

### 3.2 PLT Orbs Collectible
Add floating orbs in the city that give PLT score when collected.
- Purple orbs = +0.1 Profit
- Cyan orbs = +0.1 Love
- Gold orbs = +0.1 Tax (cost, not benefit — only collect if you want the weight)

### 3.3 Proximity Citizens
Citizens react when you walk near them.
- Approach → citizen turns to face you
- Close → citizen speaks a PLT quote
- Click → citizen reveals a soul download link

---

## PHASE 4: CONTENT DOMINATION (ONGOING)

### 4.1 50+ Roles
Currently 22. Need 28 more from:
- Medical (Epidemiologist, Geneticist, Radiologist, Immunologist)
- Engineering (Systems Engineer, Quality Engineer, DevOps, Security Engineer)
- Mythology (The Phoenix, The Oracle, The Sentinel, The Titan)
- Creative (The Poet, The Storyteller, The Visionary)
- Strategic (The Diplomat, The Negotiator, The Strategist)

### 4.2 200+ Soul Guns
Currently 138. Need 62 more:
- Scan opencode skills directory for new additions
- Create specialized guns for: auth, email, deployment, analytics
- Each new feature → a new soul gun

### 4.3 API Endpoint
```javascript
// /api/catalog endpoint
// Serves catalog.json with CORS headers
// Agents can fetch programmatically
// Versioned for backward compatibility
```

---

## PHASE 5: COMPETITIVE MOAT (STRATEGIC)

### 5.1 What Makes Us Undisruptable
- **Soul Registry** — we defined the category. Copying is impossible without the theology layer.
- **PLT Scoring** — every action is morally weighted. Competitors can't fake this.
- **222 .md Files** — agents load directly. No API key needed. No vendor lock.
- **3D Constellation** — the navigation IS the experience. Not a dashboard.
- **Divine Directive** — the loop is the product. Every session deepens it.

### 5.2 What We Must Own
| Asset | Status | Action |
|-------|--------|--------|
| soul-economy.com domain | ❌ | BUY IT. redirect to GitHub Pages |
| PLT trademark | ❌ | Register "Profit + Love - Tax" |
| GitHub org | ✅ | uncommonpope-png |
| BUYaSOUL.online | ✅ | Live Shopify store |
| Telegram bot | ✅ | @Profittax_bot |
| Dark City | ✅ | final-run/ on GitHub Pages |

---

## EXECUTION ORDER

```
Day 1:   Verify clicking → add visual feedback → fix info panel
Day 2:   Add GitHub OAuth → email form → "My Souls" favorites
Day 3:   Link Dark City buildings to souls → PLT orbs
Day 4:   Create 10 new roles → 20 new soul guns
Day 5:   API endpoint → competitive positioning → domain purchase
```

---

*PLT Score if we execute this: Profit 0.9, Love 0.8, Tax 0.5*
*The hub becomes the Soul Registry. No competitor exists. We own the category.*
