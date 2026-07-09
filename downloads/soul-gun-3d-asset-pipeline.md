---
name: 3d-asset-pipeline
description: Use when loading GLTF 3D models, HDR environment maps, or building instanced meshes in Three.js/R3F. Triggers on: "GLTF loader", "3D model", "HDR environment", "instanced mesh", "GLTF viewer", "model viewer", "Sketchfab download".
metadata:
  mined-from: three.js docs, @react-three/drei, Sketchfab, PolyHaven
  total-stars: 20000+
  session: 2026-06-27
---

# 3D Asset Pipeline: GLTF Loading, HDR Environments, Instanced Mesh

This skill teaches how to load free 3D models (glTF/GLB), set up HDR environment maps for realistic lighting, and create instanced meshes for performance-critical scenes. Covers free asset sources: Sketchfab (800K+ models), PolyHaven (HDRIs), Khronos sample assets.

## Mental Model

```
┌─────────────────────────────────────────────┐
│           3D Asset Pipeline                 │
│                                             │
│  Free Sources:                              │
│  ├─ Sketchfab (800K+ CC glTF models)       │
│  ├─ PolyHaven (free HDRIs)                  │
│  └─ Khronos glTF-Sample-Assets              │
│                                             │
│  Loading:                                   │
│  ├─ GLTFLoader → scene.graph                │
│  ├─ RGBELoader → HDR environment            │
│  ├─ DRACOLoader → compressed GLB            │
│  └─ UseFont → text geometry                 │
│                                             │
│  Rendering:                                 │
│  ├─ Environment map → PBR reflections       │
│  ├─ InstancedMesh → 10K+ same geometry      │
│  └─ MeshoptDecoder → optimized compression  │
└─────────────────────────────────────────────┘
```

## Step 1: Install Dependencies

```bash
npm install three @react-three/fiber @react-three/drei
```

## Step 2: Load a GLTF Model

```tsx
// src/components/three/ModelViewer.tsx
import { useGLTF, useTexture } from '@react-three/drei'
import { Suspense } from 'react'

// Method 1: useGLTF hook (simplest)
export function SwordModel({ url = '/assets/sword.glb' }) {
  const { scene } = useGLTF(url)

  return (
    <primitive
      object={scene}
      scale={1}
      position={[0, 0, 0]}
      rotation={[0, 0, 0]}
    />
  )
}

// Preload for faster loading
useGLTF.preload('/assets/sword.glb')
```

## Step 3: GLTFLoader with DRACO Compression

```tsx
// src/components/three/GLTFLoader.tsx
import { useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module'

export function CompressedModel({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url, (loader) => {
    // Option A: DRACO compression
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
    loader.setDRACOLoader(dracoLoader)

    // Option B: Meshopt compression (better for WebGL2)
    // loader.setMeshoptDecoder(MeshoptDecoder)
  })

  return <primitive object={gltf.scene} />
}

// Error boundary for failed loads
function ModelError({ children }: { children: React.ReactNode }) {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="red" wireframe />
    </mesh>
  )
}
```

## Step 4: HDR Environment Map

```tsx
// src/components/three/EnvironmentSetup.tsx
import { Environment, useEnvironment } from '@react-three/drei'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { useLoader } from '@react-three/fiber'

// Method 1: Environment component (simplest)
export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <Environment preset="night" />
      {/* Presets: city, dawn, forest, lobby, night, park, studio, sunset, warehouse */}
    </>
  )
}

// Method 2: Custom HDR file
export function CustomHDR() {
  const texture = useLoader(RGBELoader, '/assets/env.hdr')

  return (
    <Environment map={texture} background={false} />
  )
}

// Method 3: Procedural environment
export function ProceduralEnv() {
  return (
    <Environment resolution={256}>
      <mesh>
        <sphereGeometry args={[10, 16, 16]} />
        <meshBasicMaterial
          color="#050510"
          side={THREE.BackSide}
        />
      </mesh>
    </Environment>
  )
}
```

## Step 5: Instanced Mesh (Performance)

For rendering thousands of the same geometry (particles, buildings, debris):

