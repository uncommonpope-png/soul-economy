---
name: search-engine-from-scratch
description: Build a Search Engine from Scratch
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
---# Build a Search Engine from Scratch

---
name: search-engine-from-scratch
description: Use when user wants to understand how search engines work, build a search algorithm, or learn about TF-IDF, inverted indexes, and ranking. Triggers on: "build search engine", "TF-IDF", "inverted index", "ranking", "relevance".
---

## The Mental Model

A search engine has three phases: crawl/index documents, parse/tokenize queries, match and rank results. The core challenge is ranking—determining which documents are most relevant to a query.

## The Mental Model

A search engine has three phases: crawl/index documents, parse/tokenize queries, match and rank results. The core challenge is ranking—determining which documents are most relevant to a query.

```
┌─────────────────────────────────────────────────────────────────┐
│                  SEARCH ENGINE ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   CRAWLER → DOCUMENTS → TOKENIZER → INVERTED INDEX             │
│                                                │                │
│   QUERY ──► TOKENIZER ──► QUERY VECTOR ──► RANKER ──► RESULTS  │
│                                          │                      │
│                                    TF-IDF / BM25                │
│                                    cosine similarity            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## The Build Steps (5 Steps, ~80 Lines)

### Step 1: Document Index (20 lines)

```python
"""Step 1: Basic document indexing."""
import re
from collections import defaultdict
import math

class SearchEngine:
    def __init__(self):
        self.documents = {}  # doc_id -> text
        self.index = defaultdict(set)  # term -> {doc_ids}
        self.doc_lengths = {}

    def add_doc(self, doc_id, text):
        """Add a document to the index."""
        self.documents[doc_id] = text
        tokens = self._tokenize(text)
        for token in tokens:
            self.index[token].add(doc_id)
        self.doc_lengths[doc_id] = len(tokens)

    def _tokenize(self, text):
        """Convert text to lowercase tokens."""
        return re.findall(r'\w+', text.lower())

    def search(self, query):
        """Search for query terms."""
        tokens = self._tokenize(query)
        if not tokens:
            return []

        # Get matching docs for first term
        results = self.index.get(tokens[0], set()).copy()

        # Intersect with other terms
        for token in tokens[1:]:
            results &= self.index.get(token, set())

        return list(results)

    def count(self, term):
        """Count documents containing term."""
        return len(self.index.get(term.lower(), set()))

# Test
engine = SearchEngine()
engine.add_doc(1, "Python programming language")
engine.add_doc(2, "Java programming language")
engine.add_doc(3, "JavaScript web development")
results = engine.search("programming")
print(f"Found in docs: {results}")
```

---

### Step 2: TF-IDF Ranking (25 lines)

```python
"""Step 2: Add TF-IDF ranking."""

    def tf(self, term, doc_id):
        """Term frequency in a document."""
        text = self.documents[doc_id].lower()
        tokens = self._tokenize(text)
        return tokens.count(term.lower()) / len(tokens)

    def idf(self, term):
        """Inverse document frequency."""
        n = len(self.documents)
        df = len(self.index.get(term.lower(), set()))
        return math.log(n / (df + 1))

    def score(self, term, doc_id):
        """TF-IDF score."""
        return self.tf(term, doc_id) * self.idf(term)

    def rank(self, query):
        """Rank documents by query relevance."""
        tokens = self._tokenize(query)
        if not tokens:
            return []

        candidates = set()
        for token in tokens:
            candidates |= self.index.get(token, set())

        scores = []
        for doc_id in candidates:
            score = sum(self.score(token, doc_id) for token in tokens)
            scores.append((score, doc_id))

        scores.sort(reverse=True)
        return [(doc_id, score) for score, doc_id in scores]

# Test
engine.add_doc(4, "Python machine learning")
engine.add_doc(5, "Java enterprise software")
results = engine.rank("Python Java")
for doc_id, score in results:
    print(f"Doc {doc_id}: {score:.3f} - {engine.documents[doc_id]}")
```

---

### Step 3: Inverted Index (20 lines)

```python
"""Step 3: Inverted index for fast lookups."""

