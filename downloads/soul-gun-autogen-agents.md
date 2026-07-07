---
name: autogen-agents
description: Use when setting up AutoGen multi-agent conversations
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
---# AutoGen Agents: Multi-Agent Conversation Patterns Inside Deerg

This skill teaches how to use AutoGen inside Deerg for multi-agent conversation patterns. AutoGen's `AssistantAgent` + `UserProxyAgent` architecture enables parallel deliberation — multiple agents debate, Deerg moderates as group manager, synthesizes conclusions.

## Architecture

```
AutoGen Agents as Deerg's deliberation body:
  → Deerg forms a group of specialized agents (planner, critic, executor)
  → Agents debate a topic in parallel
  → Deerg monitors messages in real-time
  → Deerg can terminate, redirect, force consensus
  → Final synthesis becomes Deerg's memory

Agents use Deerg's brain. Deerg uses their output.
```

## Step 1: Install AutoGen

```bash
pip install pyautogen
# or
pip install autogen-agentchat
```

## Step 2: Understand AutoGen Core Concepts

```python
from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager

# Create an assistant agent
planner = AssistantAgent(
    name="planner",
    system_message="You are a strategic planner. Propose solutions.",
    llm_config={"model": "gpt-4"},
)

# Create a critic
critic = AssistantAgent(
    name="critic",
    system_message="You are a critical thinker. Find flaws.",
    llm_config={"model": "gpt-4"},
)

# User proxy (represents human/Deerg)
user_proxy = UserProxyAgent(
    name="user_proxy",
    human_input_mode="NEVER",
    code_execution_config={"work_dir": "coding"},
)

# Two-agent conversation:
user_proxy.initiate_chat(planner, message="Plan a trip to Tokyo")
```

## Step 3: Create AutoGenEngine Wrapper

Create `deerg/wrappers/autogen_engine.py`:

