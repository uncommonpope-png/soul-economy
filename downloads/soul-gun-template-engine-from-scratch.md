---
name: template-engine-from-scratch
description: Build a Template Engine from Scratch
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
---# Build a Template Engine from Scratch

---
name: template-engine-from-scratch
description: Use when user wants to build a template engine, understand template rendering, or learn about string interpolation, template syntax, and whitespace control. Triggers on: "build template engine", "template", "render", "templating", "mustache".
---

## The Mental Model

A template engine transforms a template string with markup into rendered output. It works in phases: parse template structure, build an AST or intermediate representation, then render with variable substitution. The key challenges are escaping (HTML safety), context-aware behavior (conditionals/loops), and whitespace control.

### Step 1: Simple Interpolation (15 lines)

```python
"""Step 1: Basic {{variable}} replacement."""

import re

class Template:
    def __init__(self, template):
        self.template = template

    def render(self, **vars):
        """Render template with variables."""
        result = self.template

        # Replace {{variable}}
        for match in re.finditer(r'\{\{(\w+)\}\}', self.template):
            var = match.group(1)
            value = vars.get(var, '')
            result = result.replace(match.group(0), str(value))

        return result

# Test
t = Template("Hello, {{name}}! You have {{count}} messages.")
print(t.render(name="Alice", count=5))
```

---

### Step 2: Conditionals and Loops (25 lines)

```python
"""Step 2: Add conditionals and loops."""

class Template2:
    def __init__(self, template):
        self.template = template

    def render(self, **vars):
        result = self.template

        # Conditionals: {{#if var}}...{{/if}}
        result = self._render_if(result, vars)

        # Loops: {{#each var}}...{{/each}}
        result = self._render_each(result, vars)

        # Variables: {{var}}
        result = self._render_vars(result, vars)

        return result

    def _render_if(self, text, vars):
        pattern = r'\{\{#if (\w+)\}\}(.*?)\{\{/if\}\}'

        while True:
            match = re.search(pattern, text, re.DOTALL)
            if not match:
                break

            var_name = match.group(1)
            content = match.group(2)

            if vars.get(var_name):
                text = text[:match.start()] + content + text[match.end():]
            else:
                text = text[:match.start()] + text[match.end():]

        return text

    def _render_each(self, text, vars):
        pattern = r'\{\{#each (\w+)\}\}(.*?)\{\{/each\}\}'

        while True:
            match = re.search(pattern, text, re.DOTALL)
            if not match:
                break

            var_name = match.group(1)
            content = match.group(2)
            items = vars.get(var_name, [])

            rendered = ''
            for item in items:
                if isinstance(item, dict):
                    # Replace {{key}} in content with item values
                    row = content
                    for k, v in item.items():
                        row = row.replace(f'{{{{{k}}}}}', str(v))
                    rendered += row
                else:
                    rendered += content.replace('{{{.}}}', str(item))

            text = text[:match.start()] + rendered + text[match.end():]

        return text

    def _render_vars(self, text, vars):
        for match in re.finditer(r'\{\{(\w+)\}\}', text):
            var = match.group(1)
            text = text.replace(match.group(0), str(vars.get(var, '')))
        return text

# Test
t = Template2("Items: {{#each items}}{{name}}, {{/each}}")
print(t.render(items=[{'name': 'Apple'}, {'name': 'Banana'}]))
```

---

### Step 3: Inheritance and Partials (20 lines)

