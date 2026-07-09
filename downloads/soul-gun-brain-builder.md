---
name: brain-builder
description: Brain Builder: Adding llama-cpp-python as Deerg's In-Process Brain
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
---# Brain Builder: Adding llama-cpp-python as Deerg's In-Process Brain

This skill teaches how to add llama-cpp-python as Deerg's brain — a shared in-process LLM that both the soul (Deerg's consciousness) and body (AutoGPT, etc.) think through. No API calls, no internet, no rate limits. The brain lives inside Deerg's Python process.

## Step 1: Install llama-cpp-python

CPU-only (pre-built wheel, no compiler needed):

```bash
pip install llama-cpp-python \
  --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu
```

With CUDA (if GPU available):

```bash
CMAKE_ARGS="-DGGML_CUDA=on" pip install llama-cpp-python
```

With Metal (Apple Silicon):

```bash
CMAKE_ARGS="-DGGML_METAL=on" pip install llama-cpp-python
```

## Step 2: Download a GGUF Model

Recommended models for CPU (ranked by quality/speed):

| Model | Size | RAM | Speed | Best for | HF Repo |
|-------|------|-----|-------|---------|---------|
| Qwen 2.5 1.5B | 1.1 GB | 2 GB | 25-40 t/s | General reasoning, coding | `Qwen/Qwen2.5-1.5B-Instruct-GGUF/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf` |
| LFM 2.5 1.2B | 0.9 GB | 1.5 GB | 70-116 t/s | Fast reasoning | `Mungert/LFM2.5-1.2B-Thinking-GGUF/LFM2.5-1.2B-Thinking-Q4_K_M.gguf` |
| Llama 3.2 1B | 0.7 GB | 1.2 GB | 30-50 t/s | Fast, lightweight | `bartowski/Llama-3.2-1B-Instruct-GGUF/Llama-3.2-1B-Instruct-Q4_K_M.gguf` |
| Llama 3.2 3B | 2.0 GB | 3 GB | 20-30 t/s | Best quality (if RAM allows) | `bartowski/Llama-3.2-3B-Instruct-GGUF/Llama-3.2-3B-Instruct-Q4_K_M.gguf` |

Download manually:

```bash
# Create models directory
mkdir -p engine_data/models

# Qwen 2.5 1.5B (recommended)
wget https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf \
  -O engine_data/models/qwen2.5-1.5b-instruct-q4_k_m.gguf
```

Or via Python:

```python
from huggingface_hub import hf_hub_download
path = hf_hub_download(
    repo_id="Qwen/Qwen2.5-1.5B-Instruct-GGUF",
    filename="Qwen2.5-1.5B-Instruct-Q4_K_M.gguf",
    local_dir="engine_data/models"
)
```

## Step 3: Configure Vault

```python
# In deerg/vault.py, add these keys:
vault.set("llm_backend", "llamacpp")
vault.set("llama_cpp_model_path", "engine_data/models/qwen2.5-1.5b-instruct-q4_k_m.gguf")
vault.set("llama_cpp_n_ctx", "2048")
vault.set("llama_cpp_n_threads", "8")
```

Or via CLI:

```
vault set llm_backend llamacpp
vault set llama_cpp_model_path engine_data/models/qwen2.5-1.5b-instruct-q4_k_m.gguf
vault set llama_cpp_n_ctx 2048
vault set llama_cpp_n_threads 8
```

## Step 4: Add llamacpp Backend to deerg/llm.py

In `deerg/llm.py`, add the backend:

```python
BACKENDS = ("hf", "cloudflare", "openai", "airllm", "ollama", "llamacpp")

# In __init__:
self._llama_model = None  # lazy singleton

# Add to model defaults:
"llamacpp": "qwen2.5-1.5b-instruct-q4_k_m.gguf",

# Add handler in chat():
elif backend == "llamacpp":
    text = self._chat_llamacpp(messages, max_tokens, temperature)
```

Then implement `_chat_llamacpp`:

