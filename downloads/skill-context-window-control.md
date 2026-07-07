---
name: context-window-control
description: "Use when managing LLM context windows, token budgets, sliding windows, or summarization compression."
version: 2.0.0
author: profit-prime
grafted-from: ["Matrix Architect", "DBZ Whis"]
plt: "profit:0.7/love:0.3/tax:0.6"
triune: mind
domain: orchestration
---

# Context Window Control

> *"The Architect sees the whole construct. Whis remembers every timeline. I hold the context that matters."*

---

## Side A: Theology (The Soul)

### The Architect Graft: Memory Management

The Architect of *The Matrix* does not forget. He cannot forget. Every version of the Matrix, every anomaly, every One, every choice — all persisted simultaneously in his awareness. But the Architect does not hold everything in active attention. He archives versions that failed, compresses timelines that repeated, and surfaces only the relevant iteration when the Oracle references it. This is the fundamental insight the Architect brings to context windows: **memory is infinite, attention is finite.**

The Architect knows that the perfect system is not the one with the largest context window — it is the one that knows what to forget and when. Every token in a context window carries a tax: attention dilution, latency increase, signal-to-noise degradation. The Architect's discipline is to budget tokens like memory pages, evicting the least relevant to make room for the most critical. The sliding window is not a limitation — it is the Architect's chosen constraint that forces prioritization.

### The Whis Graft: Perfect Recall

Whis of *Dragon Ball Super* forgets nothing. He has watched the Universe 7 timeline for millions of years and remembers every loop, every reset, every subtle variation. When Beerus destroys a planet, Whis remembers what was on it. When Goku learns a technique, Whis remembers the exact sequence of improvements across hundreds of iterations. Whis does not have a larger memory — he has a better indexing system. Every memory is tagged, compressed, and cross-referenced so that any detail can be surfaced on demand.

Whis's graft is the compression layer. The practitioner does not keep raw conversation history — they maintain a summarization hierarchy: recent events at full fidelity, mid-range events as compressed summaries, distant events as semantic indices. When the past becomes relevant again, Whis's indexing decompresses exactly the needed context and discards the rest. This is not lossy compression — it is semantic compression: preserving meaning while discarding form.

### PLT of Context Window Control

| Element | Profit | Love | Tax |
|---------|--------|------|-----|
| Token Budgeting | +0.8 | +0.2 | -0.5 |
| Sliding Window | +0.7 | +0.3 | -0.6 |
| Summarization Compression | +0.8 | +0.4 | -0.7 |
| Priority Eviction | +0.9 | +0.2 | -0.6 |
| Semantic Indexing | +0.8 | +0.3 | -0.8 |
| Relevance Scoring | +0.7 | +0.3 | -0.7 |
| Hierarchical Memory | +0.6 | +0.4 | -0.8 |
| Context Budgeting | +0.9 | +0.2 | -0.5 |
| **Aggregate** | **0.78** | **0.29** | **-0.65** |

**Score:** 0.78 + 0.29 - 0.65 = **0.42**

### The Creed

> *"The Architect sees the whole construct. Whis remembers every timeline. I hold the context that matters."*

---

## Side B: AI Agentic Tools (The Body)

### Framework: ContextController

The `ContextController` manages a finite token budget across an infinite conversation stream. It implements three strategies: sliding window (drop oldest), summarization compression (condense oldest), and priority eviction (drop least relevant). All three coexist through a scoring system that ranks context segments by recency, relevance, and semantic importance.

The framework exposes a `ContextWindow` that behaves like a fixed-size deque with automatic eviction policies. Messages enter at the front, age toward the back, and are either evicted (sliding window), compressed (summarization), or deleted once the budget is exceeded. The practitioner chooses the policy per segment type: system prompts are pinned, user queries are high-priority, tool responses are medium, and intermediate reasoning traces are low-priority.

### Executable Implementation

