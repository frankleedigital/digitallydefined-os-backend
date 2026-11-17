# CLEANUP_MANIFEST — DigitallyDefinedClean

**Generated:** 2026-11-07 (read-only audit; nothing has been moved or deleted)
**Rules:** No deletion of anything referenced by the 3 production repos (`digitallydefined-dashboard`, `digitallydefined-os-backend`, `digital-products`), Gumroad sales files, or deploy config. Secrets (`.env*`, `client_secret_*.json`) are never deleted — only re-homed if at all.

Format per item: **Path** → **Action** (KEEP / MOVE TO ARCHIVE / MERGE / DELETE CANDIDATE) / **Reason** / **Risk Level** (Low/Medium/High) / **Dependency Risk** (None/Low/High).

---

## A. Root audit & report files (81 `.md`)

All listed files: Action = **MOVE TO `archive/reports/`** (preserve; they record the Sept–Oct 2026 audit cycle). Risk Level = Low for all. Dependency Risk = None for all (no code imports them). Exceptions flagged separately.

- `ACTIVE_DEPENDENCY_MAP.md`, `AGENT_GOVERNANCE.md`, `AGENT_MIGRATION_AUDIT.md`, `AGENT_SLACK_INTEGRATION.md`, `AI_DEVELOPER_OPTIMIZATION.md`, `ANTIGRAVITY_CAPABILITY_AUDIT.md`, `ANTIGRAVITY_VERIFIED_CAPABILITIES.md`, `ARCHITECTURE_FORENSIC_REPORT.md`, `CLEANUP_PLAN.md`, `CODEBASE_AUDIT.md`, `COMMAND_CENTER_STATUS.md`, `CURRENT_ARCHITECTURE.md`, `DASHBOARD_FUNCTIONAL_AUDIT.md`, `DASHBOARD_SECURITY_REPORT.md`, `DASHBOARD_SLACK_OPERATIONS.md`, `DATABASE_GAP_REPORT.md`, `DIGITALLYDEFINED_MONEY_MACHINE.md`, `DIGITALLYDEFINED_OS_AUTOMATION_SPEC.md`, `DOCKER_ARCHITECTURE.md`, `DUE_DILIGENCE_REPORT.md`, `EMAIL_STANDARDIZATION_REPORT.md`, `FINAL_EMAIL_MIGRATION_CHECKLIST.md`, `FUNNEL_RUNBOOK.md`, `HERMES_*.md` (×10), `IDEAS_INTAKE_UX_AUDIT.md`, `INTEGRATION_MAP.md`, `LEGACY_INFRASTRUCTURE_AUDIT.md`, `MASTER_IMPLEMENTATION_ROADMAP.md`, `MASTER_ROADMAP.md`, `MCP_AUDIT_REPORT.md`, `MODULARIZATION_PLAN.md`, `NOTION_*.md` (×7), `OMNIROUTE_*.md` (×4), `ONBOARDING_*.md` (×4), `PDF_INTELLIGENCE_R2_INTEGRATION.md`, `PORTFOLIO_ROLE_AUDIT.md`, `POST_CLEANUP_ARCHITECTURE.md`, `PRIORITY_FIXES.md`, `PRODUCT_FACTORY_REPORT.md`, `R2_PHASE3_REPORT.md`, `R2_READINESS_REPORT.md`, `READY_FOR_HERMES.md`, `RELEASE_SUMMARY.md`, `REVENUE_ENGINE_REPORT.md`, `ROOT_CAUSE_ANALYSIS.md`, `SCALABILITY_REPORT.md`, `SCHEMA_EXPANSION_MIGRATION.md`, `SLACK_*.md` (×6), `SLASH_COMMAND_SPEC.md`, `SYSTEM_AUDIT.md`, `SYSTEM_MAP.md`
  - **Reason:** historical audit artifacts; conclusions already reflected in the launch-readiness branches.
  - **Risk:** Low. **Dependency Risk:** None.

