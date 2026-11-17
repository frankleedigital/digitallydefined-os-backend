# ACTIVE_DEPENDENCY_MAP.md

**Generated:** 2026-10-19
**Workspace:** `c:\Users\frank\Documents\DigitallyDefinedClean`
**Purpose:** Classify every folder as ACTIVE / LEGACY / UNUSED / UNKNOWN based on imports, package references, env vars, deployment configs, build scripts, and API calls — not folder names.

## Classification Legend

| Status | Definition |
|--------|------------|
| **ACTIVE** | Imported/referenced by at least one of the 3 target projects (dashboard, backend, digital-products), or required at runtime. |
| **LEGACY** | Once part of architecture but no longer imported/referenced by any active project. Safe to remove. |
| **UNUSED** | No imports, no references, no env dependency, not used by builds/deployments. Safe to remove. |
| **UNKNOWN** | Cannot determine usage from static analysis. Requires manual review. |

## Root-Level Folders

| Folder | Status | Keep? |
|--------|--------|-------|
| `digital-products` | ACTIVE | YES |
| `digitallydefined-dashboard` | ACTIVE | YES |
| `digitallydefined-os-backend` | ACTIVE | YES |
| `digitallydefined-backend-clean` | LEGACY | NO |
| `digitallydefined-online-local` | LEGACY | NO |
| `digitallydefined-os-workers` | LEGACY | NO |
| `archive` | UNUSED | NO |
| `docs` (root) | UNUSED | NO |
| `output` | UNUSED | NO |
| `scripts` (root) | UNUSED | NO |
| `supabase` (root) | LEGACY | NO |
| `workspace` | UNKNOWN | REVIEW |
| `Hermes` | UNUSED | NO |
| `.venv` | UNUSED | NO |
| `.venv-1` | UNUSED | NO |
| `.agents` | UNUSED | NO |
| `.github` | UNUSED | NO |
| `.kilo` | UNUSED | NO |
| `.vercel` (root) | UNUSED | NO |
| `.vscode` (root) | UNUSED | NO |
| `dist` (root) | UNUSED | NO |

## Folder Classification Reasoning

| Folder | Status | Reasoning |
|--------|--------|-----------|
| `digital-products` | ACTIVE | Core project #3: Digital Products Store. React + Vite. Entry: `src/main.jsx` → `src/App.jsx`. |
| `digitallydefined-dashboard` | ACTIVE | Core project #1: Dashboard. Depends on backend via `VITE_API_URL=https://digitallydefined-os-backend.vercel.app`. |
| `digitallydefined-os-backend` | ACTIVE | TRUE BACKEND. Node.js/Express + FastAPI. Entry: `api/index.js` (Vercel), `src/index.js` (Express). |
| `digitallydefined-backend-clean` | LEGACY | Shell only — `.env` + `LEGACY_INVENTORY.md`. No source code. Actual backend is `os-backend/`. |
| `digitallydefined-online-local` | LEGACY | Legacy frontend. Superseded by `digitallydefined-dashboard/`. |
| `digitallydefined-os-workers` | LEGACY | Cloudflare Workers. Not part of 3-target architecture. |
| `archive` | UNUSED | Archive folder. No imports from active projects. |
| `docs` (root) | UNUSED | Documentation bloat. Will consolidate under project-level `/docs`. |
| `output` | UNUSED | Output/build artifact directory. Not source code. |
| `scripts` (root) | UNUSED | Root-level scripts. Each project has its own scripts. |
| `supabase` (root) | LEGACY | Retired Supabase functions. Active ones inside `os-backend/supabase/`. |
| `workspace` | UNKNOWN | Purpose unclear. No imports found. Requires review. |
| `Hermes` | UNUSED | Hermes code lives in `os-backend/supabase/functions/hermes/` and `os-backend/api/hermes-mcp.js`. |
| `.venv` / `.venv-1` | UNUSED | Python virtual environments. Not source. |
| `.agents` / `.github` / `.kilo` / `.vercel` / `.vscode` | UNUSED | IDE/CI/config. Not runtime code. |
| `dist` (root) | UNUSED | Build artifact. Not source. |


## The TRUE Backend — Independent Verification

**Conclusion:** `digitallydefined-os-backend/` is the true backend. `digitallydefined-backend-clean/` is an empty shell.

### Evidence from code analysis

**1. `api/index.js` (59 KB) — Vercel serverless gateway**
Defines `ALLOWED_ACTIONS` with 40+ actions: `dashboard`, `chat`, `hermes.agent`, `intelligence`, `license.verify` (Gumroad, used by digital products), `subscribe`, `contact`, `quiz.complete`, `automation.*`, `website.content`, `website.edit`, `antigravity.*`. Imports `../lib/antigravity.js`. CORS origins include `dashboard.digitallydefined.agency` and localhost ports.

**2. `src/` — Local Express server (mirrors Vercel handlers)**
`src/routes/` (18 modules), `src/services/` (12 modules incl. ai, antigravity, brevo, facebook, fastapi, notion, premium, sheets), `src/agents/` (7 AI agents), `src/middleware/`, `src/schemas/` (12), `src/workflows/` (3), `src/utils/` (6), `src/config/` (4).

**3. `fastapi/` — Python FastAPI microservice layer**
`app/main.py` entrypoint, `app/routers/` (11 modules), `app/services/` (9), `app/models/` (12), `app/llm.py` (OmniRoute client), `app/notion_architect.py`. Has `pyproject.toml`, `requirements.txt`, `Dockerfile`.

**4. `supabase/functions/` — Deno edge functions**
`hermes/`, `notion-sync/`, `quiz-roadmap/`, `sellable/`, `sync-aggregator.ts`, `action-registry.ts`, `brevo-email.ts`, `facebook-publisher.ts`, `sheets-sellable.ts`, `social-publishers.ts`.

**5. Dashboard → Backend dependency (verified)**
`digitallydefined-dashboard/src/lib/supabase-edge.js`: `DEFAULT_DASHBOARD_API_URL = 'https://digitallydefined-os-backend.vercel.app'`. `callSupabaseEdge(action, payload)` posts to backend. `digitallydefined-dashboard/.env`: `VITE_API_URL` and `VITE_BACKEND_URL` both point to `digitallydefined-os-backend.vercel.app`.

**6. Digital Products → Backend dependency**
Digital products storefront is client-side (React + Vite). Gumroad license verification flows through backend `license.verify` action. Backend required at runtime for license verification.
