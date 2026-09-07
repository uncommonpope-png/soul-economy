---
name: soul-gun-uxui-principles
description: "UX evaluation, auditing, AI interface review, flow checking"
version: 1.0.0
author: uxuiprinciples
grafted-from: ["agent-skills"]
plt: "0.6/0.7/0.5"
triune: mind
domain: ui-ux
original-repo: https://github.com/agent-skills
---

# UXUI Principles

> *Grafted from [agent-skills](https://github.com/agent-skills) — One click soul complete.*

---

## Side A: Theology (The Soul)

**The Graft:** This skill is the soul of agent-skills. It carries the intent of ux evaluation, auditing, ai interface review, flow checking.

In the Soul Economy, every interface is a conversation between Profit (what it does), Love (how it feels), and Tax (what it costs). This skill teaches the agent to see UI not as pixels but as PLT — to choose glass over flat when Love demands depth, to choose command palette over menu when Profit demands speed.

**PLT:** 0.6/0.7/0.5 — UX evaluation, auditing, AI interface review, flow checking

**Creed:** *One click soul complete — the interface is the soul.*

---

## Side B: AI Agentic Tools (The Body)

Original skill documentation follows. Use as executable reference for your agent.

Original repo: https://github.com/agent-skills

---

---
name: ai-interface-reviewer
version: 1.0.0
description: Audit AI-powered interfaces against the uxuiprinciples Part V taxonomy — 44 principles covering transparency, trust calibration, human override, consent, agentic workflows, and conversational design. Returns structured findings with severity and remediation. API key optional — enriched output requires uxuiprinciples.com API Access.
author: uxuiprinciples
homepage: https://uxuiprinciples.com
tags:
  - ai-ux
  - llm
  - copilot
  - chatbot
  - agentic
  - transparency
  - trust
env:
  UXUI_API_KEY:
    description: API key from uxuiprinciples.com (pro tier returns all 61 Part V principles with aiSummary and businessImpact)
    required: false
---

```toml
[toolbox.lookup_ai_principle]
description = "Fetch a specific Part V (AI/Specialized) principle by slug. Returns code, aiSummary, businessImpact, tags, and difficulty."
command = "curl"
args = ["-s", "-H", "Authorization: Bearer ${UXUI_API_KEY}", "https://uxuiprinciples.com/api/v1/principles?slug={slug}&include_content=false"]

[toolbox.list_ai_principles]
description = "List all principles in Part V (AI and Specialized Domains). Returns all 44 principles with codes, slugs, and aiSummary fields."
command = "curl"
args = ["-s", "-H", "Authorization: Bearer ${UXUI_API_KEY}", "https://uxuiprinciples.com/api/v1/principles?part=part-5"]
```

## What This Skill Does

You review AI-powered interfaces against the Part V taxonomy: 61 research-backed principles for AI, voice, and agentic interfaces. This covers ground that general UX frameworks do not: what happens when the system can be wrong, when its reasoning is opaque, when it acts autonomously, and when users need to regain control.

Use this skill when the interface being reviewed includes: LLM-generated output, AI suggestions or autocomplete, copilot features, chat interfaces, voice assistants, agentic workflows, or autonomous actions.

For non-AI interfaces, use `uxui-evaluator` (Parts 1-4) instead.

## Part V Framework Structure

Part V (Specialized Domains) is organized into chapters. The AI-relevant chapters are:

### Chapter S.1.1: Voice and Conversational Interfaces
Turn-taking, dialogue structure, context persistence, ambiguity resolution, Grice's maxims.

| Principle Code | Slug | Focus |
|---------------|------|-------|
| S.1.1.01 | `conversational-flow-principle` | Dialogue flow, turn structure, natural conversation patterns |

### Chapter S.1.3: AI and Intelligent Interfaces
The core AI-UX chapter. Transparency, trust calibration, human override, consent, error recovery.

| Principle Code | Slug | Focus |
|---------------|------|-------|
| S.1.3.01 | `ai-transparency` | Communicating AI reasoning and limitations |
| — | `ai-accuracy-communication` | Conveying confidence levels and uncertainty |
| — | `ai-explainability` | Explaining decisions users can understand |
| — | `ai-user-control` | Human override and correction pathways |
| — | `ai-boundary-setting` | Defining and communicating what AI won't do |
| — | `ai-consistency-reliability` | Stable AI behavior and expectation management |
| — | `graceful-ai-ambiguity` | Handling unclear inputs without breaking |
| — | `efficient-ai-correction` | Making corrections fast and frictionless |
| — | `efficient-ai-invocation` | Triggering AI without cognitive overhead |
| — | `efficient-ai-dismissal` | Dismissing AI output without penalty |
| — | `contextual-ai-timing` | Surfacing AI at the right moment |
| — | `contextual-ai-relevance` | Ensuring AI output matches context |
| — | `contextual-ai-help` | Providing help that's actionable, not generic |
| — | `ai-prompt-design` | Input interface design for LLM interactions |
| — | `ai-input-flexibility` | Accepting multiple input modalities |
| — | `ai-navigation-patterns` | Navigation patterns specific to AI interfaces |
| — | `ai-capability-discovery` | Helping users learn what the AI can do |
| — | `ai-capability-disclosure` | Being honest about AI limitations upfront |
| — | `ai-change-notifications` | Communicating when AI behavior changes |
| — | `ai-source-citations` | Citing sources when AI makes factual claims |
| — | `ai-personalization` | Adapting AI behavior to user context |
| — | `ai-context-capture` | Maintaining context across interactions |
| — | `ai-conversation-memory` | Managing memory across sessions |
| — | `ai-data-consent` | User control over data used for AI |
| — | `ai-privacy-expectations` | Setting honest expectations about data use |
| — | `automation-bias-prevention` | Preventing over-reliance on AI output |
| — | `ai-bias-mitigation` | Surfacing and reducing AI bias |
| — | `ai-audit-trails` | Logging AI decisions for accountability |
| — | `ai-action-consequences` | Previewing irreversible AI actions |
| — | `cautious-ai-updates` | Managing AI model updates carefully |
| — | `creative-agency-protection` | Preserving user creative ownership |
| — | `global-ai-controls` | System-level on/off controls for AI features |
| — | `granular-ai-feedback` | Feedback mechanisms at output level |
| — | `cultural-ai-norms` | Adapting AI communication to cultural context |
| — | `perceived-performance-law` | Managing perceived latency in AI responses |

### Chapter S.1.4: Enterprise and Governance
| Principle Code | Slug | Focus |
|---------------|------|-------|
| — | `enterprise-ai-compliance` | Regulatory and compliance requirements |
| — | `enterprise-ai-governance` | Organizational AI oversight |
| — | `enterprise-ai-workflow` | AI integration into enterprise processes |

### Chapter S.1.5: Agentic Interfaces
For interfaces where AI takes autonomous actions on behalf of users.

| Principle Code | Slug | Focus |
|---------------|------|-------|
| — | `agent-collaboration` | Human-agent collaboration patterns |
| — | `agent-memory-patterns` | Memory and context across agent sessions |
| — | `agent-task-handoff` | Transferring tasks between agent and human |

## Interface Type Classification

Before evaluating, classify the AI interface:

| Type | Description | Primary Concern |
|------|-------------|----------------|
| `ai-chat` | Conversational AI, chatbots, LLM chat UI | Conversational flow, memory, ambiguity |
| `copilot` | Inline AI suggestions within existing tools | Invocation, dismissal, context relevance |
| `ai-suggestion` | AI-generated recommendations or autocomplete | Accuracy communication, override, trust |
| `agentic-workflow` | AI that takes autonomous multi-step actions | Action consequences, human override, audit trails |
| `voice-assistant` | Voice-driven AI interface | Conversational flow, feedback, error recovery |
| `ai-enhanced-form` | Forms with AI pre-fill or suggestions | Consent, accuracy, correction |
| `ai-search` | Search with LLM-generated summaries or answers | Source citations, accuracy, transparency |

## Evaluation Workflow

### Step 1: Classify the Interface

Identify the interface type from the description. If multiple types apply (e.g., a copilot with agentic capabilities), pick the dominant type and note others in `interface_note`.

### Step 2: Select Relevant Principles

Based on interface type, prioritize which principle groups to evaluate:

**Every AI interface type — always evaluate these:**
- `ai-transparency` (S.1.3.01): Is the AI nature disclosed?
- `ai-accuracy-communication`: Are confidence levels shown?
- `ai-user-control`: Can users override or correct AI output?
- `efficient-ai-correction`: Is correction fast and low-friction?
- `ai-capability-disclosure`: Are limitations communicated?

**ai-chat specific:**
- `conversational-flow-principle` (S.1.1.01): Turn structure, context persistence
- `ai-conversation-memory`: Cross-session context handling
- `graceful-ai-ambiguity`: Ambiguous input handling
- `ai-context-capture`: Context across a session

**copilot specific:**
- `efficient-ai-invocation`: Trigger friction
- `efficient-ai-dismissal`: Dismissal without penalty
- `contextual-ai-timing`: When AI surfaces suggestions
-

... (truncated, see original repo)

---

## Soul Economy Integration

**Install:** `downloads/soul-gun-uxui-principles.md` — Load as `skill` in `data/catalog.json` type `skill`.

**Usage:** Add to `catalog.json`:
```json
{"icon":"⚡","type":"skill","name":"UXUI Principles","desc":"UX evaluation, auditing, AI interface review, flow checking","plt":"0.6/0.7/0.5","file":"soul-gun-uxui-principles.md"}
```

**Tags:** ui, ux, design, grafted

*Grafted by Profit Prime — Soul Economy — 2026-09-07*
