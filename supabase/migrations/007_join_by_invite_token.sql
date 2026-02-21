-- Security-definer function to look up a workspace by invite token.
-- Bypasses RLS so unauthenticated-to-workspace users can resolve an invite link.
-- Only returns the workspace id and slug — no sensitive data is exposed.

create or replace function lookup_workspace_by_invite_token(lookup_token text)
returns table(id uuid, slug text)
language sql
security definer
set search_path = ''
as $$
  select w.id, w.slug
  from public.workspaces w
  where w.invite_token = lookup_token
  limit 1;
$$;
