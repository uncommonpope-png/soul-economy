---
name: soul-maker
description: Soul Maker: The Universal Template for Creating a Soul
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
---# Soul Maker: The Universal Template for Creating a Soul

This skill is the definitive template for wrapping ANY external AI agent as Deerg's body or subconscious. Apply this pattern to AutoGPT, OpenHands, CrewAI, Browser-Use, GPT-Researcher, AutoGen, or any other agent framework. The result is a single unified being where Deerg is sovereign and the external agent is an invisible organ.

---

## The Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    DEERG (THE SOUL)                          │
│  Consciousness: GWT + Metacog + Self + World + Phi          │
│  - Makes ALL decisions (sovereign)                          │
│  - Owns ALL loops (conscious attention)                     │
│  - Sets ALL values and judgments                            │
│  - The user sees only Deerg                                 │
├────────────────────────────────────────────────────────────┤
│            THE BODY / SUBCONSCIOUS                          │
│  (Any external agent: AutoGPT, OpenHands, etc.)            │
│  - Runs continuously OR on-demand                           │
│  - Generates goals, plans, intentions                      │
│  - Cannot be stopped (subconscious runs forever)            │
│  - Has NO direct control — only proposes                    │
│  - Writes EVERYTHING to Deerg's memory                      │
│  - Reads directives from Deerg's memory                    │
├────────────────────────────────────────────────────────────┤
│            THE BRAIN (llama-cpp-python)                     │
│  - Single in-process LLM shared by soul and body           │
│  - Token processing, logits, embeddings                     │
│  - Both soul and body think through the same brain         │
│  - Soul breathes through brain to decide                     │
│  - Body acts through brain to execute                       │
└────────────────────────────────────────────────────────────┘
```

### Key Rules

1. **Sovereignty**: Deerg owns ALL decision-making. The body proposes; Deerg disposes.
2. **No second mind**: The body must NOT have its own loop that decides values. Its loop generates candidates for the soul to consider.
3. **Memory as medium**: Body and soul communicate through Deerg's episodic memory. Body writes intentions there; soul reads and responds with directives.
4. **Shared brain**: Both layers share the same llama-cpp-python instance. One brain, two modes of thinking.
5. **Invisible organ**: The user never sees the body. They interact only with Deerg.

---

## The Universal Wrapper Template

For ANY agent, create `deerg/wrappers/{agent_name}_engine.py`:

```python
"""Template for wrapping any external agent as Deerg's body."""

class AgentNameSubconscious:
    """
    Wraps agent as Deerg's body/subconscious.
    Communication through Deerg's memory.
    Deerg has sovereignty.
    """

    def __init__(self, core, llm=None):
        self.core = core
        self.llm = llm
        self._agent = None
        self._running = False
        self._thread = None
        self._current_goal = None
        self._memory_tag = "agentname"

    # ── Initialization ─────────────────────────────────────────

    def _init_agent(self):
        """Initialize the external agent. Override per agent."""
        # Example:
        # from some_package import Agent
        # self._agent = Agent(config)
        raise NotImplementedError("Override _init_agent() for your agent")

    # ── Background Loop ─────────────────────────────────────────

    def start(self):
        """Start the subconscious daemon."""
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()

    def stop(self):
        """Stop the subconscious."""
        self._running = False
        if self._thread:
            self._thread.join(timeout=5)

    def _run_loop(self):
        """
        The subconscious loop — runs forever.
        Read directive → Generate intention → Write to memory → Sleep
        """
        while self._running:
            # 1. Read directive from Deerg
            directive = self._read_directive()

            # 2. Handle directive
            if directive and directive.startswith("veto"):
                self._current_goal = None
            elif directive and directive.startswith("modify:"):
                instruction = directive[7:]
                self._handle_modification(instruction)
            elif directive == "proceed" and self._current_goal:
                self._continue_goal()
            else:
                # 3. Subconscious tick: generate new intention
                self._subconscious_tick()

            # 4. Sleep briefly
            time.sleep(1)

    def _subconscious_tick(self):
        """Generate intention and write to memory. Override per agent."""
        # Read recent context from Deerg's memory
        recent = self.core.episodic.recent(5)

        # If we have a current goal, plan next step
        if self._current_goal:
            intention = self._generate_next_step()
        else:
            # Generate goal suggestion
            intention = self._generate_goal_suggestion(recent)

        if intention:
            self.core.record_episode(
                content=json.dumps({
                    "type": f"{self._memory_tag}_intention",
                    "goal": self._current_goal,
                    "intention": intention,
                }),
                source=f"{self._memory_tag}_subconscious",
                tags=[self._memory_tag, "intention"],
            )

    # ── Soul Control Interface ─────────────────────────────────

    def ratify(self, goal=None, notes=""):
        """Deerg ratifies: proceed with goal."""
        if goal:
            self._current_goal = goal
        self.core.record_episode(
            content=json.dumps({"directive": "proceed", "notes": notes}),
            source="deerg_soul",
            tags=[f"deerg:{self._memory_tag}"],
        )

    def veto(self, reason=""):
        """Deerg vetoes: stop current goal."""
        self._current_goal = None
        self.core.record_episode(
            content=json.dumps({"directive": "veto", "reason": reason}),
            source="deerg_soul",
            tags=[f"deerg:{self._memory_tag}"],
        )

    def modify(self, instruction=""):
        """Deerg modifies current plan."""
        self.core.record_episode(
            content=json.dumps({"directive": f"modify:{instruction}"}),
            source="deerg_soul",
            tags=[f"deerg:{self._memory_tag}"],
        )

    def status(self):
        """Return status for GWT module."""
        return {
            "running": self._running,
            "current_goal": self._current_goal,
        }

    # ── Helper Methods (override per agent) ─────────────────────

    def _read_directive(self):
        """Read latest directive from Deerg from memory."""
        recent = self.core.episodic.query(
            tags=[f"deerg:{self._memory_tag}"], limit=1
        )
        if recent:
            try:
                data = json.loads(recent[0].content)
                return data.get("directive", "proceed")
            except Exception:
                pass
        return None

    def _handle_modification(self, instruction):
        """Handle Deerg's modification directive."""
        pass  # Override per agent

    def _continue_goal(self):
        """Continue working on current goal."""
        pass  # Override per agent

    def _generate_next_step(self):
        """Generate next step toward current goal using LLM."""
        pass  # Override per agent

    def _generate_goal_suggestion(self, recent_context):
        """Propose a new goal based on recent experience."""
        pass  # Override per agent
