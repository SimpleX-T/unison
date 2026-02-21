-- ============================================================
-- Document Versioning & Access Control
-- Adds per-document access, branching, and merge requests
-- ============================================================

-- ── Document Access ─────────────────────────────────────────
create table if not exists document_access (
  document_id uuid references documents(id) on delete cascade,
  user_id     uuid references profiles(id) on delete cascade,
  role        text not null check (role in ('editor', 'viewer')),
  invited_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz default now(),
  primary key (document_id, user_id)
);

alter table document_access enable row level security;

create policy "Document owner and invited users can view access list"
  on document_access for select using (
    user_id = auth.uid()
    or exists (
      select 1 from documents d
      where d.id = document_access.document_id and d.created_by = auth.uid()
    )
  );

create policy "Document owner can manage access"
  on document_access for insert with check (
    exists (
      select 1 from documents d
      where d.id = document_access.document_id and d.created_by = auth.uid()
    )
  );

create policy "Document owner can revoke access"
  on document_access for delete using (
    exists (
      select 1 from documents d
      where d.id = document_access.document_id and d.created_by = auth.uid()
    )
  );

-- ── Document Branches ───────────────────────────────────────
create table if not exists document_branches (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  owner_id    uuid references profiles(id) on delete cascade,
  name        text not null,
  language    text not null default 'en',
  yjs_state   jsonb,
  status      text not null default 'active' check (status in ('active', 'submitted', 'merged', 'rejected')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table document_branches enable row level security;

create policy "Branch owner can read/write their own branches"
  on document_branches for all using (owner_id = auth.uid());

create policy "Document owner can read all branches for their documents"
  on document_branches for select using (
    exists (
      select 1 from documents d
      where d.id = document_branches.document_id and d.created_by = auth.uid()
    )
  );

-- ── Branch Snapshots ────────────────────────────────────────
create table if not exists branch_snapshots (
  id         uuid primary key default gen_random_uuid(),
  branch_id  uuid references document_branches(id) on delete cascade,
  yjs_state  jsonb,
  created_at timestamptz default now()
);

alter table branch_snapshots enable row level security;

create policy "Branch owner can access their snapshots"
  on branch_snapshots for all using (
    exists (
      select 1 from document_branches db
      where db.id = branch_snapshots.branch_id and db.owner_id = auth.uid()
    )
  );

create policy "Document owner can read branch snapshots"
  on branch_snapshots for select using (
    exists (
      select 1 from document_branches db
      join documents d on d.id = db.document_id
      where db.id = branch_snapshots.branch_id and d.created_by = auth.uid()
    )
  );

-- ── Merge Requests ──────────────────────────────────────────
create table if not exists merge_requests (
  id           uuid primary key default gen_random_uuid(),
  branch_id    uuid references document_branches(id) on delete cascade,
  document_id  uuid references documents(id) on delete cascade,
  submitted_by uuid references profiles(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'approved', 'merged', 'rejected')),
  owner_note   text,
  created_at   timestamptz default now(),
  resolved_at  timestamptz
);

alter table merge_requests enable row level security;

create policy "Submitter can view their own merge requests"
  on merge_requests for select using (submitted_by = auth.uid());

create policy "Submitter can create merge requests"
  on merge_requests for insert with check (submitted_by = auth.uid());

create policy "Document owner can view and manage merge requests"
  on merge_requests for all using (
    exists (
      select 1 from documents d
      where d.id = merge_requests.document_id and d.created_by = auth.uid()
    )
  );
