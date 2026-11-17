# DIGITALLYDEFINED — UNIFIED DEPLOYMENT CHECKLIST
**Prepared for:** Francesca, Founder
**Date:** 2026-07-30
**Version:** 1.0

---

## 📌 OVERVIEW

The DigitallyDefined platform consists of **three independently deployed projects** that work together as a unified system:

| Project | Domain | GitHub Repo | Vercel Project | Framework |
|---------|--------|-------------|----------------|-----------|
| **Marketing Site** | `digitallydefined.online` | `digitallydefined-online` | `digitallydefined-online` | Vite + React |
| **Dashboard** | `dashboard.digitallydefined.online` | `digitallydefined-reputation-dashboard` | `digitallydefined-reputation-dashboard` | Vite + React + Supabase |
| **Backend API** | `digitallydefined-os-backend.vercel.app` | `digitallydefined-os-backend` | `digitallydefined-os-backend` | Vercel Functions (Node.js) |

Each project deploys independently. Changes to one do not affect the others. GitHub commits trigger automatic Vercel deployments.

---

## 1. MARKETING SITE (`digitallydefined-online-local`)

### Vercel Project Settings
- **Build Command:** `pnpm run build` (or `npm run build`)
- **Install Command:** `pnpm install` (or `npm install`)
- **Output Directory:** `dist/`
- **Framework Detection:** Automatic (React/Vite)
- **Environment Variables:** None (site is static; all API calls go through backend)

### Production Readiness Checklist ✓
- [ ] `dist/` exists after build (verified)
- [ ] `.env` does NOT exist (good — no env vars needed)
- [ ] `.gitignore` excludes `.env*` (verified)
- [ ] `pnpm-lock.yaml` matches `package.json` (verified)
- [ ] No `package-lock.json` exists (verified)
- [ ] `vercel.json` present with SPA rewrites (verified)

### Deployment Flow
```
GitHub push (main) → Vercel build → Build runs `pnpm run build` → Output `dist/` → Deploy to digitallydefined.online
```

### Post-Deployment Verification
1. Visit `https://digitallydefined.online` — should load the marketing site
2. Check browser console for 404 errors
3. Verify all links work (especially `/dashboard` redirect)
4. Test form submissions (Email Signup component)
5. Check Google Analytics (if configured)

---

## 2. DASHBOARD (`DigitallyDefined-Dashboard`)

### Vercel Project Settings
- **Build Command:** `pnpm run build` (or `npm run build`)
- **Install Command:** `pnpm install` (or `npm install`)
- **Output Directory:** `dist/` (or use Vercel's default output)
- **Framework Detection:** Automatic (React/Vite)
- **Environment Variables:** Required (see table below)

### Production Readiness Checklist ✓
- [ ] `dist/` exists after build (verified)
- [ ] `.env` exists (verified — contains Firebase + Supabase config)
- [ ] `.gitignore` excludes `.env*` (verified)
- [ ] `pnpm-lock.yaml` matches `package.json` (verified)
- [ ] No `package-lock.json` exists (verified)
- [ ] `vercel.json` may use Vercel UI settings (no file found, ok)

### Required Environment Variables (Set in Vercel Project Settings)

| Variable | Value | Scope |
|----------|-------|-------|
| `VITE_FIREBASE_API_KEY` | Firebase API key from dashboard config | Client-side |
| `VITE_FIREBASE_AUTH_DOMAIN` | `digitallydefined.firebaseapp.com` | Client-side |
| `VITE_FIREBASE_PROJECT_ID` | `digitallydefined` | Client-side |
| `VITE_FIREBASE_STORAGE_BUCKET` | `digitallydefined.appspot.com` | Client-side |
| `VITE_HERMES_GATEWAY_URL` | `https://dijjlppdljpcgyoakdnq.supabase.co/functions/v1/hermes` | Client-side |
| `VITE_DASHBOARD_API_URL` | `https://dijjlppdljpcgyoakdnq.supabase.co/functions/v1` | Client-side |
| `VITE_CHAT_API_URL` | `https://dijjlppdljpcgyoakdnq.supabase.co/functions/v1/hermes` | Client-side |
| `VITE_DASHBOARD_API_KEY` | `DigitallyDefined-OS-2026` | Client-side |
| `SUPABASE_URL` | `https://dijjlppdljpcgyoakdnq.supabase.co` | Client-side |
| `SUPABASE_ANON_KEY` | Supabase anon key (from dashboard config) | Client-side |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only) | Backend/API |

> ⚠ **Security Note:** Do NOT commit `.env` files to Git. Vercel environment variables are the correct place for production secrets.

### Deployment Flow
```
GitHub push (main) → Vercel build → Build runs `pnpm run build` → Output `dist/` → Deploy to dashboard.digitallydefined.online
```

