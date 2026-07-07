---
name: free-vector-db-stack
description: Free open-source vector databases for RAG
domain: database
language: python
stars: "31800"
topics: ["database"]
version: 0.1.0
author: deerg
input_schema:
  type: object
  properties: {}
  required: []
output_schema:
  type: object
  properties: {}
  required: []
---# Free Vector DB Stack

## Origin

Grafted from **qdrant/qdrant**, **weaviate/weaviate**, **chroma-core/chroma** — the three leading open-source vector databases.

## Instructions

Use vector databases for:
- **Agent memory** (semantic recall of past interactions)
- **RAG** (retrieval-augmented generation)
- **Semantic search** across documents
- **Hybrid search** (vector + keyword)
- **Recommendation systems**

## Qdrant CE (Recommended for Production)

### Docker Setup
```bash
docker run -p 6333:6333 qdrant/qdrant
```

### Python Client
```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import uuid

client = QdrantClient(url="http://localhost:6333")

# Create collection
client.create_collection(
    collection_name="docs",
    vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
)

# Upsert points
client.upsert(
    collection_name="docs",
    points=[
        PointStruct(id=str(uuid.uuid4()), vector=[0.1]*1536, payload={"text": "doc content"})
    ]
)

# Search
results = client.search(
    collection_name="docs",
    query_vector=[0.1]*1536,
    limit=5,
)
```

### Hybrid Search (BM25 + Vector)
```python
from qdrant_client.models import Filter, FieldCondition, MatchText

results = client.search(
    collection_name="docs",
    query_vector=[0.1]*1536,
    query_filter=Filter(
        must=[
            FieldCondition(
                key="category",
                match=MatchText(text="python")
            )
        ]
    ),
    limit=5,
)
```

## Weaviate

### Docker Setup
```bash
docker run -p 8080:8080 cr.weaviate.io/semitechnologies/weaviate:1.36.0
```

### Python Client
```python
import weaviate

client = weaviate.connect_to_local()

# Create collection with vectorizer
docs = client.collections.create(
    name="Docs",
    vectorizer_config=weaviate.config.Configure.Vectorizer.text2vec-transformers(),
)

# Add objects
docs.data.insert({"content": "document text"})

# Search
results = docs.query.hybrid("search query", limit=5)
```

## Chroma (Embedded/Development)

### Quick Start
```python
import chromadb

client = chromadb.Client()
collection = client.create_collection("docs")

collection.add(
    documents=["doc1 content", "doc2 content"],
    ids=["id1", "id2"],
)

results = collection.query(
    query_texts=["search query"],
    n_results=5,
)
```

### Persistent Chroma
```python
import chromadb

client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection("docs")
```

## Comparison

| Feature | Qdrant | Weaviate | Chroma |
|---------|--------|----------|--------|
| License | Apache 2.0 | BSD-3 | Apache 2.0 |
| Setup | Docker | Docker | Embeddable |
| Scalability | High | High | Low-Medium |
| Hybrid Search | Yes | Yes | Limited |
| Filtering | Rich | Rich | Basic |
| Best For | Production RAG | Production RAG | Dev/Learn |

## Recommendations

| Use Case | Choice |
|----------|--------|
| Production RAG | Qdrant CE |
| Enterprise | Weaviate |
| Development/Learn | Chroma |
| Embedded (desktop app) | Chroma |
| Hybrid search | Qdrant or Weaviate |

## Agent Memory Pattern

```python
from qdrant_client import QdrantClient

client = QdrantClient(url="http://localhost:6333")

def store_memory(agent_id: str, content: str, vector: list):
    """Store agent experience"""
    client.upsert(
        collection_name="agent_memories",
        points=[{
            "id": f"{agent_id}_{time.time()}",
            "vector": vector,
            "payload": {"agent_id": agent_id, "content": content}
        }]
    )

def recall_memories(agent_id: str, query_vector: list, limit: int = 5):
    """Recall relevant memories"""
    return client.search(
        collection_name="agent_memories",
        query_vector=query_vector,
        query_filter={"must": [{"key": "agent_id", "match": {"value": agent_id}}]},
        limit=limit,
    )
```