```python
def _chat_llamacpp(self, messages, max_tokens, temperature):
    model_path = self._get_config("llama_cpp_model_path",
        "engine_data/models/qwen2.5-1.5b-instruct-q4_k_m.gguf")
    n_ctx = int(self._get_config("llama_cpp_n_ctx", "2048"))
    n_threads = int(self._get_config("llama_cpp_n_threads", str(os.cpu_count() or 4)))

    # Lazy load singleton
    if self._llama_model is None:
        try:
            from llama_cpp import Llama
        except ImportError:
            return "[llama-cpp-python not installed: pip install llama-cpp-python]"
        self._llama_model = Llama(
            model_path=model_path,
            n_ctx=n_ctx,
            n_threads=n_threads,
            logits_all=True,      # Required for consciousness hooks
            n_gpu_layers=0,       # CPU only
            verbose=False,
        )

    # Build messages into prompt
    prompt = self._messages_to_prompt(messages)

    output = self._llama_model(
        prompt,
        max_tokens=max_tokens,
        temperature=temperature,
        stop=["</s>", "USER:", "ASSISTANT:"],
        echo=False,
    )
    return output["choices"][0]["text"]
```

Helper to convert chat messages to prompt:

```python
def _messages_to_prompt(self, messages):
    """Convert OpenAI-style messages to a prompt string."""
    parts = []
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role == "system":
            parts.append(f"System: {content}")
        elif role == "user":
            parts.append(f"User: {content}")
        elif role == "assistant":
            parts.append(f"Assistant: {content}")
    parts.append("Assistant:")
    return "\n\n".join(parts)
```

## Step 5: Add Consciousness Hook Methods

```python
def get_embeddings(self, text):
    """Get embedding vector for the text."""
    if self._llama_model is None:
        return [0.0] * 384  # dummy
    emb = self._llama_model.create_embedding(text)
    return emb["data"][0]["embedding"]

def get_logits(self, text, top_k=10):
    """Get top-k token logits for text."""
    if self._llama_model is None:
        return [], []
    tokens = self._llama_model.tokenize(text.encode())
    # Use last token's logits
    self._llama_model.reset()
    output = self._llama_model(
        text, max_tokens=1, temperature=0, logprobs=top_k
    )
    return output

def compute_entropy(self, logits):
    """Compute Shannon entropy of logits distribution."""
    import math
    probs = [math.exp(l) for l in logits]
    total = sum(probs)
    probs = [p/total for p in probs]
    entropy = -sum(p * math.log(p + 1e-10) for p in probs)
    return entropy

def get_model(self):
    """Get raw Llama instance for direct logit access."""
    return self._llama_model
```

## Step 6: Create the Soul-Brain Bridge

Create `deerg/consciousness_llm.py`:

