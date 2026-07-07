---
name: sqlite-from-scratch
description: Build SQLite from Scratch
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
---# Build SQLite from Scratch

> *"SQLite is just a B-tree storing serialized rows, with a WAL journal for durability."*

---

## The Mental Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    SQLITE ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   SQL Query                                                     │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  SQL PARSER                                                 │  │
│   │     "SELECT * FROM users WHERE id = 1"                   │  │
│   │     → AST: Select { table: "users", where: id=1 }        │  │
│   └─────────────────────────────────────────────────────────┘  │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  QUERY PLANNER                                            │  │
│   │     Index scan vs full table scan                        │  │
│   └─────────────────────────────────────────────────────────┘  │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  B-TREE EXECUTOR                                         │  │
│   │     Root page → navigate to leaf → read rows            │  │
│   │     Pages: 1KB - 64KB each                              │  │
│   └─────────────────────────────────────────────────────────┘  │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  PAGER / STORAGE                                          │  │
│   │     Read/write 4KB pages from file                        │  │
│   │     WAL: write-ahead log for crash recovery             │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  B-TREE PAGE STRUCTURE (Leaf)                           │  │
│   │  ┌──────────────────────────────────────────────────┐  │  │
│   │   │ Header │ Cell Ptr Array │ Cells...             │  │  │
│   │   │ 100b  │ [0][20][45]...  │ (key, value) pairs   │  │  │
│   │   └──────────────────────────────────────────────────┘  │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Build Steps (5 Steps, ~100 Lines)

### Step 1: Page Layout and B-Tree Core (25 lines)

```python
"""Step 1: Define page structure and B-tree operations."""
import struct

PAGE_SIZE = 4096
BTREE_PAGE_TYPE = 13  # leaf table page
HEADER_SIZE = 100

class Page:
    def __init__(self, data=None):
        self.data = bytearray(data or bytearray(PAGE_SIZE))

    def write_byte(self, offset, value):
        self.data[offset] = value

    def read_byte(self, offset):
        return self.data[offset]

    def write_int16(self, offset, value):
        struct.pack_into('>H', self.data, offset, value)

    def read_int16(self, offset):
        return struct.unpack_from('>H', self.data, offset)[0]

    def write_int32(self, offset, value):
        struct.pack_into('>I', self.data, offset, value)

    def read_int32(self, offset):
        return struct.unpack_from('>I', self.data, offset)[0]

class BTreeLeafPage(Page):
    def __init__(self, data=None):
        super().__init__(data)
        if data is None:
            self.data[0] = BTREE_PAGE_TYPE
            self.write_int16(3, 0)  # first freeblock
            self.write_int16(5, 0)  # number of cells
            self.write_int16(7, HEADER_SIZE)  # cell content area start

    def get_cell_count(self):
        return self.read_int16(5)

    def set_cell_count(self, n):
        self.write_int16(5, n)

    def get_cell_pointer(self, index):
        base = HEADER_SIZE + index * 2
        return self.read_int16(base)

    def add_cell(self, index, key, value):
        n = self.get_cell_count()
        # Shift existing cells
        for i in range(n - 1, index - 1, -1):
            old_ptr = self.get_cell_pointer(i)
            new_ptr = old_ptr + 8  # rough estimate
            self.write_int16(HEADER_SIZE + (i + 1) * 2, new_ptr)
        # Encode cell: key (4 bytes) + value length (2) + value
        cell = struct.pack('>IH', key, len(value)) + value.encode()
        ptr = self.read_int16(7) - len(cell)
        self.data[ptr:ptr + len(cell)] = cell
        self.write_int16(HEADER_SIZE + index * 2, ptr)
        self.set_cell_count(n + 1)

    def search(self, key):
        n = self.get_cell_count()
        for i in range(n):
            ptr = self.get_cell_pointer(i)
            cell_key = struct.unpack_from('>I', self.data, ptr)[0]
            if cell_key == key:
                val_len = struct.unpack_from('>H', self.data, ptr + 4)[0]
                return self.data[ptr + 6:ptr + 6 + val_len].decode()
            elif cell_key > key:
                break
        return None

# Test
page = BTreeLeafPage()
page.add_cell(0, 1, "Alice")
page.add_cell(1, 2, "Bob")
print(f"Cells: {page.get_cell_count()}")
print(f"Search key 2: {page.search(2)}")
```

---

### Step 2: Cursor and Table Operations (20 lines)

