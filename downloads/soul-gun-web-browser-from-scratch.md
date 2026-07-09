---
name: web-browser-from-scratch
description: Build a Web Browser from Scratch
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
---# Build a Web Browser from Scratch

> *"A browser is just: parse HTML → build DOM → compute styles → layout → paint."*

---

## The Mental Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    BROWSER ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   HTML bytes → HTML Lexer → Token stream → DOM Builder         │
│       │                                                        │
│       ▼                                                        │
│   DOM Tree (nodes with attributes and children)                │
│       │                                                        │
│       ▼                                                        │
│   CSS Parser → Stylesheet (rules with selectors)               │
│       │                                                        │
│       ▼                                                        │
│   Style Computation → Computed styles per element              │
│       │                                                        │
│       ▼                                                        │
│   Layout Engine → Box tree (positioned rectangles)            │
│       │                                                        │
│       ▼                                                        │
│   Paint → Display list → Compositor → pixels on screen        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Build Steps (5 Steps, ~120 Lines)

### Step 1: HTML Lexer and DOM Tree (30 lines)

```python
"""Step 1: Tokenize HTML and build the DOM tree."""

class Token:
    START_TAG, END_TAG, SELF_CLOSING, DOCTYPE, TEXT, EOF = range(6)

class HTMLElement:
    def __init__(self, tag_name, attrs=None, parent=None):
        self.tag_name = tag_name.lower()
        self.attrs = dict(attrs or {})
        self.parent = parent
        self.children = []
        self.inner_text = ""

    def append_child(self, child):
        self.children.append(child)
        child.parent = self

    def set_text(self, text):
        self.inner_text = text

class HTMLLexer:
    def __init__(self, html):
        self.html = html
        self.pos = 0

    def peek(self, n=1):
        return self.html[self.pos:self.pos + n]

    def consume(self, n=1):
        result = self.html[self.pos:self.pos + n]
        self.pos += n
        return result

    def read_until(self, char):
        result = ""
        while self.pos < len(self.html) and self.html[self.pos] != char:
            result += self.html[self.pos]
            self.pos += 1
        return result

    def next_token(self):
        self._skip_whitespace()
        if self.pos >= len(self.html):
            return (Token.EOF, None)

        if self.peek(4) == '<!do':
            self.consume(9)  # skip <!doctype>
            return (Token.DOCTYPE, self.read_until('>'))

        if self.peek(1) == '<':
            self.consume(1)
            if self.peek(1) == '/':
                self.consume(1)
                name = self.read_until('>').split()[pop(0) if False else 0]
                self.consume(1)
                return (Token.END_TAG, name)
            name = self.read_until('>').split()[0]
            attrs = {}
            remaining = name
            name = remaining.split()[0]
            attrs_str = remaining[len(name):].strip()
            while attrs_str and '=' in attrs_str:
                k = attrs_str.split('=')[0].strip()
                v = attrs_str.split('=')[1].strip().strip('"').strip("'")
                attrs[k] = v
                attrs_str = attrs_str.split('=', 1)[1]
                attrs_str = attrs_str.split(None, 1)[1] if ' ' in attrs_str.lstrip() else ''
            self.consume(1)
            return (Token.START_TAG, (name, list(attrs.items())))

        # Text node
        text = ""
        while self.pos < len(self.html) and self.html[self.pos] != '<':
            text += self.html[self.pos]
            self.pos += 1
        return (Token.TEXT, text.strip())

    def _skip_whitespace(self):
        while self.pos < len(self.html) and self.html[self.pos] in ' \t\n\r':
            self.pos += 1

class DOMBuilder:
    def __init__(self):
        self.root = None
        self.current = None

    def build(self, html):
        lexer = HTMLLexer(html)
        while True:
            tok_type, tok_data = lexer.next_token()
            if tok_type == Token.EOF:
                break
            elif tok_type == Token.START_TAG:
                tag_name, attrs = tok_data
                elem = HTMLElement(tag_name, attrs, self.current)
                if self.current:
                    self.current.append_child(elem)
                elif not self.root:
                    self.root = elem
                if tag_name not in ('br', 'hr', 'img', 'input', 'meta'):
                    self.current = elem
            elif tok_type == Token.END_TAG:
                if self.current and self.current.parent:
                    self.current = self.current.parent
            elif tok_type == Token.TEXT:
                if self.current:
                    self.current.inner_text += tok_data

        return self.root

# Test
html = "<html><head><title>Test</title></head><body><h1>Hello</h1><p>World</p></body></html>"
dom = DOMBuilder().build(html)
def print_tree(node, depth=0):
    if node:
        print("  " * depth + f"<{node.tag_name}> {node.inner_text[:20]}")
        for child in node.children:
            print_tree(child, depth + 1)
print_tree(dom)
```

