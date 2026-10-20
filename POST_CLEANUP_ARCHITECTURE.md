# POST_CLEANUP_ARCHITECTURE.md

**Generated:** 2026-10-19
**Status:** Cleanup executed per approved rules.

## 1. Active Projects

| Project | Role | Entry | Backend Dependency |
|---------|------|-------|--------------------|
| `digital-products/` | Gumroad digital products storefront (React + Vite) | `src/main.jsx` → `src/App.jsx` | Backend `license.verify` action |
| `digitallydefined-dashboard/` | Main dashboard (React + Vite + Tailwind + Supabase) | `src/main.jsx` → `src/App.jsx` | `VITE_API_URL=https://digitallydefined-os-backend.vercel.app` |
| `digitallydefined-os-backend/` | TRUE BACKEND (Node/Express + FastAPI + Supabase edge functions) | `api/index.js` (Vercel), `src/index.js` (local) | Supabase, OmniRoute, Brevo, Notion, Gumroad |

### /quiz Routing (fixed before deleting online-local)

- **Old behavior:** dashboard route `/quiz` redirected to `https://digitallydefined.store/quiz`; stale code comments claimed the quiz "lived in digitallydefined-online-local."
- **Verification:** No source file in `digital-products/`, `digitallydefined-dashboard/`, or `digitallydefined-os-backend/` imported anything from `digitallydefined-online-local/`. The redirect target is an external production URL, not the local folder.
- **Fix applied:** `digitallydefined-dashboard/src/App.jsx` comments updated to state the canonical quiz lives at `https://digitallydefined.store/quiz` (production site, not in this repo) and that `IntelligencePage` reads `dd-quiz-results` from localStorage and calls the backend `intelligence` action.
- **Replacement route:** `GET /quiz` (dashboard) → `302` redirect to `https://digitallydefined.store/quiz` → result returns via `dd-quiz-results` → `POST /api` action `intelligence` on `digitallydefined-os-backend`.
- **Then deleted:** `digitallydefined-online-local/` (~45,584 files, ~539 MB including its own node_modules) removed with `Remove-Item -Recurse -Force`.


## 3. Unmigrated Agents (KEPT in place)

Kept per cleanup rules at `workspace/buzz-agents/`:

| Agent | Purpose | Why Kept |
|-------|---------|----------|
| `content-repurposer/` | Transform one piece of content into email/blog/social/script formats | No equivalent anywhere in active projects |
| `json-schema-generator/` | Generate validated JSON schemas for tools | No equivalent anywhere in active projects |
| `facebook-community-agent/` | Analyze Facebook Community (trendingTopics, memberNeeds, healthScore, riskAlerts, digest) | Only partially migrated (backend has basic `fetchFacebookGroup()` stats, not the full analysis agent) |
| `digital-superpower-quiz/` | 7-question personality quiz → Builder/Creator/Educator/Strategist/Connector | Core logic migrated to backend `quiz-submit`/`quiz.complete`, but left in place pending dashboard quiz-flow confirmation |
| `lib/` (`anti-gravity.js`, `omniroute.js`, `supabase.js`, `validator.js`) | Shared OmniRoute/Supabase/AntiGravity/validation helpers referenced by buzz agents via `import ... from '../lib/...'` | Moved to archive would break imports of the KEEP agents; backend has its own equivalents (`os-backend/lib/antigravity.js`, `fastapi/app/llm.py`, `supabase/functions/_shared/omniroute.ts`, `@supabase/supabase-js`) |
| `tailwind.config.js` | Shared Tailwind brand tokens | Referenced by buzz agent tooling |

## 4. Remaining Technical Debt

1. **Dashboard quiz flow:** `/quiz` redirects to the external production site. If that site is ever decommissioned, the dashboard needs its own quiz UI or a direct call to the backend `quiz.complete` / `quiz-submit` pipeline.
2. **Content repurposer has no backend route:** `content-repurposer` and `json-schema-generator` have no backend equivalents. If needed as products, add backend actions (e.g. `content.repurpose`, `schema.generate`) mirroring the existing `/niche/score`, `/rank-rent/analyze`, `/wealth/calculate` pattern.
3. **Facebook community agent incomplete:** backend only fetches group stats (`fetchFacebookGroup()`); full trending/needs/health/risk analysis from the buzz agent was never ported.
4. **`workspace/` still exists:** contains only `buzz-agents/` (3 KEEP agents + `digital-superpower-quiz` + shared `lib/` + `tailwind.config.js`). Once the KEEP agents are migrated or promoted into `digital-products/` or the backend, `workspace/` can be removed.
5. **Archived agents still on disk:** `archive/buzz-agents/` holds the 5 superseded agents as reference. Safe to delete after backend routes (`/rank-rent/analyze`, `/wealth/calculate`, `/niche/score`, `/roadmap/generate`, `reputation` edge function) are verified in production.

## 2. Archived Projects

| Location | Contents | Reason |
|----------|----------|--------|
| `archive/buzz-agents/` | `ai-rankand-rent-builder/`, `digital-wealth-calculator/`, `niche-keyword-discovery/`, `reputation-intelligence/`, `roadmap-generator/` (each with agent.js, prompt.md, README.md, schema.json) | Backend equivalents exist; kept as reference |
| `archive/digitallydefined-backend-clean/` (pre-existing) | Legacy backend-clean shell | Pre-existing archive, untouched |
| `archive/digitallydefined-website-clean/` (pre-existing) | Legacy website-clean shell | Pre-existing archive, untouched |
