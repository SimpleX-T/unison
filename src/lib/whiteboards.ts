import { createClient } from "@/lib/supabase/server";

export interface WhiteboardRow {
  id: string;
  workspace_id: string;
  name: string;
  tldraw_state?: any | null;
  created_by: string;
  created_at: string;
}

/** Get all whiteboards in a workspace */
export async function getWhiteboards(
  workspaceId: string,
): Promise<WhiteboardRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("whiteboards")
    .select("id, workspace_id, name, created_by, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Get a single whiteboard by ID (including tldraw state) */
export async function getWhiteboard(id: string): Promise<WhiteboardRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("whiteboards")
    .select("id, workspace_id, name, tldraw_state, created_by, created_at")
    .eq("id", id)
    .single();
  return data ?? null;
}
