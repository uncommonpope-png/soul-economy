---
name: instructor
description: Agent Integration Patterns
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
| OpenAI | ✅ | Native function calling + structured outputs |
| Anthropic | ✅ | Tool use + vision |
| Google Gemini | ✅ | JSON mode, function calling |
| Azure OpenAI | ✅ | With deployment config |
| Vertex AI | ✅ | Via `instructor.vertexai` |
| Ollama | ✅ | Local models, streaming |
| Mistral | ✅ | Function calling |
| Cohere | ✅ | Tool use |
| Groq | ✅ | Fast inference |
| AWS Bedrock | ✅ | Via boto3 |

## Agent Integration Patterns

### Pattern 1: Tool Output Validation
```python
from instructor import Instructor
from pydantic import BaseModel
from typing import Literal

class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str
    relevance_score: float

class AgentResponse(BaseModel):
    answer: str
    sources: list[SearchResult]
    confidence: float

client = instructor.patch(OpenAI())

def search_and_validate(query: str) -> AgentResponse:
    # Step 1: Generate with potential tool calls
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": f"Search for: {query}"}],
        response_model=AgentResponse,
        max_retries=2,
    )
    return response
```

### Pattern 2: Retry with Correction
```python
from instructor import Instructor

client = instructor.patch(OpenAI())

class InvoiceExtract(BaseModel):
    invoice_id: str
    amount: float
    currency: str
    due_date: str
    line_items: list[dict]

# Automatic retry on validation failure — Instructor asks model to self-correct
invoice = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": invoice_text}],
    response_model=InvoiceExtract,
    max_retries=3,  # Will retry up to 3 times if validation fails
)
```

### Pattern 3: Streaming with Validation
```python
import instructor
from typing import AsyncIterator

client = instructor.patch(OpenAI(mode="stream"))

async def stream_extraction(text: str) -> AsyncIterator[UserExtract]:
    async for chunk in await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": text}],
        response_model=UserExtract,
        stream=True,
    ):
        yield chunk
```

### Pattern 4: Multimodal (Vision)
```python
import base64
from PIL import Image

class ImageDescription(BaseModel):
    scene: str
    objects_detected: list[str]
    sentiment: str
    text_in_image: str | None

def describe_image(image_path: str) -> ImageDescription:
    with open(image_path, "rb") as f:
        img_data = base64.b64encode(f.read()).decode()

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{
            "role": "user",
            "content": [{
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{img_data}"}
            }]
        }],
        response_model=ImageDescription,
    )
    return response
```

## Advanced Features

### 1. Response Metadata
```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
    response_model=UserExtract,
)

# Access raw response metadata
print(response._cursor)       # Streaming cursor position
print(response._provider)      # "openai"
print(response._raw_model)     # Raw response model
print(response._usage)         # Token usage stats
```

### 2. Context-Aware Validation
```python
class Transaction(BaseModel):
    amount: float
    category: Literal["food", "transport", "entertainment", "other"]
    merchant: str

class BudgetSummary(BaseModel):
    month: str
    transactions: list[Transaction]
    total_spent: float

    @field_validator("total_spent")
    @classmethod
    def total_matches(cls, v: float, info: ValidationInfo) -> float:
        # Cross-validate: sum of transactions must match declared total
        transactions = info.data.get("transactions", [])
        calculated = sum(t.amount for t in transactions)
        if abs(v - calculated) > 0.01:
            raise ValueError(f"Total {v} doesn't match sum {calculated}")
        return v

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": bank_statement_text}],
    response_model=BudgetSummary,
)
```

### 3. Multi-Step Extraction
```python
class Step1Output(BaseModel):
    summary: str

class Step2Output(BaseModel):
    entities: list[str]
    relationships: list[tuple[str, str]]

class FinalOutput(BaseModel):
    analysis: str
    key_findings: list[str]

# Chain multiple extraction steps
step1 = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": document}],
    response_model=Step1Output,
)
step2 = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "user", "content": document},
        {"role": "assistant", "content": step1.summary}
    ],
    response_model=Step2Output,
    validation_context={"entities": step2.entities},  # Pass context forward
)
```

### 4. Async Client
```python
import instructor
import asyncio
from openai import AsyncOpenAI

aclient = instructor.patch(AsyncOpenAI())

async def extract_concurrent(queries: list[str]) -> list[UserExtract]:
    tasks = [
        aclient.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": q}],
            response_model=UserExtract,
        )
        for q in queries
    ]
    return await asyncio.gather(*tasks)
```

## Best Practices

1. **Always use Pydantic models** — Instructor IS Pydantic. Define your schema once, get validation, serialization, and docs for free.
2. **Set `max_retries=3`** — LLM outputs fail validation more often than expected, especially with complex schemas.
3. **Use `strict: True`** on providers that support it — avoids model adding extra fields.
4. **Prefer `function_call` parameter** over raw `response_model` when you need the model to choose among multiple actions.
5. **Use `validation_context` for cross-field validation** — Instructor supports `field_validator` and `model_validator` in Pydantic models.
6. **For high-throughput**, use async client with `asyncio.gather()` for concurrent extraction.

## Skill Usage Notes

- **Best for**: Agents that need guaranteed typed outputs for tool results, document parsing, data extraction, and multi-step reasoning chains.
- **Stack position**: Output validation layer, sits above any provider API. Works with LangGraph, CrewAI, AutoGen, etc.
- **Not for**: Agents that need multi-turn conversation management (that's LangGraph/CrewAI's job).
- **Local models**: Fully supported via Ollama —Instructor + Ollama = free local structured outputs.
- **Performance**: ~10-50ms overhead vs raw API call depending on schema complexity and retry count.

## Resources
- GitHub: github.com/jxnl/instructor (9k+ stars)
- Docs: instructor.haystack.co
- Discord: 3k+ members
- PyPI: `instructor`