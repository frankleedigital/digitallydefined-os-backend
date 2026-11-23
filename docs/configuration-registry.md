# Configuration Registry & Single Source of Truth Architecture

**Project:** DigitallyDefined Ecosystem  
**Architecture Version:** 2.0 (Post-Consolidation)  
**Location:** `digitallydefined-os-backend/docs/configuration-registry.md`  

---

## 1. Overview

This document establishes the **Single Source of Truth (SSOT)** for all configuration, environment variables, credentials, and endpoints across the DigitallyDefined ecosystem. 

Prior to this architecture, configuration was fragmented across multiple `.env` files in different repositories, hardcoded fallback literals (`DigitallyDefined-OS-2026`), dead domain URLs (`backend-clean`), and redundant token stores.

Under SSOT Architecture 2.0:
1. **`os-backend/.env`** is the **sole master store** for all backend configuration and secrets.
2. **`dashboard/.env.local`** holds only client-side Vite variables (`VITE_*`) and the public Supabase anon key.
3. **Hardcoded fallback literals** are completely eliminated. Every service must resolve configuration through `app/config/environment.py` (FastAPI) or `src/config/env.js` (Node/Express).
4. **No credential duplication** is permitted between canonical files.

---

## 2. Canonical Ownership Matrix

| Integration / Domain | Canonical File Owner | Consuming Repositories / Services | Notes |
|---|---|---|---|
| **Supabase** (Database, Auth, Edge) | `os-backend/.env` | `os-backend`, `dashboard`, `supabase/functions` | Master connection details (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) |
| **Cloudflare** (CDN, R2, Workers) | `os-backend/.env` | `os-backend`, `supabase/functions` | R2 buckets (`R2_BUCKET_PRODUCTS`), Workers endpoints |
| **Google Cloud** (Vertex AI, Firestore) | `os-backend/.env` | `os-backend`, `fastapi/` | Project ID (`eminent-clock-509216-e0`), ADC path, Vertex API keys |
| **OpenRouter** (AI Fallback) | `os-backend/.env` | `os-backend`, `fastapi/` | Premium model fallback when OmniRoute/Gemini-first is exhausted |
| **OmniRoute** (Local AI Gateway) | `os-backend/.env` | `os-backend`, `~/.hermes/` | Gateway URL (`http://localhost:20128/v1` — local Docker only), JWT Bearer, WebSocket bridge secret |
| **Notion OS** (8 Databases) | `os-backend/.env` | `os-backend` | Integration token, database IDs for content, leads, money, commands |
| **Brevo** (Email & CRM) | `os-backend/.env` | `os-backend` | API key, list ID, sender details |
| **Gumroad** (Product Commerce) | `os-backend/.env` | `os-backend` | API key for product catalog and license validation |

---

## 3. Environment Variable Registry

Every variable used in the ecosystem, its purpose, canonical location, and validation rule.

### Core System & API
| Variable Name | Canonical Location | Purpose | Required? |
|---|---|---|---|
| `NODE_ENV` | `os-backend/.env` | Runtime environment (`production`, `development`) | Yes |
| `PORT` | `os-backend/.env` | Express backend listening port (default `3000`) | No |
| `ALLOWED_ORIGINS` | `os-backend/.env` | CORS allowed origins (dashboard, storefront domains) | Yes |
| `DASHBOARD_API_KEY` | `os-backend/.env` | Server-side API key for authenticated `/api/*` requests | Yes |
| `VITE_DASHBOARD_API_KEY` | `dashboard/.env.local` | Client-side API key sent as `x-api-key` header | Yes |
| `VITE_API_URL` | `dashboard/.env.local` | Canonical backend URL (`https://digitallydefined-os-backend.vercel.app`) | Yes |

### Supabase
| Variable Name | Canonical Location | Purpose | Required? |
|---|---|---|---|
| `SUPABASE_URL` | `os-backend/.env` | Supabase project URL (`https://dj...supabase.co`) | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | `os-backend/.env` | Privileged service role key (backend writes/RLS bypass) | Yes |
| `SUPABASE_ANON_KEY` | `os-backend/.env` | Public anonymous key | Yes |
| `VITE_SUPABASE_URL` | `dashboard/.env.local` | Client Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | `dashboard/.env.local` | Client Supabase public anon key | Yes |

