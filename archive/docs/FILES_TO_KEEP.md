# FILES_TO_KEEP.md

**Generated:** 2026-10-19
**Workspace:** `c:\Users\frank\Documents\DigitallyDefinedClean`
**Purpose:** Consolidated list of all files and folders to keep after cleanup.
**STATUS:** PLAN ONLY — Do NOT delete anything yet.

## Root Level (Keep)

| Path | Reason |
|------|--------|
| `.gitignore` | Workspace git ignore rules |
| `digital-products/` | Core project #3 — Digital Products Store |
| `digitallydefined-dashboard/` | Core project #1 — Dashboard |
| `digitallydefined-os-backend/` | Core project #2 — TRUE BACKEND |
| `.env.local` | Root-level env (review before finalizing) |
| `client_secret_2_630454335170-…` | Google Cloud credentials — do not delete |
| `digitallyDefined_CREDENTIAL_REG…` | Credential registry — move to `/docs`, do not delete |

## digital-products/ (Keep All Source)

| Path | Reason |
|------|--------|
| `package.json` | Project config + dependencies |
| `vite.config.js` | Build config |
| `index.html` | Entry HTML |
| `src/App.jsx` | App root + routing |
| `src/main.jsx` | React entrypoint |

## digitallydefined-dashboard/ (Keep All Source)

| Path | Reason |
|------|--------|
| `package.json` | Project config + dependencies |
| `vite.config.js` | Build config |
| `vercel.json` | Vercel deployment config |
| `.env` | Runtime env vars (VITE_API_URL, VITE_SUPABASE_URL, VITE_DASHBOARD_API_KEY, etc.) |
| `.env.local` | Local env overrides |
| `.env.example` | Env template |
| `index.html` | Entry HTML |
| `tailwind.config.js` | Tailwind config |
| `postcss.config.js` | PostCSS config |
| `kilo.json` | Kilo config |
| `supabase-redirect.txt` | Supabase redirect config |
| `src/App.jsx` | App root |
| `src/main.jsx` | React entrypoint |
| `src/config.js` | Brand/config |
| `src/configMerge.js` | Config merge |
| `src/index.css` | Global styles |
| `src/theme.js` | Theme |
| `src/lib/supabase-edge.js` | Backend API client (calls os-backend) |
| `src/lib/supabase.js` | Supabase client |
| `src/lib/api.js` | API client |
| `src/lib/hermes.js` | Hermes AI client |
| `src/lib/notion.js` | Notion integration |
| `src/lib/notionArchitect.js` | Notion Architect contract |
| `src/lib/notionConfig.js` | Notion config |
| `src/lib/premium.js` | Gumroad license verification |
| `src/lib/agentRegistry.js` | Agent registry |
| `src/lib/analytics.js` | Analytics |
| `src/lib/auth.js` | Auth |
| `src/lib/businessPartnerReply.js` | Business partner replies |
| `src/lib/modelSelector.js` | AI model selector |
| `src/lib/affiliateExport.js` | Affiliate export |
| `src/lib/integrations.js` | Integrations |
| `src/lib/normalizer.js` | Normalizer |
| `src/lib/social.js` | Social |
| `src/lib/email.js` | Email |
| `src/lib/google-analytics.js` | Google Analytics |
| `src/hooks/useIntegrationConnect.js` | Integration connect hook |
| `src/hooks/integrations/` | Integration hooks |
| `src/hooks/useIntegrations.js` | Integrations hook |
| `src/hooks/useSync.js` | Sync hook |
| `src/pages/` | All page components |
| `src/components/` | All UI components |
| `src/components/intelligence/` | Intelligence components |
| `src/components/ui/` | UI primitives |
| `src/brand/` | Brand assets |
| `src/styles/` | Styles |
| `src/utils/` | Utilities |
| `src/context/` | Context providers |

## digitallydefined-os-backend/ (Keep All Source)

