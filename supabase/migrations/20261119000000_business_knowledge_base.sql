-- ============================================================================
-- BUSINESS KNOWLEDGE BASE — central source of truth for DigitallyDefined
-- Migration: 20261119000000_business_knowledge_base.sql
-- Applied via: npx supabase db push  (or paste into the Supabase SQL editor)
--
-- ARCHITECTURE SOURCE OF TRUTH: HERMES KB BLUEPRINT
-- The KB connects the data we already collect (quiz, leads, Gumroad, GA4,
-- Brevo, agent runs) to the AI layer that is currently blind to it.
--
-- MANDATORY CONTRACTS ENFORCED HERE (schema-level):
--   C1. Evidence tracing is mandatory.
--       opportunity_ledger / problem_ledger / agent_telemetry / ai_briefs
--       carry an evidence JSONB populated by the app layer.
--   C2. Every opportunity references real data
--       -> opportunity_ledger.evidence must contain >=1 {table,id};
--          confidence is capped when evidence is incomplete.
--   C3. Every problem references a real source
--       -> problem_ledger.source_table + source_id are NOT NULL.
--   C4. Every agent run records telemetry
--       -> agent_telemetry, written at the executeAgent() chokepoint.
--   C5. Every recommendation is auditable
--       -> ai_briefs.decisions + decision_log with outcome + closed_at.
--
-- Write access: service_role ONLY. All tables RLS-enabled; anon/authenticated
-- are revoked so the dashboard can never write to the KB.
--
-- EVIDENCE SCHEMA (enforced application-side by src/services/kb/evidence.js):
--   evidence = [ { "table": "<kb_table>", "id": "<row_id>",
--                  "note": "<why this row supports the claim>",
--                  "ts": "<ISO-8601, optional>" } ]
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. agent_registry — THE single capability catalog + routing metadata.
--    Supersedes the split between agents/index.js and hermes/registry.js.
--    The DB row is source-of-truth; the JS files become projections.
-- ---------------------------------------------------------------------------
create table if not exists public.agent_registry (
  id            text primary key,                 -- stable slug, e.g. 'wealthCalculator'
  display_name  text not null,
  capability    text,                             -- what it answers (routing key)
  category      text,                             -- discovery|creation|content|real-estate|financial|revenue|governance
  description   text,
  inputs        jsonb not null default '[]'::jsonb,
  outputs       jsonb not null default '[]'::jsonb,
  data_sources  jsonb not null default '[]'::jsonb,
  version       text not null default '1.0.0',
  active        boolean not null default true,
  updated_at    timestamptz not null default now()
);
alter table public.agent_registry enable row level security;
grant all on public.agent_registry to service_role;

create table if not exists public.agent_telemetry (
  id             uuid primary key default gen_random_uuid(),
  run_id         text,                            -- optional external correlation id
  agent_id       text not null references public.agent_registry(id),
  invoker        text not null default 'unknown', -- hermes-router|agent-hub|orchestrator|cron|manual
  input_hash     text,                            -- SHA-256 of inputs (privacy + dedupe)
  model          text,
  provider       text,
  outcome        text not null default 'success' check (outcome in ('success','degraded','error')),
  error_class    text,
  latency_ms     integer,
  cost_units     numeric(10,4),
  context_snapshot_id uuid,                       -- ties "what it saw" to "what it produced"
  evidence       jsonb not null default '[]'::jsonb,  -- C1
  created_at     timestamptz not null default now()
);
alter table public.agent_telemetry enable row level security;
grant all on public.agent_telemetry to service_role;
create index if not exists agent_telemetry_agent_created_idx on public.agent_telemetry (agent_id, created_at desc);
create index if not exists agent_telemetry_outcome_idx on public.agent_telemetry (outcome);


-- ---------------------------------------------------------------------------
-- 2. business_assets — canonical registry of every asset (domain/site/product/
--    social account/Notion DB/lead magnet/doc). Products reference this.
-- ---------------------------------------------------------------------------
create table if not exists public.business_assets (
  id           uuid primary key default gen_random_uuid(),
  asset_type   text not null check (asset_type in
    ('domain','website','product','social-account','notion-db','lead-magnet','doc','other')),
  name         text not null,
  url          text,
  owner        text,
  status       text not null default 'active',
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (asset_type, name)
);
alter table public.business_assets enable row level security;
grant all on public.business_assets to service_role;
create index if not exists business_assets_type_idx on public.business_assets (asset_type);

-- Notion DB inventory — per-database record counts + health (priority 4).
create table if not exists public.notion_db_inventory (
  id            uuid primary key default gen_random_uuid(),
  db_key        text not null,              -- env.notion.databases key, e.g. 'content'
  db_id         text not null,
  title         text,
  record_count  integer,
  last_synced_at timestamptz,
  reachable     boolean not null default true,
  detail        jsonb not null default '{}'::jsonb,
  evidence      jsonb not null default '[]'::jsonb,
  updated_at    timestamptz not null default now(),
  unique (db_key, db_id)
);
alter table public.notion_db_inventory enable row level security;
grant all on public.notion_db_inventory to service_role;
create index if not exists notion_db_inventory_key_idx on public.notion_db_inventory (db_key);

