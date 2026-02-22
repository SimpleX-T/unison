"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Clock,
  MoreVertical,
  Trash2,
  LogOut,
  Loader2,
} from "lucide-react";
import { useUITranslation } from "@/hooks/useUITranslation";

interface DocumentCardProps {
  doc: {
    id: string;
    title: string;
    updated_at: string;
    created_by: string;
  };
  slug: string;
  currentUserId: string;
}

export function DocumentCard({ doc, slug, currentUserId }: DocumentCardProps) {
  const router = useRouter();
  const { t } = useUITranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isOwner = doc.created_by === currentUserId;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmAction(null);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleDelete = async (action: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
    setMenuOpen(false);
    setConfirmAction(null);
  };

  return (
    <div className="doc-card-wrapper" style={{ position: "relative" }}>
      <Link
        href={`/workspace/${slug}/docs/${doc.id}`}
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
          <FileText size={18} style={{ color: "var(--color-sage)" }} />
          <h3>{doc.title}</h3>
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
          <span>{new Date(doc.updated_at).toLocaleDateString()}</span>
        </div>
      </Link>

      <div
        ref={menuRef}
        style={{ position: "absolute", top: 8, right: 8, zIndex: 5 }}
      >
        <button
          className="doc-card-menu-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen(!menuOpen);
            setConfirmAction(null);
          }}
          title={t("doc.moreOptions")}
        >
          <MoreVertical size={14} />
        </button>

        {menuOpen && (
          <div className="doc-card-dropdown">
            {confirmAction ? (
              <div className="doc-card-confirm">
                <p style={{ fontSize: 12, margin: "0 0 8px 0", lineHeight: 1.4 }}>
                  {confirmAction === "delete_for_all"
                    ? t("doc.deleteConfirm")
                    : t("doc.leaveConfirm")}
                </p>
                <div
                  style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}
                >
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setConfirmAction(null)}
                    disabled={loading}
                    style={{ fontSize: 11, padding: "3px 8px" }}
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    className="btn btn-sm"
                    style={{
                      fontSize: 11,
                      padding: "3px 8px",
                      background: "var(--color-rust)",
                      color: "#fff",
                      border: "none",
                    }}
                    onClick={() => handleDelete(confirmAction)}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2
                        size={11}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                    ) : (
                      t("common.confirm")
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {isOwner ? (
                  <button
                    className="doc-card-dropdown-item destructive"
                    onClick={() => setConfirmAction("delete_for_all")}
                  >
                    <Trash2 size={13} />
                    {t("doc.deleteForAll")}
                  </button>
                ) : (
                  <button
                    className="doc-card-dropdown-item destructive"
                    onClick={() => setConfirmAction("quit_collaboration")}
                  >
                    <LogOut size={13} />
                    {t("doc.leaveDocument")}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
