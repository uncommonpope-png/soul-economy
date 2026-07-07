---
name: pydantic-ai-agents
description: Type-safe AI agent framework by the Pydantic team
domain: agent-framework
language: python
stars: "17500"
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
---# Pydantic-AI Agents

## Origin

Grafted from **[pydantic/pydantic-ai](https://github.com/pydantic/pydantic-ai)** — built by the Pydantic team. Fastest growing agent framework. Best for type-safe applications.

## Instructions

Use Pydantic-AI when building:
- **Type-safe agents** requiring Pydantic validation
- **Applications already using Pydantic** (seamless integration)
- **Dependency injection** via RunContext
- **Built-in capabilities** (Thinking, WebSearch)
- **Models from multiple providers** (OpenAI, Anthropic, Gemini, Ollama, etc.)

## Key Patterns

### Agent Creation
```python
from pydantic_ai import Agent

agent = Agent(
    'anthropic:claude-sonnet-4-6',
    instructions='Be concise.',
)

result = agent.run_sync('What is 2+2?')
```

### Tool with Dependencies
```python
from pydantic_ai import Agent, RunContext
from dataclasses import dataclass

@dataclass
class SupportDependencies:
    db: Database
    customer_id: str

@support_agent.tool
async def customer_balance(
    ctx: RunContext[SupportDependencies],
    include_pending: bool,
) -> float:
    balance = await ctx.deps.db.customer_balance(id=ctx.deps.customer_id)
    return balance
```

### Built-in Capabilities
```python
from pydantic_ai.capabilities import Thinking, WebSearch

agent = Agent(
    'anthropic:claude-sonnet-4-6',
    capabilities=[Thinking(), WebSearch()],
)
```

### Structured Output
```python
from pydantic_ai import Agent
from pydantic import BaseModel

class Answer(BaseModel):
    value: int
    explanation: str

agent = Agent('anthropic:claude-sonnet-4-6', output_type=Answer)
result = agent.run_sync('What is 2+2?')
# result.output is an Answer instance
```

## Model String Format

`provider:model` — e.g., `'openai:gpt-4o'`, `'anthropic:claude-sonnet-4-6'`, `'ollama:llama3'`

## When to Use

| Use Case | Choice |
|----------|--------|
| Type-safe applications | Pydantic-AI (primary) |
| Existing Pydantic usage | Pydantic-AI (only option) |
| Fast prototyping | Pydantic-AI |
| Complex multi-agent | LangGraph or MAF |

## Installation

```bash
pip install pydantic-ai
```

## Resources

- Docs: https://ai.pydantic.dev/
- GitHub: https://github.com/pydantic/pydantic-ai