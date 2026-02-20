"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUITranslation } from "@/hooks/useUITranslation";
import { useAppStore } from "@/store/useAppStore";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface CreateDocumentModalProps {
  onClose: () => void;
}

export function CreateDocumentModal({ onClose }: CreateDocumentModalProps) {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const workspace = useAppStore((s) => s.workspace);
  const { t, language } = useUITranslation();
  const [title, setTitle] = useState("");
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

    const { data: doc, error } = await supabase
      .from("documents")
      .insert({
        workspace_id: workspace.id,
        title: title.trim() || "Untitled",
        title_original_language: language,
        created_by: user.id,
        last_edited_by: user.id,
      })
      .select()
      .single();

    if (error || !doc) {
      console.error("[CreateDocumentModal]", error);
      setLoading(false);
      return;
    }

    onClose();
    router.push(`/workspace/${slug}/docs/${doc.id}`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{t("sidebar.newDocument")}</h2>
            <p className="modal-subtitle">
              Create a new collaborative document
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="form-group">
          <label className="label">{t("common.title")}</label>
          <input
            className="input"
            placeholder={t("toolbar.untitled")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
