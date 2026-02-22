"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { createClient } from "@/lib/supabase/client";
import { Hash } from "lucide-react";
import { useUITranslation } from "@/hooks/useUITranslation";

interface CreateChannelModalProps {
  onClose: () => void;
}

export function CreateChannelModal({ onClose }: CreateChannelModalProps) {
  const workspaceId = useAppStore((s) => s.workspace?.id);
  const { t } = useUITranslation();
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    const clean = name.trim().toLowerCase().replace(/\s+/g, "-");
    if (!clean) return;
    setCreating(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !workspaceId) {
      setError("Not authenticated");
      setCreating(false);
      return;
    }

    const { data, error: err } = await supabase
      .from("channels")
      .insert({
        workspace_id: workspaceId,
        name: clean,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (err || !data) {
      setError(err?.message ?? "Could not create channel");
      setCreating(false);
      return;
    }

    onClose();
    router.push(`/workspace/${slug}/chat/${data.id}`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontFamily: "var(--font-display)", marginBottom: 8 }}>
          {t("sidebar.newChannel")}
        </h2>
        <p
          style={{
            color: "var(--color-text-2)",
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          {t("chat.channelDescription")}
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <Hash
            size={18}
            style={{ color: "var(--color-text-2)", flexShrink: 0 }}
          />
          <input
            className="input"
            placeholder="e.g. design, marketing, random"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            style={{ flex: 1 }}
          />
        </div>

        {error && (
          <p
            style={{
              color: "var(--color-rust)",
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            {error}
          </p>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button
            className="btn btn-sage"
            onClick={handleCreate}
            disabled={creating || !name.trim()}
          >
            {creating ? t("common.loading") : t("sidebar.newChannel")}
          </button>
        </div>
      </div>
    </div>
  );
}
