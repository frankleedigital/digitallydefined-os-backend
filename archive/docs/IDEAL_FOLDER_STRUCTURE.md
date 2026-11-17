# IDEAL_FOLDER_STRUCTURE — DigitallyDefinedClean

**Generated:** 2026-11-07. Target structure after cleanup; every current item mapped to its destination.

```
DigitallyDefinedClean/
├── dashboard/                ← digitallydefined-dashboard/ (rename optional; keep repo name for Vercel/git)
│   ├── src/                  ← all current src (after: delete pages/tabs/*, orphan components,
│   │   │                        merge services/api.js into lib/api-client.js, drop unused deps)
│   │   ├── App.jsx           ← single route source (fix the dead /store redirect)
│   │   ├── pages/  components/  context/  hooks/  lib/  services/  quiz/  brand/
│   ├── index.html, vite.config, package.json, vercel.json
│   └── .git                  ← branch launch-readiness-fixes
│
├── backend/                  ← digitallydefined-os-backend/
│   ├── supabase/functions/   ← CANONICAL deploy tree: 15 functions + _shared/ (32 modules)
│   ├── api/                  ← keep: index.js (unified handler), health.js, hermes-mcp.js,
│   │                           ← optional: fastapi/ (only while Python service runs)
│   │                           ← remove after verify: quiz/, intelligence/, models/,
│   │                             set-model/, active-model/, business-partner/ (orphaned)
│   ├── src/                  ← local dev mirror + dispatcher (delete routes/_original-index-backup.js)
│   ├── fastapi/  vercel.json  package.json  supabase-schema.sql
│   └── .git                  ← branch launch-readiness-fixes
│
├── digital-products/         ← digital-products/ (no rename)
│   ├── src/ (App, LauncherHome, ProductShell, CloudGate, lib/products.js 25-product catalog)
│   ├── dist/                 ← SELLABLE BUNDLE (Gumroad upload source) — protect, never stale-delete
│   ├── PRODUCT DOCS (DIGITAL_PRODUCT_AUDIT.md, STORE_PRODUCT_ROADMAP.md, FUNNEL_ARCHITECTURE.md,
│   │   EMAIL_NURTURE_SYSTEM.md, FREE_LEAD_MAGNET_STRATEGY.md, STORE_LEAD_MAGNET_ASSETS.md,
│   │   PRODUCT_FRAMEWORKS.md, FAST_CASH_PRODUCTS.md, IMPLEMENTATION_PRIORITIES.md)
│   └── .git
│
├── docs/                     ← KEEP the active subset only:
│   ├── API.md  ARCHITECTURE.md  DEPLOYMENT_STATE.md  RUNBOOKS.md
│   ├── UNIFIED_DEPLOYMENT_CHECKLIST.md  supabase-auth-redirects.md
│   ├── SELL_TOOLS_AS_STANDALONE_STRATEGY.md  HERMES_EDGE_FUNCTIONS_SETUP.md
│   ├── PRODUCTION_READINESS_AUDIT.md  FIRST_DOLLAR_ROADMAP.md   ← moved here from root
│   ├── credential-registry.md         ← moved here from root (digitallyDefined_CREDENTIAL_REGISTRY.md)
│   └── archive/  hermes-mcp-archive/  ← current docs/archive + docs/hermes-mcp-archive stay
│
├── buzz/                     ← workspace/buzz-agents/  +  archive/buzz-agents/ (merged, additive)
│   └── (content-repurposer, digital-superpower-quiz, facebook-community-agent,
│       json-schema-generator, ai-rankand-rent-builder, digital-wealth-calculator,
│       niche-keyword-discovery, reputation-intelligence, roadmap-generator, lib/)
│
├── secrets/                  ← OUTSIDE GIT (enforce via .gitignore; keep on disk only):
│   ├── .env.local            ← root env (gitignored pattern .env* already covers it)
│   ├── client_secret_*.json  ← Google OAuth
│   └── backend-env/          ← frozen copies of digitallydefined-backend-clean/.env +
│                               archive/digitallydefined-backend-clean/.env* (reference only)
│
└── archive/                  ← everything else, inert, reference-only:
    ├── reports/              ← 81 root *.md audit reports + audit_*.py/json/txt + SAFE_TO_DELETE.md
    │                              + FILES_TO_*.md + exec-migration.js(.bak) + _*.py scratch
    ├── scripts/              ← root scripts/ (buzz relay, keypair, pipeline) + _archive/_inv/_validate/dumpkeys.py
    ├── legacy/
    │   ├── os-workers/       ← 45 source files of the obsolete Cloudflare Workers app (node_modules untracked)
    │   ├── supabase-retired-20261009/  ← root supabase/ tree (incl. RETIRED.md; .temp already neutralized)
    │   ├── backend-clean-legacy/        ← archive/digitallydefined-backend-clean/ full copy (secrets frozen, untracked)
    │   ├── website-clean-legacy/        ← archive/digitallydefined-website-clean/ (has ARCHIVED.md)
    │   └── backend-clean-inventory.md   ← LEGACY_INVENTORY.md from the top-level stub
    ├── configs/              ← hima.toml, omniroute-hermes-mcp-config.yaml, skills-lock.json,
    │                              .agents/, Hermes/ (agent skill docs), models.json + omniroute_models.json
    │                              (model dumps: delete, not archive, if regenerated)
    └── scratch/              ← agentops.log, .tmp-gw.err/.log, _a…_t3.txt, test.txt,
                                   scratch_storage.sqlite, output/ (empty dirs), dist/ (root stale build),
                                   index.html.bak, .vercel/, .venv/ (rebuild on demand)
```

