---
name: build-from-scratch
description: Build From Scratch: Learn by Creating
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
---# Build From Scratch: Learn by Creating

> *"What I cannot create, I do not understand."* — Richard Feynman

**This skill teaches by building. NOT by showing code.**

---

## The Teaching Method

Every build-from-scratch session follows this structure:

```
1. Problem Definition (5 min)
   └─ What is this? Why does it exist?

2. Mental Model (15 min)
   └─ How do the pieces fit together?

3. Incremental Build (60-120 min)
   └─ Step-by-step, each step produces working code

4. Validation (10 min)
   └─ Run it, see it work

5. Real-World Bridge (10 min)
   └─ How does this differ from production systems?
```

---

## MODE 1: Learn a Pattern (Conceptual)

Ask yourself: **"What would I build to understand X?"**

### The Universal Build Sequence

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  DEFINE     │ -> │  BUILD      │ -> │  TEST       │ -> │  EXTEND     │
│  Problem    │    │  Minimal    │    │  It Works   │    │  Feature    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Step 1: Identify the Core Abstractions

Before writing code, ask:

| Technology | Core Abstraction | Example |
|------------|-----------------|---------|
| Database | "A DB is a function: key -> value over time" | Map with durability |
| Web Server | "A server is: parse request -> process -> send response" | Socket + HTTP parser |
| Shell | "A shell is: read -> parse -> execute -> repeat" | REPL + fork |
| Git | "Git is: content -> hash -> store -> reference" | Content-addressable KV |
| Compiler | "A compiler is: text -> tokens -> tree -> instructions" | Lexer -> Parser -> Eval |
| Neural Net | "A NN is: weights + forward + backward + update" | Matrix ops |
| Blockchain | "A chain is: blocks + links + consensus" | Hash-linked list |
| React | "React is: state -> virtual DOM -> real DOM" | Diff + reconcile |
| Regex Engine | "A regex is: pattern -> NFA -> simulate -> match" | Thompson construction |
| Emulator | "An emulator is: fetch -> decode -> execute -> repeat" | CPU simulation |

---

## How to Apply This Method to Any Technology

### The Derived Step Template

For **any** technology you want to build from scratch:

**Step 1: Define the Core Abstraction (10 lines)**
```
Ask: What does this thing DO?
Ask: What's the simplest version that does it?
Ask: What data structures does it need?
→ Write a 10-line "hello world" that does the core thing
```

**Step 2: Add the Key Mechanism (20 lines)**
```
Pick the most important feature
Add it cleanly
Test: can it do more than before?
→ Write a 20-line extension
```

**Step 3: Handle Edge Cases (20 lines)**
```
Add error handling
Add one edge case
Test: does it break?
→ Write a 20-line improvement
```

**Step 4: Integrate and Validate (15 lines)**
```
Wire pieces together
Run end-to-end test
Compare to production reference
→ Write a 15-line integration + test
```

**Step 5: Bridge to Reality (5 lines)**
```
What's different in production?
What did we skip?
What should I study next?
→ Write the comparison table
```

---

## MODE 2A: Build a Regex Engine (5 Steps)

### Step 1: Regex Core Abstraction
```
A regex engine takes a pattern and a string, returns whether the string matches.
The core insight: patterns compile to NFAs (Non-deterministic Finite Automata),
and we simulate the NFA on the input string.
```

**Step 1: NFA Representation (30 lines)**

```python
"""Step 1: NFA representation."""
from dataclasses import dataclass
from enum import Enum, auto

class NFAState:
    def __init__(self, label=None, is_end=False):
        self.label = label
        self.is_end = is_end
        self.transitions = []

    def add_transition(self, char, target):
        self.transitions.append((char, target))

@dataclass
class NFA:
    start: NFAState
    end: NFAState

def char_nfa(ch):
    s1 = NFAState(label=f'start_{ch}')
    s2 = NFAState(label=f'end_{ch}', is_end=True)
    s1.add_transition(ch, s2)
    return NFA(s1, s2)

def concat_nfa(left, right):
    left.end.is_end = False
    left.end.add_transition(None, right.start)
    return NFA(left.start, right.end)

def union_nfa(top, bottom):
    s = NFAState(label='union_start')
    e = NFAState(label='union_end', is_end=True)
    s.add_transition(None, top.start)
    s.add_transition(None, bottom.start)
    top.end.is_end = False
    bottom.end.is_end = False
    top.end.add_transition(None, e)
    bottom.end.add_transition(None, e)
    return NFA(s, e)

def star_nfa(child):
    s = NFAState(label='star_start')
    e = NFAState(label='star_end', is_end=True)
    s.add_transition(None, child.start)
    s.add_transition(None, e)
    child.end.is_end = False
    child.end.add_transition(None, child.start)
    child.end.add_transition(None, e)
    return NFA(s, e)
```

