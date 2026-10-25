-- Unify step 1 — equipped shelves (fresh migration, 2026-10-24).
-- DO NOT apply workers/social-schema.sql or api/schema.sql to any
-- database: both are stale generations that do not describe live D1.
-- This file is the ONLY shelf schema.
--
-- Live D1 database: soul-economy (id 928b98a6-0f88-43ff-8476-2dfb29a5460e)
-- Apply with an authenticated wrangler from a machine with Cloudflare
-- access (the build VM has no wrangler login):
--
--   npx wrangler d1 execute soul-economy --remote --file api/migrations/001-shelves.sql
--
-- Until this runs, GET /api/shelf degrades to {shelf:[], unavailable:true}
-- and POST /api/shelf answers 503 shelves_unavailable; the profile UI
-- falls back to the local shelf and never crashes.
CREATE TABLE IF NOT EXISTS shelves (
  pubkey TEXT PRIMARY KEY,
  shelf TEXT NOT NULL DEFAULT '[]',
  updated_at INTEGER NOT NULL
);
