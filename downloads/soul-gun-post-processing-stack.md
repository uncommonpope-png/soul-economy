---
name: post-processing-stack
description: Use when adding post-processing effects to a Three.js scene. Triggers on: "post-processing", "bloom", "ambient occlusion", "chromatic aberration", "scanline", "vignette", "noise overlay", "N8AO", "EffectComposer".
metadata:
  mined-from: soul-dashboard PostEffects.tsx, three.js examples, pmndrs/postprocessing
  total-stars: 10000+
  session: 2026-06-27
---

# Post-Processing Stack: N8AO + Bloom + ChromaticAberration + Noise + Scanline + Vignette

This skill teaches how to build a complete post-processing pipeline for Three.js dashboards, creating cinematic glass-cyberpunk visuals. Mined from soul-dashboard's PostEffects component.

## Mental Model

```
┌─────────────────────────────────────────────┐
│        Post-Processing Pipeline             │
│                                             │
│  3D Scene Render → N8AO (ambient occlusion) │
│       │                                     │
│       ▼                                     │
│  Bloom (mipmap blur, glow)                  │
│       │                                     │
│       ▼                                     │
│  ChromaticAberration (R/G/B split)          │
│       │                                     │
│       ▼                                     │
│  Noise (film grain overlay)                 │
│       │                                     │
│       ▼                                     │
│  Scanline (horizontal lines)                │
│       │                                     │
│       ▼                                     │
│  Vignette (dark corners)                    │
│       │                                     │
│       ▼                                     │
│  Final Output: cinematic cyberpunk frame    │
└─────────────────────────────────────────────┘
```

## Step 1: Install Dependencies

```bash
npm install three @react-three/fiber @react-three/postprocessing postprocessing
```

`@react-three/postprocessing` wraps `postprocessing` (pmndrs) for R3F.

## Step 2: Basic PostEffects Component

```tsx
// src/components/three/PostEffects.tsx
import { EffectComposer, N8AO, Bloom, ChromaticAberration, Noise, Scanline, Vignette } from '@react-three/postprocessing'
import { BlendFunction, KernelSize } from 'postprocessing'
import { Vector2 } from 'three'

export function PostEffects() {
  return (
    <EffectComposer multisampling={0}>
      {/* Ambient Occlusion — adds depth shadows in crevices */}
      <N8AO
        aoSamples={12}
        aoRadius={4}
        intensity={40}
        aoDistance={0.1}
        distanceFalloff={0.1}
        screenSpaceRadius={false}
        halfRes={false}
        color="#000000"
      />

      {/* Bloom — glow around bright objects */}
      <Bloom
        mipmapBlur
        luminanceThreshold={0.8}
        luminanceSmoothing={0.9}
        intensity={2.5}
        kernelSize={KernelSize.LARGE}
      />

      {/* Chromatic Aberration — R/G/B channel split */}
      <ChromaticAberration
        offset={new Vector2(0.004, 0.004)}
        radialModulation={true}
        modulationOffset={0.5}
        blendFunction={BlendFunction.NORMAL}
      />

      {/* Noise — film grain */}
      <Noise
        premultiply
        blendFunction={BlendFunction.ADD}
        opacity={0.5}
      />

      {/* Scanline — horizontal CRT lines */}
      <Scanline
        blendFunction={BlendFunction.OVERLAY}
        density={1.2}
        opacity={0.15}
      />

      {/* Vignette — dark corners */}
      <Vignette
        offset={0.43}
        darkness={0.7}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  )
}
```

## Step 3: Wire into Canvas

```tsx
// src/App.tsx
import { Canvas } from '@react-three/fiber'
import { PostEffects } from './three/PostEffects'

export default function App() {
  return (
    <Canvas>
      {/* Your 3D scene here */}
      <ambientLight />
      <mesh>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#00f5ff" />
      </mesh>

      {/* Post-processing goes LAST, after all 3D objects */}
      <PostEffects />
    </Canvas>
  )
}
```

## Step 4: Tuning Parameters

### N8AO (Ambient Occlusion)

```tsx
<N8AO
  aoSamples={12}        // Quality: 4=fast, 12=high, 32=ultra
  aoRadius={4}          // Spread of AO effect (world units)
  intensity={40}        // Darkness multiplier (higher = darker crevices)
  aoDistance={0.1}      // Max distance for AO
  distanceFalloff={0.1} // How fast AO fades with distance
  screenSpaceRadius={false} // false=world space, true=screen space
  halfRes={false}       // true=half resolution for performance
/>
```

