-- ============================================================
-- In-app notifications
-- ============================================================

create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  type        text not null,
  title       text not null,
  body        text,
  link        text,
  read        boolean not null default false,
  metadata    jsonb default '{}',
  created_at  timestamptz default now()
);

create index idx_notifications_user_unread
  on notifications (user_id, read, created_at desc);

alter table notifications enable row level security;

create policy "Users can read their own notifications"
  on notifications for select using (user_id = auth.uid());

create policy "Users can update their own notifications"
  on notifications for update using (user_id = auth.uid());

create policy "Authenticated users can insert notifications"
  on notifications for insert with check (auth.uid() is not null);

alter publication supabase_realtime add table notifications;
