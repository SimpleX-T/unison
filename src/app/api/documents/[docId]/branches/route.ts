import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createBranch,
  getBranchesForDocument,
  getUserBranch,
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

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (doc.created_by === user.id) {
    const branches = await getBranchesForDocument(docId);
    return NextResponse.json({ branches });
  }

  const branch = await getUserBranch(docId, user.id);
  return NextResponse.json({ branches: branch ? [branch] : [] });
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
  const { language, userName } = body;

  const branch = await createBranch(
    docId,
    user.id,
    language || "en",
    userName || user.id,
  );

  if (!branch) {
    return NextResponse.json({ error: "Failed to create branch" }, { status: 500 });
  }

  return NextResponse.json({ branch });
}
