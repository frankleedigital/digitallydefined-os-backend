# app/main.py
"""DigitallyDefined FastAPI main application.

Wires up CORS for the DigitallyDefined domains, a /health endpoint, a startup
lifespan that validates Supabase + OmniRoute connectivity, and all microservice
routers.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .deps import check_dependencies
from .llm import close_llm
from .models import HealthResponse
from .routers import (
    affiliate_router,
    blueprint_router,
    domain_router,
    niche_router,
    product_router,
    rankrent_router,
    roadmap_router,
    trends_router,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("digitallydefined.fastapi")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: validate Supabase + OmniRoute connectivity (non-fatal)."""
    logger.info("Starting %s (env=%s)", settings.app_name, settings.environment)
    ok, issues = await check_dependencies()
    if ok:
        logger.info("Dependency check passed.")
    else:
        logger.warning("Dependency check issues: %s", "; ".join(issues))
    yield
    await close_llm()
    logger.info("Shutting down %s", settings.app_name)


app = FastAPI(
    title="DigitallyDefined FastAPI",
    version="0.1.0",
    description=(
        "DigitallyDefined microservices — product generator, niche scoring, "
        "aged domain analyzer, affiliate flipper, rank-and-rent analyzer, "
        "automation blueprint, personalized roadmap, and trends."
    ),
    lifespan=lifespan,
)

# --- CORS (mirrors the live backend allowlist) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health() -> HealthResponse:
    ok, issues = await check_dependencies()
    checks = {
        "status": "ok" if ok else "degraded",
        "checks": {
            "supabase": "ok" if settings.supabase_service_key else "not_configured",
            "omniroute": "ok" if settings.omniroute_api_key else "not_configured",
        },
    }
    if issues:
        checks["checks"]["issues"] = "; ".join(issues)
    return HealthResponse(**checks)


@app.get("/", tags=["system"])
async def root() -> dict:
    return {"service": settings.app_name, "version": "0.1.0", "docs": "/docs"}


# --- Microservice routers ---
app.include_router(trends_router)
app.include_router(product_router)
app.include_router(niche_router)
app.include_router(domain_router)
app.include_router(affiliate_router)
app.include_router(rankrent_router)
app.include_router(blueprint_router)
app.include_router(roadmap_router)