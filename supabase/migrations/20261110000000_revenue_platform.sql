-- DigitallyDefined Revenue Platform — Supabase schema
-- Lead capture, affiliate tracking, audit reports, product purchases (PayPal),
-- and Notion-independent intake/assets. Applied via: npx supabase db push
-- (or paste into the Supabase SQL editor).

-- ---------------------------------------------------------------------------
-- 1. AUDIT REPORTS — every free-tool run is stored, scored, and affiliate-ready
-- ---------------------------------------------------------------------------
create table if not exists public.audit_reports (
  id uuid primary key default gen_random_uuid(),
  user_email text,
  target_url text,
  tool_type text not null default 'website',        -- website|seo|proposal|ai-readiness|marketing-health|digital-presence
  score integer check (score between 0 and 100),
  findings jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  affiliate_recs jsonb not null default '[]'::jsonb,
  status text not null default 'new' check (status in ('new','approved','published','rejected')),
  created_at timestamptz not null default now()
);
alter table public.audit_reports enable row level security;
grant all on public.audit_reports to service_role;

-- ---------------------------------------------------------------------------
-- 2. AFFILIATE PROGRAMS — the catalog (seeded below)
-- ---------------------------------------------------------------------------
create table if not exists public.affiliate_programs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  program_url text,
  tracking_url text,
  commission_rate numeric(5,2),                     -- percent, verified or estimated
  commission_verified boolean not null default false,
  payout_min numeric(10,2),
  category text,                                     -- seo|hosting|email|content|automation|dev-tools
  active boolean not null default true,
  notes text
);
alter table public.affiliate_programs enable row level security;
grant all on public.affiliate_programs to service_role;

-- ---------------------------------------------------------------------------
-- 3. AFFILIATE CLICKS — attribution: lead → program → conversion
-- ---------------------------------------------------------------------------
create table if not exists public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  program_slug text not null,
  url text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  clicked_at timestamptz not null default now()
);
alter table public.affiliate_clicks enable row level security;
grant all on public.affiliate_clicks to service_role;

-- ---------------------------------------------------------------------------
-- 4. PRODUCT PURCHASES — digital product sales (PayPal primary, Gumroad legacy)
-- ---------------------------------------------------------------------------
create table if not exists public.product_purchases (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  product_price numeric(10,2) not null default 0,
  currency text not null default 'USD',
  buyer_email text not null,
  payment_method text not null default 'paypal' check (payment_method in ('paypal','gumroad','stripe','stripe_legacy')),
  paypal_order_id text,
  status text not null default 'pending' check (status in ('pending','completed','delivered','refunded','failed')),
  license_key text,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.product_purchases enable row level security;
grant all on public.product_purchases to service_role;

-- ---------------------------------------------------------------------------
-- 5. PAYPAL ORDERS — server-side order ledger (idempotent webhook fulfillment)
-- ---------------------------------------------------------------------------
create table if not exists public.paypal_orders (
  id uuid primary key default gen_random_uuid(),
  paypal_order_id text unique not null,
  buyer_email text,
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  status text not null default 'CREATED' check (status in ('CREATED','APPROVED','CAPTURED','COMPLETED','VOIDED','REFUNDED')),
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.paypal_orders enable row level security;
grant all on public.paypal_orders to service_role;

-- ---------------------------------------------------------------------------
-- 6. NOTION-INDEPENDENT INTAKE — ideas queue in Supabase (mirrors Notion Ideas DB)
-- ---------------------------------------------------------------------------
create table if not exists public.idea_intake (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'intake' check (status in ('intake','approved','building','published','rejected')),
  source text,                                        -- intake-form|audit|agent
  origin_url text,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.idea_intake enable row level security;
grant all on public.idea_intake to service_role;

-- ---------------------------------------------------------------------------
-- Seed: the affiliate catalog requested in the revenue brief
-- Commission figures are PROGRAM PUBLISHED VALUES and MUST be re-verified
-- against each program's dashboard before payout claims are made.
-- ---------------------------------------------------------------------------
insert into public.affiliate_programs (slug, name, program_url, commission_rate, payout_min, category, notes) values
  ('ahrefs',        'Ahrefs',        'https://ahrefs.com/affiliates',         15.00, 100.00, 'seo',     'Recurring affiliate; verify current rate'),
  ('semrush',       'SEMrush',       'https://www.semrush.com/affiliates',    10.00, 100.00, 'seo',     'Recurring; verify current rate'),
  ('hostinger',     'Hostinger',     'https://www.hostinger.com/affiliates',  60.00, 100.00, 'hosting', 'Hybrid: % + flat per sale; verify current split'),
  ('cloudways',     'Cloudways',     'https://cloudways.in/affiliates',       7.00, 50.00,  'hosting', 'Recurring commission; verify current rate'),
  ('namecheap',     'Namecheap',     'https://www.namecheap.com/affiliates/', 20.00, 50.00,  'domain',  'Per-sale; verify current rate'),
  ('convertkit',    'ConvertKit',    'https://convertkit.com/affiliates',     20.00, 10.00,  'email',   'Recurring; verify current rate'),
  ('gohighlevel',   'GoHighLevel',    'https://www.gohighlevel.com/affiliates',30.00, 100.00, 'automation','Recurring sub-affiliate; verify current split'),
  ('surferseo',     'SurferSEO',     'https://surferseo.com/affiliate/',      10.00, 20.00,  'seo',     'Recurring; verify current rate'),
  ('jasper',        'Jasper',        'https://www.jasper.ai/partners',       0.00, 0.00,   'content',  'Partner program — terms vary; verify'),
  ('openrouter',    'OpenRouter',    'https://openrouter.ai/affiliates',     10.00, 0.00,   'dev-tools','Verify program existence and rate')
on conflict (slug) do nothing;
