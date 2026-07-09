---
name: agent-swarms
description: Trust & Security in Swarms
domain: computer-science
language: python
stars: "0"
topics: ["computer-science"]
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
-----|---|
| Sequential | One-to-one chain | Linear pipelines, ordered steps |
| Concurrent | One-to-many broadcast | Parallel experts, batch processing |
| Hierarchical | Director-to-workers | Complex projects, task decomposition |
| Mesh | Many-to-many | Collaborative problem-solving |
| Gossip | Probabilistic broadcast | Large-scale swarms, eventual consistency |
| DAG | Node-to-node (dependency) | Complex dependencies, fan-out/fan-in |
| Adaptive | Dynamic routing | Task-specific optimal path selection |

## Trust & Security in Swarms

```python
# Behavioral trust scoring (ruflo-style)
trust_score = (
    0.4 * success_rate +
    0.2 * uptime +
    0.2 * threat_score +      # No prompt injection, no data exfil
    0.2 * integrity_score     # Honest output, no hallucination
)

# PII gating — 14-type detection
# BLOCK: sensitive data, financial records
# REDACT: names, addresses (keep structure)
# HASH: stable identifiers
# PASS: non-sensitive data

# Circuit breaker: if trust_score < 0.3 → isolate agent
```

## Skill Usage Notes

- **Best for**: Complex projects needing multiple specialized roles, research synthesis, multi-step software development, parallel data processing, enterprise automation pipelines.
- **Stack position**: Top-level orchestration. Swarms orchestrate individual agents (which may use LangGraph, AutoGen, CrewAI, etc. internally).
- **Not for**: Simple single-step tasks — the overhead isn't worth it. Use a single agent for queries, retrievals, or simple transformations.
- **Cost**: Significantly higher than single-agent due to multiple LLM calls. Use caching, memory, and set budgets.
- **Reliability**: Build retry logic, circuit breakers, and fallback agents. Swarms fail in interesting ways — plan for partial failures.

## Resources
- ruflo: github.com/ruvnet/ruflo (58k stars) — Claude swarm harness
- CAMEL: github.com/camel-ai/camel (17.1k stars) — First multi-agent framework
- Swarms: github.com/kyegomez/swarms (6.8k stars) — Enterprise orchestration
- MetaGPT: github.com/geekan/MetaGPT (68.6k stars) — SOP software company
- Google ADK: github.com/google/adk-python (20k stars) — Enterprise agent dev kit
- PraisonAI: github.com/MervinPraison/PraisonAI (8.1k stars) — 5-line deploy
- OWL: github.com/camel-ai/owl (19.8k stars) — Workforce optimization
- oh-my-claudecode: github.com/Yeachan-Heo/oh-my-claudecode (35.8k stars) — Teams-first Claude Code orchestration