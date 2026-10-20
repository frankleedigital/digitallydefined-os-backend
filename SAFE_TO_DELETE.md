# SAFE_TO_DELETE.md

**Generated:** 2026-10-19
**Workspace:** `c:\Users\frank\Documents\DigitallyDefinedClean`
**Purpose:** List every file and folder safe to delete, with confidence levels.
**STATUS:** PLAN ONLY — Do NOT delete until approved.

## Confidence Levels

| Level | Definition |
|-------|------------|
| **HIGH** | No imports, no references, no env dependency, not used by builds or deployments. Safe to delete immediately. |
| **MEDIUM** | Likely unused but may be referenced by indirect means. Review before deleting. |
| **LOW** | Uncertain usage. Do NOT delete without manual verification. |

## Folders Safe to Delete (HIGH Confidence)

| Path | Reason | Confidence |
|------|--------|------------|
| `archive/` | Archive folder. No imports from active projects. | HIGH |
| `docs/` (root) | Documentation bloat. Will consolidate under project-level `/docs`. | HIGH |
| `output/` | Output/build artifact directory. Not source code. | HIGH |
| `scripts/` (root) | Root-level scripts. Each project has its own scripts. | HIGH |
| `supabase/` (root) | Retired Supabase functions. Active ones inside `os-backend/supabase/`. | HIGH |
| `Hermes/` | Hermes code lives in `os-backend/supabase/functions/hermes/` and `os-backend/api/hermes-mcp.js`. | HIGH |
| `.venv/` | Python virtual environment. Not source. | HIGH |
| `.venv-1/` | Python virtual environment. Not source. | HIGH |
| `.agents/` | Agent code lives in `os-backend/agents/` and `os-backend/src/agents/`. | HIGH |

## Root-Level Files Safe to Delete (HIGH Confidence)

| Path | Size | Reason | Confidence |
|------|------|--------|------------|
| `_a.txt` | 1,810 B | Temp/scratch file. No imports. | HIGH |
| `_b.txt` | 1,822 B | Temp/scratch file. No imports. | HIGH |
| `_d.txt` | 1,819 B | Temp/scratch file. No imports. | HIGH |
| `_inv.py` | 1,112 B | Temp Python script. No imports. | HIGH |
| `_n.txt` | 1,822 B | Temp/scratch file. No imports. | HIGH |
| `_s.txt` | 80 B | Temp/scratch file. No imports. | HIGH |
| `_t1.txt` | 51 B | Temp/scratch file. No imports. | HIGH |
| `_t2.txt` | 45 B | Temp/scratch file. No imports. | HIGH |
| `_t3.txt` | 1,566 B | Temp/scratch file. No imports. | HIGH |
| `_validate.py` | 2,722 B | Temp validation script. No imports. | HIGH |
| `.tmp-gw.err` | 55,466 B | Gateway error log. Not source. | HIGH |
| `.tmp-gw.log` | 168,879 B | Gateway log. Not source. | HIGH |
| `agentops.log` | 406 B | Monitoring log. Not source. | HIGH |
| `dumpkeys.py` | 842 B | Temp script. No imports. | HIGH |
| `exec-migration.js` | 1,546 B | Migration script. Legacy. | HIGH |
| `exec-migration.js.bak` | 1,549 B | Backup of migration script. Legacy. | HIGH |
| `HERMES_MODEL_ALIASES.md` | 3,000 B | Hermes model aliases doc. Hermes config lives in backend. | HIGH |
| `hima.toml` | 449 B | Hima config. Not referenced by active projects. | HIGH |
| `index.html` | 7,353 B | Root index.html. Not part of any active project (each has its own). | HIGH |
| `index.html.bak` | 7,320 B | Backup of root index. | HIGH |
| `models.json` | ~20 KB | Model definitions live in `os-backend/src/config/models.js`. | HIGH |
| `omniroute_models.json` | ~22 KB | OmniRoute models config. Lives in backend env/config. | HIGH |
| `OMNIROUTE_MIGRATION_AUDIT.md` | 6,358 B | Migration audit doc. Archive material. | HIGH |
| `OMNIROUTE_MIGRATION_LOG.md` | 3,798 B | Migration log. Archive material. | HIGH |
| `OMNIROUTE_PROVIDER_AUDIT.md` | 3,525 B | Provider audit doc. Archive material. | HIGH |
| `omniroute-hermes-mcp-config.yaml` | ~2.8 KB | MCP config. Hermes config lives in backend. | HIGH |
| `READY_FOR_HERMES.md` | 3,176 B | Status doc. Not runtime code. | HIGH |
| `scratch_storage.sqlite` | ~41 KB | Scratch database. Not source. | HIGH |

