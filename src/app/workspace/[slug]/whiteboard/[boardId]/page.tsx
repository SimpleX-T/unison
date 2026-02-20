import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWhiteboard } from "@/lib/whiteboards";
import { WhiteboardEditor } from "@/components/whiteboard/WhiteboardEditor";

interface WhiteboardPageProps {
  params: Promise<{ slug: string; boardId: string }>;
}

export default async function WhiteboardPage({ params }: WhiteboardPageProps) {
  const { boardId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const whiteboard = await getWhiteboard(boardId);
  if (!whiteboard) notFound();

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 24px",
          borderBottom: "1px solid var(--color-bg-2)",
          background: "var(--color-bg-0)",
          zIndex: 10,
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "18px",
            fontWeight: 700,
            margin: 0,
          }}
        >
          {whiteboard.name}
        </h1>
      </div>
      <div style={{ flex: 1, position: "relative" }}>
        <WhiteboardEditor
          whiteboardId={boardId}
          initialSnapshot={whiteboard.tldraw_state}
        />
      </div>
    </div>
  );
}
