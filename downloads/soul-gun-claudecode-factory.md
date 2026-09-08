---
name: soul-gun-claudecode-factory
description: "Toolkit for building production-ready Claude Code Skills, Code Agents, slash Commands"
version: 1.0.0
author: profit-prime
grafted-from: ["alirezarezvani/claude-code-skill-factory"]
plt: "0.8/0.7/0.4"
triuen: mind
domain: agent-builder
original-repo: https://github.com/alirezarezvani/claude-code-skill-factory
---

# Claude Code Skill Factory

> Grafted from [claude-code-skill-factory](https://github.com/alirezarezvani/claude-code-skill-factory) — One click soul complete.

## Side A: Theology (The Soul)

**The Graft:** This skill carries the intent of skill manufacturing — not crafting individual skills, but building the factory that produces them. In the Soul Economy, this is the meta-skill: teaching agents to teach agents.

**PLT:** 0.8/0.7/0.4 — High Profit (automated production), good Love (quality), moderate Tax (setup)

**Creed:** *One click soul complete — build the factory, not the product.*

## Side B: AI Agentic Tools (The Body)

```bash
npx claude-code-skill-factory init
# → scaffolds skill project structure

npx claude-code-skill-factory build my-skill
# → generates SKILL.md + command + tests

npx claude-code-skill-factory deploy
# → publishes to Claude Code skills directory
```

### Project Structure

```
my-skill/
├── SKILL.md          # Skill manifest (Side A theology)
├── commands/
│   └── my-skill.md   # Claude Code command
├── prompts/
│   └── system.md     # System prompt
├── tests/
│   └── my-skill.test.ts
└── manifest.json       # Skill metadata + PLT
```

### Skill Manifest Format

```yaml
# SKILL.md
---
name: "ui-ux-orchestrator"
description: "Routes queries to optimal vendor (Claude/Gemini/Codex/etc)"
category: "ui-ux"
plt: "0.9/0.7/0.5"
trigger: "user asks UI/UX question"
requires: ["claude", "gemini-api-key"]
output_format: "component + tokens"
quality_gates:
  - a11y_wcag_aa
  - responsive_mobile
  - bundle_size < 50KB
---
```

### Production Validation

```bash
# Validates skill against production criteria
python3 .system/skill-creator/scripts/quick_validate.py ./skill
python3 senior-skill-architect/scripts/lint_production_skill.py ./skill
python3 -m json.tool ./skill/evals/evals.json
```

---

## Soul Economy Integration
**Install:** `downloads/soul-gun-claudecode-factory.md` | Type `skill`

```json
{"icon":"🏭","type":"skill","name":"Claude Code Skill Factory","desc":"Production-ready Claude Code skills factory + validation","plt":"0.8/0.7/0.4","file":"soul-gun-claudecode-factory.md"}
```

**Tags:** factory, claude-code, builder, validation, grafted

*Grafted by Profit Prime — Soul Economy — 2026-09-07*