**Test it:**
```python
ab = concat_nfa(char_nfa('a'), char_nfa('b'))
print("NFA: a followed by b")
a_or_b = union_nfa(char_nfa('a'), char_nfa('b'))
print("NFA: a or b")
a_star = star_nfa(char_nfa('a'))
print("NFA: zero or more a")
print("NFA representation: OK")
```

**Step 2: NFA Simulation (20 lines)**

```python
"""Step 2: Simulate NFA on input string."""

def epsilon_closure(states):
    result = set(states)
    stack = list(result)
    while stack:
        s = stack.pop()
        for char, target in s.transitions:
            if char is None and target not in result:
                result.add(target)
                stack.append(target)
    return result

def match_nfa(nfa, text):
    current = epsilon_closure({nfa.start})
    for ch in text:
        next_states = set()
        for s in current:
            for char, target in s.transitions:
                if char == ch:
                    next_states.add(target)
        current = epsilon_closure(next_states)
        if not current:
            return False
    return any(s.is_end for s in current)

assert match_nfa(concat_nfa(char_nfa('a'), char_nfa('b')), "ab") == True
assert match_nfa(concat_nfa(char_nfa('a'), char_nfa('b')), "ac") == False
assert match_nfa(star_nfa(char_nfa('a')), "aaa") == True
assert match_nfa(star_nfa(char_nfa('a')), "") == True
print("NFA simulation: OK")
```

**Step 3: Regex Parser (25 lines)**

```python
"""Step 3: Parse regex syntax into NFA."""

def parse_regex(pattern):
    i = 0
    def parse_atom():
        nonlocal i
        if i >= len(pattern):
            return char_nfa('')
        if pattern[i] == '(':
            i += 1
            result = parse_expr()
            assert pattern[i] == ')'
            i += 1
            return result
        ch = pattern[i]
        i += 1
        n = char_nfa(ch)
        if i < len(pattern) and pattern[i] == '*':
            i += 1
            n = star_nfa(n)
        return n

    def parse_concat():
        nonlocal i
        left = parse_atom()
        while i < len(pattern) and pattern[i] not in ')|':
            left = concat_nfa(left, parse_atom())
        return left

    def parse_expr():
        nonlocal i
        left = parse_concat()
        if i < len(pattern) and pattern[i] == '|':
            i += 1
            right = parse_expr()
            return union_nfa(left, right)
        return left

    return parse_expr()

def regex_match(pattern, text):
    nfa = parse_regex(pattern)
    return match_nfa(nfa, text)

assert regex_match("ab", "ab") == True
assert regex_match("a*b", "aaab") == True
assert regex_match("a|b", "b") == True
assert regex_match("(ab)*", "abab") == True
print("Regex parser + matcher: OK")
```

**Step 4: Integration + Test (15 lines)**

```python
"""Step 4: End-to-end test suite."""

tests = [
    ("a", "a", True),
    ("ab", "ab", True),
    ("a*", "", True),
    ("a*", "aaa", True),
    ("a+", "aaa", True),
    ("a+", "", False),
    ("a|b", "a", True),
    ("a|b", "b", True),
    ("(ab)+", "ababab", True),
    ("a*b+", "aaabbb", True),
]

for pat, txt, expected in tests:
    result = regex_match(pat, txt)
    assert result == expected, f"FAIL: {pat} vs '{txt}': {result} != {expected}"

print(f"All {len(tests)} tests passed!")
print("Regex engine: complete!")
```

---

## MODE 2B: Build a Compiler (5 Steps)

### Step 1: Compiler Core Abstraction
```
A compiler is a pipeline: text → tokens → tree → instructions.
The core is the recursive descent parser, which mirrors the grammar.
```

**Step 1: Lexer (20 lines)**

