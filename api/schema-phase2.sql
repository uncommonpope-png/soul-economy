-- Phase 2: search + analytics + newsletter
CREATE TABLE IF NOT EXISTS subscribers (
  email TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  source TEXT DEFAULT 'site'
);

CREATE TABLE IF NOT EXISTS page_views (
  day TEXT NOT NULL,
  path TEXT NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path)
);

CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(doc_id UNINDEXED, content, author);
CREATE VIRTUAL TABLE IF NOT EXISTS souls_fts USING fts5(slug UNINDEXED, name, type UNINDEXED, description);

-- backfill existing posts into FTS
INSERT INTO posts_fts (doc_id, content, author)
SELECT id, content, pubkey FROM posts
WHERE NOT EXISTS (SELECT 1 FROM posts_fts WHERE doc_id = posts.id);
