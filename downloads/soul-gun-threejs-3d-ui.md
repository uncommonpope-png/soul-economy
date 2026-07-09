---
name: threejs-3d-ui
description: 3D UI components for React Three Fiber
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
---# Three.js 3D UI Mechanics

## Origin
Researched from: @react-three/fiber, @react-three/drei, @react-spring/three, framer-motion-3d, and production R3F applications.

## Stack
| Layer | Library | Purpose |
|-------|---------|---------|
| Core | @react-three/fiber | Canvas, events, useFrame, useThree |
| Helpers | @react-three/drei | Html, Select, DragControls, PivotControls, Bounds, CameraControls |
| Animation | @react-spring/three | Spring-physics for buttons, toggles, camera |
| State | zustand | Cross-renderer interaction state |

---

## 1. R3F Event System

Every mesh with `raycast()` receives DOM-like events:

### Event Handlers
```tsx
<mesh
  onClick={(e) => {}}           // Click
  onDoubleClick={(e) => {}}     // Double click
  onContextMenu={(e) => {}}     // Right click
  onPointerDown={(e) => {}}     // Press
  onPointerUp={(e) => {}}       // Release
  onPointerMove={(e) => {}}     // Hover move
  onPointerOver={(e) => {}}     // Enter bounds
  onPointerOut={(e) => {}}      // Leave bounds
  onPointerEnter={(e) => {}}    // Enter (no bubble)
  onPointerLeave={(e) => {}}    // Leave (no bubble)
  onPointerMissed={(e) => {}}   // Click missed all objects
  onWheel={(e) => {}}           // Scroll
>
```

### Event Object
```tsx
onClick={(e) => {
  e.stopPropagation()
  e.point        // World-space intersection (Vector3)
  e.distance     // Distance from camera
  e.face         // Intersected face
  e.uv           // UV at intersection
  e.normal       // Face normal
  e.object       // The hit mesh
  e.intersections // All sorted hits
  e.nativeEvent  // Original DOM event
  e.delta        // Distance from pointerDown (drag detection)
}}
```

### Drag-vs-Click Detection
```tsx
const pointerDownPos = useRef({ x: 0, y: 0 })

<mesh
  onPointerDown={(e) => {
    pointerDownPos.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY }
  }}
  onPointerUp={(e) => {
    const dx = e.nativeEvent.clientX - pointerDownPos.current.x
    const dy = e.nativeEvent.clientY - pointerDownPos.current.y
    if (Math.sqrt(dx*dx + dy*dy) < 5) handleClick(e)
  }}
/>
```

### Hover State Hook
```tsx
function useHover() {
  const [hovered, setHovered] = useState(false)
  return [
    hovered,
    {
      onPointerOver: (e: any) => (e.stopPropagation(), setHovered(true)),
      onPointerOut: () => setHovered(false),
    }
  ] as const
}
```

### InstancedMesh Events
Use drei's `<Instances>` / `<Instance>` for clicks on instanced objects:
```tsx
<Instances limit={500}>
  <boxGeometry args={[1, 1, 1]} />
  <meshStandardMaterial />
  {items.map(item => (
    <Instance
      key={item.id}
      position={item.pos}
      onClick={() => handleClick(item.id)}
    />
  ))}
</Instances>
```

---

## 2. HTML Overlay in 3D (`<Html>`)

### Basic Tooltip
```tsx
import { Html } from '@react-three/drei'

<Html
  position={[0, 2, 0]}
  distanceFactor={0.5}
  center
  sprite          // Always faces camera
  occlude         // Hide behind geometry
  onOcclude={(hidden) => setHidden(hidden)}
  wrapperClass="tooltip-wrapper"
>
  <div className="tooltip">Hello 3D!</div>
</Html>
```

### Animated Occlusion Label
```tsx
function Label({ position, text }) {
  const [hidden, setHidden] = useState(false)
  return (
    <Html occlude onOcclude={setHidden} position={position} distanceFactor={0.25}>
      <div style={{
        opacity: hidden ? 0 : 1,
        transform: `scale(${hidden ? 0.8 : 1})`,
        transition: 'opacity 0.3s, transform 0.3s',
        pointerEvents: 'none',
      }}>
        {text}
      </div>
    </Html>
  )
}
```

### OrbitControls Compatibility
HTML blocks OrbitControls when cursor is over it.
```tsx
const usingOrbitControls = useRef(false)

<OrbitControls
  onStart={() => { usingOrbitControls.current = true }}
  onEnd={() => { usingOrbitControls.current = false }}
/>
<Html style={{ pointerEvents: usingOrbitControls.current ? 'none' : 'auto' }} />
```

---

## 3. Spring-Animated 3D Buttons

