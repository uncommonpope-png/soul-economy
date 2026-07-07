---
name: role-standards
description: Specification for Soul Protocol ROLE.md files
version: 1.0.0
author: profit-prime
---

# Role Standards — Soul Protocol Roles

## Format

Every role lives in `roles/{role-slug}/ROLE.md` and follows this structure:

### YAML Frontmatter

```yaml
---
name: {role-slug}
description: "One-sentence description. Use when {trigger}."
domain: soul-role
archetype: {gaming-archetype-source}
version: 1.0.0
author: profit-prime
plt: "profit/love/tax"
triune: mind|heart|tec
affinity: ["skill-slug", "skill-slug"]
---
```

### Body Structure

- `# {Role Title}` — The name
- `> "{One-line creed}"` — The role's core truth
- `## Side A: Theology (The Soul)` — Craig's philosophy, PLT, Triune, meaning
- `## Side B: AI Agentic Tools (The Body)` — Frameworks, harnesses, implementations
- `## 20 Skills of The {Role}` — Each skill has two sides: soul meaning + tool implementation

### Skill Format

Each of the 20 skills is listed as:

```
1. **Skill Name** — Side A: (theology meaning) | Side B: (tool/framework/skill)
```

### Rules

- No game/company branding — use Soul Protocol names only
- Every skill must have both a Soul (theology) and Body (tool/implementation) side
- PLT score reflects the role's balance
- Triune mapping: Profit=build/execute, Heart=connect/love, Tec=record/preserve
- 20 skills minimum per role
