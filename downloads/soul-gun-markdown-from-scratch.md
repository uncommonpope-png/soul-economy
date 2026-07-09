---
name: markdown-from-scratch
description: Build a Markdown Parser From Scratch
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
---# Build a Markdown Parser From Scratch

---
name: markdown-from-scratch
description: Use when user wants to understand how markdown parsers work, build a markdown-to-HTML converter, or learn about text parsing and rendering. Triggers on: "build markdown parser", "markdown", "text parsing", "rendering".
---

## The Mental Model
Markdown is text with lightweight syntax. You scan line-by-line, matching patterns (regex), and emit HTML. The key insight: each block type has a distinct start pattern. Parse greedily from top to bottom, matching the most specific pattern first, then recursing into sub-parsers for nested content.

## Step 1: Line Classification
Classify each line first—then handle rendering based on type. Line types: heading, blockquote, code fence, unordered list, ordered list, horizontal rule, blank line, paragraph.

```python
import re

def classify_line(line):
    if re.match(r'^#{1,6} ', line):
        return 'heading'
    if line.startswith('> '):
        return 'blockquote'
    if line.startswith('```'):
        return 'code_fence'
    if re.match(r'^[*+-] ', line):
        return 'ul_item'
    if re.match(r'^\d+\. ', line):
        return 'ol_item'
    if re.match(r'^(---|\*\*\*|\-\-\-)$', line):
        return 'hr'
    if line.strip() == '':
        return 'blank'
    return 'paragraph'
```

## Step 2: Inline Code and Escaping
Before block-level parsing, handle special characters within lines:

```python
# Escape character sequences
BACKSLASH_RE = re.compile(r'\\([^\\`*\[\]()#>+\-_.!~*])')

# Inline code: `code`
INLINE_CODE_RE = re.compile(r'`([^`]+)`')

# Auto-links: <http://url>
AUTO_LINK_RE = re.compile(r'<([^>]+)>')

def escape_html(text):
    return (text
        .replace('&', '&')
        .replace('<', '<')
        .replace('>', '>'))
```

## Step 3: Block-Level Parsing (Headings + HR)
Map heading level to HTML tag:

```python
def parse_heading(line):
    level = len(re.match(r'^+', line).group())
    text = line[level+1:]
    return f'<h{level}>{inline_parse(text)}</h{level}>'

def parse_hr(line):
    return '<hr>'
```

## Step 4: Lists (Nested with Indentation Tracking)
Track indentation level. When indent increases, start a nested list. When indent decreases, close nested list.

```python
def parse_list(lines, is_ordered=False):
    """Parse a list with proper indentation-based nesting."""
    tag = 'ol' if is_ordered else 'ul'
    html = [f'<{tag}>']
    i = 0
    while i < len(lines):
        line = lines[i]
        # Detect indent level
        stripped = line.lstrip()
        indent = len(line) - len(stripped)
        marker = stripped[0] if stripped else ''
        is_bullet = marker in '*+-'
        is_number = marker.isdigit() and '.' in stripped[1:3]

        if (is_ordered and is_number) or (not is_ordered and is_bullet):
            # Extract content after marker
            content = stripped[1:].strip()
            html.append(f'<li>{inline_parse(content)}</li>')
        else:
            # End of this list
            break
        i += 1
    html.append(f'</{tag}>')
    return '\n'.join(html)

# For block parsing with nested lists:
def parse_nested_list(lines, start_idx):
    """Parse list that may contain nested sublists."""
    results = []
    i = start_idx
    while i < len(lines):
        line = lines[i]
        stripped = line.lstrip()
        if stripped and (stripped[0] in '*+-' or stripped[0].isdigit()):
            is_ordered = stripped[0].isdigit()
            results.append(line)
        elif not stripped.strip():
            i += 1
            continue
        else:
            break
        i += 1
    return results, i
```

## Step 5: Code Blocks and Full Pipeline
Recursive descent. Parse the document by walking through blocks, grouping by type:

```python
def parse_block(text):
    lines = text.split('\n')
    html = ['<article>']
    i = 0
    while i < len(lines):
        line = lines[i]
        kind = classify_line(line)
        if kind == 'heading':
            html.append(parse_heading(line))
            i += 1
        elif kind == 'blank':
            i += 1
        elif kind == 'code_fence':
            lang = line[3:]
            j = i + 1
            while j < len(lines) and not lines[j].startswith('```'):
                j += 1
            code = escape_html('\n'.join(lines[i+1:j]))
            html.append(f'<pre><code class="language-{lang}">{code}</code></pre>')
            i = j + 1
        elif kind in ('ul_item', 'ol_item'):
            is_ordered = kind == 'ol_item'
            start = i
            while i < len(lines) and classify_line(lines[i]) == kind:
                i += 1
            html.append(parse_list(lines[start:i], is_ordered))
        else:
            html.append(f'<p>{inline_parse(line.strip())}</p>')
            i += 1
    html.append('</article>')
    return '\n'.join(html)

def inline_parse(text):
    text = escape_html(text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', text)
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    return text

def markdown_to_html(md):
    return parse_block(md.strip())
```

## Architecture
```
Markdown text
  → Line classifier
  → Group consecutive lines by block type
  → Block renderer per type
      → inline parser (em, strong, code, links, images)
  → HTML output
```

## Bridge to Production
- **Mini version**: String regex, no parser combinators. Real parsers (CommonMark, MDX, remark) use proper tokenizers, parse trees, AST transforms, and plugin systems.
- **Production concerns**: Full CommonMark compatibility (600+ test cases), parser combinators, AST with ranges, footnotes, tables, task lists, strikethrough, autolinks, HTML sanitization, plugin architecture, syntax highlighting integration.

## Reference Tutorials
- [Writing a Markdown Parser from Scratch in Python](https://www.joshcheetham.com/projects/markdown-parser/in-python/)
- [Build a markdown parser in Python](https://jyogthos.github.io/Markdown.html)
- [Write a Markdown parser in Python 3](https://www.johndcook.com/mdparser)

## Checklist
- [ ] Step 1: Line classification
- [ ] Step 2: Inline code and escaping
- [ ] Step 3: Block-level parsing (headings, HR)
- [ ] Step 4: Lists with indentation tracking
- [ ] Step 5: Code blocks and full pipeline
- [ ] Add: blockquotes, tables, strikethrough
