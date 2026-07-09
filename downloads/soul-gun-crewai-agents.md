---
name: crewai-agents
description: Use when building role-based multi-agent crews
domain: agent-framework
language: python
stars: "52800"
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
---# CrewAI Agents

## Origin

Grafted from **[crewAIInc/crewAI](https://github.com/crewAIInc/crewAI)** — role-based multi-agent framework. 100k+ certified developers.

## Instructions

Use CrewAI when building:
- **Collaborative AI agents** with defined roles
- **Rapid prototyping** of multi-agent systems
- **Sequential or hierarchical** task workflows
- **Agent delegation** (agents can delegate to others)
- **Integration with LangChain** tools

## Key Patterns

### Agent Creation (Role-Based)
```python
from crewai import Agent
from langchain_openai import ChatOpenAI

researcher = Agent(
    role="Senior Data Researcher",
    goal="Uncover cutting-edge developments in {topic}",
    backstory="You're a seasoned researcher with 10 years of experience.",
    allow_delegation=False,
    verbose=True,
    llm=ChatOpenAI(model_name="gpt-4"),
)
```

### Tools
```python
from crewai_tools import SerperDevTool, BrowserTools

researcher = Agent(
    role="Researcher",
    tools=[SerperDevTool(), BrowserTools.scrape_and_summarize_website],
)
```

### Crew Orchestration
```python
from crewai import Crew, Agent, Task, Process

crew = Crew(
    agents=[researcher, reporting_analyst],
    tasks=[research_task, reporting_task],
    process=Process.sequential,  # or Process.hierarchical
    verbose=True,
)
result = crew.kickoff(inputs={'topic': 'AI Agents'})
```

### Flow (Event-Driven)
```python
from crewai.flow import Flow, Router, listen, start

class MyFlow(Flow):
    @start()
    def generate_topic(self):
        return {"topic": "AI Agents"}

    @listen(generate_topic)
    def research(self, state):
        # Run research crew
        return crew.kickoff(inputs=state)

    @router(research)
    def route_quality(self, state):
        if state['quality_score'] > 8:
            return "publish"
        return "revise"
```

## When to Use

| Use Case | Choice |
|----------|--------|
| Rapid prototyping | CrewAI (primary) |
| Role-based agents | CrewAI |
| Sequential tasks | CrewAI |
| Complex durable agents | LangGraph |
| Production with guardrails | OpenAI Agents SDK |

## Key Features

- **Independent of LangChain** — built from scratch
- **Flows** — event-driven production workflows
- **Crews** — collaborative autonomous agents
- **DeepLearning.ai courses** available
- **YAML config** for agents/tasks

## Resources

- Docs: https://docs.crewai.com/
- GitHub: https://github.com/crewAIInc/crewAI