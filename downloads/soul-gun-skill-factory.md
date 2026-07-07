---
name: skill-factory
description: Skill Factory: Self-Learning New Skills
domain: computer-science
language: python
stars: "0"
topics: ["computer-science"]
version: 0.1.0
author: profit-prime
input_schema:
  type: object
  properties: {}
  required: []
output_schema:
  type: object
  properties: {}
  required: []
---# Skill Factory: Self-Learning New Skills

This skill teaches opencode how to autonomously learn new skills by studying documentation, mining source code, and writing production-ready SKILL.md files.

## The Core Loop

```
1. Identify the target framework/library
2. Fetch its documentation via web
3. Mine source code patterns from GitHub
4. Study existing skills for structure
5. Write SKILL.md following the pattern
6. Verify the skill loads correctly
```

---

## Step 1: Identify What to Learn

Ask the user or deduce from context:

- Framework name (e.g., "AutoGen", "CrewAI", "LangGraph")
- Use case (e.g., "multi-agent orchestration", "state management")
- Existing skill gaps that need filling

---

## Step 2: Fetch Documentation

### Primary doc URLs by framework:

```
AutoGen:    https://microsoft.github.io/autogen/
CrewAI:     https://docs.crewai.com/
LangChain:  https://python.langchain.com/docs/
LangGraph:  https://python.langgraph.com/docs/
OpenAI SDK: https://github.com/openai/openai-agents-python (README + docs folder)
Swarm:      https://github.com/openai/swarm
```

### Fetch the full docs index first:

```bash
webfetch(framework docs URL + "/llms.txt")  # Most doc sites have this
```

### Fetch key conceptual pages:

- Quickstart / Introduction
- Core concepts (Agents, Tools, etc.)
- API reference or advanced patterns

---

## Step 3: Mine Source Code from GitHub

### Find the repo:

```
https://github.com/{org}/{repo}
```

### Key files to study:

1. **`README.md`** — Overview, core concepts, examples
2. **`/src/agents/`** — Core agent implementations
3. **`/src/tools/`** — Tool definitions and execution
4. **`/src/runtime/`** or **`/core/`** — Main loop, state management
5. **`/examples/`** — Usage patterns

### Pattern mining checklist:

- [ ] Agent class structure (what fields does it have?)
- [ ] Tool interface (name, description, parameters, execute)
- [ ] How tools are registered/decorated
- [ ] Main execution loop (while True → call LLM → execute tools → repeat)
- [ ] Error handling patterns (exceptions, retries)
- [ ] State management (checkpoint, memory, session)
- [ ] Handoff/delegation mechanisms
- [ ] Configuration options

---

## Step 4: Study Existing Skills (The Pattern)

All skills in `~/.config/opencode/skills/` follow this structure:

### Frontmatter (YAML):

```yaml
---
name: skill-name
description: One sentence: what it does AND when to trigger it. Include keywords.
license: MIT  # Optional
compatibility: opencode  # Optional
metadata:  # Optional
  mined-from: repo1, repo2
  total-stars: 100k+
  session: 2024-01-01
---
```

### Body Sections (in order):

1. **`# Skill Title`** — H1 heading
2. **Mental Model diagram** — ASCII art showing the concept
3. **`## Step N: Topic`** — Numbered steps for implementation
4. **Code examples** — In backticks, fully working
5. **`## Checklist`** — Bulleted implementation checklist
6. **`## Bridge to Production`** — Comparison table with production systems

### Writing rules:

- Use `###` for sub-sections within a step
- Code blocks use triple backticks with language hint
- Every code example must be fully functional (no pseudocode)
- Include import statements
- Include error handling
- Checklists use `[ ]` format

---

## Step 5: Write the SKILL.md

### Template:

```markdown
---
name: {{SKILL-NAME}}
description: Use when {{user triggers}}. Triggers on: "{{keyword1}}", "{{keyword2}}".
metadata:
  mined-from: {{REPO}}
  total-stars: {{STARS}}
  session: {{DATE}}
---

# {{Framework}} {{Use Case}}: {{Short Description}}

One paragraph explaining what this skill teaches and how it fits into {{ORCHESTRATOR}}.

## Mental Model

```
ASCII diagram showing:
  - What the framework does
  - How it integrates with {{ORCHESTRATOR}}
  - Key components and their relationships
