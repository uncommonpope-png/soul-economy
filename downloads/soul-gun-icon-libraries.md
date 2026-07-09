---
name: icon-libraries
description: SVG icon libraries for web projects
domain: design
language: typescript
stars: "65000"
topics: ["icons", "svg", "icon-library", "lucide", "tabler", "phosphor", "heroicons"]
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

# Icon Libraries

## Origin

Mined from 7 top icon library repos: Lucide (22k★), Tabler Icons (20k★), Phosphor Icons, theSVG (2.1k★), Simple Icons (25k★), Heroicons (14k★), Bootstrap Icons (7.9k★).

## Repos Covered

### Lucide (22k★)
- **Count:** 1700+ icons
- **Format:** SVG, tree-shakable React/Vue/Svelte
- **License:** ISC
- **Features:** Feather fork, consistent 24x24 grid, 2px stroke
- **When to use:** General UI, Feather replacement

### Tabler Icons (20k★)
- **Count:** 5000+ icons
- **Format:** SVG, React/Vue/Svelte
- **License:** MIT
- **Features:** 24x24 grid, 2px stroke, largest icon count
- **When to use:** Maximum icon coverage needed

### Phosphor Icons
- **Count:** 1300+ base icons, 6 weights
- **Format:** SVG, JSX, React/Vue/Svelte
- **License:** MIT
- **Features:** Thin, light, regular, bold, fill, duotone — 6 weights per icon
- **When to use:** SaaS dashboards needing stylistic range

### theSVG (2.1k★)
- **Count:** 6000+ brand + cloud architecture icons
- **Format:** SVG, React/Vue/Svelte, MCP server, CLI
- **License:** MIT
- **Features:** 4000+ brand logos, 739 AWS, 626 Azure, 214 GCP
- **When to use:** Brand icons, cloud architecture diagrams

### Simple Icons (25k★)
- **Count:** 3400+ brand SVGs
- **Format:** SVG, 16+ framework packages
- **License:** CC0
- **Features:** Brand-only, free for any use
- **When to use:** Brand logos, no attribution required

### Heroicons (14k★)
- **Count:** 300+ icons, 4 styles
- **Format:** SVG, JSX, React/Vue
- **License:** MIT
- **Features:** Tailwind CSS team, outline/solid/mini/micro
- **When to use:** Tailwind projects

### Bootstrap Icons (7.9k★)
- **Count:** 2000+ icons
- **Format:** SVG, font, sprite
- **License:** MIT
- **Features:** Official Bootstrap icon library
- **When to use:** Bootstrap projects

## Key Patterns

### Choosing an Icon Library
| Need | Library |
|------|---------|
| General UI (Feather style) | Lucide |
| Maximum icon count | Tabler Icons |
| Stylistic range (6 weights) | Phosphor |
| Brand/cloud icons | theSVG |
| Brand logos only | Simple Icons |
| Tailwind projects | Heroicons |
| Bootstrap projects | Bootstrap Icons |

### Tree-Shaking
All modern icon libraries support tree-shaking — only imported icons end up in the bundle. Import specific icons, not the full set:
```typescript
import { Home, Settings, User } from 'lucide-react'
```