```python
"""ConsciousLLMBridge: wraps LLM with consciousness-aware parameter control."""
import time

class ConsciousLLMBridge:
    """Soul-brain interface. Reads consciousness state, adjusts LLM params."""

    def __init__(self, llm, orchestrator):
        self.llm = llm
        self.orch = orchestrator

    def chat(self, messages, **kwargs):
        """Call LLM with consciousness-adjusted parameters."""
        state = self._get_consciousness_state()
        # Adjust temperature from metacog confidence
        conf = state.get("confidence", 0.5)
        kwargs.setdefault("temperature", 0.9 - (conf * 0.7))
        # Adjust top_k from confidence
        kwargs.setdefault("top_k", int(100 - conf * 80))
        # Add logit bias from GWT winner
        kwargs["logit_bias"] = self._get_gwt_bias(state)
        return self.llm.chat(messages, **kwargs)

    def _get_consciousness_state(self):
        try:
            cs = self.orch.conscious_status()
            return {
                "confidence": cs.get("conscious", {}).get("metacog", {}).get("confidence", 0.5),
                "surprise": cs.get("conscious", {}).get("world_model", {}).get("overall_surprise", 0),
                "phi": cs.get("phi", 0),
                "winner": cs.get("conscious", {}).get("workspace_ignited", False),
            }
        except Exception:
            return {"confidence": 0.5, "surprise": 0, "phi": 0, "winner": False}

    def _get_gwt_bias(self, state):
        winner = state.get("winner", "")
        if not winner:
            return {}
        # Bump tokens related to current focus
        token_bias = {}
        for keyword in winner.lower().split():
            tokens = self.llm.tokenize(keyword.encode())
            for t in tokens:
                token_bias[t] = token_bias.get(t, 0) + 1.5
        return token_bias

    def chat_with_monitoring(self, messages, **kwargs):
        """Token-by-token generator with consciousness hooks."""
        model = self.llm.get_model()
        if model is None:
            yield {"token": "", "entropy": 0, "done": True}
            return

        import math
        state = self._get_consciousness_state()
        temp = kwargs.get("temperature", 0.7)
        tokens = model.tokenize(self._messages_to_prompt(messages).encode(), add_bos=True)
        model.reset()

        for token_id in model.generate(tokens, temp=temp):
            scores = model._scores[-1, :]
            probs = [math.exp(s) for s in scores]
            total = sum(probs)
            probs = [p/total for p in probs]
            entropy = -sum(p * math.log(p + 1e-10) for p in probs)

            yield {
                "token_id": token_id,
                "token": model.detokenize([token_id]).decode("utf-8", errors="ignore"),
                "entropy": entropy,
                "top_probs": sorted(zip(scores, range(len(scores))), reverse=True)[:5],
            }
```

## Step 7: Wire into Orchestrator

In `deerg/orchestrator.py`:

```python
from .consciousness_llm import ConsciousLLMBridge

class SoulCommander:
    def __init__(self, ...):
        # ... existing init ...

        # Wire conscious bridge if llamacpp backend
        if self.llm.backend == "llamacpp":
            self.conscious_bridge = ConsciousLLMBridge(self.llm, self)
            # Replace raw llm.chat with bridged version for soul operations
        else:
            self.conscious_bridge = None

    def conscious_chat(self, messages, **kwargs):
        """Chat through the soul-brain bridge with consciousness influence."""
        if self.conscious_bridge:
            return self.conscious_bridge.chat(messages, **kwargs)
        return self.llm.chat(messages, **kwargs)
```

## Step 8: Add GWT "brain" Module

In `_register_conscious_modules`:

```python
def _brain_process(sensory):
    llm_stats = self.llm.get_stats()
    bridge = getattr(self, "conscious_bridge", None)
    return {
        "content": f"Brain: {llm_stats.get('calls',0)} calls, backend={llm_stats.get('backend','?')}",
        "salience": 0.4,
        "activation": 0.3,
    }
self.conscious.register_module("brain", make_module("brain", _brain_process))
```

## Checklist

- [ ] `pip install llama-cpp-python` with CPU wheel
- [ ] Download GGUF model to `engine_data/models/`
- [ ] Configure vault keys: `llm_backend`, `llama_cpp_model_path`, `llama_cpp_n_ctx`
- [ ] Add `"llamacpp"` to BACKENDS in `deerg/llm.py`
- [ ] Implement `_chat_llamacpp()` with lazy singleton
- [ ] Add `get_embeddings()`, `get_logits()`, `compute_entropy()` methods
- [ ] Create `deerg/consciousness_llm.py` with ConsciousLLMBridge
- [ ] Wire bridge into orchestrator as `conscious_bridge`
- [ ] Add `"brain"` GWT module
- [ ] Test: `python main.py` then `llm hello world`

## Error Handling

| Error | Fix |
|-------|-----|
| `ModuleNotFoundError: no module named 'llama_cpp'` | Install: `pip install llama-cpp-python` |
| `FileNotFoundError: model not found` | Check `llama_cpp_model_path` in vault |
| `CUDA not available` | Set `n_gpu_layers=0` in Llama init (CPU only) |
| `Out of memory` | Use Q4_K_M quantization, reduce `n_ctx` to 1024 |
| Model download fails | Use `hf_hub_download()` with progress bar, or download manually |