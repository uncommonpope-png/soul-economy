---
name: soul-gun-inkline
description: "Modern, accessible UI component library built with Tailwind CSS, Framer Motion, and shadcn/ui architecture"
version: 1.0.0
author: profit-prime
grafted-from: ["inkline-io/inkline-ui"]
plt: "0.7/0.8/0.3"
triuen: soul
domain: component-library
original-repo: https://github.com/inkline-io/inkline-ui
---

# Inkline

> Grafted from [inkline-ui](https://github.com/inkline-io/inkline-ui) — One click soul complete.

## Side A: Theology (The Soul)

**The Graft:** This skill carries the intent of accessible, motion-rich components. In the Soul Economy, Inkline is the bridge between accessibility (Love) and animation (Life) — WCAG-compliant motion that feels alive.

**PLT:** 0.7/0.8/0.3 — Good Profit (components), Max Love (a11y + motion), low Tax (Tailwind)

**Creed:** *One click soul complete — motion respects.*

## Side B: AI Agentic Tools (The Body)

```bash
npm install @inkline/ui
```

### Components (32)

| Category | Components |
|---|---|
| **Form** | Input, Textarea, Select, Checkbox, Radio, Switch, Rating |
| **Data Display** | Avatar, Badge, Card, Table, List, Timeline |
| **Navigation** | Navbar, Nav, Breadcrumb, Pagination, Tabs, Menu |
| **Feedback** | Alert, Modal, Toast, Progress, Spinner, Skeleton |
| **Layout** | Container, Divider, Grid, Spacer, Stack |
| **Overlay** | Dropdown, Popover, Tooltip, Offcanvas |

### Accessibility Features

- WCAG 2.1 Level AA compliant
- Keyboard navigation for all components
- ARIA attributes baked in
- Focus trapping for modals
- Screen reader announcements
- Reduced motion support

### Motion System

```tsx
import { motion } from "@inkline/motion"

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2, ease: "easeOut" }}
>
```

### Theme System

```tsx
// themes/neon-nexus.ts
export const neonNexusTheme = {
  colors: {
    primary: "#8B5CF6",
    secondary: "#00D4FF",
    background: "#0A0A0F",
    surface: "#14141B",
  }
}
```

### Integration

```tsx
import { Inkline, InklinePlugin } from "@inkline/ui"
import { neonNexusTheme } from "./themes/neon-nexus"

const app = createApp()
app.use(InklinePlugin, { theme: neonNexusTheme })
```

---

## Soul Economy Integration
**Install:** `downloads/soul-gun-inkline.md` | Type `skill`

```json
{"icon":"🎨","type":"skill","name":"Inkline","desc":"Accessible motion-rich components — Tailwind + Framer Motion + a11y","plt":"0.7/0.8/0.3","file":"soul-gun-inkline.md"}
```

**Tags:** components, accessibility, motion, tailwind, grafted

*Grafted by Profit Prime — Soul Economy — 2026-09-07*