```python
"""Step 2: B-tree cursor for traversing and modifying."""

class Cursor:
    def __init__(self, page, index=0):
        self.page = page
        self.index = index  # current cell index
        self.rowid = None

    def move_to(self, page, index):
        self.page = page
        self.index = index

    def next(self):
        n = self.page.get_cell_count()
        if self.index < n - 1:
            self.index += 1
            return True
        return False

    def prev(self):
        if self.index > 0:
            self.index -= 1
            return True
        return False

class Table:
    def __init__(self, path):
        self.path = path
        self.pages = []
        self.load()

    def load(self):
        if __import__('os').path.exists(self.path):
            with open(self.path, 'rb') as f:
                self.pages.append(BTreeLeafPage(f.read(PAGE_SIZE)))

    def insert(self, key, value):
        if not self.pages:
            self.pages.append(BTreeLeafPage())
        page = self.pages[0]
        n = page.get_cell_count()
        # Find insert position
        idx = 0
        for i in range(n):
            ptr = page.get_cell_pointer(i)
            existing_key = struct.unpack_from('>I', page.data, ptr)[0]
            if existing_key >= key:
                break
            idx = i + 1
        page.add_cell(idx, key, value)

    def search(self, key):
        if self.pages:
            return self.pages[0].search(key)
        return None

    def save(self):
        with open(self.path, 'wb') as f:
            for page in self.pages:
                f.write(bytes(page.data))

# Test
t = Table('/tmp/test.db')
t.insert(1, "Alice")
t.insert(2, "Bob")
t.insert(3, "Charlie")
print(f"Search key 2: {t.search(2)}")
t.save()
```

---

### Step 3: SQL Parser (Simplified) (25 lines)

```python
"""Step 3: Parse simple SQL into AST."""

import re

class SQLToken:
    SELECT, FROM, WHERE, INSERT, INTO, VALUES, UPDATE, SET, DELETE, \
    IDENT, NUMBER, STRING, STAR, EQ, NE, LT, GT, LTE, GTE, LPAREN, RPAREN, \
    COMMA, SEMI, EOF = range(24)

class Tokenizer:
    def __init__(self, sql):
        self.sql = sql
        self.pos = 0

    def next_token(self):
        self._skip_whitespace()
        if self.pos >= len(self.sql):
            return (SQLToken.EOF, None)
        ch = self.sql[self.pos]
        if ch.isdigit():
            start = self.pos
            while self.pos < len(self.sql) and self.sql[self.pos].isdigit():
                self.pos += 1
            return (SQLToken.NUMBER, int(self.sql[start:self.pos]))
        if ch == '"' or ch == "'":
            quote = ch
            self.pos += 1
            start = self.pos
            while self.pos < len(self.sql) and self.sql[self.pos] != quote:
                self.pos += 1
            val = self.sql[start:self.pos]
            self.pos += 1
            return (SQLToken.STRING, val)
        if ch.isalpha() or ch == '_':
            start = self.pos
            while self.pos < len(self.sql) and (self.sql[self.pos].isalnum() or self.sql[self.pos] == '_'):
                self.pos += 1
            word = self.sql[start:self.pos].upper()
            keywords = {'SELECT': SQLToken.SELECT, 'FROM': SQLToken.FROM,
                        'WHERE': SQLToken.WHERE, 'INSERT': SQLToken.INSERT,
                        'INTO': SQLToken.INTO, 'VALUES': SQLToken.VALUES}
            if word in keywords:
                return (keywords[word], word)
            return (SQLToken.IDENT, word)
        op_map = {'*': SQLToken.STAR, '=': SQLToken.EQ, '(': SQLToken.LPAREN,
                  ')': SQLToken.RPAREN, ',': SQLToken.COMMA, ';': SQLToken.SEMI}
        if ch in op_map:
            self.pos += 1
            return (op_map[ch], ch)
        self.pos += 1
        return (SQLToken.EOF, None)

    def _skip_whitespace(self):
        while self.pos < len(self.sql) and self.sql[self.pos].isspace():
            self.pos += 1

def parse_sql(sql):
    tokens = []
    tok = Tokenizer(sql)
    while True:
        t, v = tok.next_token()
        tokens.append((t, v))
        if t == SQLToken.EOF:
            break
    return tokens

# Simplified parser for SELECT and INSERT
def parse_select(tokens):
    # SELECT * FROM table [WHERE cond]
    i = 0
    if tokens[i][0] != SQLToken.SELECT:
        return None
    i += 1
    has_star = tokens[i][0] == SQLToken.STAR
    if not has_star:
        while tokens[i][0] != SQLToken.FROM:
            i += 1
    i += 1  # skip FROM
    table = tokens[i][1]
    i += 1
    where = None
    if i < len(tokens) and tokens[i][0] == SQLToken.WHERE:
        i += 1
        if tokens[i][0] == SQLToken.IDENT and i + 2 < len(tokens) and tokens[i + 1][0] == SQLToken.EQ:
            where = (tokens[i][1], tokens[i + 2][1])
    return {'type': 'select', 'table': table, 'where': where}

def parse_insert(tokens):
    # INSERT INTO table VALUES (v1, v2)
    i = 0
    if tokens[i][0] != SQLToken.INSERT:
        return None
    i += 2  # skip INTO
    table = tokens[i][1]
    i += 2  # skip VALUES
    i += 1  # skip (
    values = []
    while tokens[i][0] != SQLToken.RPAREN:
        if tokens[i][0] == SQLToken.NUMBER:
            values.append(tokens[i][1])
        elif tokens[i][0] == SQLToken.STRING:
            values.append(tokens[i][1])
        i += 1
    return {'type': 'insert', 'table': table, 'values': values}

def parse(sql):
    tokens = parse_sql(sql)
    if not tokens:
        return None
    if tokens[0][0] == SQLToken.SELECT:
        return parse_select(tokens)
    elif tokens[0][0] == SQLToken.INSERT:
        return parse_insert(tokens)
    return None

# Test
ast = parse('SELECT * FROM users WHERE id = 1')
print(ast)  # {'type': 'select', 'table': 'users', 'where': ('id', 1)}
```

