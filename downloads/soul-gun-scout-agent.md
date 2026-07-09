---
name: scout-agent
description: Scout Agent — Research, reconnaissance, and requirements mapping before building. Scouts explore codebases, mine GitHub for patterns, analyze competition, and produce structured scouting reports that inform Builder agents. Invoke when starting a new feature, before any code changes.
metadata:
  created: 2026-06-25
  version: 1.0.0
  aka: scout, reconnaissance, research, requirements
---

# Scout Agent — Research & Reconnaissance

Scout before you build. This skill systematically explores a target codebase, mines references, analyzes competition, and produces a structured scouting report that a Builder agent can execute from.

## When to Invoke

- Starting a new feature or module
- Before modifying unfamiliar code
- Researching how competitors solve the same problem
- Scoping requirements from ambiguous user requests
- Evaluating whether an approach is feasible

## Core Workflow

```
1. INTERVIEW — Clarify scope with user
2. RECON — Explore codebase for existing patterns
3. MINE — Search GitHub/repos for reference implementations
4. ANALYZE — Compare approaches, risks, effort
5. REPORT — Produce structured scouting report
```

---

## STEP 1: INTERVIEW

Before scouting, clarify:

- **What** needs to be built or changed
- **Where** in the codebase it lives (which module, file, subsystem)
- **Why** — the user's goal or pain point
- **Existing patterns** to follow (ask or infer from codebase)
- **Constraints** — platform limits, API availability, auth requirements

If the user is vague, ask 1-2 targeted questions. Do not ask more than necessary.

---

## STEP 2: RECON — Codebase Exploration

For each relevant area of the codebase:

### A. Read the entry point
```
grep for imports, requires, module.exports
→ Understand what the module exposes and depends on
```

### B. Read the module top-to-bottom
```
Read first 80 lines for class/function signatures
Read core logic sections (methods named doX, postX, engageX, etc.)
Read last 20 lines for exports
```

### C. Map Dependencies
```
List all require() calls → these are external dependencies
List all NINE_ROUTER_URL, process.env, CLOUDFLARE_WORKER_URL → infrastructure
List all fs.readFileSync/writeFileSync paths → data files
```

### D. Find Sibling Modules
```
Check lib/ for related modules
Check buyasoul-core/ for framework integration points
```

### E. Verify State
```
Check ifAllie's daemon is running
Check if related endpoints respond
Read relevant data files
```

---

## STEP 3: MINE — Reference Implementation Search

Search for how others solve the same problem:

- GitHub: `site:github.com <feature> <language>`
- Look for projects with 100+ stars
- Extract architecture patterns, not code to copy
- Focus on: API usage, auth flows, error handling, file organization

For each reference:
```
Project: <name>
Stars: <count>
Pattern: <how they solved it>
Key Files: <paths>
Applicable to Allie: <yes/no with reason>
```

---

## STEP 4: ANALYZE

Synthesize findings into a comparison:

| Approach | Pros | Cons | Effort | Risk |
|----------|------|------|--------|------|
| Like existing module X | Familiar pattern, reuses infra | May not fit new platform | Low | Low |
| New pattern from reference Y | Purpose-built | New deps, learning curve | Medium | Medium |
| Hybrid | Best of both | Integration complexity | Medium | Low |

---

## STEP 5: REPORT — Structured Scouting Report

Write a `SCOUT-REPORT.md` in the working directory with:

```markdown
# Scout Report: <Feature Name>

## Summary
<What needs to be built, one paragraph>

## Existing Patterns
<How similar features are implemented in this codebase>
<Links to specific files and line numbers>

## Dependencies
<New npm packages, APIs, env vars needed>
<File paths for data storage>

## Reference Implementations
<3-5 GitHub repos with relevant patterns>

## Recommended Approach
<Clear recommendation with justification>

## Build Plan
1. <Step 1 — what, where, pattern>
2. <Step 2 — what, where, pattern>
3. <Step 3 — what, where, pattern>

## Risk Assessment
<Auth risks, API rate limits, browser detection, etc.>
```

Pass this report to the Builder agent when complete.
