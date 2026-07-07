---
name: compiler-from-scratch
description: Build a Compiler from Scratch
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
---# Build a Compiler from Scratch

> *"A compiler is just a pipeline: text → tokens → tree → instructions."*

---

## The Mental Model

```
Source Code → Lexer → Tokens → Parser → AST → Evaluator → Result
                                        ↓
                                  [Each step is incremental.
                                   Save intermediate output.]
```

A compiler transforms text through a series of stages. Each stage is independently testable. Lexer converts characters to tokens (lexical analysis). Parser converts tokens to an AST (syntactic analysis). Evaluator walks the tree and computes the result (semantic analysis / execution).

---

## The Build Steps (5 Steps, ~120 Lines)

### Step 1: The Lexer (20 lines)

```python
"""Step 1: Convert source text into tokens."""
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
    EQ = auto()
    EOF = auto()

@dataclass
class Token:
    type: TokenType
    value: any | None
    line: int = 1
    col: int = 1

class Lexer:
    def __init__(self, source):
        self.source = source
        self.pos = 0
        self.line = 1
        self.col = 1

    def peek(self):
        if self.pos < len(self.source):
            return self.source[self.pos]
        return None

    def consume(self):
        ch = self.source[self.pos]
        self.pos += 1
        if ch == '\n':
            self.line += 1
            self.col = 1
        else:
            self.col += 1
        return ch

    def skip_whitespace(self):
        while self.pos < len(self.source) and self.source[self.pos] in ' \t\n':
            self.consume()

    def number(self):
        start = self.col
        num = ""
        while self.pos < len(self.source) and self.source[self.pos].isdigit():
            num += self.consume()
        return Token(TokenType.NUMBER, int(num), self.line, start)

    def ident(self):
        start = self.col
        name = ""
        while self.pos < len(self.source) and self.source[self.pos].isalnum():
            name += self.consume()
        return Token(TokenType.IDENT, name, self.line, start)

    def next_token(self):
        self.skip_whitespace()
        if self.pos >= len(self.source):
            return Token(TokenType.EOF, None, self.line, self.col)

        ch = self.peek()
        start = self.col

        if ch.isdigit():
            return self.number()
        if ch.isalpha() or ch == '_':
            return self.ident()

        single = {'+': TokenType.PLUS, '-': TokenType.MINUS,
                  '*': TokenType.STAR, '/': TokenType.SLASH,
                  '(': TokenType.LPAREN, ')': TokenType.RPAREN}
        if ch in single:
            self.consume()
            return Token(single[ch], ch, self.line, start)

        raise SyntaxError(f"Unknown char '{ch}' at {self.line}:{self.col}")

    def tokens(self):
        tok = self.next_token()
        while tok.type != TokenType.EOF:
            yield tok
            tok = self.next_token()
        yield tok

if __name__ == "__main__":
    src = "(3 + 4) * 2"
    for tok in Lexer(src).tokens():
        print(tok)
```

### Step 2: The Parser (30 lines)

```python
"""Step 2: Convert tokens into an AST."""
from dataclasses import dataclass
from step1_lexer import Lexer, TokenType

@dataclass
class NumLiteral:
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

    def current(self):
        return self.tokens[self.pos] if self.pos < len(self.tokens) else None

    def eat(self, type_):
        tok = self.current()
        if tok and tok.type == type_:
            self.pos += 1
            return tok
        raise SyntaxError(f"Expected {type_}, got {tok}")

    def parse(self):
        return self.expr()

    def expr(self):
        left = self.term()
        while self.current() and self.current().type.name in ('PLUS', 'MINUS'):
            op = self.current().value
            self.pos += 1
            right = self.term()
            left = BinOp(left, op, right)
        return left

    def term(self):
        left = self.factor()
        while self.current() and self.current().type.name in ('STAR', 'SLASH'):
            op = self.current().value
            self.pos += 1
            right = self.factor()
            left = BinOp(left, op, right)
        return left

    def factor(self):
        tok = self.current()
        if tok.type.name == 'NUMBER':
            self.pos += 1
            return NumLiteral(tok.value)
        if tok.type.name == 'LPAREN':
            self.pos += 1
            expr = self.parse()
            self.eat(TokenType.RPAREN)
            return expr
        raise SyntaxError(f"Unexpected {tok}")

if __name__ == "__main__":
    src = "(3 + 4) * 2"
    tokens = list(Lexer(src).tokens())
    tree = Parser(tokens).parse()
    print(tree)
```

