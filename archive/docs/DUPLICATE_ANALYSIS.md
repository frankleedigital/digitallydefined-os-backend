# DUPLICATE_ANALYSIS — DigitallyDefinedClean

**Generated:** 2026-11-07 (read-only). Detection basis: folder-name scan (`find -maxdepth 3` for `digitallydefined-dashboard|digitallydefined-os-backend|digitallydefined-backend-clean|digitallydefined-website-clean|dashboard|backend`), root git gitlinks, in-file cross-references, and content inspection.

---

## 1. Duplicate folder trees

### D1. `digitallydefined-backend-clean` — top-level vs `archive/`
| Path | Contents | Keep? |
|---|---|---|
| `digitallydefined-backend-clean/` | `.env` (11 KB, live, 2026-10-21) + `LEGACY_INVENTORY.md` (22 KB). Root-repo **gitlink** (commit `bb998d5`) points here, but the folder no longer contains a nested `.git` — stale gitlink. | KEEP `.env` on disk only (re-home under `archive/` **outside any git tracking**); ARCHIVE `LEGACY_INVENTORY.md` |
| `archive/digitallydefined-backend-clean/` | Full pre-launch backend copy: `api/`, `src/`, `supabase/` (with its own `.temp` CLI link state), `.env`/`.env.example`/`.env.local`, `.vercel/`, `server.log/.err.log`, `fix_routes.cjs`, `MIGRATION.md` (~4,478 files incl. node_modules) | ARCHIVE — reference copy only; must NOT be a deploy source (its `supabase/.temp` links to the same production project `dijjlppdljpcgyoakdnq`) |

**Reason:** `digitallydefined-os-backend` (launch-readiness-fixes) is the production backend (dashboard base URL `digitallydefined-os-backend.vercel.app`). Both "backend-clean" trees are legacy. Risk note: **two trees linked to the same Supabase project** is the exact "deploys overwrite each other" failure documented in `supabase/RETIRED.md` — keep both inert.

### D2. `supabase/` — root vs `digitallydefined-os-backend/supabase/`
| Path | Contents | Keep? |
|---|---|---|
| Root `supabase/` | 5 functions (`content`, `omniroute`, `quiz-roadmap`, `quiz-submit`, `reputation`) + 5 `_shared` modules + `config.toml` + `.temp.retired-20261009` + `RETIRED.md` | ARCHIVE (move to `archive/supabase-retired-20261009/`; the CLI link state is already renamed/neutralized so it cannot deploy) |
| `digitallydefined-os-backend/supabase/` | 15 functions + 32 `_shared` modules + `deno.json`/`deno.lock` | **KEEP — canonical deploy tree** |

**Reason:** `RETIRED.md` (2026-10-09) documents the consolidation of the root tree into the backend repo. The root copy is historical reference only.

### D3. `workspace/buzz-agents/` vs `archive/buzz-agents/`
| Path | Agents | Keep? |
|---|---|---|
| `workspace/buzz-agents/` (22 files) | content-repurposer, digital-superpower-quiz, facebook-community-agent, json-schema-generator + shared `lib/` + `tailwind.config.js` | **KEEP (canonical active set)** |
| `archive/buzz-agents/` (20 files) | ai-rankand-rent-builder, digital-wealth-calculator, niche-keyword-discovery, reputation-intelligence, roadmap-generator | **MERGE into `workspace/buzz-agents/`** (agent names are disjoint — merge is additive, low risk), then archive the empty shell |

**Reason:** product catalog `implementation` fields point at `workspace/buzz-agents`; the archive set is the older generation. No name collisions, so merging loses nothing.

### D4. `dist/` — root vs `digital-products/dist/`
| Path | Contents | Keep? |
|---|---|---|
| Root `dist/` (22 files) | Old Vite bundle: `QuizPage`, `RoadmapTool`, `ToolsPage`, `ResultsPage`, `backend-*.js` chunks (2026-09-12) | DELETE CANDIDATE (stale dashboard-era build; regenerative) |
| `digital-products/dist/` (3 files) | `index.html` + `index-CQjvFOIw.js` (209 KB) + `puter-CDIc_3kb.js` (513 KB) — the current launcher build | **KEEP — this is the sellable Gumroad bundle** |

**Reason:** only the products bundle is the actual sellable artifact; root `dist/` predates it and matches no current build config.

### D5. `digital-products/node_modules` vs committed `digitallydefined-os-workers/node_modules`
| Path | Status | Action |
|---|---|---|
| `digital-products/node_modules` (3,353 files) | Correctly **untracked** (commit `eeffbf`, 2026-10-20: "untrack node_modules, add .gitignore") | Keep on disk, stay out of git |
| `digitallydefined-os-workers/node_modules` (2,464 files) | **COMMITTED in root git** (root repo tracks them as normal files) | `git rm -r --cached` + `.gitignore` entry |