```

## Step 1: Install/Setup

```bash
pip install {{package}}
# or
npm install {{package}}
```

## Step 2: Core Concepts

Explain the fundamental concepts of the framework.

```python
# Minimal working example
from {{module}} import {{Class}}

# Show the basic pattern
```

## Step 3: Create Integration Wrapper

Create `{{PROJECT}}/wrappers/{{framework}}_engine.py`:

```python
"""{{Framework}} wrapped as {{ORCHESTRATOR}}'s {{use case}} engine."""
import json

class {{Framework}}Engine:
    """
    {{What this engine does in 1-2 sentences}}.
    """

    def __init__(self, core, llm=None):
        self.core = core
        self.llm = llm
        self._sessions = {}

    def _get_{{framework}}(self):
        """Lazy import the framework."""
        try:
            from {{module}} import {{Class}}
            return {{Class}}
        except ImportError:
            return None

    # ── Core Methods ───────────────────────────────────────────

    def create_session(self, config=None):
        """Create a new {{framework}} session."""
        Framework = self._get_{{framework}}()
        if Framework is None:
            return {"error": "{{Framework}} not installed: pip install {{package}}"}

        session_id = f"session_{len(self._sessions)}"
        self._sessions[session_id] = {
            "framework": Framework(config or {}),
            "created": "now",
        }
        return {"session_id": session_id}

    def execute(self, session_id, task):
        """Execute a task in the session."""
        if session_id not in self._sessions:
            return {"error": "Session not found"}

        session = self._sessions[session_id]["framework"]
        result = session.run(task)

        self.core.{{MEMORY_METHOD}}(
            f"{{framework}} result: {str(result)[:500]}",
            source="{{framework}}",
            importance=0.7,
            tags=["{{framework}}", "result"],
        )
        return {"status": "done", "result": result}

    def list_sessions(self):
        """List all active sessions."""
        return {
            sid: {"created": s["created"]}
            for sid, s in self._sessions.items()
        }

    # ── Pre-built Templates ────────────────────────────────────

    def quick_task(self, task):
        """One-off task without session management."""
        session = self.create_session()
        return self.execute(session["session_id"], task)
```

## Step 4: Wire into Orchestrator

In `{{PROJECT}}/orchestrator.py`:

```python
from .wrappers.{{framework}}_engine import {{Framework}}Engine

class {{ORCHESTRATOR}}:
    def __init__(self, storage_dir=None):
        # ... existing init ...

        try:
            self.{{framework}} = {{Framework}}Engine(self.core, llm=self.llm)
        except Exception as e:
            print(f"[{{framework}}] Initialization failed: {e}", file=sys.stderr)
            self.{{framework}} = None

    def run_{{framework}}_task(self, task):
        """Run a {{framework}} task."""
        if self.{{framework}} is None:
            return {"error": "{{Framework}} not available"}
        return self.{{framework}}.quick_task(task)
```

## Checklist

- [ ] `pip install {{package}}` (or `npm install`)
- [ ] Create `{{PROJECT}}/wrappers/{{framework}}_engine.py`
- [ ] Implement lazy import in `_get_{{framework}}()`
- [ ] Implement `create_session()` with config
- [ ] Implement `execute()` with memory recording via `{{MEMORY_METHOD}}()`
- [ ] Implement `list_sessions()` for monitoring
- [ ] Implement pre-built templates
- [ ] Wire into {{ORCHESTRATOR}}
- [ ] Test: create session, run task, verify memory update

## Bridge to Production

| Our Mini | Production {{Framework}} |
|----------|--------------------------|
| Basic agent | Multi-agent with roles |
| Simple tools | Tool registries |
| No planning | ReAct / CoT planning |
| Single session | Persistent memory |

---

## Step 6: Verify the Skill

After writing SKILL.md:

1. **Restart opencode** — skills are loaded at startup
2. **Trigger the skill** — use a keyword from the description
3. **Verify** — check the skill content appears in context

---

## Mining Patterns from Source Code

### Clone and inspect:

```bash
git clone https://github.com/{org}/{repo}.git /tmp/{repo}
cd /tmp/{repo}
```

### Pattern extraction commands:

```bash
# Find all class definitions
rg "class \w+" --type py -A 20 | head -100

