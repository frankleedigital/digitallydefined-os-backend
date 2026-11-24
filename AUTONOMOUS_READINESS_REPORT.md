# AUTONOMOUS_READINESS_REPORT.md

## Can it run autonomously today?
Partially. Core agent/dashboard/API/R2/Notion paths are wired and deployed. Full autonomy blocked by:

## Blockers
1. KB migration (20261119000000) not applied to live Supabase — KB tables missing (404 via PostgREST). Opportunity/problem/telemetry ledger non-functional in production.
2. revenue_platform migration (20261110000000) has FK bug (affiliate_clicks.lead_id -> public.leads which doesn't exist; should be website_leads). Breaks full migration chain on fresh DB.
3. RLS/service-role grants unverified against live DB.
4. Notion DB IDs (NOTION_DB_*) must be set in production env for Hermes intelligence.
5. Slack channels not provisioned; notifications util ready but not wired to live channel IDs.
6. PDF Intelligence Engine not implemented (only architecture doc).
7. Automated signal generation from user events not wired (feedback API exists but signal automation not triggered).
8. FeedbackWidget only on IntelligencePage (not global).

## What works
- Dashboard auth (Supabase + single authorized account).
- Agent Hub (agents.list/run/orchestrate) via Vercel.
- AntiGravity Notion Architect (Vercel).
- R2 storage (validated).
- Hermes intelligence core (Notion-backed, in-memory fallback).
- Intake wizard, onboarding, review center.

## Recommended next steps
1. Apply KB migration to live Supabase (via Supabase dashboard or CLI) — requires authorization.
2. Fix revenue_platform FK (leads -> website_leads).
3. Set NOTION_DB_* env vars in production.
4. Provision Slack channels and wire channel IDs.
5. Mount FeedbackWidget globally and wire feedback.submit to signal generation.
6. Implement PDF Intelligence Engine per PDF_INTELLIGENCE_R2_INTEGRATION.md.

## Verdict
⚠️ Partial — core runs, but KB persistence and signal automation not live.
