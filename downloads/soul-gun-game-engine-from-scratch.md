---
name: game-engine-from-scratch
description: Build a Game Engine from Scratch
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
---# Build a Game Engine from Scratch

---

## The Mental Model

A game engine is a **simulation loop** that advances time and renders state at a fixed rate. The core architecture is:

```
┌──────────────────────────────────────────────────────────────┐
│                    GAME ENGINE ARCHITECTURE                   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│   INPUT ──► UPDATE (physics, AI, logic) ──► RENDER ──► LOOP  │
│     ▲                                                    │   │
│     └────────────────────────────────────────────────────┘   │
│                                                               │
│   Fixed Timestep (dt = 1/60):                                │
│   ┌──────────────────────────────────────────────────────┐  │
│   │ accumulator = 0                                      │  │
│   │ frame_start = now()                                  │  │
│   │ while running:                                       │  │
│   │     accumulator += elapsed                           │  │
│   │     while accumulator >= dt:                          │  │
│   │         update(dt)     # physics at constant rate   │  │
│   │         accumulator -= dt                             │  │
│   │     render()          # interpolated or at display  │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                               │
│   ENTITIES:                                                   │
│   Entity = position + velocity + sprite + update()          │
│   Scene = collection of entities + input + update()         │
│   Camera = viewport into scene                              │
│                                                               │
│   GAME LOOP VARIANTS:                                         │
│   - Variable dt: simple but physics breaks at lag spikes   │
│   - Fixed dt: deterministic, physics never breaks          │
│   - Fixed with interpolation: smooth rendering, constant AI  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

The key insight: **separate physics tick rate from render rate**. Physics runs at a fixed 60Hz so collisions are deterministic. Rendering interpolates between ticks so the game looks smooth even if frames drop.

---

## The Build Steps (5 Steps, ~100 Lines)

### Step 1: Fixed-Timestep Game Loop (25 lines)

```python
"""Step 1: Fixed-timestep game loop with accumulator pattern."""
import time

class Game:
    def __init__(self, target_fps=60, physics_hz=60):
        self.target_fps = target_fps
        self.physics_dt = 1.0 / physics_hz
        self.running = False

    def start(self):
        self.running = True
        last_time = time.perf_counter()
        accumulator = 0.0

        while self.running:
            current_time = time.perf_counter()
            elapsed = current_time - last_time
            last_time = current_time
            accumulator += elapsed

            while accumulator >= self.physics_dt:
                self.update(self.physics_dt)
                accumulator -= self.physics_dt

            self.render()
            frame_time = time.perf_counter() - current_time
            target_frame = 1.0 / self.target_fps
            if frame_time < target_frame:
                time.sleep(target_frame - frame_time)

    def stop(self):
        self.running = False

    def update(self, dt):
        pass

    def render(self):
        pass

class TestGame(Game):
    def __init__(self):
        super().__init__(target_fps=60, physics_hz=60)
        self.x = 0
        self.frame_count = 0

    def update(self, dt):
        self.x = (self.x + 100 * dt) % 80

    def render(self):
        self.frame_count += 1
        if self.frame_count % 60 == 0:
            bar = ' ' * int(self.x) + 'O'
            print(f"Frame {self.frame_count//60}s |{bar:<80}|")

if __name__ == "__main__":
    print("Running fixed-timestep game loop (3 seconds)...")
    game = TestGame()

    import threading
    t = threading.Thread(target=lambda: (game.start(), time.sleep(3) or game.stop()))
    t.start()
```

---

### Step 2: Entity and Input (30 lines)

```python
"""Step 2: Entity system and input handling."""

class Entity:
    def __init__(self, x=0, y=0):
        self.x = x
        self.y = y
        self.vx = 0
        self.vy = 0
        self.sprite = None

    def update(self, dt):
        self.x += self.vx * dt
        self.y += self.vy * dt

class InputHandler:
    def __init__(self):
        self.keys = set()
        self.mouse_pos = (0, 0)
        self.mouse_buttons = set()

    def key_down(self, key):
        self.keys.add(key)

    def key_up(self, key):
        self.keys.discard(key)

    def is_pressed(self, key):
        return key in self.keys

class Player(Entity):
    def __init__(self, x, y, input_handler):
        super().__init__(x, y)
        self.speed = 200
        self.input = input_handler

    def update(self, dt):
        vx, vy = 0, 0
        if self.input.is_pressed('LEFT'):
            vx = -self.speed
        elif self.input.is_pressed('RIGHT'):
            vx = self.speed
        if self.input.is_pressed('UP'):
            vy = -self.speed
        elif self.input.is_pressed('DOWN'):
            vy = self.speed
        self.vx = vx
        self.vy = vy
        super().update(dt)

