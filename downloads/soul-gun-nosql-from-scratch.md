---
name: nosql-from-scratch
description: Build a NoSQL Database From Scratch
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
---# Build a NoSQL Database From Scratch

---
name: nosql-from-scratch
description: Use when user wants to understand how NoSQL databases work, build a key-value store or document database, or learn about B-trees, LSM trees, and distributed storage. Triggers on: "build nosql", "key-value store", "document database", "B-tree", "LSM tree".
---

## The Mental Model
Relational databases store tables with fixed schemas. NoSQL databases trade schema rigidity for speed and flexibility: key-value stores, document stores, column families, graph databases. The common thread: they avoid joins and horizontal scaling is easier (no join coordination across nodes).

## Step 1: Key-Value Store (The Foundation)
A key-value store is a hashmap persisted to disk. Basic operations: GET(key), PUT(key, value), DELETE(key). The challenge: making it fast and durable.

```python
import os, struct, json

class KVStore:
    def __init__(self, path):
        self.path = path
        self.index = {}
        if os.path.exists(path):
            self.load_index()

    def load_index(self):
        with open(self.path + '.idx', 'rb') as f:
            size = struct.unpack('I', f.read(4))[0]
            self.index = json.loads(f.read(size))

    def save_index(self):
        data = json.dumps(self.index).encode()
        with open(self.path + '.idx', 'wb') as f:
            f.write(struct.pack('I', len(data)))
            f.write(data)

    def put(self, key, value):
        offset = os.path.getsize(self.path + '.dat') if os.path.exists(self.path + '.dat') else 0
        with open(self.path + '.dat', 'ab') as f:
            value_bytes = json.dumps(value).encode()
            f.write(struct.pack('I', len(value_bytes)))
            f.write(value_bytes)
        self.index[key] = offset
        self.save_index()

    def get(self, key):
        if key not in self.index:
            return None
        offset = self.index[key]
        with open(self.path + '.dat', 'rb') as f:
            f.seek(offset)
            size = struct.unpack('I', f.read(4))[0]
            value_bytes = f.read(size)
        return json.loads(value_bytes)
```

## Step 2: Write-Ahead Log (Durability)
Every write goes to a WAL before updating the index. On crash, replay the WAL to recover. This is how all serious databases work (PostgreSQL, SQLite in WAL mode, levelDB, RocksDB, Cassandra).

```python
def append_wal(self, op, key, value):
    with open(self.path + '.wal', 'ab') as f:
        entry = json.dumps({'op': op, 'key': key, 'value': value}).encode()
        f.write(struct.pack('I', len(entry)))
        f.write(entry)

    def put(self, key, value):
        self.append_wal('PUT', key, value)
        super().put(key, value)

    def recover(self):
        if not os.path.exists(self.path + '.wal'):
            return
        with open(self.path + '.wal', 'rb') as f:
            while True:
                size_bytes = f.read(4)
                if not size_bytes:
                    break
                size = struct.unpack('I', size_bytes)[0]
                entry = json.loads(f.read(size))
                if entry['op'] == 'PUT':
                    super().put(entry['key'], entry['value'])
                elif entry['op'] == 'DELETE':
                    self._delete(entry['key'])
```

## Step 3: B-Tree for Range Queries
Hash maps can't do range queries. B-trees store sorted key-value pairs. Each node has a fanout (branching factor). Inserts split nodes when full, promoting median keys up.