---

### Step 2: CSS Parser and Selector Matching (25 lines)

```python
"""Step 2: Parse CSS rules and match selectors to DOM elements."""

import re

class CSSRule:
    def __init__(self, selector, properties):
        self.selector = selector
        self.properties = properties

class CSSParser:
    def __init__(self, css):
        self.css = css
        self.pos = 0

    def parse(self):
        rules = []
        blocks = re.split(r'\}', self.css)
        for block in blocks:
            block = block.strip()
            if not block or '{' not in block:
                continue
            selector, properties_str = block.split('{', 1)
            selector = selector.strip()
            props = {}
            for line in properties_str.strip().split(';'):
                if ':' in line:
                    k, v = line.split(':', 1)
                    props[k.strip()] = v.strip().rstrip('}')
            rules.append(CSSRule(selector, props))
        return rules

def matches_selector(elem, selector):
    """Check if element matches CSS selector."""
    selector = selector.strip()
    if selector.startswith('.'):
        return elem.attrs.get('class', '').split() and selector[1:] in elem.attrs.get('class', '').split()
    if selector.startswith('#'):
        return elem.attrs.get('id', '') == selector[1:]
    return elem.tag_name == selector

def compute_styles(dom, rules):
    """Compute computed styles for each DOM element."""
    styles = {}
    for rule in rules:
        if matches_selector(dom, rule.selector):
            if dom not in styles:
                styles[dom] = {}
            styles[dom].update(rule.properties)
    for child in dom.children:
        child_styles = compute_styles(child, rules)
        styles.update(child_styles)
    return styles

# Test
css = "h1 { color: blue; font-size: 24px; } p { color: black; } .highlight { background: yellow; }"
parser = CSSParser(css)
rules = parser.parse()
print(f"Parsed {len(rules)} CSS rules")
```

---

### Step 3: Layout Engine (30 lines)

```python
"""Step 3: Compute layout - convert DOM tree to positioned boxes."""

class Box:
    def __init__(self, x=0, y=0, width=0, height=0, element=None):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.element = element
        self.children = []
        self.styles = {}

    def __repr__(self):
        return f"Box({self.x},{self.y} {self.width}x{self.height} <{self.element.tag_name if self.element else '?'}>)"

DEFAULT_FONT_SIZE = 16

def layout_element(elem, styles, width=800, x=0, y=0):
    """Lay out an element and its children."""
    style = styles.get(elem, {})
    font_size = int(style.get('font-size', str(DEFAULT_FONT_SIZE)).replace('px', ''))
    display = style.get('display', 'block')

    if display == 'none':
        return []

    if display == 'inline':
        # Inline elements flow horizontally
        boxes = []
        for child in elem.children:
            boxes.extend(layout_element(child, styles, width, x, y))
        return boxes

    # Block elements
    height = font_size * 1.5  # rough line height
    text = elem.inner_text
    if text:
        # Estimate width from text
        char_width = font_size * 0.6
        height = max(height, len(text) * char_width / width * font_size * 1.5)

    box = Box(x, y, width, height, elem)
    box.styles = style

    # Lay out children
    child_y = y + height
    for child in elem.children:
        child_boxes = layout_element(child, styles, width - 20, x + 10, child_y)
        box.children.extend(child_boxes)
        if child_boxes:
            child_y = max(child.y + child.height for child in child_boxes) + 5

    box.height = child_y - y
    return [box] + box.children

# Test with a basic layout
html = "<html><body><h1>Title</h1><p>Paragraph</p></body></html>"
dom = DOMBuilder().build(html)
css = "body { width: 800px; } h1 { color: blue; } p { color: black; }"
rules = CSSParser(css).parse()
styles = compute_styles(dom, rules)
boxes = layout_element(dom, styles)
for b in boxes:
    print(b)
```

