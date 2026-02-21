import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/workspace/invite?workspaceId=... → returns invite link */
export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check the user is a member of this workspace
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  // Get or generate invite token
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("invite_token")
    .eq("id", workspaceId)
    .single();

  if (!workspace?.invite_token) {
    // Generate one if missing
    const token = crypto.randomUUID();
    await supabase
      .from("workspaces")
      .update({ invite_token: token })
      .eq("id", workspaceId);
    return NextResponse.json({ token });
  }

  return NextResponse.json({ token: workspace.invite_token });
}
