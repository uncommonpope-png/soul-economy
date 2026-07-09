---
name: design-to-code
description: Design-to-code tools and Figma bridges
domain: design
language: typescript
stars: "5500"
topics: ["design-to-code", "figma", "d2c", "figma-plugins", "code-generation", "mcp"]
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

# Design-to-Code

## Origin

Mined from 7 top design-to-code repos: FigmaToCode (4.8k★), Figment, Figma Bridge (50★), d2c, nCompose, Claude Talk to Figma MCP (610★), Local Figma Port (7★).

## Repos Covered

### FigmaToCode (bernaferrari, 4.8k★)
- **Output:** HTML, React (JSX), Svelte, styled-components, Tailwind, Flutter, SwiftUI
- **Approach:** Figma plugin, responsive layouts
- **When to use:** Multi-platform Figma-to-code conversion

### Figment
- **Output:** React, Vue, HTML/CSS with AI
- **Approach:** MCP bridge between Figma and AI coding tools (Cursor, Claude Desktop)
- **Features:** 100% design data extraction, design token extraction, real-time bridge
- **When to use:** AI-powered design-to-code workflow

### Figma Bridge (50★)
- **Output:** LLM-friendly HTML/CSS
- **Approach:** Converts Figma to semantic, structured HTML/CSS optimized for AI consumption
- **Features:** 99.5% size reduction, CSS property names, inline styles
- **When to use:** Feeding Figma designs into LLMs for code generation

### d2c
- **Output:** React + Tailwind, Vue 3 SFC, HTML + CSS, React Native, Flutter
- **Approach:** Pipeline from Figma REST API / .fig binary / Sketch / native JSON
- **Features:** Design token extraction, Tailwind preset generation, component matching (antd/MUI), responsive breakpoints, ai:ignore regions
- **When to use:** Production D2C with design token preservation

### nCompose
- **Output:** React, Vue, Svelte, Angular, Solid simultaneously via Mitosis
- **Approach:** Figma URL → LLM interpretation → Mitosis compiler → multi-framework output
- **Features:** Variant-aware, chart detection, accessibility validation, icon deduplication
- **When to use:** Multi-framework orgs needing one design → many framework outputs

### Claude Talk to Figma MCP (610★)
- **Output:** Any framework via AI (React, Vue, SwiftUI, etc.)
- **Approach:** MCP server + Figma plugin, works with any Figma account
- **Features:** Read/analyze/modify Figma designs, no Dev Mode license needed
- **When to use:** AI-driven Figma design modification

### Local Figma Port (7★)
- **Output:** Any framework via AI
- **Approach:** Local-first, scoped Figma export → local MCP server → AI agents
- **Features:** Scoped export (not full file), normalized agent-friendly data, offline
- **When to use:** Privacy-conscious, local-first design-to-code

## Key Patterns

### Architecture Models
1. **Figma Plugin Direct** — Plugin generates code inside Figma (FigmaToCode)
2. **MCP Bridge** — MCP server connects Figma to AI coding tools (Figment, Talk to Figma, Local Figma Port)
3. **Pipeline** — Figma API → transformation → code output (d2c, nCompose)
4. **LLM-friendly export** — Convert Figma to format optimized for AI consumption (Figma Bridge)
