# app/services/rankrent_service.py
"""Rank-and-Rent Analyzer — NEW microservice (previously only a spec in
`workspace/buzz-agents/ai-rankand-rent-builder`).

Produces a local-intent digital asset plan (keyword clusters, content plan,
monetization). LLM-enriched via OmniRoute with a deterministic fallback.
"""
import logging

from ..llm import build_llm
from ..models import RankRentRequest, RankRentResponse

logger = logging.getLogger("digitallydefined.fastapi.rankrent_service")

_SYSTEM = """You are the AI RankandRent Builder for DigitallyDefined.
This is a local-intent lead asset plan. No hype. Return ONLY JSON:
{"keywordClusters":[{"topic":"...","keywords":["..."]}],"contentPlan":{"pillar_posts":["..."],"city_pages":["..."]},"monetizationStrategy":{"model":"lease|service|sell","terms":"..."},"recommendation":"..."}"""


async def analyze_rank_rent(req: RankRentRequest) -> RankRentResponse:
    llm = build_llm()
    if llm.available:
        try:
            user = (
                f"Rank-and-rent plan for niche '{req.niche}', keywords {req.keywords or []}, "
                f"competition {req.competition_level}."
            )
            data = await llm.call_json(_SYSTEM, user)
            return RankRentResponse(
                niche=req.niche,
                keyword_clusters=data.get("keywordClusters", [{"topic": req.niche, "keywords": req.keywords}]),
                content_plan=data.get("contentPlan", {"pillar_posts": [], "city_pages": []}),
                monetization_strategy=data.get("monetizationStrategy", {"model": "lease", "terms": "TBD validation"}),
                recommendation=data.get("recommendation", ""),
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("LLM fallback for rank-rent: %s", exc)

    return RankRentResponse(
        niche=req.niche,
        keyword_clusters=[{"topic": req.niche, "keywords": req.keywords}],
        content_plan={"pillar_posts": [], "city_pages": []},
        monetization_strategy={"model": "lease", "terms": "TBD validation"},
        recommendation="Validate local intent and competition, then build one local asset.",
    )