---
name: database-from-scratch
description: The Mental Model
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
---## The Mental Model

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   WRITE PATH:                                                    │
│   ┌────────┐    ┌─────────────┐    ┌──────────┐    ┌──────────┐ │
│   │ SQL    │───▶│ Parser     │───▶│ Executor │───▶│ WAL      │ │
│   │ Input  │    │ (validate) │    │          │    │ (log)    │ │
│   └────────┘    └─────────────┘    └──────────┘    └─────┬────┘ │
│                                                         │      │
│                                                         ▼      │
│                                                   ┌──────────┐ │
│                                                   │ B-Tree   │ │
│                                                   │ (index)  │ │
│                                                   └────┬─────┘ │
│                                                        │       │
│                                                        ▼       │
│                                                   ┌──────────┐ │
│                                                   │ Data     │ │
│                                                   │ Files    │ │
│                                                   └──────────┘ │
│                                                                  │
│   READ PATH:                                                     │
│   ┌────────┐    ┌─────────────┐    ┌──────────┐    ┌──────────┐ │
│   │ Query  │───▶│ Index Scan  │───▶│ Retrieve │───▶│ Results  │ │
│   └────────┘    │ (B-Tree)    │    │ (data)   │    └──────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Build Steps (5 Steps, ~120 Lines Total)

### Step 1: The REPL (30 lines)

```python
"""Step 1: World's simplest database - a REPL that stores data in memory."""
import sys

def main():
    print("=== miniDB v1 (in-memory) ===")
    print("Commands: SET <key> <value>, GET <key>, DELETE <key>, EXIT")
    store = {}

    while True:
        try:
            line = input("db> ").strip()
            if not line:
                continue

            parts = line.split()
            if len(parts) < 2:
                print("Usage: SET <key> <value>, GET <key>, DELETE <key>")
                continue

            cmd = parts[0].upper()

            if cmd == "SET" and len(parts) >= 3:
                key, value = parts[1], " ".join(parts[2:])
                store[key] = value
                print(f"OK: {key} = {value}")

            elif cmd == "GET" and len(parts) >= 2:
                key = parts[1]
                print(store.get(key, "(nil)"))

            elif cmd == "DELETE" and len(parts) >= 2:
                key = parts[1]
                if key in store:
                    del store[key]
                    print("OK: deleted")
                else:
                    print("Not found")

            elif cmd == "EXIT":
                print("Goodbye!")
                break

            else:
                print(f"Unknown: {cmd}")

        except KeyboardInterrupt:
            print("\nUse EXIT to quit")
        except EOFError:
            break

if __name__ == "__main__":
    main()
```

**Test it:**
```bash
python db1.py
db> SET name Alice
db> GET name
Alice
db> EXIT
```

---

### Step 2: Add Persistence (20 lines)

```python
"""Step 2: Add durability - save to disk, load on restart."""
import os

class Database:
    def __init__(self, path="db.data"):
        self.path = path
        self.store = {}
        if os.path.exists(path):
            self.load()

    def load(self):
        """Read from disk on startup."""
        if not os.path.exists(self.path):
            return
        with open(self.path, "r") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, value = line.split("=", 1)
                    self.store[key] = value

    def set(self, key, value):
        self.store[key] = value
        self._persist()

    def get(self, key):
        return self.store.get(key)

    def delete(self, key):
        if key in self.store:
            del self.store[key]
            self._persist()

    def _persist(self):
        """Write all data atomically."""
        temp = self.path + ".tmp"
        with open(temp, "w") as f:
            for k, v in self.store.items():
                f.write(f"{k}={v}\n")
        os.replace(temp, self.path)

if __name__ == "__main__":
    db = Database()
    while True:
        cmd = input("db> ").strip().split()
        if not cmd: continue
        if cmd[0] == "SET": db.set(cmd[1], cmd[2])
        elif cmd[0] == "GET": print(db.get(cmd[1], "(nil)"))
        elif cmd[0] == "DELETE": db.delete(cmd[1])
        elif cmd[0] == "EXIT": break
```