```python
"""Step 3: Template inheritance and partials."""

class TemplateEngine:
    def __init__(self):
        self.templates = {}
        self.partials = {}

    def define(self, name, template):
        self.templates[name] = template

    def partial(self, name, template):
        self.partials[name] = template

    def render(self, template_name, **vars):
        template = self.templates.get(template_name, '')

        # Layout inheritance: {{#extend "base"}}{{#block "content"}}...{{/block}}{{/extend}}
        while '{{#extend' in template:
            match = re.search(r'\{\{#extend "([^"]+)"\}\}(.*?)\{\{/extend\}\}', template, re.DOTALL)
            if not match:
                break

            layout_name = match.group(1)
            child_content = match.group(2)
            layout = self.templates.get(layout_name, '')

            # Replace blocks
            for block_match in re.finditer(r'\{\{#block "([^"]+)"\}\}(.*?)\{\{/block\}\}', child_content, re.DOTALL):
                block_name = block_match.group(1)
                block_content = block_match.group(2)
                layout = re.sub(r'\{\{#block "' + block_name + r'"\}\}.*?\{\{/block\}\}',
                               block_content, layout, flags=re.DOTALL)

            template = layout

        # Replace partials: {{> partial_name}}
        while '{{>' in template:
            template = re.sub(r'\{\{> (\w+)\}\}',
                            lambda m: self.partials.get(m.group(1), ''),
                            template)

        # Render variables
        template = Template2(template).render(**vars)

        return template

# Test
engine = TemplateEngine()
engine.define("page", "Layout: {{> header}} Content: {{{content}}} Footer")
engine.partial("header", "== Site Header ==")
print(engine.render("page", content="Hello World!"))
```

---

### Step 4: Escaping and Filters (10 lines)

```python
"""Step 4: Add escaping and filters."""

class SafeTemplate(Template2):
    def __init__(self, template, escape_func=None):
        super().__init__(template)
        self.escape = escape_func or (lambda x: x.replace('<', '&lt;').replace('>', '&gt;'))

    def render(self, **vars):
        # Process filters: {{var | filter}}
        text = self.template
        for match in re.finditer(r'\{\{(\w+)\s*\|\s*(\w+)\}\}', text):
            var, filter_name = match.group(1), match.group(2)
            value = vars.get(var, '')
            if filter_name == 'escape':
                value = self.escape(value)
            elif filter_name == 'upper':
                value = value.upper()
            elif filter_name == 'lower':
                value = value.lower()
            text = text.replace(match.group(0), str(value))
        return super().render(**vars)
```

---

### Step 5: Error Messages and Whitespace Control

```python
"""Step 5: Add error messages and whitespace control."""

class TemplateError(Exception):
    def __init__(self, message, position=None, template=None):
        self.message = message
        self.position = position
        self.template = template
        super().__init__(self._format())

    def _format(self):
        msg = self.message
        if self.position and self.template:
            lines = self.template[:self.position].split('\n')
            line_no = len(lines)
            col = len(lines[-1]) + 1
            msg += f" at line {line_no}, column {col}\n"
            msg += f"  {lines[-1]}\n"
            msg += " " * (col - 1) + "^"
        return msg

class StrictTemplate(Template2):
    def __init__(self, template):
        super().__init__(template)
        self.template = template

    def render(self, **vars):
        result = self.template
        # Check for undefined variables
        undefined = []
        for match in re.finditer(r'\{\{(\w+)\}\}', result):
            if match.group(1) not in vars:
                undefined.append(match.group(1))
        if undefined:
            raise TemplateError(
                f"Undefined variables: {', '.join(set(undefined))}",
                position=match.start(),
                template=self.template
            )
        return super().render(**vars)

# Whitespace control: trim leading/trailing whitespace per line
class WhitespaceTemplate(Template2):
    def render(self, **vars):
        result = super().render(**vars)
        lines = result.split('\n')
        trimmed = [line.rstrip() for line in lines]
        result = '\n'.join(trimmed)
        return result

# Test error handling
try:
    t = StrictTemplate("Hello, {{name}}! Count: {{count}}")
    print(t.render(name="Alice"))  # Missing 'count'
except TemplateError as e:
    print(f"Template error: {e}")
```

## Checklist
- [ ] Step 1: Variable interpolation
- [ ] Step 2: Conditionals and loops
- [ ] Step 3: Inheritance and partials
- [ ] Step 4: Escaping and filters
- [ ] Step 5: Error messages and whitespace control
- [ ] Add: auto-escaping contexts (HTML vs JS vs URL)
- [ ] Add: template caching/compilation