---

### Step 4: Paint and Rasterize (20 lines)

```python
"""Step 4: Generate paint commands (pixel output)."""

class PaintCommand:
    FILL_RECT = 'fill_rect'
    DRAW_TEXT = 'draw_text'

class Painter:
    def __init__(self, width, height):
        self.width = width
        self.height = height
        self.pixels = [[(255, 255, 255) for _ in range(width)] for _ in range(height)]
        self.commands = []

    def add_rect(self, x, y, w, h, color):
        self.commands.append((PaintCommand.FILL_RECT, x, y, w, h, color))

    def add_text(self, text, x, y, color, font_size):
        self.commands.append((PaintCommand.DRAW_TEXT, text, x, y, color, font_size))

    def execute_commands(self):
        for cmd in self.commands:
            if cmd[0] == PaintCommand.FILL_RECT:
                _, x, y, w, h, color = cmd
                for py in range(max(0, int(y)), min(self.height, int(y + h))):
                    for px in range(max(0, int(x)), min(self.width, int(x + w))):
                        self.pixels[py][px] = color
            elif cmd[0] == PaintCommand.DRAW_TEXT:
                _, text, x, y, color, font_size = cmd
                # Simple: just color the rectangle where text would be
                text_w = len(text) * font_size * 0.6
                self.add_rect(x, y, text_w, font_size, color)

    def save_ppm(self, path):
        with open(path, 'w') as f:
            f.write(f"P3\n{self.width} {self.height}\n255\n")
            for row in self.pixels:
                for r, g, b in row:
                    f.write(f"{r}\n{g}\n{b}\n")

def paint_boxes(boxes, painter, default_color=(0, 0, 0)):
    """Generate paint commands for a list of boxes."""
    for box in boxes:
        styles = box.styles
        bg = styles.get('background-color', None)
        if bg:
            rgb = parse_color(bg)
            if rgb:
                painter.add_rect(box.x, box.y, box.width, box.height, rgb)
        if box.element and box.element.inner_text:
            font_size = int(styles.get('font-size', '16').replace('px', ''))
            color = parse_color(styles.get('color', 'black')) or default_color
            painter.add_text(box.element.inner_text, box.x, box.y, color, font_size)

def parse_color(color_str):
    """Parse CSS color to RGB tuple."""
    color_str = color_str.strip().lower()
    named = {'black': (0,0,0), 'white': (255,255,255), 'red': (255,0,0),
             'blue': (0,0,255), 'green': (0,128,0), 'yellow': (255,255,0)}
    if color_str in named:
        return named[color_str]
    if color_str.startswith('#'):
        hex_ = color_str[1:]
        if len(hex_) == 3:
            r = int(hex_[0]*2, 16)
            g = int(hex_[1]*2, 16)
            b = int(hex_[2]*2, 16)
            return (r, g, b)
        if len(hex_) == 6:
            return (int(hex_[0:2], 16), int(hex_[2:4], 16), int(hex_[4:6], 16))
    return None

# Test
painter = Painter(800, 600)
paint_boxes(boxes, painter)
painter.execute_commands()
painter.save_ppm('/tmp/output.ppm')
print("Rendered to /tmp/output.ppm")
```

---

### Step 5: JavaScript Engine (Simplified DOM API) (20 lines)

