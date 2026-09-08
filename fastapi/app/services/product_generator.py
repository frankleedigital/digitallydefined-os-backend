# app/services/product_generator.py
"""Digital Product Generator — port of the archived
`docs/hermes-mcp-archive/hermes/agents/product_generator_agent.py`.

Generates a faceless digital product concept from a keyword, with brand tone,
archetypes, trend awareness, and LLM enrichment (with deterministic fallback).
"""
import logging
from typing import Any

from ..llm import build_llm
from ..models import ProductRequest, ProductResponse
from ..storage import storage

logger = logging.getLogger("digitallydefined.fastapi.product_generator")

BRAND_TONE = "DigitallyDefined - faceless, warm, premium, structured, Gen-X female aligned."
ARCHETYPES = [
    "calculator",
    "template",
    "micro-saas",
    "faceless landing page",
    "authority bundle",
    "digital kit",
    "dashboard module",
]
DEFAULT_PRODUCT_TYPE = "digital"

_SYSTEM = """You are the DigitallyDefined Product Generator.
Turn a keyword into a faceless digital product concept. Return only JSON:
{"product_type":"...","features":["..."],"trend_narrative":"..."}"""


async def generate_product(req: ProductRequest) -> ProductResponse:
    base: dict[str, Any] = {
        "product_type": DEFAULT_PRODUCT_TYPE,
        "features": [],
        "trend_narrative": "",
    }

    llm = build_llm()
    if llm.available:
        try:
            data = await llm.call_json(
                _SYSTEM,
                f"Keyword: {req.keyword}\n"
                f"Goal: {req.goal or 'faceless digital asset'}\n"
                f"Audience: {req.audience or 'Gen X women'}\n"
                f"Monetization: {req.monetization or 'unspecified'}\n"
                f"Content style: {req.content_style or 'faceless, written'}",
            )
            base["product_type"] = data.get("product_type", DEFAULT_PRODUCT_TYPE)
            base["features"] = data.get("features", [])
            base["trend_narrative"] = data.get("trend_narrative", "Validate demand before build.")
        except Exception as exc:  # noqa: BLE001
            logger.warning("LLM fallback for product generator: %s", exc)
            base["trend_narrative"] = "No trend data. Validate demand with the niche scorecard first."

    resp = ProductResponse(
        keyword=req.keyword,
        product_type=base["product_type"],
        status="concept",
        brand_tone=BRAND_TONE,
        archetypes=ARCHETYPES,
        features=base["features"],
        trend_insights={"provider": "omniroute" if llm.available else "deterministic"},
        trend_narrative=base["trend_narrative"],
    )

    if req.persist:
        try:
            resp.persistence = await storage.insert(
                "product_concepts",
                {
                    "keyword": req.keyword,
                    "product_type": resp.product_type,
                    "features": resp.features,
                },
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("Product persist failed: %s", exc)

    return resp