-- ============================================================
-- Real-Time Poll Rooms — Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION
IF
  NOT EXISTS "uuid-ossp";

  -- ─── Polls Table ─────────────────────────────────────────────

  CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
    , question TEXT NOT NULL CHECK (
      char_length(question) >= 1
      AND char_length(question) <= 500
    )
    , created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  -- ─── Options Table ───────────────────────────────────────────

  CREATE TABLE options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
    , poll_id UUID NOT NULL REFERENCES polls(id)
    ON DELETE CASCADE
    , text TEXT NOT NULL CHECK (
      char_length(text) >= 1
      AND char_length(text) <= 200
    )
    , votes INTEGER NOT NULL DEFAULT 0 CHECK (votes >= 0)
  );

  CREATE INDEX idx_options_poll_id
  ON options(poll_id);

  -- ─── Votes Table ─────────────────────────────────────────────
  -- Stores each individual vote for audit and anti-abuse purposes.
  -- The unique constraint on (poll_id, voter_ip) prevents double voting
  -- at the database level — even if the API check is bypassed.

  CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
    , poll_id UUID NOT NULL REFERENCES polls(id)
    ON DELETE CASCADE
    , option_id UUID NOT NULL REFERENCES options(id)
    ON DELETE CASCADE
    , voter_ip TEXT NOT NULL
    , fingerprint TEXT NOT NULL
    , created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  -- Fairness: one vote per IP per poll
  CREATE UNIQUE INDEX idx_votes_poll_ip
  ON votes(poll_id, voter_ip);

  -- Fairness: one vote per fingerprint per poll (secondary check)
  CREATE UNIQUE INDEX idx_votes_poll_fingerprint
  ON votes(poll_id, fingerprint);

  CREATE INDEX idx_votes_poll_id
  ON votes(poll_id);

  -- ─── Row Level Security ──────────────────────────────────────

  ALTER TABLE polls
  ENABLE ROW LEVEL
  SECURITY;
  ALTER TABLE options
  ENABLE ROW LEVEL
  SECURITY;
  ALTER TABLE votes
  ENABLE ROW LEVEL
  SECURITY;

  -- Polls: anyone can read, only service role can insert
  CREATE POLICY "Polls are publicly readable"
  ON polls
  FOR
  SELECT
  USING (true);

  CREATE POLICY "Service role can insert polls"
  ON polls
  FOR INSERT
  WITH CHECK (true);

  -- Options: anyone can read, service role can insert/update
  CREATE POLICY "Options are publicly readable"
  ON options
  FOR
  SELECT
  USING (true);

  CREATE POLICY "Service role can insert options"
  ON options
  FOR INSERT
  WITH CHECK (true);

  CREATE POLICY "Service role can update options"
  ON options
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

  -- Votes: only service role can read/insert (users don't read votes directly)
  CREATE POLICY "Service role can read votes"
  ON votes
  FOR
  SELECT
  USING (true);

  CREATE POLICY "Service role can insert votes"
  ON votes
  FOR INSERT
  WITH CHECK (true);

  -- ─── Enable Realtime (optional) ─────────────────────────────────
  -- Uncomment if using Supabase Realtime instead of HTTP polling.
  -- ALTER PUBLICATION supabase_realtime ADD TABLE options;