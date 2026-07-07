---
name: animation-libraries
description: Production animation libraries from GitHub
domain: animation
language: typescript
stars: "237000"
topics: ["animation"]
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
---# Animation Libraries

## Origin

Mined from 8 top animation repos on GitHub. Covers the full spectrum from CSS keyframes to GPU-accelerated JS animation engines.

## Repos Covered

### Motion by Motion Division (32k★)
- **Type:** Hybrid JS + native browser API animation library (successor to Framer Motion)
- **Key features:** 120fps GPU-accelerated, spring-physics, layout animations, scroll-linked effects, gestures, timelines
- **Framework support:** React, JavaScript, Vue
- **When to use:** Primary animation library for React apps — replaces Framer Motion with better performance

### Anime.js v4 (68k★)
- **Type:** Lightweight imperative animation engine
- **Key features:** CSS properties, SVG, DOM attributes, JavaScript Objects, ES modules, stagger, timeline
- **Bundle:** ~27KB gzip
- **When to use:** Complex SVG animations, sequenced multi-element animations, timeline-heavy work

### GSAP (24k★)
- **Type:** Framework-agnostic professional animation platform
- **Key features:** ScrollTrigger (scroll-driven), timeline sequencing, morphing (MorphSVG), text splitting (SplitText), 12M+ sites
- **Plugins:** ScrollTrigger, ScrollSmoother, MorphSVG, SplitText, Flip, MotionPath
- **When to use:** Hero sequences, scroll-driven storytelling, production animation at scale

### react-spring (29k★)
- **Type:** Spring-physics based React animation library
- **Key features:** Cross-platform (DOM, React Native, R3F, Konva, Zdog), animated components, useSpring, useTrail, useChain
- **API patterns:** useSpring (single), useSprings (multiple), useTrail (staggered), useChain (sequenced)
- **When to use:** Spring-physics UI in React, R3F animations

### Animate.css (82k★)
- **Type:** Pure CSS keyframe animation library
- **Key features:** 70+ animation classes, no JS needed, prefers-reduced-motion support
- **Bundle:** Zero JS — pure CSS
- **When to use:** Quick CSS animations, landing page entrances, no-JS environments

### sparkfx (new)
- **Type:** Micro-interaction library with 45+ effects
- **Key features:** Zero dependencies, framework-agnostic (React/Vue/Svelte), presets (gaming, minimal, playful)
- **Categories:** Basic (bounce/pulse/fade), Premium (glow/ripple/magnetic/tilt), Visual (glitch/neon/hologram/matrix), Motion (parallax/flip3d/orbit), Scroll (reveal/counter), Text (typewriter/scramble/wave)
- **When to use:** Adding polish to products without heavy animation libraries

### USAL.js (138★)
- **Type:** Lightweight scroll animation library
- **Key features:** 40+ animations, 8KB gzip, zero dependencies, text splitting (word/letter), number counters, shimmer effects
- **Framework support:** React, Solid, Svelte, Vue, Lit, Angular, Vanilla JS
- **When to use:** Scroll-triggered animations with smallest possible bundle

### animix (new)
- **Type:** CSS animation library for Tailwind CSS and shadcn/ui
- **Key features:** Zero runtime (pure CSS path), Tailwind plugin, React bindings, reduced-motion safe
- **Focus:** Mount, exit, overlay, loader, toast, drawer lifecycle animations
- **When to use:** Reusable lifecycle animations in Tailwind/shadcn projects

## Key Patterns

### Choosing the Right Animation Tool
| Use Case | Tool |
|----------|------|
| Spring-physics UI (React) | react-spring |
| Scroll-driven storytelling | GSAP + ScrollTrigger |
| SVG morphing/sequencing | Anime.js |
| Layout animations | Motion (Framer) |
| Micro-interactions | sparkfx |
| CSS-only entrances | Animate.css |
| Scroll reveals (tiny bundle) | USAL.js |
| Component lifecycle motion | animix |

### Performance Rules
1. GPU-accelerated properties only: `transform`, `opacity` — never animate `width`, `height`, `top`, `left`
2. `will-change` on animated elements — but remove after animation completes
3. Use `requestAnimationFrame` for JS-driven animations (never `setInterval`)
4. Respect `prefers-reduced-motion` — provide an alternative or skip
5. Spring-physics feels more natural than linear easings for UI

### Timeline Pattern (GSAP)
```javascript
const tl = gsap.timeline({ defaults: { duration: 0.5, ease: 'power2.out' } });
tl.from('.hero', { y: 50, opacity: 0 })
  .from('.subtitle', { y: 30, opacity: 0 }, '-=0.3')
  .from('.cta', { scale: 0.8 }, '-=0.2');
```

### Spring Pattern (react-spring)
```jsx
const springs = useSpring({ from: { opacity: 0, y: 20 }, to: { opacity: 1, y: 0 } });
<animated.div style={springs}>Hello</animated.div>
```
