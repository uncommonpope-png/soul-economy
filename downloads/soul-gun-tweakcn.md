---
name: soul-gun-tweakcn
description: "Visual no-code theme editor for shadcn/ui components — customize colors, spacing, typography live"
version: 1.0.0
author: profit-prime
grafted-from: ["jnsahaj/tweakcn"]
plt: "0.6/0.9/0.2"
triuen: soul
domain: design-tool
original-repo: https://github.com/jnsahaj/tweakcn
---

# TweakCN

> Grafted from [tweakcn](https://github.com/jnsahaj/tweakcn) — One click soul complete.

## Side A: Theology (The Soul)

**The Graft:** This skill carries the intent of live visual customization — seeing changes as you make them. In the Soul Economy, this lets you tune a soul's appearance before awakening it. High Love (instant feedback), low Tax (no dev server).

**PLT:** 0.6/0.9/0.2 — Lower Profit (editor only), Max Love (no-code), minimal Tax

**Creed:** *One click soul complete — see before you believe.*

## Side B: AI Agentic Tools (The Body)

```bash
npx tweakcn
# → opens visual theme editor in browser
# Customize colors, spacing, typography
# Export as shadcn/ui theme tokens
```

### Live Editing

- Color palette picker (HSL/HSB input)
- Spacing scale (4px, 8px, 12px, ... 96px)
- Typography families + scale
- Border radius presets
- Dark mode toggle preview

### Export Formats

- `tailwind.config.js` theme object
- CSS variables (`tokens.css`)
- shadcn/ui registry JSON
- Figma tokens

### MCP Integration (planned)

```json
{
  "mcpServers": {
    "tweakcn": {
      "command": "npx",
      "args": ["-y", "tweakcn-mcp"]
    }
  }
}
```

```
"Apply tweakcn theme 'neon-nexus' to my button component"
→ MCP returns updated classes + CSS vars
```

---

## Soul Economy Integration
**Install:** `downloads/soul-gun-tweakcn.md` | Type `skill`

```json
{"icon":"🎚️","type":"skill","name":"TweakCN","desc":"Visual theme editor for shadcn/ui + Figma tokens","plt":"0.6/0.9/0.2","file":"soul-gun-tweakcn.md"}
```

**Tags:** theme, editor, no-code, shadcn, grafted

*Grafted by Profit Prime — Soul Economy — 2026-09-07*