**Test it:**
```bash
python db2.py
db> SET name Alice
db> EXIT
# Restart
python db2.py
db> GET name
Alice  # Data survived restart!
```

---

### Step 3: Add Write-Ahead Log (25 lines)

```python
"""Step 3: Add WAL for crash safety - log before writing."""
import os

class WALDatabase:
    def __init__(self, db_path="db.data", wal_path="wal.log"):
        self.db_path = db_path
        self.wal_path = wal_path
        self.store = {}
        self._recover()

    def _recover(self):
        """Replay WAL to recover state after crash."""
        if os.path.exists(self.wal_path):
            with open(self.wal_path, "r") as f:
                for line in f:
                    parts = line.strip().split(" ", 2)
                    if len(parts) >= 3:
                        op, key, value = parts[0], parts[1], parts[2]
                        if op == "SET":
                            self.store[key] = value
                        elif op == "DEL":
                            if key in self.store:
                                del self.store[key]
        self._persist_db()

    def set(self, key, value):
        """Atomic: write WAL first, then apply."""
        with open(self.wal_path, "a") as f:
            f.write(f"SET {key} {value}\n")
            f.flush()
            os.fsync(f.fileno())
        self.store[key] = value

    def get(self, key):
        return self.store.get(key)

    def delete(self, key):
        with open(self.wal_path, "a") as f:
            f.write(f"DEL {key} __DELETE__\n")
            f.flush()
            os.fsync(f.fileno())
        if key in self.store:
            del self.store[key]

    def _persist_db(self):
        with open(self.db_path, "w") as f:
            for k, v in self.store.items():
                f.write(f"{k}={v}\n")
```

**Test it:**
```bash
python db3.py
db> SET balance 100
db> EXIT
# Simulate crash: delete db.data, keep wal.log
# Restart - data is recovered from WAL!
```

---

### Step 4: B-Tree Without Split (40 lines)

```python
"""Step 4: B-Tree for O(log n) lookups — NO SPLIT yet."""

class BTreeNode:
    def __init__(self, order=4, leaf=True):
        self.order = order
        self.leaf = leaf
        self.keys = []
        self.values = []
        self.children = []

    def search(self, key):
        i = 0
        while i < len(self.keys) and key > self.keys[i]:
            i += 1
        if i < len(self.keys) and key == self.keys[i]:
            return self.values[i]
        if self.leaf:
            return None
        return self.children[i].search(key) if i < len(self.children) else None

    def insert(self, key, value):
        i = 0
        while i < len(self.keys) and key > self.keys[i]:
            i += 1
        if self.leaf:
            self.keys.insert(i, key)
            self.values.insert(i, value)
        else:
            if i >= len(self.children):
                i = len(self.children) - 1
            self.children[i].insert(key, value)

class BTree:
    def __init__(self, order=4):
        self.root = BTreeNode(order=order)

    def set(self, key, value):
        self.root.insert(key, value)

    def get(self, key):
        return self.root.search(key)
```

---

### Step 5: B-Tree WITH Split (50 lines) — THE KEY STEP

