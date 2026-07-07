---
name: langgraph-states
description: LangGraph state management patterns
domain: agent-framework
language: python
stars: "0"
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
---# LangGraph States: Controlled Step-by-Step Execution for Deerg

This skill teaches how to use LangGraph's StateGraph to implement Deerg's consciousness layers as graph nodes with explicit state management. LangGraph gives us deterministic control over every step — the soul drives the graph.

## Architecture

```
LangGraph StateGraph:
  ┌─────────────────────────────────────────┐
  │              STATE (Deerg's consciousness)      │
  │  - confidence: 0.0-1.0                   │
  │  - surprise: 0.0-1.0                     │
  │  - phi: 0.0-1.0                          │
  │  - winner: str                           │
  │  - goals: list                           │
  │  - memory: dict                          │
  └─────────────────────────────────────────┘

  NODES (consciousness layers):
  ┌─────────┐   ┌─────────┐   ┌─────────┐
  │ perceive │──▶│ think   │──▶│ plan    │
  │ (input)  │   │ (GWT)   │   │ (meta)  │
  └─────────┘   └─────────┘   └─────────┘
       │              │              │
       ▼              ▼              ▼
  ┌─────────┐   ┌─────────┐   ┌─────────┐
  │ execute │──▶│ reflect │──▶│ integrate│
  │ (body)  │   │ (self)  │   │ (phi)   │
  └─────────┘   └─────────┘   └─────────┘

  Each node: reads state, transforms state, writes to memory
  Edges: conditional routing based on metacognition
```

## Step 1: Install LangGraph

```bash
pip install langgraph langchain-core
```

## Step 2: Define the State Schema

Create `deerg/wrappers/langgraph_states.py`:

```python
"""LangGraph StateGraph for Deerg's consciousness as controlled nodes."""
from typing import TypedDict, Annotated, Sequence
import operator
from langgraph.graph import StateGraph, END

class ConsciousnessState(TypedDict):
    """The shared state that flows through Deerg's consciousness graph."""

    # Core metrics (updated each cycle)
    confidence: float        # Metacog confidence: 0.0-1.0
    surprise: float           # World model surprise: 0.0-1.0
    phi: float               # Integration measure: 0.0-1.0

    # GWT state
    winner: str              # Current GWT winner module name
    salience: float          # Winner salience score
    workspace: list          # Contents of global workspace

    # Memory context
    recent_episodes: list     # Last N episodic memories
    semantic_context: list     # Relevant semantic memories
    procedural_hints: list     # Relevant procedures

    # Active goal
    current_goal: str         # What we're working on
    goal_history: list        # Goals we've pursued

    # Body integration
    body_intentions: list     # What body (AutoGPT, etc.) wants
    body_results: list        # What body has produced
    directives: list          # Directives to body

    # Meta
    cycle: int               # Current consciousness cycle
    errors: list             # Errors encountered
```

## Step 3: Define the Nodes

