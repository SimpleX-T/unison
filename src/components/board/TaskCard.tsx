"use client";
import { getLanguage } from "@/lib/languages";
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

  return (
    <div className={`task-card ${isDragging ? "is-dragging" : ""}`}>
      <p className="task-title">{task.title}</p>

      {task.description && (
        <p
          style={{
            fontSize: 12,
            color: "var(--color-text-2)",
            margin: "4px 0 0",
            lineHeight: 1.4,
          }}
        >
          {task.description.slice(0, 80)}
          {task.description.length > 80 ? "…" : ""}
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
