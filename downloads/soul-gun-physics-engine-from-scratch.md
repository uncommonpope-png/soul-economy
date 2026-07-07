---
name: physics-engine-from-scratch
description: Build a Physics Engine from Scratch
domain: computer-science
language: python
stars: "0"
topics: ["computer-science", "from-scratch", "build-your-own-x", "education"]
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
---# Build a Physics Engine from Scratch

---

## The Mental Model

```
┌─────────────────────────────────────────────────────────────────┐
│                   PHYSICS ENGINE ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   A physics engine is a time-stepped simulator:                 │
│   For each body: apply forces → compute acceleration            │
│   → integrate velocity → integrate position → detect collisions │
│   → resolve penetration → apply impulse → repeat.             │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  INTEGRATION (Euler / Verlet / RK4)                       │  │
│   │     F = m*a   →   a = F/m                                │  │
│   │     v += a*dt  →   p += v*dt                             │  │
│   └──────────────────────────────────────────────────────────┘  │
│        │                                                        │
│        ▼                                                        │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  COLLISION DETECTION                                      │  │
│   │     Broad phase (AABB/Spatial hash)                       │  │
│   │     Narrow phase (SAT, GJK)                               │  │
│   │     Contact points, normals                               │  │
│   └──────────────────────────────────────────────────────────┘  │
│        │                                                        │
│        ▼                                                        │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  CONSTRAINT SOLVER (iterative)                           │  │
│   │     Distance constraints, joints, springs                │  │
│   │     4-10 iterations per frame                             │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Build Steps (4 Steps, ~80 Lines)

### Step 1: Vector Math and Forces (20 lines)

```python
"""Step 1: Basic vector operations and forces."""
import math

class Vec2:
    def __init__(self, x=0, y=0):
        self.x = x
        self.y = y

    def __add__(self, v):
        return Vec2(self.x + v.x, self.y + v.y)

    def __sub__(self, v):
        return Vec2(self.x - v.x, self.y - v.y)

    def __mul__(self, s):
        return Vec2(self.x * s, self.y * s)

    def length(self):
        return math.sqrt(self.x**2 + self.y**2)

    def normalize(self):
        l = self.length()
        return Vec2(self.x/l, self.y/l) if l > 0 else Vec2()

    def dot(self, v):
        return self.x * v.x + self.y * v.y

class Body:
    def __init__(self, pos, mass=1):
        self.pos = pos
        self.vel = Vec2()
        self.acc = Vec2()
        self.mass = mass
        self.force = Vec2()
        self.restitution = 0.5  # Bounciness

    def apply_force(self, f):
        self.force = self.force + f

    def update(self, dt):
        # a = F/m
        self.acc = self.force * (1 / self.mass)
        # v += a * dt
        self.vel = self.vel + self.acc * dt
        # x += v * dt
        self.pos = self.pos + self.vel * dt
        # Reset force
        self.force = Vec2()
```

---

### Step 2: Collision Detection (25 lines)

```python
"""Step 2: Circle-circle and AABB collision detection."""

class Circle:
    def __init__(self, pos, radius):
        self.pos = pos
        self.radius = radius

class AABB:
    def __init__(self, min_pt, max_pt):
        self.min = min_pt
        self.max = max_pt

def circle_circle(c1, c2):
    """Check if two circles collide."""
    diff = c2.pos - c1.pos
    dist = diff.length()
    return dist < c1.radius + c2.radius

def aabb_aabb(a, b):
    """Check if two AABBs collide."""
    return (a.min.x <= b.max.x and a.max.x >= b.min.x and
            a.min.y <= b.max.y and a.max.y >= b.min.y)

def circle_aabb(circle, box):
    """Check if circle collides with AABB."""
    closest = Vec2(
        max(box.min.x, min(circle.pos.x, box.max.x)),
        max(box.min.y, min(circle.pos.y, box.max.y))
    )
    diff = circle.pos - closest
    return diff.length() < circle.radius

