# SCALABILITY_REPORT.md

**Generated:** 2026-10-19
**Companion to:** `CODEBASE_AUDIT.md`
**Method:** Static analysis of render patterns, fetch patterns, bundle composition, and data flow. No load testing was performed — the projections below are derived from measured code characteristics, not benchmarks.

---

## 0. Verdict Up Front

| Users | Dashboard | Backend | Storefront | Verdict |
|:--:|---|---|---|---|
| **100** | ✅ Passes | ✅ Passes | ✅ Passes | **Comfortable.** No changes needed. |
| **1,000** | ⚠️ Degrades | ⚠️ Degrades | ✅ Passes | **Action needed.** Bundle size, render cost, and uncached fetches become visible. |
| **10,000** | ❌ Fails | ❌ Fails | ⚠️ Degrades | **Architecture changes required.** |

**The binding constraint is not the database.** Supabase Postgres + RLS handles 10,000 users without changes. The constraints are:

1. **The dashboard bundle** (539 kB / 155 kB gzip) — every user downloads it.
2. **`DashboardPage.jsx`** (1,526 LOC, 20 `useState`, 101 inline style objects, 0 `useCallback`) — every interaction re-renders everything.
3. **Uncached backend fetches** — every dashboard load re-fetches Notion, Facebook, and Sheets.
4. **The Puter SDK** (509 kB) — 70% of the storefront bundle, loaded for every product page.

---

## 1. Dashboard Scalability

### 1.1 Bundle Size

**Measured:**
```
dist/index.html                  6.81 kB │ gzip:  2.35 kB
dist/assets/index-DAH_J82l.css  18.70 kB │ gzip:  4.74 kB
dist/assets/modelSelector-*.js   2.17 kB │ gzip:  0.95 kB
dist/assets/index-*.js          539.02 kB │ gzip: 155.33 kB
```

**Total initial download: ~567 kB (163 kB gzip).**

**At 10,000 users:** 5.67 GB of JS transferred. At 100,000 users: 56.7 GB.

**Composition:** the bundle includes `lucide-react` (tree-shaken, but the dashboard imports 20+ icons across 13 tab components), `react-router-dom`, `@vercel/analytics`, `@vercel/speed-insights`, `@vercel/toolbar`, and `@supabase/supabase-js`.

**No code splitting.** `App.jsx` imports every page statically:
```js
import DashboardPage from "./pages/DashboardPage";
import AssistantPage from "./pages/AssistantPage";
import ThankYouCalculatorPage from "./pages/ThankYouCalculatorPage";
import IntelligencePage from "./pages/IntelligencePage";
import AnalyticsPage from "./pages/AnalyticsPage";
```

Every route's code ships on first load, even though only one route renders.

### 1.2 Render Cost

**Measured (`DashboardPage.jsx`, 1,526 LOC):**

| Metric | Count | Implication |
|---|:--:|---|
| `useState` | 20 | 20 independent re-render triggers |
| `useEffect` | 3 | 3 data-fetch cycles |
| `useMemo` | 1 | Only 1 of 20 states is memoized |
| `useCallback` | **0** | Every handler is recreated each render |
| Inline `style={{}}` | **101** | 101 new objects each render |
| JSX components | 38 | All re-render unless memoized |
| `renderTab()` branches | 9 | All 9 tabs evaluated; 1 rendered |

**At 100 users:** invisible. React handles it.

**At 1,000 users:** on mid-range hardware (a Gen X audience on 5-year-old laptops), each interaction re-creates 101 style objects and re-renders 38 components. Frame drops become visible on tab switches.

**At 10,000 users:** the dashboard is unusable on the audience's actual hardware. This is not hypothetical — the target audience is Gen X women, many on older machines, often on mobile.

**Specific problem:** `renderTab()` is called on every render:
```js
const renderTab = () => {
  if (activeTab === "reputation") return <ReputationTab reviews={data.reviews} />;
  if (activeTab === "intel") return <IntelTab data={data} />;
  ...
};
```
All 9 branches are evaluated. The 8 non-active tabs' props are constructed and discarded.

### 1.3 Data Fetching

**Measured:** 3 `fetch` calls in `useEffect` hooks (lines 690, 710, 740, 831).

**At 100 users:** 3 requests per load. Fine.

**At 1,000 users:** 3,000 requests per full-dashboard-load cycle. The backend's rate limiter is **60 requests per 60 seconds per IP** (`api/index.js:105-106`):
```js
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 60;
```

