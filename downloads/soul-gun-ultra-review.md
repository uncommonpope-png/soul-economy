---
name: ultra-review
description: Multi-round, multi-agent adversarial code review. Maximize real defects found, minimize false positives via cross-critique. Language-agnostic, host-agnostic.
triggers: User typed "ultra review" or "ultra-review"; OR a coordinating agent invokes this skill at feature/PR completion.
host-requirements: filesystem read/write, code search, version control. Strongly preferred: parallel sub-agent execution, web research, read-only database query.
---

# Ultra Review

Coordinate a fleet of independent AI agents through a multi-round adversarial review of a code change. Reviewers investigate in parallel under narrow scopes, then cross-examine each other's findings — survivors are the defensible ones.

Designed for multi-agent collaboration across heterogeneous LLMs (Claude, Codex, Aider, custom harnesses), with the orchestrator composing the fleet and digesting results rather than reviewing code itself.

Optimizes for depth and adversarially-confirmed signal, not speed.

Credits: generalized from the original .NET-focused skill concept in PlatformPlatform by Thomas Jespersen.

---

## When to invoke

- **Interactive mode** — the user explicitly typed "ultra review" or "ultra-review". Run the full interview (STEP 1) and present results in chat (STEP 10).
- **Autonomous mode** — another agent (e.g., a team-lead orchestrator at feature completion) invokes this skill programmatically with scope, risk hotspots, size, and confidence policy already specified. Skip STEP 1's interview. Skip STEP 10's chat presentation. Always write `TASKS.md`; return its path to the caller.

If you cannot tell which mode you are in, ask once. Default to interactive.

---

## Host capability requirements

This skill is portable across LLM platforms. It assumes:

| Capability | Required? | Used for |
|---|---|---|
| Filesystem read/write | **Required** | Writing artifacts to disk; agents communicate via files, not return values |
| Code search (grep / ripgrep / equivalent) | **Required** | Every reviewer needs to navigate the codebase |
| Version control (git or equivalent) | **Required** | Computing the diff under review |
| Parallel sub-agent / delegated-task execution | **Strongly preferred** | Each round launches N agents at once; without this, fall back to sequential execution and accept the wall-clock cost |
| Structured question / multi-choice prompt to user | Preferred | STEP 1 interview; degrades to plain-text questions if unavailable |
| Web research (search + fetch) | Preferred | Verifying external assumptions, API contracts, CVE data |
| Read-only database query | Optional | Verifying data-shape assumptions for backend reviews |

**Mapping to your host:** wherever this document says "spawn a sub-agent" or "delegated reviewer", invoke your platform's task-delegation primitive. Wherever it says "code-search capability", use your platform's grep/find/ripgrep tool.

---

## Glossary

- **Orchestrator** — the agent running this skill. Designs the review, launches reviewers, digests results. Does not read findings until the final digest step.
- **Reviewer agent** (or just "agent") — a delegated sub-agent assigned one narrow scope. Reads code, finds problems, writes findings to disk, returns a one-line triage. Never returns findings as prose.
- **Scope** — a one- to two-line description of an area and an angle. NOT a checklist. Names where to look, not what to find.
- **Round** — one parallel wave of agent work. This workflow has four: Discovery, Cross-review, Finalization, Digest.
- **Confidence** — categorical, not numeric: Certain / Likely / Possible.
- **High-impact area** — domains where false negatives are worse than false positives (security, data loss, privacy, regulatory, financial correctness).
- **Affinity cluster** — an orchestrator-side grouping of reviewers used to inform Round 2 assignment.

---

## Core principles

- **Depth, not efficiency.** Spend the tokens, time, and tool calls needed.
- **Generic by design.** Roster, clusters, and focus areas are co-designed with the user every time.
- **80/20 effort split.** Each agent spends ~80% on highest-risk subareas, ~20% sanity-scanning.
- **No cap on agent count.** Match the change.
- **Multiple agents on hot areas.** Overlap is expected and strengthens signal.
- **Agents run independent and parallel.** No mid-flight coordination.
- **False-positive hunt in Round 2.** Reviewers try to disprove findings.
- **Confidence is categorical:** Certain (verified), Likely (strong evidence), Possible (plausible).
- **High-impact override:** high-impact areas may keep Likely/Possible regardless of policy.

---

## Output structure

```
<workspace-root>/<branch>/ultra-review/<timestamp>/
├── CONTEXT.md              # Diff summary, ticket/spec excerpts, environment, scope
├── ROSTER.md               # Final agent list with affinity clusters
├── round1/
│   └── <agent-slug>.md     # One file per agent — discovery findings
├── round2/
│   ├── ASSIGNMENT.md                 # Reviewer-to-author table from Round 1 triage
│   └── <reviewer>__on__<author>.md   # One file per cross-review pair
├── round3/
│   └── <agent-slug>.md     # One file per agent — final findings + implementations
├── SUMMARY.md              # Orchestrator digest, deduplicated, prioritized
└── TASKS.md                # Optional — task list for engineers (always in autonomous mode)
```

---

## Workflow

### STEP 1 — Interview (interactive mode only)
Infer scope from git, ask about risk hotspots, size, confidence policy.

### STEP 2 — Pre-fetch shared context
Write CONTEXT.md with branch, base, file breakdown.

### STEP 3 — Co-design the agent roster
Design fresh roster from the diff. No fixed catalog.

### STEP 4 — Co-design review affinities
Cluster roster into 3-5 affinity groups.

### STEP 5 — Round 1: Discovery (all agents in parallel)
Each agent investigates independently, writes findings to disk.

### STEP 6 — Triage and build Round 2 assignment
Use triage summaries to design cross-review pairs.

### STEP 7 — Round 2: Cross-review (all reviewers in parallel)
Reviewers try to disprove each other's findings.

### STEP 8 — Round 3: Finalization (all original agents in parallel)
Agents process critiques, strengthen survivors, implement.

### STEP 9 — Round 4: Orchestrator digest
Read all findings, deduplicate, prioritize, write SUMMARY.md.

### STEP 10 — Present findings and write sink
Present in chat, write TASKS.md or create tickets.