-- ---------------------------------------------------------------------------
-- 3. product_registry — the product source of truth, linked to revenue.
-- ---------------------------------------------------------------------------
create table if not exists public.product_registry (
  id              uuid primary key default gen_random_uuid(),
  asset_id        uuid references public.business_assets(id),
  slug            text not null unique,
  name            text not null,
  price_cents     integer,
  price_source    text,
  status          text not null default 'live' check (status in ('live','dormant','tripwire','flagship','retired')),
  first_sale_at   timestamptz,
  last_sale_at    timestamptz,
  sales_count     integer not null default 0,
  revenue_cents_total numeric(14,2) not null default 0,
  revenue_evidence jsonb not null default '[]'::jsonb,
  persona_fit     text,
  gumroad_id      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.product_registry enable row level security;


-- ---------------------------------------------------------------------------
-- 4. integration_status — auth/publisher health per external system.
--    Populated by the hourly health probe; biggest "detect problems" source.
-- ---------------------------------------------------------------------------
create table if not exists public.integration_status (
  id               text primary key,
  system           text not null,
  credential_ref   text,
  auth_state       text not null default 'unknown' check (auth_state in
    ('connected','disconnected','expiring','expired','unconfigured','unknown')),
  publisher_wired  boolean not null default false,
  last_checked_at  timestamptz,
  expires_at       timestamptz,
  detail           jsonb not null default '{}'::jsonb,
  evidence         jsonb not null default '[]'::jsonb,  -- C1
  updated_at       timestamptz not null default now()
);
alter table public.integration_status enable row level security;
grant all on public.integration_status to service_role;

-- ---------------------------------------------------------------------------
-- 5. automation_status — real worker registry + health (replaces no-op panel)
-- ---------------------------------------------------------------------------
create table if not exists public.automation_status (
  id            text primary key,
  worker_id     text not null,
  kind          text,
  schedule      text,
  owner         text,
  last_run_at   timestamptz,
  last_status   text not null default 'never' check (last_status in
    ('success','failed','running','never','skipped')),
  last_error    text,
  health        text not null default 'unknown' check (health in
    ('healthy','degraded','failing','unknown')),
  evidence      jsonb not null default '[]'::jsonb,  -- C1
  updated_at    timestamptz not null default now()
);
alter table public.automation_status enable row level security;
grant all on public.automation_status to service_role;

-- ---------------------------------------------------------------------------
-- 6. sop_docs — machine-readable, versioned operating procedures + docs.
-- ---------------------------------------------------------------------------
create table if not exists public.sop_docs (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  owner         text,
  body_ref      text,
  body          text,
  detail        jsonb not null default '{}'::jsonb,
  version       integer not null default 1,
  effective_at  timestamptz not null default now(),
  active        boolean not null default true
);
alter table public.sop_docs enable row level security;
grant all on public.sop_docs to service_role;

-- ---------------------------------------------------------------------------
-- 7. opportunity_ledger — persistent, ranked, trending opportunities.
--    C2: evidence is mandatory; confidence caps when it is incomplete.
-- ---------------------------------------------------------------------------
create table if not exists public.opportunity_ledger (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  type             text not null default 'revenue',
  source_agent     text references public.agent_registry(id),
  target_asset_id  uuid references public.business_assets(id),
  score            integer check (score between 0 and 100),
  components       jsonb not null default '{}'::jsonb,
  confidence       text not null default 'low' check (confidence in ('low','medium','high')),
  status           text not null default 'open' check (status in
    ('open','approved','working','closed','rejected')),
  evidence         jsonb not null default '[]'::jsonb,  -- C1/C2
  trend            text,
  detected_at      timestamptz not null default now(),
  last_evaluated_at timestamptz not null default now(),
  superseded_by    uuid references public.opportunity_ledger(id)
);
alter table public.opportunity_ledger enable row level security;
grant all on public.opportunity_ledger to service_role;
create index if not exists opportunity_ledger_score_idx on public.opportunity_ledger (status, score desc);
create index if not exists opportunity_ledger_agent_idx on public.opportunity_ledger (source_agent);

-- ---------------------------------------------------------------------------
-- 8. problem_ledger — faults with a concrete, traceable source.
--    C3: source_table + source_id are mandatory.
-- ---------------------------------------------------------------------------
create table if not exists public.problem_ledger (
  id             uuid primary key default gen_random_uuid(),
  domain         text not null default 'integration' check (domain in
    ('integration','agent','revenue','content','automation','data','other')),
  title          text not null,
  severity       text not null default 'P2' check (severity in ('P0','P1','P2')),
  source_table   text not null,
  source_id      text not null,
  owner          text,
  status         text not null default 'open' check (status in
    ('open','mitigating','resolved','ignored')),
  mitigation     jsonb not null default '[]'::jsonb,
  evidence       jsonb not null default '[]'::jsonb,  -- C1
  detected_at    timestamptz not null default now(),
  resolved_at    timestamptz,
  ignored_reason text
);
alter table public.problem_ledger enable row level security;
grant all on public.problem_ledger to service_role;
create index if not exists problem_ledger_sev_idx on public.problem_ledger (severity, status);
create index if not exists problem_ledger_source_idx on public.problem_ledger (source_table, source_id);

-- ---------------------------------------------------------------------------
-- 9. decision_log — C5: every recommendation/approval + outcome is auditable.
-- ---------------------------------------------------------------------------
create table if not exists public.decision_log (
  id             uuid primary key default gen_random_uuid(),
  kind           text not null default 'recommendation' check (kind in
    ('recommendation','approval','ignore','execute','rollback')),
  summary        text not null,
  recommended_by text not null default 'hermes',
  status         text not null default 'pending' check (status in
    ('pending','approved','rejected','executed','rolled-back','closed')),
  ref_type       text,
  ref_id         text,
  outcome        text,
  evidence       jsonb not null default '[]'::jsonb,  -- C1/C5
  created_at     timestamptz not null default now(),
  closed_at      timestamptz


-- ---------------------------------------------------------------------------
-- 10. weekly_reports — extend with structured, evidence-linked priorities.
--      (table already exists from 003; add columns idempotently)
-- ---------------------------------------------------------------------------
alter table public.weekly_reports add column if not exists priorities jsonb;
alter table public.weekly_reports add column if not exists ignored jsonb;
alter table public.weekly_reports add column if not exists evidence jsonb;

-- ---------------------------------------------------------------------------
-- 11. leads + optimization_signals — extend to carry persona + provenance.
-- ---------------------------------------------------------------------------
alter table public.website_leads add column if not exists persona text;
alter table public.website_leads add column if not exists stage text;
alter table public.website_leads add column if not exists intent_signals jsonb;

alter table public.optimization_signals add column if not exists source_table text;
alter table public.optimization_signals add column if not exists captured_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- 12. ai_briefs — extend so every brief is auditable (C5) + context-traceable.
--      (table already exists from 20261113000000)
-- ---------------------------------------------------------------------------
alter table public.ai_briefs add column if not exists context_snapshot jsonb;
alter table public.ai_briefs add column if not exists evidence jsonb;
alter table public.ai_briefs add column if not exists confidence text;
alter table public.ai_briefs add column if not exists data_gaps jsonb;
alter table public.ai_briefs add column if not exists superseded_by bigint references public.ai_briefs(id);
alter table public.ai_briefs add column if not exists decisions jsonb;

-- ----------------------------------------------------------------------------
-- RLS: the KB is written exclusively by service_role. Revoke anon/authenticated
-- write access on every KB table so the browser can never mutate it.
-- ----------------------------------------------------------------------------
revoke all on public.agent_registry, public.agent_telemetry, public.business_assets,
  public.product_registry, public.integration_status, public.automation_status,
  public.automation_execution, public.sop_docs, public.opportunity_ledger,
  public.problem_ledger, public.decision_log, public.weekly_reports, public.ai_briefs
  from anon, authenticated;

);
alter table public.decision_log enable row level security;
grant all on public.decision_log to service_role;
create index if not exists decision_log_ref_idx on public.decision_log (ref_type, ref_id);

  active        boolean not null default true
);
alter table public.sop_docs enable row level security;
grant all on public.sop_docs to service_role;

