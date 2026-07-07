---
name: threejs-ecosystem
description: React Three Fiber ecosystem tools and MCP
domain: threejs
language: typescript
stars: "30000"
topics: ["threejs", "react-three-fiber", "r3f", "mcp", "3d", "webgl", "cad"]
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
---

# Three.js Ecosystem

## Origin

Mined from 10 top R3F ecosystem + native 3D repos: R3F (30k★), r3f-mcp (new), Triplex, react-three-start, THREE.Fire (14★), ForgeCAD (730★), Forgent3D (195★), Unity Graphics SRP (2.9k★), WickedEngine (7.1k★), Hunyuan3D-2 (13.9k★).

## Repos Covered

### React Three Fiber (30k★)
- **Type:** React renderer for Three.js
- **Features:** Declarative 3D, JSX scene composition, full Three.js integration
- **Ecosystem:** Drei (helpers), postprocessing, Rapier (physics), XR, Flex, CSG, A11y, GPU pathtracer
- **When to use:** Any 3D in React

### r3f-mcp (new)
- **Type:** AI agent bridge to live R3F scenes
- **Features:** Scene inspection, object manipulation, live component injection, project scaffolding
- **Tools:** scene_graph, get_object, set_transform, screenshot, generate_component, inject_code, scaffold_project
- **Knowledge base:** 22 topics (materials, lighting, animation, effects, WebGPU)
- **When to use:** AI-assisted 3D development, live scene debugging

### Triplex
- **Type:** Visual editor for R3F components
- **Features:** VS Code extension, visual editing + code sync, transform controls
- **When to use:** Visual scene composition for R3F

### react-three-start
- **Type:** Meta-framework for R3F apps
- **Features:** File-based scene graph, DOM overlay composition, CLI scaffolding
- **Command:** `npx @react-three/start create my-app`
- **When to use:** Bootstrapping R3F projects without manual wiring

### THREE.Fire (14★)
- **Type:** Volumetric fire effect for Three.js/R3F
- **Features:** Ray marching, WebGPU TSL support, configurable parameters
- **Entry points:** vanilla, react, tsl/vanilla, tsl/react
- **When to use:** Procedural fire effects in 3D scenes

### ForgeCAD (730★)
- **Type:** Code-first parametric CAD in JavaScript/TypeScript
- **Features:** Primitives, sketches, booleans, assemblies, STEP/BREP export, constraints
- **CLI:** forgecad, browser workbench, agent skills
- **When to use:** Programmatic 3D modeling in JS/TS

### Forgent3D (195★)
- **Type:** Local AI CAD companion
- **Features:** Parametric CAD via build123d, Three.js viewer, MCP tooling, rebuild loop
- **When to use:** AI-assisted CAD design with local preview

### Unity Graphics SRP (2.9k★)
- **Type:** Scriptable Render Pipeline — Unity's production rendering stack
- **Features:** URP (Universal), HDRP (High Definition), Shader Graph, VFX Graph, Post-processing
- **Architecture:** C# (82.9%), HLSL (12.7%), ShaderLab (4.3%)
- **Scale:** 30k+ commits, mirrored from private Unity repo
- **When to use:** Game dev with Unity, custom render pipelines, production VFX

### WickedEngine (7.1k★)
- **Type:** Standalone C++ 3D engine with modern graphics
- **Features:** DX12/Vulkan/Metal, raytracing, global illumination, PBR, ECS, LUA scripting, 3D editor
- **Platforms:** Windows, Linux, Mac, iOS, Xbox Series X|S, PlayStation 5
- **Model import:** OBJ, FBX, GLTF/GLB, VRM, VRMA, PLY
- **Actively maintained:** v0.72.66 (Jun 2, 2026)
- **When to use:** Native 3D apps, game engine research, cross-platform rendering

### Hunyuan3D-2 (13.9k★)
- **Type:** AI 3D asset generation — image-to-shape-to-texture
- **Features:** Flow-based diffusion transformer, two-stage pipeline (shape → texture), Blender addon, Gradio app, API server
- **Models:** Hunyuan3D-DiT (shape), Hunyuan3D-Paint (texture), Turbo/Fast/Mini variants
- **VRAM:** 6GB for shape, 16GB for shape+texture
- **Performance:** #1 on CMMD/FID/CLIP-score — beats all open-source and closed-source baselines
- **When to use:** AI-generated 3D assets, texturing handcrafted meshes, prototyping

## Key Patterns

### R3F Development with AI
```
r3f-mcp: AI agent ↔ WebSocket ↔ Live R3F scene
  ├── inspect (scene_graph, get_object)
  ├── modify (set_transform, set_material, add_object)
  ├── generate (generate_component, inject_code)
  └── scaffold (scaffold_project)
```

### CAD-in-Browser Approaches
| Approach | Tool | Language |
|----------|------|----------|
| Code-first parametric | ForgeCAD | JavaScript/TypeScript |
| Python backend + web viewer | Forgent3D | Python + TypeScript |
| Visual editor | Triplex | TypeScript/R3F |
| AI-driven | r3f-mcp | TypeScript |

### Native 3D Engine Stack
```
Web (R3F)                              Native (WickedEngine)
  ├── Three.js (declarative)                ├── DX12/Vulkan/Metal
  ├── MCP bridge (r3f-mcp)                  ├── Raytracing + GI
  ├── Browser-only                           ├── Full ECS + LUA
  └── Quick iteration                        └── Console/Desktop native
                  │
                  ▼
         AI 3D Gen Pipeline
  Image → Hunyuan3D-DiT → Shape → Hunyuan3D-Paint → Textured Mesh
         (diffusion transformer)          (texture synthesis)
```

### AI 3D Asset Pipeline (Hunyuan3D-2)
```
Input: Single image (or text prompt)
   ↓
[Stage 1] Hunyuan3D-DiT — Flow-based diffusion transformer → Untextured mesh (trimesh)
   ↓
[Stage 2] Hunyuan3D-Paint — Texture synthesis with geometric/diffusion priors → Full textured asset
   ↓
Output: GLB/OBJ → Import into Unity, WickedEngine, R3F, or Blender
```

### When to Use What
| Need | Tool |
|------|------|
| Web 3D in React | R3F |
| Native game engine | WickedEngine |
| Unity development | Unity Graphics SRP |
| AI generate 3D from image | Hunyuan3D-2 |
| Code-first parametric CAD | ForgeCAD |
| AI-assisted CAD | Forgent3D |
| Visual 3D scene editing | Triplex |
| AI-assisted R3F dev | r3f-mcp |
