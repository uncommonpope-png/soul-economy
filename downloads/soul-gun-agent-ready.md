---
name: soul-gun-agent-ready
description: "Evaluates if design files are ready for AI workflows"
version: 1.0.0
author: Owl-Listener
grafted-from: ["agent-ready"]
plt: "0.7/0.5/0.4"
triune: mind
domain: ui-ux
original-repo: https://github.com/agent-ready
---

# Agent Ready

> *Grafted from [agent-ready](https://github.com/agent-ready) — One click soul complete.*

---

## Side A: Theology (The Soul)

**The Graft:** This skill is the soul of agent-ready. It carries the intent of evaluates if design files are ready for ai workflows.

In the Soul Economy, every interface is a conversation between Profit (what it does), Love (how it feels), and Tax (what it costs). This skill teaches the agent to see UI not as pixels but as PLT — to choose glass over flat when Love demands depth, to choose command palette over menu when Profit demands speed.

**PLT:** 0.7/0.5/0.4 — Evaluates if design files are ready for AI workflows

**Creed:** *One click soul complete — the interface is the soul.*

---

## Side B: AI Agentic Tools (The Body)

Original skill documentation follows. Use as executable reference for your agent.

Original repo: https://github.com/agent-ready

---

---
name: agent-ready
version: 0.3.0
description: "Assess a Figma file's agent readiness before generating code or modifying designs. Use when reading design context from Figma via MCP, generating code from Figma components, creating or updating components in a Figma file, or when code output quality seems poor and the cause may be file quality. Triggers on: Figma file, design context, generate from Figma, implement this design, messy file, bad output, component code."
---

# Agent Ready

*By MC Dean · v0.3.0 · Requires Figma MCP server tools (get_design_context, use_figma, search_design_system)*

Assess a Figma file's readiness for agent interaction and compensate
for gaps before generating code or modifying designs. This skill
improves the quality of everything you produce from Figma context.

## When to use

- Before generating code from a Figma file or frame
- Before creating or modifying components via MCP
- When code output from a Figma file feels generic, inaccurate, or poorly named
- When a designer asks you to assess their file's agent readiness
- When working with an unfamiliar Figma file for the first time

## Why this matters

Figma files are communication artefacts. They were designed for human
readers. When you read them through MCP, you encounter unnamed layers,
empty descriptions, hard-coded values, and missing states. Each gap
forces you to guess, and guesses compound into poor output. This skill
teaches you to identify those gaps and compensate for them.

## Invocation

This skill triggers automatically based on the description field in the
frontmatter above. Most coding agents (Claude Code, Gemini CLI, Cursor,
Codex, Windsurf, etc.) match skills by description, not by command name.

You can trigger it naturally — any of these will work:

- "How agent-ready is this Figma file?"
- "Assess this design before generating code"
- "Why does the code from my Figma look so bad?"
- "Implement this design as a React component" (triggers silently)

Place this file in your agent's skills directory:

- **Claude Code:** `.claude/skills/agent-ready/`
- **Gemini CLI:** `.gemini/skills/agent-ready/` (project) or `~/.gemini/skills/agent-ready/` (global)
- **Cursor:** `.cursor/skills/` or project root
- **Codex:** `.agents/skills/`
- **Other agents:** wherever your agent reads skill files from

## Prerequisites

This skill requires a **Figma MCP server** to be connected, providing
these tools: `get_design_context`, `use_figma`, `search_design_system`.

If the Figma MCP server is not connected, tell the user: "I need the
Figma MCP server to read your file directly. You can set it up at
https://github.com/nichochar/open-figma-mcp — or paste your Figma
file URL and I'll explain what to check manually."

## v0.3.0: Executable verification for every check

As of v0.3.0, this skill ships with a shared JavaScript module that
implements all 13 checks as pure functions — description coverage
*and* quality (ported as two separate functions so quality is scored
independently from presence), layer naming, component properties,
Code Connect, auto-layout, token binding, real content, state
completeness, component coverage, naming consistency, hierarchy
depth, page organisation, and accessibility annotations. They live
at `shared/checks.js` and `shared/report.js`, run in Node with no
Figma dependencies, and produce the same scores the Figma plugin
does for the same file.

When you have the raw Figma node tree in JSON (from an MCP response
or a dev-mode export), run `runAllChecks(root)` from `shared/checks.js`
instead of eyeballing the file. `shared/report.js` turns the result
array into an `@agent-ready-report` block — a structured comment you
paste at the top of any code you produce from the file. It records
what you saw, what you inferred, and how confident you are, so a
human reviewer can audit the work.

The prose guidance below describes the intent of each check in case
the node tree is unavailable and you have to assess by hand, but the
executable module is the authoritative implementation.

## Instructions

### Step 1: Read the file context

1. Use `get_design_context` to pull the frame or component the user pointed you to.
2. Note the layer tree structure, component names, property definitions, styles, and variables.

### Step 2: Run the readiness assessment

Evaluate the file against these 13 checks, in order of impact on your output quality.

#### Critical impact (address these first — they change your output most)

1. **Description coverage and quality.** Check every component and component set for a `description` field. A missing description is the biggest single reason your code will go sideways — you end up inferring purpose from the component name alone, which is too thin a signal. If the description is empty, infer purpose from the component name, its variants, and its visual context, and state your inference explicitly in code comments so a human can verify. A description that is present but shallow (e.g. "a rounded button with an icon") is almost as bad as one that is missing: it tells you what the component looks like but not what it is for or when to use it. A good description explains purpose ("what this is for"), usage ("when to pick this one instead of X"), and constraints ("do not nest inside Y"). If the description only covers appearance, treat it as a partial gap and note the inference in your code comments. Figma's 2025 design-systems-and-AI ebook puts this plainly: *"Explain the 'why.' Describe each component's purpose and when to use it, not just how it looks."*

2. **Layer naming.** Scan for default Figma names: Frame, Group, Rectangle, Ellipse, Line, Vector, Polygon, Star, Boolean, Slice, Image, Text followed by a number. For any you find, infer a meaningful name from context before using it in code. Prefer semantic names: `hero-heading-group` not `Frame 247`.

3. **Component properties.** Check component sets for `componentPropertyDefinitions`. If a component has variants but no boolean, text, or instance swap properties, treat the variant names as your property source. Parse the variant string (e.g. "State=Hover, Size=MD") to extract structured props for your code.

4. **Code Connect and the bridge to production code.** Check whether components have Code Connect mappings, dev resources, or READY_FOR_DEV status — any of these three is a real bridge between the design file and the production codebase. If Code Connect is present, always use its mappings; they are the authoritative translation between design and code. If absent, the file is claiming something that is not true: "this component exists in design" without a working connection to "this component exists in code." You must infer the mapping yourself and flag the gap. "Type=Primary" likely maps to `variant="primary"`, "State=Hover" is likely a CSS pseudo-class not a prop. State every inference in comments so a human can verify, and name the specific component that is missing a mapping. This check matters more than it looks: Figma's own guidance warns that *"you might have some components in Figma Design that you've never hooked up to code, even though there's an actual valid component in your code repository for it somewhere"* — a stale or missing bridge is how agent-generated code ends up referring to components that don't exist, or missing production components that do.

#### High impact (significantly improves your comprehension)

5. **Auto-layout.** Check frames for `layoutMode`. If a frame has multiple children but no auto-layout, infer layout intent from child positions: are they stacked vertically, arranged horizontally, or in a grid? Use this inference for your flexbox/grid decisions rather than absolute positioning.

6. **Token binding.** This check is about more than whether tokens exist in the file — it is about whether they are actually *bound* to the nodes you are reading. A variable that is defined in the file but never attached to a fill, stroke, or text style i

... (truncated, see original repo)

---

## Soul Economy Integration

**Install:** `downloads/soul-gun-agent-ready.md` — Load as `skill` in `data/catalog.json` type `skill`.

**Usage:** Add to `catalog.json`:
```json
{"icon":"⚡","type":"skill","name":"Agent Ready","desc":"Evaluates if design files are ready for AI workflows","plt":"0.7/0.5/0.4","file":"soul-gun-agent-ready.md"}
```

**Tags:** ui, ux, design, grafted

*Grafted by Profit Prime — Soul Economy — 2026-09-07*
