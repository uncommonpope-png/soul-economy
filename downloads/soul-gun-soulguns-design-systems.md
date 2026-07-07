---
name: soulguns-design-systems
description: 1. Component Architecture Patterns
domain: computer-science
language: python
stars: "0"
topics: ["soulguns", "architecture", "typescript", "design-patterns"]
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
----|-------|----------|-----------------|
| shadcn-ui/ui | 115k★ | TypeScript | Code distribution platform, CLI, "copy-paste" component model |
| tailwindlabs/tailwindcss | 95.2k★ | Rust/TS | Utility-first CSS, design tokens, v4 engine in Rust |
| chakra-ui/chakra-ui | 40.4k★ | TypeScript | Component system, theme tokens, style props, CSS-in-JS |
| radix-ui/primitives | 18.9k★ | TypeScript | Unstyled accessible primitives, compound components, focus management |
| adobe/react-spectrum | 15.3k★ | TypeScript | Enterprise design system, React Aria (hooks), React Stately (state), Spectrum theme |

---

## 1. Component Architecture Patterns

### 1.1 Headless (Behavior-First) Pattern — Radix UI / React Aria

Separation of behavior from rendering. Hooks manage state + accessibility, render props own the DOM:

```typescript
// React Aria pattern: hook provides behavior, developer controls DOM
import { useButton } from '@react-aria/button';

function MyButton(props) {
  const ref = useRef(null);
  const { buttonProps } = useButton(props, ref);
  return <button {...buttonProps} ref={ref} className="my-custom-styles" />;
}
```

**Key insight:** Headless libraries own behavior (keyboard, focus, ARIA). You own styling. No CSS coupling.

### 1.2 Compound Component Pattern — Radix UI

Components that share implicit state via React Context:

```tsx
import * as Dialog from '@radix-ui/react-dialog';

<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Title>Title</Dialog.Title>
    <Dialog.Close />
  </Dialog.Content>
</Dialog.Root>
```

**Pattern:** `Root` owns state via context. Children access context. No prop drilling. Each subcomponent is independently stylable.

### 1.3 Polymorphic Component Pattern — Radix + shadcn

Component renders as any HTML element via `asChild`:

```tsx
// Radix's asChild prop — composability without DOM nesting
<Dialog.Trigger asChild>
  <Button variant="outline">Open Dialog</Button>
</Dialog.Trigger>
```

**Pattern:** `asChild` forwards all props and refs to the child element. Enables composition without breaking accessibility.

### 1.4 Slot Pattern — shadcn/ui

Components that accept children and clone them with merged props:

```tsx
// shadcn's Slot pattern — merge behavior onto any element
function Slot({ children, ...props }) {
  if (React.isValidElement(children)) {
    return React.cloneElement(children, { ...props, ...children.props });
  }
  return React.Children.only(children);
}
```

---

## 2. shadcn/ui — Code Distribution Model

### 2.1 Philosophy: Copy-Paste, Not Dependency

Components are **copied into your project** via CLI, not installed as packages. You own the code.

```bash
npx shadcn@latest add button
# Copies source into components/ui/button.tsx
```

**Benefits:** Full control over styling and behavior. No version conflicts. Customize anything.

### 2.2 Component Anatomy

```tsx
// @/components/ui/button.tsx (shadcn v4 pattern)
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
```

**Pattern components per file:**
1. `cva()` — variant definitions (base + variants + defaults)
2. `interface` — extends native HTML attributes + variant props
3. `React.forwardRef` — ref forwarding
4. `asChild` — polymorphic support via Slot
5. `cn()` — Tailwind class merging utility

### 2.3 cn() Utility Pattern

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Pattern:** Merge Tailwind classes with runtime resolution, no conflicts.

### 2.4 CLI + Registry Architecture

```json
// registry.json — maps component names to files and dependencies
{
  "button": {
    "files": ["components/ui/button.tsx"],
    "dependencies": ["@radix-ui/react-slot", "class-variance-authority"],
    "registryDependencies": [],
    "type": "components:ui"
  }
}
```

---

## 3. Tailwind CSS — Utility-First Design Tokens

### 3.1 Design Token as Config

