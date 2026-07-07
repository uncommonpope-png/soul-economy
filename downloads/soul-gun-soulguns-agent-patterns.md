---
name: soulguns-agent-patterns
description: Soulguns Agent Architecture Patterns
domain: computer-science
language: python
stars: "0"
topics: ["soulguns", "architecture", "typescript", "design-patterns"]
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
---# Soulguns Agent Architecture Patterns

## 1. Agent Core Architecture Patterns

### 1.1 Agent as Graph State Machine (LangGraph pattern)

The most mature pattern treats agents as a compiled state graph with nodes and edges:

```
Agent = StateGraph with:
  Nodes:    model_call, tool_execution, middleware
  Edges:    conditional (tool_calls → tools, no_tool_calls → end)
  State:    messages[] with add_messages reducer
  Loop:     call model → if tool_calls → execute tools → repeat
```

**Key types:**
```python
class AgentState(TypedDict):
    messages: Annotated[list, add_messages]  # Append-only via reducer

# Agent loop via CompiledStateGraph
graph = create_agent(model=llm, tools=[search], system_prompt="You are...")
# graph is a CompiledStateGraph, not a legacy executor
result = graph.invoke({"messages": [HumanMessage("hello")]})
```

### 1.2 Agent as Repeating Loop (OpenAI SDK, Swarm pattern)

Simpler pattern — a while loop checking tool calls:

```python
while True:
    response = model.generate(messages)
    if response.has_tool_calls:
        for tool_call in response.tool_calls:
            result = execute_tool(tool_call)
            messages.append(ToolMessage(result))
    else:
        return response.content
```

The `Runner` class manages this loop. Step result types:
- `NextStepFinalOutput` — Done, return result
- `NextStepHandoff` — Switch to another agent
- `NextStepRunAgain` — Execute tools, loop
- `NextStepInterruption` — Save state, pause for human

**Source:** `openai/openai-agents-python` — `src/agents/run.py`, `run_loop.py`

### 1.3 Agent Protocol (AutoGen pattern)

Every agent implements a standard message interface:

```python
class Agent(Protocol):
    async def on_message(self, message: Any, ctx: MessageContext) -> Any: ...
    async def save_state(self) -> Mapping[str, Any]: ...
    async def load_state(self, state: Mapping[str, Any]) -> None: ...
```

Two messaging modes:
- **`send_message(recipient)`** — Direct RPC, awaits response
- **`publish_message(topic)`** — Broadcast to all subscribers (fire-and-forget)

**Source:** `microsoft/autogen` — `autogen_core/_agent.py`, `_agent_runtime.py`

### 1.4 Role-Based Agent (CrewAI pattern)

Agents defined by role-goal-backstory triad:

```python
class Agent(BaseAgent):
    role: str                      # Identity: "Senior Researcher"
    goal: str                      # Objective: "Find cutting-edge info"
    backstory: str                 # Context
    allow_delegation: bool         # Can delegate to others
    tools: list[BaseTool]
```

The role-goal-backstory gets interpolated with crew inputs and forms the system prompt.

**Source:** `crewAIInc/crewAI` — `lib/crewai/src/crewai/agent/core.py`

---

## 2. Tool Calling Patterns

### 2.1 Universal Tool Interface

Every framework has the same core tool pattern:

```typescript
interface Tool {
  name: string;           // Unique identifier
  description: string;    // LLM-facing — tells when/how to use
  parameters: JSONSchema; // Function parameter schema
  execute(args): Result;  // The actual implementation
}
```

### 2.2 Decorator-Based Tool Definition

```python
# LangChain @tool decorator
@tool
def search_api(query: str) -> str:
    """Search the web for the query."""
    return results

# OpenAI SDK function_tool decorator
@function_tool
def get_weather(city: str, unit: Literal["c", "f"] = "c") -> str:
    """Get the weather for a city."""

# AutoGen FunctionTool
tool = FunctionTool(func, description="...")
```

### 2.3 Tool Error Handling Patterns

**Pattern A: ToolException + handle_tool_error flag (LangChain)**
```python
class BaseTool:
    handle_tool_error: bool | str | Callable  # Error → observation string
    handle_validation_error: bool | str | Callable

    # If handle_tool_error=True, errors return as messages instead of crashing
```