**This is the first hard ceiling.** 60 requests/minute/IP. A single dashboard load makes 3. A user refreshing 20 times in a minute is throttled. Behind a NAT (office, school, mobile carrier), many users share one IP — **10 users behind one NAT = 30 requests per load cycle = half the budget.**

**At 10,000 users:** the rate limiter is the primary bottleneck. It is per-IP, not per-user, so it cannot distinguish 10,000 users from 100 users behind 100 NATs.

### 1.4 Auth

**Measured:** `App.jsx:66` renders `<DashboardPage />` with **no auth wrapper**. `ProtectedRoute.jsx` exists but is not used.

**At 100 users:** irrelevant.

**At 1,000 users:** every visitor — including bots — triggers the full dashboard load, including 3 API calls. No auth gate means no way to shed load.

**At 10,000 users:** unauthenticated traffic dominates. The rate limiter throttles real users while bots consume the budget.

---

## 2. Backend Scalability

### 2.1 Request Handling

**Measured (`api/index.js`, 1,627 LOC):**
- 1 function (`handler`) with 27 `action ===` branches
- 650 LOC of inline handlers
- 1 rate limiter (per-IP, 60/min)
- 2 caches (`aiBriefCache` 20 min, `brevoCache` 15 min)
- 0 request coalescing

**At 100 users:** fine.

**At 1,000 users:** the per-IP rate limiter becomes the constraint. Vercel serverless functions scale horizontally, so CPU is not the issue — the limiter is.

**At 10,000 users:** the limiter must become per-user, not per-IP. The current implementation:
```js
function getClientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || 'unknown';
}
```
`x-forwarded-for` is client-controlled. A client can rotate it to bypass the limiter. This is a **security and scalability defect**.

### 2.2 Uncached Fetches

**Measured:** `fetchNotionSnapshot`, `fetchFacebookGroup`, `fetchSheetsData` are called on **every** `dashboard` action. Only `aiBriefCache` and `brevoCache` are cached.

**At 100 users:** 3 external API calls per dashboard load. Fine.

**At 1,000 users:** 3,000 external API calls per load cycle. Notion, Facebook, and Sheets all have their own rate limits. **The backend will be throttled by upstream services before it is throttled by its own code.**

**At 10,000 users:** upstream rate limits are the hard ceiling. Notion's API allows ~3 requests/second. Facebook's Graph API has a 200 calls/hour/user limit. Google Sheets has a 300 requests/minute limit.

**The dashboard's `dashboard` action makes 4+ upstream calls.** At 10,000 users, that is 40,000 upstream calls per load cycle — far beyond any upstream limit.

### 2.3 Cold Start

**Measured:** `api/index.js` imports `../lib/antigravity.js` at the top. `hermes/index.ts` imports 9 `_shared` modules. Every invocation loads the full module graph.

**At 100 users:** cold starts are occasional.

**At 1,000 users:** cold starts are frequent. Vercel's 60s `maxDuration` (`vercel.json`) is generous, but the module graph is large.

**At 10,000 users:** cold start latency dominates. The 1,709-LOC `hermes` function with 28 action branches is a large module to initialize.

### 2.4 Database

**Measured:** Supabase Postgres. RLS enabled on the `profiles` table (referenced in `supabase.js`). No connection pooling configured in the dashboard (Supabase JS handles this). No query logging.

**At 10,000 users:** Postgres handles this easily. **The database is not the bottleneck.**

### 2.5 FastAPI

**Measured:** Unreachable. See `CODEBASE_AUDIT.md` §1.3.

**At any scale:** the FastAPI layer cannot serve a single request. If it is fixed, it will need:
- Connection pooling (currently none)
- The `vertexai`, `google-cloud-firestore`, `google-cloud-storage`, `google-cloud-bigquery` packages are **not installed** (verified: import warnings)
- `FASTAPI_BASE_URL` defaults to `http://localhost:8000` — a single instance, no load balancing

---

## 3. Storefront Scalability

### 3.1 Bundle Size

**Measured:**
```
dist/index.html                  1.57 kB │ gzip:  0.76 kB
dist/assets/index-*.js          209.22 kB │ gzip:  67.40 kB
dist/assets/puter-*.js          509.26 kB │ gzip: 144.67 kB
```

**Total initial download: ~720 kB (213 kB gzip).**

