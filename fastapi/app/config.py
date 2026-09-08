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
    omniroute_base_url: str = "http://45.79.180.236:20128"
    omniroute_api_key: str = ""
    omniroute_model: str = "auto/best-free"
    # Ordered fallback chain tried in turn when a model fails transiently.
    # Add stable paid models here (e.g. "ddgw/gpt-5.4-mini", "tllm/GPT_5_4")
    # for guaranteed 24/7 availability.
    omniroute_fallback_models: list[str] = [
        "auto/best-fast",
        "auto/cheap",
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