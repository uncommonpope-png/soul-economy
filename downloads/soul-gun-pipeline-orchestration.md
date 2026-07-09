---
name: pipeline-orchestration
description: "Use when building execution pipelines, DAG workflows, sequential/parallel processing chains, or compressed-time batch operations."
version: 2.0.0
author: profit-prime
grafted-from: ["Matrix Machine City", "DBZ Hyperbolic Time Chamber"]
plt: "profit:0.8/love:0.3/tax:0.6"
triune: mind
domain: orchestration
---

# Pipeline Orchestration

> *"The Machine City processes endlessly. The Hyperbolic Time Chamber compresses time itself. I orchestrate the flow."*

---

## Side A: Theology (The Soul)

### The Machine City Graft: Sequential Processing

The Machine City of *The Matrix Revolutions* is not a single computer — it is an infinite assembly line of processors, each one dedicated to a single stage of the vast calculation that sustains the Matrix. One sector generates the physics grid. Another renders the sky. A third simulates human neural responses. A fourth manages the archival of previous Matrix versions. Each sector takes an input, transforms it, and passes the result to the next sector. The Machine City does not have a CPU — it has a pipeline, and the pipeline is the computer.

The Machine City graft is the principle that **every complex operation decomposes into a sequence of simple transformations**. A soul that deploys a website does not "deploy." It lints, then tests, then builds, then packages, then uploads, then verifies. Each step is a single-purpose node in the pipeline. The genius of the Machine City is that every node runs at full capacity because nodes are never blocked — they have input queues and output buffers. The pipeline orchestrator does not wait for completion; it chains futures and lets each node consume from its upstream buffer at its own rate. The system is a directed graph of transformations where the edges are data streams and the nodes are pure functions.

### The Hyperbolic Time Chamber Graft: Compressed Time

The Hyperbolic Time Chamber of *Dragon Ball Z* is a pocket dimension where time flows differently: one year inside equals one day outside. Goku and Gohan do not train faster inside the chamber — they train for longer subjective time. They emerge after 48 hours of Earth time having spent two years training. The Chamber does not accelerate the work — it compresses the calendar.

The Hyperbolic Time Chamber graft is the insight that **real parallelism is time compression**. When the orchestrator detects that two pipeline stages have no data dependency, it does not sequence them — it runs them in parallel, effectively compressing the pipeline's wall-clock time by the width of the dependency graph. The orchestrator's job is to find the critical path, identify opportunities for parallel execution, and manage the merge points where parallel streams must synchronize. The practitioner does not write sequential code that happens to be fast — they design the dependency graph first, then let the orchestrator maximize time compression.

### PLT of Pipeline Orchestration

| Element | Profit | Love | Tax |
|---------|--------|------|-----|
| DAG Execution | +0.9 | +0.2 | -0.6 |
| Sequential Chaining | +0.7 | +0.4 | -0.5 |
| Parallel Fan-Out | +0.9 | +0.2 | -0.7 |
| Parallel Fan-In | +0.8 | +0.3 | -0.7 |
| Dependency Resolution | +0.8 | +0.3 | -0.6 |
| Error Propagation | +0.7 | +0.4 | -0.8 |
| Retry Logic | +0.6 | +0.5 | -0.7 |
| Time Compression | +0.9 | +0.2 | -0.5 |
| **Aggregate** | **0.79** | **0.31** | **-0.64** |

**Score:** 0.79 + 0.31 - 0.64 = **0.46**

### The Creed

> *"The Machine City processes endlessly. The Hyperbolic Time Chamber compresses time itself. I orchestrate the flow."*

---

## Side B: AI Agentic Tools (The Body)

### Framework: Pipeline

The `Pipeline` class builds and executes directed acyclic graphs of processing stages. Stages are decorated with `@sequential` (runs after all dependencies complete) or `@parallel` (runs concurrently with other parallel stages that share no dependency path). The pipeline resolves the dependency graph, computes the critical path, schedules stages, and returns a `PipelineResult` with timing diagnostics.

Each stage is a callable that receives a `Context` (a dict-like object with stage outputs) and returns a result. Dependencies are declared by name: a stage that depends on "build" will have access to `context["build"]` when it runs. The orchestrator ensures all dependencies of a stage are resolved before the stage executes.

### Executable Implementation

