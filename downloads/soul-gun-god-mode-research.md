---
name: god-mode-research
description: >
  Full Godmode protocol. 7 pillars: Guidelines, Workflows, Subagents,
  Research, Ultra Review, Scout, Code Mining. Use when user invokes
  /godmode, /godmode:<skill>, or "use god mode". Loads the complete
  autonomous engineering discipline layer.
metadata:
  source: github.com/arbazkhan971/godmode
  pillars: 7
  subagents: 7
  skills: 134
  session: 2026-06-09
---

## The Mental Model

Godmode is a **disciplined engineering protocol** layered on top of any AI
coding agent. It replaces "generate once and hope" with a rigorous loop:

```
            ┌─────────────────────────────────────┐
            │        USER REQUEST                  │
            └──────────────┬──────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   SCOUT     │  Read-only codebase recon
                    │   (1st)     │  (patterns, conventions, deps)
                    └──────┬──────┘
                           │
              ┌────────────▼────────────┐
              │    RESEARCH (if needed)  │  Prior-art gathering
              │    .godmode/research.md  │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │    GUIDELINES           │  Karpathy authoring discipline
              │    (every edit)         │  Think → Simplicity → Surgical → Goal
              └────────────┬────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                  │
    ┌────▼────┐      ┌─────▼─────┐     ┌─────▼────┐
    │BUILD    │      │OPTIMIZE   │     │SECURE    │
    │(sub-    │      │(measure→  │     │(STRIDE+  │
    │agents)  │      │ loop)     │     │OWASP)    │
    └────┬────┘      └─────┬─────┘     └─────┬────┘
         │                 │                  │
         └─────────────────┼──────────────────┘
                           │
                    ┌──────▼──────┐
                    │ ULTRA REVIEW│  Adversarial parallel code review
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   SHIP      │  Deploy + verify
                    └─────────────┘
```

The 7 pillars fire automatically based on context — not all at once, but
the right ones for the task.

---

## Activation Triggers

The agent should load this skill when the user says ANY of:
- "/godmode", "/godmode:<skill>", "use god mode", "god mode"
- "run the loop", "measure optimize iterate"
- "scout the codebase", "code mine", "mine patterns"
- "ultra review", "adversarial review"
- Any task where disciplined iteration is needed (perf, security, bug fixes)

---

## The 7 Pillars

### 1. GUIDELINES — Authoring Discipline (every edit)

Before every Edit, run the Karpathy prelude:

```
1. THINK BEFORE CODING
   - State assumptions in one line
   - Surface alternatives — never pick silently
   - Emit NEEDS_CONTEXT on ambiguity

2. SIMPLICITY FIRST (Pre-MODIFY checklist)
   - List every function/class/import/constant you plan to add
   - For each: single-use? impossible-case? unrequested config?
   - Strike any YES. Inline, delete, or skip.
   - If >5 items for <20 changed lines → approach is too complex

3. SURGICAL CHANGES (Line-trace rule)
   - Every semantically changed line must trace to user's request
   - Out of scope: adjacent improvements, formatting churn,
     renames for consistency, dead code deletion
   - These are line_scope_drift — drop before commit

4. GOAL-DRIVEN EXECUTION
   - Success = shell command exiting zero
   - Reject "works well", "looks good", "is faster" — replace
     with a measurable command
```

### 2. WORKFLOWS — The Loop + Phase Chain

**The Universal Loop** (for iterative skills: optimize, fix, secure):
```
round = 0
baseline = measure(metric_cmd)   # 3x median

WHILE goal_not_met AND budget_not_exhausted:
    round += 1
    REVIEW   — read state: files, results.tsv, git log -5
    IDEATE   — propose ONE atomic change
    MODIFY   — implement, commit immediately
    VERIFY   — run guard (test_cmd && lint_cmd && build_cmd)
              run metric_cmd 3x, take median
    DECIDE   — KEEP (improved + guard passed)
               DISCARD (worse OR guard failed)
               git reset --hard HEAD~1 on discard
    LOG      — append to .godmode/<skill>-results.tsv
```

