# CLEANUP_PLAN.md — DigitallyDefinedClean Workspace

**Generated:** 2026-10-19
**Workspace:** `c:\Users\frank\Documents\DigitallyDefinedClean`
**STATUS:** PLAN ONLY — Do NOT delete anything yet. Awaiting your approval.

## Executive Summary

Reduce the workspace from ~23 top-level folders + ~30 root files down to exactly **3 active projects + root config + /docs archive**.

| Before | After |
|--------|-------|
| 23+ folders | 4 folders (3 projects + docs) |
| 30+ root files | ~6 root files |
| Duplicate backends | Single backend (`os-backend`) |
| Abandoned projects | 0 |
| Orphaned folders | 0 |
| Duplicate env configs | 1 per project |

## Proposed Final Architecture

```
DigitallyDefinedClean/
├── .gitignore
├── .env.local                          (root-level shared env — review)
├── client_secret_*.json                (GCP credentials — keep)
├── digitallyDefined_CREDENTIAL_REG…    (move to /docs — keep)
├── digital-products/                   ← ACTIVE PROJECT #1
├── digitallydefined-dashboard/         ← ACTIVE PROJECT #2
├── digitallydefined-os-backend/        ← ACTIVE PROJECT #3 (TRUE BACKEND)
└── docs/                               ← ARCHIVE (preserved docs)
```

## Runtime Dependency Chain (Success Criteria)

```
Dashboard
     ↓ (VITE_API_URL → os-backend)
OS Backend
     ↓ (SUPABASE_URL)
Supabase

Digital Products
     ↓ (license.verify via backend)
OS Backend
     ↓ (SUPABASE_URL)
Supabase
```

- **No duplicate backends.** Only `digitallydefined-os-backend/` remains.
- **No abandoned projects.** `online-local`, `os-workers`, `backend-clean` removed.
- **No orphaned folders.** All bloat folders removed.
- **No duplicate environment configurations.** One `.env` per project.
- **No dead code repositories.** All remaining code is imported or referenced.

## What Gets Deleted (HIGH Confidence)

### Folders (17 total)
`archive/`, `docs/` (root), `output/`, `scripts/` (root), `supabase/` (root), `Hermes/`, `.venv/`, `.venv-1/`, `.agents/`, `.github/`, `.kilo/`, `.vercel/` (root), `.vscode/` (root), `dist/` (root), `digitallydefined-backend-clean/`, `digitallydefined-online-local/`, `digitallydefined-os-workers/`

### Files (30+ total)
All `_*.txt`, `_*.py`, `.tmp-gw.*`, `agentops.log`, `dumpkeys.py`, `exec-migration.js*`, `HERMES_MODEL_ALIASES.md`, `hima.toml`, `index.html`, `index.html.bak`, `models.json`, `omniroute_models.json`, `OMNIROUTE_*.md*`, `omniroute-hermes-mcp-config.yaml`, `READY_FOR_HERMES.md`, `scratch_storage.sqlite`, `skills-lock.json`, `test.txt`

## What Gets Preserved (Moved to /docs)

| Source | Destination | Reason |
|--------|-------------|--------|
| `digitallyDefined_CREDENTIAL_REG…` | `/docs/` | Credential registry |
| `fastapi/GOOGLE_CLOUD_AUDIT.md` | `/docs/` | GCP audit |
| `digitallydefined-os-backend/MIGRATION.md` | `/docs/` | Migration plan |
| `digitallydefined-os-backend/DEPRECATED.md` | `/docs/` | Deprecation notes |
| `digitallydefined-os-backend/supabase/MIGRATION_GUIDE.md` | `/docs/` | Supabase migration guide |

## Items Requiring Your Review Before Deletion

| Item | Why Review? |
|------|-------------|
| `workspace/` | Purpose unclear. No imports found. |
| `.env.local` (root) | May contain shared env vars. |
| `client_secret_*.json` | GCP credentials — verify still needed. |
| `openapi.yaml` (backend) | Empty file — placeholder or needed? |
| `kilo.json` (backend) | Editor config — referenced by anything? |

**Please review this plan and confirm approval before I proceed with any deletions.**