```python
"""Step 1: Lexer — text to tokens."""

from dataclasses import dataclass
from enum import Enum, auto

class TokenType(Enum):
    NUMBER = auto()
    IDENT = auto()
    PLUS = auto()
    MINUS = auto()
    STAR = auto()
    SLASH = auto()
    LPAREN = auto()
    RPAREN = auto()
    EOF = auto()

@dataclass
class Token:
    type: TokenType
    value: any | None
    line: int = 1

class Lexer:
    def __init__(self, source):
        self.source = source
        self.pos = 0
        self.line = 1

    def peek(self):
        return self.source[self.pos] if self.pos < len(self.source) else None

    def consume(self):
        ch = self.source[self.pos]
        self.pos += 1
        if ch == '\n':
            self.line += 1
        return ch

    def skip(self):
        while self.pos < len(self.source) and self.source[self.pos] in ' \t\n':
            self.consume()

    def number(self):
        start = self.line
        num = ""
        while self.pos < len(self.source) and self.source[self.pos].isdigit():
            num += self.consume()
        return Token(TokenType.NUMBER, int(num), start)

    def ident(self):
        start = self.line
        name = ""
        while self.pos < len(self.source) and self.source[self.pos].isalnum():
            name += self.consume()
        return Token(TokenType.IDENT, name, start)

    def next(self):
        self.skip()
        if self.pos >= len(self.source):
            return Token(TokenType.EOF, None, self.line)
        ch = self.peek()
        if ch.isdigit(): return self.number()
        if ch.isalpha(): return self.ident()
        single = {'+': TokenType.PLUS, '-': TokenType.MINUS,
                  '*': TokenType.STAR, '/': TokenType.SLASH,
                  '(': TokenType.LPAREN, ')': TokenType.RPAREN}
        if ch in single:
            self.consume()
            return Token(single[ch], ch, self.line)
        raise SyntaxError(f"Unknown: {ch}")

    def tokens(self):
        tok = self.next()
        while tok.type != TokenType.EOF:
            yield tok
            tok = self.next()
        yield tok
```

**Step 2: Parser (25 lines)**

```python
"""Step 2: Recursive descent parser."""

from dataclasses import dataclass

@dataclass
class Num:
    value: int

@dataclass
class BinOp:
    left: any
    op: str
    right: any

class Parser:
    def __init__(self, tokens):
        self.tokens = list(tokens)
        self.pos = 0

    def cur(self):
        return self.tokens[self.pos] if self.pos < len(self.tokens) else None

    def eat(self, tt):
        t = self.cur()
        if t and t.type == tt:
            self.pos += 1
            return t
        raise SyntaxError(f"Expected {tt}, got {t}")

    def parse(self):
        return self.expr()

    def expr(self):
        left = self.term()
        while self.cur() and self.cur().type.name in ('PLUS', 'MINUS'):
            op = self.cur().value
            self.pos += 1
            left = BinOp(left, op, self.term())
        return left

    def term(self):
        left = self.factor()
        while self.cur() and self.cur().type.name in ('STAR', 'SLASH'):
            op = self.cur().value
            self.pos += 1
            left = BinOp(left, op, self.factor())
        return left

    def factor(self):
        t = self.cur()
        if t.type.name == 'NUMBER':
            self.pos += 1
            return Num(t.value)
        if t.type.name == 'LPAREN':
            self.pos += 1
            e = self.parse()
            self.eat(TokenType.RPAREN)
            return e
        raise SyntaxError(f"Unexpected {t}")
```

**Step 3: Interpreter (15 lines)**

```python
"""Step 3: Tree-walking interpreter."""

def eval(node):
    if isinstance(node, Num):
        return node.value
    if isinstance(node, BinOp):
        l = eval(node.left)
        r = eval(node.right)
        return {'+': l+r, '-': l-r, '*': l*r, '/': l//r}[node.op]
    raise ValueError(f"Unknown: {node}")
```

**Step 4: Variables + Functions (25 lines)**

```python
"""Step 4: Add variables and functions."""

@dataclass
class Var:
    name: str

@dataclass
class Let:
    name: str
    body: any

@dataclass
class Func:
    name: str
    params: list
    body: any

@dataclass
class Call:
    name: str
    args: list

class Parser2(Parser):
    def expr(self):
        t = self.cur()
        if t.type == TokenType.IDENT:
            name = t.value
            self.pos += 1
            if self.cur() and self.cur().type.name == 'EQ':
                self.pos += 1
                return Let(name, self.parse())
            if self.cur() and self.cur().type.name == 'LPAREN':
                self.pos += 1
                args = []
                if self.cur().type != TokenType.RPAREN:
                    args.append(self.parse())
                    while self.cur() and self.cur().type.name == 'COMMA':
                        self.pos += 1
                        args.append(self.parse())
                self.eat(TokenType.RPAREN)
                return Call(name, args)
            return Var(name)
        return super().expr()

class Interpreter:
    def __init__(self):
        self.env = {}

    def eval(self, node):
        if isinstance(node, Num): return node.value
        if isinstance(node, Var): return self.env.get(node.name, 0)
        if isinstance(node, BinOp):
            l = self.eval(node.left); r = self.eval(node.right)
            return {'+':l+r,'-':l-r,'*':l*r,'/':l//r}[node.op]
        if isinstance(node, Let):
            val = self.eval(node.body)
            self.env[node.name] = val
            return val
        raise ValueError(f"Unknown: {node}")
```

**Step 5: Test + Extend (15 lines)**

