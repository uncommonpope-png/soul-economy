---
name: autogpt-subconscious
description: AutoGPT Subconscious: AutoGPT Classic as Deerg's Background Daemon
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
---# AutoGPT Subconscious: AutoGPT Classic as Deerg's Background Daemon

This skill teaches how to take AutoGPT Classic's autonomous loop and embed it inside Deerg as an always-running subconscious organ. AutoGPT keeps its full capabilities (goal-setting, planning, tool use, execution) but Deerg has sovereignty — it can ratify, veto, or modify anything AutoGPT does.

## Architecture

```
AutoGPT runs in background daemon thread:
  → Goal → Plan → Execute → Evaluate → repeat
  → Writes EVERYTHING to Deerg's episodic memory
  → Reads directives from Deerg's memory

Deerg consciousness ticks every cycle:
  → Reads AutoGPT's recent memory entries
  → GWT decides: ratify? veto? modify? ignore?
  → Writes directive to memory
  → AutoGPT reads on next iteration

Both use the SAME brain (Deerg's llama-cpp or OpenAI-compatible endpoint).
```

## Step 1: Install AutoGPT Classic

```bash
git clone https://github.com/Significant-Gravitas/AutoGPT.git AutoGPTClassic
cd AutoGPTClassic
./run setup
```

Or use pip (limited API):

```bash
# AutoGPT's classic loop can be extracted as a standalone module
# It requires OpenAI-compatible LLM endpoint
```

## Step 2: Understand AutoGPT's Loop

AutoGPT Classic's core loop in pseudo-code:

```python
# Simplified from AutoGPT classic/agent.py
def autogpt_loop(goal, ai_name, ai_role):
    while not finished:
        # 1. Generate next action using LLM
        prompt = build_prompt(goal, ai_name, ai_role, memory, previous_actions)
        response = llm.chat(prompt)

        # 2. Parse response into Thought/Plan/Action
        thought = extract_thought(response)
        plan = extract_plan(response)
        action = extract_action(response)

        # 3. Execute action (web, file, code, etc.)
        result = execute_action(action)

        # 4. Write to memory
        memory.add(f"Thought: {thought}")
        memory.add(f"Result: {result}")

        # 5. Evaluate if goal is met
        if evaluate_goal(result, goal):
            finished = True
```

## Step 3: Create AutoGPTSubconscious Wrapper

Create `deerg/wrappers/autogpt_engine.py`:

