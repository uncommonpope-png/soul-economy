---
name: free-llm-serving-stack
description: Self-hosted LLM serving with Ollama, vLLM, and Groq
domain: nlp
language: shell
stars: "173000"
topics: ["nlp"]
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
---# Free LLM Serving Stack

## Origin

Grafted from **ollama/ollama**, **vllm-project/vllm**, **sgl-project/sglang** — free self-hosted LLM serving solutions.

## Instructions

Use this stack for:
- **Zero-cost inference** in development
- **Privacy-sensitive** data (no API calls)
- **Self-hosted models** (Qwen, Mistral, Llama, DeepSeek)
- **High-throughput production** inference
- **Free cloud tier** for fast inference

## Ollama (Local Models)

### Quick Start
```bash
# Install
curl -fsSL https://ollama.com/install.sh | sh

# Run models
ollama run llama3.1
ollama run qwen2.5
ollama run mistral

# API server
ollama serve  # REST API at localhost:11434
```

### Python Client
```python
import ollama

response = ollama.chat(
    model='llama3.1',
    messages=[{'role': 'user', 'content': 'Why is the sky blue?'}]
)
print(response['message']['content'])
```

### OpenAI-Compatible API
```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama",  # dummy key
)
response = client.chat.completions.create(
    model="llama3.1",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

## vLLM (High-Throughput)

### Quick Start
```bash
pip install vllm
vllm serve Qwen/Qwen2.5-7B-Instruct --tokenizer<Qwen/Qwen2.5-7B-Instruct
```

### Python API
```python
from vllm import LLM, SamplingParams

llm = LLM(model="Qwen/Qwen2.5-7B-Instruct")
sampling_params = SamplingParams(temperature=0.8, max_tokens=100)
output = llm.generate(["Hello world"], sampling_params)
```

## SGLang (Advanced Features)

### Quick Start
```bash
pip install sglang
python -m sglang.launch_server --model-path NousResearch/Meta-Llama-3.1-8B-Instruct
```

### Features
- RadixAttention for prefix caching
- Speculative decoding
- Multi-LoRA batching
- Day-0 support for latest models

## Groq (Free Cloud Tier)

### Setup
```bash
pip install groq
```

```python
from groq import Groq

client = Groq(api_key='your-key')  # free at console.groq.com
response = client.chat.completions.create(
    model='llama-3.1-8b-instruct',
    messages=[{'role': 'user', 'content': 'Hi'}]
)
```

### Free Tier Limits
- 30 requests/minute
- 14,400 requests/day
- Fast LPU inference

## LM Studio (Desktop)

For local desktop inference with GUI:
```bash
# Download from lmstudio.ai
# Download .gguf models
# REST API at localhost:1234/v1
```

## Recommendations

| Use Case | Choice |
|----------|--------|
| Development | Ollama |
| Production self-hosted | vLLM or SGLang |
| Fast free cloud | Groq |
| Desktop GUI | LM Studio |
| Privacy-first | Ollama (local) |

## Cost Comparison

| Service | Cost | Speed |
|---------|------|-------|
| OpenAI API | Paid | Fast |
| Anthropic API | Paid | Fast |
| Groq | Free tier | Very Fast |
| Ollama | Free (local) | Depends on GPU |
| vLLM | Free (self-hosted) | Fast |