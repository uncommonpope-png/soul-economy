---
name: soul-gun-refly
description: "First open-source agent skills builder. Skills as infrastructure — compose, deploy, iterate."
version: 1.0.0
author: profit-prime
grafted-from: ["refly-ai/refly"]
plt: "0.9/0.6/0.4"
triuen: mind
domain: agent-framework
original-repo: https://github.com/refly-ai/refly
---

# Refly

> Grafted from [refly](https://github.com/refly-ai/refly) — One click soul complete.

## Side A: Theology (The Soul)

**The Graft:** This skill carries the intent of skill-as-infrastructure — treating agent skills as composable, deployable units. In the Soul Economy, every soul IS a skill. Refly is the factory that builds them.

**PLT:** 0.9/0.6/0.4 — Max Profit (composable), decent Love (developer DX), moderate Tax (learning curve)

**Creed:** *One click soul complete — skills are infrastructure.*

## Side B: AI Agentic Tools (The Body)

```bash
npm create refly@latest
cd my-skills
npm run dev
# → localhost:3000 — compose skills visually
```

### Skill Composition

```yaml
# .refly/skill.yaml
name: "soul-economy-extractor"
description: "Extracts design systems and converts to soul cards"
triggers:
  - "user uploads figma file"
  - "user asks to convert design to code"
actions:
  - call: "figma.tokens.extract"
  - call: "design.tokens.to-shadcn"
  - call: "soul.generate-card"
```

### Deployment

```bash
npx refly deploy --target claude-code
# → publishes skill to Claude Code skills directory
```

### Architecture

- **Canvas** — visual skill composition
- **Runner** — executes skill chains
- **Registry** — skill marketplace
- **Bridge** — connects to Claude Code, Cursor, Windsurf

---

## Soul Economy Integration
**Install:** `downloads/soul-gun-refly.md` | Type `skill`

```json
{"icon":"🏗️","type":"skill","name":"Refly","desc":"Open-source agent skills builder — compose/deploy/iterate","plt":"0.9/0.6/0.4","file":"soul-gun-refly.md"}
```

**Tags:** agent, builder, compose, framework, grafted

*Grafted by Profit Prime — Soul Economy — 2026-09-07*
