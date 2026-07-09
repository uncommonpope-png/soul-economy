---
name: text-editor-from-scratch
description: Build a Text Editor From Scratch
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
---# Build a Text Editor From Scratch

---
name: text-editor-from-scratch
description: Use when user wants to understand how text editors work, build an editor or IDE, or learn about buffer management, cursor control, and rendering. Triggers on: "build text editor", "buffer", "cursor", "gap buffer", "syntax highlighting".
---

## The Mental Model
A text editor is a state machine. It has a buffer (the file contents/working copy), a cursor position, a viewport (visible window), and a set of modes. Keystrokes trigger commands that update the state. Display is just rendering the state to the screen using terminal escape codes or a GUI canvas.

## Step 1: Buffer Data Structure
The core data structure holds the text. The simplest model: a vector of lines. For performance, you need a gap buffer or rope (where insertions in the middle are O(1) instead of O(n) per line shift).

```python
class Buffer:
    def __init__(self):
        self.lines = ['']  # gap buffer approach
        self.gap_start = 0
        self.gap_end = len(self.lines)
        self.cursor = 0  # (row, col)
        self.viewport_y = 0

    def insert_char(self, c):
        idx = self.cursor_to_idx()
        if idx == self.gap_start:
            self.gap_start += 1
            self.gap_end += 1
            self.lines[self.gap_start-1:self.gap_start-1] = [c]
        else:
            self.lines.insert(idx, c)
        self.cursor_col += 1

    def insert_newline(self):
        row, col = self.cursor
        self.lines = self.lines[:row] + [''] + self.lines[row:]
        self.cursor = (row + 1, 0)

    def delete_char(self):
        row, col = self.cursor
        if col == 0 and row > 0:
            # Merge with previous line
            prev_len = len(self.lines[row - 1])
            self.lines[row - 1] += self.lines[row]
            del self.lines[row]
            self.cursor = (row - 1, prev_len)
        elif col > 0:
            self.lines[row] = self.lines[row][:col-1] + self.lines[row][col:]
            self.cursor = (row, col - 1)

    def cursor_to_idx(self):
        row, col = self.cursor
        return sum(len(l) + 1 for l in self.lines[:row]) + col
```

## Step 2: Rendering to Screen
Read the buffer and write lines to the terminal. Use ANSI escape codes for cursor movement, color, clearing.

```python
CLEAR = '\x1b[2J'
HIDE_CURSOR = '\x1b[?25l'
SHOW_CURSOR = '\x1b[?25h'
MOVE = lambda r, c: f'\x1b[{r};{c}H'
BRIGHT = '\x1b[1m'
RED = '\x1b[31m'
RESET = '\x1b[0m'

def render(b: Buffer):
    sys.stdout.write(CLEAR + HIDE_CURSOR)
    screenheight = shutil.get_terminal_size().lines
    for y in range(screenheight):
        line_idx = b.viewport_y + y
        if line_idx < len(b.lines):
            line = b.lines[line_idx]
        else:
            line = '~'
        if line_idx == b.cursor_row:
            # Render line with cursor
            line = line[:b.cursor_col] + RED + line[b.cursor_col] + RESET
        sys.stdout.write(MOVE(y + 1, 1) + line)
    sys.stdout.write(MOVE(b.cursor_row - b.viewport_y + 1, b.cursor_col + 1))
    sys.stdout.write(SHOW_CURSOR)
    sys.stdout.flush()
```

## Step 3: Keyboard Handling
Read keypresses (including special keys). In raw mode, each keypress is a sequence of bytes. Arrow keys are multi-byte escapes (`\x1b[A` up, `\x1b[B` down, etc.).

