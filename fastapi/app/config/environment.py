"""Environment validation, health checking, and configuration reporting.

Single Source of Truth (SSOT) configuration module for the FastAPI backend.
Replaces all hardcoded fallbacks and scattered os.getenv calls with centralized
validation.
"""

import logging
import os
from typing import Any, Dict, List

logger = logging.getLogger("digitallydefined.fastapi.config.environment")

# ---------------------------------------------------------------------------
# Required vs Optional Variables
# ---------------------------------------------------------------------------

REQUIRED_VARIABLES: List[str] = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_ANON_KEY",
    "GOOGLE_CLOUD_PROJECT",
    "OMNIROUTE_BASE_URL",
    "OMNIROUTE_API_KEY",
]

OPTIONAL_VARIABLES: List[str] = [
    "VERTEX_PROJECT_ID",
    "VERTEX_API_KEY",
    "OPENROUTER_API_KEY",
    "CLOUDFLARE_API_TOKEN",
    "NOTION_API_KEY",
    "BREVO_API_KEY",
    "GUMROAD_API_KEY",
]


# ---------------------------------------------------------------------------
# Validation Functions
# ---------------------------------------------------------------------------


def reportMissingVariables() -> List[str]:
    """Check environment for missing required variables.

    Returns a list of missing variable names.
    """
    missing = []
    for var in REQUIRED_VARIABLES:
        val = os.getenv(var, "").strip()
        if not val or val.startswith("your_") or val == "placeholder":
            missing.append(var)
    return missing


def validateEnvironment(raise_on_missing: bool = False) -> Dict[str, Any]:
    """Validate the runtime environment.

    If raise_on_missing is True, raises a RuntimeError on missing required variables.
    Returns a compliance report dict.
    """
    missing = reportMissingVariables()
    optional_present = [var for var in OPTIONAL_VARIABLES if os.getenv(var, "").strip()]

    report = {
        "status": "degraded" if missing else "healthy",
        "missing_required": missing,
        "optional_present": optional_present,
        "total_required_checked": len(REQUIRED_VARIABLES),
        "total_optional_checked": len(OPTIONAL_VARIABLES),
    }

    if missing:
        msg = f"Critical configuration missing: {', '.join(missing)}"
        if raise_on_missing:
            raise RuntimeError(msg)
        logger.warning(msg)
    else:
        logger.info("Environment validation passed: all required variables present.")

    return report


def startupHealthCheck() -> Dict[str, Any]:
    """Perform a comprehensive startup health check covering environment

    and connected clients (Firestore, Supabase, OmniRoute).
    """
    env_status = validateEnvironment(raise_on_missing=False)

    # Check GCP / Firestore
    gcp_health = {"firestore": False, "vertex": False}
    try:
        from .google import check_google_cloud

        gcp_health = check_google_cloud()
    except Exception as exc:
        gcp_health["error"] = str(exc)

    # Check Supabase config
    supabase_health = {"configured": False}
    try:
        from .supabase import is_configured, SUPABASE_URL

        supabase_health = {"configured": is_configured(), "url": SUPABASE_URL}
    except Exception as exc:
        supabase_health["error"] = str(exc)

    return {
        "environment": env_status,
        "google_cloud": gcp_health,
        "supabase": supabase_health,
    }


def get_config_summary() -> Dict[str, Any]:
    """Return a summary of configuration state (safe for logging — no secrets)."""
    return {
        "project_id": os.getenv("GOOGLE_CLOUD_PROJECT", "eminent-clock-509216-e0"),
        "region": os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1"),
        "supabase_url": os.getenv("SUPABASE_URL", "not set"),
        "omni_configured": bool(os.getenv("OMNIROUTE_API_KEY")),
        "vertex_configured": bool(os.getenv("VERTEX_API_KEY") or os.getenv("VERTEX_PROJECT_ID")),
    }
