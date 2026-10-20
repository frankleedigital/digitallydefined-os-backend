# FILES_TO_REMOVE.md

**Generated:** 2026-10-19
**Workspace:** `c:\Users\frank\Documents\DigitallyDefinedClean`
**Purpose:** Consolidated list of all files and folders to remove after cleanup.
**STATUS:** PLAN ONLY — Do NOT delete anything yet.

---

## Entire Folders to Remove

| Path | Size Estimate | Reason | Confidence |
|------|--------------|--------|------------|
| `archive/` | ~unknown | Archive folder. No imports from active projects. | HIGH |
| `docs/` (root) | ~unknown | Documentation bloat. Consolidate under project-level `/docs`. | HIGH |
| `output/` | ~unknown | Output/build artifact directory. Not source code. | HIGH |
| `scripts/` (root) | ~unknown | Root-level scripts. Each project has its own scripts. | HIGH |
| `supabase/` (root) | ~unknown | Retired Supabase functions. Active ones inside `os-backend/supabase/`. | HIGH |
| `Hermes/` | ~unknown | Hermes code lives in `os-backend/supabase/functions/hermes/` and `os-backend/api/hermes-mcp.js`. | HIGH |
| `.venv/` | ~unknown | Python virtual environment. Not source. | HIGH |
| `.venv-1/` | ~unknown | Python virtual environment. Not source. | HIGH |
| `.agents/` | ~unknown | Agent code lives in `os-backend/agents/` and `os-backend/src/agents/`. | HIGH |
| `.github/` | ~unknown | CI/CD config. Not runtime code. | HIGH |
| `.kilo/` | ~unknown | Editor config. Not runtime code. | HIGH |
| `.vercel/` (root) | ~unknown | Vercel CLI state. Not source. | HIGH |
| `.vscode/` (root) | ~unknown | IDE config. Not runtime code. | HIGH |
| `dist/` (root) | ~unknown | Build artifact. Not source. | HIGH |
| `digitallydefined-backend-clean/` | ~2 files | Shell only (.env + LEGACY_INVENTORY.md). Actual backend is `os-backend/`. | HIGH |
| `digitallydefined-online-local/` | ~large | Legacy frontend. Superseded by `digitallydefined-dashboard/`. | HIGH |
| `digitallydefined-os-workers/` | ~medium | Cloudflare Workers. Not part of 3-target architecture. | HIGH |

---

## Root-Level Files to Remove

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
| `skills-lock.json` | 267 B | Skills lock. Not referenced by active projects. | HIGH |
| `test.txt` | 28 B | Test file. | HIGH |

---

## Files to Preserve (Move to /docs, Do NOT Delete)

| Path | Size | Reason | Destination |
|------|------|--------|-------------|
| `digitallyDefined_CREDENTIAL_REG…` | 11,310 B | Credential registry | `/docs/` |
| `fastapi/GOOGLE_CLOUD_AUDIT.md` | 3,443 B | GCP audit doc | `/docs/` |
| `digitallydefined-os-backend/MIGRATION.md` | ~1 KB | Migration doc | `/docs/` |
| `digitallydefined-os-backend/DEPRECATED.md` | 823 B | Deprecation doc | `/docs/` |
| `digitallydefined-os-backend/supabase/MIGRATION_GUIDE.md` | 10,730 B | Supabase migration guide | `/docs/` |
| `digitallydefined-os-backend/supabase/README.md` | 2,800 B | Supabase readme | `/docs/` |

---

## Notes

- `node_modules/` inside kept projects (`digital-products/`, `digitallydefined-dashboard/`, `digitallydefined-os-backend/`) are kept on disk but NOT committed to git.
- `workspace/` is listed under review — investigate before deciding to remove or keep.
- `.env.local` at root is kept for now but should be reviewed — may contain shared config or may be redundant.
