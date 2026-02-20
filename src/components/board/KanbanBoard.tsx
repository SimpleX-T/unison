"use client";
import { useState, useCallback, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { TaskCard } from "./TaskCard";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";
import { useUITranslation } from "@/hooks/useUITranslation";
import { createClient } from "@/lib/supabase/client";
import type { BoardColumnRow, TaskRow } from "@/lib/boards";

export type { TaskRow };

// Local UI state — extends TaskRow with a status string for column grouping
export interface KanbanTask extends TaskRow {
  // column_id is the authoritative key for which column a task belongs to
}

interface Column extends BoardColumnRow {
  tasks: KanbanTask[];
}

interface KanbanBoardProps {
  boardId: string;
  initialColumns: BoardColumnRow[];
  initialTasks: TaskRow[];
  userId: string;
  userLanguage: string;
}

const ACCENT_MAP = [
  "var(--color-text-2)",
  "var(--color-indigo)",
  "var(--color-gold)",
  "var(--color-sage)",
];

export function KanbanBoard({
  boardId,
  initialColumns,
  initialTasks,
  userId,
  userLanguage,
}: KanbanBoardProps) {
  const { t } = useUITranslation();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [addToColumnId, setAddToColumnId] = useState<string>("");

  // Merge columns with their tasks
  const buildColumns = useCallback(
    (cols: BoardColumnRow[], tasks: TaskRow[]): Column[] =>
      cols.map((col) => ({
        ...col,
        tasks: tasks.filter((t) => t.column_id === col.id),
      })),
    [],
  );

  const [columns, setColumns] = useState<Column[]>(() =>
    buildColumns(initialColumns, initialTasks),
  );

  // Refresh from server (called after create)
  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("board_id", boardId)
      .order("position", { ascending: true });

    if (tasks) {
      setColumns((prev) => buildColumns(prev, tasks as TaskRow[]));
    }
  }, [boardId, buildColumns]);

  const onDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    // Optimistic update
    setColumns((prev) => {
      const next = prev.map((col) => ({ ...col, tasks: [...col.tasks] }));
      const srcCol = next.find((c) => c.id === source.droppableId)!;
      const dstCol = next.find((c) => c.id === destination.droppableId)!;
      const [moved] = srcCol.tasks.splice(source.index, 1);
      moved.column_id = destination.droppableId;
      dstCol.tasks.splice(destination.index, 0, moved);
      return next;
    });

    // Persist to DB
    const supabase = createClient();
    await supabase
      .from("tasks")
      .update({
        column_id: destination.droppableId,
        position: destination.index,
        updated_at: new Date().toISOString(),
      })
      .eq("id", draggableId);
  }, []);

  const handleCreateTask = useCallback(
    async (task: { title: string; description: string; priority: string }) => {
      if (!addToColumnId) return;

      const supabase = createClient();

      // Get current task count in column for position
      const { count } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("column_id", addToColumnId);

      const { data: newTask } = await supabase
        .from("tasks")
        .insert({
          board_id: boardId,
          column_id: addToColumnId,
          title: task.title,
          title_original_language: userLanguage,
          description: task.description || null,
          description_original_language: task.description ? userLanguage : null,
          priority: task.priority,
          position: count ?? 0,
          created_by: userId,
        })
        .select()
        .single();

      if (newTask) {
        setColumns((prev) =>
          prev.map((col) =>
            col.id === addToColumnId
              ? { ...col, tasks: [...col.tasks, newTask as KanbanTask] }
              : col,
          ),
        );
      }
    },
    [addToColumnId, boardId, userId, userLanguage],
  );

  const columnTitleKeys = [
    "board.todo",
    "board.inProgress",
    "board.review",
    "board.done",
  ] as const;

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {columns.map((column, idx) => (
            <Droppable droppableId={column.id} key={column.id}>
              {(provided, snapshot) => (
                <div
                  className={`kanban-column ${snapshot.isDraggingOver ? "is-drag-over" : ""}`}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <div className="kanban-column-header">
                    <span>
                      <span
                        style={{
                          display: "inline-block",
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: ACCENT_MAP[idx % ACCENT_MAP.length],
                          marginRight: 8,
                        }}
                      />
                      {column.name} ({column.tasks.length})
                    </span>
                    <button
                      className="sidebar-add-btn"
                      style={{ padding: "2px 4px", fontSize: 16 }}
                      onClick={() => {
                        setAddToColumnId(column.id);
                        setShowTaskModal(true);
                      }}
                      title={t("board.addTask")}
                    >
                      +
                    </button>
                  </div>

                  <div className="kanban-column-tasks">
                    {column.tasks.map((task, index) => (
                      <Draggable
                        draggableId={task.id}
                        index={index}
                        key={task.id}
                      >
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                          >
                            <TaskCard
                              task={task}
                              isDragging={dragSnapshot.isDragging}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {showTaskModal && (
        <CreateTaskModal
          onClose={() => setShowTaskModal(false)}
          onCreateTask={handleCreateTask}
        />
      )}
    </>
  );
}