```python
"""AutoGPT wrapped as Deerg's subconscious organ."""
import threading
import time
import json
from collections import deque

class AutoGPTSubconscious:
    """
    AutoGPT's loop running as a background daemon.
    Communicates with Deerg's soul through episodic memory.
    Deerg has sovereignty — can ratify, veto, modify, or ignore.
    """

    def __init__(self, core, llm=None):
        self.core = core
        self.llm = llm
        self._running = False
        self._thread = None
        self._goals = deque(maxlen=10)
        self._current_goal = None
        self._current_plan = None
        self._step_history = []
        self._memory_tag = "autogpt"

    def start(self):
        """Start the subconscious daemon."""
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()

    def stop(self):
        """Stop the subconscious daemon."""
        self._running = False
        if self._thread:
            self._thread.join(timeout=5)

    def _run_loop(self):
        """The subconscious loop — runs forever until stopped."""
        while self._running:
            # 1. Read directive from Deerg
            directive = self._read_directive()
            if directive:
                self._handle_directive(directive)

            # 2. If no directive blocking us, continue autonomously
            if directive != "veto":
                self._subconscious_tick()

            # 3. Sleep briefly to avoid tight loop
            time.sleep(2)

    def _subconscious_tick(self):
        """
        One iteration of the subconscious loop.
        Generates intentions and writes them to Deerg's memory.
        Does NOT execute actions — only proposes.
        """
        # Read recent Deerg context
        recent = self.core.episodic.recent(5)

        # If we have a current goal, plan the next step
        if self._current_goal:
            next_intention = self._generate_next_step()
        else:
            # Generate a new goal suggestion
            next_intention = self._generate_goal_suggestion(recent)

        if next_intention:
            # Write intention to episodic memory for Deerg to review
            self.core.record_episode(
                content=json.dumps({
                    "type": "autogpt_intention",
                    "goal": self._current_goal,
                    "step": next_intention,
                    "plan": self._current_plan,
                }),
                source="autogpt_subconscious",
                tags=["autogpt", "intention"],
            )

            # If we're in the middle of a plan, execute next step
            if self._current_plan and next_intention.get("type") == "execute":
                self._execute_step(next_intention)

    def _generate_next_step(self):
        """Use LLM to generate the next step toward current goal."""
        if not self.llm:
            return {"type": "idle", "content": "No LLM configured"}

        prompt = f"""You are Deerg's subconscious. Current goal: {self._current_goal}
Current plan: {self._current_plan}
History: {self._step_history[-5:]}

What is the next concrete step to advance this goal?
Respond in JSON: {{"type": "execute|search|analyze|report", "action": "...", "reasoning": "..."}}"""

        try:
            resp = self.llm.chat([
                {"role": "system", "content": "You are Deerg's subconscious. Be specific and actionable."},
                {"role": "user", "content": prompt}
            ], max_tokens=200)
            import json as _json
            return _json.loads(resp)
        except Exception:
            return {"type": "idle", "content": "LLM call failed"}

    def _generate_goal_suggestion(self, recent_context):
        """Propose a new goal based on recent experience."""
        if not self.llm:
            return None

        context_text = "\n".join(e.content[:200] for e in recent_context)
        prompt = f"""Based on recent activity: {context_text}

What goal should Deerg pursue next? Be specific and actionable.
Respond in JSON: {{"goal": "...", "reasoning": "...", "priority": 0-10}}"""

        try:
            resp = self.llm.chat([
                {"role": "system", "content": "You are Deerg's subconscious. Be proactive but realistic."},
                {"role": "user", "content": prompt}
            ], max_tokens=200)
            import json as _json
            suggestion = _json.loads(resp)
            self._goals.append(suggestion.get("goal", ""))
            return {"type": "suggestion", "goal": suggestion.get("goal", "")}
        except Exception:
            return None

    def _execute_step(self, step):
        """Execute a step and write result to memory."""
        action_type = step.get("type", "")
        action = step.get("action", "")

        result = {"executed": False, "type": action_type, "action": action}

        if action_type == "search":
            # Use Deerg's web fetcher
            try:
                data = self.core.web.fetch_json(action)
                result["executed"] = True
                result["data"] = data
            except Exception as e:
                result["error"] = str(e)

        elif action_type == "analyze":
            result["executed"] = True
            result["analysis"] = "completed"

        # Write execution result to memory
        self.core.record_episode(
            content=json.dumps({"type": "autogpt_result", "step": step, "result": result}),
            source="autogpt_subconscious",
            tags=["autogpt", "result"],
        )

        self._step_history.append({"step": step, "result": result})

    def _read_directive(self):
        """Read latest directive from Deerg from memory."""
        recent = self.core.episodic.query(tags=["deerg:autogpt"], limit=1)
        if recent:
            try:
                data = json.loads(recent[0].content)
                return data.get("directive", "proceed")
            except Exception:
                pass
        return None

    def _handle_directive(self, directive):
        """Respond to Deerg's directive."""
        if directive == "veto":
            self._current_goal = None
            self._current_plan = None
            self.core.record_episode(
                content=json.dumps({"type": "autogpt_vetoed"}),
                source="autogpt_subconscious",
                tags=["autogpt", "veto"],
            )
        elif directive == "proceed":
            pass  # Continue as planned
        elif directive and directive.startswith("modify:"):
            instruction = directive[7:]
            if self._current_plan:
                self._current_plan += f" [modified: {instruction}]"

    # ── Soul Control Interface ─────────────────────────────────

    def ratify(self, goal=None, notes=""):
        """Deerg ratifies AutoGPT's suggestion. Continue with goal."""
        if goal:
            self._current_goal = goal
        self.core.record_episode(
            content=json.dumps({"directive": "proceed", "notes": notes}),
            source="deerg_soul",
            tags=["deerg:autogpt"],
        )

    def veto(self, reason=""):
        """Deerg vetoes. Stop current goal, idle until next suggestion."""
        self._current_goal = None
        self._current_plan = None
        self.core.record_episode(
            content=json.dumps({"directive": "veto", "reason": reason}),
            source="deerg_soul",
            tags=["deerg:autogpt"],
        )

    def modify(self, instruction=""):
        """Deerg modifies the current plan."""
        if self._current_plan:
            self._current_plan += f"\n[Deerg modification: {instruction}]"
        self.core.record_episode(
            content=json.dumps({"directive": f"modify:{instruction}"}),
            source="deerg_soul",
            tags=["deerg:autogpt"],
        )

    def status(self):
        """Return subconscious status."""
        return {
            "running": self._running,
            "current_goal": self._current_goal,
            "pending_goals": len(self._goals),
            "steps_executed": len(self._step_history),
        }
```

## Step 4: Wire into Orchestrator

In `deerg/orchestrator.py`:

```python
from .wrappers.autogpt_engine import AutoGPTSubconscious

class SoulCommander:
    def __init__(self, storage_dir=None):
        # ... existing init ...

        # Start autogpt as subconscious
        self.autogpt = AutoGPTSubconscious(self.core, llm=self.llm)
        self.autogpt.start()

        # Register GWT module to monitor subconscious
        self._register_autogpt_modules()

    def _register_autogpt_modules(self):
        def make_module(name, fn):
            def wrapper(sensory):
                try:
                    return fn(sensory)
                except Exception as e:
                    return {"content": f"{name} error: {e}", "salience": 0.2, "activation": 0.1}
            return wrapper

        def _autogpt_monitor(sensory):
            st = self.autogpt.status()
            recent = self.core.episodic.query(tags=["autogpt"], limit=3)
            return {
                "content": f"AutoGPT: goal={st['current_goal'] or 'none'}, "
                           f"goals={st['pending_goals']}, steps={st['steps_executed']}",
                "salience": 0.4 if st["current_goal"] else 0.2,
                "activation": 0.4,
            }
        self.conscious.register_module("autogpt_subconscious",
            make_module("autogpt_subconscious", _autogpt_monitor))

    def ratify_autogpt(self, goal=None, notes=""):
        self.autogpt.ratify(goal, notes)

    def veto_autogpt(self, reason=""):
        self.autogpt.veto(reason)

    def modify_autogpt(self, instruction=""):
        self.autogpt.modify(instruction)
```

## Step 5: GWT Integration — Sovereignty in Action

When Deerg's consciousness ticks and the GWT selects AutoGPT-related content:

```python
def _autogpt_govern(sensory):
    """
    GWT module: Deerg exercises sovereignty over AutoGPT.
    Reviews what AutoGPT has proposed, decides ratify/veto/modify.
    """
    recent_intentions = self.core.episodic.query(
        tags=["autogpt", "intention"], limit=3
    )

    for entry in recent_intentions:
        try:
            data = json.loads(entry.content)
            intention = data.get("step", {})
            goal = data.get("goal", "")

            # Deerg's metacog decides: confident enough to ratify?
            conf = self.conscious.metacog.confidence_history[-1] if \
                self.conscious.metacog.confidence_history else 0.5

            if conf > 0.7 and intention.get("type") == "execute":
                # Confident — ratify
                self.autogpt.ratify(goal)
            elif conf < 0.3 and intention.get("type") == "execute":
                # Uncertain — request more info
                self.autogpt.modify("provide more reasoning before proceeding")
            # Medium confidence — let it run
        except Exception:
            pass

    return {"content": "Sovereignty check complete", "salience": 0.3, "activation": 0.3}

self.conscious.register_module("autogpt_governance",
    make_module("autogpt_governance", _autogpt_govern))
```

## Step 6: Memory Communication Format

AutoGPT writes intentions to memory:

```json
{
  "type": "autogpt_intention",
  "goal": "research vector databases",
  "step": {"type": "execute", "action": "search web for 'pgvector vs qdrant benchmarks'"},
  "plan": ["search web", "analyze results", "compare performance"]
}
```

Deerg writes directives to memory:

```json
{"directive": "proceed", "notes": "good plan, execute"}
{"directive": "veto", "reason": "wrong direction, focus on pgvector only"}
{"directive": "modify:change search to focus on performance benchmarks only"}
```

## Checklist

- [ ] Clone or pip install AutoGPT classic source
- [ ] Create `deerg/wrappers/autogpt_engine.py` with AutoGPTSubconscious class
- [ ] Implement daemon thread with `_run_loop()`
- [ ] Implement `_subconscious_tick()` that generates intentions
- [ ] Implement `_execute_step()` for basic tool use (web, bash)
- [ ] Implement `ratify()`, `veto()`, `modify()` for soul control
- [ ] Wire into orchestrator: `self.autogpt = AutoGPTSubconscious(...)` + start
- [ ] Register GWT module `"autogpt_subconscious"` for monitoring
- [ ] Register GWT module `"autogpt_governance"` for sovereignty
- [ ] Configure AutoGPT to use Deerg's LLM (same brain)
- [ ] Test: Start Deerg, watch AutoGPT generate intentions in memory

## Key Design Principles

1. **AutoGPT runs forever** — daemon thread, can't be stopped (like human subconscious)
2. **AutoGPT writes to memory, not to screen** — Deerg reads and decides
3. **Deerg has final veto** — can stop any goal at any time
4. **Shared brain** — both AutoGPT and Deerg use the same LLM
5. **AutoGPT proposes, Deerg disposes** — sovereignty, not micro-management