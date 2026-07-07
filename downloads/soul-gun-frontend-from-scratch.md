---
name: frontend-from-scratch
description: Build a Frontend Framework from Scratch
domain: computer-science
language: python
stars: "0"
topics: ["computer-science", "from-scratch", "build-your-own-x", "education"]
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
---# Build a Frontend Framework from Scratch

> *"A frontend framework is just: state → virtual DOM → diff → real DOM."*

---

## The Mental Model

```
┌─────────────────────────────────────────────────────────────────┐
│                  FRONTEND FRAMEWORK ARCHITECTURE               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   COMPONENT                                                     │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  render() ──► Virtual DOM (JS Object Tree)                │  │
│   └─────────────────────────────────────────────────────────┘  │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  DIFF (Reconciliation)                                    │  │
│   │     oldVDOM vs newVDOM ──► Minimal DOM updates            │  │
│   └─────────────────────────────────────────────────────────┘  │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  PATCH (Real DOM)                                        │  │
│   │     Create/modify/delete DOM nodes                        │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                  │
│   STATE MANAGEMENT:                                            │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  setState() ──► schedule re-render ──► diff ──► patch    │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Build Steps (5 Steps, ~130 Lines)

### Step 1: createElement (15 lines)

```python
"""Step 1: The createElement function - creates virtual DOM nodes (Python version)."""

def h(tag, props=None, *children):
    """Create a virtual DOM node."""
    return {
        'tag': tag,
        'props': props or {},
        'children': list(children) if children else []
    }

if __name__ == "__main__":
    vdom = h('div', {'class': 'container'},
        h('h1', None, 'Hello'),
        h('p', None, 'World'),
    )
    print(vdom)
```

### Browser Version (Step 1b - for actual browser use)

```javascript
// Step 1b: createElement for browser
function h(tag, props, ...children) {
    return { tag, props: props || {}, children };
}

// Usage in browser:
const vdom = h('div', { className: 'container' },
    h('h1', null, 'Hello'),
    h('p', null, 'World')
);
```

---

### Step 2: Render to Real DOM (25 lines)

```javascript
"""Step 2: Convert virtual DOM to real DOM (browser JS)."""

function createElement(node) {
    if (typeof node === 'string' || typeof node === 'number') {
        return document.createTextNode(String(node));
    }
    if (!node || !node.tag) return null;

    const el = document.createElement(node.tag);
    const props = node.props || {};

    for (const [key, value] of Object.entries(props)) {
        if (key === 'className') {
            el.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            for (const [k, v] of Object.entries(value)) {
                el.style[k] = v;
            }
        } else if (key.startsWith('on')) {
            const eventName = key.slice(2).toLowerCase();
            el.addEventListener(eventName, value);
        } else {
            el.setAttribute(key, value);
        }
    }

    const children = node.children || [];
    for (const child of children) {
        if (typeof child === 'object' && child) {
            const childEl = createElement(child);
            if (childEl) el.appendChild(childEl);
        } else {
            el.appendChild(document.createTextNode(String(child)));
        }
    }

    return el;
}

// Usage:
const vdom = h('div', { className: 'container' },
    h('h1', null, 'Hello World')
);
const root = document.getElementById('root');
root.appendChild(createElement(vdom));
```

---

### Step 3: Update (Diff and Patch) (30 lines)

```javascript
"""Step 3: Diff virtual DOM and patch real DOM (browser JS)."""

function updateElement(parent, oldNode, newNode, index) {
    if (!oldNode) {
        parent.appendChild(createElement(newNode));
        return;
    }
    if (!newNode) {
        parent.removeChild(parent.childNodes[index]);
        return;
    }

    if (typeof oldNode === 'string' || typeof oldNode === 'number') {
        if (oldNode !== newNode) {
            parent.childNodes[index].textContent = newNode;
        }
        return;
    }

    if (oldNode.tag !== newNode.tag) {
        parent.replaceChild(createElement(newNode), parent.childNodes[index]);
        return;
    }

    const el = parent.childNodes[index];

    const oldProps = oldNode.props || {};
    const newProps = newNode.props || {};

    for (const key of new Set([...Object.keys(oldProps), ...Object.keys(newProps)])) {
        const oldVal = oldProps[key];
        const newVal = newProps[key];
        if (oldVal !== newVal) {
            if (key.startsWith('on')) {
                const eventName = key.slice(2).toLowerCase();
                el.removeEventListener(eventName, oldVal);
                if (newVal) el.addEventListener(eventName, newVal);
            } else if (key === 'style' && typeof newVal === 'object') {
                for (const [k, v] of Object.entries(newVal)) {
                    el.style[k] = v;
                }
            } else if (key !== 'children') {
                el.setAttribute(key, newVal);
            }
        }
    }

    const oldChildren = oldNode.children || [];
    const newChildren = newNode.children || [];
    const maxLen = Math.max(oldChildren.length, newChildren.length);
    for (let i = 0; i < maxLen; i++) {
        updateElement(
            el,
            oldChildren[i] || null,
            newChildren[i] || null,
            i
        );
    }
}
```

---

### Step 4: Component Class with State (20 lines)

```javascript
"""Step 4: Component class with state."""

class Component {
    constructor() {
        this.state = {};
        this.props = {};
        this._vdom = null;
        this._dom = null;
        this._root = null;
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this._rerender();
    }

