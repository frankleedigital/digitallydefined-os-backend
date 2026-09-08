# app/deps.py
"""Shared dependencies and connectivity startup probe (Supabase + OmniRoute)."""
import logging

import httpx

from .config import settings

logger = logging.getLogger("digitallydefined.fastapi.deps")


async def check_dependencies() -> tuple[bool, list[str]]:
    """Health probe used by the startup lifespan and the /health route.

    Returns (overall_ok, list_of_issues). Missing secrets are NOT treated as
    failures — they simply mean the service layer degrades to local/deterministic
    behaviour (mirrors the archived agents' graceful fallback).
    """
    ok = True
    issues: list[str] = []

    # --- Supabase ---
    if settings.supabase_service_key:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                r = await client.get(
                    f"{settings.supabase_url.rstrip('/')}/rest/v1/",
                    headers={"apikey": settings.supabase_service_key},
                )
                if r.status_code in (200, 401):  # 401 = key reached auth layer -> reachable
                    logger.info("Supabase reachable (http %s)", r.status_code)
                else:
                    ok = False
                    issues.append(f"Supabase unexpected status {r.status_code}")
        except Exception as exc:  # noqa: BLE001
            ok = False
            issues.append(f"Supabase unreachable: {exc}")
    else:
        logger.warning("SUPABASE_SERVICE_KEY unset — falling back to local storage")

    # --- OmniRoute ---
    if settings.omniroute_api_key:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                r = await client.get(settings.omniroute_base_url)
                if r.status_code < 500:
                    logger.info("OmniRoute reachable (http %s)", r.status_code)
                else:
                    ok = False
                    issues.append(f"OmniRoute status {r.status_code}")
        except Exception as exc:  # noqa: BLE001
            ok = False
            issues.append(f"OmniRoute unreachable: {exc}")
    else:
        logger.warning("OMNIROUTE_API_KEY unset; LLM endpoints degrade to deterministic output")

    return ok, issues