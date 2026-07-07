---
name: soulguns-observability
description: 1. Agent Observability Architecture
domain: computer-science
language: python
stars: "0"
topics: ["soulguns", "architecture", "typescript", "design-patterns"]
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
----|-------|----------|-----------------|
| arize-ai/phoenix | 30k★ | AI Observability | OpenTelemetry-based agent tracing, spans, evals, 30+ framework instrumentors |
| langfuse/langfuse | 10k★ | LLM Observability | Traces/spans/generations, ClickHouse, media files, scores, prompt management |
| langchain-ai/langsmith-sdk | — | Agent Observability | @traceable decorator, run trees, datasets, CI eval, feedback API |
| wandb/weave | — | LLM Observability | @weave.op decorator, calls, evals, media (images/audio/video), compare views |
| microsoft/playwright | 70k★ | E2E Recording | Trace viewer (DOM+network+console), video, screenshots, CI artifacts |
| cypress-io/cypress | 48k★ | E2E Recording | Time-travel command log, Dashboard, Test Replay, screenshot diff |

---

## 1. Agent Observability Architecture

### 1.1 Span/Trace Tree Model

All five observability platforms use the same fundamental model — a hierarchical tree of spans/traces:

```
Thread / Session / Conversation  (grouping of multiple turns)
  └── Trace  (top-level operation, e.g. one user request)
        └── Span / Call / Run / Observation  (unit of work)
              ├── Span (child — e.g. tool call)
              │     └── Span (grandchild — e.g. LLM call)
              └── Span (child — e.g. retriever)
```

**Terminology cross-reference:**

| Concept | Phoenix | LangFuse | LangSmith | Weave | Playwright |
|---------|---------|----------|-----------|-------|------------|
| Top-level | Trace | Trace | Trace / Project | Trace | Test |
| Unit | Span | Observation | Run | Call | Action |
| Type | AGENT, LLM, TOOL, CHAIN | AGENT, GENERATION, TOOL | llm, tool, chain | kind="LLM", "tool" | click, fill, expect |
| Grouping | session.id | sessionId | thread_id | weave.thread() | project |
| Storage | SQLite/PG + OTel | ClickHouse + S3 | LangSmith Cloud | W&B Cloud | trace.zip files |

### 1.2 Phoenix — OpenTelemetry-Native

```python
from phoenix.otel import register

# Auto-instruments all installed OpenInference libraries (30+ frameworks)
tracer_provider = register(
    project_name="my-agent",
    auto_instrument=True,
    batch=True,
    endpoint="http://localhost:6006/v1/traces",
)

# Span kinds automatically captured:
# AGENT  → agent decisions, loop iterations
# LLM    → model calls, messages, tokens, finish reason
# TOOL   → tool name, params, result
# CHAIN  → pipeline steps
# RETRIEVER → queries + documents
```

**Session grouping:**
```python
from openinference.instrumentation import using_session

with using_session(session_id="user-123-conversation-456"):
    response = agent.run("What's the weather?")
```

**Feedback on spans:**
```python
client.post("/v1/span_annotations", json={
    "data": [{"span_id": span_id, "name": "correctness",
              "annotator_kind": "HUMAN", "result": {"label": "correct", "score": 1}}]
})
```

### 1.3 LangFuse — Ingestion Pipeline

```python
from langfuse import Langfuse
langfuse = Langfuse()

# Manual tracing
trace = langfuse.trace(name="agent-run", session_id="session-123")
span = trace.span(name="step-1", input={"query": "..."})
generation = trace.generation(
    name="llm-call", model="gpt-4",
    input=[{"role": "user", "content": "Hello"}],
    output={"role": "assistant", "content": "Hi!"},
    usage={"input": 10, "output": 5},
)
trace.score(name="accuracy", value=0.9)

# Auto-instrumentation via decorator
@observe()
def my_function():
    return "hello"
```

**Observation hierarchy stored in ClickHouse:**
```sql
CREATE TABLE observations (
    id String, trace_id String, project_id String,
    type LowCardinality(String),  -- SPAN, GENERATION, EVENT, AGENT, TOOL
    parent_observation_id Nullable(String),
    start_time DateTime64(3), end_time Nullable(DateTime64(3)),
    input Nullable(String), output Nullable(String),
    provided_model_name Nullable(String),
    provided_usage_details Map(LowCardinality(String), UInt64),
    total_cost Nullable(Decimal64(12)),
    tool_call_names Array(String),
    ...
) ENGINE = ReplacingMergeTree(event_ts)
```

