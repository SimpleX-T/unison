"use client";
import { useParams } from "next/navigation";
import { Pencil } from "lucide-react";

export default function WhiteboardPage() {
  const params = useParams();
  const boardId = params?.boardId as string;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "16px 24px",
          borderBottom: "1px solid var(--color-bg-2)",
        }}
      >
        <Pencil size={18} style={{ color: "var(--color-rust)" }} />
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "20px",
            fontWeight: 700,
            margin: 0,
          }}
        >
          Architecture Diagram
        </h1>
      </div>
      <div style={{ flex: 1, position: "relative" }}>
        <WhiteboardCanvas boardId={boardId} />
      </div>
    </div>
  );
}

function WhiteboardCanvas({ boardId }: { boardId: string }) {
  // tldraw is client-side only — lazy load it
  // For now, we show a placeholder that indicates tldraw would load here
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg-1)",
      }}
    >
      <div className="empty-state">
        <Pencil size={48} />
        <h3>Whiteboard</h3>
        <p>
          The tldraw whiteboard canvas loads here. Draw, diagram, and annotate —
          text labels on shapes are auto-translated for each collaborator.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            width: "100%",
            maxWidth: "400px",
          }}
        >
          {["Sticky Note 📝", "Arrow →", "Rectangle ▭"].map((tool) => (
            <div
              key={tool}
              style={{
                padding: "12px",
                background: "var(--color-bg-0)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-bg-2)",
                textAlign: "center",
                fontSize: "13px",
                color: "var(--color-text-1)",
              }}
            >
              {tool}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
