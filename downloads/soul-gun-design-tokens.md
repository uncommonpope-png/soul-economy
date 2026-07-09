---
name: design-tokens
description: Design token systems and color generators
domain: design
language: typescript
stars: "2000"
topics: ["design-tokens", "color", "typography", "design-systems", "figma-tokens", "css-variables"]
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

# Design Tokens

## Origin

Mined from 7 top repos: Primer (GitHub), Candor, pre-design-md, VibeKit, Web Style Extractor, OpenFlowKit (583★), OpenGenerativeUI (1.3k★).

## Repos Covered

### Primer (GitHub)
- **Type:** GitHub's official design system
- **Features:** Design tokens (color, spacing, typography), Octicons, Primer React components
- **When to use:** GitHub-style design, open-source design token reference

### Candor
- **Type:** Humanist design system
- **Features:** OKLCH colors (5 families × 10 steps), variable-font typography (Roboto Flex), WCAG 2.1 AA baked in
- **Design philosophy:** Perceptually uniform, human-vision-first
- **When to use:** Accessible, human-centered design systems

### pre-design-md
- **Type:** Visual design token decision tool
- **Features:** 5 steps (typography → spacing → radius → shadow → color), exports as DESIGN.md, AI prompt, CSS, Figma tokens
- **Output:** Google DESIGN.md format, Rich Prompt (with rationale), CSS Variables, Figma Tokens Studio JSON
- **When to use:** Making design decisions before writing code, AI-ready design specs

### VibeKit
- **Type:** Brand typography & color token toolkit
- **Features:** Google Fonts picker, WCAG contrast checker, 10 semantic colors, shareable CSS endpoint
- **Tech:** Vite, React, Ant Design, Cloudflare Workers + D1
- **When to use:** Brand theme creation with shareable endpoints

### Web Style Extractor
- **Type:** Extract design tokens from any website
- **Features:** OKLCH color conversion, semantic mapping, WCAG checking, fluid typography generation
- **Output:** MediaWiki templates, JSON, CSS, Tailwind config, Design Tokens JSON
- **When to use:** Reverse-engineering design systems from existing sites

### OpenFlowKit (583★)
- **Type:** AI-powered diagramming studio
- **Features:** Mermaid → beautiful diagrams, AI generation (10 providers + local Ollama), bidirectional diagram-as-code
- **Output:** Cinematic MP4, SVG, PNG, PDF, Figma export
- **MCP server:** Drive from Claude Desktop, Cursor, Windsurf
- **When to use:** Architecture diagrams, flowcharts, system design documentation

### OpenGenerativeUI (1.3k★)
- **Type:** Generative UI framework (CopilotKit)
- **Features:** Agent-native chart/3D/diagram rendering, MCP server, sandboxed iframe
- **Skills:** Advanced visualization, SVG diagrams, master playbook
- **When to use:** AI-native UIs with generative components

## Key Patterns

### Design Token Pipeline
```
Design decisions → DESIGN.md / config → Token generation → Export formats
                                                                  ↓
                                             CSS / Tailwind / JSON / Figma
```

### OKLCH Color Space
Modern design tools are adopting OKLCH for perceptually uniform colors. Unlike HSL (which has perceptual non-uniformity), OKLCH ensures that lightness values reliably map to visual weight across different hues.
