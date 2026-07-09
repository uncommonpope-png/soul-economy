---
name: threejs-grid-city
description: Grid-based city building system for Three.js
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
---# Three.js Grid-City System

## Origin
Researched from: unmask-the-city, InfiniteCityThreeJS, NeonVerse, threejs-sims-house-builder, @interverse/three-terrain-lod, and production Three.js city generators.

---

## 1. Grid Texture Generation

### Canvas API Procedural Grid
```ts
function createGridCanvas(params: {
    size: number,          // Canvas size in px
    repeat: number,        // Cells per axis
    gap: number,           // Gap between cells
    radius: number,        // Cell corner radius
    color1: string,        // Cell color
    color2: string,        // Alternate cell color
    glowColor: string,     // Grid line glow
}): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = canvas.height = size
    ctx.fillStyle = '#050508'
    ctx.fillRect(0, 0, size, size)

    const margin = 10
    const cellSize = (size - 2 * margin - (repeat - 1) * gap) / repeat

    for (let i = 0; i < repeat; i++) {
        for (let j = 0; j < repeat; j++) {
            const x = margin + i * (cellSize + gap)
            const y = margin + j * (cellSize + gap)
            ctx.fillStyle = (i + j) % 2 === 0 ? color1 : color2
            ctx.beginPath()
            ctx.roundRect(x, y, cellSize, cellSize, radius)
            ctx.fill()

            if (glowColor) {
                ctx.shadowColor = glowColor
                ctx.shadowBlur = 4
                ctx.strokeStyle = glowColor
                ctx.lineWidth = 0.5
                ctx.stroke()
                ctx.shadowBlur = 0
            }
        }
    }
    return canvas
}
```

### Circular Grid (Radial)
```ts
function createRadialGridCanvas(params: {
    size: number, rings: number, spokes: number,
    ringColor: string, spokeColor: string,
    glowColor: string
}): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = canvas.height = size
    const cx = size / 2, cy = size / 2, maxR = size / 2 - 10

    ctx.strokeStyle = ringColor
    ctx.lineWidth = 0.5
    for (let r = 1; r <= params.rings; r++) {
        const radius = (r / params.rings) * maxR
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.stroke()
    }

    ctx.strokeStyle = spokeColor
    for (let s = 0; s < params.spokes; s++) {
        const angle = (s / params.spokes) * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR)
        ctx.stroke()
    }
    return canvas
}
```

### Shader-Based Grid Overlay
For animated grid lines with glow:
```glsl
uniform float uTime;
uniform float uGridScale;
uniform vec3 uGridColor;
uniform float uGridWidth;

vec2 gridUv = vUv * uGridScale;
vec2 gridLine = abs(fract(gridUv) - 0.5);
float grid = 1.0 - step(uGridWidth, max(gridLine.x, gridLine.y));
float pulse = sin(uTime * 0.5 + gridUv.x * 10.0) * 0.5 + 0.5;
diffuseColor.rgb = mix(diffuseColor.rgb, uGridColor, grid * (0.7 + pulse * 0.3));
```

---

## 2. LOD Chunking for Large Grids

### Chunk Manager Pattern
```tsx
function GridChunk({ x, z, size, lodLevel }: {
    x: number; z: number; size: number; lodLevel: number
}) {
    const segments = lodLevel === 0 ? 32 : lodLevel === 1 ? 16 : 8
    return (
        <mesh position={[x * size, 0, z * size]} frustumCulled>
            <planeGeometry args={[size, size, segments, segments]} />
            <gridMaterial />
        </mesh>
    )
}

function useChunkManager(cameraPos: THREE.Vector3, worldSize: number) {
    return useMemo(() => {
        const chunks = []
        const viewRadius = 5
        for (let x = -viewRadius; x <= viewRadius; x++)
            for (let z = -viewRadius; z <= viewRadius; z++) {
                const dist = Math.sqrt(x*x + z*z)
                const lod = dist < 2 ? 0 : dist < 4 ? 1 : 2
                chunks.push({ x, z, lod })
            }
        return chunks
    }, [cameraPos.x, cameraPos.z])
}
```

### LOD Principles
- **Chunked grid**: Divide world into N×N tiles, each a PlaneGeometry
- **Distance-based subdivision**: Camera distance determines segment count
- **Edge skirts**: Overlap at LOD boundaries to hide seams
- **LOD hysteresis**: Don't swap every frame — add tolerance

---

## 3. Procedural Building Generation

### City Layout Algorithm
```tsx
interface Building {
    x: number; z: number;
    width: number; height: number; depth: number;
    color: string; type: 'tower' | 'block' | 'stepped';
}

function generateCity(citySize: number, spacing: number): Building[] {
    const buildings: Building[] = []
    for (let x = -citySize/2; x < citySize/2; x += spacing)
        for (let z = -citySize/2; z < citySize/2; z += spacing) {
            if (Math.random() < 0.7) {
                const dist = Math.sqrt(x*x + z*z)
                const heightMult = 1 + (1 - dist / citySize) * 2  // Taller in center
                const height = (5 + Math.random() * 20) * heightMult
                buildings.push({
                    x, z,
                    width: 2 + Math.random() * 3,
                    height,
                    depth: 2 + Math.random() * 3,
                    color: getColorByHeight(height),
                    type: height > 15 ? 'tower' : 'block',
                })
            }
        }
    return buildings
}
```