```python
class BTree:
    NODE_SIZE = 4096
    FANOUT = 255

    def __init__(self):
        self.root = self.new_node(is_leaf=True)

    def new_node(self, is_leaf=False):
        return {'is_leaf': is_leaf, 'keys': [], 'vals': [], 'children': []}

    def insert(self, key, value):
        root = self.root
        if len(root['keys']) == self.FANOUT:
            new_root = self.new_node()
            new_root['children'].append(self.root)
            self.split_child(new_root, 0)
            self.root = new_root
        self._insert_nonfull(self.root, key, value)

    def _insert_nonfull(self, node, key, value):
        i = len(node['keys']) - 1
        if node['is_leaf']:
            while i >= 0 and key < node['keys'][i]:
                i -= 1
            node['keys'].insert(i + 1, key)
            node['vals'].insert(i + 1, value)
        else:
            while i >= 0 and key < node['keys'][i]:
                i -= 1
            i += 1
            if len(node['children'][i]['keys']) == self.FANOUT:
                self.split_child(node, i)
                if key > node['keys'][i]:
                    i += 1
            self._insert_nonfull(node['children'][i], key, value)

    def search(self, key):
        return self._search(self.root, key)

    def _search(self, node, key):
        i = 0
        while i < len(node['keys']) and key > node['keys'][i]:
            i += 1
        if i < len(node['keys']) and key == node['keys'][i]:
            return node['vals'][i]
        if node['is_leaf']:
            return None
        return self._search(node['children'][i], key)
```

## Step 4: Document Store (JSON-in-DB)
Store JSON documents, query by any field. Basic indexing on common fields:

```python
class DocumentStore(KVStore):
    def __init__(self, path):
        super().__init__(path)
        self.secondary_indexes = {}

    def put(self, key, doc):
        super().put(key, doc)
        for field, value in doc.items():
            if field not in self.secondary_indexes:
                self.secondary_indexes[field] = {}
            if value not in self.secondary_indexes[field]:
                self.secondary_indexes[field][value] = []
            self.secondary_indexes[field][value].append(key)

    def query(self, field, value):
        if field in self.secondary_indexes:
            keys = self.secondary_indexes[field].get(value, [])
            return [self.get(k) for k in keys]
        return []
```

## Step 5: Map-Reduce Views (CouchDB/Cloudant style)
Pre-compute aggregated views via map-reduce functions. When documents update, views are recomputed. This enables secondary indexing across large datasets.

```python
def define_view(mapper):
    def decorator(func):
        func._mapper = mapper
        return func
    return decorator

def query_view(self, view_name, start_key=None, end_key=None):
    emit = []
    def emitter(key, value):
        emit.append((key, value))
    for _, doc in self._all_docs():
        view = self.views[view_name]
        view._mapper(doc, emitter)
    results = sorted(emit)
    if start_key is not None:
        results = [(k, v) for k, v in results if k >= start_key]
    if end_key is not None:
        results = [(k, v) for k, v in results if k < end_key]
    return dict(results)
```

## Architecture
```
PUT/GET operation
  → append to WAL (durability, crash recovery)
  → update primary index (in-memory B-tree OR write-through)
  → update secondary indexes (if document store)
  → compaction: periodically rewrite, removing deleted entries

Query
  → check in-memory cache
  → traverse B-tree to find key
  → apply view functions (map-reduce)

Distributed model:
  → consistent hashing (partition keys across nodes)
  → replication (leader-follower)
  → conflict resolution (last-write-wins, OR CRDTs)
```

## Bridge to Production
- **Mini version**: Single-threaded, no replication, single node. Real databases (Cassandra, MongoDB, Redis, DynamoDB) are distributed by default with consistent hashing, gossip protocols, CRDT-based conflict resolution, LSM-trees for write-optimized storage, vector clocks, change data capture, and sub-millisecond p99 latency.
- **Production concerns**: Horizontal scaling (consistent hashing), replication (multi-leader, leader-follower), fail-over, compaction (LSM-trees vs B-trees), TTL/expiration, compression, eventual consistency models, conflict resolution, TTL, range queries via secondary indexes, aggregation pipelines.

## Reference Tutorials
- [Write a key-value store from scratch](https://github.com/avinash-plalk)
- [Writing a simple Key-Value store](https://blog.mischol.com/2021/10/06/writing-a-simple-in-memory-key-value-store/)
- [Build a key-value database in Python](https://jvarnby.com/posts/2023/md/)
- [Building a simple KV store](https://github.com/cadosala/simple-kv-store)

## Checklist
- [ ] Step 1: Key-value store with index
- [ ] Step 2: Write-ahead log (WAL)
- [ ] Step 3: B-tree for range queries
- [ ] Step 4: Document store with secondary indexes
- [ ] Step 5: Map-reduce views
- [ ] Add: LSM tree compaction
- [ ] Add: distributed partitioning
