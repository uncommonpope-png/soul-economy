---
name: git-from-scratch
description: Build Git from Scratch
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
---# Build Git from Scratch

> *"Git is just a content-addressable key-value store with a DAG on top."*

---

## The Mental Model

```
┌─────────────────────────────────────────────────────────────────┐
│                      GIT DATA MODEL                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   BLOBS (file content, addressed by SHA-1 hash)                  │
│   ┌─────────────────────────────────────────────────────┐       │
│   │  blob 3c1e4... "Hello, World!"                       │       │
│   │  blob 7a2b9... "#!/bin/bash\necho hi"               │       │
│   └─────────────────────────────────────────────────────┘       │
│                                                                  │
│   TREES (directories, map names to blobs/trees)                │
│   ┌─────────────────────────────────────────────────────┐       │
│   │  tree 8f3c1...                                     │       │
│   │    100644 README.md    blob 3c1e4...              │       │
│   │    100755 script.sh    blob 7a2b9...              │       │
│   └─────────────────────────────────────────────────────┘       │
│                                                                  │
│   COMMITS (snapshots with parent pointers)                       │
│   ┌─────────────────────────────────────────────────────┐       │
│   │  commit a9b2c1...                                   │       │
│   │    tree:    8f3c1...                               │       │
│   │    parent:  1d4e2... (or none for first)            │       │
│   │    author:  Alice <alice@example.com> 1234567890   │       │
│   │    message: "Add README"                           │       │
│   └─────────────────────────────────────────────────────┘       │
│                                                                  │
│   ┌─────────────────────────────────────────────────────┐       │
│   │              COMMIT DAG                             │       │
│   │                                                   │       │
│   │         C3 ←──────── C2 ←──────── C1              │       │
│   │         │                │                         │       │
│   │         └───────→ T2 ←────┴────→ T1                │       │
│   │              │              │                     │       │
│   │              └────→ B1 ←────┘                     │       │
│   └─────────────────────────────────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Build Steps (4 Steps, ~90 Lines)

### Step 1: Content-Addressable Storage (30 lines)

```python
"""Step 1: Build the object store - Git's core data structure."""
import os
import hashlib
import zlib

class ObjectStore:
    def __init__(self, gitdir=".git"):
        self.gitdir = gitdir
        self.objdir = os.path.join(gitdir, "objects")

    def _hash_content(self, data):
        """Compute SHA-1 hash of content."""
        return hashlib.sha1(data).hexdigest()

    def _obj_path(self, sha):
        """Get path for object: .git/objects/ab/cdef1234..."""
        return os.path.join(self.objdir, sha[:2], sha[2:])

    def write(self, type_, data):
        """Write object to store. Returns SHA-1 hash."""
        # Git format: "type size\0data"
        content = f"{type_} {len(data)}\0".encode() + data
        sha = self._hash_content(content)

        # Store in .git/objects/ab/cdef...
        path = self._obj_path(sha)
        os.makedirs(os.path.dirname(path), exist_ok=True)

        if not os.path.exists(path):
            with open(path, "wb") as f:
                f.write(zlib.compress(content))

        return sha

    def read(self, sha):
        """Read object from store."""
        path = self._obj_path(sha)
        if not os.path.exists(path):
            return None

        with open(path, "rb") as f:
            compressed = f.read()

        data = zlib.decompress(compressed)
        # Parse header
        header_end = data.index(b'\0')
        type_size = data[:header_end].decode()
        type_, size = header_end.split()
        content = data[header_end + 1:]

        return content

    def exists(self, sha):
        return os.path.exists(self._obj_path(sha))

# Test
store = ObjectStore()
sha = store.write("blob", b"Hello, World!")
print(f"Stored blob: {sha}")
content = store.read(sha)
print(f"Read blob: {content}")
```

---

### Step 2: Blobs and Trees (25 lines)

```python
"""Step 2: Implement blobs and trees."""
import time

class GitBlob:
    @staticmethod
    def create(store, content):
        return store.write("blob", content)

class GitTree:
    @staticmethod
    def create(store, entries):
        """
        entries: list of (mode, name, sha)
        e.g., [("100644", "README.md", "abc123...")]
        """
        lines = []
        for mode, name, sha in entries:
            lines.append(f"{mode} {name}\0".encode() + bytes.fromhex(sha))

        data = b"\n".join(lines)
        return store.write("tree", data)

    @staticmethod
    def parse(store, sha):
        """Parse tree into entries."""
        data = store.read(bytes.fromhex(sha))
        entries = []
        pos = 0
        while pos < len(data):
            # Find space
            space = data.index(b' ', pos)
            # Find null
            null = data.index(b'\0', space + 1)
            mode = data[pos:space].decode()
            name = data[space+1:null].decode()
            sha = data[null+1:null+21].hex()
            entries.append((mode, name, sha))
            pos = null + 21
        return entries

