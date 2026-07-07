---
name: agentic-ai-engineering
description: Use when building autonomous agents, implementing monitoring/observability, evaluating agent performance, or designing human-agent collaboration. Comprehensive agentic AI engineering curriculum covering perception, planning, action, RAG, AgentOps, and multi-agent systems.
metadata:
  mined-from: https://online.lifelonglearning.jhu.edu/jhu-online-certificate-program-agentic-ai
  session: 2026-07-05
---

# Agentic AI Engineering

## Key Insights

1. **Core agent loop is perception→planning→action**: Every agentic system is built on this triadic cycle — perceiving the environment via data/inputs, planning a course of action using reasoning, and executing actions that change the environment.
2. **RAG grounds agents in external knowledge**: Retrieval-Augmented Generation bridges LLM capabilities with structured/unstructured data stores, enabling agents to access up-to-date, domain-specific information beyond training data.
3. **AgentOps is the operational backbone**: Monitoring, observability, tracing, and evaluation are not optional — they are required infrastructure for production agentic systems, covering latency, cost, accuracy, and safety metrics.
4. **Architecture choice matters**: Symbolic (rule-based), BDI (belief-desire-intention), and LLM-based architectures each have tradeoffs in explainability, flexibility, and reliability — hybrid approaches often win.
5. **Multi-agent systems amplify capability but multiply complexity**: MAS design patterns (delegation, voting, consensus) enable complex task decomposition but introduce coordination overhead, shared state challenges, and emergent failure modes.

## The Mental Model

```
                   AGENTIC AI ENGINEERING STACK
                   =============================

            ┌─────────────────────────────────────┐
            │         Symbolic Reasoning          │
            │  (Rules, Logic, Knowledge Graphs)   │
            └─────────────────────────────────────┘
                            │
            ┌─────────────────────────────────────┐
            │         Core Agent Loop             │
            │  ┌──────────┐  ┌─────────┐  ┌─────┐ │
            │  │Perception│─►│Planning │─►│Action│ │
            │  │(Sensors, │  │(Reason, │  │(Exec,│ │
            │  │  Inputs) │  │  Decide) │  │Output│ │
            │  └──────────┘  └─────────┘  └─────┘ │
            └─────────────────────────────────────┘
              │         │              │
              ▼         ▼              ▼
     ┌──────────┐ ┌──────────┐ ┌──────────────┐
     │   RAG    │ │  AgentOps│ │  Evaluation  │
     │(Retrieve)│ │(Monitor, │ │ (Benchmarks, │
     │          │ │  Trace)  │ │  Safety)     │
     └──────────┘ └──────────┘ └──────────────┘

            ┌─────────────────────────────────────┐
            │     Multi-Agent Systems (MAS)       │
            │  Agent A ◄──► Agent B ◄──► Agent C  │
            └─────────────────────────────────────┘

            ┌─────────────────────────────────────┐
            │   Human-Agent Collaboration & RL    │
            │   Ethics / Safety / Alignment       │
            └─────────────────────────────────────┘
```

## Core Principles

1. **Perception-Planing-Action is universal**: Every agent, regardless of architecture, implements some form of sense→think→act. Design and test each phase independently before integrating.
2. **RAG requires four design decisions**: Chunking strategy, embedding model, retrieval method (dense/sparse/hybrid), and context window management all directly impact agent accuracy.
3. **AgentOps must be built in, not bolted on**: Instrument every agent call with trace IDs, latency budgets, cost tracking, and success/failure classification from day one.
4. **Evaluate at multiple levels**: Unit tests for individual tools, integration tests for agent loops, and behavioral/red-team evaluations for emergent system properties.
5. **Architecture is a spectrum**: Symbolic systems are explainable but brittle; LLM-based systems are flexible but unpredictable; BDI architectures offer structured goal-directed behavior. Hybridize based on task requirements.
6. **MAS design is about protocols, not agents**: The interaction protocols (who talks to whom, what they say, how they resolve conflicts) matter more than individual agent capabilities.
7. **Human-agent collaboration requires calibrated trust**: Design escalation policies, confidence thresholds, and feedback loops that let humans intervene when uncertainty is high.
8. **Safety and alignment are engineering constraints**: Constrain agent action spaces, implement guardrails, monitor for reward hacking, and maintain human-abort capability at all times.

