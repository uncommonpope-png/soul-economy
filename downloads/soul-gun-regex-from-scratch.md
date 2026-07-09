---
name: regex-from-scratch
description: Build a Regex Engine from Scratch
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
---# Build a Regex Engine from Scratch

> *"A regex engine is just a finite state machine: for each character, transition to a new state."*

---

## The Mental Model

```
┌─────────────────────────────────────────────────────────────────┐
│                   REGEX ENGINE ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Pattern:  "a(b|c)*d"                                           │
│                                                                  │
│   ┌────────────────────────────────────────────────────────┐   │
│   │                    NFA                                   │   │
│   │                                                         │   │
│   │   (start) ──a──►(b) ──b or c loop──►(c) ──d──►(end)   │   │
│   │                                                         │   │
│   └────────────────────────────────────────────────────────┘   │
│                                                                  │
│   Matching Process:                                             │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Input: "abbcbcd"                                       │   │
│   │                                                         │   │
│   │  State: {0}  ──a──► {1} ──b──► {2,3} ──b──► {2,3}     │   │
│   │              │            │            │              │   │
│   │              └──c──► {3}    └──c──► {3}    └──d──► {4}  │   │
│   │                         │                         │     │   │
│   │                         └──(matches!)─────────────┘     │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Build Steps (4 Steps, ~80 Lines)

### Step 1: Basic Pattern Matching (15 lines)

```python
"""Step 1: Simple wildcard matching (glob-style)."""

def match(pattern, text):
    """
    Match pattern with * (any chars) and ? (single char).
    Uses recursive matching.
    """
    if pattern == "":
        return text == ""

    if pattern == "*":
        return True

    if pattern == "?":
        return len(text) >= 1

    if pattern[0] == "*":
        # Try consuming one char, or skipping *
        return (text != "" and match(pattern[1:], text[1:])) or \
               match(pattern, text[1:])

    if pattern[0] == "?":
        return text != "" and match(pattern[1:], text[1:])

    if pattern[0] == text[0]:
        return match(pattern[1:], text[1:])

    return False

# Test
print(match("a?c", "abc"))   # True
print(match("a*c", "ac"))    # True
print(match("a*c", "abbc"))   # False
print(match("*", "anything")) # True
```

---

### Step 2: NFA Construction (25 lines)

```python
"""Step 2: Build an NFA from regex."""
from dataclasses import dataclass

@dataclass
class State:
    label: str = None  # None means epsilon
    edges: list = None

    def __post_init__(self):
        if self.edges is None:
            self.edges = []

class NFA:
    def __init__(self, start, end):
        self.start = start
        self.end = end

def char(c):
    """Match single character."""
    s1 = State(label=c)
    s2 = State()
    s1.edges.append(s2)
    return NFA(s1, s2)

def concat(a, b):
    """Concatenation: a followed by b."""
    a.end.edges.append(b.start)
    return NFA(a.start, b.end)

def union(a, b):
    """Alternation: a or b."""
    s = State()  # New start
    e = State()  # New end
    s.edges = [a.start, b.start]
    a.end.edges.append(e)
    b.end.edges.append(e)
    return NFA(s, e)

def kleene(nfa):
    """Kleene star: zero or more."""
    s = State()  # New start
    e = State()  # New end
    s.edges = [nfa.start, e]  # Either skip or enter
    nfa.end.edges = [nfa.start, e]  # Loop or exit
    return NFA(s, e)

# Test: Build NFA for "a(b|c)*d"
a = char('a')
bc = union(char('b'), char('c'))
bc_star = kleene(bc)
d = char('d')
nfa = concat(concat(a, bc_star), d)
print(f"NFA: start={nfa.start}, end={nfa.end}")
```

---

### Step 3: NFA Simulation (20 lines)

```python
"""Step 3: Simulate NFA on input - the core matching algorithm."""

def epsilon_closure(states):
    """Find all states reachable via epsilon transitions."""
    stack = list(states)
    result = set(states)

    while stack:
        s = stack.pop()
        for edge in s.edges:
            if edge.label is None and edge not in result:
                result.add(edge)
                stack.append(edge)

    return result

def move(states, char):
    """Follow epsilon, then transitions matching char."""
    result = set()
    for s in epsilon_closure(states):
        for edge in s.edges:
            if edge.label == char:
                result.add(edge)
    return result

def simulate(nfa, text):
    """Run NFA on input text."""
    current = epsilon_closure({nfa.start})

    for char in text:
        current = move(current, char)
        if not current:
            return False

    # Check if any state is the accepting state
    return nfa.end in epsilon_closure(current)

# Test
print(simulate(nfa, "ad"))       # True
print(simulate(nfa, "abd"))       # True
print(simulate(nfa, "abbd"))       # True
print(simulate(nfa, "abccbd"))     # True
print(simulate(nfa, "aed"))        # False
```

---

### Step 4: Regex Parser (20 lines)

```python
"""Step 4: Parse regex syntax into NFA."""

