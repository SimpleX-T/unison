"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { useUITranslation } from "@/hooks/useUITranslation";
import { getLanguage } from "@/lib/languages";
import { LanguageBadge } from "@/components/ui/LanguageBadge";
import {
  X,
  Trash2,
  Calendar,
  Flag,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import type { TaskRow } from "@/lib/boards";
import { UIStringKey } from "@/lib/i18n/ui-strings";

interface TaskDetailModalProps {
  task: TaskRow;
  onClose: () => void;
  onUpdate: () => void;
  userLanguage: string;
}

// const PRIORITY_COLORS: Record<string, string> = {
//   low: "var(--color-sage)",
//   medium: "var(--color-gold)",
//   high: "var(--color-rust)",
//   urgent: "#dc2626",
// };

const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export function TaskDetailModal({
  task,
  onClose,
  onUpdate,
  userLanguage,
}: TaskDetailModalProps) {
  const { t } = useUITranslation();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const lang = getLanguage(task.title_original_language);

  const { translated: translatedTitle } = useTranslation(
    `task-title-${task.id}`,
    task.title,
    task.title_original_language,
  );

  const { translated: translatedDesc } = useTranslation(
    `task-desc-${task.id}`,
    task.description ?? "",
    task.description_original_language ?? task.title_original_language,
  );

  const hasChanges =
    title !== task.title ||
    description !== (task.description ?? "") ||
    priority !== task.priority ||
    dueDate !== (task.due_date ?? "");

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("tasks")
      .update({
        title,
        description: description || null,
        priority,
        due_date: dueDate || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", task.id);
    setSaving(false);
    onUpdate();
    onClose();
  };

  const handleDelete = async () => {
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("tasks").delete().eq("id", task.id);
    setDeleting(false);
    onUpdate();
    onClose();
  };

  const isOwnLanguage = task.title_original_language === userLanguage;
  const showTranslated = !isOwnLanguage && translatedTitle;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 540, width: "100%" }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <LanguageBadge
              languageCode={task.title_original_language}
              showName={false}
            />
            <span
              style={{
                fontSize: 11,
                fontFamily: "var(--font-ui)",
                color: "var(--color-text-2)",
              }}
            >
              {t("task.createdIn")} {lang.name}
            </span>
          </div>
          <button
            onClick={onClose}
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

        {/* Translated preview */}
        {showTranslated && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: "var(--color-bg-2)",
              marginBottom: 16,
              fontSize: 13,
              fontFamily: "var(--font-body)",
              color: "var(--color-text-1)",
              lineHeight: 1.5,
              borderLeft: `3px solid ${lang.accent}`,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontFamily: "var(--font-ui)",
                fontWeight: 600,
                color: "var(--color-text-2)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 4,
              }}
            >
              {t("task.translatedVersion")}
            </div>
            <p style={{ margin: 0, fontWeight: 500 }}>{translatedTitle}</p>
            {translatedDesc && (
              <p style={{ margin: "6px 0 0", fontSize: 12 }}>
                {translatedDesc}
              </p>
            )}
          </div>
        )}

        {/* Editable title */}
        <div style={{ marginBottom: 16 }}>
          <label
            className="label"
            style={{ fontSize: 11, marginBottom: 4, display: "block" }}
          >
            {t("common.title")}
          </label>
          <input
            className="input"
            value={translatedTitle || (task.title as string)}
            onChange={(e) => setTitle(e.target.value)}
            style={{ fontSize: 16, fontWeight: 600 }}
          />
        </div>

        {/* Editable description */}
        <div style={{ marginBottom: 16 }}>
          <label
            className="label"
            style={{ fontSize: 11, marginBottom: 4, display: "block" }}
          >
            {t("common.description")}
          </label>
          <textarea
            className="input"
            value={translatedDesc || (task.description as string)}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder={t("task.descriptionPlaceholder")}
            style={{ resize: "vertical", fontSize: 13, lineHeight: 1.6 }}
          />
        </div>

        {/* Priority */}
        <div style={{ marginBottom: 16 }}>
          <label
            className="label"
            style={{
              fontSize: 11,
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Flag size={12} />
            {t("task.priority")}
          </label>
          <div style={{ display: "flex", gap: 6 }}>
            {PRIORITIES.map((p) => (
              <button
                key={p}
                className={`priority-badge ${p}`}
                onClick={() => setPriority(p)}
                style={{
                  cursor: "pointer",
                  outline:
                    priority === p ? "2px solid var(--color-sage)" : "none",
                  outlineOffset: 2,
                  textTransform: "capitalize",
                }}
              >
                {t(`task.priority.${p}` as UIStringKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Due date */}
        <div style={{ marginBottom: 20 }}>
          <label
            className="label"
            style={{
              fontSize: 11,
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Calendar size={12} />
            {t("task.dueDate")}
          </label>
          <input
            className="input"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{ fontSize: 13, maxWidth: 200 }}
          />
        </div>

        {/* Meta info */}
        <div
          style={{
            fontSize: 11,
            fontFamily: "var(--font-ui)",
            color: "var(--color-text-2)",
            marginBottom: 20,
            display: "flex",
            gap: 16,
          }}
        >
          <span>
            {t("task.created")}:{" "}
            {new Date(task.created_at).toLocaleDateString()}
          </span>
          <span>
            {t("task.updated")}:{" "}
            {new Date(task.updated_at).toLocaleDateString()}
          </span>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {confirmDelete ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={14} style={{ color: "var(--color-rust)" }} />
              <span
                style={{
                  fontSize: 12,
                  fontFamily: "var(--font-ui)",
                  color: "var(--color-rust)",
                }}
              >
                {t("task.confirmDelete")}
              </span>
              <button
                className="btn btn-sm"
                style={{
                  background: "var(--color-rust)",
                  color: "#fff",
                  border: "none",
                  fontSize: 11,
                  padding: "3px 10px",
                }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2
                    size={12}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  t("common.delete")
                )}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11, padding: "3px 10px" }}
                onClick={() => setConfirmDelete(false)}
              >
                {t("common.cancel")}
              </button>
            </div>
          ) : (
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: "var(--color-rust)", fontSize: 12 }}
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={13} />
              {t("common.delete")}
            </button>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>
              {t("common.cancel")}
            </button>
            {hasChanges && (
              <button
                className="btn btn-sage"
                onClick={handleSave}
                disabled={saving || !title.trim()}
              >
                {saving ? (
                  <Loader2
                    size={14}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  t("common.save")
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
