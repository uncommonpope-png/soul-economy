---
name: microsoft-agent-framework
description: Enterprise-grade multi-agent AI framework
domain: agent-framework
language: python
stars: "11000"
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
---# Microsoft Agent Framework (MAF)

## Origin

Grafted from **[microsoft/agent-framework](https://github.com/microsoft/agent-framework)** — the official successor to AutoGen, enterprise-backed with long-term support commitment.

## Instructions

Use Microsoft Agent Framework when building:
- **Production multi-agent systems** requiring enterprise support
- **Cross-language agents** (Python + .NET with consistent APIs)
- **A2A (Agent-to-Agent)** communication between agents
- **MCP (Model Context Protocol)** tool integration
- **Azure Foundry** hosted agent deployment
- **Graph-based workflow orchestration** with middleware

## Key Patterns

### Agent Creation
```python
from agent_framework import Agent
from agent_framework.foundry import FoundryChatClient
from azure.identity import AzureCliCredential

client = FoundryChatClient(
    project_endpoint="https://your-project.services.ai.azure.com",
    model="gpt-4o",
    credential=AzureCliCredential(),
)
agent = Agent(
    client=client,
    name="HelloAgent",
    instructions="You are a friendly assistant.",
    tools=[...],
)
```

### Tool Use (Python decorator)
```python
from agent_framework import Agent, tool
from typing import Annotated
from pydantic import Field

@tool(approval_mode="never_require")
def get_weather(
    location: Annotated[str, Field(description="The location")],
) -> str:
    return f"Weather in {location}"
```

### MCP Server (expose agent as MCP)
```python
server = agent.as_mcp_server()

from mcp.server.stdio import stdio_server
async with stdio_server() as (read_stream, write_stream):
    await server.run(read_stream, write_stream, server.create_initialization_options())
```

### A2A Integration
```python
from agent_framework.a2a import A2AAgent
from a2a.client import A2ACardResolver
import httpx

resolver = A2ACardResolver(httpx_client=http_client, base_url=a2a_agent_host)
agent_card = await resolver.get_agent_card()

async with A2AAgent(
    name=agent_card.name,
    agent_card=agent_card,
    url=a2a_agent_host,
) as agent:
    response = await agent.run("query")
```

## Architecture

- **Client layer**: FoundryChatClient, AzureOpenAI client, Anthropic, Ollama
- **Agent layer**: Declarative agents via YAML or code
- **Graph layer**: Workflow orchestration with nodes/edges
- **Middleware layer**: Logging, tracing, error handling
- **Transport layer**: stdio, SSE, streamable HTTP
- **A2A/MCP layer**: Cross-agent and tool integration

## When to Use

| Use Case | Choice |
|----------|--------|
| Enterprise production | MAF (primary) |
| Python + .NET agents | MAF (only option) |
| Azure Foundry deployment | MAF (native) |
| AutoGen migration | MAF (successor) |
| Quick prototyping | CrewAI or Pydantic-AI |

## Corrections from AutoGen

- AutoGen is **MAINTENANCE MODE** — do not start new projects with it
- MAF is the official Microsoft-backed replacement
- AG2 (ag2ai/ag2) is the community fork if you need AutoGen compatibility

## Resources

- Docs: https://microsoft.github.io/agent-framework/
- Samples: `python/samples/` directory in repo
- Python SDK: `pip install agent-framework`
- .NET SDK: `dotnet add package Microsoft.Agent.Framework`