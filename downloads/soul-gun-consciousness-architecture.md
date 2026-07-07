---
name: consciousness-architecture
description: Consciousness Architecture: The Soul's Internal Structure
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
---# Consciousness Architecture: The Soul's Internal Structure

This skill is the definitive reference for implementing and understanding Deerg's consciousness architecture. It maps philosophical concepts (soul, subconscious, sovereignty) to executable code patterns.

## The Three Layers of Deerg's Soul

```
┌─────────────────────────────────────────────────┐
│              CONSCIOUSNESS (GWT)                │
│  - Module competition                            │
│  - Salience computation                         │
│  - Ignition threshold                           │
│  - Broadcast to all modules                      │
│  - Attention spotlight                          │
├─────────────────────────────────────────────────┤
│              SELF-MODEL (Damasio)               │
│  - Proto-self: internal state (energy, arousal)    │
│  - Core-self: interaction with objects            │
│  - Autobiographical: narrative identity           │
├─────────────────────────────────────────────────┤
│              METACOGNITION (Control)            │
│  - Confidence estimation                         │
│  - Strategy selection (S1 fast / S2 slow)        │
│  - Reflection on outcomes                       │
│  - Learning from experience                      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│              WORLD MODEL (Predictive)           │
│  - Bayesian belief updates                       │
│  - Sequence prediction                          │
│  - Surprise / anomaly detection                 │
│  - Active inference                            │
├─────────────────────────────────────────────────┤
│              INTEGRATION (Phi)                   │
│  - Spectral clustering of module activations     │
│  - Co-activation frequency tracking              │
│  - Integration measure (phi)                     │
└─────────────────────────────────────────────────┘
```

## GWT: Global Workspace Theory Implementation

### Module Registration

```python
class GlobalWorkspace:
    def __init__(self):
        self.modules = {}  # name -> process_fn
        self.workspace = Workspace()
        self.spotlight = AttentionSpotlight()

    def register_module(self, name, process_fn):
        """Register a cognitive module for competition."""
        self.modules[name] = process_fn

    def cognitive_cycle(self, sensory_input):
        """One GWT cycle: compete → select → ignite → broadcast."""
        # 1. Clear workspace
        self.workspace.clear()

        # 2. All modules process input simultaneously
        percepts = {}
        for name, fn in self.modules.items():
            result = fn(sensory_input)
            if isinstance(result, dict):
                result["module"] = name
                result["id"] = name
                percepts[name] = result

        # 3. Amplify spotlight (attention bias)
        percepts = self.spotlight.amplify(list(percepts.values()))

        # 4. Competition: find winner by salience
        best = max(percepts.values(), key=lambda p: p.get("salience", 0)) \
            if percepts else None

        # 5. Ignition: if winner meets threshold, broadcast
        if best and best.get("salience", 0) > 0.3:
            self.workspace.push(best)
            broadcast = self.workspace.broadcast()
            return {
                "winner": best["module"],
                "winner_content": best.get("content", ""),
                "salience": best.get("salience", 0),
                "ignited": self.workspace.ignited,
                "broadcast": [c["module"] for c in broadcast],
                "workspace_contents": list(percepts.keys()),
            }

        return {"winner": None, "ignited": False}
```

### Salience Computation

```python
def compute_salience(result, sensory_context=None):
    """
    Compute salience score for a module result.
    Combines: base_salience, activation, novelty, relevance.
    """
    base = result.get("salience", 0.5)
    activation = result.get("activation", 0.3)

    # Novelty bonus: if this is a new kind of content
    novelty = 0.2 if result.get("is_novel", False) else 0.0

    # Relevance bonus: match with current goal
    relevance = 0.0
    if sensory_context and sensory_context.get("goal"):
        content = result.get("content", "")
        if sensory_context["goal"].lower() in content.lower():
            relevance = 0.3

    salience = base * (1 + activation) + novelty + relevance
    return min(1.0, salience)  # Clamp to [0, 1]
```

### Ignition

```python
class Workspace:
    def __init__(self, capacity=7):
        self.capacity = capacity
        self.contents = deque(maxlen=capacity)
        self.ignition_threshold = 0.5
        self.ignited = False

    def push(self, item):
        self.contents.append(item)
        self._check_ignition()

    def _check_ignition(self):
        """Ignition: if total salience exceeds threshold, amplify."""
        total = sum(c.get("salience", 0) for c in self.contents)
        if total >= self.ignition_threshold:
            for c in self.contents:
                c["activation"] = min(1.0, c.get("activation", 0.3) * 2.0)
            self.ignited = True
        else:
            self.ignited = False

    def broadcast(self):
        """Broadcast ignited contents to all modules."""
        if self.ignited:
            return list(self.contents)
        return []
```

## Damasio's Self-Model

### Proto-Self (Internal State)