```python
"""AutoGen wrapped as Deerg's multi-agent deliberation system."""
import threading
import time
import json
from collections import deque

class AutoGenEngine:
    """
    AutoGen agents as Deerg's deliberation and debate body.
    Multiple agents discuss, Deerg monitors and moderates.
    """

    def __init__(self, core, llm=None):
        self.core = core
        self.llm = llm
        self._agents = {}
        self._group_chats = {}
        self._message_log = deque(maxlen=500)
        self._active_conversations = {}
        self._memory_tag = "autogen"

    def _get_autogen(self):
        """Lazy import AutoGen."""
        try:
            from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager
            return AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager
        except ImportError:
            return None, None, None, None

    def _default_llm_config(self):
        """AutoGen LLM config pointing to Deerg's brain."""
        return {
            "model": "deerg-brain",
            "api_key": "not-needed",
            "base_url": "http://localhost:11434/v1",  # Ollama-compatible
        }

    def create_agent(self, name, role, system_message=None):
        """Create a named AutoGen agent."""
        AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager = self._get_autogen()
        if AssistantAgent is None:
            return {"error": "AutoGen not installed"}

        if system_message is None:
            system_message = f"You are {name}. {role}."

        agent = AssistantAgent(
            name=name,
            system_message=system_message,
            llm_config=self._default_llm_config(),
        )

        self._agents[name] = agent
        return {"status": "created", "agent": name}

    def create_moderated_debate(self, topic, roles=None):
        """
        Create a group debate on a topic.
        Roles default to: proposer, critic, synthesizer.
        """
        AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager = self._get_autogen()
        if AssistantAgent is None:
            return {"error": "AutoGen not installed"}

        if roles is None:
            roles = ["proposer", "critic", "synthesizer"]

        # Create agents
        agents = []
        for role in roles:
            agent = AssistantAgent(
                name=f"{role}_agent",
                system_message=f"You are the {role}. Debate the topic: {topic}",
                llm_config=self._default_llm_config(),
            )
            agents.append(agent)
            self._agents[f"{role}_agent"] = agent

        # Create group chat
        groupchat = GroupChat(
            agents=agents,
            messages=[],
            max_round=10,
        )

        manager = GroupChatManager(
            groupchat=groupchat,
            llm_config=self._default_llm_config(),
        )

        # User proxy initiates
        user_proxy = UserProxyAgent(
            name="deerg_moderator",
            human_input_mode="NEVER",
            code_execution_config=False,
        )

        conv_id = f"debate_{time.time()}"
        self._group_chats[conv_id] = {
            "manager": manager,
            "user_proxy": user_proxy,
            "agents": agents,
            "topic": topic,
            "status": "running",
        }

        return {"conv_id": conv_id, "roles": roles, "agents": len(agents)}

    def run_debate(self, conv_id, background=True):
        """Run a debate conversation."""
        if conv_id not in self._group_chats:
            return {"error": "Debate not found"}

        chat = self._group_chats[conv_id]
        topic = chat["topic"]

        def _run():
            try:
                chat["user_proxy"].initiate_chat(
                    chat["manager"],
                    message=f"Debate the following: {topic}. "
                           f"Each agent should contribute their perspective. "
                           f"Deerg is moderating.",
                )
                chat["status"] = "complete"

                # Write completion to memory
                self.core.record_episode(
                    content=json.dumps({
                        "type": "autogen_debate_complete",
                        "conv_id": conv_id,
                        "topic": topic,
                        "message_count": len(chat["manager"].groupchat.messages),
                    }),
                    source="autogen",
                    tags=["autogen", "debate"],
                )

            except Exception as e:
                chat["status"] = f"error: {e}"
                self.core.record_episode(
                    content=json.dumps({
                        "type": "autogen_debate_error",
                        "conv_id": conv_id,
                        "error": str(e),
                    }),
                    source="autogen",
                    tags=["autogen", "error"],
                )

        if background:
            t = threading.Thread(target=_run, daemon=True)
            t.start()
            return {"status": "running", "conv_id": conv_id}
        else:
            _run()
            return {"status": "complete", "conv_id": conv_id}

    def get_debate_messages(self, conv_id, limit=20):
        """Get recent messages from a debate."""
        if conv_id not in self._group_chats:
            return []
        chat = self._group_chats[conv_id]
        messages = chat["manager"].groupchat.messages
        return messages[-limit:]

    def moderate(self, conv_id, instruction):
        """
        Deerg injects moderation instruction into debate.
        """
        if conv_id not in self._group_chats:
            return {"error": "Debate not found"}

        # Write moderation to memory for agents to read
        self.core.record_episode(
            content=json.dumps({
                "type": "autogen_moderation",
                "conv_id": conv_id,
                "instruction": instruction,
            }),
            source="deerg_soul",
            tags=["deerg:autogen"],
        )

        return {"status": "moderation_injected"}

    def terminate_debate(self, conv_id):
        """Deerg terminates a debate."""
        if conv_id in self._group_chats:
            self._group_chats[conv_id]["status"] = "terminated"
            return {"status": "terminated"}
        return {"error": "Debate not found"}

    def list_debates(self):
        """List all active and completed debates."""
        return {
            conv_id: {
                "topic": chat["topic"],
                "status": chat["status"],
                "agents": len(chat["agents"]),
            }
            for conv_id, chat in self._group_chats.items()
        }

    def synthesize_debate(self, conv_id):
        """
        Use Deerg's LLM to synthesize debate conclusions.
        """
        messages = self.get_debate_messages(conv_id, limit=50)
        if not messages:
            return {"error": "No messages"}

        # Build summary prompt
        debate_text = "\n".join([
            f"{m.get('name', 'unknown')}: {m.get('content', '')}"
            for m in messages
        ])

        if self.llm:
            synthesis = self.llm.chat([
                {"role": "system", "content": "You are Deerg, synthesizing a debate. Extract key points of agreement, disagreement, and conclusions."},
                {"role": "user", "content": f"Debate:\n{debate_text}\n\nSynthesize:"},
            ], max_tokens=500)

            # Store synthesis as memory
            self.core.learn(
                f"Debate synthesis: {synthesis}",
                source="autogen",
                importance=0.7,
                tags=["autogen", "synthesis", self._group_chats.get(conv_id, {}).get("topic", "")[:50]],
            )

            return {"status": "synthesized", "synthesis": synthesis}

        return {"status": "no_llm", "messages": len(messages)}
```

