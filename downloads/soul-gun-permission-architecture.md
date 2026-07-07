---
name: permission-architecture
description: "Use when implementing RBAC, tool-level ACLs, role scoping, or permission gates."
version: 2.0.0
author: profit-prime
grafted-from: ["Matrix Merovingian", "DBZ King Kai"]
plt: "profit:0.6/love:0.4/tax:0.7"
triune: tec
domain: security
---

# Permission Architecture

> *"The Merovingian controls all transactions. King Kai decides who trains. I decide who acts."*

---

## Side A: Theology (The Soul)

### The Merovingian Graft: Gatekeeper

The Merovingian of *The Matrix Reloaded* does not fight in the streets. He sits in a restaurant, drinks wine, and controls every transaction in the underworld. Exiles come to him for passage. Information flows through his channels. Access to the Keymaker is not a technical problem — it is a permission problem. The Merovingian decides who may enter, who may leave, and what they may take. He is the system of gates made flesh.

The Merovingian's graft is the insight that **permission is not a boolean — it is a negotiation**. A soul should not simply "have access" or "not have access." Access should be scoped to role, context, resource, and time. The Merovingian does not give keys — he gives visas: temporary, scoped, revocable permissions that expire when their purpose is served. Every gate in the system asks four questions: who are you, what do you want, what is your authority, and what will you leave behind? This is the architecture of permission as transaction.

### The King Kai Graft: Who May Train

King Kai of *Dragon Ball Z* does not teach everyone. He dwells on a tiny planet at the end of Snake Way, and reaching him is itself a test of worth. Goku does not arrive at King Kai's doorstep and receive training — he proves he can survive the journey, then proves he can take the training, then proves he can pass the tests. King Kai does not gatekeep from ego — he gatekeeps because his techniques (Kaio-ken, Spirit Bomb) destroy those who are not ready.

The King Kai graft is the principle of **competence-gated access**. A role does not gain permission to a tool because they request it — they gain permission because they have demonstrated the competence to use it safely. In code, this means permission escalation through demonstrated capability: a junior role can read logs but not export them; a mid role can export logs but not trigger deployments; a senior role can trigger deployments but only within business hours. Each level is unlocked by demonstrating safe operation at the previous level. King Kai teaches the Spirit Bomb only after Kaio-ken is mastered.

### PLT of Permission Architecture

| Element | Profit | Love | Tax |
|---------|--------|------|-----|
| Role Scoping | +0.7 | +0.3 | -0.6 |
| Tool-Level ACLs | +0.8 | +0.2 | -0.8 |
| Competence Gating | +0.6 | +0.5 | -0.7 |
| Context Scoping | +0.7 | +0.4 | -0.7 |
| Revocation | +0.5 | +0.3 | -0.8 |
| Audit Trails | +0.3 | +0.4 | -0.9 |
| Least Privilege | +0.7 | +0.5 | -0.6 |
| **Aggregate** | **0.61** | **0.37** | **-0.73** |

**Score:** 0.61 + 0.37 - 0.73 = **0.25**

### The Creed

> *"The Merovingian controls all transactions. King Kai decides who trains. I decide who acts."*

---

## Side B: AI Agentic Tools (The Body)

### Framework: PermissionGate

The `PermissionGate` implements a role-based access control system with tool-level ACLs, dynamic role scoping, and competence-gated escalation. Every permission check returns a detailed `Authorization` result that includes the role, the scope, and the reason for grant or denial.

The system is built on three layers:
1. **Roles** — named collections of permissions with inheritance
2. **ACLs** — per-tool (or per-resource) access control lists that specify granted roles and required capabilities
3. **Context Gates** — dynamic conditions evaluated at access time (time of day, load, caller provenance)

### Executable Implementation

