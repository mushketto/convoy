-- Экспедиция №2 — GDD Hub & Roadmap Schema для Supabase
create table if not exists public.gdd_tasks (
  workspace_id text not null default 'default',
  task_id text not null,
  done boolean not null default false,
  note text not null default '',
  updated_by text not null default 'Engineer',
  updated_at timestamptz not null default now(),
  primary key (workspace_id, task_id)
);

create table if not exists public.gdd_presets (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null default 'default',
  name text not null,
  category text not null check (category in ('shredder', 'anomaly')),
  payload jsonb not null default '{}'::jsonb,
  created_by text not null default 'Engineer',
  created_at timestamptz not null default now()
);

create index if not exists idx_gdd_tasks_ws on public.gdd_tasks (workspace_id);
create index if not exists idx_gdd_presets_ws on public.gdd_presets (workspace_id, created_at desc);

alter table public.gdd_tasks enable row level security;
alter table public.gdd_presets enable row level security;

drop policy if exists "Allow anon all gdd_tasks" on public.gdd_tasks;
create policy "Allow anon all gdd_tasks" on public.gdd_tasks for all using (true) with check (true);

drop policy if exists "Allow anon all gdd_presets" on public.gdd_presets;
create policy "Allow anon all gdd_presets" on public.gdd_presets for all using (true) with check (true);

alter publication supabase_realtime add table public.gdd_tasks;
alter publication supabase_realtime add table public.gdd_presets;