**Pattern B: Graceful error hierarchy (AutoGen)**
```python
class ToolException(BaseException):
    call_id: str; content: str; name: str

class ToolNotFoundException(ToolException): pass
class InvalidToolArgumentsException(ToolException): pass
class ToolExecutionException(ToolException): pass
```

### 2.4 Tool Execution Pipeline

```
Model generates AIMessage with tool_calls
  → ToolNode/ToolAgent receives tool_calls
  → Middleware intercepts (optional: retry, logging, PII)
  → Execute tool._run()
  → Format result as ToolMessage
  → Append to messages list
  → Continue loop if reflect_on_tool_use=True
```

**Sources:** `langchain-ai/langchain` — `ToolNode`, `BaseTool._run()`
`microsoft/autogen` — `ToolAgent.handle_function_call()`
`openai/openai-agents-python` — `tool_execution.py`

---

## 3. Handoff & Delegation Patterns

### 3.1 First-Class Handoff Object (OpenAI SDK)

```python
@dataclass
class Handoff:
    tool_name: str
    tool_description: str
    input_json_schema: dict
    on_invoke_handoff: Callable  # Side effect on transfer
    input_filter: HandoffInputFilter | None  # What next agent sees
    nest_handoff_history: bool  # Summarize vs pass raw history

# Factory function
handoff(agent_b)                                    # Simple transfer
handoff(agent_b, on_handoff=lambda ctx: log(ctx))  # With side effect
handoff(agent_b, input_type=MySchema)              # With structured input
```

**Nested history pattern:** Previous conversation is summarized into a single message wrapped in `CONVERSATION HISTORY` markers.

**Source:** `openai/openai-agents-python` — `src/agents/handoffs/`

### 3.2 Function-Return Handoff (Swarm)

Handoffs happen by returning an Agent from a function:

```python
def transfer_to_billing():
    """Transfer to billing department."""
    return billing_agent

agent_a = Agent(name="Support", functions=[transfer_to_billing])
```

Runtime detects `Agent` return type and switches active agent. `Result` object carries structured data + agent reference.

**Source:** `openai/swarm` — `swarm/core.py`

### 3.3 Delegation Tools (CrewAI)

Agents get `DelegateWorkTool` and `AskQuestionTool` dynamically:

```python
class DelegateWorkToolSchema(BaseModel):
    task: str
    context: str
    coworker: str  # Role/name of target agent

class DelegateWorkTool(BaseAgentTool):
    def _run(self, task, context, coworker):
        target = self._get_coworker(coworker)
        return target.execute_task(task, context)
```

Enabled via `agent.allow_delegation = True`.

**Source:** `crewAIInc/crewAI` — `lib/crewai/src/crewai/tools/agent_tools/`

### 3.4 Swarm/Mesh Pattern (AutoGen)

Handoff-driven speaker selection in `Swarm`:

```python
class SwarmGroupChatManager(BaseGroupChatManager):
    async def select_speaker(self, thread):
        for message in reversed(thread):
            if isinstance(message, HandoffMessage):
                self._current_speaker = message.target
                return [self._current_speaker]
        return self._current_speaker  # Stay with current speaker
```

**Source:** `microsoft/autogen` — `autogen_agentchat/teams/_group_chat/_swarm_group_chat.py`

---

## 4. State Management Patterns

### 4.1 Graph State with Reducers (LangGraph)

State is a `TypedDict` with reducer functions for each key:

```python
class AgentState(TypedDict):
    messages: Annotated[list, add_messages]  # Append, dedup by ID
    remaining_steps: int                      # LastValue (override)

# Reducer pattern — merges values from parallel node executions
def add_messages(left: list, right: list) -> list:
    """Merge message lists, deduplicating by ID."""
```

Channel types: `LastValue` (override), `Topic` (PubSub), `BinaryOperatorAggregate` (reduce), `EphemeralValue` (consume-once).

### 4.2 Checkpointing (LangGraph)

Full state persisted at every step:

```python
class BaseCheckpointSaver:
    async def put(self, config, checkpoint, metadata): ...
    async def get_tuple(self, config) -> CheckpointTuple: ...
    async def list(self, config, *, limit=None) -> Iterator[CheckpointTuple]: ...

# Usage:
graph = builder.compile(checkpointer=MemorySaver())
config = {"configurable": {"thread_id": "conversation-1"}}
```

### 4.3 Per-Thread + Cross-Thread Memory (LangChain)

```python
# Per-thread (checkpointer)
config = {"configurable": {"thread_id": "conv-1"}}
graph.invoke(inputs, config)

# Cross-thread (store)
store = InMemoryStore()
graph = create_agent(model=llm, store=store)
```

### 4.4 CrewAI Memory System

Memory auto-extracted after each task:
```python
def _save_to_memory(self, output):
    memory = getattr(self.agent, "memory", None)
    if memory and not memory.read_only:
        raw = f"Task: {task}\nAgent: {role}\nResult: {output.text}"
        extracted = memory.extract_memories(raw)
        memory.remember_many(extracted, agent_role=role)
```

Scoped: `/crew/{name}/agent/{role}` with vector storage.

---

## 5. Middleware & Hook Patterns

### 5.1 AgentMiddleware Base Class (LangChain)

Hooks at every lifecycle stage:

```python
class AgentMiddleware(Generic[StateT, ContextT, ResponseT]):
    # Lifecycle hooks
    def before_agent(self, state, runtime) -> dict | None: ...
    def after_agent(self, state, runtime) -> dict | None: ...
    def before_model(self, state, runtime) -> dict | None: ...
    def after_model(self, state, runtime) -> dict | None: ...

    # Interception hooks — Retry, fallback, transform
    def wrap_model_call(self, request, handler) -> ModelResponse: ...
    def wrap_tool_call(self, request, handler) -> ToolMessage: ...
```

**Decorator syntax:**
```python
@before_model
def log_before(state, runtime):
    print(f"Messages: {len(state['messages'])}")

@wrap_model_call
def retry_twice(request, handler):
    for _ in range(2):
        try: return handler(request)
        except: continue
```

**Source:** `langchain-ai/langchain` — `libs/langchain/langchain/agents/middleware.py`

### 5.2 Callback System (LangChain)

Component-specific lifecycle:

```python
class BaseCallbackHandler:
    def on_llm_start(self, serialized, prompts, **kwargs): ...
    def on_llm_end(self, response, **kwargs): ...
    def on_tool_start(self, serialized, input_str, **kwargs): ...
    def on_tool_end(self, output, **kwargs): ...
    def on_chain_start(self, serialized, inputs, **kwargs): ...
    def on_chain_end(self, outputs, **kwargs): ...
```

**Streaming events v3:**
```python
async for event in agent.astream_events(inputs, version="v3"):
    # Events: message-start, content-delta, tool-call-start, tool-call-end, ...
    print(event)
```

### 5.3 Agent Lifecycle Hooks (OpenAI SDK)

```python
@dataclass
class AgentHooks:
    def on_start(self, context, agent): ...
    def on_end(self, context, agent, output): ...
    def on_handoff(self, context, agent, handoff): ...
    def on_tool_start(self, context, agent, tool): ...
    def on_tool_end(self, context, agent, tool, result): ...
```

### 5.4 Crew Callbacks

```python
crew = Crew(
    agents=[...],
    tasks=[...],
    step_callback=my_step_cb,    # Per agent step
    task_callback=my_task_cb,    # Per task completion
)
```

---

## 6. Orchestration Patterns

### 6.1 Sequential (CrewAI, AutoGen)

Tasks execute in order, each gets previous outputs as context:

```python
# CrewAI
crew = Crew(tasks=[research, write], process=Process.sequential)

# AutoGen
team = RoundRobinGroupChat([writer, reviewer, user_proxy])
```

### 6.2 LLM-Selected Round Robin (AutoGen)

LLM picks next speaker from conversation history:

```python
team = SelectorGroupChat(
    [agent_a, agent_b, agent_c],
    model_client=model_client,
    selector_func=my_custom_selector,  # Optional override
    allow_repeated_speaker=False,
)
```

### 6.3 Hierarchical (CrewAI, AutoGen)

A manager agent assigns and reviews work:

```python
crew = Crew(
    agents=[researcher, writer],
    tasks=[task_1, task_2],
    process=Process.hierarchical,
    manager_llm="gpt-4",  # Manager is a separate LLM
)
```

### 6.4 Handoff-Driven Swarm (AutoGen, OpenAI SDK)

Agents hand off control via `HandoffMessage`:

```python
# AutoGen
alice = AssistantAgent("Alice", handoffs=["Bob"])
bob = AssistantAgent("Bob", handoffs=["Charlie"])
team = Swarm([alice, bob, charlie])

# OpenAI SDK
agent = Agent(name="Support", handoffs=[handoff(billing_agent)])
```

### 6.5 Graph-Based (LangGraph, AutoGen)

Explicit DAG defines flow:

```python
# LangGraph
builder.add_edge(START, "agent")
builder.add_conditional_edges("agent", should_continue)
builder.add_edge("tools", "agent")  # Loop back

# AutoGen GraphFlow
builder = DiGraphBuilder()
builder.add_edge("AgentA", "AgentB")
builder.add_edge("AgentB", "AgentC")
builder.add_edge("AgentB", "AgentD")  # Fan-out
```

### 6.6 Agent-as-Tool (AutoGen)

Nest agents by wrapping them as tools:

```python
math_agent = AssistantAgent("math_expert", model_client=model_client)
math_tool = AgentTool(math_agent, return_value_as_last_message=True)

main_agent = AssistantAgent("assistant", tools=[math_tool, ...])
```

---

## 7. Guardrails & Safety Patterns

### 7.1 Input/Output Guardrails (OpenAI SDK)

```python
@input_guardrail
def check_safety(context, agent, input):
    if "malicious" in input:
        return GuardrailFunctionOutput(
            output_info={"reason": "blocked"},
            tripwire_triggered=True  # Halts execution
        )
    return GuardrailFunctionOutput(output_info=None, tripwire_triggered=False)

agent = Agent(
    name="SafeAgent",
    input_guardrails=[check_safety],
    output_guardrails=[...]
)
```

**Parallel guardrails:** Can run concurrently with the LLM call via `run_in_parallel=True`.

### 7.2 Task-Level Guardrails (CrewAI)

```python
task = Task(
    description="...",
    guardrail=my_validation_function,  # Callable or string (auto-wrapped in LLMGuardrail)
    guardrails=[guardrail1, guardrail2],  # Multiple
)
```

### 7.3 Tool-Level Guardrails (OpenAI SDK)

```python
@function_tool(needs_approval=True)  # Human-in-the-loop
def delete_file(path: str): ...

@function_tool(tool_input_guardrails=[...], tool_output_guardrails=[...])
def api_call(endpoint: str): ...
```

### 7.4 Human-in-the-Loop via Interrupts (LangGraph)

```python
graph = builder.compile(
    checkpointer=checkpointer,
    interrupt_before=["human_review"],
)

# Resume with human input
command = Command(resume="The answer is 42")
for chunk in graph.stream(command, config):
    print(chunk)
```

**Source:** `langchain-ai/langgraph` — `libs/langgraph/langgraph/types.py`

---

## 8. Structured Output Patterns

### 8.1 OpenAI SDK

```python
agent = Agent(
    name="Extractor",
    output_type=MyPydanticModel,  # Any Pydantic/dataclass/TypedDict
)
result = await Runner.run(agent, "Extract the data")
# result.final_output is MyPydanticModel
```

### 8.2 LangChain

```python
agent = create_agent(
    model=model,
    tools=[...],
    response_format=MyPydanticModel,
)
# Uses ToolStrategy, ProviderStrategy, or AutoStrategy
```

Internal strategies:
- `ToolStrategy` — Force tool calling to produce structured output
- `ProviderStrategy` — Native JSON mode (provider-specific)
- `AutoStrategy` — Auto-detect best approach

### 8.3 CrewAI

```python
task = Task(
    description="Extract info",
    output_pydantic=MyPydanticModel,
    output_json=True,
)
```

---

## 9. Termination Conditions (AutoGen)

Composable conditions with `&` (AND) and `|` (OR):

```python
termination = (
    MaxMessageTermination(10) |
    TextMentionTermination("TERMINATE")
)

team = RoundRobinGroupChat(
    agents=[...],
    termination_condition=termination,
)
```

