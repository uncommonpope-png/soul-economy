---
name: dashboard-3d-scene
description: Use when building a 3D scene for a dashboard with Three.js. Triggers on: "3D scene", "pyramid core", "floating platform", "matrix rain", "particle field", "dashboard background", "Three.js dashboard".
metadata:
  mined-from: soul-dashboard (PyramidCore, FloatingPlatform, MatrixRain, ParticleField, CityBuilder)
  total-stars: 0
  session: 2026-06-27
---

# Dashboard 3D Scene: Three.js Background for Operator Consoles

This skill teaches how to build a full-screen Three.js 3D scene as a dashboard background, with floating geometry, animated particles, canvas rain, and instanced meshes. All patterns mined from soul-dashboard.

## Mental Model

```
┌─────────────────────────────────────────────┐
│              React Dashboard                 │
│  ┌─────────────────────────────────────────┐ │
│  │        Full-Screen Three.js Canvas      │ │
│  │  ┌───────────┐  ┌───────────────────┐   │ │
│  │  │ PyramidCore│  │ FloatingPlatform  │   │ │
│  │  │ (center)  │  │   (below)         │   │ │
│  │  └───────────┘  └───────────────────┘   │ │
│  │  ┌───────────┐  ┌───────────────────┐   │ │
│  │  │MatrixRain │  │  ParticleField    │   │ │
│  │  │(canvas)   │  │  (2000 points)    │   │ │
│  │  └───────────┘  └───────────────────┘   │ │
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │     HTML Panels (glass, overlay)        │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Step 1: Setup Three.js + R3F

```bash
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing
```

```tsx
// src/components/three/SceneCanvas.tsx
import { Canvas } from '@react-three/fiber'
import { PyramidCore } from './PyramidCore'
import { FloatingPlatform } from './FloatingPlatform'
import { MatrixRain } from './MatrixRain'
import { ParticleField } from './ParticleField'

