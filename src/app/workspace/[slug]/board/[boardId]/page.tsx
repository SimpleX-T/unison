import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBoard, getBoardColumns, getBoardTasks } from "@/lib/boards";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { LayoutGrid } from "lucide-react";

interface BoardPageProps {
  params: Promise<{ slug: string; boardId: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { boardId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const [board, columns, tasks] = await Promise.all([
    getBoard(boardId),
    getBoardColumns(boardId),
    getBoardTasks(boardId),
  ]);

  if (!board) notFound();

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid var(--color-bg-2)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LayoutGrid size={18} style={{ color: "var(--color-indigo)" }} />
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 20,
              fontWeight: 700,
              margin: 0,
            }}
          >
            {board.name}
          </h1>
        </div>
      </div>
      <KanbanBoard
        boardId={boardId}
        initialColumns={columns}
        initialTasks={tasks}
        userId={user.id}
        userLanguage={user.user_metadata?.preferred_language ?? "en"}
      />
    </div>
  );
}
