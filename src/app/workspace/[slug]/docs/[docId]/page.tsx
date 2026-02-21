import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDocumentWithAccess } from "@/lib/documents";
import { getUserBranch, createBranch } from "@/lib/branches";
import { DocumentEditor } from "@/components/editor/DocumentEditor";

interface DocumentPageProps {
  params: Promise<{ slug: string; docId: string }>;
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { docId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const access = await getDocumentWithAccess(docId, user.id);
  if (!access) notFound();

  const { doc, isOwner } = access;

  let branchId: string | undefined;

  if (!isOwner) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, preferred_language")
      .eq("id", user.id)
      .single();

    let branch = await getUserBranch(docId, user.id);
    if (!branch) {
      branch = await createBranch(
        docId,
        user.id,
        profile?.preferred_language ?? "en",
        profile?.display_name ?? "Collaborator",
      );
    }
    branchId = branch?.id;
  }

  return (
    <DocumentEditor
      documentId={docId}
      initialTitle={doc.title}
      userId={user.id}
      isOwner={isOwner}
      branchId={branchId}
      documentLanguage={doc.title_original_language}
    />
  );
}