- `PRODUCTION_READINESS_AUDIT.md` → **KEEP** (or move to `docs/`) — still the open launch checklist (unrotated `DASHBOARD_API_KEY`). **Risk:** Low. **Dependency:** Low (referenced in deployment runbooks).
- `FIRST_DOLLAR_ROADMAP.md` → **KEEP** — active revenue-phase roadmap (last touched 2026-11-04). **Risk:** Low. **Dependency:** Low.
- `SAFE_TO_DELETE.md` → **MOVE TO ARCHIVE** — 2026-10-19 planning doc, already executed/superseded by this manifest. **Risk:** Low. **Dependency:** None.
- `FILES_TO_KEEP.md` / `FILES_TO_REMOVE.md` / `FILES_TO_REVIEW.md` → **MOVE TO ARCHIVE** — same reason. **Risk:** Low. **Dependency:** None.
- `digitallyDefined_CREDENTIAL_REGISTRY.md` → **MOVE TO `docs/`** — credential registry (do not delete; contains key inventory, not raw secrets). **Risk:** Medium (secret inventory). **Dependency:** None.

## B. Root scratch / generated files

| Path | Action | Reason | Risk | Dependency |
|---|---|---|---|---|
| `.tmp-gw.err`, `.tmp-gw.log` | DELETE CANDIDATE | Gateway log capture (2026-09-28); **currently git-tracked** — also `git rm --cached` to untrack | Low | None |
| `agentops.log` | DELETE CANDIDATE | AgentOps SDK log, 401 errors only | Low | None |
| `_a.txt`…`_t3.txt` (9 files) | DELETE CANDIDATE | 2026-09-12 scratch dumps; gitignored via `_*.txt` | Low | None |
| `test.txt` | DELETE CANDIDATE | 28 bytes, no references | Low | None |
| `models.json` (2 MB), `omniroute_models.json` (2.2 MB) | DELETE CANDIDATE | Generated model-catalog dumps (regenerable from OmniRoute API) | Low | None |
| `scratch_storage.sqlite` (41 MB) | DELETE CANDIDATE | Agent scratch DB; only consumer is `dumpkeys.py` | Medium (may hold cached credentials — inspect tables before deleting) | None |
| `_archive.py`, `_inv.py`, `_validate.py`, `dumpkeys.py` | MOVE TO `archive/scripts/` | One-off tooling | Low | None |
| `audit_*.py` ×6 + `audit_*_out.txt`/`audit_*.json` ×6 | MOVE TO `archive/scripts/` + `archive/reports/` | Superseded audit run (2026-10-19/21) | Low | None |
| `exec-migration.js`, `exec-migration.js.bak` | MOVE TO `archive/scripts/` | Supabase REST SQL migration runner; `.bak` is a duplicate of it | Low | None |
| `hima.toml` | DELETE CANDIDATE (or keep on machine, out of repo) | Himalaya mail config with redacted-but-present password field; not revenue-critical | Medium (contains credential shape) | None |
| `omniroute-hermes-mcp-config.yaml` | MOVE TO `archive/configs/` | Local-only MCP wiring doc | Low | None |
| `index.html.bak` | DELETE CANDIDATE | Stale 2026-08-26 copy of root `index.html` | Low | None |
| `index.html` | KEEP | Root landing page (digitallydefined.online) | Low | High (deployed) |
| `.github/workflows/deploy-*.yml` (both 0 bytes) | DELETE CANDIDATE | Empty files — no CI exists; remove to avoid confusion | Low | None |
| `.vercel/` | DELETE CANDIDATE | Stale Vercel CLI link state | Low | None |
| `.venv/` | DELETE CANDIDATE (rebuild) | 18,528-file Python venv; rebuild with `python -m venv` | Low | None |
| `dist/` (root, 22 files) | DELETE CANDIDATE | Stale Vite build (2026-09-12); regenerative from dashboard source | Low | None |
| `output/` (empty) | DELETE CANDIDATE | Empty `packages/` + `storage/` dirs | Low | None |
| `scripts/` (root, 9 files) | MOVE TO `archive/scripts/` | Buzz/relay deploy + keypair + pipeline scripts; superseded by in-repo scripts | Medium (relay setup may still be used by Buzz gateway) | Low |
| `skills-lock.json`, `.agents/skills/composio/` | MOVE TO `archive/` | Installed agent skill + lock; not part of revenue path | Low | None |
| `Hermes/` | MOVE TO `archive/hermes-skills/` | 3 knowledge files; runtime code lives in os-backend | Low | None |
| `supabase/` (root, retired) | MOVE TO `archive/` (or delete keeping `RETIRED.md` in `docs/`) | Documented RETIRED 2026-10-09; `.temp` neutralized; active tree is `digitallydefined-os-backend/supabase/` | **Medium** — if anyone still runs `supabase functions deploy` from root, functions won't deploy (by design, per RETIRED.md) | None |

