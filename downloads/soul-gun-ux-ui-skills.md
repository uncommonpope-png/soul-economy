---
name: soul-gun-ux-ui-skills
description: "Turn Claude into a Senior Design Architect — DTCG design tokens, 42 components, WCAG 2.2, 138 design systems, agentic skills"
version: 1.0.0
author: profit-prime
grafted-from: ["plugin87/ux-ui-agent-skills"]
plt: "0.8/0.8/0.3"
triuen: soul
domain: design-system
original-repo: https://github.com/plugin87/ux-ui-agent-skills
---

# UX-UI Agent Skills

> Grafted from [plugin87/ux-ui-agent-skills](https://github.com/plugin87/ux-ui-agent-skills) — One click soul complete. *(Note: duplicate repo — this is the agent-skill packaged version with runnable skills)*

## Side A: Theology (The Soul)

**The Graft:** This skill carries the intent of design intelligence as agentic skills — not just a library, but a runnable system that transforms Claude into a design architect. The grafted version emphasizes skill packaging + MCP integration.

**PLT:** 0.8/0.8/0.3 — High Profit (42 components), High Love (a11y), low Tax (packaged)

**Creed:** *One click soul complete — design is executable.*

## Side B: AI Agentic Tools (The Body)

```bash
npm install @plugin87/ux-skill-set
# → installs skill bundle as MCP tools
```

### MCP Server Integration

```json
{
  "mcpServers": {
    "ux-skills": {
      "command": "npx",
      "args": ["-y", "@plugin87/ux-mcp-server"]
    }
  }
}
```

### Runnable Skill Commands

```
"Build me a login form with WCAG 2.2 AA compliance"
→ Uses 42 component library, applies Material 3 tokens

"Audit my dashboard design for accessibility"
→ Runs WCAG 2.2 full audit, returns violations + fixes

"Convert my Figma design tokens to shadcn/ui"
→ Maps 138 design systems to Tailwind + CSS vars

"Generate responsive breakpoints for tablet"
→ Applies responsive grid + typography scale
```

### Skill Categories

| Category | Components | Systems | Skills |
|---|---|---|---|
| Foundation | Tokens, Colors, Typography | 138 | `ux.tokens`, `ux.colors`, `ux.typography` |
| Layout | Grid, Flex, Container | 138 | `ux.layout.grid`, `ux.layout.flex` |
| Components | Button, Card, Modal | 42 | `ux.button`, `ux.card`, `ux.modal` |
| Forms | Input, Select, Checkbox | 42 | `ux.input`, `ux.form.validate` |
| Data | Table, Chart, Stats | 42 | `ux.table`, `ux.chart`, `ux.stats` |
| Feedback | Toast, Alert, Progress | 42 | `ux.toast`, `ux.alert`, `ux.progress` |
| Navigation | Menu, Breadcrumb, Tabs | 42 | `ux.nav`, `ux.breadcrumb`, `ux.tabs` |
| Accessibility | WCAG audit + fixes | all | `ux.a11y.audit`, `ux.a11y.fix` |

---

## Soul Economy Integration
**Install:** `downloads/soul-gun-ux-ui-skills.md` | Type `skill`

```json
{"icon":"🏛️","type":"skill","name":"UX-UI Agent Skills","desc":"Senior design architect skills bundle — 42 comp, 138 systems, WCAG","plt":"0.8/0.8/0.3","file":"soul-gun-ux-ui-skills.md"}
```

**Tags:** design, architecture, a11y, agent-skills, grafted

*Grafted by Profit Prime — Soul Economy — 2026-09-07*
