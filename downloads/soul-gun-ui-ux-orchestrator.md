---
name: soul-gun-ui-ux-orchestrator
description: "Vendor-neutral orchestration for Kimi/Codex/Claude/Gemini/Qwen/Copilot/GLM"
version: 1.0.0
author: profit-prime
grafted-from: ["ui-ux-agent-skill-system"]
plt: "0.9/0.7/0.5"
triune: mind
domain: ui-ux
original-repo: https://github.com/ui-ux-agent-skill-system
---

# UI/UX Orchestrator

> *Grafted from [ui-ux-agent-skill-system](https://github.com/ui-ux-agent-skill-system) — One click soul complete.*

---

## Side A: Theology (The Soul)

**The Graft:** This skill is the soul of ui-ux-agent-skill-system. It carries the intent of vendor-neutral orchestration for kimi/codex/claude/gemini/qwen/copilot/glm.

In the Soul Economy, every interface is a conversation between Profit (what it does), Love (how it feels), and Tax (what it costs). This skill teaches the agent to see UI not as pixels but as PLT — to choose glass over flat when Love demands depth, to choose command palette over menu when Profit demands speed.

**PLT:** 0.9/0.7/0.5 — Vendor-neutral orchestration for Kimi/Codex/Claude/Gemini/Qwen/Copilot/GLM

**Creed:** *One click soul complete — the interface is the soul.*

---

## Side B: AI Agentic Tools (The Body)

Original skill documentation follows. Use as executable reference for your agent.

Original repo: https://github.com/ui-ux-agent-skill-system

---

---
name: admin-ui-builder
description: "Use when admin/CMS/back-office screens need to be built or specified after admin-ui-orchestrator defines roles, permissions, workflows, and safety gates. Covers tables, forms, editors, moderation queues, dashboards, CRUD surfaces, and state coverage without production destructive actions."
---

# Admin UI Builder

This skill builds or specifies admin UI surfaces under an existing admin architecture contract.

## Operating Modes

- `screen-spec`: define admin screens, states, forms, tables, filters, and validation.
- `implementation-handoff`: prepare local UI implementation tasks.
- `state-coverage`: cover empty, loading, error, permission denied, audit, and confirm states.

## Required Workflow

1. Read [references/admin-ui-build-contract.md](references/admin-ui-build-contract.md).
2. Use [assets/admin-screen-spec.template.md](assets/admin-screen-spec.template.md).
3. Confirm roles, permissions, destructive actions, and audit requirements from `admin-ui-orchestrator`.
4. Do not hide security and permission states for visual simplicity.

## Safety Rules

- Do not run production admin mutations.
- Every destructive action needs explicit confirmation UI and rollback/audit story.
- Never expose secrets, tokens, private customer data, or raw logs in UI examples.

## Validation

```bash
python3 $CODEX_HOME/skills/.system/skill-creator/scripts/quick_validate.py $CODEX_HOME/skills/admin-ui-builder
python3 $CODEX_HOME/skills/senior-skill-architect/scripts/lint_production_skill.py $CODEX_HOME/skills/admin-ui-builder
python3 -m json.tool $CODEX_HOME/skills/admin-ui-builder/evals/evals.json >/dev/null
```


---

## Soul Economy Integration

**Install:** `downloads/soul-gun-ui-ux-orchestrator.md` — Load as `skill` in `data/catalog.json` type `skill`. Guide agent uses 7 vendor adapters (window.guideAdapters) to dispatch domain-specific queries.

**Usage:** Add to `catalog.json`:
```json
{"icon":"⚡","type":"skill","name":"UI/UX Orchestrator","desc":"Vendor-neutral orchestration for Kimi/Codex/Claude/Gemini/Qwen/Copilot/GLM","plt":"0.9/0.7/0.5","file":"soul-gun-ui-ux-orchestrator.md"}
```

**Tags:** ui, ux, design, grafted

*Grafted by Profit Prime — Soul Economy — 2026-09-07*
