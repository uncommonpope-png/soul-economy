---
name: language-from-scratch
description: Build a Programming Language From Scratch
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
---# Build a Programming Language From Scratch

---
name: language-from-scratch
description: Use when user wants to build a programming language, create an interpreter or compiler, or learn about lexing, parsing, AST, and code generation. Triggers on: "build a language", "interpreter", "compiler", "lexer", "parser", "AST".
---

## The Mental Model
A programming language has four pillars: **lexing** (text → tokens), **parsing** (tokens → AST), **type checking / analysis** (AST → validated AST), and **code generation** (AST → target code). The journey: characters → tokens → syntax tree → semantic check → intermediate representation → instructions.

## Step 1: Lexer (Tokenizer)
The lexer reads characters and emits tokens. Each token has a type (IDENTIFIER, NUMBER, PLUS, etc.) and a value. Input: `"42 + foo"`. Output: `[NUM(42), PLUS, IDENT("foo")]`.

```c
typedef enum {
    T_INT, T_PLUS, T_MINUS, T_STAR, T_SLASH,
    T_LPAREN, T_RPAREN, T_IDENT, T_EOF,
} TokenType;

typedef struct {
    TokenType type;
    int value;
    char* str;
} Token;

const char* src;
size_t pos;

Token next_token() {
    while (isspace(src[pos])) pos++;
    if (isdigit(src[pos])) {
        int val = 0;
        while (isdigit(src[pos])) val = val * 10 + (src[pos++] - '0');
        return (Token){T_INT, val, NULL};
    }
    if (isalpha(src[pos])) {
        char* start = &src[pos];
        while (isalnum(src[pos])) pos++;
        char c = src[pos]; src[pos] = '\0';
        Token t = (Token){T_IDENT, 0, start};
        src[pos] = c;
        // Check for keywords, then return
        return t;
    }
    char c = src[pos++];
    switch (c) {
        case '+': return (Token){T_PLUS, 0, NULL};
        case '-': return (Token){T_MINUS, 0, NULL};
        // ...
    }
    return (Token){T_EOF, 0, NULL};
}
```

## Step 2: Recursive Descent Parser
The parser reads tokens and builds an Abstract Syntax Tree. Each grammar rule becomes a function. For expressions: precedence matters (PEMDAS). Use a Pratt parser for operator precedence, or the classic approach: separate functions for each precedence level.

```c
typedef enum { EXPR_INT, EXPR_BINOP } ExprType;

typedef struct Expr {
    ExprType type;
    union {
        struct { int value; } int_literal;
        struct { struct Expr* left; int op; struct Expr* right; } binop;
    };
} Expr;

Expr* parse_expr(int precedence);
Expr* parse_primary() {
    if (token.type == T_INT) {
        Expr* e = malloc(sizeof(Expr));
        e->type = EXPR_INT;
        e->int_literal.value = token.value;
        advance();
        return e;
    }
    if (token.type == T_LPAREN) {
        advance(); // (
        Expr* inner = parse_expr(0);
        expect(T_RPAREN);
        return inner;
    }
    error("unexpected token");
}

int get_precedence(int op) {
    if (op == '+' || op == '-') return 1;
    if (op == '*' || op == '/') return 2;
    return 0;
}

Expr* parse_expr(int min_prec) {
    Expr* left = parse_primary();
    while (get_precedence(token.type) >= min_prec) {
        int op = token.type;
        advance();
        Expr* right = parse_expr(get_precedence(op) + 1);
        Expr* node = malloc(sizeof(Expr));
        node->type = EXPR_BINOP;
        node->binop.left = left;
        node->binop.op = op;
        node->binop.right = right;
        left = node;
    }
    return left;
}
```

## Step 3: Evaluator (Interpreter)
Walk the AST and compute the result. Simple recursion.

```c
int eval(Expr* e) {
    switch (e->type) {
        case EXPR_INT:
            return e->int_literal.value;
        case EXPR_BINOP: {
            int l = eval(e->binop.left);
            int r = eval(e->binop.right);
            switch (e->binop.op) {
                case T_PLUS: return l + r;
                case T_MINUS: return l - r;
                case T_STAR: return l * r;
                case T_SLASH: return l / r;
            }
        }
    }
}
```

## Step 4: Add Variables and a Scope Table
Memory: variables need a symbol table. Scope: use a hash map or chained hash maps for nested scopes.