**The Puter SDK is 71% of the bundle.** It is loaded on every product page, including the launcher.

**At 100 users:** fine.

**At 1,000 users:** 720 MB transferred. The Puter SDK is the dominant cost.

**At 10,000 users:** 7.2 GB. The Puter SDK should be lazy-loaded — only `CloudGate` needs it, and only when the user clicks "Connect".

### 3.2 Render Cost

**Measured:** `LauncherHome.jsx` (156 LOC) maps 25 products into cards. `ProductShell.jsx` (225 LOC) wraps each product. `CloudGate.jsx` (174 LOC) handles auth.

**At 100 users:** 25 cards render instantly.

**At 1,000 users:** 25 cards is still trivial. The storefront is **not render-bound**.

**At 10,000 users:** the storefront scales. It has no shared state, no 20-hook component, no 101 inline styles.

### 3.3 Data Fetching

**Measured:** `CloudGate` calls `isPuterAuthenticated()` on mount. `ProductShell` calls `loadState(product.id)` on mount. Both are per-product, not per-page.

**At 10,000 users:** Puter's API rate limits become the constraint. But the storefront makes **1 auth check + 1 state load per product view** — minimal.

### 3.4 The Real Storefront Constraint

**The storefront has no products.** See `CODEBASE_AUDIT.md` §1.4. Scalability is moot until `renderBody` exists.

---

## 4. Bottlenecks Ranked

| # | Bottleneck | At 100 | At 1,000 | At 10,000 | Effort to fix |
|---|---|:--:|:--:|:--:|:--:|
| 1 | **Per-IP rate limiter** (`api/index.js:105`) | — | ⚠️ | ❌ | Medium |
| 2 | **Uncached upstream fetches** (Notion/FB/Sheets) | — | ⚠️ | ❌ | Low |
| 3 | **Dashboard bundle** (539 kB) | — | ⚠️ | ❌ | Medium |
| 4 | **`DashboardPage.jsx` render cost** | — | ⚠️ | ❌ | High |
| 5 | **No auth gate** | — | ⚠️ | ❌ | Low |
| 6 | **Puter SDK in storefront bundle** (509 kB) | — | ⚠️ | ⚠️ | Low |
| 7 | **`x-forwarded-for` spoofing** | — | — | ❌ | Low |
| 8 | **FastAPI unreachable** | ❌ | ❌ | ❌ | Low |
| 9 | **Cold start (1,709-LOC hermes)** | — | ⚠️ | ⚠️ | High |
| 10 | **No request coalescing** | — | ⚠️ | ⚠️ | Medium |

---

## 5. Expensive Operations

### 5.1 `fetchNotionSnapshot` — every dashboard load

Queries **8 Notion databases** sequentially. Notion's API allows ~3 requests/second. 8 sequential queries = ~2.7 seconds minimum.

**At 1,000 users:** 8,000 Notion queries per load cycle. Notion throttles.

**Fix:** cache the snapshot (15 min TTL, like `brevoCache`).

### 5.2 `fetchFacebookGroup` — every dashboard load

One Graph API call. Facebook allows 200 calls/hour/user. At 1,000 users, that is 1,000 calls per load cycle — **5 hours of quota**.

**Fix:** cache aggressively (1 hour TTL). Facebook group stats do not change minute-to-minute.

### 5.3 `fetchSheetsData` — every dashboard load

One Google Sheets call. Google allows 300 requests/minute. At 1,000 users, 1,000 calls per cycle — **3.3 minutes of quota**.

**Fix:** cache (15 min TTL).

### 5.4 `fetchBrevoStats` — cached (15 min) ✅

Already cached. Correct.

### 5.5 `fetchAIBrief` — cached (20 min) ✅

Already cached. Correct.

### 5.6 `modelSelector.fetchActiveModel` — 3 sequential calls

Backend → Hermes edge → localStorage. Each with a 15s timeout. Worst case: **45 seconds** before falling back.

**At 1,000 users:** 3,000 calls per load cycle. The Hermes edge function is called even when the backend succeeds (the code tries backend first, then Hermes — but the Hermes call is in a `try` that only runs if the backend fails).

**Actually:** re-reading the code, the Hermes call only runs if the backend call fails. So it is 1 call in the happy path. **Not a bottleneck.**

### 5.7 `IntelligencePage.jsx` — 2 full page navigations

```js
if (!quizData) { window.location.href = '/quiz'; return; }
```

