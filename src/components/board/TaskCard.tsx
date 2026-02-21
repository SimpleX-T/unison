"use client";
import { getLanguage } from "@/lib/languages";
import { useTranslation } from "@/hooks/useTranslation";
import type { TaskRow } from "@/lib/boards";

interface TaskCardProps {
  task: TaskRow;
  isDragging: boolean;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "var(--color-sage)",
  medium: "var(--color-gold)",
  high: "var(--color-rust)",
  urgent: "#dc2626",
};

export function TaskCard({ task, isDragging }: TaskCardProps) {
  const lang = getLanguage(task.title_original_language);

  // Translate title
  const { translated: translatedTitle, isLoading: titleLoading } =
    useTranslation(
      `task-title-${task.id}`,
      task.title,
      task.title_original_language,
    );

  // Translate description
  const { translated: translatedDesc, isLoading: descLoading } = useTranslation(
    `task-desc-${task.id}`,
    task.description ?? "",
    task.description_original_language ?? task.title_original_language,
  );

  return (
    <div className={`task-card ${isDragging ? "is-dragging" : ""}`}>
      <p
        className="task-title"
        style={titleLoading ? { opacity: 0.5 } : undefined}
      >
        {translatedTitle || task.title}
      </p>

      {task.description && (
        <p
          style={{
            fontSize: 12,
            color: "var(--color-text-2)",
            margin: "4px 0 0",
            lineHeight: 1.4,
            opacity: descLoading ? 0.5 : 1,
          }}
        >
          {(translatedDesc || task.description).slice(0, 80)}
          {(translatedDesc || task.description).length > 80 ? "…" : ""}
        </p>
      )}

      <div className="task-meta">
        {task.priority && (
          <span
            className="task-priority"
            style={{
              color: PRIORITY_COLORS[task.priority] ?? "var(--color-text-2)",
            }}
          >
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
        )}
        <span
          className="task-language"
          style={{
            marginLeft: "auto",
            fontSize: 12,
            color: "var(--color-text-2)",
          }}
          title={lang.name}
        >
          {lang.flag}
        </span>
      </div>
    </div>
  );
}
