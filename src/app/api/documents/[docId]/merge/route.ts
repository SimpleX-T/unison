import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  submitBranchForMerge,
  getPendingMergeRequests,
  approveMerge,
  rejectMerge,
} from "@/lib/branches";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  const { docId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: doc } = await supabase
    .from("documents")
    .select("created_by")
    .eq("id", docId)
    .single();

  if (!doc || doc.created_by !== user.id) {
    return NextResponse.json({ error: "Only the document owner can view merges" }, { status: 403 });
  }

  const mergeRequests = await getPendingMergeRequests(docId);
  return NextResponse.json({ mergeRequests });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  const { docId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, branchId, mergeRequestId, note, translatedContent } = body;

  if (action === "submit") {
    if (!branchId) {
      return NextResponse.json({ error: "branchId required" }, { status: 400 });
    }
    const result = await submitBranchForMerge(branchId);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Notify the document owner about the merge request
    const { data: doc } = await supabase
      .from("documents")
      .select("created_by, title, workspace_id")
      .eq("id", docId)
      .single();

    if (doc) {
      const { data: submitterProfile } = await supabase
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
        type: "merge_request",
        title: `${submitterProfile?.display_name || "A collaborator"} submitted changes for review`,
        body: `Changes on "${doc.title || "Untitled"}" are ready to merge`,
        link: ws ? `/workspace/${ws.slug}/docs/${docId}` : undefined,
        metadata: { document_id: docId, branch_id: branchId, submitted_by: user.id },
      });
    }

    return NextResponse.json({ success: true });
  }

  if (action === "approve") {
    if (!mergeRequestId) {
      return NextResponse.json({ error: "mergeRequestId required" }, { status: 400 });
    }

    const { data: doc } = await supabase
      .from("documents")
      .select("created_by")
      .eq("id", docId)
      .single();

    if (!doc || doc.created_by !== user.id) {
      return NextResponse.json({ error: "Only the owner can approve merges" }, { status: 403 });
    }

    const result = await approveMerge(mergeRequestId, translatedContent ?? "");
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  }

  if (action === "reject") {
    if (!mergeRequestId) {
      return NextResponse.json({ error: "mergeRequestId required" }, { status: 400 });
    }

    const { data: doc } = await supabase
      .from("documents")
      .select("created_by")
      .eq("id", docId)
      .single();

    if (!doc || doc.created_by !== user.id) {
      return NextResponse.json({ error: "Only the owner can reject merges" }, { status: 403 });
    }

    const result = await rejectMerge(mergeRequestId, note);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