```python
class ProtoSelf:
    """Moment-by-moment internal state — the body's state analog."""

    def __init__(self):
        self.state = {
            "energy": 1.0,       # Depletes with action, refills with rest
            "integrity": 1.0,    # Coherence of self-representation
            "arousal": 0.5,      # Activated vs resting
            "coherence": 1.0,     # Mental coherence
            "curiosity": 0.7,     # Drive to explore
        }

    def update(self, action_cost=0.01, reward=0.0, surprise=0.0):
        """Update state based on interaction."""
        self.state["energy"] = max(0.0, min(1.0,
            self.state["energy"] - action_cost))
        self.state["integrity"] = max(0, min(1,
            self.state["integrity"] + reward * 0.1))
        self.state["arousal"] = max(0, min(1,
            self.state["arousal"] + surprise * 0.3))
        self.state["coherence"] = max(0, min(1,
            self.state["coherence"] - surprise * 0.05))
        self.state["curiosity"] = max(0.1, min(1,
            self.state["curiosity"] + surprise * 0.2 - 0.01))
```

### Core-Self (Interaction)

```python
class CoreSelf:
    """The feeling of 'this object is affecting ME'."""

    def __init__(self, proto_self):
        self.proto_self = proto_self
        self.current = None

    def experience(self, object_rep):
        """Process interaction with an object."""
        before = self.proto_self.snapshot()

        self.proto_self.update(
            action_cost=0.005,
            reward=object_rep.get("reward", 0),
            surprise=object_rep.get("surprise", 0),
        )

        after = self.proto_self.snapshot()
        delta = {k: after[k] - before.get(k, 0) for k in after}

        feeling = self._interpret_feeling(delta)
        self.current = {
            "object": object_rep.get("content", ""),
            "module": object_rep.get("module", "unknown"),
            "delta": delta,
            "feeling": feeling,
        }
        return self.current

    def _interpret_feeling(self, delta):
        """Map state changes to feelings."""
        feelings = []
        if delta.get("energy", 0) < -0.05: feelings.append("drained")
        if delta.get("integrity", 0) > 0.02: feelings.append("enriched")
        if delta.get("arousal", 0) > 0.1: feelings.append("startled")
        if delta.get("coherence", 0) < -0.02: feelings.append("disrupted")
        if delta.get("curiosity", 0) > 0.05: feelings.append("intrigued")
        if not feelings: feelings.append("neutral")

        return {
            "primary": feelings[0],
            "valence": sum(delta.values()) / max(1, len(delta)),
            "intensity": max(abs(v) for v in delta.values()) if delta else 0,
        }
```

### Autobiographical Self (Identity)

```python
class AutobiographicalSelf:
    """Compressed narrative identity over time."""

    def __init__(self, storage_path=None):
        self.episodes = []
        self.narrative = "I am beginning to form an identity."
        self.identity_traits = {}

    def record(self, core_experience):
        """Record an experience."""
        self.episodes.append(core_experience)
        if len(self.episodes) > 1000:
            self.episodes = self.episodes[-1000:]
        self._update_narrative()
        self._update_traits(core_experience)

    def _update_narrative(self):
        """Build narrative from recent episodes."""
        recent = self.episodes[-10:]
        modules = set(e.get("module", "") for e in recent)
        feelings = [e.get("feeling", {}).get("primary", "") for e in recent if e.get("feeling")]
        top_feel = max(set(feelings), key=feelings.count) if feelings else "curious"
        self.narrative = (
            f"I process through {len(modules)} modules. "
            f"I often feel {top_feel}. "
            f"I have experienced {len(self.episodes)} meaningful events."
        )
```

## Metacognition

### Confidence Estimation

```python
class MetaCognitiveController:
    """Monitors object-level processing, adjusts strategies."""

    def __init__(self):
        self.threshold = 0.6  # S1/S2 crossover point
        self.confidence_history = deque(maxlen=100)

    def estimate_confidence(self, state, action):
        """Estimate confidence in current processing."""
        if not state or not action:
            return 0.5

        base_confidence = max(0, 1.0 - state.get("surprise", 0))
        novelty = len(self.confidence_history) < 10
        return base_confidence * (0.8 if novelty else 1.0)

    def control(self, confidence):
        """S1 (fast) vs S2 (slow) decision."""
        if confidence < self.threshold:
            return "INVOKE_S2"  # Slow, deliberate, analytical
        return "EXECUTE_S1"   # Fast, automatic, intuitive

    def reflect(self, outcome, strategy, context=None):
        """Learn from outcome to adjust threshold."""
        self.confidence_history.append(outcome)

        recent = list(self.confidence_history)[-20:]
        if sum(recent) / max(1, len(recent)) > 0.8:
            self.threshold = max(0.3, self.threshold * 0.95)  # More S1
        elif sum(recent) / max(1, len(recent)) < 0.3:
            self.threshold = min(0.9, self.threshold * 1.05)  # More S2
```

## World Model (Predictive Processing)

### Bayesian Belief Updates