### Building Variety
- **Box extrusions**: Vary width/height/depth
- **L-shapes**: Combine two boxes for corner buildings
- **Stepped towers**: Stack progressively smaller boxes
- **Roof styles**: Flat, peaked (ConeGeometry), domed (SphereGeometry)

### Districts
| District | Height | Density | Color |
|----------|--------|---------|-------|
| Core/Downtown | Tall (15-30) | High | Cyan emissive |
| Commercial | Medium (8-15) | Medium | Blue |
| Residential | Short (3-8) | Low | Green/Teal |

---

## 4. Instanced Rendering (Performance)

### Drei `Instances` (Declarative)
```tsx
import { Instances, Instance } from '@react-three/drei'

function BuildingCluster({ buildings }: { buildings: Building[] }) {
    return (
        <Instances limit={10000}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial />
            {buildings.map((b, i) => (
                <Instance
                    key={i}
                    position={[b.x, b.height/2, b.z]}
                    scale={[b.width, b.height, b.depth]}
                    color={b.color}
                />
            ))}
        </Instances>
    )
}
```

### Multiple Geometry Types
```tsx
const [TowerInstances, Tower] = createInstances()
const [BlockInstances, Block] = createInstances()

function City() {
    return (
        <TowerInstances limit={500}>
            <cylinderGeometry args={[1, 1.5, 1, 8]} />
            <meshStandardMaterial />
            <BlockInstances limit={2000}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial />
            </BlockInstances>
        </TowerInstances>
    )
}
```

### Performance Hierarchy
1. **Merged geometry** (single draw call, static) — fixed city blocks
2. **InstancedMesh** (one draw call per geometry type) — shared geometry
3. **BatchedMesh** (one draw call, multiple geometries, one material)
4. **Individual meshes** — only for unique buildings

---

## 5. Grid Cell Interaction

### Clickable Grid Cells
```tsx
function GridCell({ cell, spacing, onClick, onContextMenu }: {
    cell: { id: string; x: number; z: number; building?: any };
    spacing: number;
    onClick: (id: string) => void;
    onContextMenu: (id: string, e: any) => void;
}) {
    const [hovered, setHovered] = useState(false)

    return (
        <mesh
            position={[cell.x * spacing, 0.01, cell.z * spacing]}
            onClick={(e) => { e.stopPropagation(); onClick(cell.id) }}
            onContextMenu={(e) => { e.nativeEvent.preventDefault(); onContextMenu(cell.id, e) }}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            <planeGeometry args={[spacing - 0.1, spacing - 0.1]} />
            <meshBasicMaterial
                color={hovered ? '#00d4ff' : '#ffffff'}
                transparent opacity={hovered ? 0.3 : 0.02}
                depthWrite={false}
            />
        </mesh>
    )
}
```

### Grid State Store (Zustand)
```tsx
interface GridCellState {
    id: string
    position: [number, number]
    buildingType: 'residential' | 'commercial' | 'core' | null
    buildingData: { height: number; color: string } | null
    label: string | null
    selected: boolean
    hovered: boolean
}

interface GridStore {
    cells: Map<string, GridCellState>
    selectedCell: string | null
    placeBuilding: (cellId: string, type: string, data: any) => void
    removeBuilding: (cellId: string) => void
    setLabel: (cellId: string, label: string) => void
    setSelected: (cellId: string | null) => void
}
```

---

## 6. Premium Visual Effects

### Neon Building Glow (Emissive)
```tsx
<meshStandardMaterial
    color="#0a1628"
    emissive={getEmissiveColor(type)}
    emissiveIntensity={0.5}
    metalness={0.3}
    roughness={0.4}
/>
```

### Holographic Building Projection Shader
```glsl
// Fresnel glow
float fresnel = pow(1.0 - abs(dot(vNormal, viewDirection)), 2.0);
gl_FragColor = mix(baseColor, glowColor, fresnel * pulse);

// Holographic scan line
float scanLine = sin(vUv.y * 100.0 + uTime * 5.0) * 0.5 + 0.5;
gl_FragColor.a *= 0.6 + scanLine * 0.4;
```

### Dynamic Theme Swapping
```tsx
const themes = {
    cyberpunk: { gridColor: '#00ffff', buildingEmission: '#ff00ff', bloom: 2.5 },
    neon: { gridColor: '#ff00ff', buildingEmission: '#00ffff', bloom: 1.8 },
    mars: { gridColor: '#ff6600', buildingEmission: '#ff4400', bloom: 1.2 },
}
```

---

## 7. Architecture

```
GridState (Zustand)
    ├── GridChunkManager (LOD, frustum)
    │   └── GridChunk[]
    │       ├── GridMesh (CanvasTexture or shader)
    │       └── BuildingCluster (InstancedMesh)
    │
    ├── InteractionSystem
    │   ├── PointerEvents (R3F or raycaster)
    │   └── ContextMenu (HTML overlay)
    │
    └── PostProcessing
        ├── Bloom (multi-layer)
        ├── ChromaticAberration
        └── Custom ShaderPass
```

---

## Libraries
| Library | Purpose |
|---------|---------|
| three | Core, geometries, materials |
| @react-three/fiber | R3F Canvas, events |
| @react-three/drei | Instances, Html, shaderMaterial |
| zustand | State management |
| postprocessing | Bloom, CA effects |