## Root-Level Files to KEEP

| Path | Size | Reason |
|------|------|--------|
| `.gitignore` | 247 B | Git ignore rules for the workspace. |
| `.env.local` | 1,451 B | Root-level env. Review before deleting. |
| `client_secret_2_630454335170-…` | 470 B | Google Cloud credentials. **DO NOT DELETE** — may be needed for GCP. |
| `digitallyDefined_CREDENTIAL_REG…` | 11,310 B | Credential registry. **DO NOT DELETE** — move to `/docs`. |

## Files Requiring Review (LOW / MEDIUM Confidence)

| Path | Reason for Review |
|------|-------------------|
| `.env.local` (root) | May contain shared env vars. Check if any active project imports it. |
| `workspace/` | Purpose unclear. Investigate before deleting. |
| `client_secret_*.json` | Google credentials — do not delete, but verify if still in use. |
| `digitallyDefined_CREDENTIAL_REG…` | Credential registry — move to `/docs`, do not delete. |

## What Must NOT Be Deleted

| Path | Reason |
|------|--------|
| `digital-products/` | Core project #3 |
| `digitallydefined-dashboard/` | Core project #1 |
| `digitallydefined-os-backend/` | Core project #2 — TRUE BACKEND |
| `digital-products/node_modules/` | Runtime dependencies (do not commit, but keep on disk) |
| `digitallydefined-dashboard/node_modules/` | Runtime dependencies |
| `digitallydefined-os-backend/node_modules/` | Runtime dependencies |
| `.gitignore` | Workspace git config |
| `client_secret_*.json` | Google Cloud credentials |
| `digitallyDefined_CREDENTIAL_REG…` | Credential registry (move to `/docs`) |

## Space Savings Estimate (HIGH confidence deletions only)

Approximately 250,000+ bytes in root-level log/temp files, plus entire folders: `archive/`, `docs/`, `output/`, `scripts/`, `supabase/`, `Hermes/`, `.venv/`, `.venv-1/`, `.agents/`, `.github/`, `.kilo/`, `.vercel/`, `.vscode/`, `dist/`, `digitallydefined-backend-clean/`, `digitallydefined-online-local/`, `digitallydefined-os-workers/`.

**Total potential savings:** Several hundred MB (mostly `node_modules` in deleted projects + log files).

## Next Step

See `FILES_TO_KEEP.md`, `FILES_TO_REMOVE.md`, and `FILES_TO_REVIEW.md` for the consolidated file-level plan.

| `skills-lock.json` | 267 B | Skills lock. Not referenced by active projects. | HIGH |
| `test.txt` | 28 B | Test file. | HIGH |

| `.github/` | CI/CD config. Not runtime code. | HIGH |
| `.kilo/` | Editor config. Not runtime code. | HIGH |
| `.vercel/` (root) | Vercel CLI state. Not source. | HIGH |
| `.vscode/` (root) | IDE config. Not runtime code. | HIGH |
| `dist/` (root) | Build artifact. Not source. | HIGH |
| `digitallydefined-backend-clean/` | Shell only (.env + LEGACY_INVENTORY.md). Actual backend is `os-backend/`. | HIGH |
| `digitallydefined-online-local/` | Legacy frontend. Superseded by `digitallydefined-dashboard/`. | HIGH |
| `digitallydefined-os-workers/` | Cloudflare Workers. Not part of 3-target architecture. | HIGH |

## Folders Requiring Review (MEDIUM Confidence)

| Path | Reason for Review |
|------|-------------------|
| `workspace/` | Purpose unclear. No imports found. Investigate before deleting. |