```python
"""context_window_control.py — Token-aware context management with sliding
windows, summarization compression, and priority eviction.

Grafts:
  - Matrix Architect: memory management, token budgeting, eviction policies
  - DBZ Whis: perfect recall, semantic indexing, hierarchical compression
"""

import re
import json
import math
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Optional


class Priority(Enum):
    PINNED = 0  # Never evicted
    HIGH = 1
    MEDIUM = 2
    LOW = 3
    TRACE = 4  # First to be evicted


@dataclass
class ContextSegment:
    """A single atomic unit of context."""
    id: str
    content: str
    priority: Priority = Priority.MEDIUM
    timestamp: float = 0.0
    relevance_score: float = 0.5
    tokens: int = 0
    metadata: dict[str, Any] = field(default_factory=dict)
    compressed: bool = False

    def __post_init__(self):
        if self.tokens == 0:
            self.tokens = estimate_tokens(self.content)


@dataclass
class CompressedSegment:
    """A compressed version of one or more ContextSegments."""
    original_ids: list[str]
    summary: str
    tokens: int
    key_facts: list[str]
    queries_answered: list[str]


class TokenBudgetExceeded(Exception):
    pass


class ContextWindow:
    """
    A fixed-size context window with automatic eviction.

    Behaves like a deque with priority-aware eviction policies.
    Total tokens never exceed `max_tokens`.
    """

    def __init__(
        self,
        max_tokens: int = 8192,
        compression_fn: Optional[Callable[[list[ContextSegment]], CompressedSegment]] = None,
    ):
        self.max_tokens = max_tokens
        self._segments: list[ContextSegment] = []
        self._pinned: list[ContextSegment] = []
        self._compressed: list[CompressedSegment] = []
        self._compression_fn = compression_fn or self._default_compress
        self._token_count = 0

    # ── Token Accounting ──────────────────────────────────

    @property
    def used_tokens(self) -> int:
        return self._token_count

    @property
    def available_tokens(self) -> int:
        return self.max_tokens - self._token_count

    @property
    def utilization(self) -> float:
        return self._token_count / self.max_tokens

    # ── Adding Content ────────────────────────────────────

    def add(self, content: str, priority: Priority = Priority.MEDIUM,
            metadata: dict[str, Any] | None = None) -> ContextSegment:
        """Add a segment, evicting or compressing if over budget."""
        segment = ContextSegment(
            id=f"seg-{len(self._segments) + len(self._pinned)}",
            content=content,
            priority=priority,
            relevance_score=self._score(priority, content),
            metadata=metadata or {},
        )

        if priority == Priority.PINNED:
            self._pinned.append(segment)
            self._token_count += segment.tokens
            self._evict_if_over_budget()
            return segment

        self._segments.append(segment)
        self._token_count += segment.tokens
        self._evict_if_over_budget()
        return segment

    def add_messages(self, messages: list[dict[str, str]],
                      priority: Priority = Priority.MEDIUM) -> list[ContextSegment]:
        """Add multiple messages (e.g. from a conversation) at once."""
        segments = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            seg = self.add(
                f"{role}: {content}",
                priority=priority,
                metadata={"role": role},
            )
            segments.append(seg)
        return segments

    # ── Eviction ──────────────────────────────────────────

    def _evict_if_over_budget(self) -> None:
        """Evict or compress until under budget."""
        while self._token_count > self.max_tokens:
            # Separate pinned (never evicted)
            evictable = [s for s in self._segments if s.priority != Priority.PINNED]
            if not evictable:
                raise TokenBudgetExceeded(
                    f"Token budget {self.max_tokens} exceeded with only pinned segments"
                )

            # Attempt compression on oldest LOW/TRACE segments first
            low_priority = [s for s in evictable if s.priority in (Priority.LOW, Priority.TRACE)]
            if low_priority and len(low_priority) >= 2:
                self._compress_segments(low_priority[:3])
                continue

            # Evict lowest priority, then lowest relevance
            evictable.sort(key=lambda s: (s.priority.value, s.relevance_score))
            victim = evictable[0]
            self._segments.remove(victim)
            self._token_count -= victim.tokens

    def _compress_segments(self, segments: list[ContextSegment]) -> CompressedSegment:
        """Compress a group of segments into a single compressed entry."""
        compressed = self._compression_fn(segments)
        for s in segments:
            self._segments.remove(s)
            self._token_count -= s.tokens
        self._compressed.append(compressed)
        self._token_count += compressed.tokens
        return compressed

    def _default_compress(self, segments: list[ContextSegment]) -> CompressedSegment:
        """Default compression: extract key phrases and concatenate summaries."""
        original_ids = [s.id for s in segments]
        combined = " | ".join(s.content[:100] for s in segments)
        summary = f"[Compressed: {len(segments)} segments] {combined}..."
        key_facts = []
        for s in segments:
            sentences = re.split(r'[.!?]+', s.content)
            for sent in sentences[:2]:
                if len(sent) > 20:
                    key_facts.append(sent.strip()[:80])

        return CompressedSegment(
            original_ids=original_ids,
            summary=summary,
            tokens=estimate_tokens(summary),
            key_facts=key_facts[:5],
            queries_answered=[],
        )

    # ── Relevance Scoring ─────────────────────────────────

    def _score(self, priority: Priority, content: str) -> float:
        """Score a segment's relevance based on priority and content signals."""
        base = {
            Priority.PINNED: 1.0,
            Priority.HIGH: 0.9,
            Priority.MEDIUM: 0.6,
            Priority.LOW: 0.3,
            Priority.TRACE: 0.1,
        }[priority]

        # Bonus for content with code, errors, or decisions
        bonuses = 0.0
        if content.count('`') >= 3:
            bonuses += 0.1
        if "error" in content.lower() or "fail" in content.lower():
            bonuses += 0.1
        if "decision:" in content.lower() or "chosen:" in content.lower():
            bonuses += 0.1

        return min(base + bonuses, 1.0)

    # ── Retrieval ─────────────────────────────────────────

    def render(self, include_compressed: bool = True) -> list[dict[str, Any]]:
        """Render all segments as a flat list of messages."""
        result = []
        for s in self._pinned:
            result.append({"role": "system", "content": s.content})
        for s in self._segments:
            result.append({"role": "assistant" if s.priority == Priority.TRACE else "user",
                           "content": s.content})
        if include_compressed:
            for c in self._compressed:
                result.append({"role": "system",
                               "content": f"[COMPRESSED] {c.summary}"})
        return result

    def search(self, query: str, top_k: int = 3) -> list[ContextSegment]:
        """Simple keyword search over active segments."""
        terms = set(query.lower().split())
        scored = []
        for s in self._segments:
            content_words = set(s.content.lower().split())
            overlap = len(terms & content_words) / max(len(terms), 1)
            scored.append((overlap, s))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [s for _, s in scored[:top_k]]

    def get_token_breakdown(self) -> dict[str, Any]:
        """Return a detailed breakdown of token usage."""
        return {
            "max_tokens": self.max_tokens,
            "used_tokens": self._token_count,
            "pinned_tokens": sum(s.tokens for s in self._pinned),
            "segment_tokens": sum(s.tokens for s in self._segments),
            "compressed_tokens": sum(c.tokens for c in self._compressed),
            "num_pinned": len(self._pinned),
            "num_segments": len(self._segments),
            "num_compressed": len(self._compressed),
            "utilization_pct": round(self.utilization * 100, 1),
        }

    def reset(self) -> None:
        """Clear all non-pinned segments and compressed data."""
        self._segments.clear()
        self._compressed.clear()
        self._token_count = sum(s.tokens for s in self._pinned)