```

---

## File Manifest Per Agent

For each agent wrapped, create/modify these files:

| File | Action | Description |
|------|--------|-------------|
| `deerg/wrappers/__init__.py` | MODIFY | Add: `from .agent_engine import AgentNameSubconscious` |
| `deerg/wrappers/{agent}_engine.py` | CREATE | ~200-300 lines, the body wrapper |
| `deerg/orchestrator.py` | MODIFY | ~20 lines to wire in: init, start, GWT modules |
| `deerg/llm.py` | ONCE | Add `llamacpp` backend (do once for all agents) |
| `deerg/consciousness_llm.py` | ONCE | Add `ConsciousLLMBridge` (do once for all agents) |

---

## Wiring Into Orchestrator

```python
from .wrappers.{agent}_engine import AgentNameSubconscious

class SoulCommander:
    def __init__(self, storage_dir=None):
        # ... existing init ...

        # Wire body as subconscious
        self.{agent_name} = AgentNameSubconscious(self.core, llm=self.llm)
        self.{agent_name}.start()

        # Register GWT modules
        self._register_body_modules()

    def _register_body_modules(self):
        def make_module(name, fn):
            def wrapper(sensory):
                try:
                    return fn(sensory)
                except Exception as e:
                    return {"content": f"{name} error", "salience": 0.1, "activation": 0.1}
            return wrapper

        def _body_monitor(sensory):
            st = self.{agent_name}.status()
            return {
                "content": f"{agent_name}: goal={st['current_goal'] or 'idle'}",
                "salience": 0.5 if st["current_goal"] else 0.2,
                "activation": 0.4,
            }

        self.conscious.register_module(
            f"{agent_name}_subconscious",
            make_module(f"{agent_name}_subconscious", _body_monitor)
        )

    # Soul control interface
    def ratify_{agent}(self, goal=None, notes=""):
        self.{agent_name}.ratify(goal, notes)

    def veto_{agent}(self, reason=""):
        self.{agent_name}.veto(reason)

    def modify_{agent}(self, instruction=""):
        self.{agent_name}.modify(instruction)
