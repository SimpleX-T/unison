"use client";
import { useState } from "react";
import { useUITranslation } from "@/hooks/useUITranslation";

interface CreateTaskModalProps {
  onClose: () => void;
  onCreateTask: (task: {
    title: string;
    description: string;
    priority: string;
  }) => void;
}

const PRIORITIES = ["low", "medium", "high", "urgent"];

export function CreateTaskModal({
  onClose,
  onCreateTask,
}: CreateTaskModalProps) {
  const { t } = useUITranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreateTask({
      title: title.trim(),
      description: description.trim(),
      priority,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{t("board.addTask")}</h2>
            <p className="modal-subtitle">{t("task.addSubtitle")}</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="form-group">
          <label className="label">{t("common.title")}</label>
          <input
            className="input"
            placeholder={t("task.titlePlaceholder")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
        </div>

        <div className="form-group">
          <label className="label">{t("common.description")}</label>
          <textarea
            className="input"
            placeholder={t("task.descPlaceholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ resize: "vertical" }}
          />
        </div>

        <div className="form-group">
          <label className="label">{t("task.priority")}</label>
          <div style={{ display: "flex", gap: 8 }}>
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
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button className="btn btn-sage" onClick={handleCreate}>
            {t("common.create")}
          </button>
        </div>
      </div>
    </div>
  );
}