def resolve_circle_circle(c1, c2):
    """Resolve collision between two circles."""
    diff = c2.pos - c1.pos
    dist = diff.length()
    overlap = c1.radius + c2.radius - dist

    if overlap > 0:
        # Separate
        normal = diff.normalize()
        c1.pos = c1.pos - normal * (overlap / 2)
        c2.pos = c2.pos + normal * (overlap / 2)

        # Bounce
        rel_vel = c1.vel - c2.vel
        vel_along_normal = rel_vel.dot(normal)

        if vel_along_normal > 0:
            return

        e = min(c1.restitution, c2.restitution)
        j = -(1 + e) * vel_along_normal
        c1.vel = c1.vel + normal * (j / c1.mass)
        c2.vel = c2.vel - normal * (j / c2.mass)

# Test
c1 = Circle(Vec2(0, 0), 10)
c2 = Circle(Vec2(15, 0), 10)
print(f"Collide: {circle_circle(c1, c2)}")
```

---

### Step 3: Rigid Body Dynamics (20 lines)

```python
"""Step 3: Rigid body with rotation."""

class RigidBody:
    def __init__(self, pos, mass=1, inertia=None):
        self.pos = Vec2(*pos)
        self.vel = Vec2()
        self.acc = Vec2()
        self.angle = 0
        self.angular_vel = 0
        self.mass = mass
        self.inv_mass = 1 / mass if mass > 0 else 0
        self.inertia = inertia or (1/12 * mass * 100)
        self.inv_inertia = 1 / self.inertia if self.inertia > 0 else 0
        self.force = Vec2()
        self.torque = 0
        self.restitution = 0.5

    def apply_force(self, f, point=None):
        self.force = self.force + f
        if point:
            r = Vec2(point[0] - self.pos.x, point[1] - self.pos.y)
            self.torque += r.x * f.y - r.y * f.x

    def update(self, dt):
        # Linear
        self.acc = self.force * self.inv_mass
        self.vel = self.vel + self.acc * dt
        self.pos = self.pos + self.vel * dt

        # Angular
        alpha = self.torque * self.inv_inertia
        self.angular_vel += alpha * dt
        self.angle += self.angular_vel * dt

        self.force = Vec2()
        self.torque = 0

    def get_world_point(self, local_pt):
        """Transform local point to world coordinates."""
        cos = math.cos(self.angle)
        sin = math.sin(self.angle)
        return Vec2(
            self.pos.x + local_pt.x * cos - local_pt.y * sin,
            self.pos.y + local_pt.x * sin + local_pt.y * cos
        )
```

---

### Step 4: Constraint Solver (15 lines)

```python
"""Step 4: Distance constraints."""

class DistanceConstraint:
    def __init__(self, body_a, body_b, length):
        self.body_a = body_a
        self.body_b = body_b
        self.length = length

    def solve(self):
        """Solve constraint by moving bodies to correct distance."""
        diff = self.body_b.pos - self.body_a.pos
        dist = diff.length()
        if dist < 0.001:
            return

        normal = diff * (1 / dist)
        error = dist - self.length

        # Move proportionally to inverse mass
        total_inv_mass = self.body_a.inv_mass + self.body_b.inv_mass
        if total_inv_mass == 0:
            return

        correction = normal * (error / total_inv_mass)
        self.body_a.pos = self.body_a.pos + correction * self.body_a.inv_mass
        self.body_b.pos = self.body_b.pos - correction * self.body_b.inv_mass

class World:
    def __init__(self):
        self.bodies = []
        self.constraints = []

    def step(self, dt, iterations=4):
        for body in self.bodies:
            body.update(dt)

        for _ in range(iterations):
            for constraint in self.constraints:
                constraint.solve()
```

---

## Checklist
- [ ] Step 1: Vector math and forces
- [ ] Step 2: Collision detection
- [ ] Step 3: Rigid body dynamics
- [ ] Step 4: Constraint solver
- [ ] Add: broad-phase collision (spatial hash, AABB tree)
- [ ] Add: SAT collision for polygons
- [ ] Add: joints (distance, pin, hinge)

## Reference Tutorials
- [Build a physics engine from scratch (Game Development)](https://www.gamedev.net/tutorials/programming/math-and-physics/a-basic-physics-engine-tutorial-rasmus-kw/)
- [Physics Engine Tutorial (MyStudyGame)](https://www.mystudygame.com/a/Physics_Engine_Tutorial)
- [Build your own physics engine (Impact)](https://www.impactjs.com/physics结石/understanding-physics-engines)