### Root-level keepers
- `.gitignore` (extend with: `digitallydefined-os-workers/node_modules/`, `.tmp-gw.*`, `*.sqlite`, `models.json`, `omniroute_models.json`, `agentops.log`)
- Root git repo: either formalize the 4 gitlinks with `.gitmodules` or convert the root to a plain container repo that **does not** track sub-repo contents (recommended for launch simplicity; untrack os-workers node_modules and `.tmp-gw.*` in the first commit).
- `index.html` (root landing page) — confirm whether it is the deployed `digitallydefined.online` entry (check the Vercel project settings); if the site now lives in a sub-repo, this file archives to `archive/`.

---

## What remains if rebuilt today "with only the files necessary to make money"

Minimum viable revenue set (≈ 500 files total, vs 1,127 non-dependency files today):

1. **`digital-products/dist/`** — the 3-file sellable bundle (index.html + 2 JS) + `index.html`/`vite.config.js`/`package.json`/`src/lib/products.js` so it can be rebuilt. *(Gumroad listings + Puter-based delivery.)*
2. **`digitallydefined-dashboard/`** full src (105 files) minus the 9 orphaned files — the quiz funnel (`/quiz` → `/quiz/results` → email capture) and the storefront/onboarding that converts.
3. **`digitallydefined-os-backend/supabase/functions/`** (15 functions + `_shared/`) + **`api/index.js`** + `vercel.json` — quiz scoring, the Hermes AI gateway, notion-sync, followup email, and sellable-asset checks. This is the entire revenue plumbing.
4. **`digital-products/` product docs** (10 `.md`) — what to sell, at what price, in what order (the funnel architecture + lead-magnet strategy).
5. **`docs/`** active subset (7 files) — deployment state, auth redirects, unified checklist, runbooks.
6. **`.env.local` + `client_secret_*.json`** — the keys that make all of it run (kept outside git).
7. **`workspace/buzz-agents/`** (22 files) — the live Buzz agent set that products reference.
8. **`FIRST_DOLLAR_ROADMAP.md`** — the sequencing plan for the revenue phase.

Everything else — 81 audit reports, 3 legacy repo copies, the retired Supabase tree, the obsolete Workers app, the Python venv, model-catalog dumps, gateway logs, scratch files, and 2 empty `.github` workflows — is history or bloat. None of it gates a sale.

**Bottom line:** the money runs on 3 repos (dashboard, os-backend supabase+api, digital-products dist) + their env keys + 11 strategy docs. That is the rebuild.
