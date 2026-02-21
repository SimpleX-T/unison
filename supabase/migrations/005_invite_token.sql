-- ============================================================
-- ADD invite_token to workspaces for shareable invite links
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS invite_token text
    UNIQUE DEFAULT gen_random_uuid()::text;

-- Back-fill existing workspaces
UPDATE workspaces SET invite_token = gen_random_uuid()::text
  WHERE invite_token IS NULL;
