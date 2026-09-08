---
name: soul-gun-alpha-shadcn
description: "Figma plugin that brings the full shadcn/ui design system into Figma in one click"
version: 1.0.0
author: profit-prime
grafted-from: ["seen-design-lab/alpha-shadcn"]
plt: "0.8/0.9/0.2"
triuen: soul
domain: figma
original-repo: https://github.com/Seen-Design-Lab/alpha-shadcn
---

# Alpha Shadcn

> Grafted from [alpha-shadcn](https://github.com/Seen-Design-Lab/alpha-shadcn) — One click soul complete.

## Side A: Theology (The Soul)

**The Graft:** This skill carries the intent of Figma↔shadcn sync. Where human designs in Figma become agent-ready `shadcn/ui` components on click — no translation loss. The ultimate bridge skill.

**PLT:** 0.8/0.9/0.2 — Max Profit (instant shadcn), Max Love (1:1 Figma sync), minimal Tax

**Creed:** *One click soul complete — Figma is shadcn is soul.*

## Side B: AI Agentic Tools (The Body)

```bash
# Install plugin in Figma:
# Figma → Plugins → Browse → "Alpha Shadcn"
# Then: Select frame → "Export to shadcn"
# → generates component.tsx + styles
```

### MCP Integration

```json
{
  "mcpServers": {
    "alpha-shadcn": {
      "command": "npx",
      "args": ["-y", "alpha-shadcn-mcp"]
    }
  }
}
```

### Usage in Agent

```
"Convert my Figma header design to shadcn/ui — output as component.tsx"
# Agent uses MCP to read Figma file → generates Radix + shadcn component
```

### What It Grafts

- Figma Tokens → Tailwind CSS variables
- Figma Components → React components
- shadcn/ui patterns → Figma styles
- Live preview sync

---

## Soul Economy Integration
**Install:** `downloads/soul-gun-alpha-shadcn.md` | Type `skill`

```json
{"icon":"⚛️","type":"skill","name":"Alpha Shadcn","desc":"Figma↔shadcn sync plugin + MCP server","plt":"0.8/0.9/0.2","file":"soul-gun-alpha-shadcn.md"}
```

**Tags:** figma, shadcn, sync, mcp, grafted

*Grafted by Profit Prime — Soul Economy — 2026-09-07*