### Artificial Intelligence & OmniRoute
| Variable Name | Canonical Location | Purpose | Required? |
|---|---|---|---|
| `OMNIROUTE_BASE_URL` | `os-backend/.env` | OmniRoute local gateway (`http://localhost:20128/v1` — local only, no public endpoint) | Yes |
| `OMNIROUTE_API_KEY` | `os-backend/.env` | OmniRoute JWT Bearer token | Yes |
| `OMNIROUTE_WS_BRIDGE_SECRET` | `os-backend/.env` | WebSocket session bridge secret | Yes |
| `OMNIROUTE_MODEL` | `os-backend/.env` | Default model alias (`auto`) | No |
| `GEMINI_API_KEY` | `os-backend/.env` | Direct Gemini fallback API key | No |
| `VERTEX_API_KEY` | `os-backend/.env` | Google Cloud Vertex AI express-mode key | No |
| `VERTEX_PROJECT_ID` | `os-backend/.env` | GCP project ID for Vertex AI (`gen-lang-client-0756039230`) | No |
| `VERTEX_LOCATION` | `os-backend/.env` | GCP region (`us-central1`) | No |
| `OPENROUTER_API_KEY` | `os-backend/.env` | OpenRouter paid fallback API key | No |

### Google Cloud (Intelligence Layer & Knowledge Base)
| Variable Name | Canonical Location | Purpose | Required? |
|---|---|---|---|
| `GOOGLE_CLOUD_PROJECT` | `os-backend/.env` | GCP project ID (`eminent-clock-509216-e0`) | Yes |
| `GOOGLE_CLOUD_LOCATION` | `os-backend/.env` | GCP region (`us-central1`) | Yes |
| `FIRESTORE_DATABASE` | `os-backend/.env` | Firestore database instance (`(default)`) | Yes |
| `STORAGE_BUCKET` | `os-backend/.env` | Cloud Storage knowledge bucket | Yes |
| `BIGQUERY_DATASET` | `os-backend/.env` | BigQuery analytics dataset | Yes |

### Cloudflare & R2
| Variable Name | Canonical Location | Purpose | Required? |
|---|---|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | `os-backend/.env` | Cloudflare account identifier | No |
| `CLOUDFLARE_API_TOKEN` | `os-backend/.env` | Scoped Workers/R2 API token | No |
| `R2_BUCKET_PRODUCTS` | `os-backend/.env` | R2 product asset bucket | No |
| `R2_BUCKET_ASSETS` | `os-backend/.env` | R2 general asset bucket | No |

### External Integrations (Notion, Brevo, Gumroad, Social)
| Variable Name | Canonical Location | Purpose | Required? |
|---|---|---|---|
| `NOTION_API_KEY` | `os-backend/.env` | Notion integration token | Yes |
| `BREVO_API_KEY` | `os-backend/.env` | Brevo email marketing API key | Yes |
| `GUMROAD_API_KEY` | `os-backend/.env` | Gumroad commerce API key | Yes |
| `FIRECRAWL_API_KEY` | `os-backend/.env` | Web scraping API key | No |
| `EXA_API_KEY` | `os-backend/.env` | Search engine API key | No |
| `AGENTOPS_API_KEY` | `os-backend/.env` | LLM observability API key | No |

---

## 4. Elimination of Hardcoded Fallbacks

All hardcoded fallback strings such as `'DigitallyDefined-OS-2026'`, `https://digitallydefined-backend-clean.vercel.app`, and legacy domains have been purged from the source tree.

- **Before:** `const apiKey = import.meta.env.VITE_DASHBOARD_API_KEY || 'DigitallyDefined-OS-2026';`
- **After:** `const apiKey = environment.getRequired('VITE_DASHBOARD_API_KEY');` (throws startup error if missing).

---

## 5. Verification & Compliance
- **Zero Secrets in Code:** Scanned via regex for JWT, `sk-`, `shpat_`, and `hf_` patterns. Result: 0 leaks in source code.
- **Single Master Store:** All backend runtime configs resolve directly from `os-backend/.env`.
- **AI Agent Readability:** Any agent inspecting `app/config/` instantly understands the complete operational environment.