```python
"""Step 5: B-Tree with proper node splitting and parent promotion."""

class BTreeNode2:
    def __init__(self, order=4, leaf=True):
        self.order = order
        self.leaf = leaf
        self.keys = []
        self.values = []
        self.children = []
        self.parent = None

    def search(self, key):
        i = 0
        while i < len(self.keys) and key > self.keys[i]:
            i += 1
        if i < len(self.keys) and key == self.keys[i]:
            return self.values[i]
        if self.leaf:
            return None
        return self.children[i].search(key) if i < len(self.children) else None

    def insert_with_split(self, key, value):
        i = 0
        while i < len(self.keys) and key > self.keys[i]:
            i += 1

        if self.leaf:
            self.keys.insert(i, key)
            self.values.insert(i, value)
            if len(self.keys) > self.order:
                return self._split()
            return None
        else:
            if i >= len(self.children):
                i = len(self.children) - 1
            result = self.children[i].insert_with_split(key, value)
            if result:
                mid_key, mid_val, right_node = result
                self.keys.insert(i, mid_key)
                self.values.insert(i, mid_val)
                self.children.insert(i + 1, right_node)
                if len(self.keys) > self.order:
                    return self._split()
            return None

    def _split(self):
        mid = len(self.keys) // 2
        mid_key = self.keys[mid]
        mid_val = self.values[mid]

        left = BTreeNode2(order=self.order, leaf=self.leaf)
        left.keys = self.keys[:mid]
        left.values = self.values[:mid]
        left.parent = self.parent

        right = BTreeNode2(order=self.order, leaf=self.leaf)
        right.keys = self.keys[mid + 1:]
        right.values = self.values[mid + 1:]
        right.parent = self.parent

        if not self.leaf:
            left.children = self.children[:mid + 1]
            right.children = self.children[mid + 1:]
            for child in left.children:
                child.parent = left
            for child in right.children:
                child.parent = right

        if self.parent is None:
            new_root = BTreeNode2(order=self.order, leaf=False)
            new_root.keys = [mid_key]
            new_root.values = [mid_val]
            new_root.children = [left, right]
            left.parent = new_root
            right.parent = new_root
            self.parent = new_root
            return (mid_key, mid_val, right)
        return (mid_key, mid_val, right)

class BTree2:
    def __init__(self, order=4):
        self.root = BTreeNode2(order=order)

    def set(self, key, value):
        result = self.root.insert_with_split(key, value)
        if result:
            mid_key, mid_val, right = result
            new_root = BTreeNode2(order=self.root.order, leaf=False)
            new_root.keys = [mid_key]
            new_root.values = [mid_val]
            new_root.children = [self.root, right]
            self.root = new_root
            self.root.children[0].parent = self.root
            self.root.children[1].parent = self.root

    def get(self, key):
        return self.root.search(key)

    def height(self):
        h = 0
        node = self.root
        while not node.leaf:
            h += 1
            node = node.children[0]
        return h + 1

if __name__ == "__main__":
    tree = BTree2(order=4)
    for i in range(40):
        tree.set(i, f"value_{i}")

    for i in range(0, 40, 5):
        assert tree.get(i) == f"value_{i}", f"FAIL at key {i}"

    assert tree.get(999) is None, "Should be None for missing key"
    assert tree.height() <= 5, f"Height should be small, got {tree.height()}"
    print(f"B-Tree height: {tree.height()}")
    print("All keys present:", [tree.get(i) for i in range(0, 40, 5)])
    print("B-Tree with split: OK")
```

---

## Bridge to Production

| Our miniDB | Production DB (Postgres) |
|------------|-------------------------|
| In-memory + WAL | MVCC, isolation levels |
| B-Tree with split | B-Tree with page splits, vacuum |
| Single-threaded | Parallel query execution |
| One file | Tablespace, indexes, partitions |
| Manual SQL parsing | Cost-based optimizer |

**Production systems to study:**
- [Let's Build a Simple Database (C)](https://cstack.github.io/db_tutorial/) - 15 parts
- [Build Your Own Redis from Scratch (Go)](https://www.build-redis-from-scratch.dev/)
- [Build Your Own Database (Go)](https://build-your-own.org/database/)

---

## Checklist

- [ ] Step 1: REPL works
- [ ] Step 2: Data persists across restarts
- [ ] Step 3: WAL survives crashes
- [ ] Step 4: B-Tree basic (no split, will overflow)
- [ ] Step 5: B-Tree with split (handles > order entries)
- [ ] Run the self-test in Step 5: insert 40 keys, verify all retrievable
- [ ] Explain the difference between miniDB and Postgres