-- ============================================================
-- Unison — Full Database Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Profiles ─────────────────────────────────────────────────
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text not null,
  preferred_language text not null default 'en',
  avatar_url text,
  timezone text not null default 'UTC',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Allow users to read all profiles (for @mentions, assignees)
alter table profiles enable row level security;
create policy "Profiles are viewable by authenticated users"
  on profiles for select using (auth.role() = 'authenticated');
create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

-- ── Workspaces ───────────────────────────────────────────────
create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists workspace_members (
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz default now(),
  primary key (workspace_id, user_id)
);

alter table workspaces enable row level security;
alter table workspace_members enable row level security;

create policy "Workspace members can view workspace"
  on workspaces for select using (
    exists (
      select 1 from workspace_members
      where workspace_id = workspaces.id and user_id = auth.uid()
    )
  );
create policy "Authenticated users can create workspaces"
  on workspaces for insert with check (auth.role() = 'authenticated');

create policy "Members can view workspace_members"
  on workspace_members for select using (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = workspace_members.workspace_id and wm.user_id = auth.uid()
    )
  );
create policy "Owners/admins can manage members"
  on workspace_members for all using (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = workspace_members.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  );
create policy "Users can insert themselves as member"
  on workspace_members for insert with check (user_id = auth.uid());

-- ── Documents ────────────────────────────────────────────────
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  title text not null default 'Untitled',
  title_original_language text not null default 'en',
  yjs_state bytea,
  created_by uuid references profiles(id) on delete set null,
  last_edited_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists document_comments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  author_id uuid references profiles(id) on delete cascade,
  content text not null,
  original_language text not null,
  resolved boolean not null default false,
  paragraph_id text,
  created_at timestamptz default now()
);

alter table documents enable row level security;
alter table document_comments enable row level security;

create policy "Workspace members can access documents"
  on documents for all using (
    exists (
      select 1 from workspace_members
      where workspace_id = documents.workspace_id and user_id = auth.uid()
    )
  );

create policy "Workspace members can access comments"
  on document_comments for all using (
    exists (
      select 1 from documents d
      join workspace_members wm on wm.workspace_id = d.workspace_id
      where d.id = document_comments.document_id and wm.user_id = auth.uid()
    )
  );

-- ── Boards & Tasks ───────────────────────────────────────────
create table if not exists boards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  name_original_language text not null default 'en',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists board_columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references boards(id) on delete cascade,
  name text not null,
  name_original_language text not null default 'en',
  position int not null default 0,
  color text
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  column_id uuid references board_columns(id) on delete set null,
  board_id uuid references boards(id) on delete cascade,
  title text not null,
  title_original_language text not null default 'en',
  description text,
  description_original_language text,
  assignee_id uuid references profiles(id) on delete set null,
  position int not null default 0,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date date,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table boards enable row level security;
alter table board_columns enable row level security;
alter table tasks enable row level security;

create policy "Workspace members can access boards"
  on boards for all using (
    exists (select 1 from workspace_members where workspace_id = boards.workspace_id and user_id = auth.uid())
  );
create policy "Workspace members can access columns"
  on board_columns for all using (
    exists (select 1 from boards b join workspace_members wm on wm.workspace_id = b.workspace_id where b.id = board_columns.board_id and wm.user_id = auth.uid())
  );
create policy "Workspace members can access tasks"
  on tasks for all using (
    exists (select 1 from boards b join workspace_members wm on wm.workspace_id = b.workspace_id where b.id = tasks.board_id and wm.user_id = auth.uid())
  );

-- ── Channels & Messages ──────────────────────────────────────
create table if not exists channels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references channels(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  content text not null,
  original_language text not null default 'en',
  created_at timestamptz default now()
);

alter table channels enable row level security;
alter table messages enable row level security;

create policy "Workspace members can access channels"
  on channels for all using (
    exists (select 1 from workspace_members where workspace_id = channels.workspace_id and user_id = auth.uid())
  );
create policy "Workspace members can access messages"
  on messages for all using (
    exists (
      select 1 from channels c
      join workspace_members wm on wm.workspace_id = c.workspace_id
      where c.id = messages.channel_id and wm.user_id = auth.uid()
    )
  );

-- Enable Realtime for messages
alter publication supabase_realtime add table messages;

-- ── Translation Cache ────────────────────────────────────────
create table if not exists translation_cache (
  content_hash text not null,
  target_language text not null,
  translated_text text not null,
  source_language text not null,
  created_at timestamptz default now(),
  primary key (content_hash, target_language)
);

alter table translation_cache enable row level security;
create policy "Authenticated users can read translation cache"
  on translation_cache for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert into translation cache"
  on translation_cache for insert with check (auth.role() = 'authenticated');

-- ── Whiteboards ───────────────────────────────────────────────
create table if not exists whiteboards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  tldraw_state jsonb,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table whiteboards enable row level security;
create policy "Workspace members can access whiteboards"
  on whiteboards for all using (
    exists (select 1 from workspace_members where workspace_id = whiteboards.workspace_id and user_id = auth.uid())
  );
