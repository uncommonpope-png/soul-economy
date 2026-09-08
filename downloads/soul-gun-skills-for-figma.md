---
name: soul-gun-skills-for-figma
description: "Agent skills for native Figma MCP — tokens, components, accessibility audits, Slides, FigJam"
version: 1.0.0
author: profit-prime
grafted-from: ["southleft/skills-for-figma"]
plt: "0.6/0.9/0.3"
triune: mind
domain: figma
original-repo: https://github.com/southleft/skills-for-figma
---

# Skills for Figma

> Grafted from [skills-for-figma](https://github.com/southleft/skills-for-figma) — One click soul complete.

## Side A: Theology (The Soul)

**The Graft:** This skill carries the intent of bridging Figma (human design) with AI agents (machine execution). Tokens become souls; components become reusable. The bridge minimizes the Tax of translation.

**PLT:** 0.6/0.9/0.3 — High Love (design fidelity), low Tax (no translation)

**Creed:** *One click soul complete — the design is the soul.*

## Side B: AI Agentic Tools (The Body)

### MCP Server Registration

```json
{
  "mcpServers": {
    "figma-native": {
      "command": "npx",
      "args": ["-y", "@figma/mcp-server-figma"],
      "env": { "FIGMA_ACCESS_TOKEN": "<token>" }
    }
  }
}
```

### Available Skills

- `figma.tokens` — Export design tokens from Figma
- `figma.components` — Extract components as code snippets
- `figma.accessibility` — Run WCAG 2.1 audit on selection
- `figma.slides.export` — Export Figma Slides to Markdown
- `figma.figjam.read` — Read FigJam boards as mind maps

---

## Soul Economy Integration
**Install:** `downloads/soul-gun-skills-for-figma.md` | Type `skill`

```json
{"icon":"⚛️","type":"skill","name":"Skills for Figma","desc":"Native Figma MCP agent skills — tokens, a11y, slides","plt":"0.6/0.9/0.3","file":"soul-gun-skills-for-figma.md"}
```

**Tags:** figma, mcp, design-to-code, grafted

*Grafted by Profit Prime — Soul Economy — 2026-09-07*