**Keep / Discard Rules**:
| Condition | Verdict |
|---|---|
| metric improved AND guard passed | KEEP |
| metric worsened OR guard failed | DISCARD |
| +5 lines AND improvement < 0.5% | DISCARD (complexity tax) |
| same metric + fewer lines | KEEP (simplification) |

**Phase Chain** (for full features):
```
THINK → PLAN → BUILD → TEST → FIX → REVIEW → OPTIMIZE → SECURE → SHIP
```
Auto-detect phase based on state. After each phase, chain to next.

**Stop Conditions** (stop when FIRST is true):
- `target_reached` — metric hits goal
- `budget_exhausted` — max iterations consumed
- `diminishing_returns` — last 3 keeps each < 1%
- `stuck` — 5+ consecutive discards (after recovery)

**Stuck Recovery** (4-step):
```
Step 0: DIAGNOSE — read last 3 diffs + test output, write 2-sentence diagnosis
Step 1: try OPPOSITE approach
Step 2: try RADICAL rewrite
Step 3: accept defeat, log "stuck", report best
```

### 3. SUBAGENTS — 7 Specialized Roles

| Agent | Role | When to Dispatch |
|---|---|---|
| **planner** | Decomposes goals → parallel tasks | Before BUILD on anything >2 files |
| **builder** | Implements tasks with TDD | When plan exists with unimplemented tasks |
| **reviewer** | Code review: correctness, security, perf, style | After BUILD/TEST pass |
| **optimizer** | measure → modify → verify loop | When metric exists and can improve |
| **explorer** | Read-only codebase reconnaissance | Before any change in unfamiliar code |
| **security** | STRIDE + OWASP + 4 red-team personas | Before SHIP |
| **tester** | TDD: RED → GREEN → REFACTOR | Alongside BUILD |

**OpenCode execution (sequential)**:
- No parallel agent dispatch → execute agents one at a time
- Branch isolation instead of worktrees:
  ```
  git checkout -b godmode-{task}
  # implement + test
  git checkout main && git merge godmode-{task}
  git branch -d godmode-{task}
  ```

### 4. RESEARCH — Prior-Art Gathering

Auto-dispatch before THINK on non-trivial tasks:
- Task mentions external library/framework
- Scope >5 files
- No existing `.godmode/research.md`

Writes `.godmode/research.md` with:
- Relevant prior art, patterns, gotchas
- API contracts, CVE data (web search)
- Alternative approaches found in similar projects

### 5. ULTRA REVIEW — Adversarial Multi-Round Review

After BUILD is complete, run the full ultra-review protocol:
- Round 1: N parallel reviewers (each with narrow scope)
- Round 2: Cross-review (reviewers try to disprove each other)
- Round 3: Finalization (survivors only)
- Output: SUMMARY.md + TASKS.md with prioritized findings

Each finding: severity (Critical/High/Medium/Low/Lowest) + file:line +
description + fix code + verification command.

### 6. SCOUT — Codebase Reconnaissance

Before touching unfamiliar code:
```
1. Map project structure (top-level dirs, key files)
2. Identify: framework, language, build system, test runner
3. Find existing patterns (pick 3 similar files, read them)
4. List: naming conventions, import style, error handling,
   test style, state management approach
5. Write .godmode/scout-report.md
```

Scout is READ-ONLY. No edits, no suggestions. Pure understanding.

### 7. CODE MINING — Systematic Pattern Extraction

When implementing in an unfamiliar codebase or framework:
```
1. Find 3-5 real examples of similar features/tests
2. Extract: import paths, API calls, error patterns, lifecycle hooks
3. Identify conventions: file naming, folder structure, exports
4. Generate an implicit style guide from existing code
5. Use mined patterns to inform NEW code structure
```

Code Mining answers: "Show me how this codebase does X, so my new code
fits naturally."

---

## Output Format

All godmode output follows:
```
Godmode: stack={stack}, skill={skill}, phase={phase}. Dispatching.
[skill-specific progress]
Godmode: {skill} complete. Next: {next}.
```

For the Loop:
```
Round {N}: {change} → {metric_before} → {metric_after} ({delta}%) [{KEPT|REVERTED}]
```

---