export function SceneCanvas() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 3, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.2} />
        <PyramidCore />
        <FloatingPlatform />
        <MatrixRain />
        <ParticleField />
      </Canvas>
    </div>
  )
}
```

## Step 2: PyramidCore — Double Pyramid with Beam

The centerpiece: two cones (top + bottom) forming a diamond, with a vertical beam and orbiting particles.

```tsx
// src/components/three/PyramidCore.tsx
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function PyramidCore() {
  const groupRef = useRef<THREE.Group>(null)
  const particlesRef = useRef<THREE.Points>(null)

  // 30 orbiting particles
  const particleData = useMemo(() => {
    const count = 30
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const plasmaCyan = new THREE.Color('oklch(0.82 0.16 235)')
    const plasmaMagenta = new THREE.Color('oklch(0.65 0.28 330)')
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const radius = 1.2 + Math.random() * 0.3
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2
      positions[i * 3 + 2] = Math.sin(angle) * radius
      const c = i % 2 === 0 ? plasmaCyan : plasmaMagenta
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b
    }
    return { positions, colors, count }
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.3
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 0.5
    }
  })

  return (
    <group ref={groupRef} position={[0, 1.5, 0]}>
      {/* Top pyramid */}
      <mesh>
        <coneGeometry args={[0.8, 1.5, 4]} />
        <meshStandardMaterial
          color="#00f5ff"
          emissive="#00f5ff"
          emissiveIntensity={0.5}
          wireframe
        />
      </mesh>
      {/* Bottom pyramid (inverted) */}
      <mesh rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.8, 1.5, 4]} />
        <meshStandardMaterial
          color="#00f5ff"
          emissive="#00f5ff"
          emissiveIntensity={0.5}
          wireframe
        />
      </mesh>
      {/* Vertical beam */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 4, 8]} />
        <meshBasicMaterial color="#00f5ff" transparent opacity={0.6} />
      </mesh>
      {/* Glow discs */}
      {[0.5, 0, -0.5].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.35, 32]} />
          <meshBasicMaterial
            color="#00f5ff"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      {/* Orbiting particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleData.count}
            array={particleData.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={particleData.count}
            array={particleData.colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  )
}
```

## Step 3: FloatingPlatform — Radial Grid with Radar Sweep

Rings + spokes + nodes forming a radial platform below the pyramid, with a rotating radar arc.

```tsx
// src/components/three/FloatingPlatform.tsx
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function FloatingPlatform() {
  const radarRef = useRef<THREE.Mesh>(null)

  // Ring geometry from soul-dashboard: 16 rings, 24 spokes
  const ringData = useMemo(() => {
    const rings: { radius: number; opacity: number }[] = []
    for (let i = 0; i < 16; i++) {
      const radius = 2.5 - i * 0.25
      rings.push({ radius, opacity: 0.1 + (i / 16) * 0.3 })
    }
    return rings
  }, [])

  const spokeData = useMemo(() => {
    const spokes: { angle: number }[] = []
    for (let i = 0; i < 24; i++) {
      spokes.push({ angle: (i / 24) * Math.PI * 2 })
    }
    return spokes
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (radarRef.current) {
      radarRef.current.rotation.z = t * 0.8
    }
  })

  return (
    <group position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Concentric rings */}
      {ringData.map((ring, i) => (
        <mesh key={`ring-${i}`}>
          <ringGeometry args={[ring.radius - 0.01, ring.radius, 64]} />
          <meshBasicMaterial
            color="#00f5ff"
            transparent
            opacity={ring.opacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      {/* Radial spokes */}
      {spokeData.map((spoke, i) => (
        <mesh key={`spoke-${i}`} rotation={[0, 0, spoke.angle]}>
          <planeGeometry args={[0.01, 5]} />
          <meshBasicMaterial
            color="#00f5ff"
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      {/* Radar arc sweep */}
      <mesh ref={radarRef}>
        <ringGeometry args={[0, 2.5, 64, 1, 0, Math.PI / 3]} />
        <meshBasicMaterial
          color="#00f5ff"
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
```

## Step 4: MatrixRain — Canvas-Based Katakana Rain

Canvas texture projected onto a plane, with katakana characters falling in columns.

```tsx
// src/components/three/MatrixRain.tsx
import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const KATAKANA = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'
const COLS = 20
const ROWS = 14
const FONT_SIZE = 2

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const textureRef = useRef<THREE.CanvasTexture | null>(null)

  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    canvasRef.current = canvas

    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
    ctx.fillRect(0, 0, 256, 256)
    ctx.font = `${FONT_SIZE}px monospace`
    ctx.fillStyle = '#00f5ff'

    // Initial characters
    for (let col = 0; col < COLS; col++) {
      const char = KATAKANA[Math.floor(Math.random() * KATAKANA.length)]
      const x = (col / COLS) * 256
      const y = Math.floor(Math.random() * ROWS) * FONT_SIZE * 2
      ctx.fillText(char, x, y)
    }

    textureRef.current = new THREE.CanvasTexture(canvas)
    textureRef.current.needsUpdate = true

    // Animation loop
    let animId: number
    const animate = () => {
      // Fade trail
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, 256, 256)

      // Draw new characters
      for (let col = 0; col < COLS; col++) {
        if (Math.random() > 0.4) continue
        const char = KATAKANA[Math.floor(Math.random() * KATAKANA.length)]
        const x = (col / COLS) * 256
        const y = (Date.now() / 50 + col * 37) % (ROWS * FONT_SIZE * 2)
        const brightness = 0.3 + Math.random() * 0.7
        ctx.fillStyle = `rgba(0, 245, 255, ${brightness})`
        ctx.fillText(char, x, y)
      }

      if (textureRef.current) {
        textureRef.current.needsUpdate = true
      }
      animId = requestAnimationFrame(animate)
    }
    animate()

    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <mesh position={[0, 3, -3]} rotation={[0, 0, 0]}>
      <planeGeometry args={[6, 4]} />
      <meshBasicMaterial
        map={textureRef.current}
        transparent
        opacity={0.15}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}
```

## Step 5: ParticleField — 2000 Colored Points

Random particles with additive blending, drifting slowly upward.

```tsx
// src/components/three/ParticleField.tsx
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function ParticleField() {
  const ref = useRef<THREE.Points>(null)

  const { positions, colors } = useMemo(() => {
    const count = 2000
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const palette = [
      new THREE.Color('oklch(0.82 0.16 235)'), // cyan
      new THREE.Color('oklch(0.65 0.28 330)'), // magenta
      new THREE.Color('oklch(0.85 0.18 85)'),  // gold
    ]
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20
      const c = palette[Math.floor(Math.random() * palette.length)]
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b
    }
    return { positions: pos, colors: col }
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    const posAttr = ref.current.geometry.attributes.position
    const arr = posAttr.array as Float32Array
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] += 0.002 // slow drift up
      if (arr[i + 1] > 10) arr[i + 1] = -10
    }
    posAttr.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={2000} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={2000} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
```

## Step 6: Wire into Dashboard Layout

```tsx
// src/App.tsx
import { SceneCanvas } from './components/three/SceneCanvas'
import { Topbar } from './components/Topbar'
import { Sidebar } from './components/Sidebar'
// ... other panel imports

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#050510' }}>
      <SceneCanvas />       {/* 3D scene as background */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Topbar />
        <Sidebar />
        {/* Dashboard panels overlay the 3D scene */}
      </div>
    </div>
  )
}
```

## Checklist

- [ ] `npm install three @react-three/fiber @react-three/drei`
- [ ] Create `SceneCanvas.tsx` — full-screen Canvas with camera position [0, 3, 8]
- [ ] Create `PyramidCore.tsx` — double cone + beam + glow discs + 30 particles
- [ ] Create `FloatingPlatform.tsx` — 16 rings + 24 spokes + radar arc sweep
- [ ] Create `MatrixRain.tsx` — canvas 256x256, katakana, fade trail, needsUpdate
- [ ] Create `ParticleField.tsx` — 2000 points, additive blending, drift animation
- [ ] Wire `SceneCanvas` into `App.tsx` as fixed background (z-index: 0)
- [ ] Panels render at z-index: 1 above the 3D scene
- [ ] Verify frame rate stays above 30fps

## Bridge to Production

| Our Pattern | Production Equivalent |
|-------------|----------------------|
| R3F Canvas | Three.js scene manager |
| bufferGeometry particles | InstancedMesh for millions |
| Canvas texture rain | ShaderMaterial GPU rain |
| Basic materials | PBR + environment maps |
| No post-processing | N8AO + Bloom + ChromaticAb |
| oklch colors | Design system tokens |

---

## Source

Mined from `soul-dashboard/src/components/three/` — PyramidCore.tsx, FloatingPlatform.tsx, MatrixRain.tsx, ParticleField.tsx.