| Path | Reason |
|------|--------|
| `package.json` | Project config + dependencies |
| `vercel.json` | Vercel deployment config |
| `server.ts` | Local Deno server wrapper for Hermes MCP |
| `api/index.js` | Unified API handler (all 40+ actions) |
| `api/hermes-mcp.js` | Hermes MCP endpoint |
| `api/health.js` | Health check |
| `api/active-model/index.js` | Active model endpoint |
| `api/business-partner/index.js` | Business partner endpoint |
| `api/fastapi/[[...path]]/index.js` | FastAPI proxy |
| `api/intelligence/index.js` | Intelligence endpoint |
| `api/models/index.js` | Models endpoint |
| `api/quiz/index.js` | Quiz endpoint |
| `api/set-model/index.js` | Set model endpoint |
| `src/index.js` | Local Express entrypoint |
| `src/routes/` | 18 route handler modules |
| `src/services/` | 12 service modules |
| `src/agents/` | 7 AI agent modules |
| `src/middleware/` | auth, cors, rate-limit |
| `src/schemas/` | 12 schema modules |
| `src/workflows/` | 3 workflow modules |
| `src/utils/` | 6 utility modules |
| `src/config/` | 4 config modules |
| `src/types/` | Type definitions |
| `fastapi/app/main.py` | FastAPI entrypoint |
| `fastapi/app/config.py` | FastAPI config |
| `fastapi/app/deps.py` | FastAPI dependencies |
| `fastapi/app/llm.py` | OmniRoute client |
| `fastapi/app/notion_architect.py` | Notion OS contract |
| `fastapi/app/storage.py` | Storage |
| `fastapi/app/knowledge.py` | Knowledge |
| `fastapi/app/routers/` | 11 router modules |
| `fastapi/app/services/` | 9 service modules |
| `fastapi/app/models/` | 12 model modules |
| `fastapi/app/data/` | Data files |
| `fastapi/pyproject.toml` | Python dependencies |
| `fastapi/requirements.txt` | Python requirements |
| `fastapi/Dockerfile` | Docker build |
| `fastapi/.env.example` | FastAPI env template |
| `fastapi/start.sh` | Start script |
| `fastapi/GOOGLE_CLOUD_AUDIT.md` | GCP audit doc (move to /docs) |
| `fastapi/README.md` | FastAPI readme |
| `supabase/functions/hermes/` | Hermes edge function |
| `supabase/functions/notion-sync/` | Notion sync edge function |
| `supabase/functions/quiz-roadmap/` | Quiz-roadmap edge function |
| `supabase/functions/sellable/` | Sellable edge function |
| `supabase/functions/sync/` | Sync edge function |
| `supabase/functions/_shared/` | Shared edge function code |
| `supabase/migrations/` | SQL migrations |
| `supabase/config.toml` | Supabase config |
| `supabase/deno.json` | Deno config |
| `supabase/deno.lock` | Deno lock |
| `agents/` | Standalone agent modules |
| `ai/` | AI modules |
| `data/` | Data files |
| `lib/` | Library modules |
| `.env` | Backend env vars |
| `.env.example` | Backend env template |
| `MIGRATION.md` | Migration doc (move to /docs) |
| `DEPRECATED.md` | Deprecation doc (move to /docs) |
| `node_modules/` | Runtime dependencies (do not commit to git) |
| `kilo.json` | Kilo config |
| `openapi.yaml` | OpenAPI spec |

| `public/` | Static assets |
| `node_modules/` | Runtime dependencies (do not commit to git) |

| `src/components/` | All UI components |
| `src/lib/` | Core libraries (productCatalog, products, puter-cloud, saveState, usePuterCloud) |
| `src/agents/` | Product agents |
| `src/calculators/` | Calculators |
| `src/tools/` | Tools |
| `public/` | Static assets |
| `node_modules/` | Runtime dependencies (do not commit to git) |