```c
typedef struct Scope {
    char* name;
    int value;
    struct Scope* next;
} Scope;

Scope* symbol_table = NULL;

Scope* lookup_scope(char* name) {
    for (Scope* s = symbol_table; s; s = s = s->next) {
        if (strcmp(s->name, name) == 0) return s;
    }
    return NULL;
}

int lookup(char* name) {
    Scope* s = lookup_scope(name);
    if (s) return s->value;
    error("undefined variable: %s", name);
    return 0;
}

void assign(char* name, int value) {
    Scope* s = lookup_scope(name);
    if (s) {
        s->value = value;
        return;
    }
    Scope* new_scope = malloc(sizeof(Scope));
    new_scope->name = strdup(name);
    new_scope->value = value;
    new_scope->next = symbol_table;
    symbol_table = new_scope;
}

// Update the grammar in parse_expr:
// assignment := IDENT ASSIGN expr
// factor := NUMBER | IDENT | LPAREN expr RPAREN
// In the parser, when you see IDENT followed by ASSIGN,
// parse the RHS expression and call assign(name, value)

typedef enum { EXPR_INT, EXPR_BINOP, EXPR_VAR, EXPR_ASSIGN } ExprType;

typedef struct Expr {
    ExprType type;
    union {
        int value;
        struct { struct Expr* left; int op; struct Expr* right; } binop;
        struct { char* name; } var;
        struct { char* name; struct Expr* value; } assign;
    };
} Expr;

Expr* parse_factor() {
    if (token.type == T_INT) {
        Expr* e = malloc(sizeof(Expr));
        e->type = EXPR_INT;
        e->value = token.value;
        advance();
        return e;
    }
    if (token.type == T_IDENT) {
        Expr* e = malloc(sizeof(Expr));
        e->type = EXPR_VAR;
        e->var.name = strdup(token.str);
        advance();
        // Check for assignment: ident = expr
        if (token.type == T_ASSIGN) {
            advance();
            Expr* rhs = parse_expr(0);
            e->type = EXPR_ASSIGN;
            e->assign.name = e->var.name;
            e->assign.value = rhs;
        }
        return e;
    }
    // ... rest of parse_factor
}
```

## Step 5: Compiler Backend (x86-64 code generation)
Generate actual machine code targeting x86-64 or ARM. You can also compile to an IR (LLVM IR, WASM bytecode) or an interpreted bytecode (Python, JVM).

```c
// For x86-64 SysV ABI: integers go in RDI, RSI, RDX, RCX, R8, R9
void gen_expr(Expr* e) {
    switch (e->type) {
        case EXPR_INT:
            printf("  mov eax, %d\n", e->int_literal.value);
            break;
        case EXPR_BINOP:
            gen_expr(e->binop.left);
            printf("  push rax\n");
            gen_expr(e->binop.right);
            printf("  pop rdi\n");
            switch (e->binop.op) {
                case T_PLUS: printf("  add eax, edi\n"); break;
                case T_MINUS: printf("  sub eax, edi\n"); break;
                case T_STAR: printf("  imul eax, edi\n"); break;
            }
            break;
    }
}

void emit_assembly(Expr* e) {
    printf("  global main\nmain:\n");
    gen_expr(e);
    printf("  ret\n");
}
```

## Checklist
- [ ] Step 1: Lexer (tokenizer) works
- [ ] Step 2: Recursive descent parser (AST builder)
- [ ] Step 3: Evaluator (interpreter)
- [ ] Step 4: Variables and scope table
- [ ] Step 5: x86-64 code generation
- [ ] Add: functions and closures
- [ ] Add: garbage collection

## Architecture
```
Source code ("let x = 42 + foo(3)")
  ↓ Lexer
Tokens [LET, IDENT("x"), ASSIGN, INT(42), PLUS, IDENT("foo"), ...]
  ↓ Parser
AST:
  Let { name: "x",
        value: BinOp(PLUS,
                    IntLiteral(42),
                    Call("foo", [IntLiteral(3)])) }
  ↓ Semantic analysis (type checker, scope resolver)
Validated AST (type-checked, name-resolved)
  ↓ Compiler
x86-64 assembly / bytecode / IR
  ↓ Assembler / Linker / VM
Executable / .class file / .wasm
```

## Bridge to Production
- **Mini version**: Arithmetic + variables + function calls = a tiny interpreted language. Real languages need: type systems (inference, subtyping, generics), GC (tracing vs reference counting), optimization passes (CSE, inlining), LLVM IR code generation, DWARF debug info, language server protocol (LSP), package managers, standard libraries.
- **Production concerns**: Sound type systems, memory safety (bounds checking), lexical scoping with closures, tail-call optimization, escape analysis, JIT compilation, AOT compilation, language ergonomics, language evolution (backwards incompatible changes).

## Reference Tutorials
- [Crafting Interpreters (Robert Nystrom)](https://craftinginterpreters.com/) - Best book in the field
- [How to write a JIT in Python](https://github.com/JustinPiper/jit-python)
- [Build a lisp (Build Your Own Lisp)](https://www.buildyourownlisp.com/)
- [Writing an interpreted language in Python 3](https://github.com/chrislgarry/Apollo-11)
- [Build a programming language in Haskell](https://github.com/MJohnson659/language)

- [Crafting Interpreters (Robert Nystrom)](https://craftinginterpreters.com/) - Best book in the field
- [How to write a JIT in Python](https://github.com/JustinPiper/jit-python)
- [Build a lisp (Build Your Own Lisp)](https://www.buildyourownlisp.com/)
- [Writing an interpreted language in Python 3](https://github.com/chrislgarry/Apollo-11)
- [Build a programming language in Haskell](https://github.com/MJohnson659/language)
