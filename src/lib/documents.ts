import { createClient } from "@/lib/supabase/server";

export interface DocumentRow {
  id: string;
  workspace_id: string;
  title: string;
  title_original_language: string;
  yjs_state?: string | null; // only fetched when opening the editor
  created_by: string;
  last_edited_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Get all documents in a workspace, sorted by updated_at */
export async function getDocuments(
  workspaceId: string,
): Promise<DocumentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select(
      "id, workspace_id, title, title_original_language, created_by, last_edited_by, created_at, updated_at",
    )
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });
  return data ?? [];
}

/** Get a single document by ID (without the Yjs blob — fetch that separately) */
export async function getDocument(docId: string): Promise<DocumentRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select(
      "id, workspace_id, title, title_original_language, created_by, last_edited_by, created_at, updated_at",
    )
    .eq("id", docId)
    .single();
  return data ?? null;
}

/** Create a new document */
export async function createDocument(
  workspaceId: string,
  title: string,
  language: string,
): Promise<DocumentRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("documents")
    .insert({
      workspace_id: workspaceId,
      title,
      title_original_language: language,
      created_by: user.id,
      last_edited_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("[createDocument]", error);
    return null;
  }
  return data;
}

/** Update document title */
export async function saveDocumentTitle(
  docId: string,
  title: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("documents")
    .update({
      title,
      last_edited_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", docId);
}

/** Delete a document */
export async function deleteDocument(docId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("documents").delete().eq("id", docId);
}

/**
 * Get a document only if the given user has access (owner or invited).
 * Returns the doc and access metadata, or null if forbidden.
 */
export async function getDocumentWithAccess(
  docId: string,
  userId: string,
): Promise<{
  doc: DocumentRow;
  isOwner: boolean;
  role: string;
} | null> {
  const supabase = await createClient();

  const { data: doc } = await supabase
    .from("documents")
    .select(
      "id, workspace_id, title, title_original_language, created_by, last_edited_by, created_at, updated_at",
    )
    .eq("id", docId)
    .single();

  if (!doc) return null;

  if (doc.created_by === userId) {
    return { doc, isOwner: true, role: "owner" };
  }

  const { data: access } = await supabase
    .from("document_access")
    .select("role")
    .eq("document_id", docId)
    .eq("user_id", userId)
    .single();

  if (!access) return null;

  return { doc, isOwner: false, role: access.role };
}
