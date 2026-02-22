"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { X, Trash2, LogOut, AlertTriangle, Loader2 } from "lucide-react";
import { useUITranslation } from "@/hooks/useUITranslation";

interface DeleteDocumentModalProps {
  documentId: string;
  documentTitle: string;
  isOwner: boolean;
  onClose: () => void;
}

export function DeleteDocumentModal({
  documentId,
  documentTitle,
  isOwner,
  onClose,
}: DeleteDocumentModalProps) {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const { t } = useUITranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAction = async (action: "delete_for_all" | "quit_collaboration") => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/documents/${documentId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }
      router.push(`/workspace/${slug}/docs`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 420, width: "100%" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              margin: 0,
              fontSize: "20px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertTriangle size={20} style={{ color: "var(--color-rust)" }} />
            {t("doc.deleteTitle")}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "var(--color-text-2)",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <p
          style={{
            fontSize: 13,
            fontFamily: "var(--font-ui)",
            color: "var(--color-text-2)",
            margin: "0 0 20px 0",
            lineHeight: 1.5,
          }}
        >
          {isOwner
            ? `${t("doc.deleteOwnerDesc")} "${documentTitle || t("doc.untitled")}"`
            : `${t("doc.deleteCollabDesc")} "${documentTitle || t("doc.untitled")}"`}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {isOwner ? (
            <button
              className="delete-modal-action destructive"
              onClick={() => handleAction("delete_for_all")}
              disabled={loading}
            >
              <div className="delete-modal-action-icon">
                {loading ? (
                  <Loader2
                    size={18}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  <Trash2 size={18} />
                )}
              </div>
              <div className="delete-modal-action-text">
                <span className="delete-modal-action-title">
                  {t("doc.deleteForAllAction")}
                </span>
                <span className="delete-modal-action-desc">
                  {t("doc.deleteForAllDesc")}
                </span>
              </div>
            </button>
          ) : (
            <button
              className="delete-modal-action destructive"
              onClick={() => handleAction("quit_collaboration")}
              disabled={loading}
            >
              <div className="delete-modal-action-icon">
                {loading ? (
                  <Loader2
                    size={18}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  <LogOut size={18} />
                )}
              </div>
              <div className="delete-modal-action-text">
                <span className="delete-modal-action-title">
                  {t("doc.leaveAction")}
                </span>
                <span className="delete-modal-action-desc">
                  {t("doc.leaveDesc")}
                </span>
              </div>
            </button>
          )}
        </div>

        {error && (
          <p
            style={{
              color: "var(--color-rust)",
              fontSize: 12,
              fontFamily: "var(--font-ui)",
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            {error}
          </p>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 20,
          }}
        >
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