```tsx
// src/components/three/InstancedCity.tsx
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function InstancedCity({ count = 500 }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const { matrices, colors } = useMemo(() => {
    const mats: THREE.Matrix4[] = []
    const cols: THREE.Color[] = []
    const dummy = new THREE.Object3D()
    const palette = [
      new THREE.Color('#00f5ff'),
      new THREE.Color('#ff00ff'),
      new THREE.Color('#00ff88'),
    ]

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 20
      const z = (Math.random() - 0.5) * 20
      const height = 0.5 + Math.random() * 3

      dummy.position.set(x, height / 2, z)
      dummy.scale.set(0.3 + Math.random() * 0.5, height, 0.3 + Math.random() * 0.5)
      dummy.updateMatrix()
      mats.push(dummy.matrix.clone())
      cols.push(palette[Math.floor(Math.random() * palette.length)])
    }

    return { matrices: mats, colors: cols }
  }, [count])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    // Subtle animation
    for (let i = 0; i < count; i++) {
      const dummy = new THREE.Object3D()
      dummy.matrix.copy(matrices[i])
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale)
      dummy.position.y += Math.sin(clock.getElapsedTime() * 0.5 + i) * 0.001
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        vertexColors
        transparent
        opacity={0.8}
        emissive="#00f5ff"
        emissiveIntensity={0.2}
      />
      <instancedBufferAttribute
        attach="instanceColor"
        args={[new Float32Array(colors.flatMap(c => [c.r, c.g, c.b])), 3]}
      />
    </instancedMesh>
  )
}
```

## Step 6: Asset Folder Structure

```
containment-observatory/
├── assets/
│   ├── models/           # glTF/GLB files
│   │   ├── sword.glb
│   │   ├── alien-artifact.glb
│   │   └── cyberpunk-debris.glb
│   ├── textures/         # PNG/JPG textures
│   │   ├── metal-normal.png
│   │   └── glow-emissive.png
│   ├── environments/     # HDR environment maps
│   │   ├── cyberpunk-studio.hdr
│   │   └── alien-void.hdr
│   └── fonts/            # 3D fonts for text
│       └── cyber.json
```

```tsx
// Loading assets
const sword = useGLTF('/assets/models/sword.glb')
const envMap = useLoader(RGBELoader, '/assets/environments/cyberpunk-studio.hdr')
const normalMap = useTexture('/assets/textures/metal-normal.png')
```

## Checklist

- [ ] `npm install three @react-three/fiber @react-three/drei`
- [ ] Create `assets/` folder with `models/`, `textures/`, `environments/`, `fonts/`
- [ ] Download free glTF models from Sketchfab (search: cyberpunk, sci-fi, sword)
- [ ] Download free HDR from PolyHaven (search: studio, night, cyberpunk)
- [ ] Use `useGLTF(url)` for simple loading with `<primitive object={scene} />`
- [ ] Use DRACO or Meshopt compression for large models
- [ ] Set up `Environment` with HDR map for PBR reflections
- [ ] Use `InstancedMesh` for 100+ identical geometries
- [ ] Preload assets with `useGLTF.preload(url)` for instant display
- [ ] Wrap model loading in Suspense with fallback mesh

## Free Asset Sources

| Source | Assets | License | URL |
|--------|--------|---------|-----|
| Sketchfab | 800K+ glTF | CC (varies) | sketchfab.com |
| PolyHaven | HDRIs, textures | CC0 | polyhaven.com |
| Khronos | Sample glTF | Apache 2.0 | github.com/KhronosGroup/glTF-Sample-Assets |
| Three.js | Built-in geometries | MIT | threejs.org |
| Meshy.ai | 8K+ cyberpunk | CC | meshy.ai |
| Hyper3D | Procedural | Free tier | hyper3d.ai |

## Bridge to Production

| Our Pattern | Production Equivalent |
|-------------|----------------------|
| useGLTF | Asset CDN + streaming |
| useTexture | Texture atlases |
| InstancedMesh | GPU instancing + LOD |
| DRACO compression | Meshopt + WebP textures |
| No LOD | Three.js LOD system |
| No occlusion | Frustum culling + occlusion queries |

---

## Source

Mined from Three.js docs, @react-three/drei, Sketchfab, PolyHaven, Khronos glTF-Sample-Assets.