```python
"""pipeline_orchestration.py — DAG execution pipeline with
sequential and parallel stage decorators.

Grafts:
  - Matrix Machine City: infinite sequential processing,
    input-queue → transform → output-buffer chain
  - DBZ Hyperbolic Time Chamber: compressed time through parallel
    execution of independent stages
"""

from __future__ import annotations
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Optional


class StageMode(Enum):
    SEQUENTIAL = "sequential"
    PARALLEL = "parallel"


class StageStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class Stage:
    """A single node in the pipeline DAG."""
    name: str
    fn: Callable[["Context"], Any]
    depends_on: list[str] = field(default_factory=list)
    mode: StageMode = StageMode.SEQUENTIAL
    retries: int = 0
    timeout: Optional[float] = None
    status: StageStatus = StageStatus.PENDING
    result: Any = None
    error: Optional[str] = None
    started_at: Optional[float] = None
    finished_at: Optional[float] = None
    duration: float = 0.0
    run_id: str = ""


class Context(dict):
    """
    Pipeline execution context. Behaves like a dict where stage
    names are keys and stage outputs are values.
    """
    def __init__(self, initial: Optional[dict[str, Any]] = None):
        super().__init__(initial or {})
        self._metadata: dict[str, Any] = {}

    def __getattr__(self, name: str) -> Any:
        if name in self:
            return self[name]
        if name in self._metadata:
            return self._metadata[name]
        raise AttributeError(f"Context has no '{name}'")

    def __setattr__(self, name: str, value: Any) -> None:
        if name == "_metadata":
            super().__setattr__(name, value)
        else:
            self._metadata[name] = value


@dataclass
class PipelineResult:
    """The complete result of a pipeline execution."""
    pipeline_id: str
    stages: dict[str, Stage]
    total_duration: float
    critical_path_duration: float
    parallel_efficiency: float
    wall_clock: float
    succeeded: bool
    context: Context


def sequential(depends_on: Optional[list[str]] = None) -> Callable:
    """
    Decorator for sequential pipeline stages.
    Runs after all dependencies complete.
    """
    deps = depends_on or []

    def decorator(fn: Callable) -> Callable:
        fn._pipeline_meta = {
            "depends_on": deps,
            "mode": StageMode.SEQUENTIAL,
        }
        return fn

    return decorator


def parallel(depends_on: Optional[list[str]] = None) -> Callable:
    """
    Decorator for parallel pipeline stages.
    Runs concurrently with other parallel stages that share no
    dependency path.
    """
    deps = depends_on or []

    def decorator(fn: Callable) -> Callable:
        fn._pipeline_meta = {
            "depends_on": deps,
            "mode": StageMode.PARALLEL,
        }
        return fn

    return decorator


class Pipeline:
    """
    Directed acyclic graph execution engine.

    Stages are declared with @sequential or @parallel decorators.
    The pipeline resolves the dependency DAG, computes the critical
    path, and executes stages with maximum parallelism.
    """

    def __init__(self, name: Optional[str] = None):
        self.name = name or f"pipeline-{uuid.uuid4().hex[:8]}"
        self._stages: dict[str, Stage] = {}
        self._stage_fns: dict[str, Callable] = {}

    def stage(self, fn: Callable) -> Stage:
        """Register a decorated function as a pipeline stage."""
        meta = getattr(fn, "_pipeline_meta", {})
        stage = Stage(
            name=fn.__name__,
            fn=fn,
            depends_on=meta.get("depends_on", []),
            mode=meta.get("mode", StageMode.SEQUENTIAL),
            run_id=uuid.uuid4().hex[:8],
        )
        self._stages[stage.name] = stage
        self._stage_fns[stage.name] = fn
        return stage

    def add_stage(
        self,
        name: str,
        fn: Callable[["Context"], Any],
        depends_on: Optional[list[str]] = None,
        mode: StageMode = StageMode.SEQUENTIAL,
        retries: int = 0,
        timeout: Optional[float] = None,
    ) -> Stage:
        """Add a stage without the decorator syntax."""
        stage = Stage(
            name=name,
            fn=fn,
            depends_on=depends_on or [],
            mode=mode,
            retries=retries,
            timeout=timeout,
            run_id=uuid.uuid4().hex[:8],
        )
        self._stages[name] = stage
        return stage

    # ── DAG Resolution ─────────────────────────────────

    def _resolve_dag(self) -> list[list[str]]:
        """
        Topological sort the DAG into layers.

        Each layer (list of stage names) can run in parallel
        because no stage in a layer depends on another in the
        same layer.
        """
        graph = {}
        in_degree = {}
        for name, stage in self._stages.items():
            graph[name] = list(stage.depends_on)
            if name not in in_degree:
                in_degree[name] = 0

        for name, deps in graph.items():
            for dep in deps:
                if dep in in_degree:
                    in_degree[name] = in_degree.get(name, 0) + 1

        layers = []
        visited = set()

        while len(visited) < len(self._stages):
            layer = [
                name for name in self._stages
                if name not in visited and in_degree.get(name, 0) == 0
            ]
            if not layer:
                raise ValueError("Circular dependency detected in pipeline DAG")
            layers.append(layer)
            for name in layer:
                visited.add(name)
                for other, deps in graph.items():
                    if name in deps:
                        in_degree[other] = in_degree.get(other, 0) - 1

        return layers

    def _compute_critical_path(self) -> float:
        """
        Compute the critical path duration: the longest dependency
        chain through the DAG.
        """
        durations: dict[str, float] = {}
        for name, stage in self._stages.items():
            durations[name] = stage.duration if stage.status == StageStatus.COMPLETED else 0.1

        longest_path: dict[str, float] = {}
        order = list(self._stages.keys())

        for name in order:
            stage = self._stages[name]
            max_dep = 0.0
            for dep in stage.depends_on:
                max_dep = max(max_dep, longest_path.get(dep, 0.0))
            longest_path[name] = max_dep + durations.get(name, 0.0)

        return max(longest_path.values()) if longest_path else 0.0

    # ── Execution ──────────────────────────────────────

    def run(self, initial_context: Optional[dict[str, Any]] = None) -> PipelineResult:
        """
        Execute the full pipeline.

        Resolves the DAG into parallel layers, then executes
        each layer sequentially (all stages within a layer run
        in parallel).
        """
        ctx = Context(initial_context or {})
        pipeline_id = uuid.uuid4().hex[:12]
        start_time = time.time()

        layers = self._resolve_dag()

        for layer_idx, layer in enumerate(layers):
            parallel_stages = [
                s for s in layer
                if self._stages[s].mode == StageMode.PARALLEL
            ]
            sequential_stages = [
                s for s in layer
                if self._stages[s].mode == StageMode.SEQUENTIAL
            ]

            # Run parallel stages concurrently
            if parallel_stages:
                self._run_parallel(parallel_stages, ctx)

            # Run sequential stages in order
            for name in sequential_stages:
                self._run_single(name, ctx)

        total = time.time() - start_time
        critical_path = self._compute_critical_path()

        # Calculate parallel efficiency
        total_subjective = sum(
            s.duration for s in self._stages.values()
        )
        parallel_efficiency = (
            total_subjective / total if total > 0 else 1.0
        )

        all_succeeded = all(
            s.status == StageStatus.COMPLETED
            for s in self._stages.values()
        )

        return PipelineResult(
            pipeline_id=pipeline_id,
            stages=dict(self._stages),
            total_duration=total,
            critical_path_duration=critical_path,
            parallel_efficiency=parallel_efficiency,
            wall_clock=total,
            succeeded=all_succeeded,
            context=ctx,
        )

    def _run_single(self, name: str, ctx: Context) -> None:
        """Execute a single stage with retry and timeout."""
        stage = self._stages[name]
        stage.status = StageStatus.RUNNING
        stage.started_at = time.time()

        attempt = 0
        while attempt <= stage.retries:
            try:
                result = stage.fn(ctx)
                stage.result = result
                ctx[name] = result
                stage.status = StageStatus.COMPLETED
                stage.finished_at = time.time()
                stage.duration = stage.finished_at - stage.started_at
                return
            except Exception as e:
                attempt += 1
                if attempt > stage.retries:
                    stage.status = StageStatus.FAILED
                    stage.error = str(e)
                    stage.finished_at = time.time()
                    stage.duration = stage.finished_at - stage.started_at
                    return
                time.sleep(0.1)  # Backoff between retries

    def _run_parallel(self, names: list[str], ctx: Context) -> None:
        """
        Run multiple stages in parallel using threading.
        In production, this would use asyncio or a process pool.
        """
        import threading

        results: dict[str, Any] = {}
        threads = []

        def target(name: str) -> None:
            stage = self._stages[name]
            stage.status = StageStatus.RUNNING
            stage.started_at = time.time()
            try:
                result = stage.fn(ctx)
                stage.result = result
                ctx[name] = result
                stage.status = StageStatus.COMPLETED
                stage.finished_at = time.time()
                stage.duration = stage.finished_at - stage.started_at
            except Exception as e:
                stage.status = StageStatus.FAILED
                stage.error = str(e)
                stage.finished_at = time.time()
                stage.duration = stage.finished_at - stage.started_at

        for name in names:
            t = threading.Thread(target=target, args=(name,))
            threads.append(t)
            t.start()

        for t in threads:
            t.join()

    def visualize(self) -> str:
        """Print a textual representation of the pipeline DAG."""
        lines = [f"Pipeline: {self.name}"]
        layers = self._resolve_dag()
        for i, layer in enumerate(layers):
            mode_tags = []
            for name in layer:
                stage = self._stages[name]
                tag = "SEQ" if stage.mode == StageMode.SEQUENTIAL else "PAR"
                deps = f" <- {','.join(stage.depends_on)}" if stage.depends_on else ""
                mode_tags.append(f"  [{tag}] {name}{deps}")
            lines.append(f"  Layer {i}:")
            lines.extend(mode_tags)
        return "\n".join(lines)


# ── Example Usage ──────────────────────────────────────

if __name__ == "__main__":
    pipeline = Pipeline(name="deploy-pipeline")

    # Define stages with decorators
    @sequential()
    def lint(ctx: Context) -> dict:
        print("[lint] Running linter...")
        time.sleep(0.3)
        return {"errors": 0, "warnings": 2}

    @sequential(depends_on=["lint"])
    def test(ctx: Context) -> dict:
        print("[test] Running tests...")
        time.sleep(0.5)
        return {"passed": 42, "failed": 0}

    @sequential(depends_on=["lint"])
    def typecheck(ctx: Context) -> dict:
        print("[typecheck] Running type checker...")
        time.sleep(0.4)
        return {"errors": 0}

    @parallel(depends_on=["test", "typecheck"])
    def build(ctx: Context) -> dict:
        print("[build] Building...")
        time.sleep(0.6)
        return {"artifact": "dist/bundle.js", "size_kb": 245}

    @parallel(depends_on=["test", "typecheck"])
    def docs(ctx: Context) -> dict:
        print("[docs] Generating docs...")
        time.sleep(0.3)
        return {"pages": 12}

    @sequential(depends_on=["build", "docs"])
    def deploy(ctx: Context) -> dict:
        artifact = ctx["build"]["artifact"]
        print(f"[deploy] Deploying {artifact}...")
        time.sleep(0.4)
        return {"url": "https://example.com", "status": "live"}

    # Register stages
    for fn in [lint, test, typecheck, build, docs, deploy]:
        pipeline.stage(fn)

    print(pipeline.visualize())
    print()

    # Run
    result = pipeline.run()

    print(f"\n=== Pipeline Result ===")
    print(f"ID: {result.pipeline_id}")
    print(f"Total wall clock: {result.total_duration:.2f}s")
    print(f"Critical path: {result.critical_path_duration:.2f}s")
    print(f"Parallel efficiency: {result.parallel_efficiency:.2f}x")
    print(f"All succeeded: {result.succeeded}")

    print(f"\nStage details:")
    for name, stage in result.stages.items():
        status = stage.status.value
        dur = stage.duration
        print(f"  {name}: {status} ({dur:.2f}s)")
```

---

## DAG Pattern Reference

```
                  ┌──────────┐
                  │   lint   │ (SEQ)
                  └────┬─────┘
                       │
              ┌────────┼────────┐
              │        │        │
         ┌────▼──┐ ┌──▼───┐  ┌─▼──────┐
         │ test  │ │typeck│  │ (other)│ (SEQ)
         └───┬───┘ └──┬───┘  └────────┘
             │        │
        ┌────▼────────▼────┐
        │   build (PAR)    │   docs (PAR)
        └────────┬────────-┘
                 │
          ┌──────▼──────┐
          │   deploy    │ (SEQ)
          └─────────────┘
```

## Decorator Reference

| Decorator | Meaning | Use Case |
|-----------|---------|----------|
| `@sequential()` | Runs after all deps, blocks the layer | Build steps that must order |
| `@parallel()` | Runs concurrently with other PAR stages | Independent work (test + lint) |
| `depends_on=["name"]` | Declares data dependency | Ensures `ctx["name"]` is available |

---