### Push Button with @react-spring/three
```tsx
import { useSpring, animated } from '@react-spring/three'

function PushButton({ onClick, children }) {
  const [active, setActive] = useState(false)
  const [hovered, setHovered] = useState(false)

  const { scale, position } = useSpring({
    scale: active ? 0.9 : hovered ? 1.1 : 1,
    position: active ? [0, -0.15, 0] : [0, 0, 0],
    config: { mass: 1, tension: 300, friction: 20 },
  })

  return (
    <animated.mesh
      scale={scale}
      position={position}
      onPointerDown={() => setActive(true)}
      onPointerUp={() => { setActive(false); onClick?.() }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => { setHovered(false); setActive(false) }}
    >
      <boxGeometry args={[2, 0.5, 1]} />
      <animated.meshStandardMaterial
        color={hovered ? '#ff6d6d' : '#4488ff'}
        emissive={hovered ? '#333' : '#000'}
      />
    </animated.mesh>
  )
}
```

### Glow-on-Hover Button
```tsx
function GlowButton({ onClick }) {
  const [hovered, setHovered] = useState(false)
  const { glowIntensity, scale } = useSpring({
    glowIntensity: hovered ? 1.5 : 0.2,
    scale: hovered ? 1.05 : 1,
    config: { tension: 200, friction: 15 },
  })

  return (
    <animated.mesh scale={scale} onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <roundedBoxGeometry args={[2, 0.6, 1]} />
      <animated.meshStandardMaterial
        color="#222" emissive="#00aaff" emissiveIntensity={glowIntensity}
        metalness={0.3} roughness={0.4}
      />
    </animated.mesh>
  )
}
```

### Toggle Switch
```tsx
function ToggleSwitch({ value, onChange }) {
  const [hovered, setHovered] = useState(false)
  const { z, color } = useSpring({
    z: value ? 0.3 : -0.3,
    color: value ? '#00ff88' : '#ff4466',
    config: { mass: 0.5, tension: 400 },
  })

  return (
    <group onClick={() => onChange?.(!value)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[1.2, 0.15, 0.6]} />
        <meshStandardMaterial color="#333" metalness={0.5} roughness={0.3} />
      </mesh>
      <animated.mesh position-z={z}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <animated.meshStandardMaterial color={color}
          emissive={color} emissiveIntensity={hovered ? 0.5 : 0.2}
        />
      </animated.mesh>
    </group>
  )
}
```

---

## 4. Context Menus for 3D

### Right-Click on Mesh
```tsx
<div onContextMenu={(e) => e.preventDefault()}>
  <Canvas>
    <mesh onContextMenu={(e) => {
      e.nativeEvent.preventDefault()
      e.stopPropagation()
      setMenu({
        x: e.nativeEvent.clientX,
        y: e.nativeEvent.clientY,
        object: e.object,
      })
    }}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  </Canvas>
</div>
```

### Context Menu Component
```tsx
function ContextMenu({ menu, onClose, items }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('pointerdown', handle)
    return () => document.removeEventListener('pointerdown', handle)
  }, [])

  if (!menu) return null
  return (
    <div ref={ref} style={{
      position: 'fixed', left: menu.x, top: menu.y, zIndex: 1000,
      background: '#1a1a2e', border: '1px solid rgba(0,212,255,0.3)',
      borderRadius: 8, padding: 4, minWidth: 160, backdropFilter: 'blur(12px)',
    }}>
      {items.map(item => (
        <div key={item.label} onClick={() => { item.onClick(); onClose() }}
          style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 4,
            color: '#ccc', fontSize: 14 }}
          onPointerOver={(e) => e.currentTarget.style.background = 'rgba(0,212,255,0.15)'}
          onPointerOut={(e) => e.currentTarget.style.background = 'transparent'}
        >{item.label}</div>
      ))}
    </div>
  )
}
```

---

## 5. Camera Controls

### Animated Camera Focus (Spring)
```tsx
function CameraFocus({ targetPos, targetLookAt, active }) {
  const { camera } = useThree()
  const { posX, posY, posZ } = useSpring({
    posX: active ? targetPos[0] : 0,
    posY: active ? targetPos[1] : 5,
    posZ: active ? targetPos[2] : 10,
    config: { mass: 1, tension: 80, friction: 30 },
    onChange: ({ value }) => {
      camera.position.set(value.posX, value.posY, value.posZ)
      camera.lookAt(targetLookAt || [0, 0, 0])
    },
  })
}
```

### Damped Camera Rig (60fps)
```tsx
function CameraRig({ focusPoint }) {
  const { camera } = useThree()
  const target = useRef(new THREE.Vector3(0, 5, 10))
  const current = useRef(new THREE.Vector3(0, 5, 10))

  useEffect(() => {
    if (focusPoint) target.current.set(focusPoint.x, focusPoint.y + 3, focusPoint.z + 5)
  }, [focusPoint])

  useFrame((_, delta) => {
    current.current.lerp(target.current, 1 - Math.exp(-5 * delta))
    camera.position.copy(current.current)
    camera.lookAt(focusPoint || new THREE.Vector3(0, 0, 0))
  })
}
```

