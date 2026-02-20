import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceBySlug } from "@/lib/workspaces";
import { getDocuments } from "@/lib/documents";
import { FileText, Plus, Clock } from "lucide-react";
import { NewDocumentButton } from "./NewDocumentButton";

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
          <div>
            <h1 style={{ fontFamily: "var(--font-display)" }}>Documents</h1>
            <p>Collaborative documents translated in real time.</p>
          </div>
          <NewDocumentButton
            workspaceId={workspace.id}
            workspaceSlug={slug}
            language={user.user_metadata?.preferred_language ?? "en"}
          />
        </div>
      </div>

      <div className="dashboard-grid">
        {docs.length === 0 ? (
          <div
            style={{
              gridColumn: "1/-1",
              textAlign: "center",
              padding: "64px 0",
              color: "var(--color-text-2)",
            }}
          >
            <FileText size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p>No documents yet. Create your first one.</p>
          </div>
        ) : (
          docs.map((doc) => (
            <Link
              key={doc.id}
              href={`/workspace/${slug}/docs/${doc.id}`}
              className="dashboard-card"
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <FileText size={18} style={{ color: "var(--color-sage)" }} />
                <h3>{doc.title}</h3>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "var(--color-text-2)",
                }}
              >
                <Clock size={12} />
                <span>{new Date(doc.updated_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