---

## 2. Duplicated code modules (in-repo)

### D6. Dashboard API client — `src/services/api.js` vs `src/lib/api-client.js`
Both define the same canonical base URL (`https://digitallydefined-os-backend.vercel.app`) and retry/timeout wrappers; `lib/api-client.js` additionally rewrites retired `digitallydefined-backend-clean.vercel.app` aliases. Two competing "single source of truth" layers.
→ **Keep `src/lib/api-client.js`** (carries the legacy rewrite + standardized ApiError), delete `src/services/api.js` and re-point `components/quiz/*` imports (the only consumers of `services/api.js`). Risk: Medium (all API traffic).

### D7. Dashboard Notion helpers — `src/lib/notion.js` vs `src/lib/notionArchitect.js` vs `src/utils/notionMapper.js`
Three Notion modules; `notionArchitect.js` mirrors the backend's `_shared/notion-architect.ts`.
→ Triage: keep the one(s) actually imported (verify import graph), archive the rest. Risk: Low–Medium.

### D8. Dashboard tab pages — `src/pages/tabs/{AntigravityTab,NotionTab}.jsx` vs `src/pages/{AntigravityPage,NotionTab}.jsx`
The `tabs/` variants have 0 imports; `DashboardPage.jsx` imports the non-tab variants.
→ **Delete `src/pages/tabs/*`** (including `placeholder.txt`). Risk: Low.

### D9. os-backend `lib/` vs `supabase/functions/_shared/`
Legacy JS helpers in `lib/` (publishers, notion-client `.mjs`/`.js` pairs, `llmClient.js`, `hermesMcp.js`…) duplicate the TypeScript `_shared/` modules that the edge functions actually import.
→ Keep `_shared/` as canonical; delete or move `lib/` duplicates. Risk: Medium (verify nothing in `api/index.js` still imports `lib/` — it does for `lib/antigravity.js` and `lib/hermesIntelligence.js`, so those specific files must stay or be ported).

### D10. Orphaned legacy Vercel route folders — `api/{quiz,intelligence,models,set-model,active-model,business-partner}/`
Pre-unification route handlers superseded by the unified `api/index.js` dispatcher (which even notes the businessPartner handler "canonical" location is `src/routes/businessPartner.js`).
→ **Delete only after confirming the Vercel deployment no longer resolves these paths** (Vercel matches most-specific paths first). Risk: High until verified; Low after.

### D11. `index.html` vs `index.html.bak` (root)
Root landing page + a stale 2026-08-26 backup (differs by ~33 bytes).
→ Keep `index.html`; delete `.bak`. Risk: Low.

### D12. `src/routes/_original-index-backup.js` (os-backend)
Explicit backup of the original index route.
→ Delete. Risk: Low.

---

## 3. Duplicate content / config files

| Duplication | Locations | Resolution |
|---|---|---|
| `.env` files | root `.env.local`, `digitallydefined-backend-clean/.env`, `archive/digitallydefined-backend-clean/{.env,.env.example,.env.local}`, os-backend `fastapi/.env.example` | Single source of truth: os-backend `.env` (production). All others frozen reference copies. Never commit any. |
| OmniRoute model dumps | root `models.json` (2 MB) + `omniroute_models.json` (2.2 MB) + `omniroute-hermes-mcp-config.yaml` | Generated output — delete both JSON dumps; archive the yaml. |
| Hermes skill docs | `Hermes/skills/digital-wealth-tools/` (3 files) vs agent skills in `.agents/` | Consolidate under one `archive/hermes-skills/`; neither is a runtime dependency. |
| `kilo.json` | root (in archive copy) + os-backend | Editor/kilo config; keep only the os-backend one. |

---

## 4. Git-level duplication (root repo)

- Root repo (branch `master`) tracks **gitlinks** for `digitallydefined-dashboard` (`fed221ea`), `digitallydefined-os-backend` (`33d9513`), `digital-products` (`eefdfff`), `digitallydefined-backend-clean` (`bb998d5`) — **without a `.gitmodules`** (mode 160000 entries, no submodule metadata). Consequence: `git clone` of the root repo yields empty subfolders; the `bb998d5` gitlink is stale (folder no longer contains a `.git`).
- Root repo also tracks 2,464 `os-workers/node_modules` files and `.tmp-gw.{err,log}` — both should be untracked.
- Each of the 4 sub-repos is a full independent git repo with its own history (branches: dashboard/os-backend on `launch-readiness-fixes` + `main`; products on master-equivalent).

**Recommendation (fix, don't delete):** either (a) formalize the gitlinks with a `.gitmodules`, or (b) convert the root repo to a plain container repo (untrack gitlinks, keep sub-repos as independent clones). For launch simplicity, option (b) is cheaper.