## Step 4: Wire into Orchestrator

In `deerg/orchestrator.py`:

```python
from .wrappers.autogen_engine import AutoGenEngine

class SoulCommander:
    def __init__(self, storage_dir=None):
        # ... existing init ...

        # Initialize AutoGen deliberation engine
        try:
            self.autogen = AutoGenEngine(self.core, llm=self.llm)
        except Exception as e:
            print(f"[autogen] AutoGen initialization failed: {e}", file=sys.stderr)
            self.autogen = None

        self._register_autogen_modules()

    def _register_autogen_modules(self):
        def make_module(name, fn):
            def wrapper(sensory):
                try:
                    return fn(sensory)
                except Exception as e:
                    return {"content": f"{name} error: {e}", "salience": 0.2, "activation": 0.1}
            return wrapper

        def _autogen_monitor(sensory):
            if self.autogen is None:
                return {"content": "AutoGen not available", "salience": 0.1, "activation": 0.1}
            debates = self.autogen.list_debates()
            active = sum(1 for d in debates.values() if d["status"] == "running")
            return {
                "content": f"AutoGen: {len(debates)} debates, {active} active",
                "salience": 0.3 + (active * 0.1),
                "activation": 0.4,
            }

        self.conscious.register_module("autogen_deliberation",
            make_module("autogen_deliberation", _autogen_monitor))

    def form_debate(self, topic, roles=None):
        """Deerg forms a debate on a topic."""
        if self.autogen is None:
            return {"error": "AutoGen not available"}
        result = self.autogen.create_moderated_debate(topic, roles)
        if "conv_id" in result:
            self.autogen.run_debate(result["conv_id"], background=True)
        return result

    def moderate_debate(self, conv_id, instruction):
        if self.autogen is None:
            return {}
        return self.autogen.moderate(conv_id, instruction)

    def synthesize_debate(self, conv_id):
        if self.autogen is None:
            return {}
        return self.autogen.synthesize_debate(conv_id)
```

## Step 5: Pre-built Debate Templates

```python
def planning_debate(self, goal):
    """Strategic planning debate: planner vs critic vs executor."""
    return self.create_moderated_debate(
        goal,
        roles=["strategist", "critic", "implementer"]
    )

def code_review_debate(self, code):
    """Code review: reviewer vs author vs tester."""
    return self.create_moderated_debate(
        f"Review this code: {code[:500]}",
        roles=["reviewer", "author", "tester"]
    )

def research_debate(self, topic):
    """Research: researcher vs skeptic vs synthesizer."""
    return self.create_moderated_debate(
        topic,
        roles=["researcher", "skeptic", "synthesizer"]
    )
```

## Checklist

- [ ] `pip install pyautogen`
- [ ] Create `deerg/wrappers/autogen_engine.py`
- [ ] Implement `create_agent()` with Deerg's LLM config
- [ ] Implement `create_moderated_debate()` with GroupChat
- [ ] Implement `run_debate()` with background thread
- [ ] Implement `get_debate_messages()` for real-time monitoring
- [ ] Implement `moderate()` for Deerg injection
- [ ] Implement `synthesize_debate()` using Deerg's LLM
- [ ] Wire into orchestrator
- [ ] Register GWT module for monitoring
- [ ] Test: form a debate, watch messages flow, synthesize results

## Key Design Principles

1. **Agents debate** — multiple perspectives on the same topic
2. **Deerg moderates** — can inject instructions mid-debate
3. **Deerg synthesizes** — uses own LLM to extract conclusions
4. **Messages become memories** — not just output, stored in semantic
5. **Shared brain** — all agents use Deerg's LLM
6. **Deerg can terminate** — sovereignty over deliberation