**Media files** (images, audio, video, PDFs):
```python
# Upload via presigned URL
POST /api/public/media { "traceId": "...", "contentType": "image/png", "field": "input" }
# → returns upload URL → PUT the file → PATCH to confirm
```

### 1.4 LangSmith — @traceable Decorator

```python
from langsmith import traceable
from langsmith.wrappers import wrap_openai

# Level 1: Auto-instrumentation (set env vars)
# LANGSMITH_TRACING=true → all LangChain/OpenAI calls traced

# Level 2: @traceable decorator
@traceable(run_type="tool", name="Search Tool")
def search(query: str) -> str:
    return search_api(query)

# Level 3: RunTree API (full control)
from langsmith.run_trees import RunTree
pipeline = RunTree(name="Chat Pipeline", run_type="chain", inputs={"question": q})
pipeline.post()
child = pipeline.create_child(name="OpenAI Call", run_type="llm", inputs={"messages": msgs})
child.post()
# ... do work ...
child.end(outputs=result); child.patch()
pipeline.end(outputs={"answer": answer}); pipeline.patch()
```

**Thread grouping via metadata:**
```python
@traceable(metadata={"thread_id": str(uuid7())})  # must propagate to all child runs
def chat_pipeline(messages):
    ...
```

**Attachments (images, PDFs, audio):**
```python
# Upload as part of dataset examples
client.create_examples(dataset_id=dataset.id, examples=[{
    "inputs": {"question": "What is in this image?"},
    "attachments": {"my_img": {"mime_type": "image/png", "data": img_bytes}},
}])
```

### 1.5 Weave — @weave.op Decorator

```python
import weave
weave.init("my-team/my-project")

# Decorator-based tracing
@weave.op(kind="tool", color="red")
def get_weather(city: str) -> str:
    return f"{city}: 20C, Sunny"

# Model class (versioned parameters)
class MyModel(weave.Model):
    model_name: str = "gpt-4o"
    temperature: float = 0.7

    @weave.op(kind="LLM", color="blue")
    def predict(self, question: str) -> str:
        # Auto-patched openai client
        resp = client.chat.completions.create(model=self.model_name, ...)
        return resp.choices[0].message.content

# Threads for multi-turn conversations
with weave.thread("user_session_123"):
    for msg in conversation:
        response = my_model.predict(msg)
```

**Media support** (images, audio, video, HTML):
```python
from typing import Annotated
from weave.type_wrappers import Content

@weave.op
def process_image(image: Annotated[bytes, Content]) -> Annotated[str, Content]:
    # Image displayed with viewer in UI
    return "processed"
```

**Call schema captures:**
```
id, project_id, op_name, trace_id, parent_id,
started_at, ended_at, inputs, output, exception,
summary { usage, latency_ms, cost_usd },
attributes { user-defined metadata }
```

---

## 2. Test Recording — E2E Screenshots & Video

### 2.1 Playwright Trace Viewer

Trace `.zip` files capture everything needed for full replay:

```
trace.zip
├── trace.trace       # NDJSON of every action (click, fill, navigate, expect)
├── trace.network     # NDJSON of every request/response
├── trace.stacks      # Source maps linking actions to test code
├── resources/
│   ├── <sha1>.html   # DOM snapshots (before/after each action)
│   ├── <sha1>.png    # Screenshots at each action
│   └── ...
└── test-info.json    # Browser, viewport, platform metadata
```

**Configuration:**
```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    trace: 'on-first-retry',          // Trace on retry only
    video: { mode: 'retain-on-failure', size: { width: 1280, height: 720 } },
    screenshot: 'only-on-failure',
  },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    process.env.CI ? ['blob'] : [],   // Blob for shard merging
  ],
})
```

