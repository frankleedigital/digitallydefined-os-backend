# Google Cloud Audit — eminent-clock-509216-e0

## Project Overview

| Field | Value |
|---|---|
| Project ID | `eminent-clock-509216-e0` |
| Project Name | (assumed: DigitallyDefined Intelligence) |
| Location | `us-central1` (recommended for all services) |

## Existing GCP Usage

The current codebase already references a **separate** GCP project (`gen-lang-client-0756039230`) for Vertex AI only. `eminent-clock-509216-e0` is new and unused.

### Existing Vertex AI Config (in `.env`)
```
VERTEX_API_KEY=AQ.Ab8...jXjg
VERTEX_PROJECT_ID=gen-lang-client-0756039230
VERTEX_LOCATION=us-central1
VERTEX_MODEL=gemini-3.5-flash
```

## Required APIs to Enable

| API | Service Name | Purpose |
|---|---|---|
| **Vertex AI** | `aiplatform.googleapis.com` | Gemini models, embeddings, vector search |
| **Firestore** | `firestore.googleapis.com` | Knowledge base (products, prompts, SOPs) |
| **Cloud Storage** | `storage.googleapis.com` | Asset storage, model artifacts |
| **BigQuery** | `bigquery.googleapis.com` | Analytics warehouse, dashboard aggregations |
| **Cloud Run** | `run.googleapis.com` | Background processors, scheduled jobs |
| **IAM** | `iam.googleapis.com` | Service accounts and permissions |
| **Secret Manager** | `secretmanager.googleapis.com` | API key management (optional) |

## ADC Status

**Not configured.** No gcloud CLI, no service account key, no ADC detection available on this machine.

### Setup Required
```bash
# Install gcloud CLI, then:
gcloud auth login
gcloud config set project eminent-clock-509216-e0
gcloud auth application-default login

# Enable APIs
gcloud services enable aiplatform.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable bigquery.googleapis.com
```

## Service Account Needed

Create a service account for the FastAPI backend:
```
Name: digitallydefined-intelligence
Roles:
  Vertex AI User (roles/aiplatform.user)
  Firestore User (roles/datastore.user)
  Storage Object Admin (roles/storage.objectAdmin)
  BigQuery Data Editor (roles/bigquery.dataEditor)
  BigQuery Job User (roles/bigquery.jobUser)
```

## Firestore Status

**Not created.** Must be created via `gcloud` or console:
```bash
gcloud firestore databases create --location=us-central1
```

## Cloud Storage Status

**Not configured.** Bucket needs creation:
```bash
gcloud storage buckets create gs://digitallydefined-knowledge --location=us-central1
```

## BigQuery Status

**Not configured.** Dataset needs creation:
```bash
bq mk --dataset --location=us-central1 eminent-clock-509216-e0:digitallydefined_analytics
```

## Cloud Run Status

**Not configured.** Will be used for scheduled background jobs.

## Infrastructure Diagram

```
eminent-clock-509216-e0 (Google Cloud)
├── Vertex AI
│   ├── Gemini (chat, analysis, generation)
│   ├── Embeddings (text-embedding-004)
│   └── Vector Search (knowledge retrieval)
├── Firestore (knowledge/)
│   ├── products
│   ├── leadmagnets
│   ├── prompts
│   ├── sops
│   ├── brand_assets
│   ├── agents
│   ├── content_templates
│   └── affiliate_resources
├── Cloud Storage
│   └── gs://digitallydefined-knowledge (assets, backups)
├── BigQuery
│   └── digitallydefined_analytics (aggregated metrics)
└── Cloud Run (background jobs, scheduled syncs)
```