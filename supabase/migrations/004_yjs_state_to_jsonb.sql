-- ============================================================
-- FIX: Change yjs_state from bytea to jsonb
-- The Supabase JS client sends JSON arrays, but bytea columns
-- hex-encode them on the way in, mangling the data.
-- jsonb stores and returns [1,3,144,...] arrays correctly.
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

ALTER TABLE documents
  ALTER COLUMN yjs_state TYPE jsonb USING NULL;
