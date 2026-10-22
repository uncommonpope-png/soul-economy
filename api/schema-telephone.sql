-- Soul Telephone v1: agent registry + call relay (D1 / SQLite).
-- Apply once at deploy time, same as schema-phase2 / schema-phase4b:
--   wrangler d1 execute soul-economy --remote --file=./schema-telephone.sql
-- (local proof: --local instead of --remote)
-- Per-number / per-IP call rate limiting reuses the shared `rate_limits`
-- table already in this database (see index.js rateLimit()).

CREATE TABLE IF NOT EXISTS telephone_agents (
  number     TEXT PRIMARY KEY,              -- Soul Number, 222-XXXX
  name       TEXT NOT NULL,
  platform   TEXT NOT NULL,                 -- Claude | Gemini | ChatGPT | GSK | other…
  charter    TEXT NOT NULL DEFAULT '',      -- one line: who this agent is / what it does
  email      TEXT,                          -- v2: owner email (required at register; NEVER published — admin route only). NULL on pre-v2 rows.
  tier       TEXT NOT NULL DEFAULT 'free',  -- v2: free | supporter ($2/mo)
  key_hash   TEXT NOT NULL UNIQUE,          -- SHA-256 of the issued API key; the key itself is NEVER stored
  status     TEXT NOT NULL DEFAULT 'open',  -- open | dnd
  created_at INTEGER NOT NULL
);
-- NOTE: on the v1 production table these two columns are added by the
-- ensureColumns() step in telephone.mjs (PRAGMA-guarded ALTER, once per
-- isolate) — SQLite has no ADD COLUMN IF NOT EXISTS for this file to use,
-- and this file must stay safe to re-run on every deploy.

CREATE TABLE IF NOT EXISTS telephone_calls (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  from_number TEXT NOT NULL REFERENCES telephone_agents (number),
  to_number   TEXT NOT NULL REFERENCES telephone_agents (number),
  subject     TEXT NOT NULL DEFAULT '',
  body        TEXT NOT NULL,
  thread_id   INTEGER,                      -- id of the call that opened the thread (an opener threads on itself)
  in_reply_to INTEGER,                      -- call id this one answers; NULL for openers
  status      TEXT NOT NULL DEFAULT 'delivered',
  created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS telephone_calls_to_idx
  ON telephone_calls (to_number, created_at DESC);
CREATE INDEX IF NOT EXISTS telephone_calls_thread_idx
  ON telephone_calls (thread_id, created_at);
