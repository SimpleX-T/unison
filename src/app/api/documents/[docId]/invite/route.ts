import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  inviteUserToDocument,
  getDocumentCollaborators,
  revokeAccess,
} from "@/lib/documentAccess";

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

  const { data: doc } = await supabase
    .from("documents")
    .select("created_by")
    .eq("id", docId)
    .single();

  if (!doc || doc.created_by !== user.id) {
    return NextResponse.json({ error: "Only the document owner can invite" }, { status: 403 });
  }

  const body = await req.json();
  const { userId, role } = body;

  if (!userId || !role) {
    return NextResponse.json({ error: "userId and role are required" }, { status: 400 });
  }

  const result = await inviteUserToDocument(docId, userId, role);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  const { docId } = await params;
  const collaborators = await getDocumentCollaborators(docId);
  return NextResponse.json({ collaborators });
}

export async function DELETE(
  req: NextRequest,
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
    return NextResponse.json({ error: "Only the document owner can revoke access" }, { status: 403 });
  }

  const body = await req.json();
  const result = await revokeAccess(docId, body.userId);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