## C. `workspace/` and `archive/`

| Path | Action | Reason | Risk | Dependency |
|---|---|---|---|---|
| `workspace/buzz-agents/` | **KEEP** (canonical Buzz agent set: content-repurposer, digital-superpower-quiz, facebook-community-agent, json-schema-generator + `lib/`) | Referenced by product catalog `implementation` fields (e.g. Trends Explorer) | Low | Low |
| `archive/buzz-agents/` | **MERGE into `workspace/buzz-agents/`** | Older set (ai-rankand-rent-builder, digital-wealth-calculator, niche-keyword-discovery, reputation-intelligence, roadmap-generator). Diff agent names, keep any not present in workspace, then archive | Medium (two copies drift) | Low |
| `archive/digitallydefined-website-clean/` | KEEP IN ARCHIVE | Superseded standalone website; `ARCHIVED.md` marks it; reference only | Low | None |
| `archive/digitallydefined-backend-clean/` | KEEP IN ARCHIVE (do not re-commit `node_modules` or `.env` to any git) | Pre-launch backend; `.env` files present — keep off version control | Medium (secrets) | None |

## D. `digitallydefined-backend-clean` (top-level stub)

| Path | Action | Reason | Risk | Dependency |
|---|---|---|---|---|
| `digitallydefined-backend-clean/LEGACY_INVENTORY.md` | **MOVE TO `archive/`** | 22 KB inventory of the legacy backend | Low | None |
| `digitallydefined-backend-clean/.env` | **KEEP on disk, NEVER commit/move into git-tracked area** | 11 KB live env (2026-10-21) still referenced by `os-backend/DEPRECATED.md` docs and migration scripts | **High** (secrets) | **High** (FastAPI/Google flows may read it) |
| The root-repo **gitlink** entry `digitallydefined-backend-clean` (commit `bb998d5`) | Fix git metadata (re-point or drop the gitlink) | The folder no longer contains a nested `.git`; the gitlink is stale and makes `git status` noisy | Medium | Low |

## E. `digitallydefined-os-workers` (obsolete Cloudflare Workers)

| Path | Action | Reason | Risk | Dependency |
|---|---|---|---|---|
| `digitallydefined-os-workers/src/` (45 TS files), `wrangler.toml`, `package.json`, `tsconfig.json`, `scripts/` | **MOVE TO `archive/os-workers/`** | Obsolete Notion-automation Workers app; no deploy target referenced in active docs; OmniRoute/Supabase replaced it | Medium (irreversible if a Workers deploy still exists — check Cloudflare dash before moving) | None |
| `digitallydefined-os-workers/node_modules/` (2,464 files **committed to root git**) | Untrack (`git rm -r --cached`) + add to `.gitignore` | Repo bloat; never commit node_modules | Low | None |

## F. Dashboard repo (`digitallydefined-dashboard`) — in-repo cleanup (code changes; list only, do not execute here)

| Path | Action | Reason | Risk | Dependency |
|---|---|---|---|---|
| `src/pages/StorePage.jsx` | Re-wire into a `/store` route **or** delete + fix the dead `/store` redirect in `App.jsx` | Dead route: non-dashboard-domain visitors bounce | Medium (affects preview-URL visitors) | None |
| `src/pages/tabs/AntigravityTab.jsx`, `src/pages/tabs/NotionTab.jsx`, `src/pages/tabs/placeholder.txt` | DELETE | 0 refs; `DashboardPage` uses the non-tab variants | Low | None |
| `src/components/ErrorBoundary.jsx`, `RoiCalculator.jsx`, `TabNav.jsx` | DELETE or mount | 0 refs | Low | None |
| `src/lib/agentRegistry.js`, `src/lib/affiliateExport.js` | DELETE | 0 refs | Low | None |
| `src/services/api.js` vs `src/lib/api-client.js` | MERGE into one API client | Duplicate base-URL/timeout logic | Medium (touches all API calls) | None |
| `@vercel/analytics`, `@vercel/toolbar` deps | Remove from `package.json` if unused in prod build | 0 imports | Low | None |