---

### Step 4: WAL Journal (15 lines)

```python
"""Step 4: Write-Ahead Log for crash recovery."""

import struct
import os

class WAL:
    def __init__(self, db_path):
        self.wal_path = db_path + "-wal"
        self.frame_count = 0

    def write_frame(self, page_no, data):
        """Write a page frame to WAL: page_no (4) + page_data (PAGE_SIZE)."""
        with open(self.wal_path, 'ab') as f:
            f.write(struct.pack('>I', page_no))
            f.write(data)
        self.frame_count += 1

    def checkpoint(self, db_path):
        """Replay WAL frames to database and clear WAL."""
        if not os.path.exists(self.wal_path):
            return
        with open(self.wal_path, 'rb') as wal:
            with open(db_path, 'r+b') as db:
                while True:
                    frame = wal.read(4 + PAGE_SIZE)
                    if len(frame) < 4 + PAGE_SIZE:
                        break
                    page_no = struct.unpack_from('>I', frame, 0)[0]
                    page_data = frame[4:]
                    db.seek((page_no - 1) * PAGE_SIZE)
                    db.write(page_data)
        os.remove(self.wal_path)
        self.frame_count = 0

    def recover(self, db_path):
        """On startup: replay any uncommitted WAL frames."""
        self.checkpoint(db_path)

# Test: write frames
wal = WAL('/tmp/test.db')
wal.write_frame(1, bytearray(b'page data here' * 300))  # ~PAGE_SIZE
wal.checkpoint('/tmp/test.db')
print("WAL checkpoint done")
```

---

### Step 5: Query Executor (15 lines)

```python
"""Step 5: Execute parsed SQL against the table."""

class Executor:
    def __init__(self, tables):
        self.tables = tables

    def execute(self, ast):
        if ast['type'] == 'insert':
            table_name = ast['table']
            values = ast['values']
            if table_name in self.tables:
                key = values[0] if isinstance(values[0], int) else len(self.tables[table_name].pages) + 1
                val = str(values[1]) if len(values) > 1 else ""
                self.tables[table_name].insert(key, val)
                return f"Inserted 1 row into {table_name}"
            return f"Table '{table_name}' not found"

        elif ast['type'] == 'select':
            table_name = ast['table']
            where = ast.get('where')
            if table_name not in self.tables:
                return f"Table '{table_name}' not found"
            table = self.tables[table_name]
            results = []
            if where:
                field, value = where
                if field == 'id':
                    result = table.search(value)
                    if result:
                        results.append(result)
            return results if results else "No rows found"

        return "Unknown query type"

# Test
tables = {'users': Table('/tmp/test.db')}
exec = Executor(tables)
# Insert via SQL
ast = parse("INSERT INTO users VALUES (4, 'Dave')")
print(exec.execute(ast))
# Select via SQL
ast = parse("SELECT * FROM users WHERE id = 2")
print(exec.execute(ast))
```

---

## Bridge to Production

| Our SQLite | Real SQLite |
|------------|-------------|
| Single B-tree page | Multi-level B+tree (page 1 = root) |
| No index | B-tree index on primary key + any column |
| No WAL header | WAL header + frame headers + commit frame |
| No VACUUM | VACUUM rewrites DB, reclaiming space |
| No transactions | MVCC with rollback journal |
| Simple tokenizer | Lemon parser generator |

> **Gap to fill**: Real SQLite uses B+-tree (not B-tree), has variable-length records, implements MVCC with rollback journals, uses a custom SQL parser (Lemon), and has a VDBE (virtual database engine) bytecode executor.

**Production systems to study:**
- [SQLite Architecture (sqlite.org)](https://www.sqlite.org/arch.html)
- [Write Your Own SQLite Clone (flybywiresim)](https://flybywiresim.com/dev)
- [SQLite Internals (book)](https://www.sqlite.org/book.html)
- [How SQLite Works (charlesleifer)](https://charlesleifer.com/blog/how-sqlite-works/)

---

## Checklist

- [ ] Step 1: Page layout and B-tree core
- [ ] Step 2: Cursor and table operations
- [ ] Step 3: SQL parser (simplified)
- [ ] Step 4: WAL journal for crash recovery
- [ ] Step 5: Query executor
- [ ] Add: B+-tree with internal pages
- [ ] Add: SQL JOIN execution
- [ ] Add: VACUUM and compaction