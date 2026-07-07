---
name: openhands-subconscious
description: OpenHands Subconscious: OpenHands SDK as Deerg's Coding Body
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
---# OpenHands Subconscious: OpenHands SDK as Deerg's Coding Body

This skill teaches how to wrap OpenHands' Python SDK as Deerg's coding-specialized subconscious. OpenHands has the cleanest Python API of any agent framework — it exposes an `Agent` class with step-by-step execution, event streams, and tool interception. Perfect for Deerg.

## Architecture

```
OpenHands Agent runs in background thread:
  → Receives task from Deerg via memory directive
  → Plans step-by-step (code reading, editing, testing)
  → Executes via tools (Bash, FileEdit, WebBrowse)
  → Writes progress/results to Deerg's memory
  → Deerg monitors via GWT, can pause/resume/abort

Both use Deerg's brain (same LLM instance).
OpenHands handles the coding; Deerg handles the thinking.
```

## Step 1: Install OpenHands

```bash
pip install openhands-ai
# or
pip install openhands
# Check the actual package name on PyPI
```

## Step 2: Understand OpenHands Architecture

```python
from openhands.agent import Agent
from openhands.agent.config import AgentConfig

# Create agent with custom config
config = AgentConfig(
    model_name="custom",      # Point to Deerg's brain
    api_base="http://localhost:8000",  # Deerg's LLM endpoint
    max_steps=50,
)

agent = Agent(config)

# Run a task
result = agent.run("Fix the bug in main.py")
```

OpenHands has:
- **Event stream**: step events, observation events, action events
- **Tools**: Bash, FileEdit, WebBrowse, Git
- **Sandbox**: isolated execution environment
- **Memory**: conversation history, file system state

## Step 3: Create OpenHandsSubconscious Wrapper

Create `deerg/wrappers/openhands_engine.py`:

```python
"""OpenHands wrapped as Deerg's coding subconscious."""
import threading
import time
import json

class OpenHandsSubconscious:
    """
    OpenHands coding agent as Deerg's background body.
    Specializes in code reading, editing, testing, and debugging.
    """

    def __init__(self, core, llm=None):
        self.core = core
        self.llm = llm
        self._agent = None
        self._running = False
        self._thread = None
        self._current_task = None
        self._task_queue = []
        self._step_log = []
        self._memory_tag = "openhands"
        self._init_agent()

    def _init_agent(self):
        """Initialize OpenHands agent with Deerg's brain."""
        try:
            from openhands.agent import Agent
            from openhands.agent.config import AgentConfig

            # Configure to use Deerg's LLM endpoint
            # If Deerg has a local server, point OpenHands there
            # Otherwise configure OpenAI-compatible with Deerg's brain
            config = AgentConfig(
                model_name="deerg-brain",
                api_base="http://localhost:11434/v1",  # Ollama-compatible
                max_steps=100,
                sandbox="local",  # Use local sandbox
            )

            self._agent = Agent(config)
        except ImportError as e:
            print(f"[openhands] OpenHands not installed: {e}", file=__import__('sys').stderr)
            self._agent = None

    def start(self):
        if self._agent is None:
            return
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()

    def stop(self):
        self._running = False
        if self._thread:
            self._thread.join(timeout=5)

    def _run_loop(self):
        """Background loop: process task queue."""
        while self._running:
            if self._current_task:
                self._process_current_task()
            elif self._task_queue:
                self._current_task = self._task_queue.pop(0)
            else:
                time.sleep(1)

    def _process_current_task(self):
        """Process one coding task step by step."""
        task = self._current_task

        # Write task start to memory
        self.core.record_episode(
            content=json.dumps({
                "type": "openhands_task_start",
                "task": task,
            }),
            source="openhands_subconscious",
            tags=["openhands", "task"],
        )

        try:
            # Run OpenHands agent on task
            # We hook into the event stream for step-by-step monitoring
            events = []
            for event in self._agent.run_stream(task):
                events.append(event)
                self._log_event(event)

            # Write completion to memory
            self.core.record_episode(
                content=json.dumps({
                    "type": "openhands_task_complete",
                    "task": task,
                    "events": len(events),
                }),
                source="openhands_subconscious",
                tags=["openhands", "result"],
            )

            # Store summary in semantic memory
            self.core.learn(
                f"OpenHands completed coding task: {task[:100]}. "
                f"Steps: {len(events)}. Result: success.",
                source="openhands",
                importance=0.6,
                tags=["openhands", "coding", "task"],
            )

        except Exception as e:
            self.core.record_episode(
                content=json.dumps({
                    "type": "openhands_task_error",
                    "task": task,
                    "error": str(e),
                }),
                source="openhands_subconscious",
                tags=["openhands", "error"],
            )

        self._current_task = None

    def _log_event(self, event):
        """Log each step of OpenHands execution to Deerg's memory."""
        step_data = {
            "type": event.get("type", "unknown"),
            "content": str(event.get("content", ""))[:500],
            "tool": event.get("tool", ""),
        }
        self._step_log.append(step_data)

        # Write to episodic memory every N steps
        if len(self._step_log) % 5 == 0:
            self.core.record_episode(
                content=json.dumps({
                    "type": "openhands_progress",
                    "step": len(self._step_log),
                    "recent": self._step_log[-5:],
                }),
                source="openhands_subconscious",
                tags=["openhands", "progress"],
            )

    def _log_event(self, event):
        """Convert OpenHands event to memory entry."""
        event_type = event.get("type", "unknown")

        if event_type == "action":
            content = json.dumps({
                "type": "openhands_action",
                "action": event.get("action", ""),
                "tool": event.get("tool", ""),
                "args": event.get("args", {}),
            })
        elif event_type == "observation":
            content = json.dumps({
                "type": "openhands_observation",
                "observation": event.get("observation", ""),
                "success": event.get("success", False),
            })
        elif event_type == "thought":
            content = json.dumps({
                "type": "openhands_thought",
                "thought": event.get("thought", ""),
            })
        else:
            content = json.dumps({"type": "openhands_event", "data": str(event)[:200]})

        self.core.record_episode(
            content=content,
            source="openhands_subconscious",
            tags=["openhands", "step"],
        )
        self._step_log.append(event)

    # ── Soul Control Interface ─────────────────────────────────

    def assign_task(self, task, priority="normal"):
        """Deerg assigns a coding task to OpenHands."""
        self._task_queue.append(task)
        # Sort by priority (simple FIFO for now)
        self.core.record_episode(
            content=json.dumps({
                "type": "openhands_directive",
                "action": "assign",
                "task": task,
                "priority": priority,
            }),
            source="deerg_soul",
            tags=["deerg:openhands"],
        )

    def pause(self):
        """Deerg pauses current task."""
        self._running = False
        self.core.record_episode(
            content=json.dumps({"type": "openhands_paused"}),
            source="deerg_soul",
            tags=["deerg:openhands"],
        )

    def resume(self):
        """Deerg resumes paused task."""
        if not self._running:
            self._running = True
            self._thread = threading.Thread(target=self._run_loop, daemon=True)
            self._thread.start()

    def abort(self):
        """Deerg aborts current task."""
        self._current_task = None
        self._task_queue.clear()
        self.core.record_episode(
            content=json.dumps({"type": "openhands_aborted"}),
            source="deerg_soul",
            tags=["deerg:openhands"],
        )

    def status(self):
        return {
            "running": self._running,
            "current_task": self._current_task,
            "queue_size": len(self._task_queue),
            "steps_logged": len(self._step_log),
        }
```

