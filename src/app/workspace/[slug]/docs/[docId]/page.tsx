import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDocument } from "@/lib/documents";
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

  const doc = await getDocument(docId);
  if (!doc) notFound();

  return (
    <DocumentEditor
      documentId={docId}
      initialTitle={doc.title}
      userId={user.id}
    />
  );
}
