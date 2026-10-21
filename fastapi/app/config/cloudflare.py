"""Cloudflare configuration — R2, Workers, and Pages integration settings.

The os-backend does NOT manage Cloudflare — Workers and Pages have their own
deployment pipelines. This module documents the expected bindings and provides
client helpers for R2 access when needed.
"""

import logging
import os
from functools import lru_cache

logger = logging.getLogger("digitallydefined.fastapi.config.cloudflare")

# ---------------------------------------------------------------------------
# Env-backed configuration
# ---------------------------------------------------------------------------

CF_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID", "")
CF_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN", "")

# R2 buckets (used by the backend for asset storage)
R2_BUCKET_PRODUCTS = os.getenv("R2_BUCKET_PRODUCTS", "digitallydefined-products")
R2_BUCKET_ASSETS = os.getenv("R2_BUCKET_ASSETS", "digitallydefined-assets")
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL", "https://assets.digitallydefined.agency")

# Workers
WORKER_SYNC_URL = os.getenv("WORKER_SYNC_URL", "")
WORKER_PUBLISH_URL = os.getenv("WORKER_PUBLISH_URL", "")


@lru_cache
def is_r2_configured() -> bool:
    """Check if R2 credentials are available."""
    return bool(CF_ACCOUNT_ID) and bool(CF_API_TOKEN)