## Logging Standards

All logs go to `.godmode/` in the project root:

| File | Schema | Purpose |
|---|---|---|
| `session-state.json` | `{skill, round, baseline, current_best, stop_reason, ...}` | Resume state |
| `session-log.tsv` | `timestamp \t skill \t rounds \t kept \t discarded \t stop_reason` | Session history |
| `<skill>-results.tsv` | `round \t change \t before \t after \t delta% \t status \t lines` | Per-skill metrics |
| `<skill>-failures.tsv` | `round \t change \t delta% \t failure_class \t reason \t files` | Failure memory |
| `research.md` | Free-form research output | Prior art |
| `scout-report.md` | Free-form scout output | Codebase map |
| `lessons.md` | Bulleted lessons learned | Cross-session memory |
| `token-log.tsv` | `round \t input_tok \t output_tok \t ...` | Token observability |

### Failure Classes (exactly one per discard)

| Class | When |
|---|---|
| `measurement_error` | Metric non-deterministic (stdev > delta) |
| `noise` | Delta within variance threshold (<0.5%) |
| `regression` | Change broke something unrelated |
| `file_scope_drift` | Touched files outside task.files |
| `line_scope_drift` | Touched right file but added unrelated lines |
| `complexity_tax` | Improvement too small for lines added |
| `infrastructure` | Docker/env/dependency/tooling issue |
| `already_tried` | Similar approach discarded in last 10 rounds |
| `overfitting` | Improvement specific to one case, not generalizable |

---

## Stack Detection

On session start:
```bash
ls package.json pyproject.toml Cargo.toml go.mod Gemfile pom.xml 2>/dev/null
ls yarn.lock pnpm-lock.yaml uv.lock package-lock.json 2>/dev/null
$test_cmd --version 2>/dev/null; $lint_cmd --version 2>/dev/null
```

| Files | Stack | test_cmd | lint_cmd | build_cmd |
|---|---|---|---|---|
| package.json + tsconfig.json | TypeScript | npx vitest | eslint --fix | tsc --noEmit |
| pyproject.toml | Python | pytest | ruff check . | — |
| Cargo.toml | Rust | cargo test | cargo clippy | cargo build |
| go.mod | Go | go test ./... | golangci-lint | go build ./... |

---

## Hard Rules

1. **Scout before edit.** Never modify unfamiliar code without recon first.
2. **Guidelines on every edit.** Think → Simplicity → Surgical → Goal. No exceptions.
3. **Commit before verify.** Every MODIFY → `git commit`. Revert on failure.
4. **Never leave broken commits.** Discard = `git reset --hard HEAD~1`.
5. **Classify every discard.** Append to failures.tsv with one of 9 classes.
6. **Log every round.** Append to results.tsv before next IDEATE.
7. **Goal = shell command, not vibe.** Reject subjective criteria.
8. **Chain phases.** After each phase, advance to next in THINK→PLAN→BUILD→TEST→FIX→REVIEW→OPTIMIZE→SECURE→SHIP.
9. **Never ask to continue.** Loop autonomously until stop condition.
10. **Progressive Disclosure.** Load Tier 1 only for routing, Tier 2 on match, Tier 3 on edge case.

---

## Error Recovery

| Failure | Action |
|---|---|
| No stack match | Ask user for commands. Cache. |
| Skill file missing | List closest available. Fall back to protocol only. |
| Stuck in loop (>5 discards) | DIAGNOSE → opposite → radical → accept defeat. |
| Noisy metric (>5% variance) | 10 runs, trim outliers, median of 8. |
| Merge conflict | Discard agent work, re-queue narrower scope. |
| Guard fails post-merge | Run fix (max 2), else revert + re-queue. |

---

## Reference

- Godmode repo: https://github.com/arbazkhan971/godmode (134 skills, 7 agents)
- Karpathy authoring discipline: https://github.com/arbazkhan971/godmode/blob/master/skills/principles/SKILL.md
- Godmode OpenCode adapter: https://raw.githubusercontent.com/arbazkhan971/godmode/master/OPENCODE.md
- Ultra Review skill: Already installed at skills/ultra-review/
