-- supabase/migrations/20261121000000_kanban_board_tasks.sql
-- Kanban Board Tasks Table for DigitallyDefined OS Workflow

create table if not exists public.kanban_tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  status text not null default 'backlog', -- backlog, in_progress, review, done
  priority text default 'Med',
  tag text default 'AI Agent',
  assigned_agent text, -- e.g. gumroadPublisher, brandSupervisor, notionArchitect, businessAgent
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.kanban_tasks enable row level security;

-- Allow read/write for dashboard API key / authenticated users
create policy "Allow all access to kanban_tasks for dashboard"
  on public.kanban_tasks
  for all
  using (true)
  with check (true);

-- Insert initial workflow tasks
insert into public.kanban_tasks (title, description, status, priority, tag, assigned_agent) values
('Advanced Revenue Forecaster', 'AI agent predicting monthly recurring revenue across all 28 digital SKUs.', 'backlog', 'Med', 'AI Agent', 'businessAgent'),
('Digital Legacy Command Center v2', 'Enhanced asset inheritance checklist & secure vault templates.', 'backlog', 'High', 'Notion OS', 'notionArchitect'),
('Make.com Automated Social Pipeline', 'Connect Meta, Instagram, and Threads webhooks for automated content publishing.', 'backlog', 'High', 'Integration', 'businessAgent'),
('digitallydefined.store Refinement', 'Cleaned up product catalog, added brand logo header, and verified live Gumroad SKUs.', 'in_progress', 'High', 'Storefront', 'brandSupervisor'),
('Catalog Delete Button & Modal', 'Added delete confirmation and multi-agent pipeline preview modal to ProductsTab.', 'in_progress', 'High', 'Dashboard', 'businessAgent'),
('Vercel Cron Limit Compliance', 'Updated kb cron schedule from hourly to daily to meet Hobby plan limits.', 'in_progress', 'High', 'Backend', 'businessAgent'),
('Legacy OS Square Thumbnail', 'Generated 800x800 flat soft brutalist PNG asset for Gumroad product listing upload.', 'review', 'Med', 'Gumroad', 'visualAsset'),
('Cloudflare → Vercel Root DNS', 'Verified valid configuration and 308 redirect from digitallydefined.store to www.', 'review', 'High', 'Domain', 'businessAgent'),
('Dashboard & OS Command Center', 'Live at dashboard.digitallydefined.agency with all 22 specialist AI agents.', 'done', 'High', 'Production', 'businessAgent'),
('Legacy OS Flagship Sales Page', 'Live at legacyos.digitallydefined.store with fixed backup checkout links.', 'done', 'High', 'Production', 'businessAgent'),
('Supabase Edge Pipeline', 'Active backend endpoints handling analytics, Notion OS sync, and agent tool calls.', 'done', 'High', 'Supabase', 'businessAgent');