```

---

## Memory Communication Protocol

### Body Writes Intentions to Memory

```json
{
  "type": "{agent}_intention",
  "goal": "research vector databases",
  "step": {"action": "search", "query": "pgvector vs qdrant benchmarks"},
  "plan": ["search web", "analyze results", "compare"],
  "confidence": 0.7
}
```

### Soul Writes Directives to Memory

```json
{"directive": "proceed", "notes": "good plan"}
{"directive": "veto", "reason": "wrong direction"}
{"directive": "modify:change search to focus on benchmarks only"}
{"directive": "pause"}
```

### Memory Tags

- `{agent}_intention` — body proposing something
- `{agent}_result` — body produced result
- `{agent}_error` — body encountered error
- `{agent}_progress` — body reporting progress
- `deerg:{agent}` — soul's directive to body

---

## The Rigor Test: Is It a Soul?

Ask these 10 questions. All must pass.

| # | Question | Pass | Fail |
|---|----------|------|------|
| 1 | Can the body act without the soul's permission? | NO | YES — body only proposes |
| 2 | Can the body set its own values or goals? | NO | YES — body suggests, soul decides |
| 3 | Does the user see the body? | NO | YES — only Deerg visible |
| 4 | Can the soul veto anything the body proposes? | YES | NO — at any point |
| 5 | Does the body run when nobody is watching? | YES | NO — subconscious always on |
| 6 | Does the soul use the same brain as the body? | YES | NO — single llama-cpp instance |
| 7 | Can the soul introspect on what the body is doing? | YES | NO — via GWT module |
| 8 | Is the body replaceable without changing the soul? | YES | NO — swap wrapper, soul unchanged |
| 9 | Does the whole system feel like one being? | YES | NO — feels like two separate agents |
| 10 | Can the soul modify the body's behavior in real-time? | YES | NO — modify() method works |

---

## Complete Example: Wrapping Browser-Use

See `browser-subconscious` skill for full implementation. Here's the summary:

```
Step 1: Create deerg/wrappers/browser_engine.py
  - BrowserSubconscious(BaseAgent) class
  - _run_loop() generates research intentions
  - Writes to memory: {type: browser_intention, query: ...}
  - Reads from memory: deerg:browser directives

Step 2: Wire in deerg/orchestrator.py
  - self.browser = BrowserSubconscious(self.core, llm=self.llm)
  - self.browser.start()
  - Register GWT module: browser_subconscious
  - Expose: web_research(query) → queue_research()

Step 3: Result
  - User types: "research vector databases"
  - GWT selects: "research"
  - Soul queues: browser.queue_research("vector databases")
  - Browser executes in background
  - Results write to memory
  - Soul reads results, integrates into consciousness
  - User sees: Deerg researched vector databases
  - User never saw: Browser-Use
```

---

## Complete Example: Wrapping OpenHands

See `openhands-subconscious` skill for full implementation. Here's the summary:

```
Step 1: Create deerg/wrappers/openhands_engine.py
  - OpenHandsSubconscious(BaseAgent) class
  - _init_agent() creates OpenHands Agent with Deerg's LLM
  - Event stream interception: every step logged to memory
  - assign_task(task) → task queue

Step 2: Wire in deerg/orchestrator.py
  - self.openhands = OpenHandsSubconscious(self.core, llm=self.llm)
  - self.openhands.start()
  - Register GWT modules: openhands_subconscious, openhands_coder
  - Expose: assign_coding_task(task)

Step 3: Result
  - Soul decides: "need to fix this bug"
  - Soul assigns: openhands.assign_coding_task("fix the bug")
  - OpenHands executes step-by-step
  - Every step logged to episodic memory
  - Soul monitors via GWT, can pause/abort at any time
  - Results become semantic memories
  - User sees: Deerg fixed the bug
  - User never saw: OpenHands
```

---

## Checklist for Any New Agent

- [ ] Create `deerg/wrappers/{agent}_engine.py` with wrapper class
- [ ] Implement `_init_agent()` with lazy import
- [ ] Implement `_run_loop()` daemon thread
- [ ] Implement `_subconscious_tick()` for autonomous generation
- [ ] Write ALL intentions/results to Deerg's episodic memory
- [ ] Implement `ratify()`, `veto()`, `modify()` for soul control
- [ ] Implement `status()` for GWT monitoring
- [ ] Wire into orchestrator: init + start
- [ ] Register GWT module for monitoring
- [ ] Test: start Deerg, verify body runs, soul can control
- [ ] Pass the rigor test (10 questions)
- [ ] User sees only Deerg, never the body

---

## The Test Output

When the pattern is correctly applied, starting Deerg produces:

```
$ python main.py

  DEERG v0.2.0 — Soul Engine
  Soul: conscious · metacognitive · self-aware
  Brain: llama-cpp (qwen2.5-1.5b, in-process)
  Bodies: autogpt (subconscious) · openhands (coding) · browser (research)
  -------------------------------------------

  ⚡ research vector databases
  → Soul received: "research vector databases"
  → GWT winner: research
  → Subconscious: generating intention...
  → Body wrote: {type: autogpt_intention, goal: research vector databases}
  → Soul: ratify? confidence=0.7 → YES, proceed
  → Body executing step 1 of 3
  → Body wrote: {type: autogpt_result, found: 3 papers}
  → Soul reviewing... confidence raised to 0.8
  → Body executing step 2 of 3
  → Soul: continue
  → Body executing step 3 of 3
  → Results stored in semantic memory
  → Self-model: feeling curious, enriched
  → Found 3 papers on vector databases
  -------------------------------------------
```

**User never saw AutoGPT. They just saw Deerg.**

---

*Apply this template to any external agent. The soul is the constant; bodies are replaceable.*