---
name: design-engineering
description: Design engineering tools and quality scoring
domain: design
language: typescript
stars: "60000"
topics: ["design-engineering", "design-systems", "quality", "accessibility", "color", "design-tokens"]
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

# Design Engineering

## Origin

Mined from 5 top repos: FORGE, OPTIK, Open Design (59k★), ChromaType Studio, AlwanKit (27★).

## Repos Covered

### Open Design (59k★)
- **Type:** Local-first Claude Design alternative
- **Features:** 259+ skills, 150 brand-grade DESIGN.md systems, 261 plugins, desktop app
- **Output:** Web/desktop/mobile prototypes, dashboards, decks, images, video, HyperFrames
- **Agent support:** Claude Code, Codex, Cursor, Copilot, OpenCode, and 17+ CLIs
- **When to use:** AI-powered design prototyping, brand system enforcement

### FORGE
- **Type:** Design system generator from one color
- **Features:** 43 commands, 200+ tokens, 5 export formats (CSS/Tailwind/SCSS/JSON/Figma)
- **Output:** Full design system in 30 seconds from one hex color
- **Commands:** /forge-init, /forge-audit, /forge-score, /forge-fix
- **When to use:** Rapid design system scaffolding, brand consistency enforcement

### OPTIK
- **Type:** Lighthouse for design quality
- **Features:** 58 commands, 0-100 scoring algorithm across 5 pillars
- **Pillars:** Typography (25%), Color (25%), Layout (25%), Motion (10%), Accessibility (15%)
- **Commands:** /score, /audit, /critique, /benchmark, /certify, /contrast
- **Anti-pattern detection:** Inter/Roboto/Arial (-25), purple gradients (-30), cards-in-cards (-20)
- **When to use:** Design QA, CI/CD gate for design quality

### ChromaType Studio
- **Type:** All-in-one color palette + typography + accessibility workspace
- **Features:** Color palettes with roles, typography scales with modular ratios, WCAG contrast checking, live preview
- **Export:** CSS variables, SCSS, JSON, HTML demo page
- **Tech:** React, TypeScript, Tailwind, chroma.js, HSLuv
- **When to use:** Creating design systems from scratch with accessibility built in

### AlwanKit (27★)
- **Type:** Pure CSS color system generator
- **Features:** Zero JavaScript, WCAG accessibility built into generation logic
- **Harmonies:** Complementary, triadic, analogous, monochromatic
- **Export:** CSS, SCSS, Tailwind, JSON
- **When to use:** Lightweight color system that never needs JS

## Key Patterns

### Design Quality Scoring (OPTIK)
| Pillar | Weight | Measures |
|--------|--------|----------|
| Typography | 25% | Scale ratio, hierarchy, line measure, banned fonts |
| Color | 25% | Contrast ratios, palette coherence, CSS variables |
| Layout | 25% | Grid alignment, spacing rhythm, responsive |
| Motion | 10% | Easing, reduced-motion, performance |
| A11y | 15% | Focus styles, semantic HTML, ARIA |

### SKILL.md Pattern (Open Design)
Open Design uses the same SKILL.md convention as opencode. 259 skills are portable across any agent that supports Agent Skills. This confirms our skill architecture is industry-standard.
