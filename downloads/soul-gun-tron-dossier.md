---
name: soul-gun-tron-dossier
description: "Tron Dossier card variant — HUD-style dark UI with cyan/magenta glow, monospace typography, radar PLT strip"
version: 1.0.0
author: profit-prime
grafted-from: ["TheGridCN"]
plt: "0.8/0.7/0.4"
triune: soul
domain: ui-ux
original-repo: https://github.com/dnahilman/thegridcn-ui
---

# Tron Dossier

> Grafted from [TheGridCN](https://github.com/dnahilman/thegridcn-ui) — One click soul complete.

---

## Side A: Theology (The Soul)

**The Graft:** This skill is the soul of TheGridCN's `TronDossierCard`. It carries the intent of sci-fi HUD interface design — cyan/magenta glow, monospace typography, radar visualization.

In the Soul Economy, some souls need a cyberpunk aesthetic. The dossier variant transforms standard cards into terminal-style HUD surfaces. PLT becomes a radar strip. Typography becomes monospace. The glass becomes black-neon.

**PLT:** 0.8/0.7/0.4 — Cyberpunk HUD card variant

**Creed:** *One click soul complete — the interface is the soul.*

---

## Side B: AI Agentic Tools (The Body)

### CSS

```css
.card.dossier {
  background: rgba(8,8,12,0.8);
  border: 1px solid rgba(0,212,255,0.15);
  box-shadow: 0 0 20px rgba(0,212,255,0.1), inset 0 0 20px rgba(0,212,255,0.03);
}
.card.dossier .card-title {
  color: rgba(0,212,255,0.8);
  text-shadow: 0 0 15px rgba(0,212,255,0.4);
  font-family: 'Courier New', monospace;
}
```

### Usage

Add `graft: true` to a catalog entry to enable the dossier variant:

```json
{"name":"Example Soul","graft":true,"type":"skill","plt":"0.8/0.7/0.4",...}
```

---

## Soul Economy Integration

**Install:** `downloads/soul-gun-tron-dossier.md` — Load as `skill` type `skill`.

**Usage:** Add to `catalog.json`:
```json
{"icon":"🖥️","type":"skill","name":"Tron Dossier","desc":"HUD-style cyberpunk card variant","plt":"0.8/0.7/0.4","file":"soul-gun-tron-dossier.md"}
```

**Tags:** ui, tron, hud, grafted, dossier

*Grafted by Profit Prime — Soul Economy — 2026-09-07*