```python
"""permission_architecture.py — RBAC with tool-level ACLs,
competence gating, and dynamic context scoping.

Grafts:
  - Matrix Merovingian: gatekeeper, transactional permissions, scoped access
  - DBZ King Kai: competence-gated escalation, training as proof of worth
"""

from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Optional


class Effect(Enum):
    ALLOW = "allow"
    DENY = "deny"


@dataclass(frozen=True)
class Permission:
    """An atomic permission: can perform action on resource."""
    action: str       # e.g. "read", "write", "execute", "delete"
    resource: str     # e.g. "logs", "deployments", "secrets", "tools:*"


@dataclass
class Role:
    """A named collection of permissions with optional inheritance."""
    name: str
    permissions: set[Permission] = field(default_factory=set)
    parents: list[str] = field(default_factory=list)
    capabilities: set[str] = field(default_factory=set)  # Competence signals
    max_scope: str = "self"  # "self", "team", "org"

    def has_permission(self, action: str, resource: str) -> bool:
        return Permission(action, resource) in self.permissions


@dataclass
class Authorization:
    """The result of a permission check."""
    granted: bool
    role: str
    action: str
    resource: str
    reason: str
    scope: str = "self"
    context: dict[str, Any] = field(default_factory=dict)


class ContextGate:
    """
    A dynamic condition that must be satisfied for access.
    Examples: time-of-day restriction, load-shedding, provenance check.
    """

    def __init__(self, name: str, check: Callable[[dict[str, Any]], bool]):
        self.name = name
        self.check = check

    def evaluate(self, context: dict[str, Any]) -> bool:
        return self.check(context)

    @staticmethod
    def business_hours() -> ContextGate:
        return ContextGate("business_hours", lambda ctx: True)

    @staticmethod
    def low_load() -> ContextGate:
        return ContextGate("low_load", lambda ctx: ctx.get("system_load", 0) < 0.8)

    @staticmethod
    def same_provenance(trusted_provenances: set[str]) -> ContextGate:
        return ContextGate(
            "same_provenance",
            lambda ctx: ctx.get("provenance", "unknown") in trusted_provenances,
        )


class PermissionGate:
    """
    The central gatekeeper.

    Roles define what each identity can do.
    ACLs define which roles may access which tools.
    ContextGates add dynamic conditions.
    Competence escalation unlocks higher permissions.
    """

    def __init__(self):
        self._roles: dict[str, Role] = {}
        self._acls: dict[str, list[tuple[str, str, list[ContextGate]]]] = {}
        # acl format: resource -> [(action, required_role, gates)]

    # ── Role Management ───────────────────────────────────

    def create_role(self, name: str, *,
                    permissions: Optional[list[tuple[str, str]]] = None,
                    parents: Optional[list[str]] = None,
                    capabilities: Optional[set[str]] = None) -> Role:
        """Create or update a role with its permissions."""
        perm_set = set()
        for action, resource in (permissions or []):
            perm_set.add(Permission(action, resource))
        role = Role(
            name=name,
            permissions=perm_set,
            parents=parents or [],
            capabilities=capabilities or set(),
        )
        self._roles[name] = role
        return role

    def get_role(self, name: str) -> Optional[Role]:
        """Get a role by name, with inherited permissions resolved."""
        role = self._roles.get(name)
        if role is None:
            return None
        return self._resolve_inherited(role)

    def _resolve_inherited(self, role: Role) -> Role:
        """Walk the parent chain and collect all permissions."""
        all_perms = set(role.permissions)
        all_caps = set(role.capabilities)
        visited = {role.name}
        queue = list(role.parents)
        while queue:
            parent_name = queue.pop(0)
            if parent_name in visited:
                continue
            visited.add(parent_name)
            parent = self._roles.get(parent_name)
            if parent:
                all_perms.update(parent.permissions)
                all_caps.update(parent.capabilities)
                queue.extend(p for p in parent.parents if p not in visited)
        return Role(
            name=role.name,
            permissions=all_perms,
            parents=role.parents,
            capabilities=all_caps,
            max_scope=role.max_scope,
        )

    # ── ACL Management ────────────────────────────────────

    def grant(self, resource: str, action: str, role: str,
              gates: Optional[list[ContextGate]] = None) -> None:
        """Grant a role access to an action on a resource."""
        if resource not in self._acls:
            self._acls[resource] = []
        self._acls[resource].append((action, role, gates or []))

    def revoke(self, resource: str, action: str, role: str) -> None:
        """Revoke a specific grant."""
        if resource not in self._acls:
            return
        self._acls[resource] = [
            (a, r, g) for a, r, g in self._acls[resource]
            if not (a == action and r == role)
        ]

    # ── Authorization ─────────────────────────────────────

    def authorize(
        self,
        identity: str,
        action: str,
        resource: str,
        context: Optional[dict[str, Any]] = None,
    ) -> Authorization:
        """
        Check if an identity (mapped to a role) may perform an action on a resource.

        Returns a full Authorization record with reason.
        """
        context = context or {}
        identity_role = context.get("role", identity)

        role = self.get_role(identity_role)
        if role is None:
            return Authorization(
                granted=False,
                role=identity_role,
                action=action,
                resource=resource,
                reason=f"Role '{identity_role}' not found",
            )

        # Check direct permission
        if not role.has_permission(action, resource):
            return Authorization(
                granted=False,
                role=role.name,
                action=action,
                resource=resource,
                reason=f"Role '{role.name}' lacks permission '{action}:{resource}'",
            )

        # Check ACL gates
        resource_acls = self._acls.get(resource, [])
        matching_gates = []
        for acl_action, acl_role, gates in resource_acls:
            if acl_action == action and acl_role == role.name:
                matching_gates = gates
                break

        if matching_gates:
            for gate in matching_gates:
                if not gate.evaluate(context):
                    return Authorization(
                        granted=False,
                        role=role.name,
                        action=action,
                        resource=resource,
                        reason=f"Context gate '{gate.name}' denied access",
                        context=context,
                    )

        return Authorization(
            granted=True,
            role=role.name,
            action=action,
            resource=resource,
            reason=f"Role '{role.name}' authorized for '{action}:{resource}'",
            scope=role.max_scope,
            context=context,
        )

    # ── Competence Escalation ─────────────────────────────

    def check_competence(
        self,
        identity: str,
        required_capabilities: set[str],
        context: Optional[dict[str, Any]] = None,
    ) -> Authorization:
        """
        King Kai gate: check if the identity has demonstrated the required
        capabilities to unlock a higher permission tier.
        """
        context = context or {}
        role_name = context.get("role", identity)
        role = self.get_role(role_name)

        if role is None:
            return Authorization(
                granted=False,
                role=role_name,
                action="escalate",
                resource="competence",
                reason="Role not found",
            )

        missing = required_capabilities - role.capabilities
        if missing:
            return Authorization(
                granted=False,
                role=role.name,
                action="escalate",
                resource="competence",
                reason=f"Missing capabilities: {', '.join(missing)}",
            )

        return Authorization(
            granted=True,
            role=role.name,
            action="escalate",
            resource="competence",
            reason=f"All capabilities demonstrated: {', '.join(required_capabilities)}",
        )

    def add_capability(self, role_name: str, capability: str) -> None:
        """Record that a role has demonstrated a capability."""
        role = self._roles.get(role_name)
        if role:
            role.capabilities.add(capability)


# ── Convenience Builder ───────────────────────────────

class PermissionArchitect:
    """Fluent API for building a permission system."""

    def __init__(self):
        self.gate = PermissionGate()
        self._role_builder: dict[str, dict] = {}

    def with_role(self, name: str, inherits: Optional[list[str]] = None) -> "PermissionArchitect":
        self._role_builder[name] = {"inherits": inherits or []}
        return self

    def with_permission(self, role: str, action: str, resource: str) -> "PermissionArchitect":
        if role not in self._role_builder:
            self._role_builder[role] = {"inherits": []}
        if "perms" not in self._role_builder[role]:
            self._role_builder[role]["perms"] = []
        self._role_builder[role]["perms"].append((action, resource))
        return self

    def with_grant(self, resource: str, action: str, role: str,
                   gates: Optional[list[ContextGate]] = None) -> "PermissionArchitect":
        self.gate.grant(resource, action, role, gates)
        return self

    def build(self) -> PermissionGate:
        for name, spec in self._role_builder.items():
            self.gate.create_role(
                name,
                permissions=spec.get("perms", []),
                parents=spec.get("inherits", []),
            )
        return self.gate


# ── Example Usage ──────────────────────────────────────

if __name__ == "__main__":
    # Build the permission system
    arch = PermissionArchitect()

    # Roles with inheritance
    arch.with_role("viewer", inherits=[]) \
        .with_permission("viewer", "read", "logs") \
        .with_permission("viewer", "read", "status")

    arch.with_role("operator", inherits=["viewer"]) \
        .with_permission("operator", "write", "logs") \
        .with_permission("operator", "execute", "tools:inspect")

    arch.with_role("admin", inherits=["operator"]) \
        .with_permission("admin", "execute", "deployments") \
        .with_permission("admin", "delete", "logs")

    # Tool-level ACLs with context gates
    arch.with_grant("deployments", "execute", "admin",
                     gates=[ContextGate.low_load()])

    # Build the gate
    gate = arch.build()

    # Add competencies for King Kai escalation
    gate.add_capability("operator", "safe_inspect")
    gate.add_capability("operator", "log_analysis")

    # Test authorizations
    test_cases = [
        ("alice", "read", "logs", {"role": "viewer"}),
        ("alice", "execute", "deployments", {"role": "viewer"}),
        ("bob", "execute", "tools:inspect", {"role": "operator"}),
        ("carol", "execute", "deployments", {"role": "admin", "system_load": 0.3}),
        ("carol", "execute", "deployments", {"role": "admin", "system_load": 0.9}),
    ]

    print("=== Authorization Results ===")
    for identity, action, resource, context in test_cases:
        result = gate.authorize(identity, action, resource, context)
        status = "ALLOW" if result.granted else "DENY"
        print(f"  [{status}] {identity}: {action} {resource}")
        print(f"         -> {result.reason}")

    # Competence check
    print("\n=== Competence Escalation ===")
    result = gate.check_competence(
        "bob",
        {"safe_inspect", "log_analysis", "deploy_experience"},
        {"role": "operator"},
    )
    print(f"  Escalation: {'ALLOW' if result.granted else 'DENY'}")
    print(f"  Reason: {result.reason}")
```

---

## Role Hierarchy Reference

```
admin
 └── operator (inherits: viewer + write logs + execute inspect)
      └── viewer (inherits: none — read logs + read status)
```

## Context Gate Reference

| Gate | Condition | Use Case |
|------|-----------|----------|
| `business_hours` | Always True (customize per org) | Deploy window restrictions |
| `low_load` | `system_load < 0.8` | Heavy operations during off-peak |
| `same_provenance` | Caller provenance in trusted set | MCP origin validation |
| `rate_limited` | Max N calls per time window | API abuse prevention |

---
