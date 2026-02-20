-- ============================================================
-- FIX: Use security-definer functions for all workspace_members
-- lookups in RLS policies (prevents infinite recursion)
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- The is_workspace_member function already exists from 002.
-- Now apply it to all remaining policies that self-reference workspace_members.

-- ── Channels ────────────────────────────────────────────────
drop policy if exists "Workspace members can access channels" on channels;
create policy "Workspace members can access channels"
  on channels for all using (
    is_workspace_member(workspace_id)
  );

-- ── Messages ────────────────────────────────────────────────
drop policy if exists "Workspace members can access messages" on messages;
create policy "Workspace members can access messages"
  on messages for all using (
    exists (
      select 1 from channels c
      where c.id = messages.channel_id
        and is_workspace_member(c.workspace_id)
    )
  );

-- ── Boards ──────────────────────────────────────────────────
drop policy if exists "Workspace members can access boards" on boards;
create policy "Workspace members can access boards"
  on boards for all using (
    is_workspace_member(workspace_id)
  );

-- ── Board Columns ───────────────────────────────────────────
drop policy if exists "Workspace members can access columns" on board_columns;
create policy "Workspace members can access columns"
  on board_columns for all using (
    exists (
      select 1 from boards b
      where b.id = board_columns.board_id
        and is_workspace_member(b.workspace_id)
    )
  );

-- ── Tasks ───────────────────────────────────────────────────
drop policy if exists "Workspace members can access tasks" on tasks;
create policy "Workspace members can access tasks"
  on tasks for all using (
    exists (
      select 1 from boards b
      where b.id = tasks.board_id
        and is_workspace_member(b.workspace_id)
    )
  );

-- ── Documents ───────────────────────────────────────────────
drop policy if exists "Workspace members can access documents" on documents;
create policy "Workspace members can access documents"
  on documents for all using (
    is_workspace_member(workspace_id)
  );

-- ── Document Comments ───────────────────────────────────────
drop policy if exists "Workspace members can access comments" on document_comments;
create policy "Workspace members can access comments"
  on document_comments for all using (
    exists (
      select 1 from documents d
      where d.id = document_comments.document_id
        and is_workspace_member(d.workspace_id)
    )
  );

-- ── Whiteboards ─────────────────────────────────────────────
drop policy if exists "Workspace members can access whiteboards" on whiteboards;
create policy "Workspace members can access whiteboards"
  on whiteboards for all using (
    is_workspace_member(workspace_id)
  );