### Bloom (Glow)

```tsx
<Bloom
  mipmapBlur              // Use mipmaps for smoother bloom
  luminanceThreshold={0.8} // Only bloom pixels brighter than this
  luminanceSmoothing={0.9} // Smooth transition at threshold
  intensity={2.5}         // Bloom strength
  kernelSize={KernelSize.LARGE} // SMALL, MEDIUM, LARGE, VERY_LARGE
/>
```

### Chromatic Aberration (RGB Split)

```tsx
<ChromaticAberration
  offset={new Vector2(0.004, 0.004)} // Pixel offset for R and B channels
  radialModulation={true}            // Stronger at edges
  modulationOffset={0.5}             // How much radial increase
/>
```

### Noise (Film Grain)

```tsx
<Noise
  premultiply={true}                    // Pre-multiply alpha
  blendFunction={BlendFunction.ADD}    // ADD for glow, OVERLAY for texture
  opacity={0.5}                        // Grain intensity
/>
```

### Vignette (Dark Corners)

```tsx
<Vignette
  offset={0.43}  // How far from center the darkening starts (0=edge, 1=center)
  darkness={0.7} // Intensity of darkening (0=none, 1=black)
/>
```

## Step 5: oklch Color Integration

Use oklch colors for the scene background and materials to match the cyberpunk aesthetic.

```css
/* src/index.css */
:root {
  --plasma-cyan: oklch(0.82 0.16 235);
  --plasma-magenta: oklch(0.65 0.28 330);
  --plasma-gold: oklch(0.85 0.18 85);
  --void-black: oklch(0.02 0.01 260);
  --glass-bg: oklch(1 0 0 / 0.03);
  --glass-border: oklch(1 0 0 / 0.06);
}
```

```tsx
// Apply in Canvas
<Canvas style={{ background: 'var(--void-black)' }}>
```

## Step 6: Performance Optimization

```tsx
// Conditional quality based on device
function PostEffects() {
  const isMobile = /Mobi|Android/i.test(navigator.userAgent)

  return (
    <EffectComposer multisampling={isMobile ? 0 : 4}>
      <N8AO
        aoSamples={isMobile ? 4 : 12}
        halfRes={isMobile}
        intensity={isMobile ? 20 : 40}
      />
      <Bloom
        mipmapBlur
        luminanceThreshold={0.8}
        intensity={isMobile ? 1.5 : 2.5}
      />
      {/* ... rest of effects */}
    </EffectComposer>
  )
}
```

## Checklist

- [ ] `npm install three @react-three/fiber @react-three/postprocessing postprocessing`
- [ ] Import: `EffectComposer, N8AO, Bloom, ChromaticAberration, Noise, Scanline, Vignette`
- [ ] N8AO: `aoSamples={12}`, `intensity={40}`
- [ ] Bloom: `mipmapBlur`, `luminanceThreshold={0.8}`, `intensity={2.5}`
- [ ] ChromaticAberration: `offset={new Vector2(0.004, 0.004)}`
- [ ] Noise: `opacity={0.5}`, `blendFunction={BlendFunction.ADD}`
- [ ] Scanline: `density={1.2}`, `opacity={0.15}`
- [ ] Vignette: `offset={0.43}`, `darkness={0.7}`
- [ ] PostEffects component placed AFTER all 3D objects in Canvas
- [ ] Mobile optimization: reduced samples, halfRes, lower intensity

## Bridge to Production

| Our Pattern | Production Equivalent |
|-------------|----------------------|
| N8AO | SSAO + distance-based AO |
| PostEffects composer | Custom render passes |
| Fixed parameters | Adaptive quality (device-based) |
| Single pass bloom | Multi-pass bloom (bright/medium/dim) |
| CSS scanline | GPU shader scanline |
| No motion blur | Temporal anti-aliasing (TAA) |
| No DOF | Bokeh depth of field |

---

## Source

Mined from `soul-dashboard/src/components/three/PostEffects.tsx` — N8AO + Bloom + ChromaticAberration + Noise + Scanline + Vignette stack.
