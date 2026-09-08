# DigitallyDefined — FastAPI Microservice Layer

FastAPI scaffold for the DigitallyDefined microservices, generated from the
backend audit. The production backend is Node/Deno (Vercel + Supabase Edge);
this layer provides a Python/FastAPI equivalent with the same contracts.

## Microservices

| Prefix        | Route(s)                         | Purpose                                    |
|---------------|----------------------------------|--------------------------------------------|
| `/trends`     | `GET`/`POST /trends`             | Google Trends (ports orphaned trends_api)  |
| `/product-generator` | `POST /product-generator/generate` | Digital product concept                 |
| `/niche`      | `POST /niche/score`              | Niche demand + competition scoring         |
| `/domain`     | `POST /domain/analyze`           | Aged domain analyzer (WHOIS)               |
| `/affiliate`  | `POST /affiliate/flip`           | Affiliate market flipper                    |
| `/rank-rent`  | `POST /rank-rent/analyze`        | Rank-and-rent analyzer                      |
| `/blueprint`  | `POST /blueprint/generate`, `/blueprint/validate` | Automation blueprint generator |
| `/roadmap`    | `POST /roadmap/generate`         | Personalized roadmap generator             |

## Running

```bash
cd fastapi
python -m venv .venv
.\.venv\Scripts\activate           # Windows
pip install -r requirements.txt
# optional: set env vars (see .env.example)
uvicorn app.main:app --reload --port 8000
```

Docs at `http://localhost:8000/docs` (OpenAPI).

## Design notes

- `app/llm.py` is a hardened OmniRoute client: retries with backoff on
  429/5xx/network, SSE decoding, connection pooling, an ordered model
  **failover chain**, and fence-tolerant JSON parsing. It connects to the
  Linode gateway (`http://45.79.180.236:20128`).
- `app/storage.py` prefers Supabase REST and falls back to local JSONL when
  `SUPABASE_SERVICE_KEY` is unset.
- All services degrade to deterministic output when `OMNIROUTE_API_KEY` is unset.
- Each structured agent call tries `OMNIROUTE_MODEL` then the
  `OMNIROUTE_FALLBACK_MODELS` chain (`auto/best-fast`, `auto/cheap`, `auto/chat`,
  `auto/best-chat`) until one succeeds. For guaranteed 24/7 availability, add
  stable provider-backed models (e.g. `tllm/GPT_5_4`, `ddgw/gpt-5.4-mini`,
  `aug/gpt5.4-mini`) to `OMNIROUTE_FALLBACK_MODELS` once a provider route is
  healthy on the Linode.

## Converted modules (from `docs/hermes-mcp-archive/hermes`)

- `agents/product_generator_agent.py` → `services/product_generator.py`
- `agents/authority_blueprint_agent.py` → `services/authority_blueprint.py`
- `modules/content_schema_generator.py` → `services/content_schema_generator.py`
- `modules/schema_validator.py` → `services/schema_validator.py`
- `modules/product_packager.py` → `services/product_packager.py`
- `tools/trends.py` + `scripts/trends_api.py` → `services/trend_service.py`

## New microservices (previously missing)

- `services/domain_whois.py` — Aged Domain Analyzer
- `services/affiliate_service.py` — Affiliate Market Flipper
- `services/rankrent_service.py` — Rank-and-Rent Analyzer