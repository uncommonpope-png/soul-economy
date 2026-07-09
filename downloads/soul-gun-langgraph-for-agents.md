---
name: langgraph-for-agents
description: Stateful graph orchestration for building production agents
domain: agent-framework
language: python
stars: "33900"
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
---# LangGraph for Agents

## Origin

Grafted from **[langchain-ai/langgraph](https://github.com/langchain-ai/langgraph)** — low-level stateful graph orchestration. Industry standard for production agents.

## Instructions

Use LangGraph when building:
- **Stateful agents** with complex conversation flows
- **Durable execution** (resume after failures)
- **Human-in-the-loop** with interrupts
- **Short-term + long-term memory** systems
- **Multi-agent workflows** with branching subgraphs

## Key Patterns

### StateGraph Agent
```python
from langgraph.graph import StateGraph, START, END
from typing import TypedDict

class State(TypedDict):
    messages: list
    next_action: str

def agent_node(state: State) -> dict:
    # Return Partial<State> (dict)
    return {"next_action": "tool"}

workflow = StateGraph(State)
workflow.add_node("agent", agent_node)
workflow.add_edge(START, "agent")
workflow.add_conditional_edges("agent", should_continue)
workflow.add_edge("agent", END)
compiled = workflow.compile()
```

### Checkpointing (Durable Execution)
```python
from langgraph.checkpoint.memory import MemorySaver

checkpointer = MemorySaver()
graph = workflow.compile(checkpointer=checkpointer)

# Resume after failure
config = {"configurable": {"thread_id": "conv-1"}}
result = graph.invoke(inputs, config)
```

### Tool Calling with Interrupt
```python
from langgraph.types import Command

def should_continue(state: State) -> str:
    if hasattr(state['messages'][-1], 'tool_calls'):
        return "action"
    return END

def tool_node(state: State) -> Command:
    # Execute tool, then return Command to resume agent
    result = execute_tool(state['messages'][-1].tool_calls[0])
    return Command(goto="agent", update={"tool_result": result})
```

### Memory (Long-term)
```python
from langgraph.store.memory import MemoryStore

store = MemoryStore()
graph = workflow.compile(checkpointer=checkpointer, store=store)

# Persist facts across sessions
await store.aput("user", "preferences", {"theme": "dark"})
```

## When to Use

| Use Case | Choice |
|----------|--------|
| Stateful agents with memory | LangGraph (primary) |
| Durable execution | LangGraph |
| Human-in-the-loop | LangGraph |
| Complex multi-agent graphs | LangGraph |
| Quick prototyping | CrewAI |

## Comparison

- LangGraph is **low-level** — more flexible but more code
- CrewAI is **higher-level** — faster to get started
- Use LangGraph when you need **fine-grained control**

## Resources

- Docs: https://langchain-ai.github.io/langgraph/
- GitHub: https://github.com/langchain-ai/langgraph