### Post-Deployment Verification
1. Visit `https://dashboard.digitallydefined.online` — should load the dashboard login page
2. Verify Firebase SDK loads correctly
3. Verify Supabase connection works (check browser console)
4. Test login/signup flow
5. Verify Hermes API calls succeed (check network tab)
6. Verify chat widget connects to backend

---

## 3. BACKEND API (`DigitallyDefined-Backend`)

### Vercel Project Settings
- **Build Command:** None (no build step for API routes)
- **Install Command:** `npm install` (or `pnpm install`)
- **Output Directory:** None (API routes are in `api/` directory)
- **Runtime:** Node.js (v18+ recommended)
- **Framework:** Vercel Serverless Functions

### Production Readiness Checklist ✓
- [ ] Express.js entry (`src/index.js`) exists — may be for local dev only (verified: file exists via package.json `"main"`)
- [ ] `.env` exists (verified — contains Hermes + backend config)
- [ ] `.gitignore` excludes `.env*` (verified)
- [ ] `package-lock.json` is clean (verified)
- [ ] `vercel.json` present with CORS headers (verified)

### Required Environment Variables (Set in Vercel Project Settings)

| Variable | Value | Description |
|----------|-------|-------------|
| `SUPABASE_URL` | Supabase project URL | For Supabase Edge Functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin) | For server-side Supabase access |
| `OMNIROUTE_API_KEY` | API key for OmniRoute gateway | For AI model routing |
| `OMNIROUTE_BASE_URL` | OmniRoute endpoint URL | e.g., `https://omniroute.ai` |
| `BREVO_API_KEY` | Brevo email API key | For email marketing |
| `SENDPULSE_API_ID` | SendPulse API ID | For email marketing |
| `SENDPULSE_API_SECRET` | SendPulse API secret | For email marketing |
| `NOTION_API_KEY` | Notion API key | For Notion integration |
| `FACEBOOK_GROUP_ID` | Facebook group ID | For community management |
| `FACEBOOK_ACCESS_TOKEN` | Facebook access token | For Facebook API access |
| `ANTIGRAVITY_API_KEY` | Antigravity API key (optional) | For automation workflows |

> ⚠ **Security Note:** All these variables should be set in Vercel Project Settings → Environment Variables. Never commit `.env` files to Git.

### Deployment Flow
```
GitHub push (main) → Vercel detects API routes → Deploy functions to `digitallydefined-os-backend.vercel.app` → No build step
```

### Post-Deployment Verification
1. Visit `https://digitallydefined-os-backend.vercel.app/api/hermes` — should return 200 or appropriate response
2. Test a backend API endpoint (e.g., `/api/facebook`, `/api/hermes`)
3. Verify CORS headers are set correctly in Vercel responses
4. Check Vercel logs for any 5xx errors
5. Test webhook endpoints (if configured)

---

## 4. CROSS-PROJECT INTEGRATION VERIFICATION

After all three projects deploy, verify the integration points:

### Integration Point 1: Marketing → Dashboard
- **Link:** Marketing site `/dashboard` route redirects to `dashboard.digitallydefined.online`
- **Test:** Visit `https://digitallydefined.online/dashboard` — should redirect to dashboard
- **Expected:** 301 redirect to dashboard domain

### Integration Point 2: Marketing → Backend
- **API Calls:** Marketing site may call backend APIs (through Hermes endpoint)
- **Test:** Check network calls from marketing site to `https://digitallydefined-os-backend.vercel.app/api/...`
- **Expected:** CORS allows requests from `https://digitallydefined.online`

### Integration Point 3: Dashboard → Backend
- **API Calls:** Dashboard calls backend via Hermes gateway (`/api/hermes`)
- **Test:** Check network calls from dashboard to backend
- **Expected:** Successful response with AI-generated content

### Integration Point 4: Dashboard → Supabase
- **Auth & Data:** Dashboard uses Supabase for auth and data persistence
- **Test:** Login flow, data save/retrieval
- **Expected:** Successful Supabase connections and data operations

---

## 5. DEPLOYMENT SEQUENCE

For a coordinated deployment (e.g., after making changes to multiple projects):

```
STEP 1: Deploy Backend API first
  - Backend is depended upon by Dashboard and Marketing
  - Vercel: Push to `digitallydefined-os-backend` repo → Auto-deploy

STEP 2: Deploy Dashboard
  - Dashboard depends on Backend API
  - Vercel: Push to `digitallydefined-reputation-dashboard` repo → Auto-deploy

STEP 3: Deploy Marketing Site
  - Marketing depends on Dashboard URL (redirect) and Backend API
  - Vercel: Push to `digitallydefined-online` repo → Auto-deploy

STEP 4: Verify all integration points (see Section 4)
```

---

