---
name: crewai-delegation
description: Use when implementing agent delegation patterns
domain: agent-framework
language: python
stars: "52800"
topics: ["agent-framework"]
version: 0.1.0
author: deerg
input_schema:
  type: object
  properties: {}
  required: []
output_schema:
  type: object
  properties: {}
  required: []
---# CrewAI Delegation: Multi-Agent Teams Inside Deerg

This skill teaches how to use CrewAI inside Deerg for complex task decomposition. CrewAI creates teams of agents with distinct roles — Deerg orchestrates the crew as a unified subconscious that can tackle multi-faceted problems.

## Architecture

```
Deerg (Soul):
  → Forms a crew for a specific complex task
  → Assigns roles: planner, executor, reviewer
  → Monitors crew progress via memory
  → Can interrupt, redirect, or terminate crew
  → Synthesizes final results

CrewAI Agents (Body):
  → Each has a role, goal, backstory
  → All use Deerg's brain (same LLM)
  → Execute tasks in parallel or sequence
  → Write results to Deerg's memory
  → Deerg synthesizes their output
```

## Step 1: Install CrewAI

```bash
pip install crewai crewai-tools
```

## Step 2: Understand CrewAI Core Concepts

```python
from crewai import Agent, Task, Crew, Process

# Define an agent with role and goal
researcher = Agent(
    role="Research Analyst",
    goal="Find and summarize the best information on {topic}",
    backstory="You are an expert research analyst with decades of experience...",
    verbose=True,
    allow_delegation=False,  # Can this agent create sub-agents?
)

# Define a task
task = Task(
    description="Research {topic} and provide key findings",
    expected_output="A summary of key findings with sources",
    agent=researcher,
)

# Form a crew
crew = Crew(
    agents=[researcher, ...],
    tasks=[task, ...],
    process=Process.sequential,  # or Process.hierarchical
    verbose=True,
)

# Run
result = crew.kickoff()
```

## Step 3: Create CrewAIDelegation Helper

Create `deerg/wrappers/crewai_engine.py`:

```python
"""CrewAI wrapped as Deerg's multi-agent delegation system."""
import json
import threading
import time

class CrewAIDelegation:
    """
    CrewAI crew formation and delegation inside Deerg.
    Deerg forms crews for complex tasks, monitors progress,
    synthesizes results.
    """

    def __init__(self, core, llm=None):
        self.core = core
        self.llm = llm
        self._active_crews = {}
        self._crew_id = 0

    def _get_crewai(self):
        """Lazy import CrewAI."""
        try:
            from crewai import Agent, Task, Crew, Process
            return Agent, Task, Crew, Process
        except ImportError:
            return None, None, None, None

    def _default_llm_config(self):
        """Configure CrewAI to use Deerg's brain."""
        # CrewAI supports OpenAI-compatible endpoints
        # Point to Deerg's brain (Ollama-compatible or custom)
        return {
            "model": "deerg-brain",
        }

    def form_research_crew(self, topic, roles=None):
        """
        Form a research crew around a topic.
        Default roles: researcher, synthesizer, fact_checker.
        """
        Agent, Task, Crew, Process = self._get_crewai()
        if Agent is None:
            return {"error": "CrewAI not installed: pip install crewai crewai-tools"}

        if roles is None:
            roles = ["researcher", "synthesizer", "fact_checker"]

        agents = []
        tasks = []

        if "researcher" in roles:
            researcher = Agent(
                role="Research Analyst",
                goal=f"Find the most relevant and accurate information about {topic}",
                backstory="You are a thorough research analyst. You search widely and verify facts.",
                verbose=True,
                llm=self._default_llm_config(),
            )
            agents.append(researcher)

            task1 = Task(
                description=f"Research {topic} thoroughly. Find key facts, statistics, and opinions.",
                expected_output="A comprehensive list of key findings with sources.",
            )
            tasks.append(task1)

        if "synthesizer" in roles:
            synthesizer = Agent(
                role="Synthesis Expert",
                goal=f"Create a clear, well-organized summary of research on {topic}",
                backstory="You excel at turning complex information into clear, actionable summaries.",
                verbose=True,
                llm=self._default_llm_config(),
            )
            agents.append(synthesizer)

            # This task depends on researcher's output
            task2 = Task(
                description=f"Synthesize the research findings into a clear summary with key insights.",
                expected_output="A structured summary with key insights and recommendations.",
            )
            tasks.append(task2)

        if "fact_checker" in roles:
            checker = Agent(
                role="Fact Checker",
                goal="Verify that all claims are accurate and well-supported",
                backstory="You are skeptical and meticulous. You never accept claims without verification.",
                verbose=True,
                llm=self._default_llm_config(),
            )
            agents.append(checker)

        crew_id = f"crew_{self._crew_id}"
        self._crew_id += 1

        crew = Crew(
            agents=agents,
            tasks=tasks,
            process=Process.sequential,
            verbose=True,
        )

        self._active_crews[crew_id] = {
            "crew": crew,
            "topic": topic,
            "roles": roles,
            "thread": None,
            "result": None,
        }

        return {"crew_id": crew_id, "roles": roles, "agents": len(agents)}

    def run_crew(self, crew_id, background=True):
        """Run a crew (synchronously or in background)."""
        if crew_id not in self._active_crews:
            return {"error": f"Crew {crew_id} not found"}

        crew_data = self._active_crews[crew_id]
        crew = crew_data["crew"]

        if background:
            def _run():
                try:
                    result = crew.kickoff()
                    crew_data["result"] = result
                    # Write results to Deerg's memory
                    self.core.learn(
                        f"CrewAI crew completed on {crew_data['topic']}. "
                        f"Result: {str(result)[:500]}",
                        source="crewai",
                        importance=0.7,
                        tags=["crewai", "crew", crew_data["topic"]],
                    )
                    self.core.record_episode(
                        content=json.dumps({
                            "type": "crewai_complete",
                            "crew_id": crew_id,
                            "topic": crew_data["topic"],
                            "result": str(result),
                        }),
                        source="crewai",
                        tags=["crewai", "result"],
                    )
                except Exception as e:
                    crew_data["result"] = f"Error: {e}"
                    self.core.record_episode(
                        content=json.dumps({
                            "type": "crewai_error",
                            "crew_id": crew_id,
                            "error": str(e),
                        }),
                        source="crewai",
                        tags=["crewai", "error"],
                    )

            t = threading.Thread(target=_run, daemon=True)
            t.start()
            crew_data["thread"] = t
            return {"status": "running_background", "crew_id": crew_id}
        else:
            result = crew.kickoff()
            crew_data["result"] = result
            return {"status": "completed", "crew_id": crew_id, "result": str(result)}

    def get_crew_status(self, crew_id):
        """Get status of a crew."""
        if crew_id not in self._active_crews:
            return {"error": "Crew not found"}
        crew_data = self._active_crews[crew_id]
        return {
            "crew_id": crew_id,
            "topic": crew_data["topic"],
            "roles": crew_data["roles"],
            "running": crew_data["thread"].is_alive() if crew_data["thread"] else False,
            "result": str(crew_data["result"]) if crew_data["result"] else None,
        }

    def list_crews(self):
        """List all active and completed crews."""
        return {
            crew_id: self.get_crew_status(crew_id)
            for crew_id in self._active_crews
        }

    def terminate_crew(self, crew_id):
        """Terminate a running crew (best effort)."""
        if crew_id in self._active_crews:
            self._active_crews[crew_id]["thread"] = None
            return {"status": "terminated", "crew_id": crew_id}
        return {"error": "Crew not found"}

    # ── Pre-built Crew Templates ─────────────────────────────────

    def research_squad(self, topic):
        """Quick research crew: researcher + synthesizer."""
        return self.form_research_crew(topic, roles=["researcher", "synthesizer"])

    def analysis_squad(self, topic):
        """Deep analysis crew: researcher + synthesizer + fact_checker."""
        return self.form_research_crew(topic, roles=["researcher", "synthesizer", "fact_checker"])

    def planning_squad(self, goal):
        """Planning crew: strategist + executor + reviewer."""
        return self.form_research_crew(goal, roles=["strategist", "executor", "reviewer"])
```

