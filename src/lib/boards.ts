import { createClient } from "@/lib/supabase/server";

export interface BoardRow {
  id: string;
  workspace_id: string;
  name: string;
  name_original_language: string;
  created_by: string;
  created_at: string;
}

export interface BoardColumnRow {
  id: string;
  board_id: string;
  name: string;
  position: number;
  color: string | null;
}

export interface TaskRow {
  id: string;
  column_id: string | null;
  board_id: string;
  title: string;
  title_original_language: string;
  description: string | null;
  assignee_id: string | null;
  position: number;
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const DEFAULT_COLUMNS = [
  { name: "To Do", position: 0, color: "#6b7280" },
  { name: "In Progress", position: 1, color: "#6366f1" },
  { name: "Review", position: 2, color: "#d97706" },
  { name: "Done", position: 3, color: "#4a7c59" },
];

/** Get boards for a workspace */
export async function getBoards(workspaceId: string): Promise<BoardRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("boards")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

/** Get a single board */
export async function getBoard(boardId: string): Promise<BoardRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("boards")
    .select("*")
    .eq("id", boardId)
    .single();
  return data ?? null;
}

/** Create a board with default columns */
export async function createBoard(
  workspaceId: string,
  name: string,
  language: string,
): Promise<BoardRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: board, error } = await supabase
    .from("boards")
    .insert({
      workspace_id: workspaceId,
      name,
      name_original_language: language,
      created_by: user.id,
    })
    .select()
    .single();

  if (error || !board) return null;

  // Seed default columns
  await supabase.from("board_columns").insert(
    DEFAULT_COLUMNS.map((col) => ({
      board_id: board.id,
      name: col.name,
      name_original_language: "en",
      position: col.position,
      color: col.color,
    })),
  );

  return board;
}

/** Get columns for a board */
export async function getBoardColumns(
  boardId: string,
): Promise<BoardColumnRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("board_columns")
    .select("*")
    .eq("board_id", boardId)
    .order("position", { ascending: true });
  return data ?? [];
}

/** Get tasks for a board, grouped by column */
export async function getBoardTasks(boardId: string): Promise<TaskRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("board_id", boardId)
    .order("position", { ascending: true });
  return data ?? [];
}

/** Create a task */
export async function createTask(
  boardId: string,
  columnId: string,
  title: string,
  description: string,
  priority: string,
  language: string,
): Promise<TaskRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Get current max position in column
  const { count } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("column_id", columnId);

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      board_id: boardId,
      column_id: columnId,
      title,
      title_original_language: language,
      description: description || null,
      description_original_language: description ? language : null,
      priority,
      position: count ?? 0,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("[createTask]", error);
    return null;
  }
  return data;
}

/** Move a task to a new column and position */
export async function moveTask(
  taskId: string,
  columnId: string,
  position: number,
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("tasks")
    .update({
      column_id: columnId,
      position,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);
}

/** Update task fields */
export async function updateTask(
  taskId: string,
  patch: Partial<
    Pick<
      TaskRow,
      "title" | "description" | "priority" | "due_date" | "assignee_id"
    >
  >,
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("tasks")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", taskId);
}

/** Delete a task */
export async function deleteTask(taskId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", taskId);
}
