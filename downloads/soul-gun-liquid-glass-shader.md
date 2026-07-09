---
name: liquid-glass-shader
description: Use when building liquid glass UI panels with real GLSL shaders. Triggers on: "liquid glass", "glass panel", "glass shader", "refraction shader", "frosted glass", "SDF panel", "bevel glass".
metadata:
  mined-from: ybouane/liquidglass, ektogamat/apple-liquid-glass
  total-stars: 5000+
  session: 2026-06-27
---

# Liquid Glass Shader: Real GLSL Glass Panels for Dashboards

This skill teaches how to build liquid glass panels using real GLSL shaders with SDF shapes, dual-surface refraction, Fresnel, chromatic aberration, and bevel normals. Mined from ybouane/liquidglass and ektogamat/apple-liquid-glass.

## Mental Model

```
┌─────────────────────────────────────────────┐
│           Liquid Glass Pipeline             │
│                                             │
│  Input Texture ──→ BlitTexture (copy)       │
│       │                                     │
│       ▼                                     │
│  BlurTexture (9-tap Gaussian, 2 passes)     │
│       │                                     │
│       ▼                                     │
│  GlassComposite (GLSL shader):              │
│    ├─ SDF rounded-rect (panel shape)        │
│    ├─ Bevel height: sqrt(d * (2*zR - d))   │
│    ├─ Bevel normal: normalize(dx, dy, 0.25) │
│    ├─ Dual refraction (IOR 1.5)             │
│    ├─ Chromatic aberration (R/G/B offset)   │
│    ├─ Fresnel: (1 - dot(V,N))^5             │
│    ├─ Blinn-Phong specular                  │
│    └─ Panel mask (anti-aliased SDF)         │
│       │                                     │
│       ▼                                     │
│  Output: glass panel with blurred BG        │
└─────────────────────────────────────────────┘
```

## Step 1: WebGL Setup

```typescript
// lib/glass-renderer.ts
export class LiquidGlassRenderer {
  private gl: WebGLRenderingContext
  private program: WebGLProgram
  private blurProgram: WebGLProgram

  constructor(canvas: HTMLCanvasElement) {
    this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl')!
    this.initShaders()
  }

  private initShaders() {
    // Compile vertex + fragment shaders for each stage
    const vsQuad = this.compileShader(VERTEX_QUAD, this.gl.VERTEX_SHADER)
    const fsBlur = this.compileShader(FRAGMENT_BLUR, this.gl.FRAGMENT_SHADER)
    const fsGlass = this.compileShader(FRAGMENT_GLASS, this.gl.FRAGMENT_SHADER)

    this.blurProgram = this.linkProgram(vsQuad, fsBlur)
    this.program = this.linkProgram(vsQuad, fsGlass)
  }

  private compileShader(source: string, type: number): WebGLShader {
    const shader = this.gl.createShader(type)!
    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader error:', this.gl.getShaderInfoLog(shader))
    }
    return shader
  }
}
```

## Step 2: Vertex Shader (Shared)

```glsl
// shaders/vs_quad.glsl
#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;

void main() {
  v_texCoord = a_texCoord;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
```

## Step 3: Blur Fragment Shader (9-Tap Gaussian)

```glsl
// shaders/fs_blur.glsl
#version 300 es
precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_direction; // (1/w, 0) or (0, 1/h)
in vec2 v_texCoord;
out vec4 fragColor;

void main() {
  // 9-tap Gaussian kernel
  float weights[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);

  vec3 result = texture(u_texture, v_texCoord).rgb * weights[0];

  for (int i = 1; i < 5; i++) {
    vec2 offset = u_direction * float(i);
    result += texture(u_texture, v_texCoord + offset).rgb * weights[i];
    result += texture(u_texture, v_texCoord - offset).rgb * weights[i];
  }

  fragColor = vec4(result, 1.0);
}
```

## Step 4: Glass Composite Fragment Shader (The Core)

This is the main liquid glass GLSL shader with all the math.