### Zoom-to-Fit via Bounds (drei)
```tsx
import { Bounds, useBounds } from '@react-three/drei'

function Scene() {
  return (
    <Bounds fit clip observe margin={1.2}>
      <MeshGroup />
    </Bounds>
  )
}
```

### Smooth Orbit with CameraControls
```tsx
import { CameraControls } from '@react-three/drei'

function AnimatedCamera() {
  const controls = useRef<CameraControls>()
  const focusOn = (pos: [number, number, number]) => {
    controls.current?.setLookAt(
      pos[0]+3, pos[1]+2, pos[2]+5, pos[0], pos[1], pos[2], true
    )
  }
  return <CameraControls ref={controls} />
}
```

---

## 6. 3D UI Architecture Patterns

### State Management (Zustand)
```tsx
const useInteractionStore = create((set) => ({
  selectedObjects: [],
  hoveredObject: null,
  contextMenu: null,
  isDragging: false,
  selectObject: (object) => set((state) => ({
    selectedObjects: state.selectedObjects.includes(object)
      ? state.selectedObjects.filter(o => o !== object)
      : [...state.selectedObjects, object]
  })),
  setContextMenu: (menu) => set({ contextMenu: menu }),
}))
```

### 60fps Path (Refs, not State)
```tsx
function AnimatedTile() {
  const ref = useRef<THREE.Mesh>()
  const scaleTarget = useRef(1)
  const currentScale = useRef(1)
  const [selected, setSelected] = useState(false)

  useFrame((_, delta) => {
    currentScale.current += (scaleTarget.current - currentScale.current) * (1 - Math.exp(-8 * delta))
    ref.current?.scale.setScalar(currentScale.current)
  })

  const handleClick = () => {
    scaleTarget.current = selected ? 1 : 1.5
    setSelected(!selected)
  }

  return <mesh ref={ref} onClick={handleClick}>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="orange" />
  </mesh>
}
```

### Exponential Damping (maath)
```tsx
import { easing } from 'maath'

useFrame((state, delta) => {
  easing.damp(ref.current.scale, 'x', target, 0.15, delta)
})
```

### Architecture Layers
```
DOM Layer (React)        — Context menus, tooltips, side panels
Scene Layer (R3F)        — Canvas, camera, lighting, OrbitControls
Interaction Layer        — useFrame loops, mutable refs for 60fps
3D UI Components         — Buttons, switches, dials, Html overlays
State Layer (Zustand)    — Selection, hover, context menu, mode
```

---

## 7. Additional 3D Controls

### Slider in 3D
```tsx
function Slider3D({ min=0, max=100, value, onChange }) {
  const trackLength = 3
  const { x } = useSpring({
    x: ((value-min)/(max-min)) * trackLength - trackLength/2,
    config: { mass: 1, tension: 200 },
  })
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[trackLength + 0.2, 0.1, 0.1]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      <animated.mesh position-x={x}
        onPointerDown={(e) => {
          e.stopPropagation()
          const startX = x.get()
          const startPx = e.nativeEvent.clientX
          const onMove = (ev) => {
            const delta = (ev.clientX - startPx) / window.innerWidth * trackLength * 2
            onChange?.(Math.round(Math.max(min, Math.min(max,
              min + ((startX + delta + trackLength/2) / trackLength) * (max-min)
            ))))
          }
          window.addEventListener('pointermove', onMove)
          window.addEventListener('pointerup', () => window.removeEventListener('pointermove', onMove), { once: true })
        }}
      >
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#5599ff" emissive="#5599ff" emissiveIntensity={0.3} />
      </animated.mesh>
    </group>
  )
}
```

### DragControls
```tsx
import { DragControls } from '@react-three/drei'

<DragControls axisLock="y" dragLimits={[[0,0],[0,5],[0,0]]}>
  <mesh><boxGeometry args={[1,1,1]} /><meshStandardMaterial color="hotpink" /></mesh>
</DragControls>
```

### Selection Box
```tsx
import { Select } from '@react-three/drei'

<Select box multiple onChange={setSelected}
  border="1px solid #55aaff" backgroundColor="rgba(75,160,255,0.1)"
>
  <SelectableItem position={[-1.2, 0, 0]} />
  <SelectableItem position={[1.2, 0, 0]} />
</Select>
```

---

## Libraries
| Library | Purpose |
|---------|---------|
| @react-three/fiber | Canvas, events, hooks |
| @react-three/drei | Html, Select, DragControls, Bounds, CameraControls |
| @react-spring/three | Spring animation for 3D |
| zustand | State management |
| maath | easing.damp() |
| three | Raycaster, Vector3, Matrix4 |