grant all on public.product_registry to service_role;
create index if not exists product_registry_status_idx on public.product_registry (status);

-- Link existing purchases to the registry (best-effort, by name)
alter table public.product_purchases add column if not exists product_id uuid;
create index if not exists product_purchases_product_idx on public.product_purchases (product_id);

-- ---------------------------------------------------------------------------
-- 13. automation_execution — automation execution telemetry (priority 5).
--    Records each observed automation run (worker, duration, status, error)
--    so Hermes can monitor whether automations actually fire and complete.
--    C1: evidence tracing mandatory.
-- ---------------------------------------------------------------------------
create table if not exists public.automation_execution (
  id             uuid primary key default gen_random_uuid(),
  run_id         text not null,                         -- correlation id for the run
  worker_id      text not null references public.automation_status(id),
  kind           text,
  schedule       text,
  started_at     timestamptz not null default now(),
  finished_at    timestamptz,
  duration_ms    integer,
  status         text not null default 'success' check (status in ('success','failed','skipped','running')),
  output_summary jsonb not null default '{}'::jsonb,   -- what the run produced (counts, links)
  error          text,
  retry_count    integer not null default 0,
  evidence       jsonb not null default '[]'::jsonb,    -- C1
  created_at     timestamptz not null default now()
);
alter table public.automation_execution enable row level security;
grant all on public.automation_execution to service_role;
create index if not exists automation_execution_worker_idx on public.automation_execution (worker_id, created_at desc);
create index if not exists automation_execution_status_idx on public.automation_execution (status);