```glsl
// shaders/fs_glass.glsl
#version 300 es
precision highp float;

uniform sampler2D u_texture;        // blurred background
uniform vec2 u_resolution;
uniform vec2 u_panelPos;            // panel position (pixels)
uniform vec2 u_panelSize;           // panel size (pixels)
uniform float u_borderRadius;
uniform float u_ior;                // index of refraction (1.5)
uniform float u_bevelWidth;         // bevel width in pixels
uniform float u_time;

in vec2 v_texCoord;
out vec4 fragColor;

// Anti-aliased rounded rectangle SDF
float sdRoundedRect(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// Bevel height from SDF distance
float bevelHeight(float d, float zR) {
  // Pill-bevel profile: sqrt(d * (2*zR - d))
  return sqrt(d * (2.0 * zR - d));
}

void main() {
  vec2 fragCoord = v_texCoord * u_resolution;

  // Panel-relative coordinates
  vec2 halfSize = u_panelSize * 0.5;
  vec2 center = u_panelPos + halfSize;
  vec2 p = fragCoord - center;

  // SDF distance to panel edge
  float d = sdRoundedRect(p, halfSize, u_borderRadius);

  // Panel mask (anti-aliased)
  float panelMask = 1.0 - smoothstep(-1.0, 1.0, d);

  // Bevel
  float bevelZ = u_bevelWidth;
  float h = bevelHeight(max(d, 0.0), bevelZ);
  float zSurface = bevelZ - h;

  // Bevel normal (gradient of height field)
  float eps = 1.0;
  float dx = bevelHeight(max(d + eps, 0.0), bevelZ) -
             bevelHeight(max(d - eps, 0.0), bevelZ);
  float dy = bevelHeight(max(d + eps, 0.0), bevelZ) -
             bevelHeight(max(d - eps, 0.0), bevelZ);
  vec3 normal = normalize(vec3(dx, dy, eps * 2.0));

  // View direction (orthographic approximation)
  vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));

  // Refraction with chromatic aberration
  float refrR = 1.0 / u_ior;
  float refrG = 1.0 / (u_ior + 0.02);
  float refrB = 1.0 / (u_ior + 0.04);

  vec2 refractOffsetR = refract(viewDir, normal, refrR).xy;
  vec2 refractOffsetG = refract(viewDir, normal, refrG).xy;
  vec2 refractOffsetB = refract(viewDir, normal, refrB).xy;

  // Sample blurred background with refraction offsets
  vec2 uv = fragCoord / u_resolution;
  float r = texture(u_texture, uv + refractOffsetR * 0.01).r;
  float g = texture(u_texture, uv + refractOffsetG * 0.01).g;
  float b = texture(u_texture, uv + refractOffsetB * 0.01).b;

  vec3 glassColor = vec3(r, g, b);

  // Fresnel
  float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 5.0);

  // Blinn-Phong specular
  vec3 lightDir = normalize(vec3(0.5, 0.5, 1.0));
  vec3 halfVec = normalize(viewDir + lightDir);
  float specular = pow(max(dot(normal, halfVec), 0.0), 64.0);

  // Final color: refraction + Fresnel tint + specular
  vec3 tint = vec3(0.8, 0.9, 1.0); // cool blue tint
  vec3 finalColor = mix(glassColor, tint, fresnel * 0.3);
  finalColor += specular * 0.5;

  // Apply panel mask
  fragColor = vec4(finalColor, panelMask);
}
```

## Step 5: Render Pipeline

