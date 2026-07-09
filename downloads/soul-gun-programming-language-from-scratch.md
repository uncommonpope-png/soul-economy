# Build a Programming Language From Scratch

## Mental Model
A programming language is a system for expressing computations. The core abstraction is: `program = syntax + semantics`. The key insight is that the syntax defines what programs look like, and the semantics define what they mean.

## Step 1: Lexer (Tokenizer)
The lexer reads characters and emits tokens. Each token has a type (IDENTIFIER, NUMBER, PLUS, etc.) and a value. Input: `"42 + foo"`. Output: `[NUM(42), PLUS, IDENT("foo")]`.

```python
import re

def tokenize(code):
    token_specification = [
        ('NUMBER', r'\d+'),
        ('IDENTIFIER', r'[a-zA-Z_][a-zA-Z0-9_]*'),
        ('PLUS', r'\+'),
        ('MINUS', r'-'),
        ('MULTIPLY', r'\*'),
        ('DIVIDE', r'/'),
        ('LPAREN', r'\('),
        ('RPAREN', r'\)'),
        ('SKIP', r'[ \t\n]'),
        ('MISMATCH', r'.'),
    ]
    tok_regex = '|'.join('(?P<%s>%s)' % pair for pair in token_specification)
    for mo in re.finditer(tok_regex, code):
        kind = mo.lastgroup
        value = mo.group(kind)
        if kind == 'NUMBER':
            yield (kind, int(value))
        elif kind == 'IDENTIFIER':
            yield (kind, value)
        elif kind == 'SKIP':
            continue
        elif kind == 'MISMATCH':
            raise RuntimeError(f'Unexpected character {value!r}')
        else:
            yield (kind, value)

# Test it
tokens = list(tokenize("42 + foo"))
assert tokens == [('NUMBER', 42), ('PLUS', '+'), ('IDENTIFIER', 'foo')]
```

## Step 2: Parser (Syntax Tree)
The parser reads tokens and builds an Abstract Syntax Tree (AST). Each grammar rule becomes a function. For expressions: precedence matters (PEMDAS). Use a Pratt parser for operator precedence.

```python
class ASTNode:
    pass

class Number(ASTNode):
    def __init__(self, value):
        self.value = value

class Identifier(ASTNode):
    def __init__(self, name):
        self.name = name

class BinaryOp(ASTNode):
    def __init__(self, left, op, right):
        self.left = left
        self.op = op
        self.right = right

class Parser:
    def __init__(self, tokens):
        self.tokens = tokens
        self.current = 0

    def parse(self):
        return self.parse_expression()

    def parse_expression(self):
        left = self.parse_term()
        while self.current < len(self.tokens) and self.tokens[self.current][0] in ('PLUS', 'MINUS'):
            op = self.tokens[self.current][0]
            self.current += 1
            right = self.parse_term()
            left = BinaryOp(left, op, right)
        return left

    def parse_term(self):
        left = self.parse_factor()
        while self.current < len(self.tokens) and self.tokens[self.current][0] in ('MULTIPLY', 'DIVIDE'):
            op = self.tokens[self.current][0]
            self.current += 1
            right = self.parse_factor()
            left = BinaryOp(left, op, right)
        return left

    def parse_factor(self):
        if self.tokens[self.current][0] == 'NUMBER':
            node = Number(self.tokens[self.current][1])
            self.current += 1
            return node
        elif self.tokens[self.current][0] == 'IDENTIFIER':
            node = Identifier(self.tokens[self.current][1])
            self.current += 1
            return node
        elif self.tokens[self.current][0] == 'LPAREN':
            self.current += 1
            node = self.parse_expression()
            if self.tokens[self.current][0] != 'RPAREN':
                raise RuntimeError("Expected ')'")
            self.current += 1
            return node
        else:
            raise RuntimeError("Unexpected token")

# Test it
tokens = list(tokenize("42 + foo"))
parser = Parser(tokens)
ast = parser.parse()
assert isinstance(ast, BinaryOp) and ast.op == 'PLUS'
```

## Step 3: Interpreter (Semantics)
The interpreter walks the AST and executes the program. Simple recursion.

```python
class Interpreter:
    def __init__(self):
        self.variables = {}

    def interpret(self, node):
        if isinstance(node, Number):
            return node.value
        elif isinstance(node, Identifier):
            return self.variables.get(node.name, 0)
        elif isinstance(node, BinaryOp):
            left = self.interpret(node.left)
            right = self.interpret(node.right)
            if node.op == 'PLUS':
                return left + right
            elif node.op == 'MINUS':
                return left - right
            elif node.op == 'MULTIPLY':
                return left * right
            elif node.op == 'DIVIDE':
                return left / right
        else:
            raise RuntimeError("Unknown node type")

# Test it
interpreter = Interpreter()
interpreter.variables['foo'] = 42
result = interpreter.interpret(ast)
assert result == 84
```

## Step 4: Compiler (Code Generation)
The compiler generates machine code or bytecode. For simplicity, we'll generate Python bytecode.

```python
import dis

def compile_to_bytecode(ast):
    code = ""
    if isinstance(ast, Number):
        code += f"LOAD_CONST {ast.value}\n"
    elif isinstance(ast, Identifier):
        code += f"LOAD_NAME {ast.name}\n"
    elif isinstance(ast, BinaryOp):
        code += compile_to_bytecode(ast.left)
        code += compile_to_bytecode(ast.right)
        if ast.op == 'PLUS':
            code += "BINARY_ADD\n"
        elif ast.op == 'MINUS':
            code += "BINARY_SUBTRACT\n"
        elif ast.op == 'MULTIPLY':
            code += "BINARY_MULTIPLY\n"
        elif ast.op == 'DIVIDE':
            code += "BINARY_DIVIDE\n"
    return code

# Test it
bytecode = compile_to_bytecode(ast)
assert "LOAD_CONST 42" in bytecode and "BINARY_ADD" in bytecode
```

## Architecture
```
Programming Language Pipeline:
  Lexer → Parser → Interpreter → Compiler
  Each step is critical:
    - Lexer: Without it, we can't read the program
    - Parser: Without it, we can't understand the program
    - Interpreter: Without it, we can't execute the program
    - Compiler: Without it, we can't optimize the program
```

## Bridge to Production
- **Mini version**: Python bytecode, no optimizations. Production languages use: lexer generators, parser generators, intermediate representations, optimizations, code generation, runtime systems, garbage collection, type systems, concurrency models, memory management, debugging, profiling, documentation, packaging, distribution, versioning, compatibility, security, ethics, accessibility.
- **Production concerns**: Lexer generators, parser generators, intermediate representations, optimizations, code generation, runtime systems, garbage collection, type systems, concurrency models, memory management, debugging, profiling, documentation, packaging, distribution, versioning, compatibility, security, ethics, accessibility.

## Reference Tutorials
- [Crafting Interpreters](https://craftinginterpreters.com/)
- [Let's Build a Compiler](https://compilers.iecc.com/crenshaw/)
- [Writing a Compiler in Go](https://www.youtube.com/watch?v=HxaD_trXwRE)
- [Building a Simple Interpreter](https://ruslanspivak.com/lsbasi-part1/)
