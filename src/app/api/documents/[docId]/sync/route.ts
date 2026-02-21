import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as Y from "yjs";

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
  const { branchId } = body;
  if (!branchId)
    return NextResponse.json({ error: "branchId required" }, { status: 400 });

  const { data: branch } = await supabase
    .from("document_branches")
    .select("owner_id, status, yjs_state")
    .eq("id", branchId)
    .single();

  if (!branch || branch.owner_id !== user.id)
    return NextResponse.json({ error: "Not your branch" }, { status: 403 });

  if (branch.status === "submitted")
    return NextResponse.json(
      { error: "Cannot sync while submitted for review" },
      { status: 400 },
    );

  const { data: doc } = await supabase
    .from("documents")
    .select("yjs_state, updated_at")
    .eq("id", docId)
    .single();

  if (!doc)
    return NextResponse.json({ error: "Document not found" }, { status: 404 });

  // CRDT merge: apply main's state on top of the branch's state.
  // Since both share a common ancestor (the fork point), Yjs will
  // correctly merge concurrent edits from both the owner and collaborator.
  const mergedDoc = new Y.Doc();

  if (
    branch.yjs_state &&
    Array.isArray(branch.yjs_state) &&
    branch.yjs_state.length > 0
  ) {
    Y.applyUpdate(mergedDoc, new Uint8Array(branch.yjs_state));
  }

  if (
    doc.yjs_state &&
    Array.isArray(doc.yjs_state) &&
    doc.yjs_state.length > 0
  ) {
    Y.applyUpdate(mergedDoc, new Uint8Array(doc.yjs_state));
  }

  const mergedState = Array.from(Y.encodeStateAsUpdate(mergedDoc));
  mergedDoc.destroy();

  await supabase
    .from("document_branches")
    .update({
      yjs_state: mergedState,
      updated_at: new Date().toISOString(),
    })
    .eq("id", branchId);

  return NextResponse.json({
    success: true,
    mainUpdatedAt: doc.updated_at,
  });
}

/** Check if main has been updated since the branch was last synced */
export async function GET(
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

  const branchId = req.nextUrl.searchParams.get("branchId");
  if (!branchId)
    return NextResponse.json({ error: "branchId required" }, { status: 400 });

  const [{ data: doc }, { data: branch }] = await Promise.all([
    supabase
      .from("documents")
      .select("updated_at")
      .eq("id", docId)
      .single(),
    supabase
      .from("document_branches")
      .select("updated_at, created_at")
      .eq("id", branchId)
      .single(),
  ]);

  if (!doc || !branch)
    return NextResponse.json({ hasUpdates: false });

  const mainUpdated = new Date(doc.updated_at).getTime();
  const branchUpdated = new Date(branch.updated_at || branch.created_at).getTime();

  return NextResponse.json({
    hasUpdates: mainUpdated > branchUpdated,
    mainUpdatedAt: doc.updated_at,
    branchUpdatedAt: branch.updated_at,
  });
}
