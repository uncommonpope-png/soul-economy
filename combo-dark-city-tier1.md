# COMBO: Dark City Reconstruction — Tier 1

**Identity:** 6 Soul Guns Rebuilding the Core Dark City Experience  
**PLT:** Profit 0.9, Love 0.7, Tax 0.3  
**Type:** Build — Spatial OS Core  
**Grafter:** Profit Prime

---

## The 6 Guns

### 1. Camera First Person (`camera_first_person`)
- WASD + mouse look. UniversalCamera with pointer lock.
- V key toggles between orbit and first-person.
- Collision detection via scene.collisionsEnabled.
- *Why:* Without this, the city is a diorama, not a place.

### 2. Camera Follow & Zoom (`camera_follow_zoom`)
- Smooth camera following selected citizens.
- District zoom transitions with animation.
- Follow toggle (F key).
- *Why:* Citizens are meaningless if you can't watch them.

### 3. Citizen 3D Mesh (`citizen_3d_mesh`)
- Visible body + head meshes per citizen.
- Name labels with billboard mode.
- Archetype colors (Observer=blue, Explorer=gold, etc.).
- Hermes has gold emissive.
- *Why:* Citizens that exist only in a panel don't feel alive.

### 4. Building GSK Wire (`building_gsk_wire`)
- Buildings store gskState component (energyLevel, activityLevel).
- Emissive intensity = resource average (0→1 maps to 0.15→1.0).
- Pulse system: resources events trigger glow flashes.
- 2s refresh interval.
- *Why:* The city must visibly respond to GSK's state.

### 5. Spatial HUD (`spatial_hud`)
- 3D floating building info panels with canvas-rendered text.
- Billboard mode, auto-dismiss after 8s.
- Shows building name, type, level, GSK state, PLT score.
- *Why:* Information should exist in the world, not on separate panels.

### 6. Mechanics Tests (`mechanics_tests`)
- 65 tests across parseIntent, templates, memory, resources, save, civ score, event bus, HUD, onboarding, proximity.
- `node tests/test-mechanics.js` to run.
- *Why:* Untested mechanics are broken mechanics.

---

## How to Load
```bash
# Load all 6 guns:
/skill game-loop-design
/skill game-mechanics-design
/skill input-feedback-systems
/skill ecs-entity-system
# Then execute the code changes in order: camera → citizens → buildings → HUD → tests
```

## Verification
- V toggles first-person. WASD moves. Mouse looks.
- Citizens are visible as 3D entities with name labels.
- Buildings glow based on resource levels.
- Click building → 3D info panel appears.
- `node tests/test-mechanics.js` → 65 passing.
