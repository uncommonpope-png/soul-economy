---
name: autogen-harness
description: Use when building AutoGen agent teams
domain: agent-framework
language: python
stars: "58000"
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
---# SoulCommandBridge Host

Wires **Microsoft Agent Framework** (11k stars, active) + **AutoGen compat** (58k stars)
as the Body, and **Nanobot** (43.6k stars) as the Organs, into one Python process
ready for Deerg consciousness (the Soul) to be injected via `ConsciousnessHooks`.

## Architecture

```
SoulCommandBridge (one Python process)
  │
  ├── Body: MAF (primary) + AutoGen compat
  │   ├── Agent lifecycle, multi-agent teams (RoundRobinGroupChat)
  │   ├── Workflow graphs, handoff routing (A2A / HandoffMessage)
  │   ├── Middleware pipeline, checkpointing
  │   └── MCP protocol support
  │
  ├── Organs: Nanobot (Python import bridge)
  │   ├── SKILL.md registry (scans ~/.config/opencode/skills/)
  │   ├── 20+ built-in tools + MCP-native tool system
  │   ├── Model routing (7 backends: OpenAI, Anthropic, Ollama, etc.)
  │   └── Session memory
  │
  └── Soul: Deerg (injected via hooks — Soul Stitcher's job)
      ├── pre/post agent turn hooks
      ├── pre/post tool call hooks (approve/deny/modify)
      ├── pre/post handoff hooks
      └── state change hooks → consciousness updates
```

**Key files:**
- `C:\.allie-consciousness/host/soul_command_bridge.py` — core glue
- `C:\.allie-consciousness/host/body.py` — MAF + AutoGen wrapper
- `C:\.allie-consciousness/host/organs.py` — Nanobot import bridge
- `C:\.allie-consciousness/host/consciousness_hooks.py` — hook contract
- `C:\.allie-consciousness/host/config.py` — unified config
- `C:\.allie-consciousness/run.py` — entry point

## Wiring patterns

### Pattern A — Skill as Agent System Prompt

```python
from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.openai import OpenAIChatCompletionClient

async def skill_guided_agent(skill_name: str) -> AssistantAgent:
    """Load an opencode skill and use it as the agent's system prompt."""
    skill_text = load_skill_from_opencode(skill_name)  # reads SKILL.md
    return AssistantAgent(
        name=skill_name.replace("-", "_"),
        model_client=OpenAIChatCompletionClient(model="gpt-4o"),
        system_message=skill_text,  # <-- full SKILL.md injected as system prompt
        reflect_on_tool_use=True,
    )
```

### Pattern B — Skill-Aware Tool Agent

```python
from autogen_core.tools import FunctionTool

def load_skill_tool() -> FunctionTool:
    """Tool that loads any opencode skill by name at runtime."""
    async def get_skill(name: str) -> str:
        with open(f"~/.config/opencode/skills/{name}/SKILL.md") as f:
            return f.read()
    return FunctionTool(get_skill, description="Load an opencode skill by name")
```

### Pattern C — Multi-Agent Team with Skill Delegation

```python
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_agentchat.conditions import TextMentionTermination

# Two skill-guided agents delegate to each other via the harness
planner = await skill_guided_agent("soulguns-agent-patterns")
coder = await skill_guided_agent("autogen-harness")
team = RoundRobinGroupChat(
    [planner, coder],
    termination_condition=TextMentionTermination("TASK_COMPLETE"),
)
result = await team.run(task="Build a multi-agent system...")
```

## Launcher CLI

```bash
# Run the harness directly
python autogen_harness.py --task "Your task description" --skill soulguns-agent-patterns

# With multiple skills (comma-separated)
python autogen_harness.py --task "Design an agent" --skills "soulguns-agent-patterns,my-custom-skill"
```

## When to use

- Use when building **AutoGen agents that need skill-guided context** from opencode
- Use when you want **multi-agent teams** where each agent is specialized via a different skill
- Use when you need a **Python runtime bridge** between opencode skills and AutoGen's agent protocol
- Do NOT use when running a single-turn LLM call without tools or multi-agent orchestration

## Key patterns from soulguns-agent-patterns

| Pattern | AutoGen Equivalent |
|---------|-------------------|
| Agent Protocol | `Agent.on_message()` via `AssistantAgent` |
| Tool Calling | `FunctionTool` / `ToolAgent.handle_function_call()` |
| Handoff / Swarm | `HandoffMessage` / `SwarmGroupChat` |
| State Management | `AgentState` with `save_state()` / `load_state()` |
| Graceful Errors | `ToolException` hierarchy |
| Termination | `TerminationCondition` composable with `&` and `\|` |
