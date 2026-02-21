-- Fix: workspace members should be able to see OTHER members of the same workspace.
-- The migration 002 policy was too restrictive (user_id = auth.uid() only shows own row).
-- Replace with a security-definer approach that avoids RLS recursion.

drop policy if exists "Members can view workspace_members" on workspace_members;

create policy "Members can view workspace_members"
  on workspace_members for select using (
    user_id = auth.uid()
    or is_workspace_member(workspace_id)
  );
