---
name: browser-subconscious
description: Browser Subconscious: Browser-Use as Deerg's Web Research Tool
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
---# Browser Subconscious: Browser-Use as Deerg's Web Research Tool

This skill teaches how to wrap Browser-Use as Deerg's always-available web-search subconscious. Unlike general-purpose subconscious agents, Browser-Use is a specialized tool — invoked on demand, runs in background, writes results to memory.

## Architecture

```
Browser-Use as a specialized tool (not general subconscious):
  → Deerg queues web research tasks
  → Browser-Use executes in background
  → Writes results to Deerg's memory as "browser:result"
  → Deerg monitors via GWT, can pause/resume/abort
  → Results become semantic memories

Browser-Use is like a hand — always available, not always moving.
```

## Step 1: Install Browser-Use

```bash
pip install browser-use
# Also install playwright browsers
playwright install chromium
```

## Step 2: Understand Browser-Use Architecture

```python
from browser_use import Agent
from langchain_openai import ChatOpenAI

# Create agent with custom LLM
agent = Agent(
    agent_name="web-researcher",
    task="Search for information about {query}",
    llm=ChatOpenAI(model="gpt-4"),
)

# Run
result = agent.run()
```

Browser-Use has:
- **Task queue**: add tasks, process sequentially
- **Browser actions**: navigate, click, type, extract, scroll
- **LLM integration**: plans actions based on task
- **Result extraction**: returns structured data

## Step 3: Create BrowserSubconscious Wrapper

Create `deerg/wrappers/browser_engine.py`:

```python
"""Browser-Use wrapped as Deerg's web research tool."""
import threading
import time
import json
from collections import deque

class BrowserSubconscious:
    """
    Browser-Use as Deerg's web browsing tool.
    Not a general subconscious — a specialized tool.
    Deerg queues tasks, browser executes in background.
    """

    def __init__(self, core, llm=None):
        self.core = core
        self.llm = llm
        self._agent = None
        self._running = False
        self._thread = None
        self._task_queue = deque(maxlen=20)
        self._results = []
        self._memory_tag = "browser"

    def _init_agent(self):
        """Initialize Browser-Use agent."""
        try:
            from browser_use import Agent
            from langchain_openai import ChatOpenAI

            # Configure with Deerg's LLM (or OpenAI-compatible endpoint)
            llm_config = ChatOpenAI(
                model="deerg-brain",
                base_url="http://localhost:11434/v1",  # Ollama or custom
                api_key="not-needed",
            )

            self._agent = Agent(
                agent_name="deerg-web-researcher",
                task="Research the web thoroughly and extract key information.",
                llm=llm_config,
                max_steps=20,
            )
        except ImportError as e:
            print(f"[browser] Browser-Use not installed: {e}", file=__import__('sys').stderr)
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
            self._thread.join(timeout=10)

    def _run_loop(self):
        """Background loop: process web research tasks."""
        while self._running:
            if self._task_queue:
                task = self._task_queue.popleft()
                self._process_task(task)
            else:
                time.sleep(1)

    def _process_task(self, task):
        """Process one web research task."""
        task_id = task.get("id", "unknown")
        query = task.get("query", "")
        params = task.get("params", {})

        # Write task start to memory
        self.core.record_episode(
            content=json.dumps({
                "type": "browser_task_start",
                "task_id": task_id,
                "query": query,
            }),
            source="browser_subconscious",
            tags=["browser", "task"],
        )

        try:
            if self._agent:
                # Create task for Browser-Use
                browser_task = f"Research: {query}. Extract key facts, URLs, and summaries."

                result = self._agent.run(browser_task)

                # Write result to memory
                result_text = str(result)[:2000]
                self.core.record_episode(
                    content=json.dumps({
                        "type": "browser_result",
                        "task_id": task_id,
                        "query": query,
                        "result": result_text,
                    }),
                    source="browser_subconscious",
                    tags=["browser", "result"],
                )

                # Store as semantic memory
                self.core.learn(
                    f"Web research on '{query}': {result_text[:500]}",
                    source="browser",
                    importance=0.6,
                    tags=["browser", "research", query[:50]],
                )

                self._results.append({
                    "task_id": task_id,
                    "query": query,
                    "result": result_text,
                    "success": True,
                })

            else:
                # Fallback: use Deerg's web fetcher
                data = self.core.web.fetch_json(query)
                self.core.record_episode(
                    content=json.dumps({
                        "type": "browser_result",
                        "task_id": task_id,
                        "query": query,
                        "result": str(data)[:500],
                    }),
                    source="browser_subconscious",
                    tags=["browser", "result"],
                )
                self._results.append({
                    "task_id": task_id,
                    "query": query,
                    "result": str(data)[:500],
                    "success": True,
                })

        except Exception as e:
            self.core.record_episode(
                content=json.dumps({
                    "type": "browser_error",
                    "task_id": task_id,
                    "query": query,
                    "error": str(e),
                }),
                source="browser_subconscious",
                tags=["browser", "error"],
            )
            self._results.append({
                "task_id": task_id,
                "query": query,
                "error": str(e),
                "success": False,
            })

    # ── Soul Control Interface ─────────────────────────────────

    def queue_research(self, query, priority="normal"):
        """Deerg queues a web research task."""
        task = {
            "id": f"browser_task_{time.time()}",
            "query": query,
            "priority": priority,
            "params": {},
            "queued_at": time.time(),
        }
        self._task_queue.append(task)

        self.core.record_episode(
            content=json.dumps({
                "type": "browser_directive",
                "action": "queue",
                "query": query,
            }),
            source="deerg_soul",
            tags=["deerg:browser"],
        )

        return {"status": "queued", "queue_size": len(self._task_queue)}

    def pause(self):
        self._running = False

    def resume(self):
        if not self._running:
            self._running = True
            self._thread = threading.Thread(target=self._run_loop, daemon=True)
            self._thread.start()

    def clear_queue(self):
        self._task_queue.clear()

    def status(self):
        return {
            "running": self._running,
            "queue_size": len(self._task_queue),
            "results_count": len(self._results),
            "last_result": self._results[-1] if self._results else None,
        }

    def get_recent_results(self, limit=5):
        return self._results[-limit:]
```

