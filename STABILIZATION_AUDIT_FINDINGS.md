# STABILIZATION_AUDIT_FINDINGS.md

## Branches
- Dashboard: gemini-direct-integration (HEAD 5c6d9520)
- Backend: fix/issue-5-opportunity-contract (HEAD 930a35e-era + later commits)

## API base URL
Dashboard resolves to https://digitallydefined-os-backend.vercel.app (DEFAULT_BASE_URL). API key default 'DigitallyDefined-OS-2026'. Matches backend default.

## Verified contracts
- agents.list / agents.run / agents.orchestrate: allowed in ALLOWED_ACTIONS and handled in api/index.js. Backend returns { success, ... }. AgentHub checks res.success. OK.
- antigravity.*: allowed and handled; AntigravityPage calls callSupabaseEdge('antigravity.<tool>'). OK.
- Error responses: backend returns { success: false, error } on failure; AgentHub renders result.error. OK.
- agents.orchestrate uses result.ok === true for success, exposes agent, plan (result.result), evaluation, decisionId. OK.

## Not verified
- detectOpps / opportunity detection: no detectOpps found in repo; cannot verify. Assumption: handled elsewhere or not implemented.
- KB migration 20261119000000: file exists; no PostgreSQL available to validate. Static inspection only — not a successful migration test.
- RLS/Supabase schema state: cannot inspect live DB without credentials/tools.

## Remaining blockers
- Code: none confirmed for agent/antigravity contracts.
- Environment: migration validation requires Postgres; live DB state unverified.
- detectOpps implementation not located — possible missing feature.
