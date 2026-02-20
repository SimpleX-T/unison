import { createClient } from "@/lib/supabase/server";

export interface WorkspaceRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_by: string;
  created_at: string;
  role?: string;
}

/** Get all workspaces the current user belongs to */
export async function getUserWorkspaces(): Promise<WorkspaceRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("workspace_members")
    .select(
      "role, workspaces(id, name, slug, logo_url, created_by, created_at)",
    )
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });

  if (!data) return [];

  return data.map((m) => ({
    ...(m.workspaces as unknown as WorkspaceRow),
    role: m.role,
  }));
}

/** Get a single workspace by slug, verifying the current user is a member */
export async function getWorkspaceBySlug(
  slug: string,
): Promise<WorkspaceRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("workspaces")
    .select("id, name, slug, logo_url, created_by, created_at")
    .eq("slug", slug)
    .single();

  if (!data) return null;

  // Verify membership
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", data.id)
    .eq("user_id", user.id)
    .single();

  if (!membership) return null;

  return { ...data, role: membership.role };
}

/** Create a new workspace and add the creator as owner */
export async function createWorkspace(
  name: string,
  slug: string,
): Promise<WorkspaceRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: workspace, error } = await supabase
    .from("workspaces")
    .insert({ name, slug, created_by: user.id })
    .select()
    .single();

  if (error || !workspace) return null;

  await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: "owner",
  });

  // Seed #general channel
  await supabase.from("channels").insert({
    workspace_id: workspace.id,
    name: "general",
    created_by: user.id,
  });

  return workspace;
}

/** Get workspace members with profiles attached */
export async function getWorkspaceMembers(workspaceId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workspace_members")
    .select(
      "role, joined_at, profiles(id, display_name, avatar_url, preferred_language)",
    )
    .eq("workspace_id", workspaceId);
  return data ?? [];
}
