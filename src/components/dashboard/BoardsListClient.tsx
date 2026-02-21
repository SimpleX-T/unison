"use client";
import Link from "next/link";
import { LayoutGrid, Clock } from "lucide-react";
import { useUITranslation } from "@/hooks/useUITranslation";

interface BoardItem {
  id: string;
  name: string;
  created_at: string;
}

interface BoardsListClientProps {
  slug: string;
  boards: BoardItem[];
}

export function BoardsListClient({ slug, boards }: BoardsListClientProps) {
  const { t } = useUITranslation();

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
            <h1 style={{ fontFamily: "var(--font-display)" }}>
              {t("boards.title")}
            </h1>
            <p>{t("boards.subtitle")}</p>
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
            <p>{t("boards.empty")}</p>
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
