import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceBySlug } from "@/lib/workspaces";
import { getWhiteboards } from "@/lib/whiteboards";
import { Pencil, Clock } from "lucide-react";

interface WhiteboardsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WhiteboardsListPage({
  params,
}: WhiteboardsPageProps) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) notFound();

  const whiteboards = await getWhiteboards(workspace.id);

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
            <h1 style={{ fontFamily: "var(--font-display)" }}>Whiteboards</h1>
            <p>
              Collaborative canvases — draw, diagram, and annotate together.
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {whiteboards.length === 0 ? (
          <div
            style={{
              gridColumn: "1/-1",
              textAlign: "center",
              padding: "64px 0",
              color: "var(--color-text-2)",
            }}
          >
            <Pencil size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p>No whiteboards yet. Create one from the sidebar.</p>
          </div>
        ) : (
          whiteboards.map((wb) => (
            <Link
              key={wb.id}
              href={`/workspace/${slug}/whiteboard/${wb.id}`}
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
                <Pencil size={18} style={{ color: "var(--color-rust)" }} />
                <h3>{wb.name}</h3>
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
                <span>{new Date(wb.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
