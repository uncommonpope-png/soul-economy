---
name: llamaindex
description: Agent Integration Patterns
domain: computer-science
language: python
stars: "0"
topics: ["computer-science"]
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
-----|---|
| VectorStoreIndex | Dense semantic search | Vector DB (Pinecone, Qdrant, Chroma, Weaviate) |
| SummaryIndex | List/array summaries | In-memory |
| TreeIndex | Hierarchical summaries | In-memory |
| KeywordTableIndex | Keyword search | In-memory |
| KnowledgeGraphIndex | Graph-based RAG | Neo4j, FalkDB |
| DocumentManagementIndex | Multi-doc reasoning | In-memory |

## Agent Integration Patterns

### Pattern 1: Basic RAG Query Engine
```python
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader

# Load + index documents
documents = SimpleDirectoryReader("./docs").load_data()
index = VectorStoreIndex.from_documents(documents)

# Simple query
query_engine = index.as_query_engine(
    similarity_top_k=3,
    response_mode="compact",
)
response = query_engine.query("What is the company's return policy?")
print(response)
```

### Pattern 2: Agent with RAG Tools
```python
from llama_index.core.agent import ReActAgent
from llama_index.core.tools import QueryEngineTool, ToolMetadata

# Create query engine with metadata
policy_tool = QueryEngineTool(
    query_engine=policy_index.as_query_engine(),
    metadata=ToolMetadata(
        name="policy_search",
        description="Searches the employee handbook and policy documents",
    ),
)
code_tool = QueryEngineTool(
    query_engine=code_index.as_query_engine(),
    metadata=ToolMetadata(
        name="code_search",
        description="Searches the codebase documentation",
    ),
)

# Agent can use both tools — decides which to call based on question
agent = ReActAgent.from_tools(
    tools=[policy_tool, code_tool],
    llm=OpenAI("gpt-4o"),
    verbose=True,
)

response = agent.chat("What's the vacation policy for senior engineers?")
```

### Pattern 3: Multi-Document Reasoning
```python
from llama_index.core import VectorStoreIndex
from llama_index.core.query_engine import SubQuestionQueryEngine

# Index multiple document collections
annual_report_index = VectorStoreIndex.from_documents(annual_report_docs)
press_release_index = VectorStoreIndex.from_documents(press_release_docs)

# SubQuestion engine breaks complex queries into sub-questions per index
base_index = VectorStoreIndex.from_documents(all_docs)
query_engine = SubQuestionQueryEngine.from_defaults(
    index=base_index,
    sub_question_weights={"annual_reports": 0.7, "press_releases": 0.3},
)

# "Compare Q3 2023 vs Q3 2024 revenue growth" 
# → SubQuestion engine asks: "Q3 2023 revenue?" and "Q3 2024 revenue?"
# → Synthesizes both answers
response = query_engine.query("Compare Q3 2023 vs Q3 2024 revenue growth")
```

### Pattern 4: Router (Query Routing)
```python
from llama_index.core import VectorStoreIndex
from llama_index.core.selectors import LLMMultiSelector

# Two specialized indexes
product_index = VectorStoreIndex.from_documents(product_docs)
support_index = VectorStoreIndex.from_documents(support_docs)

# Router decides which index to query based on query intent
from llama_index.core.query_engine import RouterQueryEngine
selector = LLMMultiSelector.from_defaults()

query_engine = RouterQueryEngine(
    selector=selector,
    query_engine_tools=[
        QueryEngineTool(
            query_engine=product_index.as_query_engine(),
            metadata=ToolMetadata(
                name="product_knowledge",
                description="Product specs, features, pricing",
            ),
        ),
        QueryEngineTool(
            query_engine=support_index.as_query_engine(),
            metadata=ToolMetadata(
                name="customer_support",
                description="Support tickets, troubleshooting guides",
            ),
        ),
    ],
)
```

### Pattern 5: Knowledge Graph RAG
```python
from llama_index.core import KnowledgeGraphIndex
from llama_index.core.storage.storage_context import StorageContext

# Extract entities and relationships into a graph
kg_index = KnowledgeGraphIndex.from_documents(
    documents,
    storage_context=StorageContext.from_defaults(
        graph_store=FalkorDBGraphStore(host="localhost", port=6379)
    ),
    max_triplets=10000,
)

# Query the knowledge graph
query_engine = kg_index.as_query_engine(
    include_embedding=True,
    similarity_top_k=5,
)

response = query_engine.query(
    "What companies did Acme Corp acquire between 2020-2024?"
)
```

### Pattern 6: Hybrid Search
```python
from llama_index.core import VectorStoreIndex
from llama_index.core.retrievers import QueryFusionRetriever

# Combine vector + keyword + BM25 search
vector_retriever = vector_index.as_retriever(similarity_top_k=10)
bm25_retriever = BM25Retriever.from_defaults(documents=documents, k=10)

# Fuse results with Reciprocal Rank Fusion
retriever = QueryFusionRetriever(
    retrievers=[vector_retriever, bm25_retriever],
    mode="rrf",  # Reciprocal Rank Fusion
    top_k=5,
)

query_engine = RetrieverQueryEngine(retriever=retriever)
```

