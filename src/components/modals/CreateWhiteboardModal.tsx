"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUITranslation } from "@/hooks/useUITranslation";
import { useAppStore } from "@/store/useAppStore";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface CreateWhiteboardModalProps {
  onClose: () => void;
}

export function CreateWhiteboardModal({ onClose }: CreateWhiteboardModalProps) {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const workspace = useAppStore((s) => s.workspace);
  const { t } = useUITranslation();
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

    const { data: wb, error } = await supabase
      .from("whiteboards")
      .insert({
        workspace_id: workspace.id,
        name: name.trim() || "Untitled Whiteboard",
        created_by: user.id,
      })
      .select()
      .single();

    if (error || !wb) {
      console.error("[CreateWhiteboardModal]", error);
      setLoading(false);
      return;
    }

    onClose();
    router.push(`/workspace/${slug}/whiteboard/${wb.id}`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{t("sidebar.newWhiteboard")}</h2>
            <p className="modal-subtitle">
              Create a freeform canvas for your team
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
            placeholder="Architecture — v2 brainstorm"
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
