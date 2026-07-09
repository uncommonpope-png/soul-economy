---
name: threejs-particle-fx
description: GPU particle effects for Three.js
domain: threejs
language: typescript
stars: "0"
topics: ["threejs"]
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
---# Three.js Particle FX

## Origin
Researched from: Rezmason/matrix (gold standard rain), dgnsrekt/matrixfield (production), plume (GPU particles), Three.js official compute examples, aiira-co/three-particles.

---

## 1. Matrix Code Rain

### Architecture (3 Approaches)

**A. GPU Shader Simulation (Best)**
Characters are fixed-position glyphs. Rain is a wave of illumination computed in a fragment shader:
```glsl
float getRainBrightness(float simTime, vec2 glyphPos) {
    float columnTimeOffset = random(vec2(glyphPos.x, 0.)) * 1000.;
    float columnSpeedOffset = random(vec2(glyphPos.x + 0.1, 0.)) * 0.5 + 0.5;
    float columnTime = columnTimeOffset + simTime * fallSpeed * columnSpeedOffset;
    float rainTime = (glyphPos.y * 0.01 + columnTime) / raindropLength;
    return 1.0 - fract(rainTime);
}
```
Each column (x) has random time/speed offset. Glyphs don't move — illumination waves move down.

**B. TextGeometry Pool (Production)**
Object pool with ShaderMaterial per character. File structure:
```
characterGeometry.js    — TextGeometry per char with caching
characterShader.js      — Custom ShaderMaterial (distance glow, color variation)
characterPool.js        — Object pool, 300+ meshes
streamManager.js        — ~25 rain columns, 8-12 chars each
instancedRenderer.js    — InstancedMesh for 500+ chars
```

**C. Canvas2D Background (Simple)**
Render rain to 2D canvas → use as Three.js background texture → apply Bloom post-processing.

### Shader Glow via Distance
```glsl
// Fragment shader — distance-based brightness
float dist = length(vPosition - cameraPosition);
float normDist = clamp((dist - nearDist) / (maxDist - nearDist), 0.0, 1.0);
float brightness = mix(brightnessMax, brightnessMin, normDist);
gl_FragColor = vec4(baseColor * brightness, alpha);
```

### Character Sets
| Set | Contents |
|-----|----------|
| Katakana | ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロヮワヰヱヲンヴヵヶ |
| Latin | ABCDEFGHIJKLMNOPQRSTUVWXYZ |
| Binary | 01 |
| Symbols | #!$^&*()-=+[]{}|;:',.<>?/@~ |

---

## 2. Splash / Impact Particles

### GPU Particle Collision
```ts
// In compute shader — ground collision at y=0
If(position.y.lessThan(0), () => {
    position.y = 0;
    velocity.y = velocity.y.negate().mul(bounce);
    velocity.x = velocity.x.mul(0.9);
    velocity.z = velocity.z.mul(0.9);
});
```

### Splash Shapes

**Radial Burst** — particles ejected outward in a disk:
```glsl
float angle = random(index) * 2.0 * PI;
float speed = mix(minSpeed, maxSpeed, random(index));
velocity.x = cos(angle) * speed;
velocity.z = sin(angle) * speed;
velocity.y = upwardBias;
```

**Crown Splash** — particles rise in a ring at the perimeter:
```glsl
float radius = crownRadius;
float angle = random(index) * 2.0 * PI;
position.x = impact.x + cos(angle) * radius;
position.z = impact.z + sin(angle) * radius;
velocity.y = 2.0 + random(index) * 3.0;
```

**Ripple Rings** — expanding ring texture:
```glsl
float dist = length(gl_PointCoord - 0.5);
float ring = abs(dist - 0.3);
float alpha = 1.0 - smoothstep(0.0, 0.05, ring);
```

### Splash Life Management
```glsl
float life = age / lifespan;
// Size decays: size * (1.0 - life)
// Alpha fades: 1.0 - life
// Position drifts outward with life
```

### Sub-Emitter Pattern (plume)
```ts
emitter("rain", (e) => e
    .capacity(5000).spawnRate(200)
    .gravity(-9.8)
    .planeCollision({ y: 0, bounce: 0.1 })
)

emitter("splash", (e) => e
    .capacity(128)
    .spawnFromEvents()  // Listen for death events from "rain"
    .lifetime({ min: 0.3, max: 0.6 })
    .velocity({ kind: "sphere", radius: 3, speed: { min: 1, max: 4 } })
    .alphaOverLife([[0, 1], [1, 0]])
)
```

---

## 3. Custom Shader Particles

### ShaderMaterial Points (50K-100K particles)
```glsl
// Vertex shader
attribute float aSize;
attribute float aAlpha;
attribute vec3 aColor;
varying float vAlpha;

void main() {
    vAlpha = aAlpha;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}
```

```glsl
// Fragment shader
varying float vAlpha;
uniform vec3 uColor;
void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.3, d);
    gl_FragColor = vec4(uColor, alpha * vAlpha);
}
```

### Performance Comparison
| Approach | Max Particles | Draw Calls |
|----------|--------------|------------|
| PointsMaterial | 10K-50K | 1 |
| ShaderMaterial | 100K-300K | 1 |
| WebGPU Compute + SpriteNodeMaterial | 200K-500K | 1 |

---

## 4. Glow & Visual Quality

### Additive Blending (core technique)
```ts
material.blending = THREE.AdditiveBlending
material.transparent = true
material.depthWrite = false
```

### Bloom for Particle Glow
```ts
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85)
// parameters: strength, radius, threshold
```

### Per-Particle Opacity (CPU update)
```ts
geometry.attributes.opacity.array[i] -= fadeSpeed
geometry.attributes.opacity.needsUpdate = true
```

### GPU Trails (position history buffer)
```ts
trail: {
    enabled: true,
    segments: 16,        // history buffer depth
    width: 0.2,
    fadeAlpha: true,     // head → tail fade
}
```

---

## 5. Grid Platform Rain Integration

### Architecture
```
MatrixRain (columns of glyphs)
    ↓ column wave reaches bottom
RainSplash (particle burst at impact point)
    ↓
Grid surface (ripple ring shader overlay)
    ↓
Bloom post-processing (glow on everything)
```

### Rain + Grid Collision
```ts
// Each column tracks its own wave position
// When wave passes below grid Y, emit splash
useFrame((_, delta) => {
    columns.forEach(col => {
        col.wavePos += delta * col.speed
        if (col.wavePos > col.length) {
            col.wavePos -= col.length
            emitSplash(col.x, col.z)  // Spawn burst at grid position
        }
    })
})
```

---

## Libraries
| Library | Purpose |
|---------|---------|
| three | Core renderer, geometries, materials |
| @react-three/fiber | R3F Canvas, hooks |
| @react-three/drei | Helper components |
| @react-three/postprocessing | Bloom, CA, Vignette |
| postprocessing | EffectComposer, BloomEffect |