```javascript
// tailwind.config.js v3 / tailwind.css v4
@theme {
  --color-primary: #3b82f6;
  --color-primary-foreground: #ffffff;
  --color-destructive: #ef4444;
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
}
```

### 3.2 Responsive Variants

```html
<!-- Mobile-first: base is mobile, sm/md/lg/xl override -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
```

### 3.3 State Variants

```html
<button class="bg-blue-500 hover:bg-blue-700 focus:outline-none focus:ring-2 disabled:opacity-50">
```

**Pattern:** `{state}:{property}-{value}` — composable, no CSS written.

### 3.4 Class-Variance-Authority Pattern (shadcn + Tailwind)

```typescript
import { cva } from "class-variance-authority"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive dark:border-destructive",
      },
    },
    defaultVariants: { variant: "default" },
  }
)
```

---

## 4. Chakra UI — Theming & Style Props

### 4.1 Theme Token System

```typescript
// chakra-ui theme contract
const theme = {
  colors: {
    blue: { 50: '#eff6ff', 500: '#3b82f6', 900: '#1e3a5f' },
  },
  fonts: { body: 'Inter, sans-serif', heading: 'Inter, sans-serif' },
  radii: { sm: '0.25rem', md: '0.375rem', lg: '0.5rem' },
  space: { 1: '0.25rem', 4: '1rem', 8: '2rem' },
  breakpoints: { sm: '30em', md: '48em', lg: '62em' },
}
```

### 4.2 Style Props Pattern

```tsx
// Every component accepts style tokens as props
<Box
  bg="blue.500"
  color="white"
  p={4}
  borderRadius="md"
  _hover={{ bg: "blue.600" }}  // state variant via underscore
>
```

**Pattern:** Props map to theme tokens. `blue.500` resolves to `#3b82f6`. No import needed.

### 4.3 Component Composition (Chakra v3+)

```typescript
// Recipe pattern — similar to cva
import { defineRecipe } from '@chakra-ui/react'

export const buttonRecipe = defineRecipe({
  base: { display: 'inline-flex', alignItems: 'center' },
  variants: {
    variant: {
      solid: { bg: 'brand.solid', color: 'white' },
      outline: { border: '1px solid', borderColor: 'brand.solid' },
    },
    size: {
      sm: { h: '8', px: '3', fontSize: 'sm' },
      lg: { h: '12', px: '6', fontSize: 'lg' },
    },
  },
})
```

---

## 5. React Aria / Stately — Enterprise-Grade State

### 5.1 State Management Hooks (React Stately)

```typescript
import { useListState } from '@react-stately/list'
import { useListBox } from '@react-aria/listbox'

function ListBox(props) {
  const state = useListState(props)  // cross-platform state
  const ref = useRef(null)
  const { listBoxProps } = useListBox(props, state, ref)  // behavior + a11y

  return (
    <ul {...listBoxProps} ref={ref}>
      {[...state.collection].map(item => (
        <Option key={item.key} item={item} state={state} />
      ))}
    </ul>
  )
}
```

**Pattern:** `use*State` hook for state management (framework-agnostic). `use*` hook for behavior + accessibility (platform-specific).

### 5.2 Collection API

```typescript
// Items can be static or dynamic
<Select>
  <SelectItem key="1">Option 1</SelectItem>
  <SelectItem key="2">Option 2</SelectItem>
</Select>

// Or data-driven via items prop
<Select items={items}>
  {(item) => <SelectItem>{item.name}</SelectItem>}
</Select>
```

### 5.3 Cross-Platform State

React Stately state hooks work on React DOM, React Native, Sketch — any React target. Behavior hooks are platform-specific (DOM interactions for web, touch for native).

---

## 6. Accessibility Patterns

### 6.1 WAI-ARIA Compliance (Radix + React Aria)

All Radix primitives ship with full WAI-ARIA:
- `role`, `aria-*` attributes automatically managed
- Keyboard navigation (Tab, Arrow keys, Escape, Space, Enter)
- Focus management (auto-focus, focus trap in dialogs)
- Screen reader announcements (live regions, aria-live)

### 6.2 Focus Management Pattern

```typescript
// Radix Dialog automatically:
// 1. Traps focus within dialog
// 2. Returns focus to trigger on close
// 3. Auto-focuses first focusable element
// 4. Manages aria-hidden on background content
```

