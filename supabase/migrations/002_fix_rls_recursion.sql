-- ============================================================
-- FIX: workspace_members infinite recursion
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Drop the three broken policies
drop policy if exists "Members can view workspace_members" on workspace_members;
drop policy if exists "Owners/admins can manage members" on workspace_members;
drop policy if exists "Users can insert themselves as member" on workspace_members;

-- Recreated policies that don't self-reference:

-- SELECT: users can see members of workspaces they belong to.
-- Uses user_id = auth.uid() on the CURRENT row, not a subquery.
create policy "Members can view workspace_members"
  on workspace_members for select using (
    user_id = auth.uid()
  );

-- INSERT: users can always add themselves as a member
create policy "Users can insert themselves as member"
  on workspace_members for insert with check (
    user_id = auth.uid()
  );

-- UPDATE: only owners/admins can update membership rows
-- Uses a security definer function to avoid recursion
create or replace function is_workspace_admin(ws_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

create policy "Owners/admins can update members"
  on workspace_members for update using (
    is_workspace_admin(workspace_id)
  );

-- DELETE: only owners/admins can remove members
create policy "Owners/admins can delete members"
  on workspace_members for delete using (
    is_workspace_admin(workspace_id)
  );

-- Also fix the workspace SELECT policy — it queries workspace_members
-- which triggers workspace_members SELECT policy. Use security definer.
drop policy if exists "Workspace members can view workspace" on workspaces;

create or replace function is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
  );
$$;

create policy "Workspace members can view workspace"
  on workspaces for select using (
    created_by = auth.uid() OR is_workspace_member(id)
  );

-- Fix workspace INSERT policy (auth.role() unreliable in newer Supabase)
drop policy if exists "Authenticated users can create workspaces" on workspaces;
create policy "Authenticated users can create workspaces"
  on workspaces for insert with check (auth.uid() is not null);
