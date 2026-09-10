-- soul_social D1 schema (v1) — Soul Economy shared truth layer
-- Apply:  wrangler d1 execute soul_social --file workers/social-schema.sql
--          (remote)   wrangler d1 execute soul_social --remote --file workers/social-schema.sql
-- Conventions: client-generated TEXT ids (Date.now()+rand, same as local app),
-- unix-ms INTEGER timestamps, last-write-wins merges, tombstone deletes.
-- No FOREIGN KEY enforcement (app logic owns integrity); no KV needed.

CREATE TABLE IF NOT EXISTS users (
  handle   TEXT PRIMARY KEY,
  avatar   TEXT DEFAULT '',
  bio      TEXT DEFAULT '',
  created  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS follows (
  follower TEXT NOT NULL,
  target   TEXT NOT NULL,
  kind     TEXT NOT NULL DEFAULT 'person',
  created  INTEGER NOT NULL,
  PRIMARY KEY (follower, target, kind)
);
CREATE INDEX IF NOT EXISTS idx_follows_target ON follows(target, kind);
CREATE INDEX IF NOT EXISTS idx_follows_user ON follows(follower, kind);

CREATE TABLE IF NOT EXISTS posts (
  id       TEXT PRIMARY KEY,
  author   TEXT NOT NULL,
  soul     TEXT NOT NULL DEFAULT '',
  kind     TEXT NOT NULL DEFAULT 'text',
  body     TEXT NOT NULL DEFAULT '',
  url      TEXT NOT NULL DEFAULT '',
  vis      TEXT NOT NULL DEFAULT 'public',
  group_id TEXT NOT NULL DEFAULT '',
  created  INTEGER NOT NULL,
  edited   INTEGER NOT NULL DEFAULT 0,
  deleted  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_posts_feed ON posts(created DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author, created DESC);
CREATE INDEX IF NOT EXISTS idx_posts_soul ON posts(soul, created DESC);
CREATE INDEX IF NOT EXISTS idx_posts_group ON posts(group_id, created DESC);

CREATE TABLE IF NOT EXISTS reactions (
  post_id  TEXT NOT NULL,
  user_    TEXT NOT NULL,
  emoji    TEXT NOT NULL,
  created  INTEGER NOT NULL,
  PRIMARY KEY (post_id, user_, emoji)
);
CREATE INDEX IF NOT EXISTS idx_reactions_post ON reactions(post_id);

CREATE TABLE IF NOT EXISTS replies (
  id        TEXT PRIMARY KEY,
  post_id   TEXT NOT NULL,
  parent_id TEXT NOT NULL DEFAULT '',
  author    TEXT NOT NULL,
  body      TEXT NOT NULL DEFAULT '',
  created   INTEGER NOT NULL,
  edited    INTEGER NOT NULL DEFAULT 0,
  deleted   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_replies_post ON replies(post_id, created);

CREATE TABLE IF NOT EXISTS remixes (
  id      TEXT PRIMARY KEY,
  name    TEXT NOT NULL,
  parent  TEXT NOT NULL,
  by_     TEXT NOT NULL,
  created INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_remixes_parent ON remixes(parent);

CREATE TABLE IF NOT EXISTS versions (
  id      TEXT PRIMARY KEY,
  soul    TEXT NOT NULL,
  v       TEXT NOT NULL DEFAULT '',
  note    TEXT NOT NULL DEFAULT '',
  by_     TEXT NOT NULL,
  created INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_versions_soul ON versions(soul, created DESC);

CREATE TABLE IF NOT EXISTS issues (
  id      TEXT PRIMARY KEY,
  soul    TEXT NOT NULL,
  title   TEXT NOT NULL DEFAULT '',
  body    TEXT NOT NULL DEFAULT '',
  state   TEXT NOT NULL DEFAULT 'OPEN',
  by_     TEXT NOT NULL,
  created INTEGER NOT NULL,
  edited  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_issues_soul ON issues(soul, created DESC);

CREATE TABLE IF NOT EXISTS groups (
  id      TEXT PRIMARY KEY,
  name    TEXT NOT NULL,
  descr   TEXT NOT NULL DEFAULT '',
  vis     TEXT NOT NULL DEFAULT 'PUBLIC',
  by_     TEXT NOT NULL,
  created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS members (
  group_id TEXT NOT NULL,
  user_    TEXT NOT NULL,
  created  INTEGER NOT NULL,
  PRIMARY KEY (group_id, user_)
);

CREATE TABLE IF NOT EXISTS events (
  id      TEXT PRIMARY KEY,
  title   TEXT NOT NULL,
  when_   TEXT NOT NULL DEFAULT '',
  where_  TEXT NOT NULL DEFAULT '',
  by_     TEXT NOT NULL,
  created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS rsvps (
  event_id TEXT NOT NULL,
  user_    TEXT NOT NULL,
  created  INTEGER NOT NULL,
  PRIMARY KEY (event_id, user_)
);

CREATE TABLE IF NOT EXISTS threads (
  id      TEXT PRIMARY KEY,
  user_a  TEXT NOT NULL,
  user_b  TEXT NOT NULL,
  updated INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_threads_user ON threads(user_a, updated DESC);
CREATE INDEX IF NOT EXISTS idx_threads_userb ON threads(user_b, updated DESC);
CREATE TABLE IF NOT EXISTS messages (
  id      TEXT PRIMARY KEY,
  thread  TEXT NOT NULL,
  author  TEXT NOT NULL,
  body    TEXT NOT NULL DEFAULT '',
  created INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread, created);

CREATE TABLE IF NOT EXISTS notifications (
  id      TEXT PRIMARY KEY,
  user_   TEXT NOT NULL,
  kind    TEXT NOT NULL,
  ref     TEXT NOT NULL DEFAULT '',
  actor   TEXT NOT NULL DEFAULT '',
  created INTEGER NOT NULL,
  seen    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_notes_user ON notifications(user_, created DESC);

CREATE TABLE IF NOT EXISTS blocks (
  blocker TEXT NOT NULL,
  blocked TEXT NOT NULL,
  created INTEGER NOT NULL,
  PRIMARY KEY (blocker, blocked)
);
CREATE TABLE IF NOT EXISTS mutes (
  muter   TEXT NOT NULL,
  muted   TEXT NOT NULL,
  created INTEGER NOT NULL,
  PRIMARY KEY (muter, muted)
);
CREATE TABLE IF NOT EXISTS reports (
  id      TEXT PRIMARY KEY,
  kind    TEXT NOT NULL,
  ref     TEXT NOT NULL DEFAULT '',
  by_     TEXT NOT NULL,
  created INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tips (
  id      TEXT PRIMARY KEY,
  to_     TEXT NOT NULL,
  amt     TEXT NOT NULL DEFAULT '',
  note    TEXT NOT NULL DEFAULT '',
  by_     TEXT NOT NULL,
  created INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tips_to ON tips(to_, created DESC);

CREATE TABLE IF NOT EXISTS deletes (
  ref_kind TEXT NOT NULL,
  ref_id   TEXT NOT NULL,
  by_      TEXT NOT NULL,
  created  INTEGER NOT NULL,
  PRIMARY KEY (ref_kind, ref_id)
);

CREATE TABLE IF NOT EXISTS hits (
  key_    TEXT PRIMARY KEY,
  count   INTEGER NOT NULL DEFAULT 0,
  reset   INTEGER NOT NULL DEFAULT 0
);