```python
import tty, termios, sys

def get_key():
    fd = sys.stdin.fileno()
    old = termios.tcgetattr(fd)
    tty.setraw(fd)
    ch = sys.stdin.read(1)
    if ch == '\x1b':
        ch += sys.stdin.read(2)  # read arrow/escape sequence
    termios.tcsetattr(fd, termios.TCSANOW, old)
    return ch

def handle_key(b: Buffer, c: str):
    if c == 'q' and b.mode == 'normal':
        return False
    elif c in ('h', '\x1b[D') and b.mode == 'normal':  # left
        move_cursor(b, 0, -1)
    elif c in ('j', '\x1b[B') and b.mode == 'normal':  # down
        move_cursor(b, 1, 0)
    elif c in ('k', '\x1b[A') and b.mode == 'normal':  # up
        move_cursor(b, -1, 0)
    elif c in ('l', '\x1b[C') and b.mode == 'normal':  # right
        move_cursor(b, 0, 1)
    elif c in ('i', 'a', 'o') and b.mode == 'normal':
        b.mode = 'insert'
    elif c == '\x1b':  # escape
        b.mode = 'normal'
    elif b.mode == 'insert':
        if c == '\r':
            b.insert_newline()
        elif c == '\x7f':  # backspace
            b.delete_char()
        elif len(c) == 1:
            b.insert_char(c)
    return True
```

## Step 4: Search, Undo/Redo
Add `:i` mini-command interface for search, save, load. Use undo history as a stack of buffer snapshots:

```python
def undo(b: Buffer):
    if b.undo_stack:
        b.redo_stack.append(b.get_state())
        b.restore_state(b.undo_stack.pop())

def redo(b: Buffer):
    if b.redo_stack:
        b.undo_stack.append(b.get_state())
        b.restore_state(b.redo_stack.pop())

def search(b: Buffer, pattern):
    for i, line in enumerate(b.lines):
        col = line.find(pattern)
        if col >= 0:
            b.cursor = (i, col)
            return
```

## Step 5: File I/O
Load from disk, write to disk, handle large files by loading around cursor (view-based):

```python
def load_file(b: Buffer, path):
    with open(path, 'r') as f:
        b.lines = f.read().splitlines()
        if not b.lines:
            b.lines = ['']
    b.cursor = (0, 0)
    b.undo_stack = []

def save_file(b: Buffer, path):
    with open(path, 'w') as f:
        f.write('\n'.join(b.lines))
```

## Architecture
```
Keypress
  → decode (escape sequences, multi-byte)
  → command dispatcher (mode-aware)
  → buffer update (insert, delete, move)
  → viewport update (scroll, page)
  → render (full redraw OR delta update)
  → terminal escape codes
```

## Bridge to Production
- **Mini version**: Single file, gap buffer, basic ANSI rendering, vi-like modal. Real editors (VS Code, Neovim) use tree-sitter for syntax-aware operations, rope data structure for efficient large file handling, diff-based rendering, multiple cursors, folds, LSP integration, virtual text for inline errors, WebGL canvas for GPU-accelerated rendering.
- **Production concerns**: Efficient large file handling (memory-mapped files, tree-sitter), syntax highlighting (tokenizers, themes), LSP for intelligent completions, undo tree (not stack—vim-style undos/redos), splits, registers, macros, marks, diff-mode, merge tools.

## Checklist
- [ ] Step 1: Buffer data structure
- [ ] Step 2: Rendering to screen (ANSI escape codes)
- [ ] Step 3: Keyboard handling and modes
- [ ] Step 4: Search, undo/redo
- [ ] Step 5: File I/O
- [ ] Add: syntax highlighting (tokenizer)
- [ ] Add: multiple buffers/tabs

## Reference Tutorials
- [Build Your Own Text Editor (Dan Luu)](https://view.sourcegraph.com/danluu/misc/3/text_editor)
- [Build a text editor in Python (Pconsarr)](https://www.trysecretly.com/post/text-editor-in-python-300-lines)
- [Writing a TUI text editor from scratch](https://github.com/haxworx/bytetracker)
- [Build a text editor from scratch (Charlie McDowell)](https://github.com/EpocDotFr/kano)