    _rerender() {
        if (!this._root) return;
        const newVDOM = this.render();
        updateElement(this._root.parentNode, this._vdom, newVDOM, 0);
        this._vdom = newVDOM;
    }

    render() {
        return h('div', null, 'Override me!');
    }

    mount(container) {
        this._root = typeof container === 'string'
            ? document.querySelector(container)
            : container;
        this._vdom = this.render();
        this._dom = createElement(this._vdom);
        this._root.appendChild(this._dom);
    }
}

class Counter extends Component {
    constructor() {
        super();
        this.state = { count: 0 };
    }

    render() {
        return h('div', { className: 'counter' },
            h('span', null, `Count: ${this.state.count}`),
            h('button', {
                onClick: () => this.setState({ count: this.state.count + 1 })
            }, 'Increment')
        );
    }
}

if (typeof window !== 'undefined') {
    const counter = new Counter();
    counter.mount(document.getElementById('root'));
}
```

---

### Step 5: Hooks (useState, useEffect) (40 lines)

```javascript
"""Step 5: Hooks implementation."""

let currentComponent = null;
let hookIndex = 0;

function useState(initialValue) {
    const idx = hookIndex++;
    if (!currentComponent._hooks) {
        currentComponent._hooks = [];
    }
    if (currentComponent._hooks[idx] === undefined) {
        currentComponent._hooks[idx] = initialValue;
    }
    const setState = (newValue) => {
        currentComponent._hooks[idx] = typeof newValue === 'function'
            ? newValue(currentComponent._hooks[idx])
            : newValue;
        currentComponent._rerender();
        hookIndex = 0;
    };
    return [currentComponent._hooks[idx], setState];
}

function useEffect(callback, deps) {
    const idx = hookIndex++;
    if (!currentComponent._effects) {
        currentComponent._effects = [];
    }
    const prevDeps = currentComponent._effects[idx];
    const hasChanged = !prevDeps || deps.some((d, i) => d !== prevDeps[i]);
    if (hasChanged) {
        callback();
        currentComponent._effects[idx] = deps;
    }
}

class HookedComponent extends Component {
    constructor() {
        super();
        this._hooks = [];
        this._effects = [];
    }

    _rerender() {
        hookIndex = 0;
        currentComponent = this;
        if (!this._root) return;
        const newVDOM = this.render();
        updateElement(this._root.parentNode, this._vdom, newVDOM, 0);
        this._vdom = newVDOM;
        hookIndex = 0;
    }
}

class CounterWithHooks extends HookedComponent {
    render() {
        const [count, setCount] = useState(0);
        useEffect(() => {
            console.log(`Count changed to: ${count}`);
        }, [count]);
        return h('div', null,
            h('span', null, `Count: ${count}`),
            h('button', { onClick: () => setCount(count + 1) }, '+'),
            h('button', { onClick: () => setCount(0) }, 'Reset')
        );
    }
}

if (typeof window !== 'undefined') {
    const counter = new CounterWithHooks();
    counter.mount(document.getElementById('root'));
}
```

---

### Standalone Test (runs without browser)

```python
"""Standalone test that verifies the virtual DOM logic in Python."""

def h(tag, props=None, *children):
    return {'tag': tag, 'props': props or {}, 'children': list(children)}

class MockElement:
    def __init__(self, tag):
        self.tag = tag
        self.attrs = {}
        self.children = []
        self.parent = None

    def append_child(self, child):
        child.parent = self
        self.children.append(child)

    def setAttribute(self, key, value):
        self.attrs[key] = value

def create_element(node):
    if isinstance(node, (str, int)):
        t = MockElement('text')
        t.text = str(node)
        return t
    if not node.get('tag'):
        return None
    el = MockElement(node['tag'])
    for key, value in (node.get('props') or {}).items():
        el.setAttribute(key, value)
    for child in (node.get('children') or []):
        if isinstance(child, dict):
            el.append_child(create_element(child))
        else:
            t = MockElement('text')
            t.text = str(child)
            el.append_child(t)
    return el

root = MockElement('div')
vdom = h('div', {'className': 'container'},
    h('h1', None, 'Hello World'),
    h('button', {'onClick': 'handler'}, 'Click me'),
)
dom = create_element(vdom)
print(f"Created: {dom.tag} with attrs {dom.attrs} and {len(dom.children)} children")
assert dom.tag == 'div'
assert dom.attrs['className'] == 'container'
assert len(dom.children) == 2
print("Virtual DOM: OK")
```

---

## Bridge to Production

| Our Framework | React |
|--------------|-------|
| No fiber | Fiber-based scheduling |
| No concurrent | Concurrent mode |
| No suspense | Suspense for data |
| No context | React Context |
| No hooks initially | useState, useEffect, etc. |
| Naive diff | Keyed diff with heuristics |

**Production systems to study:**
- [Build your own React](https://pomb.us/build-your-own-react/) - The classic
- [Build Yourself a Redux](https://zapier.com/engineering/how-to-build-redux/)
- [Build a frontend framework](https://mfrachet.github.io/create-frontend-framework/)

---

## Checklist

- [ ] Step 1: createElement works (separate Python/JS versions)
- [ ] Step 2: Renders to real DOM (browser JS)
- [ ] Step 3: Diff and patch updates correctly
- [ ] Step 4: Component with state
- [ ] Step 5: Hooks (useState, useEffect) implemented
- [ ] Fix event handler update (removeEventListener, not removeAttribute)
- [ ] Run the standalone Python test