# Test
store = ObjectStore()
readme_sha = GitBlob.create(store, b"# My Project\n\nHello!")
script_sha = GitBlob.create(store, b"#!/bin/bash\necho hi")

tree_sha = GitTree.create(store, [
    ("100644", "README.md", readme_sha),
    ("100755", "script.sh", script_sha),
])

entries = GitTree.parse(store, tree_sha)
print(f"Tree has {len(entries)} entries")
for mode, name, sha in entries:
    print(f"  {mode} {name} {sha}")
```

---

### Step 3: Commits (20 lines)

```python
"""Step 3: Implement commits."""
import time

class GitCommit:
    @staticmethod
    def create(store, tree_sha, parent_sha, author, message):
        """Create a commit object."""
        data = f"tree {tree_sha}\n".encode()
        if parent_sha:
            data += f"parent {parent_sha}\n".encode()
        data += f"author {author} {int(time.time())} +0000\n".encode()
        data += f"committer {author} {int(time.time())} +0000\n\n".encode()
        data += message.encode()
        return store.write("commit", data)

    @staticmethod
    def parse(store, sha):
        """Parse commit into fields."""
        data = store.read(bytes.fromhex(sha))
        parts = data.decode().split("\n\n")
        header = parts[0]
        message = parts[1] if len(parts) > 1 else ""

        tree = None
        parent = None
        for line in header.split("\n"):
            if line.startswith("tree "):
                tree = line[5:]
            elif line.startswith("parent "):
                parent = line[7:]

        return {"tree": tree, "parent": parent, "message": message}

# Test (use real SHA computed from actual data)
store = ObjectStore()
blob_sha = GitBlob.create(store, b"# README\nHello world")
tree_sha = GitTree.create(store, [("100644", "README.md", blob_sha)])
commit_sha = GitCommit.create(
    store,
    tree_sha=tree_sha,
    parent_sha=None,
    author="Alice <alice@example.com>",
    message="Initial commit"
)
print(f"Created commit: {commit_sha}")

info = GitCommit.parse(store, commit_sha)
print(f"Tree: {info['tree']}")
print(f"Message: {info['message']}")
```

---

### Step 4: The Repository (15 lines)

```python
"""Step 4: Build the repository."""
import os

class GitRepo:
    def __init__(self, path="."):
        self.path = path
        self.gitdir = os.path.join(path, ".git")
        self.store = ObjectStore(self.gitdir)

    def init(self):
        """Initialize a new repository."""
        os.makedirs(os.path.join(self.gitdir, "objects"), exist_ok=True)
        os.makedirs(os.path.join(self.gitdir, "refs", "heads"), exist_ok=True)
        with open(os.path.join(self.gitdir, "HEAD"), "w") as f:
            f.write("ref: refs/heads/main\n")
        print(f"Initialized empty Git repository in {self.gitdir}")

    def hash_object(self, type_, data):
        return self.store.write(type_, data)

    def cat_file(self, sha):
        return self.store.read(bytes.fromhex(sha))

    def commit(self, tree_sha, parent_sha, author, message):
        return GitCommit.create(self.store, tree_sha, parent_sha, author, message)

# Test
repo = GitRepo("/tmp/myrepo")
repo.init()
sha = repo.hash_object("blob", b"Hello!")
print(f"Object: {sha}")
```

---

## Bridge to Production

| Our mini-git | Real Git |
|--------------|----------|
| In-memory refs | Files in .git/refs/ |
| No pack files | Pack files for compression |
| No branches | Lightweight branch pointers |
| No staging | Index/staging area |
| No merging | 3-way merge algorithm |

**Production systems to study:**
- [Write yourself a Git](https://wyag.thb.lt/) - The classic 15-chapter guide
- [Gitlet](http://gitlet.maryrosecook.com/docs/gitlet.html) - JavaScript implementation

---

## Checklist

- [ ] Step 1: Object store works
- [ ] Step 2: Blobs and trees work
- [ ] Step 3: Commits work
- [ ] Step 4: Repository initialization
- [ ] Add: staging area (git add)
- [ ] Add: branch refs
- [ ] Add: pack files

## Reference Tutorials
- [Write yourself a Git (WYAG)](https://wyag.thb.lt/)
- [Gitlet](https://gitlet.maryrosecook.com/)
- [Git Internals (git-scm)](https://git-scm.com/book/en/v2/Git-Internals)
- [Building Git from scratch (Andrew Chu)](https://github.com/ajd牦/git-from-scratch)