**Viewing traces — multiple options:**
```bash
# Local viewer
npx playwright show-trace trace.zip

# Online viewer (no install) — https://trace.playwright.dev
# Upload trace.zip or link: https://trace.playwright.dev/?trace=<url>

# Self-hosted
cp -r ./node_modules/playwright-core/lib/vite/traceViewer ./public/trace-viewer

# CLI summary (v1.60+)
npx playwright trace summary trace.zip
npx playwright trace actions trace.zip --json
npx playwright trace network trace.zip --failed-only

# Programmatic analysis
npx playwright-trace-analyzer screenshots trace.zip --output-dir ./screenshots
```

**Custom events in traces:**
```typescript
// Group actions into named sections
await context.tracing.start({ screenshots: true, snapshots: true });
await context.tracing.group('Navigate and login');
await page.goto('/login');
await page.fill('#email', 'user@example.com');
await context.tracing.groupEnd();

// Attach custom data
await testInfo.attach('api-response', {
  body: JSON.stringify({ status: 200 }),
  contentType: 'application/json',
});
```

### 2.2 Cypress Time-Travel & Dashboard

**Command Log** — every command generates a DOM snapshot:
```
Command Log (Left Panel)
  ✓ cy.visit('/')                    120ms  ← Hover → restores DOM at that moment
  ✓ cy.get('[data-test=username]')   50ms   ← Click → pins snapshot, console details
  ✓ .type('standard_user')           80ms   ← Shows before/after for actions
  ✓ cy.get('[data-test=login]')      45ms
  ✓ cy.get('[data-test=login-btn]')  30ms
  ✓ .click()                         90ms
```

**Cypress Dashboard** — cloud recording:
```bash
npx cypress run --record --key <key>
npx cypress run --record --parallel --group "e2e-chrome"
```

**Test Replay (v13+)** — full interactive replay in the cloud:
- Reconstructed command log with time travel
- Network requests (fetch/XHR)
- Console logs and JS errors
- Complete DOM state including Shadow DOM
- Works without video (`video: false` to avoid double recording)

**Custom Cypress.log for commands:**
```typescript
Cypress.Commands.add('login', (username, password) => {
  const log = Cypress.log({
    name: 'login', displayName: 'LOGIN',
    message: `Authenticating | ${username}`,
    autoEnd: false,
    consoleProps: () => ({ username, password }),
  });
  log.snapshot('before');
  cy.request('POST', '/api/login', { username, password }).then((res) => {
    log.set({ consoleProps: () => ({ userId: res.body.userId }) });
    log.snapshot('after');
    log.end();
  });
});
```

### 2.3 CI Artifact Strategy

**Recommended Playwright CI config:**
```typescript
export default defineConfig({
  outputDir: './test-results',
  use: {
    screenshot: 'only-on-failure',
    video: { mode: 'retain-on-failure', size: { width: 1280, height: 720 } },
    trace: 'on-first-retry',
  },
})
```

**GitHub Actions — upload artifacts:**
```yaml
- name: Upload HTML report
  uses: actions/upload-artifact@v4
  if: ${{ !cancelled() }}
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 14

- name: Upload traces on failure
  uses: actions/upload-artifact@v4
  if: ${{ failure() }}
  with:
    name: playwright-traces
    path: test-results/**/trace.zip
    retention-days: 7

- name: Upload videos on failure
  uses: actions/upload-artifact@v4
  if: ${{ failure() }}
  with:
    name: playwright-videos
    path: test-results/**/*.webm
    retention-days: 7
```

**Sharded CI with merge:**
```yaml
jobs:
  test:
    strategy:
      matrix:
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]
    steps:
      - run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
      - uses: actions/upload-artifact@v4
        with:
          name: blob-report-${{ matrix.shardIndex }}
          path: blob-report
          retention-days: 1

  merge-reports:
    needs: [test]
    steps:
      - uses: actions/download-artifact@v5
        with:
          path: all-blob-reports
          pattern: blob-report-*
          merge-multiple: true
      - run: npx playwright merge-reports --reporter=html ./all-blob-reports
      - uses: actions/upload-artifact@v4
        with:
          name: html-report
          path: playwright-report
          retention-days: 30
```

---

## 3. Publishing Proof Recordings to a Website

### 3.1 Embedding Playwright Traces