## Advanced Features

### 1. Query Fusion / Auto-Retrieval
```python
from llama_index.core.retrievers import QueryFusionRetriever

# Fusion combines multiple retrieval strategies
retriever = QueryFusionRetriever(
    retrievers=[
        vector_index.as_retriever(similarity_top_k=10),
        keyword_index.as_retriever(top_k=10),
        knowledge_graph.as_retriever(top_k=5),
    ],
    mode="reciprocal_rank",  # or "distr_score", "relative_score"
    top_k=5,
    threshold=0.5,  # Skip results below this relevance
)
```

### 2. Recursive Retrieval (Chunk Hierarchy)
```python
from llama_index.core import VectorStoreIndex
from llama_index.core.node_parser import HierarchicalNodeParser

# Build chunk hierarchy: large chunks → smaller chunks
node_parser = HierarchicalNodeParser.from_defaults(
    chunk_sizes=[2048, 512, 128],  # Parent → mid → leaf
)

nodes = node_parser.get_nodes_from_documents(documents)
# When retrieving, fetch small chunks but use parent chunks for context
index = VectorStoreIndex(nodes)
```

### 3. Node Post-Processors (Reranking)
```python
from llama_index.core.postprocessor import SimilarityPostprocessor, SentenceTransformerRerank

query_engine = index.as_query_engine(
    similarity_top_k=20,  # Retrieve more, then rerank
    node_postprocessors=[
        SimilarityPostprocessor(similarity_threshold=0.7),
        SentenceTransformerRerank(top_n=5, model="BAAI/bge-reranker-base"),
    ],
)
```

### 4. Storage & Persistence
```python
from llama_index.core import load_index_from_storage
from llama_index.core.storage.storage_context import StorageContext

# Save index
index = VectorStoreIndex.from_documents(documents)
index.storage_context.persist("./storage")

# Load index
storage_context = StorageContext.from_defaults(persist_dir="./storage")
index = load_index_from_storage(storage_context)
```

### 5. Streaming Responses
```python
query_engine = index.as_query_engine(streaming=True)
handler = query_engine.query("Explain the quarterly results")
for chunk in handler.response_gen:
    print(chunk, end="", flush=True)
```

### 6. Multi-Modal RAG (Images + Text)
```python
from llama_index.multi_modal_llm.openai import OpenAIMultiModal
from llama_index.core import SimpleDirectoryReader

# Index documents with images
documents = SimpleDirectoryReader("./mixed_content").load_data()

# Multi-modal query — model reasons over both text and images
mm_llm = OpenAIMultiModal(model="gpt-4o")
response = mm_llm.complete(
    prompt="What does the chart in this document show?",
    image_documents=relevant_images,
)
```

## Best Practices

1. **Choose chunk size carefully** — 512 tokens is a good default, but semantically split on natural discourse boundaries when possible (SemanticSplitterNodeParser).
2. **Use SummaryIndex for small lists** — If you have a known set of items (FAQ, product list), a simple list index is faster than vector search.
3. **Set `similarity_top_k` high then rerank** — Fetch 10-20, then rerank with cross-encoder. Much better results than relying on raw similarity.
4. **Use SubQuestionQueryEngine for multi-document** — Complex questions across many documents need decomposed sub-queries.
5. **Metadata is critical** — Add source, date, author, tags to documents before indexing. Enables filtering at retrieval time.
6. **Hybrid search > pure vector** — Always add BM25 or keyword search alongside vector search for production systems.
7. **Use KnowledgeGraphIndex for relationships** — If your data has entities with relationships (companies → acquisitions → people), graph indexing finds paths vector search misses.
8. **Stream for user-facing** — Streaming responses feel much faster even if total time is similar.

## Skill Usage Notes

- **Best for**: Building knowledge bases over documents, enterprise RAG, multi-document reasoning, and agents that need to reference private/proprietary data.
- **Stack position**: Data layer / knowledge retrieval. Sits alongside agent frameworks — LlamaIndex provides the brain, other frameworks provide the agent logic.
- **Storage**: Pairs well with all vector DBs (Qdrant, Weaviate, Chroma). Persist indexes to disk or cloud storage.
- **LLM agnostic**: Works with OpenAI, Anthropic, Gemini, Ollama, Azure, and any LangChain-compatible LLM.
- **Cost**: Indexing has one-time cost; querying costs depend on retrieval + synthesis calls. Use caching to reduce repeated query costs.

## Resources
- GitHub: github.com/run-llama/llama_index (49.9k stars)
- Docs: docs.llamaindex.ai
- Discord: 15k+ members
- PyPI: `llama-index`