class Scene:
    def __init__(self):
        self.entities = []
        self.input = InputHandler()

    def add(self, entity):
        self.entities.append(entity)

    def update(self, dt):
        entities_copy = list(self.entities)
        for entity in entities_copy:
            entity.update(dt)

    def find(self, type_):
        return [e for e in self.entities if isinstance(e, type_)]

if __name__ == "__main__":
    scene = Scene()
    player = Player(10, 10, scene.input)
    scene.add(player)
    scene.input.key_down('RIGHT')
    for _ in range(5):
        scene.update(1/60)
    print(f"Player at ({player.x:.1f}, {player.y:.1f}) — moved right!")
```

---

### Step 3: Collision Detection (20 lines)

```python
"""Step 3: AABB collision detection."""

class Rect:
    def __init__(self, x, y, w, h):
        self.x = x
        self.y = y
        self.w = w
        self.h = h

    def intersects(self, other):
        return (self.x < other.x + other.w and
                self.x + self.w > other.x and
                self.y < other.y + other.h and
                self.y + self.h > other.y)

class Collider:
    def __init__(self, entity, rect):
        self.entity = entity
        self.rect = rect
        self.is_trigger = False

class Physics:
    def __init__(self):
        self.colliders = []

    def add_collider(self, entity, rect):
        self.colliders.append(Collider(entity, Rect(
            entity.x, entity.y, rect[0], rect[1]
        )))

    def update(self, dt):
        for col in self.colliders:
            col.rect.x = col.entity.x
            col.rect.y = col.entity.y

        for i, a in enumerate(self.colliders):
            for b in self.colliders[i+1:]:
                if a.rect.intersects(b.rect):
                    self.on_collision(a, b)

    def on_collision(self, a, b):
        print(f"Collision: {a.entity} <-> {b.entity}")

if __name__ == "__main__":
    player = Entity(0, 0)
    platform = Entity(100, 100)
    phys = Physics()
    phys.add_collider(player, (32, 32))
    phys.add_collider(platform, (64, 32))
    phys.update(0.016)
    print("Collision system ready!")
```

---

### Step 4: Sprite and Animation (15 lines)

```python
"""Step 4: Sprite and basic animation."""

class Sprite:
    def __init__(self, width, height, color):
        self.width = width
        self.height = height
        self.color = color
        self.visible = True
        self.opacity = 1.0

class Animation:
    def __init__(self, frames, fps=10, loop=True):
        self.frames = frames
        self.fps = fps
        self.loop = loop
        self.current_frame = 0
        self.time = 0

    def update(self, dt):
        self.time += dt
        frame_time = 1 / self.fps
        if self.time >= frame_time:
            self.time -= frame_time
            self.current_frame = (self.current_frame + 1) % len(self.frames)
            if not self.loop and self.current_frame == 0:
                self.current_frame = len(self.frames) - 1

    def get_current(self):
        return self.frames[self.current_frame]

class AnimatedSprite(Sprite):
    def __init__(self, animation):
        super().__init__(32, 32, (255, 255, 255))
        self.animation = animation

    def update(self, dt):
        self.animation.update(dt)

    def get_frame(self):
        return self.animation.get_current()

class GameObject(Entity):
    def __init__(self, x, y, sprite):
        super().__init__(x, y)
        self.sprite = sprite
```

---

### Step 5: Text-Based Renderer (10 lines)

```python
"""Step 5: Simple text-based renderer."""

class Renderer:
    def __init__(self, width=80, height=20):
        self.width = width
        self.height = height
        self.buffer = [[' ' for _ in range(width)] for _ in range(height)]

    def clear(self):
        self.buffer = [[' ' for _ in range(self.width)] for _ in range(self.height)]

    def draw_rect(self, x, y, w, h, char='#'):
        for row in range(y, min(y+h, self.height)):
            for col in range(x, min(x+w, self.width)):
                self.buffer[row][col] = char

    def draw_sprite(self, x, y, sprite, frame=None):
        c = sprite.color if hasattr(sprite, 'color') else (255, 255, 255)
        char = '@' if c == (255, 0, 0) else 'O'
        px, py = int(x), int(y)
        if 0 <= px < self.width and 0 <= py < self.height:
            self.buffer[py][px] = char

    def present(self):
        for row in self.buffer:
            print(''.join(row))

if __name__ == "__main__":
    r = Renderer(30, 10)
    r.draw_rect(5, 2, 8, 4)
    r.draw_sprite(7, 3, Sprite(1, 1, (255, 0, 0)))
    r.present()
    print("Text renderer: ready!")
```

---

## Checklist

- [ ] Step 1: Fixed-timestep loop with accumulator
- [ ] Step 2: Entity system with input handling
- [ ] Step 3: AABB collision detection
- [ ] Step 4: Sprite and animation
- [ ] Step 5: Text-based renderer
- [ ] Explain: why fixed timestep > variable timestep for physics