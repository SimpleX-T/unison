import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceBySlug } from "@/lib/workspaces";
import { getDocuments } from "@/lib/documents";
import { NewDocumentButton } from "./NewDocumentButton";
import { DocumentCard } from "./DocumentCard";
import { DocsPageTitle, DocsEmptyState } from "./DocsPageHeader";

interface DocsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function DocsListPage({ params }: DocsPageProps) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) notFound();

  const docs = await getDocuments(workspace.id);

  return (
    <div>
      <div className="dashboard-header">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <DocsPageTitle />
          <NewDocumentButton
            workspaceId={workspace.id}
            workspaceSlug={slug}
            language={user.user_metadata?.preferred_language ?? "en"}
          />
        </div>
      </div>

      <div className="dashboard-grid">
        {docs.length === 0 ? (
          <DocsEmptyState />
        ) : (
          docs.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              slug={slug}
              currentUserId={user.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
