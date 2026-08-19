-- Applied automatically by lib/db.js on first request. Kept here for reference
-- and for anyone who wants to run it manually via their DB provider's SQL console.
CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
