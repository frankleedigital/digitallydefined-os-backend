"""Google Cloud configuration and client initialization.

Single location for all GCP service clients. No duplicate initialization elsewhere.

Requirements:
- GOOGLE_APPLICATION_CREDENTIALS env var (ADC) OR
- VERTEX_API_KEY + VERTEX_PROJECT_ID env vars for Vertex AI only
"""

import logging
import os
from functools import lru_cache
from typing import Optional

logger = logging.getLogger("digitallydefined.fastapi.config.google")

# ---------------------------------------------------------------------------
# Env-backed configuration
# ---------------------------------------------------------------------------

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "eminent-clock-509216-e0")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

# Vertex AI
VERTEX_PROJECT_ID = os.getenv("VERTEX_PROJECT_ID", PROJECT_ID)
VERTEX_LOCATION = os.getenv("VERTEX_LOCATION", LOCATION)
VERTEX_API_KEY = os.getenv("VERTEX_API_KEY", "")
VERTEX_MODEL = os.getenv("VERTEX_MODEL", "gemini-3.5-flash")

# Firestore
FIRESTORE_DATABASE = os.getenv("FIRESTORE_DATABASE", "(default)")

# Cloud Storage
STORAGE_BUCKET = os.getenv("STORAGE_BUCKET", "digitallydefined-knowledge")

# BigQuery
BIGQUERY_DATASET = os.getenv("BIGQUERY_DATASET", "digitallydefined_analytics")

# ---------------------------------------------------------------------------
# Client initialization
# ---------------------------------------------------------------------------


@lru_cache
def has_adc() -> bool:
    """Check if Application Default Credentials are available."""
    try:
        import google.auth  # type: ignore

        credentials, project = google.auth.default()
        return credentials is not None
    except Exception:
        return False


@lru_cache
def get_vertex_client():
    """Initialize and return the Vertex AI client."""
    try:
        import vertexai  # type: ignore

        vertexai.init(project=VERTEX_PROJECT_ID, location=VERTEX_LOCATION)
        logger.info("Vertex AI initialized: project=%s location=%s", VERTEX_PROJECT_ID, VERTEX_LOCATION)
        return vertexai
    except ImportError:
        logger.warning("vertexai not installed. Install with: pip install google-cloud-aiplatform")
        return None
    except Exception as e:
        logger.error("Vertex AI init failed: %s", e)
        return None


@lru_cache
def get_firestore_client():
    """Initialize and return the Firestore client."""
    try:
        from google.cloud import firestore  # type: ignore

        client = firestore.AsyncClient(project=PROJECT_ID, database=FIRESTORE_DATABASE)
        logger.info("Firestore initialized: project=%s database=%s", PROJECT_ID, FIRESTORE_DATABASE)
        return client
    except ImportError:
        logger.warning("google-cloud-firestore not installed.")
        return None
    except Exception as e:
        logger.error("Firestore init failed: %s", e)
        return None


@lru_cache
def get_storage_client():
    """Initialize and return the Cloud Storage client."""
    try:
        from google.cloud import storage  # type: ignore

        client = storage.Client(project=PROJECT_ID)
        logger.info("Cloud Storage initialized: project=%s", PROJECT_ID)
        return client
    except ImportError:
        logger.warning("google-cloud-storage not installed.")
        return None
    except Exception as e:
        logger.error("Cloud Storage init failed: %s", e)
        return None


@lru_cache
def get_bigquery_client():
    """Initialize and return the BigQuery client."""
    try:
        from google.cloud import bigquery  # type: ignore

        client = bigquery.Client(project=PROJECT_ID)
        logger.info("BigQuery initialized: project=%s", PROJECT_ID)
        return client
    except ImportError:
        logger.warning("google-cloud-bigquery not installed.")
        return None
    except Exception as e:
        logger.error("BigQuery init failed: %s", e)
        return None


# ---------------------------------------------------------------------------
# Readiness check
# ---------------------------------------------------------------------------


def check_google_cloud():
    """Return a dict of which GCP services are available."""
    return {
        "adc_configured": has_adc(),
        "project_id": PROJECT_ID,
        "location": LOCATION,
        "vertex_ai": get_vertex_client() is not None,
        "firestore": get_firestore_client() is not None,
        "cloud_storage": get_storage_client() is not None,
        "bigquery": get_bigquery_client() is not None,
    }


# ---------------------------------------------------------------------------
# Pre-initialize on import for fast paths
# ---------------------------------------------------------------------------
# If ADC is available, prime the caches so first actual call is fast.
if has_adc():
    get_vertex_client()
    get_firestore_client()
    get_storage_client()
    get_bigquery_client()