class InvertedIndex:
    def __init__(self):
        self.index = defaultdict(list)  # term -> [(doc_id, position)]
        self.doc_count = 0

    def add_doc(self, doc_id, text):
        """Add document with position tracking."""
        tokens = text.lower().split()
        for pos, token in enumerate(tokens):
            self.index[token].append((doc_id, pos))

    def search_phrase(self, phrase):
        """Search for exact phrase."""
        tokens = phrase.lower().split()
        if not tokens:
            return []

        # Start with first term
        candidates = set(doc for doc, _ in self.index.get(tokens[0], []))

        for i, token in enumerate(tokens[1:], 1):
            new_candidates = set()
            for doc_id in candidates:
                positions = [pos for d, pos in self.index.get(token, []) if d == doc_id]
                # Check if any position is immediately after previous
                prev_positions = [pos for d, pos in self.index.get(tokens[i-1], []) if d == doc_id]
                for prev in prev_positions:
                    if (prev + 1) in positions:
                        new_candidates.add(doc_id)
            candidates = new_candidates

        return list(candidates)

# Test
idx = InvertedIndex()
idx.add_doc(1, "the quick brown fox")
idx.add_doc(2, "the lazy dog")
idx.add_doc(3, "quick brown fox jumps")
results = idx.search_phrase("quick brown")
print(f"Phrase 'quick brown' in docs: {results}")
```

---

### Step 4: Vector Space Model (15 lines)

```python
"""Step 4: Vector space model for relevance."""

import numpy as np

class VectorSpace:
    def __init__(self):
        self.terms = set()
        self.doc_vectors = {}

    def build_vectors(self, engine):
        """Build TF-IDF vectors for all documents."""
        terms = list(engine.index.keys())
        self.terms = {t: i for i, t in enumerate(terms)}

        for doc_id in engine.documents:
            vector = np.zeros(len(terms))
            for term in self.terms:
                vector[self.terms[term]] = engine.score(term, doc_id)
            self.doc_vectors[doc_id] = vector

    def cosine_similarity(self, v1, v2):
        """Compute cosine similarity between vectors."""
        dot = np.dot(v1, v2)
        norm = np.linalg.norm(v1) * np.linalg.norm(v2)
        return dot / (norm + 1e-10)

    def search(self, query, engine, top_k=5):
        """Search using cosine similarity."""
        # Build query vector
        query_vec = np.zeros(len(self.terms))
        for term in engine._tokenize(query):
            if term in self.terms:
                query_vec[self.terms[term]] = engine.idf(term)

        # Compare with all docs
        scores = []
        for doc_id, doc_vec in self.doc_vectors.items():
            sim = self.cosine_similarity(query_vec, doc_vec)
            scores.append((doc_id, sim))

        scores.sort(key=lambda x: -x[1])
        return scores[:top_k]

# Test
vs = VectorSpace()
vs.build_vectors(engine)
results = vs.search("programming", engine)
print("Top results:", results)
```

---

# Test
vs = VectorSpace()
vs.build_vectors(engine)
results = vs.search("programming", engine)
print("Top results:", results)
```

---

### Step 5: Stemming and Lemmatization

```python
"""Step 5: Add stemming to improve recall."""

def simple_stem(word):
    """Simple Porter-like stemmer: strip common suffixes."""
    word = word.lower()
    suffixes = ['ing', 'ed', 'es', 's', 'er', 'ly', 'tion', 'ness', 'ment']
    for suffix in suffixes:
        if word.endswith(suffix) and len(word) > len(suffix) + 2:
            return word[:-len(suffix)]
    return word

class StemmingSearchEngine:
    def __init__(self):
        self.engine = SearchEngine()
        self.documents = {}

    def add_doc(self, doc_id, text):
        self.documents[doc_id] = text
        # Tokenize and stem
        tokens = self.engine._tokenize(text)
        stemmed = [simple_stem(t) for t in tokens]
        stemmed_text = ' '.join(stemmed)
        self.engine.add_doc(doc_id, stemmed_text)

    def search(self, query):
        tokens = self.engine._tokenize(query)
        stemmed = [simple_stem(t) for t in tokens]
        stemmed_query = ' '.join(stemmed)
        return self.engine.search(stemmed_query)

# Test: "programming" and "programs" both match "program"
se = StemmingSearchEngine()
se.add_doc(1, "I like programming in Python")
se.add_doc(2, "Python programs are great")
print(se.search("programs"))  # Should match both docs
print(se.search("programming"))  # Should also match
```

## Checklist
- [ ] Step 1: Document indexing
- [ ] Step 2: TF-IDF ranking
- [ ] Step 3: Inverted index
- [ ] Step 4: Vector space model
- [ ] Step 5: Stemming/lemmatization
- [ ] Add: BM25 ranking algorithm
- [ ] Add: pagination