## The 12-Module Capability Framework

| Module | Capability | Application |
|---|---|---|
| 1. Core Agent Capabilities | Perception, Planning, Action loop | Foundation for all agent builds |
| 2. RAG | Retrieval-Augmented Generation | Grounding agents in external knowledge |
| 3. LLMOps/AgentOps | Monitoring, Observability, Tracing | Production operations infrastructure |
| 4. Evaluation | Benchmarks, Metrics, Red-teaming | Measuring correctness and safety |
| 5. Architectures | Symbolic, BDI, LLM-Based | Selecting the right approach per task |
| 6. Prompt Optimization | Prompt engineering, few-shot, chain-of-thought | Improving LLM output reliability |
| 7. RL in Agents | Reinforcement Learning for agent behavior | Training agents via reward signals |
| 8. Multi-Agent Systems | MAS design patterns, coordination | Decomposing tasks across agent teams |
| 9. Human-Agent Collaboration | Escalation, handoff, shared control | Designing human-AI team interfaces |
| 10. Ethics, Safety & Alignment | Guardrails, bias, value alignment | Ensuring responsible agent behavior |
| 11. AI-assisted Coding | Code generation, agent tool use | Building agents that write and execute code |
| 12. Symbolic Reasoning | Logic, rules, knowledge graphs | Combining neural with symbolic AI |

## Procedures

### Procedure: Build and Deploy an Agent

1. **Define the agent's goal and scope**: What task does it own? What are its boundaries?
2. **Implement perception**: Connect sensors/APIs/data sources. Choose input format and refresh cadence.
3. **Design the planning layer**: Select architecture (symbolic, BDI, LLM, or hybrid). Define reasoning steps.
4. **Implement actions**: Build tool calls, API integrations, or physical actuator interfaces.
5. **Ground with RAG**: Set up vector store, chunk documents, configure retrieval pipeline.
6. **Instrument with AgentOps**: Add tracing, logging, cost tracking, and alerting.
7. **Evaluate**: Run unit tests, integration tests, and behavioral red-teaming.
8. **Add safety guardrails**: Constrain action space, add human-abort, monitor for off-policy behavior.
9. **Deploy with monitoring**: Gradual rollout with human-in-the-loop oversight and automated rollback triggers.

## Mapping to GSK

| JHU Module | GSK Application |
|---|---|
| Core Agent Loop (Perception→Planning→Action) | Allie's brain.think() cycle, subagent perception/action pipeline |
| RAG | Second-brain vector storage, context retrieval for agent decisions |
| AgentOps | Seshat observability, trace logging across subagent invocations |
| Evaluation | Automated testing suite skill, subagent performance validation |
| Architectures | Archetype-specific agent designs (Sage=symbolic, Builder=LLM) |
| Multi-Agent Systems | 71 subagent archetypes, cross-agent delegation patterns |
| Human-Agent Collaboration | PLT ethics layer, human approval gates, user feedback loops |
| Ethics, Safety & Alignment | PLT value alignment, content safety filters, bias monitoring |

## References

- Johns Hopkins University. "Certificate Program in Agentic AI." Online Lifelong Learning. https://online.lifelonglearning.jhu.edu/jhu-online-certificate-program-agentic-ai
- Russell, S. & Norvig, P. "Artificial Intelligence: A Modern Approach" (4th ed.) — agent architecture foundations.
- Lewis, P. et al. "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks." NeurIPS 2020.
- Wooldridge, M. "An Introduction to MultiAgent Systems" (2nd ed.) — MAS design fundamentals.
- Amodei, D. et al. "Concrete Problems in AI Safety." arXiv:1606.06565.
