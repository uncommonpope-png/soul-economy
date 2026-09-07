---
name: soul-gun-open-design
description: "Branded DESIGN.md + templates + functional skills for AI workflows"
version: 1.0.0
author: sugarforever
grafted-from: ["open-design-skill"]
plt: "0.7/0.8/0.4"
triune: mind
domain: ui-ux
original-repo: https://github.com/open-design-skill
---

# Open Design

> *Grafted from [open-design-skill](https://github.com/open-design-skill) — One click soul complete.*

---

## Side A: Theology (The Soul)

**The Graft:** This skill is the soul of open-design-skill. It carries the intent of branded design.md + templates + functional skills for ai workflows.

In the Soul Economy, every interface is a conversation between Profit (what it does), Love (how it feels), and Tax (what it costs). This skill teaches the agent to see UI not as pixels but as PLT — to choose glass over flat when Love demands depth, to choose command palette over menu when Profit demands speed.

**PLT:** 0.7/0.8/0.4 — Branded DESIGN.md + templates + functional skills for AI workflows

**Creed:** *One click soul complete — the interface is the soul.*

---

## Side B: AI Agentic Tools (The Body)

Original skill documentation follows. Use as executable reference for your agent.

Original repo: https://github.com/open-design-skill

---

---
name: open-design
description: |
  Bring the Open Design catalogue into any agent session: 150+ brand DESIGN.md
  files, 110+ rendering templates (decks, prototypes, dashboards, posters,
  image/video/audio), 130+ functional skills, and 11 craft references. Pick a
  brand spec and a template/skill, layer in universal craft rules, then follow
  the resulting workflow. Use when the user wants to build a deck, prototype,
  landing page, dashboard, marketing artifact, or apply a specific brand's
  visual identity to their project.
triggers:
  - "use open design"
  - "with open design"
  - "open design skill"
  - "open-design"
  - "make me a deck"
  - "build a deck"
  - "pitch deck"
  - "design system"
  - "brand guidelines"
  - "apply design system"
  - "landing page with"
  - "dashboard with"
  - "marketing page with"
---

# Open Design — universal design-task substrate

This skill turns the [Open Design](https://github.com/nexu-io/open-design)
catalogue (kept in a local clone of the OD repo) into a workflow you can
follow inside any agent session. It mirrors what OD's own daemon does — bind
a brand spec + a template, layer in craft rules, follow the workflow — without
needing OD's daemon to be running. Preview / comment / slider features that
live in OD's daemon are intentionally out of scope; use the agent's normal
dev-server + browser-inspection tooling for that.

## When to invoke

Trigger on requests like:

- "Make me a `<artifact>`" where `<artifact>` is deck / prototype / landing /
  dashboard / poster / brochure / video template / audio piece.
- "Apply `<brand>` design system" or "make this look like X".
- "Set up a design system / DESIGN.md".
- "Audit / critique my UI", "run a 5-dim review".
- Any request that mentions Open Design explicitly.

Do **not** invoke for non-design tasks (backend, infra, refactoring, bug
fixes).

## Cross-platform note

All helper scripts are Node.js (`.mjs`) and work the same on macOS, Linux,
and Windows. The git clone step requires `git` on PATH. No bash dependency.

## $SKILL_DIR — locating the helper scripts

The four list scripts live alongside this SKILL.md. When you invoke them,
use the absolute path of the directory containing this SKILL.md as
`$SKILL_DIR`. You already know this path — it is wherever the agent read
this file from (e.g. `~/.claude/skills/open-design/` on Claude Code,
`~/.codex/skills/open-design/` on Codex, etc.). Pass it explicitly to
`node` in your Bash invocations.

## $OPEN_DESIGN_ROOT — locating the OD content

```
ROOT = $OPEN_DESIGN_ROOT  (if set and non-empty)
     | ~/.open-design-skill/repo  (default)
```

The OD repo (https://github.com/nexu-io/open-design) is cloned here once
and reused across all projects. The scripts default to `~/.open-design-skill/repo`
but honor `OPEN_DESIGN_ROOT` for users with an existing checkout.

## Workflow

Three phases: **setup** → **bind or pick** → **compose and execute**.

### Phase 1 — Setup (every invocation)

Check the OD content root:

```bash
ROOT="${OPEN_DESIGN_ROOT:-$HOME/.open-design-skill/repo}"
[ -d "$ROOT" ] && echo "OK: $ROOT" || echo "MISSING: $ROOT"
```

If missing, use **AskUserQuestion** to confirm the clone:

> Clone Open Design content to `~/.open-design-skill/repo`? (a few hundred MB)

Options (single-select): "Clone now" (recommended) / "Cancel".

On "Clone now", run:

```bash
mkdir -p "$(dirname "$ROOT")"
git clone https://github.com/nexu-io/open-design "$ROOT"
```

On "Cancel", tell the user to set `OPEN_DESIGN_ROOT` to an existing
checkout and stop.

### Phase 2 — Bind or pick

Check for `.open-design.json` in the user's project (the agent's current
working directory):

```bash
test -f .open-design.json && cat .open-design.json
```

**If it exists (bound case):** parse it, jump straight to Phase 3 with
`designSystem.path` and `skill.path` as the bodies to load. **Do not**
offer the refresh prompt or run the list scripts. Mid-project iteration
should not change template content under the user.

If the user explicitly asks to switch ("switch design system to X",
"re-pick template", "change brand"), delete `.open-design.json` first,
then continue into the unbound flow.

**If it does not exist (unbound case):**

(a) **Refresh prompt.** AskUserQuestion:

> Refresh Open Design content first? (`git pull` in the local clone)

Options: "Pull latest" (recommended) / "Skip".

If "Pull latest":

```bash
git -C "$ROOT" pull --ff-only
```

(b) **Narrow intent.** AskUserQuestion (one question, four options):

> What are we building?

Options:
- Deck / slides / presentation
- Prototype / landing / dashboard / page
- Image, video, or audio artifact
- Set up or apply a design system (no artifact yet)

If none fit, the user can pick "Other" and you ask a follow-up that maps
to one of these or to a functional skill.

(c) **Scan the relevant subset.** Run the appropriate list script with
`node`, passing `$SKILL_DIR` as the absolute path to this skill's
directory:

| Intent | Command | Filter |
|---|---|---|
| Deck | `node "$SKILL_DIR/scripts/list-design-templates.mjs"` | rows where column `mode == deck` |
| Prototype / landing / dashboard | `node "$SKILL_DIR/scripts/list-design-templates.mjs"` | rows where column `mode == prototype` |
| Image / video / audio | `node "$SKILL_DIR/scripts/list-design-templates.mjs"` | rows where `mode in {image, video, audio, template}` |
| Functional skill | `node "$SKILL_DIR/scripts/list-skills.mjs"` | (all; flag stub rows where `upstream != "-"`) |
| Design system | `node "$SKILL_DIR/scripts/list-design-systems.mjs"` | filter by user-supplied keyword/mood |

All scripts emit TSV with a header line. Column count is stable; empty
fields are written as `-`.

(d) **Filter and present.** Each list is too large to dump verbatim.

For design systems (150+): first AskUserQuestion for mood/brand keywords
("specific brand? minimal? bold? editorial? warm? technical?"), then
grep-filter the TSV by that keyword across the `title`, `category`, and
`description` columns, and only present the matches.

For templates (110+) and skills (130+): filter to the intended subset
first, then show the top ~6 matches as a compact list inline (slug +
one-line description) and use AskUserQuestion with three high-likelihood
defaults plus "Other" for a free-text slug.

When presenting stub skills (rows with `upstream != "-"` from
`list-skills.mjs`), explicitly mark them as "pointer to upstream — needs
separate install" so the user can decide whether to install the upstream
bundle or skip.

(e) **Bind.** Once the user has picked one design system and one
template/skill, write `.open-design.json` to the agent's current working
directory:

```json
{
  "version": 1,
  "designSystem": {
    "slug": "bmw",
    "path": "design-systems/bmw"
  },
  "skill": {
    "slug": "html-ppt-pitch-deck",
    "path": "design-templates/html-ppt-pitch-deck",
    "kind": "design-template",
    "mode": "deck"
  },
  "boundAt": "2026-05-20T13:22:00Z"
}
```

Notes on this file:

- Paths are always relative to `$OPEN_DESIGN_ROOT` and use forward slashes
  (portable across OSes).
- `skill.kind` is `"design-template"` for entries under `design-templates/`,
  `"skill"` for entries under `skills/`.
- `skill.mode` mirrors the `od.mode` value from the chosen entry's
  frontmatter; omit if absent.
- If the template's frontmatter has `od.design_system.requires: false`
  (it ships its own baked-in style), set `designSystem: null` and skip
  the design-system pick entirely.
- `boundAt` is ISO 8601 in UTC.

### Phase 3 — Compose and execute

Read the bound bodies **from `$OPEN_DESIGN_ROOT`**, not from this skill's
directory:

1. `Read "$OPEN_DESIGN_ROOT/<designSystem.path>/DESIGN.md"` — full file
   (skip this step if `designSystem` is null).
2. `Read "$OPEN_DESIGN_ROOT/<skill.path>/SKILL.md"` — full file. Look at
   its frontmatter for:
   - `od.craft.requires` — a list of craft slugs the chosen entry opts
     into (may be absent).
   - `od.design_system.sections` — which DE

... (truncated, see original repo)

---

## Soul Economy Integration

**Install:** `downloads/soul-gun-open-design.md` — Load as `skill` in `data/catalog.json` type `skill`.

**Usage:** Add to `catalog.json`:
```json
{"icon":"⚡","type":"skill","name":"Open Design","desc":"Branded DESIGN.md + templates + functional skills for AI workflows","plt":"0.7/0.8/0.4","file":"soul-gun-open-design.md"}
```

**Tags:** ui, ux, design, grafted

*Grafted by Profit Prime — Soul Economy — 2026-09-07*