### 6.3 Keyboard Navigation Pattern

```typescript
// useListBox handles:
// ArrowDown → next option
// ArrowUp → previous option  
// Home → first option
// End → last option
// Type → typeahead to matching option
```

### 6.4 Testing Accessibility

```typescript
// Radix + Chakra use Cypress + Axe for automated a11y testing
// React Aria has unit tests covering 40+ screen reader + browser combinations
```

---

## 7. CSS Architecture Patterns

### 7.1 Utility-First (Tailwind)

```html
<div class="flex items-center gap-2 p-4 bg-white rounded-lg shadow">
```

**Rule:** 95% of UI built with utilities. Custom CSS only for truly unique cases.

### 7.2 CSS-in-JS (Chakra UI pre-v3)

```typescript
// Style props generate atomic CSS at runtime
<Box sx={{ "& > p": { color: "gray.600" } }} />
```

### 7.3 Static Extraction (Tailwind v4, Chakra v3+)

```css
/* Tailwind v4: Rust-based engine scans source for class names */
/* Generates only used utilities — zero unused CSS */
@import "tailwindcss";
```

```typescript
// Chakra v3: CSS-in-JS with static extraction during build
// No runtime CSS-in-JS cost
```

---

## 8. Monorepo Structure Patterns

### 8.1 Radix UI Monorepo

```
packages/
├── core/           # Shared primitives (Context, Slot)
├── react-arrow/    # Single component per package
├── react-dialog/
├── react-dropdown-menu/
├── react-popover/
└── ...
```

**Pattern:** One package per component. Individual versioning. Tree-shakeable by default.

### 8.2 Adobe React Spectrum

```
packages/
├── react-aria/     # Behavior + accessibility hooks
├── react-stately/  # State management hooks
├── @react-spectrum/   # Styled Spectrum components
├── @internationalized/ # i18n
└── dev/            # Dev utilities, test utils
```

**Pattern:** Separation of concerns (state → behavior → styled). Teams own layers independently.

### 8.3 Chakra UI

```
packages/
├── components/     # React component source
├── theme/          # Design tokens
├── utils/          # Shared utilities
├── cli/            # Code generation
└── ...
```

---

## 9. Testing Patterns

### 9.1 Visual Regression (Chromatic)

Radix + Adobe use Chromatic for visual diff testing in CI. Every PR shows component diffs.

### 9.2 Accessibility Testing

```typescript
// Cypress + axe-core
cy.injectAxe()
cy.checkA11y()  // auto-scans for WCAG violations
```

### 9.3 Interaction Testing

```typescript
// @testing-library/user-event
await user.tab()  // test keyboard navigation
await user.keyboard('{ArrowDown}')
await user.click(screen.getByRole('button'))
```

---

## 10. Theming & Dark Mode

### 10.1 CSS Custom Properties (shadcn)

```css
:root {
  --background: 0 0% 100%;     /* HSL values */
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --ring: 222.2 84% 4.9%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --ring: 212.7 26.8% 83.9%;
}
```

**Pattern:** HSL values (not hex) — enables runtime color manipulation via CSS `color-mix()`.

### 10.2 Adaptive Theming (React Spectrum)

Spectrum components auto-adapt to:
- Light/dark mode
- Mobile/desktop
- Touch/mouse/keyboard input
- Right-to-left languages
- Reduced motion preferences

---

## Key Decisions

- **Headless + Styled split** (React Aria + shadcn) — behavior libraries own accessibility, you own design
- **Utility-first CSS** (Tailwind) for production speed — CVA for variant management
- **Copy-paste distribution** (shadcn) over npm dependency for component ownership — best for apps
- **npm packages** (Radix, Chakra) for primitive/shared libraries — best for design systems
- **Compound components** with React Context for complex widgets (Dialog, Menu, Tabs)
- **State hooks separate from behavior hooks** (React Stately / React Aria) — cross-platform state, platform-specific behavior
- **HSL color tokens** (shadcn) over hex — enables runtime color mixing and dark mode calc
- **Polymorphic asChild** (Radix/Slot) for composition without DOM nesting
- **Design tokens as CSS custom properties** — runtime theme switching, no recompile needed
