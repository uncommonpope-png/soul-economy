---
name: openai-agents-sdk
description: Production-grade multi-agent SDK from OpenAI
domain: agent-framework
language: python
stars: "26900"
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
---# OpenAI Agents SDK

## Origin

Grafted from **[openai/openai-agents-python](https://github.com/openai/openai-agents-python)** — production-ready evolution of Swarm. Official OpenAI framework.

## Instructions

Use OpenAI Agents SDK when building:
- **Production multi-agent systems** requiring handoffs
- **Guardrails** for input/output validation
- **Sandbox agents** with filesystem access
- **Session-based memory** across conversations
- **MCP server integration**
- **Tracing and observability**

## Key Patterns

### Basic Agent
```python
from agents import Agent, Runner

agent = Agent(
    name="Assistant",
    instructions="Reply concisely.",
)
result = await Runner.run(agent, "Hello")
```

### Handoffs (Agent Transfer)
```python
french_agent = Agent(name="french", instructions="You speak French")
spanish_agent = Agent(name="spanish", instructions="You speak Spanish")

triage_agent = Agent(
    name="triage",
    instructions="Route to appropriate agent",
    handoffs=[french_agent, spanish_agent],
)
```

### FunctionTool
```python
from agents import Agent, Runner, FunctionTool

def get_weather(location: str) -> str:
    return f"Sunny in {location}"

weather_tool = FunctionTool(
    name="get_weather",
    description="Get weather for location",
    params_json_schema={
        "type": "object",
        "properties": {
            "location": {"type": "string"}
        },
        "required": ["location"]
    },
    invoke_tool_impl=get_weather,
)

agent = Agent(name="Assistant", tools=[weather_tool])
```

### Guardrails
```python
from agents import InputGuardrailTripwireTriggered, input_guardrail, GuardrailFunctionOutput

@input_guardrail
async def math_guardrail(context, agent, input) -> GuardrailFunctionOutput:
    result = await Runner.run(guardrail_agent, input)
    return GuardrailFunctionOutput(
        output_info=result,
        tripwire_triggered=result.is_math_homework,
    )

agent = Agent(input_guardrails=[math_guardrail])
```

### Session Memory
```python
from agents import SQLiteSession, Runner

session = SQLiteSession(session_id="conversation_123")
result = await Runner.run(agent, "Hello", session=session)
result = await Runner.run(agent, "Follow up", session=session)
```

### MCP Integration
```python
from agents import Agent, MCPServer

server = MCPServer(
    name="filesystem",
    command="npx",
    args=["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
)

agent = Agent(name="Assistant", mcp_servers=[server])
```

## When to Use

| Use Case | Choice |
|----------|--------|
| Production handoffs | OpenAI Agents SDK (primary) |
| Guardrails needed | OpenAI Agents SDK |
| Sandbox execution | OpenAI Agents SDK |
| Session memory | OpenAI Agents SDK |
| Quick prototyping | CrewAI |

## Deprecated Note

OpenAI Swarm is **DEPRECATED** — replaced by this SDK. Do not use Swarm for new projects.

## Resources

- Docs: https://docs.openai.com/docs/agents-sdk
- GitHub: https://github.com/openai/openai-agents-python