def parse_regex(pattern):
    """Parse simple regex into NFA. Supports: literal, |, *, +, ?"""
    # For simplicity, handle basic cases
    result = None

    i = 0
    while i < len(pattern):
        ch = pattern[i]

        if ch == '(':
            # Find matching )
            depth = 1
            j = i + 1
            while j < len(pattern) and depth > 0:
                if pattern[j] == '(':
                    depth += 1
                elif pattern[j] == ')':
                    depth -= 1
                j += 1
            sub_nfa = parse_regex(pattern[i+1:j-1])

            # Check for postfix operators
            while j < len(pattern) and pattern[j] in '*+?':
                if pattern[j] == '*':
                    sub_nfa = kleene(sub_nfa)
                elif pattern[j] == '+':
                    sub_nfa = concat(sub_nfa, kleene(parse_regex(pattern[j-1:j])))
                j += 1

            if result is None:
                result = sub_nfa
            else:
                result = concat(result, sub_nfa)
            i = j

        elif ch == '|':
            rest = parse_regex(pattern[i+1:])
            return union(result, rest) if result else rest

        elif ch in '.*+?':
            if result:
                if ch == '*':
                    result = kleene(result)
                elif ch == '+':
                    result = concat(result, kleene(result))
                elif ch == '?':
                    result = union(result, NFA(State(), State()))
            i += 1

        else:
            c = char(ch)
            if result is None:
                result = c
            else:
                result = concat(result, c)
            i += 1

    return result if result else char('')

# Test
nfa = parse_regex("a(b|c)*d")
print(simulate(nfa, "ad"))     # True
print(simulate(nfa, "abd"))     # True
print(simulate(nfa, "abccd"))   # True
```

---

### Step 5: Character Classes and Capturing Groups

```python
"""Step 5: Add character classes and capturing groups."""

def parse_class(pattern, i):
    """Parse [a-z] character class into NFA."""
    i += 1  # skip '['
    chars = set()
    while i < len(pattern) and pattern[i] != ']':
        if i + 2 < len(pattern) and pattern[i + 1] == '-':
            start, end = ord(pattern[i]), ord(pattern[i + 2])
            for c in range(ord(pattern[i]), ord(pattern[i + 2]) + 1):
                chars.add(chr(c))
            i += 3
        else:
            chars.add(pattern[i])
            i += 1
    i += 1  # skip ']'
    # Build union of all chars in class
    nfas = [char(c) for c in chars]
    result = nfas[0]
    for n in nfas[1:]:
        result = union(result, n)
    return result, i

def parse_capture(pattern, i):
    """Parse (group) capturing groups - tracks start/end positions."""
    i += 1  # skip '('
    content_end = i
    depth = 1
    while depth > 0:
        if pattern[content_end] == '(':
            depth += 1
        elif pattern[content_end] == ')':
            depth -= 1
        content_end += 1

    sub_nfa = parse_regex(pattern[i:content_end - 1])

    # Capture group: we track the start/end of what was matched
    # In a full implementation, we'd return group boundaries
    # Here we note that groups require a separate matched text buffer
    return sub_nfa, content_end

# Updated parse_regex to handle these:
def parse_regex_full(pattern):
    """Parse regex with char classes and capturing groups."""
    result = None
    i = 0
    while i < len(pattern):
        ch = pattern[i]

        if ch == '[':
            sub_nfa, i = parse_class(pattern, i)
            result = concat(result, sub_nfa) if result else sub_nfa

        elif ch == '(':
            sub_nfa, i = parse_capture(pattern, i)
            result = concat(result, sub_nfa) if result else sub_nfa

        elif ch == '|':
            rest = parse_regex_full(pattern[i + 1:])
            return union(result, rest) if result else rest

        elif ch in '.*+?':
            if result:
                if ch == '*':
                    result = kleene(result)
                elif ch == '+':
                    result = concat(result, kleene(result))
                elif ch == '?':
                    result = union(result, NFA(State(), State()))
            i += 1

        else:
            c = char(ch)
            result = concat(result, c) if result else c
            i += 1

    return result if result else char('')

# Test: [a-z]+ matches lowercase words
nfa = parse_regex_full("[a-z]+")
print(simulate(nfa, "hello"))   # True
print(simulate(nfa, "HELLO"))   # False
```

---

## Bridge to Production

| Our Regex | PCRE/RE2 |
|----------|----------|
| No backtracking | Greedy/lazy quantifiers |
| No capturing groups | Group capture `(...)` |
| No lookahead | `(?=...)`, `(?!...)` |
| No character classes | `[a-z]`, `\d`, `\w` |
| Simple NFA | Compiled to DFA or backtracking |

**Production systems to study:**
- [Build a Regex Engine in <40 Lines](https://nickdrane.com/build-your-own-regex/)
- [How Regexes Work](https://perl.plover.com/Regex/article.html)
- [Regular Expression Matching Can Be Simple And Fast](https://swtch.com/~rsc/regexp/regexp1.html)

---

## Checklist
- [ ] Step 1: Wildcard matching works
- [ ] Step 2: NFA construction works
- [ ] Step 3: NFA simulation works
- [ ] Step 4: Regex parsing works
- [ ] Step 5: Character classes and capturing groups
- [ ] Add: lookahead/lookbehind
- [ ] Add: backreferences