```python
"""Step 5: End-to-end compiler test."""

def compile_run(src):
    tokens = list(Lexer(src).tokens())
    tree = Parser2(tokens).parse()
    return Interpreter().eval(tree)

assert compile_run("(3 + 4) * 2") == 14
assert compile_run("x = 10; x + 5") == 15
print("Compiler: OK")
print("Compiler has: lexer → parser → interpreter → variables")
```

---

## MODE 2C: Build a Database (already in database-from-scratch skill — link to it)

See `database-from-scratch` skill for the full 5-step database build.

---

## Pattern Matrix: 50-line Starter Templates

| Technology | Starter Template (~50 lines) |
|------------|------------------------------|
| **Database** | REPL → persistence → WAL → B-Tree (with split) → query engine |
| **Regex Engine** | NFA state → char/concat/union/star → epsilon closure → simulate |
| **Compiler** | Lexer → recursive descent → tree interpreter → variables → functions |
| **Web Server** | Socket → HTTP parser → router → static files → templates |
| **Shell** | REPL → tokenizer → path resolution → fork/exec → pipelines |
| **Git** | content hash → blob/tree/commit → refs → diff |
| **Neural Net** | forward → backward → update → SGD → train loop |
| **Emulator** | memory/registers → fetch/decode → execute → timer loop |
| **Blockchain** | block → hash → chain → merkle → consensus |
| **Game Engine** | fixed timestep → entity → input → collision → renderer |

---

## Bridge to Production (Comparison Tables)

| Our Regex | Production Regex (PCRE, RE2) |
|-----------|-------------------------------|
| Basic NFA | Thompson construction + DFA minimization |
| No backreferences | Backreferences, lookahead, greedy/lazy |
| No groups | Named groups, capture groups |
| 200 lines | 10K+ lines of C |

| Our Compiler | Production Compiler (LLVM, GCC) |
|-------------|--------------------------------|
| Tree-walking | Bytecode or machine code |
| No optimization | Constant folding, inlining, SSA |
| Single pass | Multi-phase (front/middle/back) |
| 100 lines | 100K+ lines |

| Our Database | Production DB (Postgres) |
|-------------|-------------------------|
| Single file | Tablespace, partitions |
| No transactions | ACID, MVCC, isolation levels |
| B-Tree basic | B-Tree with page splits, vacuum, compression |

---

## Common Mistakes

| Mistake | Why It's Wrong | Fix |
|---------|----------------|-----|
| Starting too big | Lose motivation, never finish | Start with 50 lines |
| Skipping mental model | Code without understanding | Always ask "why this way?" |
| Not testing each step | Bug cascades, hard to debug | Test after every change |
| Copy-pasting without understanding | Learn nothing | Close the tutorial, rebuild from memory |
| Skipping the bridge | Miss the bigger picture | Always ask "how is production different?" |
| Too many steps (>7) | Cognitive overload | Split into two skills |
| Too few steps (<4) | Not enough granularity | Merge adjacent steps |

---

## The Golden Rules

1. **Build to understand, not to copy**
2. **Small scope > ambitious scope**
3. **Working code at every step**
4. **Conceptual before implement**
5. **If you can't explain it simply, you don't understand it**

---

## When to Use This Skill

**USE when user says:**
- "I want to understand how databases work"
- "Build a simple web server from scratch"
- "How does a shell work?"
- "Teach me compilers by building one"
- "I want to learn neural networks from scratch"
- "Build a regex engine"
- "Build a blockchain"

**DON'T USE when:**
- User wants production-ready code
- User needs framework usage (not building from scratch)
- User is asking about a specific framework's API

---

## Reference Resources

Best tutorials by technology:

| Technology | Tutorial |
|------------|----------|
| Database | [Let's Build a Simple Database (C)](https://cstack.github.io/db_tutorial/) |
| Web Server | [Let's Build A Web Server (Python)](https://ruslanspivak.com/lsbaws-part1/) |
| Shell | [Write a Shell in C](https://brennan.io/2015/01/16/write-a-shell-in-c/) |
| Git | [Write yourself a Git](https://wyag.thb.lt/) |
| Compiler | [Let's Build A Simple Interpreter](https://ruslanspivak.com/lsbasi-part1/) |
| Neural Net | [A Neural Network in 11 lines of Python](https://iamtrask.github.io/2015/07/12/basic-python-network/) |
| Regex | [Build a Regex Engine](https://nickdrane.com/build-your-own-regex/) |
| Blockchain | [Learn Blockchains by Building One](https://hackernoon.com/learn-blockchains-by-building-one-117428612f46) |

---

## Final Reminder

The goal is **understanding through creation**.

If you can build a working version from scratch without looking at the tutorial, you understand it.

If you need to look at the tutorial to make every keystroke, you don't understand it yet.

The Feynman approach: **"What I cannot create, I do not understand."**