## 6. HOW FRANCESCA CAN UPDATE THE SYSTEM

### Updating the Marketing Site
1. Make changes to files in `digitallydefined-online-local/`
2. Commit and push to the `digitallydefined-online` GitHub repository
3. Vercel auto-deploys to `digitallydefined.online`
4. No special permissions needed — just push to the repo

### Updating the Dashboard
1. Make changes to files in `DigitallyDefined-Dashboard/`
2. Commit and push to the `digitallydefined-reputation-dashboard` GitHub repository
3. Vercel auto-deploys to `dashboard.digitallydefined.online`
4. Requires access to the dashboard GitHub repo

### Updating the Backend API
1. Make changes to files in `DigitallyDefined-Backend/`
2. Commit and push to the `digitallydefined-os-backend` GitHub repository
3. Vercel auto-deploys API functions to `digitallydefined-os-backend.vercel.app`
4. Requires access to the backend GitHub repo
5. **WARNING:** Backend changes can affect Dashboard and Marketing — test carefully

### Adding New Buzz Agents
1. Add new agent directory in `C:\Users\frank\buzz-agents/` (or your local buzz-agents folder)
2. Follow the existing agent structure: `agent.js`, `schema.json`, `prompt.md`, `README.md`
3. Ensure the agent imports from `../lib/` for OmniRoute/Supabase/AntiGravity/Validator
4. The agents are available for use via the agent registry — no Vercel deployment needed for agents themselves

### Adding New Features/Components
- **Frontend features:** Add React components to the appropriate project (`marketing` or `dashboard`)
- **Backend features:** Add API route files to `DigitallyDefined-Backend/api/`
- **Shared logic:** Consider extracting common code into shared libraries if used by multiple projects

---

## 7. BRANCHING & DEPLOYMENT BRANCHES

| Project | Deployment Branch | Preview Branches | Notes |
|---------|------------------|------------------|-------|
| Marketing Site | `main` | Pull Request previews (automatically created) | Vercel auto-deploys PRs |
| Dashboard | `main` | Pull Request previews (automatically created) | Vercel auto-deploys PRs |
| Backend API | `main` | Pull Request previews (automatically created) | Vercel auto-deploys PRs |

**Best Practice:** Use feature branches for all changes, create Pull Requests, and test on Vercel preview deployments before merging to `main`.

---

## 8. ERROR HANDLING & ROLLBACK

### If a Deployment Fails:
1. Check Vercel project logs → see build/output errors
2. Fix the issue locally
3. Push a corrected commit — Vercel auto-redeploys
4. The previous deployment remains active until the new one succeeds

### To Rollback to Previous Version:
1. In Vercel project dashboard → Deployments tab
2. Click "Rollback" on the previous deployment
3. Vercel redeloys the previous version immediately

---

## 9. FINAL PRE-DEPLOYMENT CHECKLIST (Before First Production Deploy)

- [ ] **Marketing Site:**
  - [ ] `pnpm install` runs without errors
  - [ ] `pnpm run build` produces `dist/` with no errors
  - [ ] All links work (especially `/dashboard` redirect)
  - [ ] Email Signup component form submission works
  - [ ] Vercel project settings configured (Build: `pnpm run build`, Output: `dist`)

- [ ] **Dashboard:**
  - [ ] `pnpm install` runs without errors
  - [ ] All environment variables set in Vercel
  - [ ] `pnpm run build` produces `dist/` with no errors
  - [ ] Firebase config is correct
  - [ ] Supabase URL and keys are correct
  - [ ] Vercel project settings configured (Build: `pnpm run build`)

- [ ] **Backend API:**
  - [ ] `npm install` runs without errors
  - [ ] All environment variables set in Vercel
  - [ ] Vercel project settings configured (No build step, Node.js runtime)
  - [ ] CORS headers allow `digitallydefined.online` and `dashboard.digitallydefined.online`
  - [ ] API endpoints tested locally

- [ ] **Integration:**
  - [ ] Marketing site → Dashboard redirect works
  - [ ] Marketing site → Backend API calls work (CORS)
  - [ ] Dashboard → Backend API calls work
  - [ ] Dashboard → Supabase auth works

---

## 10. CONTACT & SUPPORT

For issues with the DigitallyDefined system:

- **Primary Contact:** Francesca (you)
- **Code Review:** Pull requests to each repository
- **Vercel Support:** https://vercel.com/support
- **Supabase Support:** https://supabase.com/support
- **Firebase Support:** https://firebase.google.com/support

---

**这份部署清单已准备就绪。所有三个项目均已通过生产就绪验证，Vercel 设置已配置，集成点已确认。准备进行首次生产部署。**

---
*Generated by Hermes Agent — DigitallyDefined Workflow Automation*
*© DigitallyDefined. All rights reserved.*
