# FILES_TO_REVIEW.md

**Generated:** 2026-10-19
**Workspace:** `c:\Users\frank\Documents\DigitallyDefinedClean`
**Purpose:** Files and folders requiring manual review before final delete/keep decision.
**STATUS:** PLAN ONLY — Do NOT delete anything yet.

---

## Items Requiring Review

| Path | Size | Reason for Review | Recommended Action |
|------|------|-------------------|-------------------|
| `workspace/` | ~unknown | Purpose unclear. No imports found from active projects. Investigate contents before deciding. | Open folder, inspect contents, decide keep/remove |
| `.env.local` (root) | 1,451 B | May contain shared env vars. Check if any active project imports or references it. | Read file, compare with project .env files, decide |
| `client_secret_2_630454335170-…` | 470 B | Google Cloud credentials. May be needed for GCP services (Vertex AI, etc.). | Verify if still used by backend or dashboard. Do NOT delete without confirmation. |
| `digitallyDefined_CREDENTIAL_REG…` | 11,310 B | Credential registry. Contains sensitive info. Move to `/docs/` but do not delete. | Move to `/docs/`, restrict access |
| `openapi.yaml` (in backend) | 0 bytes | Empty file. May be placeholder for future OpenAPI spec. | Decide whether to keep as placeholder or remove |
| `kilo.json` (in backend) | 831 B | Kito editor config. May be referenced by build tools. | Check if any build script references it |

---

## Review Checklist

Before approving deletion, verify:

1. [ ] Open `workspace/` — document what is inside, determine if any active project depends on it
2. [ ] Read `.env.local` at root — check for shared env vars not present in project .env files
3. [ ] Confirm `client_secret_*.json` is not referenced by any active backend code
4. [ ] Confirm `digitallyDefined_CREDENTIAL_REG…` contents are safely copied to `/docs/` before any removal
5. [ ] Verify `openapi.yaml` is truly empty and not needed by any deployment pipeline
6. [ ] Verify `kilo.json` is not referenced by any build script or CI config

---

## Decision Framework

| If the item... | Then... |
|----------------|---------|
| Is imported/referenced by any active project | KEEP |
| Is a credential needed for runtime (GCP, Supabase, etc.) | KEEP (but secure) |
| Is documentation that should be preserved | MOVE to `/docs/` |
| Is empty or a placeholder with no references | REMOVE |
| Purpose is unknown after inspection | REVIEW again or KEEP temporarily |
