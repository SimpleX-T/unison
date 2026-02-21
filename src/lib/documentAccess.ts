import { createClient } from "@/lib/supabase/server";

export async function inviteUserToDocument(
  documentId: string,
  userId: string,
  role: "editor" | "viewer",
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("document_access").insert({
    document_id: documentId,
    user_id: userId,
    role,
    invited_by: user.id,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function getDocumentCollaborators(documentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("document_access")
    .select(
      `
      document_id,
      user_id,
      role,
      invited_by,
      created_at,
      profiles!user_id (
        id,
        username,
        display_name,
        preferred_language,
        avatar_url
      )
    `,
    )
    .eq("document_id", documentId);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?.map((row: any) => ({
      ...row,
      user: row.profiles,
    })) ?? []
  );
}

export async function canUserAccessDocument(
  documentId: string,
  userId: string,
): Promise<{ hasAccess: boolean; isOwner: boolean; role?: string }> {
  const supabase = await createClient();

  const { data: doc } = await supabase
    .from("documents")
    .select("created_by")
    .eq("id", documentId)
    .single();

  if (!doc) return { hasAccess: false, isOwner: false };
  if (doc.created_by === userId)
    return { hasAccess: true, isOwner: true, role: "owner" };

  const { data: access } = await supabase
    .from("document_access")
    .select("role")
    .eq("document_id", documentId)
    .eq("user_id", userId)
    .single();

  if (access)
    return { hasAccess: true, isOwner: false, role: access.role };

  return { hasAccess: false, isOwner: false };
}

export async function revokeAccess(documentId: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("document_access")
    .delete()
    .eq("document_id", documentId)
    .eq("user_id", userId);

  if (error) return { error: error.message };
  return { success: true };
}