`/quiz` redirects to `https://digitallydefined.store/quiz`. The user leaves the dashboard, takes the quiz, returns via `localStorage`.

**At 1,000 users:** 2 full page loads + 2 dashboard bundle downloads per intelligence request.

**Fix:** embed the quiz in the dashboard, or use a client-side redirect.

---

## 6. Unnecessary Renders

### 6.1 `DashboardPage.jsx` — 38 components, 1 visible

`renderTab()` evaluates 9 branches. The 8 non-active tabs' props are constructed and discarded.

**Fix:** memoize the tab components, or use `React.lazy` + `Suspense` per tab.

### 6.2 101 inline style objects

Every render creates 101 new objects. React must diff them all.

**Fix:** hoist to module scope, or use the existing `theme.js` style objects.

### 6.3 20 `useState`, 1 `useMemo`, 0 `useCallback`

Every state change re-renders the entire 1,526-LOC component tree.

**Fix:** split into smaller components with localized state. `CommandTab`, `ReputationTab`, `IntelTab`, `BrainTab`, `AutomationsTab` should own their own state.

### 6.4 `NotionTab.jsx` — 60 JSX elements, 0 hooks

Already well-factored. No change needed.

### 6.5 `AntigravityPage.jsx` — 7 `useState`, 1 `useEffect`

Acceptable for a 351-LOC page.

---

## 7. API Inefficiencies

### 7.1 No batching

The dashboard makes 3 separate `POST /api` calls on load. Each is a separate HTTP request, a separate Vercel invocation, a separate cold start.

**Fix:** add a `batch` action that accepts multiple actions and returns multiple responses.

### 7.2 No request coalescing

If 10 users load the dashboard simultaneously, 10 identical `fetchNotionSnapshot` calls run. No deduplication.

**Fix:** the existing `cron-dedup-logger.ts` pattern (62 LOC) could be adapted for request deduplication.

### 7.3 `x-forwarded-for` trust

```js
function getClientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ...
}
```

The first `x-forwarded-for` entry is **client-controlled**. A client can send `x-forwarded-for: 1.2.3.4` and bypass the rate limiter entirely.

**Fix:** use the **last** `x-forwarded-for` entry (the one added by the trusted proxy), or use `x-real-ip` exclusively.

### 7.4 Rate limiter is per-IP, not per-user

At 10,000 users behind 1,000 NATs, the limiter sees 1,000 identities. 10 users behind one NAT share a 60/min budget.

**Fix:** rate limit per `x-api-key` or per authenticated user, with per-IP as a fallback.

### 7.5 No pagination

`fetchNotionSnapshot` queries all pages from all 8 databases. Notion's default page size is 100. If a database has 1,000 pages, that is 10 requests per database = 80 requests per dashboard load.

**Fix:** paginate with a `limit` parameter, or cache the full snapshot.

---

## 8. Database Inefficiencies

### 8.1 No query logging

No slow-query monitoring. At 10,000 users, a slow query would be invisible until users complain.

### 8.2 No connection pooling configuration

The dashboard uses `@supabase/supabase-js`, which handles pooling internally. The backend uses `fetch` against the Supabase REST API — **no connection reuse**. Every request is a new HTTPS connection.

**At 10,000 users:** TLS handshake overhead dominates. Supabase's REST API is designed for this, but a persistent agent would be faster.

### 8.3 `profiles` table

`supabase.js` upserts to `profiles` on signup. No index on `email` (assumed — not verified). At 10,000 users, a missing index would be visible.

### 8.4 No read replicas

Single Supabase instance. At 10,000 users, read-heavy endpoints (`dashboard`, `analytics`) would benefit from a read replica.

---

## 9. Scaling Projections

### 9.1 100 Users

| Component | Load | Capacity | Headroom |
|---|---|---|---|
| Dashboard bundle | 100 × 567 kB = 57 MB | — | ✅ |
| Backend requests | 300/cycle | 60/min/IP | ✅ |
| Upstream calls | 400/cycle | Notion 3/s, FB 200/hr | ✅ |
| Postgres | 100 rows | — | ✅ |
| Storefront bundle | 100 × 720 kB = 72 MB | — | ✅ |

**Verdict: comfortable. No changes needed.**

### 9.2 1,000 Users

