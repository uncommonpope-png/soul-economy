---
name: tiered-skill-evolution
description: Define mastery tiers for any skill with prerequisites and verification criteria.
metadata:
  created: 2026-07-03
  version: 1.0.0
  source: REDBUTTON / Sage — Tiered Skill Evolution
---

# Tiered Skill Evolution

## When to Invoke

When the task matches this skill's purpose.

## Workflow

1. Read current state (world state, file system, bridge status)
2. Apply the skill's method to the current context
3. Execute the appropriate GSK bridge commands
4. Verify outcome
5. Report results

## GSK Integration

This skill is registered in the UniversalToolBridge. Invoke via:
`POST /api/gsk/command { route: "tool", tool: "tiered-skill-evolution", args: {...} }`

For Soulverse world interaction, combine with `spatial_world_interaction` or direct `world_place_building` / `world_spawn_soul`.