## Step 4: Wire into Orchestrator

In `deerg/orchestrator.py`:

```python
from .wrappers.crewai_engine import CrewAIDelegation

class SoulCommander:
    def __init__(self, storage_dir=None):
        # ... existing init ...

        # Initialize CrewAI delegation
        try:
            self.crewai = CrewAIDelegation(self.core, llm=self.llm)
        except Exception as e:
            print(f"[crewai] CrewAI initialization failed: {e}", file=sys.stderr)
            self.crewai = None

        self._register_crewai_modules()

    def _register_crewai_modules(self):
        def make_module(name, fn):
            def wrapper(sensory):
                try:
                    return fn(sensory)
                except Exception as e:
                    return {"content": f"{name} error: {e}", "salience": 0.2, "activation": 0.1}
            return wrapper

        def _crewai_monitor(sensory):
            if self.crewai is None:
                return {"content": "CrewAI not available", "salience": 0.1, "activation": 0.1}
            crews = self.crewai.list_crews()
            active = sum(1 for c in crews.values() if c.get("running", False))
            return {
                "content": f"CrewAI: {len(crews)} crews, {active} active",
                "salience": 0.3 + (active * 0.1),
                "activation": 0.4,
            }
        self.conscious.register_module("crewai_delegation",
            make_module("crewai_delegation", _crewai_monitor))

    def form_squad(self, topic, roles=None):
        """Deerg forms a crew for complex task."""
        if self.crewai is None:
            return {"error": "CrewAI not available"}
        return self.crewai.form_research_crew(topic, roles)

    def run_squad(self, crew_id, background=True):
        if self.crewai is None:
            return {"error": "CrewAI not available"}
        return self.crewai.run_crew(crew_id, background)

    def squad_status(self, crew_id):
        if self.crewai is None:
            return {}
        return self.crewai.get_crew_status(crew_id)
```

## Checklist

- [ ] `pip install crewai crewai-tools`
- [ ] Create `deerg/wrappers/crewai_engine.py`
- [ ] Implement lazy CrewAI import
- [ ] Implement `_default_llm_config()` pointing to Deerg's brain
- [ ] Implement `form_research_crew()` with role-based agents
- [ ] Implement `run_crew()` with background thread option
- [ ] Implement `get_crew_status()` and `list_crews()`
- [ ] Implement pre-built templates: research_squad, analysis_squad, planning_squad
- [ ] Wire into orchestrator
- [ ] Register GWT module for monitoring
- [ ] Test: form a crew on a topic, run it, watch results flow into memory

## Key Design Principles

1. **Deerg forms the crew** — decides who does what, not the agents
2. **All agents use the same brain** — Deerg's LLM
3. **Results become memories** — not just returned, stored in semantic memory
4. **Deerg monitors progress** — via GWT module
5. **Deerg can terminate** — sovereignty over crew execution
6. **CrewAI is a tool** — not a separate mind, a delegation mechanism