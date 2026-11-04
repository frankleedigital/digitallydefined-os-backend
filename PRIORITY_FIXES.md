# PRIORITY_FIXES.md — Ordered by Revenue/User Impact

## Fix #1: Make AI Status Panel reflect actual architecture
**Problem:** Panel shows OmniRoute/AgentRouter/CheapInference as "DOWN" with red error text, making it look like the system is broken. In reality, Vertex/Gemini is the only production provider and it's healthy.

**Cause:** `providerHealth.js` runs all 4 provider checks on Vercel where only Vertex is configured. The panel renders all failures without distinguishing "not configured by design" from "broken."

**Files:** `digitallydefined-dashboard/src/pages/AIStatusPanel.jsx`, optionally `digitallydefined-os-backend/src/services/providerHealth.js`

**Fix:** Two options (both can coexist):
- Backend: have `checkAllProviders()` return a `configured: true/false` flag per provider based on whether env vars exist, and mark unconfigured providers differently from failed ones.
- Frontend: suppress or gray-out providers where `error` contains "not configured" — show them as "Not Enabled" instead of "DOWN."

**Risk:** Low — UI-only change, no backend logic affected.
**Expected outcome:** Dashboard shows Vertex/Gemini = Active/Healthy, other providers = "Not Enabled" (neutral, not alarming).

---

## Fix #2: Delete or rename stale `.env.local` in os-backend
**Problem:** `digitallydefined-os-backend/.env.local` overrides `OMNIROUTE_BASE_URL` to `https://ai.digitallydefined.online/v1` (dead URL) and `OMNIROUTE_API_KEY` to a key that returns 401 on the local container. If dotenv loads `.env.local` after `.env`, local development silently breaks OmniRoute.

**Cause:** Leftover from a prior public OmniRoute deployment that was decommissioned.

**Files:** `digitallydefined-os-backend/.env.local`

**Fix:** Delete the file or rename to `.env.local.DEAD`. The `.env` file already has the correct localhost config.

**Risk:** None — the values in `.env.local` point at dead infrastructure.
**Expected outcome:** Local development always picks up the working localhost config from `.env`.

---

## Fix #3: Consolidate OmniRoute API keys
**Problem:** Three different `OMNIROUTE_API_KEY` values across files (hashes don't match: `.env` = 3274dc6c, `.env.local` = b51d6a8e, `hermes .env` = c31fe03c). Only the `.env` key (`sk-954...`) authenticates against the running container.

**Cause:** Key was generated at container bootstrap; copies drifted as files were edited independently.

**Files:** `os-backend/.env`, `os-backend/.env.local`, `omniroute-hermes-mcp-config.yaml`, `~/.hermes/.env`, `digitallydefined-backend-clean/.env`

**Fix:**
1. Identify the correct key: `os-backend/.env` → `sk-954...` (verified 200 against container).
2. Update `~/.hermes/.env` to use the same key.
3. Delete keys from deprecated env files.
4. Document the single source of truth for the key.

**Risk:** Low — just credential alignment. Back up before changing.
**Expected outcome:** All local consumers (Hermes, FastAPI, scripts) use the same valid key.

---

## Fix #4: Set OmniRoute dashboard password
**Problem:** Container boots with `INITIAL_PASSWORD` unset → dashboard admin password = `CHANGEME`. Anyone on localhost can reach `http://localhost:20128/dashboard` and access the admin UI.

**Cause:** The container was run with `docker run` without setting the env var.

**Files:** Docker run command / a compose override

**Fix:** `docker exec omniroute sh -c 'echo "set password via admin API or restart with INITIAL_PASSWORD env var"'` — or stop + restart the container with `-e INITIAL_PASSWORD=<strong-password>`.

**Risk:** Medium — restarting the container temporarily interrupts local AI. Volume data persists.
**Expected outcome:** Dashboard admin secured.

---

## Fix #5: Clean up stale Cloudflare tunnel references
**Problem:** ~50 stale comments/docs reference "Cloudflare tunnel" on lines that describe ACTIVE env vars (e.g., `env.js:430` says OMNIROUTE_BASE_URL is a "Cloudflare tunnel" — it's actually localhost Docker). Misleading for any developer reading the code.

**Cause:** Tunnel was retired but comments weren't updated.

**Files:** `digitallydefined-os-backend/src/config/env.js:261,430`, `api/index.js:787`, `src/services/aiRouter.js:3`, various `.md` files

**Fix:** Replace "Cloudflare tunnel" references with "local Docker gateway" or remove the comment. Docs in `docs/archive/` and `OMNIROUTE_MIGRATION_*` can stay (they document the migration itself).

**Risk:** Zero — comment-only changes.
**Expected outcome:** Code comments match reality.

---

## Fix #6: Remove orphaned projects
**Problem:** `digitallydefined-os-workers` (Cloudflare Workers), `digitallydefined-backend-clean` (stub), root `supabase/` (retired) consume mental overhead and carry dead env files with stale credentials.

**Cause:** Migration residue — functionality consolidated into `os-backend`.

**Files:** Entire directories

**Fix:**
1. Move `digitallydefined-os-workers/` into `archive/`
2. Move `digitallydefined-backend-clean/` into `archive/`
3. Delete or archive root `supabase/` (canonical is `os-backend/supabase/`)
4. Clear API keys from all archived `.env` files

**Risk:** Low — confirmed zero inbound references from live code.
**Expected outcome:** Workspace contains only active projects.

---

## Fix #7: Back up OmniRoute volume
**Problem:** All 49 provider connections, model sync state, OAuth tokens, and call logs live in Docker volume `omniroute-recovery-20261011-152432`. Losing it means reconfiguring every provider from scratch.

**Cause:** Single point of truth with no backup.

**Files:** Docker volume → `/app/data/storage.sqlite` + supporting files

**Fix:** Schedule periodic `docker cp omniroute:/app/data ./omniroute-backup-$(date +%Y%m%d)` or mount the volume to a host directory that's backed up.

**Risk:** Zero for the backup itself.
**Expected outcome:** Recoverable OmniRoute state.