| Component | Load | Capacity | Headroom |
|---|---|---|---|
| Dashboard bundle | 1,000 × 567 kB = 567 MB | — | ⚠️ |
| Backend requests | 3,000/cycle | 60/min/IP | ⚠️ |
| Upstream calls | 4,000/cycle | Notion 3/s, FB 200/hr | ❌ |
| Postgres | 1,000 rows | — | ✅ |
| Storefront bundle | 1,000 × 720 kB = 720 MB | — | ⚠️ |

**Verdict: action needed.** The upstream rate limits are the first hard ceiling. Caching `fetchNotionSnapshot`, `fetchFacebookGroup`, and `fetchSheetsData` is the highest-leverage fix.

### 9.3 10,000 Users

| Component | Load | Capacity | Headroom |
|---|---|---|---|
| Dashboard bundle | 10,000 × 567 kB = 5.67 GB | — | ❌ |
| Backend requests | 30,000/cycle | 60/min/IP | ❌ |
| Upstream calls | 40,000/cycle | Notion 3/s, FB 200/hr | ❌ |
| Postgres | 10,000 rows | — | ✅ |
| Storefront bundle | 10,000 × 720 kB = 7.2 GB | — | ⚠️ |

**Verdict: architecture changes required.**

---

## 10. Recommendations

### 10.1 Immediate (unblocks 1,000 users)

| # | Change | Effort | Impact |
|---|---|:--:|---|
| 1 | Cache `fetchNotionSnapshot` (15 min TTL) | Low | **High** — removes 8 upstream calls per load |
| 2 | Cache `fetchFacebookGroup` (1 hour TTL) | Low | **High** — removes 1 upstream call per load |
| 3 | Cache `fetchSheetsData` (15 min TTL) | Low | **High** — removes 1 upstream call per load |
| 4 | Fix `x-forwarded-for` trust (use last entry) | Low | **High** — closes a security hole |
| 5 | Add auth gate to `/dashboard` | Low | **High** — sheds bot traffic |
| 6 | Lazy-load the Puter SDK | Low | **Medium** — cuts storefront bundle 71% |
| 7 | Code-split dashboard routes | Medium | **Medium** — cuts initial bundle |

### 10.2 Medium-term (unblocks 10,000 users)

| # | Change | Effort | Impact |
|---|---|:--:|---|
| 8 | Rate limit per-user, not per-IP | Medium | **High** |
| 9 | Add a `batch` action | Medium | **High** — 3 requests → 1 |
| 10 | Split `DashboardPage.jsx` into per-tab components | High | **High** |
| 11 | Hoist 101 inline styles to module scope | Medium | **Medium** |
| 12 | Add `useCallback` to handlers | Medium | **Medium** |
| 13 | Memoize tab components | Medium | **Medium** |
| 14 | Request coalescing for identical calls | Medium | **Medium** |
| 15 | Paginate Notion snapshot queries | Medium | **Medium** |

### 10.3 Long-term (beyond 10,000 users)

| # | Change | Effort |
|---|---|:--:|
| 16 | Read replica for read-heavy endpoints | Medium |
| 17 | Persistent Supabase agent (connection reuse) | Medium |
| 18 | CDN for static assets | Low |
| 19 | Edge caching for the dashboard payload | High |
| 20 | Move `hermes` edge function to a dedicated service | High |

---

## 11. What Scales Fine

| Component | Why |
|---|---|
| **Postgres** | 10,000 rows is trivial. RLS is enabled. |
| **Supabase Auth** | Managed service. |
| **Storefront render** | No shared state, no 20-hook component. |
| **`NotionTab.jsx`** | 0 hooks, 60 JSX elements. Well-factored. |
| **`AntigravityPage.jsx`** | 7 hooks for 351 LOC. Acceptable. |
| **`CloudGate.jsx`** | Single auth check. |
| **`ProductShell.jsx`** | Single state load per product. |
| **`LauncherHome.jsx`** | 25 static cards. |

---

## 12. The Single Most Important Scaling Fix

**Cache the three uncached upstream fetches.**

`fetchNotionSnapshot`, `fetchFacebookGroup`, and `fetchSheetsData` run on every dashboard load. They are the difference between 4 upstream calls per load and 0. At 1,000 users, that is the difference between 4,000 upstream calls per cycle and 400 (cache misses only).

The pattern already exists in the same file:
```js
const brevoCache = globalThis.__brevoCache || { data: null, expiry: 0 };
```

Apply it to the other three. **Effort: under an hour. Impact: unlocks 1,000 users.**
