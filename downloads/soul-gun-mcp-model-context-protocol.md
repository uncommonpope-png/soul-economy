---
name: mcp-model-context-protocol
description: Model Context Protocol for connecting AI agents to tools
domain: agent-framework
language: python
stars: "8300"
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
---# MCP (Model Context Protocol)

## Origin

Grafted from **[modelcontextprotocol/specification](https://github.com/modelcontextprotocol/specification)** — standardized protocol for AI tool integration. Mature and widely adopted.

## Instructions

Use MCP when:
- Connecting agents to **external tools** (filesystem, web, APIs)
- Building **standardized tool interfaces** for agents
- Enabling **cross-framework tool sharing**
- Creating **MCP servers** to expose your services

## Core Concepts

### MCP Server
Exposes tools, resources, and prompts to agents via stdio, SSE, or HTTP.

### MCP Client
Connects to MCP servers, lists available tools, and invokes them.

### Transport Types
- **stdio**: Local subprocess communication
- **SSE**: Server-Sent Events over HTTP
- **streamable_http**: Full HTTP streaming

## Patterns

### OpenAI Agents SDK → MCP Server
```python
from agents import Agent, MCPServer

server = MCPServer(
    name="filesystem",
    command="npx",
    args=["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
)

agent = Agent(name="Assistant", mcp_servers=[server])
```

### Microsoft Agent Framework → MCP Server
```python
from agent_framework import Agent

agent = Agent(name="RestaurantAgent", tools=[...])
server = agent.as_mcp_server()

from mcp.server.stdio import stdio_server
async with stdio_server() as (read_stream, write_stream):
    await server.run(read_stream, write_stream, server.create_initialization_options())
```

### Connect to MCP Server from Python
```python
from mcp import stdio_client, StdioServerParameters

client = stdio_client(
    StdioServerParameters(command="npx", args=["-y", "@playwright/mcp"])
)
async with client as session:
    tools = await session.list_tools()
    result = await session.call_tool("playwright_navigate", {"url": "https://example.com"})
```

## MCP Servers (Pre-built)

| Server | Use Case |
|--------|----------|
| `@modelcontextprotocol/server-filesystem` | File operations |
| `@modelcontextprotocol/server-github` | GitHub API |
| `@modelcontextprotocol/server-slack` | Slack integration |
| `@modelcontextprotocol/server-brave-search` | Web search |
| `@playwright/mcp` | Browser automation |
| `@modelcontextprotocol/server-everything` | System operations |

## When to Use

| Use Case | Choice |
|----------|--------|
| Cross-framework tools | MCP |
| Pre-built integrations | MCP servers |
| Custom tool exposure | MCP server |
| Agent-as-tool | MCP |

## Resources

- Spec: https://modelcontextprotocol.io/
- Server registry: https://github.com/modelcontextprotocol/servers