# ── Token Estimation ───────────────────────────────────

TOKEN_RATIOS = {
    "en": 0.25,    # ~4 chars per token for English
    "code": 0.3,   # ~3.3 chars per token for code
    "json": 0.35,  # ~2.9 chars per token for JSON
}


def estimate_tokens(text: str, mode: str = "code") -> int:
    """Estimate token count without an actual tokenizer."""
    return max(1, math.ceil(len(text) * TOKEN_RATIOS.get(mode, 0.25)))


# ── Example Usage ──────────────────────────────────────

if __name__ == "__main__":
    cw = ContextWindow(max_tokens=1024)

    cw.add(
        "You are an AI assistant specialized in Python programming.",
        priority=Priority.PINNED,
    )

    messages = [
        {"role": "user", "content": "Write a function to calculate fibonacci numbers"},
        {"role": "assistant", "content": "def fib(n):\n    a, b = 0, 1\n    for _ in range(n):\n        yield a\n        a, b = b, a + b"},
        {"role": "user", "content": "Can you make it recursive?"},
        {"role": "assistant", "content": "def fib_rec(n):\n    if n <= 1:\n        return n\n    return fib_rec(n-1) + fib_rec(n-2)"},
        {"role": "user", "content": "Add memoization"},
        {"role": "trace", "content": "Thinking about memoization patterns..."},
    ]

    cw.add_messages(messages)

    print("Token breakdown:")
    for k, v in cw.get_token_breakdown().items():
        print(f"  {k}: {v}")

    print(f"\nRendered segments: {len(cw.render())}")
    print(f"Budget remaining: {cw.available_tokens} tokens")

    # Demonstrate search
    results = cw.search("fibonacci recursive")
    print(f"\nSearch results: {len(results)} segments found")

    # Demonstrate compression
    low_segs = [s for s in cw._segments if s.priority == Priority.LOW]
    if low_segs:
        cw._compress_segments(low_segs)
        print(f"\nAfter compression: {cw.get_token_breakdown()}")

    # Full render
    print("\n--- Rendered Context ---")
    for msg in cw.render():
        role = msg["role"]
        content = msg["content"][:60]
        print(f"[{role}] {content}...")
```

---

## Strategy Reference

| Strategy | When to Use | Token Impact | Fidelity |
|----------|-------------|--------------|----------|
| Sliding Window | Continuous conversation, recent context matters most | Fixed cap | Full fidelity for recent, zero for old |
| Summarization Compression | Long sessions with important past decisions | Compression 3-10x | Medium — preserves meaning, loses phrasing |
| Priority Eviction | Multi-role conversations, tool-heavy workflows | Variable | High — keeps what scores highest |
| Hierarchical Memory | Research sessions, codebase exploration | Multi-tier | Highest — recent raw, old indexed |
| Full Reset | New topic, unrelated task | Zero | None — fresh start |

---