```python
"""Step 5: Simple JavaScript engine with DOM API."""

class JSContext:
    def __init__(self, dom):
        self.dom = dom
        self.globals = {'document': DocumentProxy(dom)}

class DocumentProxy:
    def __init__(self, dom):
        self.dom = dom

    def getElementById(self, id_):
        return ElementProxy(self._find_by_id(self.dom, id_))

    def querySelector(self, selector):
        elem = self._find_selector(self.dom, selector)
        return ElementProxy(elem) if elem else None

    def _find_by_id(self, node, id_):
        if node and node.attrs.get('id') == id_:
            return node
        for child in (node.children if node else []):
            result = self._find_by_id(child, id_)
            if result:
                return result
        return None

    def _find_selector(self, node, selector):
        if not node:
            return None
        if matches_selector(node, selector):
            return node
        for child in node.children:
            result = self._find_selector(child, selector)
            if result:
                return result
        return None

class ElementProxy:
    def __init__(self, elem):
        self.elem = elem

    def appendChild(self, child_elem):
        if self.elem:
            self.elem.append_child(child_elem)

    def setAttribute(self, name, value):
        if self.elem:
            self.elem.attrs[name] = value

    @property
    def innerHTML(self):
        return self.elem.inner_text if self.elem else ""

    @innerHTML.setter
    def innerHTML(self, value):
        if self.elem:
            self.elem.inner_text = value

    @property
    def textContent(self):
        return self.elem.inner_text if self.elem else ""

    def click(self):
        pass  # Event system would trigger handlers

def eval_js(js_code, context):
    """Minimal JS eval - supports basic DOM manipulation."""
    if 'document.getElementById' in js_code:
        import re
        match = re.search(r'getElementById\("([^"]+)"\)', js_code)
        if match:
            elem = context.globals['document'].getElementById(match.group(1))
            if 'innerHTML' in js_code:
                m = re.search(r'\.innerHTML\s*=\s*"([^"]*)"', js_code)
                if m:
                    elem.innerHTML = m.group(1)
                    return "OK"
    return "unimplemented"

# Test
dom = DOMBuilder().build("<div id='main'><p>Hello</p></div>")
ctx = JSContext(dom)
print(eval_js('document.getElementById("main").innerHTML = "Updated!"', ctx))
```

---

## Bridge to Production

| Our Browser | Real Browser |
|------------|--------------|
| Basic HTML lexer | Full tokenizer with proper entity handling |
| Regex CSS parser | Full CSS spec parser |
| Fixed-width layout | CSS Flexbox, Grid, float |
| No JavaScript engine | V8/SpiderMonkey (JIT, GC) |
| No compositing | GPU compositing layers |
| No networking | HTTP/2, TLS, HTTP cache |
| No sandboxing | Process isolation, Site Isolation |

> **Gap to fill**: Real browsers (Chromium, Firefox) have millions of lines of code, use speculative parsing, CSS cascade layers, CSS Grid/Flexbox layout algorithms, a full JavaScript engine with JIT compilation, a compositor for GPU-accelerated rendering, and network stacks with HTTP/2, TLS, and caching.

**Production systems to study:**
- [How Browsers Work (HTML5 Rocks)](https://web.dev/articles/howbrowserswork)
- [WebKit Architecture](https://webkit.org/blog/窗口/)
- [Chrome Rendering Pipeline](https://developers.google.com/web/updates/2018/09)
- [Writing a Browser Engine](https://github.com/mbrignone/the_lobster)

---

## Checklist

- [ ] Step 1: HTML lexer and DOM tree builder
- [ ] Step 2: CSS parser and selector matching
- [ ] Step 3: Layout engine (box tree)
- [ ] Step 4: Paint and rasterize
- [ ] Step 5: JavaScript engine (simplified DOM API)
- [ ] Add: CSS Flexbox/Grid layout
- [ ] Add: Full JavaScript execution (AST interpreter)
- [ ] Add: Networking (fetch, HTTP)