```typescript
// lib/glass-renderer.ts — render method
render(inputTexture: WebGLTexture, panel: PanelRect) {
  const gl = this.gl
  const w = gl.canvas.width
  const h = gl.canvas.height

  // Stage 1: Blit input to framebuffer A
  gl.useProgram(this.blurProgram)
  gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebufferA)
  gl.viewport(0, 0, w, h)
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, inputTexture)
  gl.uniform1i(gl.getUniformLocation(this.blurProgram, 'u_texture'), 0)
  gl.uniform2f(
    gl.getUniformLocation(this.blurProgram, 'u_direction'),
    1.0 / w, 0.0
  )
  this.drawQuad()

  // Stage 2: Blur horizontal → framebuffer B
  gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebufferB)
  gl.bindTexture(gl.TEXTURE_2D, this.textureA)
  gl.uniform2f(
    gl.getUniformLocation(this.blurProgram, 'u_direction'),
    0.0, 1.0 / h
  )
  this.drawQuad()

  // Stage 3: Glass composite → screen
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.useProgram(this.program)
  gl.bindTexture(gl.TEXTURE_2D, this.textureB)
  gl.uniform1i(gl.getUniformLocation(this.program, 'u_texture'), 0)
  gl.uniform2f(gl.getUniformLocation(this.program, 'u_resolution'), w, h)
  gl.uniform2f(gl.getUniformLocation(this.program, 'u_panelPos'), panel.x, panel.y)
  gl.uniform2f(gl.getUniformLocation(this.program, 'u_panelSize'), panel.w, panel.h)
  gl.uniform1f(gl.getUniformLocation(this.program, 'u_borderRadius'), panel.radius || 12)
  gl.uniform1f(gl.getUniformLocation(this.program, 'u_ior'), 1.5)
  gl.uniform1f(gl.getUniformLocation(this.program, 'u_bevelWidth'), 8.0)
  gl.uniform1f(gl.getUniformLocation(this.program, 'u_time'), performance.now() / 1000)
  this.drawQuad()
}
```

## Step 6: R3F Wrapper (React Three Fiber)

For React dashboards, wrap as a Three.js shaderMaterial.

```tsx
// src/components/three/LiquidGlassPanel.tsx
import { useRef } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

const LiquidGlassMaterial = shaderMaterial(
  {
    u_texture: null,
    u_resolution: new THREE.Vector2(),
    u_panelPos: new THREE.Vector2(),
    u_panelSize: new THREE.Vector2(),
    u_borderRadius: 12.0,
    u_ior: 1.5,
    u_bevelWidth: 8.0,
    u_time: 0,
  },
  VERTEX_QUAD,
  FRAGMENT_GLASS
)

extend({ LiquidGlassMaterial })

export function LiquidGlassPanel({ position, size }: { position: [number, number]; size: [number, number] }) {
  const ref = useRef<THREE.ShaderMaterial>(null)

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.uniforms.u_time.value = clock.getElapsedTime()
    }
  })

  return (
    <mesh position={[position[0], position[1], 0]}>
      <planeGeometry args={size} />
      <liquidGlassMaterial
        ref={ref}
        transparent
        side={THREE.DoubleSide}
        u_panelPos={new THREE.Vector2(...position)}
        u_panelSize={new THREE.Vector2(...size)}
      />
    </mesh>
  )
}
```

## Checklist

- [ ] Create `shaders/` directory with `vs_quad.glsl`, `fs_blur.glsl`, `fs_glass.glsl`
- [ ] Implement `LiquidGlassRenderer` class with WebGL context
- [ ] Compile all 3 shader programs (vertex, blur, glass)
- [ ] Create two framebuffers for ping-pong blur
- [ ] Implement `render()` with 3-stage pipeline
- [ ] `sdRoundedRect()` anti-aliased SDF for panel shape
- [ ] `bevelHeight()` with pill-bevel profile
- [ ] Bevel normal via SDF gradient
- [ ] Dual-surface refraction with chromatic aberration (R/G/B wavelength offsets)
- [ ] Fresnel: `pow(1 - dot(V,N), 5)`
- [ ] Blinn-Phong specular highlight
- [ ] Panel mask via SDF → smoothstep → alpha
- [ ] R3F wrapper with `shaderMaterial` if using React

## Bridge to Production

| Our Pattern | Production Equivalent |
|-------------|----------------------|
| WebGL2 + GLSL | WebGPU compute shaders |
| 9-tap Gaussian | Kawase blur (2x faster) |
| Single panel | Instanced glass panels |
| CPU SDF | GPU ray marching |
| No shadows | Soft shadow from SDF |
| Fixed IOR | Physical glass (IOR 1.52) |
| No caustics | Screen-space caustics |

---

## Source

Mined from `ybouane/liquidglass` (WebGL GLSL shaders) and `ektogamat/apple-liquid-glass` (R3F wrapper).
