"""Supabase configuration — single source for Supabase client settings.

Reuses the Supabase project env vars from the existing config.
"""

import logging
import os
from functools import lru_cache
from typing import Optional

logger = logging.getLogger("digitallydefined.fastapi.config.supabase")

# ---------------------------------------------------------------------------
# Env-backed configuration
# ---------------------------------------------------------------------------

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://dijjlppdljpcgyoakdnq.supabase.co")
# NOTE: the variable that actually exists in .env is SUPABASE_SERVICE_ROLE_KEY.
# Reading only SUPABASE_SERVICE_KEY made this always empty, so is_configured()
# reported False and the service-role path was dead. Read the real name first,
# keeping the old name as a fallback.
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv(
    "SUPABASE_SERVICE_KEY", ""
)
SUPABASE_ANON_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", "")

# ---------------------------------------------------------------------------
# Derived
# ---------------------------------------------------------------------------

REST_URL = f"{SUPABASE_URL.rstrip('/')}/rest/v1"
AUTH_URL = f"{SUPABASE_URL.rstrip('/')}/auth/v1"
FUNCTIONS_URL = f"{SUPABASE_URL.rstrip('/')}/functions/v1"


@lru_cache
def is_configured() -> bool:
    """Check if Supabase service key is available for backend operations."""
    return bool(SUPABASE_SERVICE_KEY)


@lru_cache
def get_headers(service_role: bool = True) -> dict:
    """Return auth headers for Supabase REST calls."""
    key = SUPABASE_SERVICE_KEY if service_role else SUPABASE_ANON_KEY
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }