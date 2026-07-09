---
name: a2a-agent-to-agent-protocol
description: Use when implementing A2A agent-to-agent communication between agents from different frameworks
domain: agent-framework
language: python
stars: "8000"
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
---# A2A (Agent-to-Agent) Protocol

## Origin

Emerging standard co-developed by Microsoft, Google, and others for cross-framework agent communication. Enables agents built on different frameworks to interact seamlessly.

## Instructions

Use A2A when:
- **Multi-framework agent systems** (MAF + LangGraph + CrewAI working together)
- **Microservices-style agents** that communicate via messages
- **Enterprise agent orchestration** across teams
- **Agent discovery** via agent cards

## Core Concepts

### Agent Card
JSON metadata describing an agent's capabilities, endpoints, and provider.

### Task + Message
Persistent task with messages exchanged between agents.

### Push Notifications
Server-side events when agent tasks complete or need attention.

## Patterns

### Microsoft Agent Framework → A2A
```python
from agent_framework.a2a import A2AAgent
from a2a.client import A2ACardResolver
import httpx

resolver = A2ACardResolver(
    httpx_client=http_client,
    base_url="https://agent.example.com"
)
agent_card = await resolver.get_agent_card()

async with A2AAgent(
    name=agent_card.name,
    agent_card=agent_card,
    url="https://agent.example.com",
) as agent:
    response = await agent.run("query")
```

### A2A Client (Generic)
```python
from a2a.client import A2AClient
from a2a.types import Message, TextPart

client = A2AClient(
    url="https://your-agent.example.com",
    timeout=30,
)

await client.send_message(
    task_id="task-123",
    message=Message(
        parts=[TextPart(text="Hello agent!")]
    )
)
```

### A2A Server (Agent Implementation)
```python
from a2a.server import A2AServer
from a2a.types import AgentCard, TextPart, Message

server = A2AServer(
    agent_card=AgentCard(
        name="my-agent",
        description="A helpful agent",
        url="https://my-agent.example.com",
    ),
    message_handler=your_handler,
)
```

## When to Use

| Use Case | Choice |
|----------|--------|
| Cross-framework agents | A2A |
| Enterprise orchestration | A2A |
| Microservices agents | A2A |
| Agent discovery | A2A |
| Simple multi-agent | Built-in handoffs |

## Status

**EMERGING** — less adoption than MCP, but growing. Microsoft MAF has native A2A support.

## Resources

- Spec: https://microsoft.github.io/a2a/
- Reference impl: https://github.com/microsoft/a2a