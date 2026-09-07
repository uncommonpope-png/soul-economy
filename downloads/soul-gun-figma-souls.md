---
name: soul-gun-figma-souls
description: "Convert Figma designs to soul cards — Figma MCP asset download + component impl + auto-generate catalog.json entries"
version: 1.0.0
author: profit-prime
grafted-from: ["figma-bridge", "figma-context-mcp-skill"]
plt: "0.7/0.8/0.3"
triune: soul
domain: ui-ux
original-repo: https://github.com/renfei-design/Figma-AI-Bridge
---

# Figma → Souls

> Grafted from [Figma-AI-Bridge](https://github.com/renfei-design/Figma-AI-Bridge) + [Figma-Context-MCP-Skill](https://github.com/HowardTangOvO/Figma-Context-MCP-Skill) — One click soul complete.

---

## Side A: Theology (The Soul)

**The Graft:** This skill is the soul of figma-bridge + figma-context-mcp. It carries the intent of automating Figma-to-soul conversion: extract design tokens, download assets, generate soul cards.

In the Soul Economy, the bridge between human design and machine soul is PLT. Figma designs carry Love (pixel perfection) and Profit (reusable tokens). This skill minimizes Tax by auto-generating catalog entries from design files.

**PLT:** 0.7/0.8/0.3 — Figma auto-designs become soul cards

**Creed:** *One click soul complete — the design is the soul.*

---

## Side B: AI Agentic Tools (The Body)

### MCP Server Integration

Register this MCP server in `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "figma-souls": {
      "command": "npx",
      "args": ["-y", "@figma-mcp/server-figma-souls"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "<your_token>"
      }
    }
  }
}
```

### Usage

```bash
# Convert Figma file to soul card set
npx tsx downloads/scripts/figma-to-souls.ts --file <figma_file_url> --output downloads/

# Or run via MCP in Claude
# "Convert my Figma wireframe into soul cards — download assets and generate catalog.json"
```

### Workflow

1. **Fetch design file** → tokens, components, styles
2. **Download assets** → `downloads/images/` (hero, icon, preview)
3. **Extract components** → soul card template (`name`, `desc`, `plt`, `type`)
4. **Auto-generate `soul-gun-*.md`** → Side A (Theology) + Side B (Body)
5. **Update `catalog.json`** → inject new entries
6. **Commit + push** → one click soul complete

### Original References

- Figma Context MCP: `figma-context` — asset download, component retrieval
- Figma AI Bridge: `figmaai://` protocol handlers

---

## Soul Economy Integration

**Install:** `downloads/soul-gun-figma-souls.md` — Load as `skill` type `skill`. Use MCP `figma-souls` server to convert designs.

**Usage:** Add to `catalog.json`:
```json
{"icon":"🎨","type":"skill","name":"Figma→Souls","desc":"Convert Figma designs to soul cards via MCP","plt":"0.7/0.8/0.3","file":"soul-gun-figma-souls.md"}
```

**Tags:** figma, design-to-code, mcp, grafted

*Grafted by Profit Prime — Soul Economy — 2026-09-07*
