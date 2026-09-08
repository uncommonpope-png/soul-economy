---
name: soul-gun-figma-console-skills
description: "Figma Console MCP skills as Markdown — design tokens, WCAG lint, a11y audits, automated design QA"
version: 1.0.0
author: profit-prime
grafted-from: ["southleft/figma-console-mcp-skills"]
plt: "0.6/0.9/0.2"
triuen: soul
domain: figma
original-repo: https://github.com/southleft/figma-console-mcp-skills
---

# Figma Console MCP Skills

> Grafted from [figma-console-mcp-skills](https://github.com/southleft/figma-console-mcp-skills) — One click soul complete.

## Side A: Theology (The Soul)

**The Graft:** This skill carries the intent of Figma Console as skill language — writing MCP prompts as Markdown documentation that agents can read + execute. Design QA becomes conversational.

**PLT:** 0.6/0.9/0.2 — Lower Profit (audit only), Max Love (conversational QA), minimal Tax

**Creed:** *One click soul complete — audit is prayer.*

## Side B: AI Agentic Tools (The Body)

```json
{
  "mcpServers": {
    "figma-console": {
      "command": "npx",
      "args": ["-y", "@figma/console-mcp-server"],
      "env": { "FIGMA_ACCESS_TOKEN": "<token>" }
    }
  }
}
```

### Available Skills (as Markdown)

```markdown
# Skill: Audit Color Contrast
Run on current selection:
- Check all text/background pairs against WCAG 2.1 AA (4.5:1)
- Report violations with layer names
- Suggest fixes with hex values
```

### Usage in Claude

```
"Run the Figma Console WCAG audit on my login screen design"
→ MCP executes audit, returns violations + suggestions

"Export all colors as DTCG tokens from current Figma file"
→ MCP reads tokens → returns DTCG JSON + CSS vars

"Generate an accessibility statement for my design"
→ MCP runs full a11y audit → returns MD report
```

### Skills Exported

| Skill | Function |
|---|---|
| `figma.tokens.export` | DTCG tokens, CSS vars, Figma variables |
| `figma.colors.audit` | WCAG color contrast + violations |
| `figma.typography.audit` | Font sizing/spacing consistency |
| `figma.components.list` | All components + instances |
| `figma.layout.audit` | Responsive breakpoint coverage |
| `figma.accessibility.check` | Full WCAG 2.1 + 2.2 audit |
| `figma.images.export` | Asset export + optimization |

---

## Soul Economy Integration
**Install:** `downloads/soul-gun-figma-console-skills.md` | Type `skill`

```json
{"icon":"🔍","type":"skill","name":"Figma Console Skills","desc":"MCP-powered Figma design QA as Markdown skills","plt":"0.6/0.9/0.2","file":"soul-gun-figma-console-skills.md"}
```

**Tags:** figma, mcp, audit, accessibility, grafted

*Grafted by Profit Prime — Soul Economy — 2026-09-07*