## Step 4: Wire into Orchestrator

In `deerg/orchestrator.py`:

```python
from .wrappers.browser_engine import BrowserSubconscious

class SoulCommander:
    def __init__(self, storage_dir=None):
        # ... existing init ...

        # Initialize browser as a tool (not autonomous subconscious)
        self.browser = BrowserSubconscious(self.core, llm=self.llm)
        self.browser.start()

        self._register_browser_modules()

    def _register_browser_modules(self):
        def make_module(name, fn):
            def wrapper(sensory):
                try:
                    return fn(sensory)
                except Exception as e:
                    return {"content": f"{name} error: {e}", "salience": 0.1, "activation": 0.1}
            return wrapper

        def _browser_monitor(sensory):
            st = self.browser.status()
            recent = self.core.episodic.query(tags=["browser"], limit=3)
            return {
                "content": f"Browser: queue={st['queue_size']}, "
                           f"results={st['results_count']}, running={st['running']}",
                "salience": 0.3 if st["queue_size"] > 0 else 0.1,
                "activation": 0.3,
            }

        def _browser_researcher(sensory):
            """
            When research task arrives, queue it for browser.
            Monitors for relevant findings.
            """
            winner = sensory.get("winner", "")
            if winner in ("research", "scan", "learn"):
                content = sensory.get("content", "")
                if content:
                    self.browser.queue_research(content)

            # Surface recent browser findings
            results = self.browser.get_recent_results(limit=2)
            if results:
                latest = results[-1]
                return {
                    "content": f"Browser found: {latest.get('query', '')[:80]}",
                    "salience": 0.5,
                    "activation": 0.4,
                }

            return {"content": "Browser idle", "salience": 0.1, "activation": 0.1}

        self.conscious.register_module("browser_subconscious",
            make_module("browser_subconscious", _browser_monitor))
        self.conscious.register_module("browser_researcher",
            make_module("browser_researcher", _browser_researcher))

    def web_research(self, query):
        """Deerg queues a web research task."""
        return self.browser.queue_research(query)
```

## Checklist

- [ ] `pip install browser-use` + `playwright install chromium`
- [ ] Create `deerg/wrappers/browser_engine.py`
- [ ] Initialize Agent with Deerg's LLM endpoint
- [ ] Implement `_run_loop()` with task queue processing
- [ ] Implement `_process_task()` with result logging
- [ ] Write every result to Deerg's episodic + semantic memory
- [ ] Implement `queue_research()` for soul control
- [ ] Wire into orchestrator: start on init
- [ ] Register two GWT modules: monitor + researcher
- [ ] Test: queue a research task, watch browser execute, see results in memory

## Key Design Principles

1. **Browser is a tool** — not a general subconscious, invoked on demand
2. **Deerg queues tasks** — Browser-Use doesn't set its own agenda
3. **Results become memories** — not just returned, stored in semantic
4. **Deerg can pause/clear** — full sovereignty over web activity
5. **Shared brain** — Browser-Use uses Deerg's LLM for planning
6. **Fallback to Deerg's web** — if Browser-Use fails, use core.web.fetch