## G. Backend repo (`digitallydefined-os-backend`) — in-repo cleanup (list only)

| Path | Action | Reason | Risk | Dependency |
|---|---|---|---|---|
| `api/quiz/`, `api/intelligence/`, `api/models/`, `api/set-model/`, `api/active-model/`, `api/business-partner/` | DELETE after verifying no Vercel route still resolves to them | Orphaned pre-unification folders; unified `api/index.js` is canonical | **Medium** — Vercel resolves most-specific path first; confirm these folders are no longer deployed before removing | **High** (deployed routes) |
| `api/fastapi/[[...path]]/` + `fastapi/` + `serve:fastapi` script | Keep only if the Python service is running; else archive | Dev/optional dependency | Low | Low |
| `src/routes/_original-index-backup.js` | DELETE | Backup file in production source tree | Low | None |
| `lib/` legacy helpers duplicating `supabase/functions/_shared/` | MERGE (delete one side) | Dual maintenance of publishers/notion helpers | Medium | Medium |
| `DEPRECATED.md` at repo root | **REPLACE with current status doc** | Actively wrong: claims repo superseded by `digitallydefined-backend-clean`, contradicting the dashboard's canonical base URL + Vercel project | Medium (misleads agents/devs) | None |
| `agents/`, `tools/`, `ai/`, `prompts/`, `roadmaps/`, `data/`, `openapi.yaml`, `server.ts`, `docker-compose.yml`, `kilo.json`, `tests/`, `fastapi/__pycache__/` | Triage: KEEP live ones, move the rest to `archive/legacy/` | Mixed live/legacy | Medium | Low |

## H. Digital products repo (`digital-products`)

| Path | Action | Reason | Risk | Dependency |
|---|---|---|---|---|
| `dist/` | **KEEP** (this is the sellable bundle, not a stale artifact — unlike root `dist/`) | Gumroad upload source | Low | High (revenue) |
| `node_modules/` | Ignore / never commit (already untracked per 2026-10-20 commit) | — | Low | None |
| `src/agents/`, `src/calculators/`, `src/tools/`, `public/` (all empty) | Delete empty dirs OR populate with product front-ends | Placeholder scaffolding | Low | None |
| Product docs (`DIGITAL_PRODUCT_AUDIT.md`, `STORE_PRODUCT_ROADMAP.md`, `FAST_CASH_PRODUCTS.md`, `FUNNEL_ARCHITECTURE.md`, `EMAIL_NURTURE_SYSTEM.md`, `FREE_LEAD_MAGNET_STRATEGY.md`, `STORE_LEAD_MAGNET_ASSETS.md`, `PRODUCT_FRAMEWORKS.md`, `IMPLEMENTATION_PRIORITIES.md`) | **KEEP** | Current product/funnel strategy docs — revenue-relevant | Low | Low |

## I. Explicit KEEP list (do not touch)

- `digitallydefined-dashboard/`, `digitallydefined-os-backend/`, `digital-products/` (code, configs, `vercel.json`, `.git`, `node_modules` on disk)
- `docs/DEPLOYMENT_STATE.md`, `docs/RUNBOOKS.md`, `docs/API.md`, `docs/ARCHITECTURE.md`, `docs/UNIFIED_DEPLOYMENT_CHECKLIST.md`, `docs/supabase-auth-redirects.md`, `docs/SELL_TOOLS_AS_STANDALONE_STRATEGY.md`
- `.gitignore`, `.env.local`, `client_secret_*.json`, `FIRST_DOLLAR_ROADMAP.md`, `PRODUCTION_READINESS_AUDIT.md`
- `workspace/buzz-agents/` (active set), `digital-products/dist/`
