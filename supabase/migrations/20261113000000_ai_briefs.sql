-- 2026-11-13 — Store AI Business Partner morning briefs so the dashboard
-- COMMAND tab can show "this morning's brief" and the daily cron can
-- append one row per day without regenerating.
create table if not exists public.ai_briefs (
  id bigint generated always as identity primary key,
  brief_date date not null default current_date,
  working jsonb not null default '[]'::jsonb,
  slipping jsonb not null default '[]'::jsonb,
  next_actions jsonb not null default '[]'::jsonb,
  provider text,
  created_at timestamptz not null default now(),
  unique (brief_date)
);

alter table public.ai_briefs enable row level security;
revoke all on public.ai_briefs from anon, authenticated;
-- The backend writes via SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
