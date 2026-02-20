"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUITranslation } from "@/hooks/useUITranslation";
import { useAppStore } from "@/store/useAppStore";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface CreateBoardModalProps {
  onClose: () => void;
}

const DEFAULT_COLUMNS = [
  { name: "To Do", position: 0, color: "#6b7280" },
  { name: "In Progress", position: 1, color: "#6366f1" },
  { name: "Review", position: 2, color: "#d97706" },
  { name: "Done", position: 3, color: "#4a7c59" },
];

export function CreateBoardModal({ onClose }: CreateBoardModalProps) {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const workspace = useAppStore((s) => s.workspace);
  const { t, language } = useUITranslation();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!workspace) return;
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth");
      return;
    }

    const { data: board, error } = await supabase
      .from("boards")
      .insert({
        workspace_id: workspace.id,
        name: name.trim() || "Untitled Board",
        name_original_language: language,
        created_by: user.id,
      })
      .select()
      .single();

    if (error || !board) {
      console.error("[CreateBoardModal]", error);
      setLoading(false);
      return;
    }

    // Seed default columns
    await supabase.from("board_columns").insert(
      DEFAULT_COLUMNS.map((col) => ({
        board_id: board.id,
        name: col.name,
        name_original_language: "en",
        position: col.position,
        color: col.color,
      })),
    );

    onClose();
    router.push(`/workspace/${slug}/board/${board.id}`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{t("sidebar.newBoard")}</h2>
            <p className="modal-subtitle">Create a new sprint or task board</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="form-group">
          <label className="label">{t("common.title")}</label>
          <input
            className="input"
            placeholder="Sprint 2 — Team Alpha"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            disabled={loading}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
        </div>

        <div className="modal-actions">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            {t("common.cancel")}
          </button>
          <button
            className="btn btn-sage"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <Loader2
                size={16}
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : (
              t("common.create")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
