---
name: design-systems
description: Production-grade design systems mined from top GitHub repos
domain: design
language: typescript
stars: "330000"
topics: ["design"]
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
---# Design Systems

## Origin

Mined from 8 top design system repos on GitHub. Each repo represents either a major enterprise design system or a modern composable component library.

## Repos Covered

### shadcn/ui (115k★)
- **Stack:** React 19, Radix UI primitives, Tailwind CSS v4, TypeScript
- **Pattern:** Copy-paste components, not an npm dependency. Users own the code.
- **Key features:** Code distribution platform, CLI installer (`npx shadcn add`), registry-based, tree-shakable
- **When to use:** Any React project that needs accessible, customizable components without framework lock-in

### Ant Design (98k★)
- **Stack:** React, TypeScript, CSS-in-JS
- **Pattern:** Enterprise-class UI library with 60+ components
- **Key features:** Internationalization (50+ languages), powerful theme customization, Form/Table/DatePicker/Upload enterprise components
- **Ecosystem:** Ant Design X (AI UI), Ant Design Pro (layouts), Ant Design Charts, Ant Design Mobile, Ant Design Web3

### Material UI (98k★)
- **Stack:** React, Emotion/styled-components, TypeScript
- **Pattern:** Google Material Design implementation, 40+ components
- **Key features:** MUI X (Data Grid, Date Pickers, Charts), Base UI (unstyled primitives), Pigment CSS (zero-runtime)
- **When to use:** Material Design apps, enterprise dashboards needing Data Grid

### Carbon by IBM (9.1k★)
- **Stack:** React + Web Components, SCSS, TypeScript
- **Pattern:** IBM Design Language, 90+ components
- **Key features:** Comprehensive design tokens (colors, type, spacing, motion), 1300+ icons, pictograms
- **Packages:** `@carbon/react`, `@carbon/web-components`, `@carbon/styles`, `@carbon/elements`, `@carbon/icons`

### Semi Design by Douyin (9.8k★)
- **Stack:** React, TypeScript, SCSS, Figma plugin
- **Pattern:** 80+ high-quality components, 3000+ design tokens
- **Key features:** Design-to-Code (D2C) from Figma, Code-to-Design (C2D) → auto-generate Figma UI Kit, DSM theme management
- **Differentiator:** AI-friendly, built-in D2C bridge

### Sisyphos UI (6★)
- **Stack:** React 18+ / Vue 3+ / Angular 18+, CSS variables, TypeScript
- **Pattern:** One design system, three frameworks — identical API surface
- **Key features:** 33 components, zero runtime deps beyond framework, compound APIs, controlled + uncontrolled
- **When to use:** Multi-framework orgs needing consistent UI across stacks

### Tale UI
- **Stack:** React Aria Components, CSS design tokens, TypeScript
- **Pattern:** Modular token-based CSS + styled React on React Aria
- **Key features:** 60+ components, variable font icons, CSS custom properties theming
- **Packages:** `@tale-ui/core` (CSS), `@tale-ui/react` (components), `@tale-ui/react-styles` (component CSS)

### Apollo UI by UiPath (15★)
- **Stack:** React (MUI + shadcn), Web Components, Tailwind, TypeScript
- **Pattern:** Enterprise design system by UiPath, 1300+ icons
- **Key features:** Canvas/workflow components, ApChat (AI chat), design tokens, Storybook
- **Packages:** `@uipath/apollo-core` (tokens/icons), `@uipath/apollo-react` (MUI), `@uipath/apollo-wind` (Tailwind/shadcn)

## Key Patterns

### Component Distribution Models
- **shadcn registry:** Copy files into project — user owns them, full customization
- **npm package:** Traditional dependency — versioned, tree-shakable
- **Web Components:** Framework-agnostic, works anywhere

### Theming Approaches
- **CSS Custom Properties:** Runtime theme switching, no rebuild needed (Carbon, Sisyphos, Tale)
- **CSS-in-JS:** Dynamic theming via React context (MUI, Ant Design)
- **Design Tokens + Tailwind:** Token → Tailwind config → utility classes (Apollo Wind, shadcn)

### Accessibility Standards
- All 8 repos follow WAI-ARIA Authoring Practices
- Keyboard navigation, focus management, screen reader support
- Radix UI (used by shadcn, Tale) provides primitive-level accessibility

## Architecture Rules
1. Design token → semantic alias → component prop — never use raw values
2. Component variants via `cva` (class-variance-authority) or `data-*` attributes
3. Composition over configuration — compound components (Dialog.Trigger, Dialog.Content)
4. Dark mode via CSS custom properties + `class="dark"` on root
5. Tree-shaking via ESM — import only what you use
