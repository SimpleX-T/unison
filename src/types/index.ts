export interface Profile {
  id: string;
  username: string;
  display_name: string;
  preferred_language: string;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_by: string;
  created_at: string;
}

export interface WorkspaceMember {
  workspace_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
}

export interface Document {
  id: string;
  workspace_id: string;
  title: string;
  title_original_language: string;
  created_by: string;
  last_edited_by: string;
  yjs_state: Uint8Array | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content_hash: string;
  original_text: string;
  original_language: string;
  created_at: string;
}

export interface TranslationCacheEntry {
  content_hash: string;
  target_language: string;
  translated_text: string;
  source_language: string;
  created_at: string;
}

export interface DocumentComment {
  id: string;
  document_id: string;
  author_id: string;
  original_language: string;
  content: string;
  resolved: boolean;
  paragraph_id: string | null;
  created_at: string;
  author?: Profile;
}

export interface Board {
  id: string;
  workspace_id: string;
  name: string;
  name_original_language: string;
  created_by: string;
  created_at: string;
}

export interface BoardColumn {
  id: string;
  board_id: string;
  name: string;
  name_original_language: string;
  position: number;
  color: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  column_id: string;
  board_id: string;
  title: string;
  title_original_language: string;
  description: string | null;
  description_original_language: string | null;
  assignee_id: string | null;
  position: number;
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  assignee?: Profile;
}

export interface Channel {
  id: string;
  workspace_id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface Message {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  original_language: string;
  thread_id: string | null;
  created_at: string;
  sender?: Profile;
}

export interface ParagraphTranslation {
  nodeId: string;
  originalText: string;
  translatedText: string;
  isTranslating: boolean;
}

export interface AwarenessUser {
  id: string;
  name: string;
  language: string;
  color: string;
  flag: string;
}
