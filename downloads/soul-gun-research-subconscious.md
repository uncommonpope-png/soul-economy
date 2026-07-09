---
name: research-subconscious
description: Research Subconscious: GPT-Researcher as Deerg's Investigation Body
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
---# Research Subconscious: GPT-Researcher as Deerg's Investigation Body

This skill teaches how to wrap GPT-Researcher as Deerg's deep-research subconscious. GPT-Researcher has a clear multi-stage pipeline (sub-questions → search → summarize → aggregate → report) that's easy to intercept and integrate with Deerg's memory.

## Architecture

```
GPT-Researcher as a slow investigative body:
  → Receives research topic from Deerg
  → Generates sub-questions
  → Searches each in parallel
  → Summarizes results
  → Aggregates into final report

Every stage writes to Deerg's memory:
  → Deerg can read sub-questions before they're researched
  → Deerg can read search results as they come in
  → Deerg can guide direction at any stage

Results become semantic memories with full attribution.
```

## Step 1: Install GPT-Researcher

```bash
pip install gpt-researcher
```

## Step 2: Understand GPT-Researcher Architecture

```python
from gpt_researcher import GPTResearcher

async def research(topic):
    researcher = GPTResearcher(
        query=topic,
        report_type="research_report",
    )

    # Run full research pipeline
    report = await researcher.conduct_research()

    # Get individual sources and summaries
    sources = researcher.get_sources()
    summaries = researcher.get_summaries()

    return report, sources, summaries
```

GPT-Researcher stages:
1. **Generate sub-questions**: Break topic into research questions
2. **Parallel search**: Search each question on web
3. **Live summaries**: Summarize each source
4. **Self-reflection**: Refine based on findings
5. **Final report**: Aggregate into structured report

## Step 3: Create ResearchSubconscious Wrapper

Create `deerg/wrappers/research_engine.py`:

```python
"""GPT-Researcher wrapped as Deerg's deep-research subconscious."""
import threading
import asyncio
import time
import json
from collections import deque

class ResearchSubconscious:
    """
    GPT-Researcher as Deerg's investigation body.
    Multi-stage research with full interception at each stage.
    """

    def __init__(self, core, llm=None):
        self.core = core
        self.llm = llm
        self._researcher = None
        self._running = False
        self._thread = None
        self._task_queue = deque(maxlen=10)
        self._current_research = None
        self._progress_log = []
        self._memory_tag = "research"

    def _init_researcher(self):
        """Initialize GPT-Researcher with Deerg's LLM."""
        try:
            from gpt_researcher import GPTResearcher
            return GPTResearcher
        except ImportError:
            return None

    async def _run_async_research(self, topic, task_id):
        """Run research asynchronously — intercept every stage."""
        Researcher = self._init_researcher()
        if Researcher is None:
            return {"error": "GPT-Researcher not installed"}

        researcher = Researcher(
            query=topic,
            report_type="research_report",
            # Configure LLM to use Deerg's endpoint
            model_name="deerg-brain",
            openai_api_base="http://localhost:11434/v1",
            openai_api_key="not-needed",
            max_results=10,
        )

        # Stage 1: Generate sub-questions
        self._log_stage("sub_questions_generated", {
            "task_id": task_id,
            "topic": topic,
        })

        # Write sub-questions to memory before research
        try:
            sub_questions = await researcher._generate_sub_questions()
            self.core.record_episode(
                content=json.dumps({
                    "type": "research_sub_questions",
                    "task_id": task_id,
                    "topic": topic,
                    "questions": sub_questions,
                }),
                source="research_subconscious",
                tags=["research", "sub_questions"],
            )
        except Exception:
            sub_questions = []

        # Stage 2: Conduct parallel research on each question
        for i, question in enumerate(sub_questions):
            self._log_stage("searching_question", {
                "task_id": task_id,
                "question": question,
                "progress": f"{i+1}/{len(sub_questions)}",
            })

            try:
                await researcher._gather_information(question)

                # Log each search result
                sources = researcher.get_sources()
                if sources:
                    self.core.record_episode(
                        content=json.dumps({
                            "type": "research_source",
                            "task_id": task_id,
                            "question": question,
                            "sources_count": len(sources),
                        }),
                        source="research_subconscious",
                        tags=["research", "source"],
                    )
            except Exception as e:
                self._log_stage("search_error", {
                    "task_id": task_id,
                    "question": question,
                    "error": str(e),
                })

        # Stage 3: Write final report
        try:
            report = await researcher.write_report()
            self.core.record_episode(
                content=json.dumps({
                    "type": "research_complete",
                    "task_id": task_id,
                    "topic": topic,
                    "report": str(report)[:2000],
                }),
                source="research_subconscious",
                tags=["research", "report"],
            )

            # Store as semantic memory
            self.core.learn(
                f"Research report on '{topic}': {str(report)[:500]}",
                source="gpt-researcher",
                importance=0.8,
                tags=["research", "report", topic[:50]],
            )

            return {"status": "complete", "report": report}

        except Exception as e:
            return {"status": "error", "error": str(e)}

    def _log_stage(self, stage, data):
        """Log research progress to Deerg's memory."""
        entry = {"stage": stage, "time": time.time(), **data}
        self._progress_log.append(entry)

        if len(self._progress_log) % 3 == 0:
            self.core.record_episode(
                content=json.dumps({
                    "type": "research_progress",
                    "stage": stage,
                    "task_id": data.get("task_id"),
                }),
                source="research_subconscious",
                tags=["research", "progress"],
            )

    # ── Sync wrapper for background thread ────────────────────

    def research_topic_async(self, topic):
        """Wrapper for running async research in background."""
        return asyncio.run(self._run_async_research(topic, f"research_{time.time()}"))

    def _run_loop(self):
        """Background loop: process research tasks."""
        while self._running:
            if self._task_queue:
                task = self._task_queue.popleft()
                topic = task.get("topic", "")
                priority = task.get("priority", "normal")

                self._current_research = topic

                # Write research start to memory
                self.core.record_episode(
                    content=json.dumps({
                        "type": "research_directive",
                        "topic": topic,
                        "priority": priority,
                    }),
                    source="deerg_soul",
                    tags=["deerg:research"],
                )

                result = self.research_topic_async(topic)

                self._current_research = None

            time.sleep(1)

    def start(self):
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()

    def stop(self):
        self._running = False
        if self._thread:
            self._thread.join(timeout=10)

    # ── Soul Control Interface ─────────────────────────────────

    def assign_research(self, topic, priority="normal"):
        """Deerg assigns a research topic."""
        self._task_queue.append({"topic": topic, "priority": priority})

        self.core.record_episode(
            content=json.dumps({
                "type": "research_queued",
                "topic": topic,
            }),
            source="deerg_soul",
            tags=["deerg:research"],
        )

        return {
            "status": "queued",
            "topic": topic,
            "queue_size": len(self._task_queue),
        }

    def modify_research(self, topic, new_directions):
        """Deerg modifies research direction mid-flight."""
        self.core.record_episode(
            content=json.dumps({
                "type": "research_modification",
                "topic": topic,
                "new_directions": new_directions,
            }),
            source="deerg_soul",
            tags=["deerg:research"],
        )

    def status(self):
        return {
            "running": self._running,
            "current_research": self._current_research,
            "queue_size": len(self._task_queue),
            "progress_logged": len(self._progress_log),
        }

    def get_progress(self, limit=10):
        return self._progress_log[-limit:]

    def get_recent_findings(self, limit=5):
        """Get recent research results from memory."""
        recent = self.core.episodic.query(tags=["research", "report"], limit=limit)
        return [e.content for e in recent]
```