Built-in: `MaxMessageTermination`, `TextMentionTermination`, `StopMessageTermination`, `TokenUsageTermination`, `HandoffTermination`, `TimeoutTermination`, `ExternalTermination`, `SourceMatchTermination`.

---

## 10. Persistence & Session Management

### 10.1 Checkpoint Graph (LangGraph)

```python
class BaseCheckpointSaver:
    async def put(self, config, checkpoint, metadata): ...
    async def get_tuple(self, config) -> CheckpointTuple: ...
    async def list(self, config, limit=None) -> Iterator[CheckpointTuple]: ...

# State snapshot contains:
class StateSnapshot:
    values: dict          # Current state
    next: tuple[str]      # Nodes to execute next
    config: RunnableConfig
    tasks: tuple[PregelTask]
    interrupts: tuple[Interrupt]
```

### 10.2 Sessions (OpenAI SDK)

```python
class Session(ABC):
    @abstractmethod
    async def save(self, conversation) -> None: ...
    @abstractmethod
    async def delete(self, conversation) -> None: ...
    @abstractmethod
    async def list(self, n) -> list[Conversation]: ...

# Implementations: SQLiteSession, OpenAIConversationSession
```

### 10.3 CrewAI Checkpointing

```python
# Serialize full runtime state
crew = Crew.from_checkpoint("checkpoint.json")
crew = Crew.fork("checkpoint.json")  # Branch from checkpoint
```

---

## 11. Tracing & Observability

### 11.1 Hierarchical Span Trace (OpenAI SDK)

```
Trace (top-level)
  └── TaskSpan (overall run)
      └── AgentSpan (per-agent)
          └── TurnSpan (per-turn)
              ├── GenerationSpan (LLM call)
              ├── FunctionSpan (tool execution)
              ├── HandoffSpan (handoff)
              └── GuardrailSpan (guardrail check)
```

Pluggable processors:
```python
set_trace_processors([MyCustomProcessor()])
```

### 11.2 LangChain Event Streaming v3

```python
async for event in agent.astream_events(inputs, version="v3"):
    if event["event"] == "on_chat_model_stream":
        print(event["data"]["chunk"].content, end="")
    elif event["event"] == "on_tool_start":
        print(f"\n🔧 Calling {event['name']}...")
```

### 11.3 CrewAI Event Bus

```python
crewai_event_bus  # Typed events for observability/tracing
```

---

## 12. Agent Runtime Architecture

### 12.1 BSP Execution Model (LangGraph)

```
Each step = 3 phases:
1. PLAN   — Determine which nodes to execute
2. EXECUTE— Run all selected nodes in PARALLEL
3. UPDATE — Apply writes to channels via reducers
```

### 12.2 Single-Threaded Runtime (AutoGen)

`asyncio.Queue` with three envelope types:
- `SendMessageEnvelope` — Direct RPC
- `PublishMessageEnvelope` — Broadcast
- `ResponseMessageEnvelope` — RPC response

### 12.3 Main Loop (Runner pattern — all frameworks)

```
while True:
  1. Prepare tools, model, output schema for current agent
  2. Run input guardrails (parallel or sequential)
  3. Call LLM
  4. Process response:
     a. Tool calls → execute → append results → continue
     b. Handoff → switch agent → continue
     c. Final output → run output guardrails → return
     d. Interruption → save state → pause
  5. Check max turns
```

**Sources:** `openai/openai-agents-python` — `run_loop.py`
`microsoft/autogen` — `_single_threaded_agent_runtime.py`
`langchain-ai/langgraph` — `_loop.py`

---

## Repos Mined

| Repo | Stars | Key Contribution |
|------|-------|-----------------|
| langchain-ai/langchain | 138k | Agent middleware, tool patterns, callback system, structured output, LCEL |
| microsoft/autogen | 58k | Multi-agent conversation, group chat patterns, Agent protocol, Swarm |
| crewAIInc/crewAI | 52k | Role-based agents, task chaining, delegation tools, hierarchical process |
| langchain-ai/langgraph | 33k | StateGraph, BSP execution, checkpointing, interrupts, Send/Command |
| openai/openai-agents-python | 26k | First-class Handoffs, guardrails, tracing span tree, session management |
| openai/swarm | 21k | Lightweight agent orchestration, function-return handoff pattern |