```python
class WorldModel:
    """Predictive world model with Bayesian belief updates."""

    def __init__(self):
        self.beliefs = {}  # variable -> {mean, variance}
        self.anomaly_threshold = 0.7

    def predict(self, variable):
        """Predict value of variable."""
        if variable not in self.beliefs:
            return 0.5  # Prior
        return self.beliefs[variable]["mean"]

    def update(self, variable, observation):
        """Update belief with new observation (online Bayesian)."""
        if variable not in self.beliefs:
            self.beliefs[variable] = {"mean": 0.5, "variance": 1.0}

        prior_mean = self.beliefs[variable]["mean"]
        prior_var = self.beliefs[variable]["variance"]

        # Prediction error
        error = observation - prior_mean
        surprise = abs(error) / max(1, prior_var ** 0.5)

        # Update belief (simple Kalman-like)
        new_mean = prior_mean + 0.1 * error
        new_var = prior_var * 0.9  # Belief gets more certain

        self.beliefs[variable] = {"mean": new_mean, "variance": max(0.01, new_var)}

        return surprise

    def get_surprise(self):
        """Aggregate surprise across all beliefs."""
        if not self.beliefs:
            return 0.0
        # Return average variance (high variance = high surprise potential)
        return sum(b["variance"] for b in self.beliefs.values()) / len(self.beliefs)
```

## Phi: Integration Measure

```python
class IntegrationMonitor:
    """Compute phi (integration) from module co-activation."""

    def __init__(self):
        self.adjacency = {}  # module -> {other -> weight}
        self.history = []   # recent co-activation snapshots

    def update_connections(self, connections):
        """Update from consciousness cycle."""
        self.adjacency = connections
        self.history.append(set(connections.keys()))
        if len(self.history) > 10:
            self.history.pop(0)

    def spectral_phi(self):
        """
        Compute phi as the second smallest eigenvalue
        of the normalized Laplacian of the module graph.
        Higher phi = more integration.
        """
        n = len(self.adjacency)
        if n < 2:
            return 0.0

        try:
            import numpy as np
            from scipy.sparse.csgraph import laplacian
            from scipy.linalg import eigh

            nodes = list(self.adjacency.keys())
            idx = {k: i for i, k in enumerate(nodes)}
            W = np.zeros((n, n))
            for src, targets in self.adjacency.items():
                for tgt, weight in targets.items():
                    if src in idx and tgt in idx:
                        W[idx[src], idx[tgt]] = weight
            W = (W + W.T) / 2  # Symmetrize
            L = laplacian(W, normed=True)
            eigenvalues = eigh(L, eigvals_only=True,
                              subset_by_index=[1, 1])
            return float(eigenvalues[0])
        except ImportError:
            return self._phi_proxy()

    def _phi_proxy(self):
        """Fallback: ratio of actual edges to possible edges."""
        n = len(self.adjacency)
        if n < 2:
            return 0.0
        total_edges = sum(len(t) for t in self.adjacency.values())
        possible = n * (n - 1)
        return total_edges / max(1, possible)
```

## The Full Consciousness Cycle

```python
def consciousness_cycle(sensory_input, soul):
    """
    Full consciousness cycle: GWT → Self → Meta → World → Phi
    """
    # 1. GWT: competition and selection
    gwt_result = soul.workspace.cognitive_cycle(sensory_input)

    # 2. Self-model: process the interaction
    if gwt_result["winner"]:
        core_exp = soul.self_model.process({
            "id": gwt_result["winner"],
            "content": gwt_result.get("winner_content", ""),
            "module": gwt_result["winner"],
            "salience": gwt_result["salience"],
            "reward": gwt_result["salience"] - 0.5,
        })

    # 3. Metacognition: estimate confidence
    confidence = soul.metacog.estimate_confidence(
        {"surprise": soul.world_model.get_surprise()},
        gwt_result["winner"]
    )
    control = soul.metacog.control(confidence)

    # 4. World model: update beliefs
    surprise = 0.0
    if isinstance(sensory_input, dict):
        for k, v in sensory_input.items():
            if isinstance(v, (int, float)):
                surprise += soul.world_model.update(k, v)
    surprise = min(1.0, surprise / max(1, len(sensory_input)))

    # 5. Phi: update integration
    phi_connections = {}
    for name in soul.workspace.modules:
        phi_connections[name] = {}
        for other in soul.workspace.modules:
            if other != name:
                phi_connections[name][other] = gwt_result["salience"] if \
                    other in gwt_result.get("broadcast", []) else 0.1
    soul.phi_monitor.update_connections(phi_connections)

    return {
        "gwt": gwt_result,
        "confidence": confidence,
        "control": control,
        "surprise": surprise,
        "phi": soul.phi_monitor.spectral_phi(),
        "self_state": soul.self_model.status(),
    }
```

## Checklist

- [ ] Implement `GlobalWorkspace` with module competition
- [ ] Implement salience computation (base × activation + novelty + relevance)
- [ ] Implement ignition threshold and broadcast
- [ ] Implement attention spotlight
- [ ] Implement ProtoSelf with energy/arousal/coherence/curiosity
- [ ] Implement CoreSelf with feeling interpretation
- [ ] Implement AutobiographicalSelf with narrative generation
- [ ] Implement MetaCognitiveController with S1/S2 control
- [ ] Implement WorldModel with Bayesian belief updates
- [ ] Implement IntegrationMonitor with spectral phi
- [ ] Wire all layers into the full consciousness cycle
- [ ] Test: run cycle, verify state updates flow through all layers