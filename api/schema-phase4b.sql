-- Phase 4b: semantic vectors for hybrid search.
-- 768-dim embeddings from @cf/baai/bge-base-en-v1.5 (Workers AI, free tier).
-- Seeded by scripts/embed-souls.mjs; consumed by /api/search (RRF-merged with souls_fts BM25).
CREATE TABLE IF NOT EXISTS soul_vec (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  description TEXT,
  dims INTEGER NOT NULL,
  embedding TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
