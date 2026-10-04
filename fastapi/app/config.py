# app/config.py
"""Central env-driven config for the FastAPI microservice layer.

Reuses the same environment variables as the live DigitallyDefined backend
(Supabase project `dijjlppdljpcgyoakdnq`, OmniRoute gateway, DASHBOARD_API_KEY).
Unset/insecure LOCAL defaults are safe to run without secrets and let the
service layer degrade to deterministic output.
"""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Env-backed settings loaded from environment / `.env`."""

    model_config = SettingsConfigDict(
        env_file="../.env", env_file_encoding="utf-8", extra="ignore"
    )

    app_name: str = "DigitallyDefined FastAPI"
    environment: str = "development"

    # --- Supabase (same project as the live backend) ---
    supabase_url: str = "https://dijjlppdljpcgyoakdnq.supabase.co"
    supabase_service_key: str = ""

    # --- API-key auth (mirror edge `x-api-key` contract) ---
    dashboard_api_key: str = "DigitallyDefined-OS-2026"

    # --- OmniRoute AI gateway (live backend single provider) ---
    omniroute_base_url: str = "https://ai.digitallydefined.online/v1"
    omniroute_api_key: str = ""
    # NOT "auto": the gateway rejects that id with 401 ("No active credentials"),
    # so every request paid a wasted round-trip before falling through to a
    # working model.
    omniroute_model: str = "auto/cheap"
    # Ordered fallback chain tried in turn when a model fails transiently.
    # Ordered fastest-measured-first (see the timing table in app/llm.py): the
    # 8-22s spread across these ids dominates the latency of an uncached tool
    # call, so cheap/fast ids must be attempted before best-chat.
    omniroute_fallback_models: list[str] = [
        "auto/cheap",
        "auto/best-fast",
        "auto/chat",
        "auto/best-chat",
    ]

    # --- Puter workspace (optional execution/storage) ---
    puter_enabled: bool = False
    puter_api_key: str = ""

    # --- Security rim ---
    cors_origins: list[str] = [
        "https://digitallydefined.online",
        "https://www.digitallydefined.online",
        "https://dashboard.digitallydefined.online",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://localhost:8000",
    ]

    # --- Local scratch dir for file outputs (packages/zips) ---
    output_dir: Path = Path("output")


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    s.output_dir.mkdir(parents=True, exist_ok=True)
    return s


settings = get_settings()