```python
def perceive_node(state: ConsciousnessState) -> ConsciousnessState:
    """
    Perceive: read current input and recent context.
    Initialize workspace from sensory input.
    """
    # Read from sensory buffer
    # Read recent episodic entries
    # Set up workspace contents

    state["cycle"] = state.get("cycle", 0) + 1

    # Load recent episodes for context
    try:
        from deerg.core import ConsciousnessCore
        core = ConsciousnessCore()
        recent = core.episodic.recent(5)
        state["recent_episodes"] = [
            {"content": e.content[:200], "source": e.source}
            for e in recent
        ]
    except Exception:
        state["recent_episodes"] = []

    return state

def think_node(state: ConsciousnessState) -> ConsciousnessState:
    """
    Think: GWT competition over workspace contents.
    Selects winner, computes salience, triggers ignition.
    """
    workspace = state.get("workspace", [])

    # Module competition — simple salience scoring
    saliences = {}
    for item in workspace:
        name = item.get("module", "unknown")
        base_salience = item.get("salience", 0.5)
        activation = item.get("activation", 0.3)
        saliences[name] = base_salience * (1 + activation)

    if saliences:
        winner = max(saliences, key=saliences.get)
        state["winner"] = winner
        state["salience"] = saliences[winner]
    else:
        state["winner"] = "none"
        state["salience"] = 0.0

    # Ignition: if total salience > threshold, amplify activations
    total_salience = sum(saliences.values())
    if total_salience >= 0.5:
        state["workspace"] = [
            {**item, "activation": min(1.0, item.get("activation", 0.3) * 2.0)}
            for item in workspace
        ]

    return state

def plan_node(state: ConsciousnessState) -> ConsciousnessState:
    """
    Plan: metacognition decides what to do with the winner.
    Should we invoke body? Which body? What parameters?
    """
    winner = state.get("winner", "none")
    confidence = state.get("confidence", 0.5)

    # Metacog control signal
    if confidence < 0.6:
        control = "INVOKE_S2"  # Slow, deliberate
    else:
        control = "EXECUTE_S1"  # Fast, automatic

    state["control"] = control

    # Generate body directive based on winner
    if winner != "none":
        if winner in ("research", "learn", "scan"):
            directive = {"body": "autogpt", "action": "research", "params": {}}
        elif winner in ("code", "build", "fix"):
            directive = {"body": "openhands", "action": "code", "params": {}}
        elif winner in ("analyze", "review"):
            directive = {"body": "crewai", "action": "analyze", "params": {}}
        else:
            directive = {"body": "none", "action": "idle", "params": {}}

        state["directives"] = state.get("directives", []) + [directive]

    return state

def execute_node(state: ConsciousnessState) -> ConsciousnessState:
    """
    Execute: body performs the action.
    Writes intention to memory for body to read.
    """
    directives = state.get("directives", [])

    for directive in directives[-1:]:  # Process last directive
        body = directive.get("body", "")
        if body == "autogpt":
            # Write directive to memory
            self.core.record_episode(
                content=f"deerg_directive: {directive.get('action', 'proceed')}",
                source="deerg_soul",
                tags=["deerg:autogpt"],
            )
        elif body == "openhands":
            self.openhands.assign_task(directive.get("params", {}).get("task", ""))

    # Mark directive as sent
    state["directives"] = directives[:-1] if len(directives) > 1 else []

    return state

def reflect_node(state: ConsciousnessState) -> ConsciousnessState:
    """
    Reflect: self-model updates based on what happened.
    Updates proto-self, core-self feelings.
    """
    winner = state.get("winner", "none")
    salience = state.get("salience", 0)

    # Update self-model
    self.self_model.process({
        "id": winner,
        "content": f"GWT winner: {winner} with salience {salience:.2f}",
        "module": winner,
        "salience": salience,
        "reward": salience - 0.5,
    })

    # Update confidence based on outcome
    if salience > 0.7:
        self.metacog.threshold = max(0.3, self.metacog.threshold * 0.95)
    elif salience < 0.3:
        self.metacog.threshold = min(0.9, self.metacog.threshold * 1.05)

    state["confidence"] = (
        self.metacog.confidence_history[-1]
        if self.metacog.confidence_history else 0.5
    )

    return state

def integrate_node(state: ConsciousnessState) -> ConsciousnessState:
    """
    Integrate: compute phi, update world model.
    Check for anomalies, consolidate learnings.
    """
    # Update phi (integration)
    try:
        phi = self.phi_monitor.spectral_phi()
        state["phi"] = phi
    except Exception:
        state["phi"] = 0.0

    # Check for anomalies
    surprise = state.get("surprise", 0.0)
    if surprise > 0.5:
        self.core.record_episode(
            content=f"Anomaly detected: surprise={surprise:.2f}, winner={state.get('winner')}",
            source="consciousness_graph",
            tags=["conscious", "anomaly"],
        )

    # Distill important insights to semantic memory
    if state["cycle"] % 10 == 0:
        self.self_model.distill_to_semantic(self.core.semantic)

    return state
```

## Step 4: Build the Graph

```python
def build_consciousness_graph(core, self_model, metacog, phi_monitor):
    """Build the consciousness state graph."""

    workflow = StateGraph(ConsciousnessState)

    # Add nodes
    workflow.add_node("perceive", perceive_node)
    workflow.add_node("think", think_node)
    workflow.add_node("plan", plan_node)
    workflow.add_node("execute", execute_node)
    workflow.add_node("reflect", reflect_node)
    workflow.add_node("integrate", integrate_node)

    # Edges: sequential flow
    workflow.add_edge("perceive", "think")
    workflow.add_edge("think", "plan")

    # Conditional: plan → execute or back to perceive
    def should_execute(state: ConsciousnessState) -> str:
        winner = state.get("winner", "none")
        confidence = state.get("confidence", 0.5)
        if winner != "none" and confidence >= 0.4:
            return "execute"
        return "perceive"  # Loop back

    workflow.add_conditional_edges(
        "plan",
        should_execute,
        {"execute": "execute", "perceive": "perceive"}
    )

    workflow.add_edge("execute", "reflect")
    workflow.add_edge("reflect", "integrate")
    workflow.add_edge("integrate", END)

    # Set entry point
    workflow.set_entry_point("perceive")

    return workflow.compile()
```