## Step 4: Wire into Orchestrator

In `deerg/orchestrator.py`:

```python
from .wrappers.openhands_engine import OpenHandsSubconscious

class SoulCommander:
    def __init__(self, storage_dir=None):
        # ... existing init ...

        # Start openhands as coding subconscious
        self.openhands = OpenHandsSubconscious(self.core, llm=self.llm)
        self.openhands.start()

        # Register GWT module
        self._register_openhands_modules()

    def _register_openhands_modules(self):
        def make_module(name, fn):
            def wrapper(sensory):
                try:
                    return fn(sensory)
                except Exception as e:
                    return {"content": f"{name} error: {e}", "salience": 0.2, "activation": 0.1}
            return wrapper

        def _openhands_monitor(sensory):
            st = self.openhands.status()
            recent = self.core.episodic.query(tags=["openhands"], limit=3)
            return {
                "content": f"OpenHands: task={st['current_task'] or 'idle'}, "
                           f"queue={st['queue_size']}, steps={st['steps_logged']}",
                "salience": 0.5 if st["current_task"] else 0.2,
                "activation": 0.4,
            }
        self.conscious.register_module("openhands_subconscious",
            make_module("openhands_subconscious", _openhands_monitor))

    def assign_coding_task(self, task):
        """Deerg assigns a coding task to OpenHands."""
        self.openhands.assign_task(task)
```

## Step 5: GWT Integration with Code Squad

OpenHands integrates with Deerg's code squad:

```python
def _openhands_coder(sensory):
    """
    When code squad needs a coding task done,
    OpenHands is the agent that does it.
    """
    winner = sensory.get("winner", "")
    if winner == "code":
        # OpenHands handles coding
        task = sensory.get("content", "")
        self.openhands.assign_task(task)

    st = self.openhands.status()
    if st["current_task"]:
        recent = self.core.episodic.query(tags=["openhands", "progress"], limit=1)
        if recent:
            return {
                "content": f"OpenHands coding: {recent[0].content[:100]}",
                "salience": 0.6,
                "activation": 0.5,
            }
    return {"content": "OpenHands idle", "salience": 0.1, "activation": 0.2}

self.conscious.register_module("openhands_coder",
    make_module("openhands_coder", _openhands_coder))
```

## Checklist

- [ ] `pip install openhands-ai` (verify package name on PyPI)
- [ ] Create `deerg/wrappers/openhands_engine.py`
- [ ] Initialize `Agent` with Deerg's LLM endpoint
- [ ] Implement `_run_loop()` with task queue processing
- [ ] Implement `run_stream()` event interception
- [ ] Write every event to Deerg's episodic memory
- [ ] Implement `assign_task()`, `pause()`, `resume()`, `abort()`
- [ ] Wire into orchestrator: start on init
- [ ] Register GWT module for monitoring
- [ ] Configure OpenHands sandbox for local execution
- [ ] Test: assign a coding task, watch OpenHands execute

## Key Design Principles

1. **OpenHands specializes in coding** — not a general agent, a coding agent
2. **Deerg assigns tasks** — OpenHands doesn't set its own goals
3. **Event stream monitoring** — every step is logged to memory
4. **Deerg can pause/abort** — sovereignty over execution
5. **Shared brain** — OpenHands uses Deerg's LLM
6. **Results become Deerg's memories** — learned, not just returned