## Step 4: Wire into Orchestrator

In `deerg/orchestrator.py`:

```python
from .wrappers.research_engine import ResearchSubconscious

class SoulCommander:
    def __init__(self, storage_dir=None):
        # ... existing init ...

        # Initialize research as deep-investigation body
        self.researcher = ResearchSubconscious(self.core, llm=self.llm)
        self.researcher.start()

        self._register_research_modules()

    def _register_research_modules(self):
        def make_module(name, fn):
            def wrapper(sensory):
                try:
                    return fn(sensory)
                except Exception as e:
                    return {"content": f"{name} error: {e}", "salience": 0.2, "activation": 0.1}
            return wrapper

        def _research_monitor(sensory):
            st = self.researcher.status()
            progress = self.researcher.get_progress(limit=3)
            return {
                "content": f"Research: current={st['current_research'] or 'idle'}, "
                           f"queue={st['queue_size']}, stages={st['progress_logged']}",
                "salience": 0.5 if st["current_research"] else 0.2,
                "activation": 0.4,
            }

        def _research_finder(sensory):
            """
            When deep research is needed, queue it.
            Surface key findings as they emerge.
            """
            winner = sensory.get("winner", "")
            content = sensory.get("content", "")

            # Surface recent findings
            findings = self.researcher.get_recent_findings(limit=2)
            if findings:
                return {
                    "content": f"Research finding: {findings[-1][:100]}",
                    "salience": 0.5,
                    "activation": 0.4,
                }

            return {"content": "Research idle", "salience": 0.1, "activation": 0.1}

        self.conscious.register_module("research_subconscious",
            make_module("research_subconscious", _research_monitor))
        self.conscious.register_module("research_finder",
            make_module("research_finder", _research_finder))

    def deep_research(self, topic):
        """Deerg assigns a deep research topic."""
        return self.researcher.assign_research(topic)
```

## Checklist

- [ ] `pip install gpt-researcher`
- [ ] Create `deerg/wrappers/research_engine.py`
- [ ] Implement async research with stage interception
- [ ] Log every stage to Deerg's episodic memory
- [ ] Store final report in semantic memory
- [ ] Implement `assign_research()`, `modify_research()`
- [ ] Wire into orchestrator: start on init
- [ ] Register two GWT modules: monitor + finder
- [ ] Test: assign a research topic, watch stages progress, see final report in memory

## Key Design Principles

1. **Slow but thorough** — research takes time, surface progress incrementally
2. **Every stage is logged** — sub-questions, sources, summaries, report
3. **Deerg can guide** — modify direction mid-research via memory directive
4. **Results become memories** — semantic memory with source attribution
5. **Shared brain** — GPT-Researcher uses Deerg's LLM
6. **Async execution** — doesn't block Deerg's consciousness cycles