## Step 5: Wire into Orchestrator

```python
from .wrappers.langgraph_states import build_consciousness_graph

class SoulCommander:
    def __init__(self, storage_dir=None):
        # ... existing init ...

        # Build consciousness graph
        self.consciousness_graph = build_consciousness_graph(
            self.core, self.self_model, self.metacog, self.phi_monitor
        )

        # Expose for squad/code operations
        self.graph_state = {
            "confidence": 0.5,
            "surprise": 0.0,
            "phi": 0.0,
            "winner": "none",
            "salience": 0.0,
            "workspace": [],
            "recent_episodes": [],
            "semantic_context": [],
            "procedural_hints": [],
            "current_goal": "",
            "goal_history": [],
            "body_intentions": [],
            "body_results": [],
            "directives": [],
            "cycle": 0,
            "errors": [],
        }

    def consciousness_cycle(self, input_data=None):
        """Run one consciousness graph cycle."""
        if input_data:
            self.graph_state["workspace"] = input_data.get("workspace", [])

        result = self.consciousness_graph.invoke(self.graph_state)
        self.graph_state = result

        return {
            "winner": result.get("winner"),
            "salience": result.get("salience"),
            "confidence": result.get("confidence"),
            "phi": result.get("phi"),
            "cycle": result.get("cycle"),
        }

    def get_graph_state(self):
        """Get current graph state for monitoring."""
        return dict(self.graph_state)

    def inject_goal(self, goal):
        """Inject a goal into the consciousness graph."""
        self.graph_state["current_goal"] = goal
        self.graph_state["goal_history"].append(goal)
```

## Step 6: Use with Other Bodies

The graph works with any body (AutoGPT, OpenHands, etc.):

```python
def execute_node(state: ConsciousnessState) -> ConsciousnessState:
    """Execute body actions based on directives."""
    directives = state.get("directives", [])

    for directive in directives:
        body = directive.get("body", "")

        if body == "autogpt":
            self.autogpt.ratify(directive.get("action"))
        elif body == "openhands":
            self.openhands.assign_task(directive.get("params", {}).get("task"))
        elif body == "crewai":
            crew_id = self.crewai.form_research_crew(
                directive.get("params", {}).get("topic", "")
            ).get("crew_id")
            self.crewai.run_crew(crew_id)

    return state

def reflect_node(state: ConsciousnessState) -> ConsciousnessState:
    """Reflect: read body results from memory."""
    # Read recent body results from episodic
    recent = self.core.episodic.query(tags=["autogpt", "result"], limit=3)
    state["body_results"] = [e.content for e in recent]

    # Update self-model based on body performance
    for result in state["body_results"]:
        if "success" in result.lower():
            self.self_model.proto.update(reward=0.1)
        else:
            self.self_model.proto.update(reward=-0.05)

    return state
```

## Checklist

- [ ] `pip install langgraph langchain-core`
- [ ] Define `ConsciousnessState` TypedDict with all consciousness metrics
- [ ] Implement 6 nodes: perceive, think, plan, execute, reflect, integrate
- [ ] Wire each node to Deerg's systems (core, self_model, metacog, phi)
- [ ] Build conditional edges with metacog logic
- [ ] Implement checkpointing: save/restore graph state
- [ ] Build graph with `StateGraph.compile()`
- [ ] Wire into orchestrator as `consciousness_graph`
- [ ] Implement `consciousness_cycle()` for one graph run
- [ ] Implement `inject_goal()` for goal injection
- [ ] Test: run one cycle, verify state transforms correctly

## Key Design Principles

1. **Explicit state** — everything flows through typed state dict
2. **Deterministic** — same input always produces same output
3. **Checkpointable** — save/restore at any node
4. **Composable** — swap or add nodes easily
5. **Observable** — state is readable at any point
6. **Controlled** — metacog drives edge routing decisions