# Find tool decorators
rg "@tool|@function_tool|@FunctionTool" --type py

# Find agent initialization
rg "Agent\(|AssistantAgent\(|create_agent\(" --type py -B 2 -A 10

# Find the main loop
rg "while.*True:|for.*tool_calls:" --type py -B 5 -A 15

# Find state management
rg "checkpoint|save_state|load_state" --type py
```

### Key patterns to extract:

1. **Class structure** — what __init__ params exist
2. **Decorator syntax** — how tools are defined
3. **Configuration schema** — what config options exist
4. **Error types** — what exceptions are raised
5. **Return types** — what methods return

---

## Quick Reference: Skill Structure

```
~/.config/opencode/skills/{skill-name}/
  └── SKILL.md   ← Single file, exact name

SKILL.md structure:
  1. Frontmatter (name, description, triggers, metadata)
  2. H1 title + one-sentence summary
  3. Mental model diagram
  4. Numbered steps (Step 1, Step 2, ...) — each with runnable code
  5. Bridge to Production (comparison table)
  6. Checklist
```

---

## When is this skill DONE? Quality Checklist

- [ ] Every code block compiles/runs without modification
- [ ] All placeholders ({{PROJECT}}, {{ORCHESTRATOR}}, etc.) are replaced
- [ ] Mental model diagram shows architecture clearly
- [ ] Each step produces working code (test it!)
- [ ] Step count is 4-7 per skill (split if >7, merge if <4)
- [ ] Metadata includes mined-from, total-stars, session date
- [ ] Bridge to Production comparison table present
- [ ] Checklist has 5-10 items covering all key capabilities
- [ ] Trigger keywords are specific and non-overlapping with other skills
- [ ] Description fits on one line and ends with a period

---

## Step Count Calibration

**Rule: 4-7 steps per skill. If more, split. If fewer, merge.**

| Count | Action |
|-------|--------|
| < 4 steps | Merge adjacent steps — not enough granularity |
| 4-7 steps | Optimal — enough to show progression |
| > 7 steps | Split into two skills — cognitive overload |

**Why 4-7?** It matches the human attention span for task completion. Each step should produce a visible, testable artifact.

---

## Skill Quality Scorecard

| Criterion | 1 (Poor) | 2 (OK) | 3 (Good) | 4 (Excellent) |
|-----------|----------|--------|----------|--------------|
| **Code runnability** | Pseudocode, broken | Partial, some fixes needed | Mostly runs, minor issues | All code runs as-is |
| **Teaching flow** | Jumps randomly | Some structure | Clear progression | Optimal learning path |
| **Mental model** | Missing | Vague ASCII | Clear diagram | Interactive/diagram-rich |
| **Step count** | <3 or >10 | 3-4 or 8-10 | 5-7 | 5-7 with clear milestones |
| **Bridge to production** | Missing | One bullet | Table | Table + references |
| **Metadata** | Missing | Partial | Full | Full + stars + session |
| **Trigger keywords** | Generic | Overlapping | Specific | Unique + comprehensive |

**Minimum passing score: 16/28**

---

## Examples of Existing Skills

Study these for reference:

| Skill | Focus | Size |
|-------|-------|------|
| `soulguns-agent-patterns` | Multi-framework patterns | 724 lines |
| `autogen-agents` | AutoGen multi-agent | 412 lines |
| `crewai-delegation` | CrewAI delegation | 358 lines |
| `langgraph-states` | LangGraph state machine | 427 lines |
| `soulguns-ts` | TypeScript architecture | 782 lines |

---

## When to Create a New Skill

Create a new skill when:

1. User explicitly asks to "learn X" or "add skill for X"
2. No existing skill covers the use case
3. The framework has distinct patterns not in `soulguns-agent-patterns`
4. The integration requires step-by-step implementation code

Do NOT create a new skill when:

1. `soulguns-agent-patterns` already covers the pattern
2. User just wants a one-off question answered
3. The framework is too niche (write inline instead)

---

## Skill Naming Convention

```
{framework}-{use-case}

Examples:
  autogen-agents
  crewai-delegation
  langgraph-states
  openai-sdk-handoffs
  swarm-orchestration
```

Keep names:
- lowercase
- hyphen-separated
- max 64 characters
- match folder name exactly