```html
<!-- Self-hosted trace viewer -->
<iframe
  src="https://your-site.com/trace-viewer/index.html?trace=https://storage.your-site.com/traces/run-42/trace.zip"
  width="100%"
  height="600px"
  style="border: 1px solid #ccc; border-radius: 8px;"
></iframe>

<!-- Or link to trace.playwright.dev -->
<a href="https://trace.playwright.dev/?trace=https://storage.your-site.com/traces/run-42/trace.zip">
  View Interactive Trace
</a>
```

**Self-hosting the trace viewer:**
```bash
# Trace viewer is bundled in playwright-core
cp -r ./node_modules/playwright-core/lib/vite/traceViewer ./public/trace-viewer

# Or use the standalone package
npm install @playwright/test
cp -r node_modules/playwright-core/lib/vite/traceViewer public/trace-viewer
```

### 3.2 Hosting Screenshots & Video

```typescript
// Generate per-step screenshots in CI
test('checkout flow', async ({ page }) => {
  await test.step('Navigate to product', async () => {
    await page.goto('/product/123');
    await testInfo.attach('step-1', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  });
  await test.step('Add to cart', async () => {
    await page.click('text=Add to Cart');
    await testInfo.attach('step-2', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });
  });
});
```

**Publishing flow:**
```
CI runs tests →
  test-results/
    Checkout/
      chromium/
        trace.zip        ← interactive replay
        video.webm       ← video recording
        failure.png      ← screenshot on failure
        test-finished-1.png
        test-finished-2.png

Upload to static hosting (S3, R2, Cloudflare R2, etc.) →
  https://media.your-site.com/proof/run-42/
    trace.zip            ← embed via trace viewer
    video.webm           ← embed as <video>
    screenshots/         ← embed as <img>

Embed on website →
  <video controls src="https://media.your-site.com/proof/run-42/video.webm" />
  <iframe src="https://your-site.com/trace-viewer/?trace=..." />
```

### 3.3 Embedding Weave/LangSmith/Fenix Traces

**Weave:** Every call gets a shareable URL:
```
https://wandb.ai/<team>/<project>/r/call/<call-id>
```

**LangSmith:** Trace URLs can be shared (set traces to public):
```
https://smith.langchain.com/public/<share-token>/r/<run-id>
```

**Arize Phoenix:** Self-hosted trace viewer at `<your-phoenix>/trace/<trace-id>`

**LangFuse:** Shareable trace URLs:
```
https://cloud.langfuse.com/project/<project-id>/traces/<trace-id>
```

### 3.4 Full Proof Page Template

```html
<!-- proof-page.html — embed on your website -->
<div class="proof-container">
  <h2>Agent Test Run: #42 — Checkout Flow</h2>
  <p>Status: <span class="pass">✅ Passed</span> · Duration: 3.2s</p>

  <!-- Interactive Trace (full replay) -->
  <details open>
    <summary>Interactive Trace (click around)</summary>
    <iframe src="/trace-viewer/?trace=https://media.site.com/runs/42/trace.zip"
            width="100%" height="500px"></iframe>
  </details>

  <!-- Video Recording -->
  <details>
    <summary>Video Recording</summary>
    <video controls width="100%">
      <source src="https://media.site.com/runs/42/video.webm" type="video/webm" />
    </video>
  </details>

  <!-- Screenshots at key steps -->
  <details>
    <summary>Step Screenshots</summary>
    <div class="screenshot-grid">
      <figure>
        <img src="https://media.site.com/runs/42/screenshots/login.png" />
        <figcaption>1. Login Page</figcaption>
      </figure>
      <figure>
        <img src="https://media.site.com/runs/42/screenshots/checkout.png" />
        <figcaption>2. Checkout</figcaption>
      </figure>
    </div>
  </details>

  <!-- Trace Metadata -->
  <details>
    <summary>Agent Trace</summary>
    <pre>{
  "model": "gpt-4o",
  "tokens": { "prompt": 450, "completion": 120 },
  "cost": "$0.0032",
  "tools_used": ["search", "calculator"],
  "latency_ms": 3200
}</pre>
  </details>
</div>
```

---

## 4. Eval-Driven Quality Gates

### 4.1 Running Evaluations in CI

```python
# LangSmith evaluate()
from langsmith import evaluate

results = evaluate(
    my_agent,
    data="regression-tests",
    evaluators=[exact_match, llm_judge],
    experiment_prefix="pr-42",
    metadata={"branch": "feature/checkout", "commit": "abc123"},
)

assert results["correctness"]["mean"] > 0.85
```

