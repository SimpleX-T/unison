import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceBySlug } from "@/lib/workspaces";
import { getBoards } from "@/lib/boards";
import { LayoutGrid, Clock } from "lucide-react";

interface BoardsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BoardsListPage({ params }: BoardsPageProps) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) notFound();

  const boards = await getBoards(workspace.id);

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
            <h1 style={{ fontFamily: "var(--font-display)" }}>Boards</h1>
            <p>Sprint boards and task tracking for your team.</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {boards.length === 0 ? (
          <div
            style={{
              gridColumn: "1/-1",
              textAlign: "center",
              padding: "64px 0",
              color: "var(--color-text-2)",
            }}
          >
            <LayoutGrid size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p>No boards yet. Create one from the sidebar.</p>
          </div>
        ) : (
          boards.map((board) => (
            <Link
              key={board.id}
              href={`/workspace/${slug}/board/${board.id}`}
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
                <LayoutGrid
                  size={18}
                  style={{ color: "var(--color-indigo)" }}
                />
                <h3>{board.name}</h3>
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
                <span>{new Date(board.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
