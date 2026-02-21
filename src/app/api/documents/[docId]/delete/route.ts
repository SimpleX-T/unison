import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  const { docId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  const { data: doc } = await supabase
    .from("documents")
    .select("created_by, title, workspace_id")
    .eq("id", docId)
    .single();

  if (!doc)
    return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const isOwner = doc.created_by === user.id;

  // Owner: delete the entire document for everyone
  if (action === "delete_for_all") {
    if (!isOwner) {
      return NextResponse.json(
        { error: "Only the owner can delete for all" },
        { status: 403 },
      );
    }

    // Get all collaborators to notify them
    const { data: collaborators } = await supabase
      .from("document_access")
      .select("user_id")
      .eq("document_id", docId);

    // Also get branch owners who may not have explicit access rows
    const { data: branchOwners } = await supabase
      .from("document_branches")
      .select("owner_id")
      .eq("document_id", docId);

    const userIdsToNotify = new Set<string>();
    collaborators?.forEach((c) => userIdsToNotify.add(c.user_id));
    branchOwners?.forEach((b) => userIdsToNotify.add(b.owner_id));
    userIdsToNotify.delete(user.id);

    const { data: ws } = await supabase
      .from("workspaces")
      .select("slug")
      .eq("id", doc.workspace_id)
      .single();

    // Notify all collaborators
    if (userIdsToNotify.size > 0) {
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      await supabase.from("notifications").insert(
        [...userIdsToNotify].map((uid) => ({
          user_id: uid,
          type: "document_deleted",
          title: `"${doc.title || "Untitled"}" was deleted`,
          body: `${ownerProfile?.display_name || "The owner"} deleted the document`,
          link: ws ? `/workspace/${ws.slug}/docs` : undefined,
          metadata: { document_id: docId, deleted_by: user.id },
        })),
      );
    }

    // Cascade delete: branches, merge_requests, access, comments all cascade via FK
    await supabase.from("documents").delete().eq("id", docId);

    return NextResponse.json({ success: true, action: "deleted_for_all" });
  }

  // Collaborator: quit collaboration (delete branch + remove access)
  if (action === "quit_collaboration") {
    if (isOwner) {
      return NextResponse.json(
        { error: "Owner cannot quit — use delete_for_all instead" },
        { status: 400 },
      );
    }

    // Delete their branch(es)
    await supabase
      .from("document_branches")
      .delete()
      .eq("document_id", docId)
      .eq("owner_id", user.id);

    // Delete any pending merge requests they submitted
    await supabase
      .from("merge_requests")
      .delete()
      .eq("document_id", docId)
      .eq("submitted_by", user.id);

    // Remove explicit access if it exists
    await supabase
      .from("document_access")
      .delete()
      .eq("document_id", docId)
      .eq("user_id", user.id);

    // Notify the owner
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const { data: ws } = await supabase
      .from("workspaces")
      .select("slug")
      .eq("id", doc.workspace_id)
      .single();

    await supabase.from("notifications").insert({
      user_id: doc.created_by,
      type: "collaborator_left",
      title: `${profile?.display_name || "A collaborator"} left "${doc.title || "Untitled"}"`,
      body: "They quit collaboration on this document",
      link: ws ? `/workspace/${ws.slug}/docs/${docId}` : undefined,
      metadata: { document_id: docId, user_id: user.id },
    });

    return NextResponse.json({ success: true, action: "quit_collaboration" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
