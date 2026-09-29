-- Soul Economy social schema (Cloudflare D1 / SQLite)

CREATE TABLE IF NOT EXISTS users (
  pubkey       TEXT PRIMARY KEY,
  name         TEXT DEFAULT '',
  display_name TEXT DEFAULT '',
  about        TEXT DEFAULT '',
  picture      TEXT DEFAULT '',
  npub         TEXT DEFAULT '',
  plt          TEXT DEFAULT '{"p":0,"l":0,"t":0}',
  created_at   INTEGER DEFAULT 0,
  updated_at   INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS posts (
  id           TEXT PRIMARY KEY,
  pubkey       TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  content      TEXT NOT NULL DEFAULT '',
  kind         INTEGER NOT NULL DEFAULT 1,
  root_id      TEXT,
  parent_id    TEXT,
  soul_slug    TEXT,
  realm        TEXT,
  reply_count  INTEGER NOT NULL DEFAULT 0,
  like_count   INTEGER NOT NULL DEFAULT 0,
  repost_count INTEGER NOT NULL DEFAULT 0,
  plt          TEXT DEFAULT '{}',
  deleted      INTEGER NOT NULL DEFAULT 0,
  hidden       INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_posts_created   ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_pubkey    ON posts(pubkey, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_root      ON posts(root_id, created_at);
CREATE INDEX IF NOT EXISTS idx_posts_parent    ON posts(parent_id, created_at);
CREATE INDEX IF NOT EXISTS idx_posts_soul      ON posts(soul_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_toplevel  ON posts(deleted, hidden, parent_id, created_at DESC);

CREATE TABLE IF NOT EXISTS reactions (
  event_id   TEXT PRIMARY KEY,
  pubkey     TEXT NOT NULL,
  target_id  TEXT NOT NULL,
  content    TEXT DEFAULT '+',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reactions_target  ON reactions(target_id);
CREATE INDEX IF NOT EXISTS idx_reactions_pubkey  ON reactions(pubkey, target_id);

CREATE TABLE IF NOT EXISTS follows (
  follower   TEXT NOT NULL,
  followee   TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (follower, followee)
);
CREATE INDEX IF NOT EXISTS idx_follows_followee ON follows(followee);

CREATE TABLE IF NOT EXISTS notifications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  owner      TEXT NOT NULL,
  type       TEXT NOT NULL,
  actor      TEXT NOT NULL,
  target_id  TEXT,
  snippet    TEXT DEFAULT '',
  created_at INTEGER NOT NULL,
  is_read    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_notify_owner ON notifications(owner, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS mutes (
  owner      TEXT NOT NULL,
  muted      TEXT NOT NULL,
  created_at INTEGER DEFAULT 0,
  PRIMARY KEY (owner, muted)
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS souls (
  slug          TEXT PRIMARY KEY,
  name          TEXT DEFAULT '',
  type          TEXT DEFAULT '',
  plt           TEXT DEFAULT '',
  file          TEXT DEFAULT '',
  anchor_id     TEXT DEFAULT '',
  comment_count INTEGER NOT NULL DEFAULT 0,
  updated_at    INTEGER DEFAULT 0
);