### Step 3: The Interpreter (25 lines)

```python
"""Step 3: Evaluate the AST to get a result."""
from dataclasses import dataclass
from step1_lexer import Lexer, TokenType
from step2_parser import Parser, NumLiteral, BinOp

def evaluate(node):
    if isinstance(node, NumLiteral):
        return node.value
    if isinstance(node, BinOp):
        left = evaluate(node.left)
        right = evaluate(node.right)
        if node.op == '+': return left + right
        if node.op == '-': return left - right
        if node.op == '*': return left * right
        if node.op == '/': return left // right
    raise ValueError(f"Unknown node: {node}")

if __name__ == "__main__":
    src = "(3 + 4) * 2"
    tokens = list(Lexer(src).tokens())
    tree = Parser(tokens).parse()
    result = evaluate(tree)
    print(f"{src} = {result}")
    assert result == 14, f"Expected 14, got {result}"
    print("Interpreter self-test: PASS")
```

### Step 4: Add Variables (15 lines)

```python
"""Step 4: Add variables and assignment."""
from dataclasses import dataclass
from step1_lexer import Lexer, TokenType
from step2_parser import Parser, NumLiteral, BinOp

@dataclass
class VarRef:
    name: str

@dataclass
class Assignment:
    name: str
    value: any

class Interpreter2:
    def __init__(self):
        self.env = {}

    def evaluate(self, node):
        if isinstance(node, NumLiteral):
            return node.value
        if isinstance(node, VarRef):
            return self.env.get(node.name)
        if isinstance(node, BinOp):
            left = self.evaluate(node.left)
            right = self.evaluate(node.right)
            if node.op == '+': return left + right
            if node.op == '-': return left - right
            if node.op == '*': return left * right
            if node.op == '/': return left // right
        if isinstance(node, Assignment):
            value = self.evaluate(node.value)
            self.env[node.name] = value
            return value

if __name__ == "__main__":
    interp = Interpreter2()
    src = "x = (3 + 4) * 2"
    tokens = list(Lexer(src).tokens())
    tree = Parser(tokens).parse()
    result = interp.evaluate(tree)
    assert result == 14, f"Expected 14, got {result}"
    print(f"Assignment test: x = {result} — PASS")
```

### Step 5: Add Functions (10 lines)

```python
"""Step 5: Add function definitions and calls."""
from dataclasses import dataclass

@dataclass
class FuncDef:
    name: str
    params: list
    body: any

@dataclass
class FuncCall:
    name: str
    args: list

class Interpreter3(Interpreter2):
    def evaluate(self, node):
        if isinstance(node, FuncDef):
            self.env[node.name] = node
            return None
        if isinstance(node, FuncCall):
            func = self.env[node.name]
            args = [self.evaluate(a) for a in node.args]
            old_env = self.env.copy()
            for param, arg in zip(func.params, args):
                self.env[param] = arg
            result = self.evaluate(func.body)
            self.env = old_env
            return result
        return super().evaluate(node)
```

---

## Architecture

```
Source code ("x = (3 + 4) * 2")
  ↓ Lexer (step1_lexer.py)
Tokens [IDENT("x"), EQ, NUM(3), PLUS, NUM(4), STAR, NUM(2)]
  ↓ Parser (step2_parser.py)
AST: Assignment("x", BinOp(BinOp(Num(3), +, Num(4)), *, Num(2)))
  ↓ Evaluator
Result: 14
```

## Bridge to Production

| Our Toy Compiler | Production Compiler |
|-----------------|---------------------|
| Single file, 3 modules | Multi-file, cross-language |
| Tree-walking | Bytecode or machine code |
| No type checking | Type inference, type checking |
| No optimization | Constant folding, inlining |
| Simple AST | SSA form, control flow graph |

**Production systems to study:**
- [Crafting Interpreters](http://www.craftinginterpreters.com/) - Best book
- [Let's Build a Simple Interpreter](https://ruslanspivak.com/lsbasi-part1/) - 14 parts
- [mal - Make a Lisp](https://github.com/kanaka/mal) - 60+ languages

---

## Checklist

- [ ] Step 1: Lexer produces tokens (including EOF)
- [ ] Step 2: Parser builds AST
- [ ] Step 3: Interpreter evaluates
- [ ] Step 4: Variables work
- [ ] Step 5: Functions work
- [ ] Build your own language with: if/while/functions
- [ ] Explain: why `value: any | None` is needed (EOF can have no value)