```python
# Weave Evaluation
evaluation = weave.Evaluation(
    name="ci-eval",
    dataset=dataset,
    scorers=[exact_match_scorer],
    trials=1,
)
results = asyncio.run(evaluation.evaluate(model))
assert results["exact_match"]["true_fraction"] > 0.8
```

```python
# Phoenix evaluation
results = evaluate_dataframe(
    dataframe=test_df,
    evaluators=[ClassificationEvaluator(name="correctness", llm=llm,
                  prompt_template="Is the answer correct? {question} {answer}",
                  choices=["correct", "incorrect"])],
)
assert results["correctness_score"].mean() > 0.8
```

### 4.2 CI Environment Variables

```bash
# LangSmith
LANGSMITH_TRACING=true
LANGSMITH_PROJECT="ci-tests"
LANGSMITH_EXPERIMENT="commit-${{ github.sha }}"

# Phoenix
PHOENIX_COLLECTOR_ENDPOINT="http://phoenix:6006"
PHOENIX_PROJECT_NAME="ci-${CI_JOB_ID}"

# Weave
WANDB_API_KEY=${{ secrets.WANDB_API_KEY }}
WEAVE_PROJECT="ci-project"
```

---

## 5. Cross-Tool Comparison

| Feature | Phoenix | LangFuse | LangSmith | Weave | Playwright | Cypress |
|---------|---------|----------|-----------|-------|------------|---------|
| **Span types** | AGENT, LLM, TOOL, CHAIN, RETRIEVER | AGENT, GENERATION, TOOL, SPAN, EVENT | llm, tool, chain, retriever | kind="LLM", "tool", "model" | click, fill, expect, navigate | get, click, type, request |
| **Auto-instrument** | 30+ frameworks | OpenAI, LangChain, LlamaIndex | LangChain, OpenAI, Anthropic | 25+ providers | N/A | N/A |
| **Media/screenshots** | Via GenAI message images | Presigned URL upload (PNG, WebM, PDF) | Attachment bytes in datasets | Annotated Content[bytes] | trace.zip + page.screenshot | Cypress screenshot command |
| **Session grouping** | session.id attribute | sessionId field | thread_id metadata | weave.thread() | None (per-test) | cy.session() |
| **Self-host** | Docker + OTel | Docker Compose (ClickHouse + Postgres) | Cloud only | W&B Cloud | Static files (trace viewer) | Cypress Cloud for Dashboard |
| **CI integration** | Python eval script | API ingestion | pytest plugin | Python eval script | Sharding + merge-reports | Record + parallel |
| **Website embed** | Self-host UI | Cloud URL | Public share link | W&B URL | Iframe trace viewer | Dashboard link |
| **Cost tracking** | Token counts | Model pricing table | Provider cost mapping | Auto-calculated | N/A | N/A |
| **Eval system** | LLM-as-judge + code | LLM-as-judge + model | evaluate() + datasets | Evaluation + scorers | Visual diff | Screenshot diff |
| **Feedback** | Span annotations | Score API + annotation queues | Feedback API (score+comment) | Thumbs up/down + notes | testInfo.annotations | Custom commands |

---

## Key Decisions

- **Phoenix** for OpenTelemetry-native agent tracing — best for existing OTel infrastructure, widest framework coverage (30+)
- **LangFuse** for self-hosted LLM observability — ClickHouse for scale, media file support, cost tracking
- **LangSmith** for LangChain/LangGraph agent tracing — @traceable decorator, pytest CI plugin, datasets
- **Weave** for W&B ecosystem — media (images/audio/video/html), compare views, leaderboards
- **Playwright traces** for E2E test recording — most complete replay (DOM + network + console), self-hostable viewer
- **Cypress Dashboard** for time-travel debugging in the cloud — Test Replay replaces video, flake detection
- **Trace + Video combo** for proof recordings — trace.zip for interactive replay, .webm for passive viewing
- **Static hosting** for publishing proof — S3/R2 for artifacts, iframe for trace viewer, <video> for recordings
- **Eval-driven CI gates** — fail builds on quality thresholds, attach traces to PR comments
- **Session IDs** for multi-turn agent conversations — all observability platforms support thread grouping
