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
