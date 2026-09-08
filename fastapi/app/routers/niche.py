"""Niche Demand Scoring router — POST /niche/score.

Implements the same system prompt as the live Supabase `agent.niche`
(`supabase/functions/hermes/index.ts`), with a deterministic fallback when
OMNIROUTE_API_KEY is not configured.
"""
from fastapi import APIRouter, HTTPException

from ..llm import build_llm
from ..models import NicheScoreRequest, NicheScoreResponse

router = APIRouter(prefix="/niche", tags=["niche"])

_SYSTEM = """You are an AI-assisted niche discovery planner for DigitallyDefined.
Evaluate a niche for faceless digital real estate. Do not invent search-volume statistics.
Be explicit when recommendations require validation. Return only JSON:
{"niche":"...","keywords":["..."],"demand":"High|Medium|Low","competition":"High|Medium|Low","recommendation":"..."}"""


@router.post("/score", response_model=NicheScoreResponse)
async def score(req: NicheScoreRequest) -> NicheScoreResponse:
    llm = build_llm()
    if not llm.available:
        # Deterministic fallback — no LLM configured.
        return NicheScoreResponse(
            niche=req.niche,
            keywords=req.keywords or [req.niche],
            demand="Medium",
            competition="Medium",
            recommendation="Validate demand with the deterministic scorecard before building.",
        )
    try:
        data = await llm.call_json(
            _SYSTEM,
            f"Analyze this topic or niche: {req.niche}\nKeywords: {', '.join(req.keywords)}\nEvidence: {req.evidence}",
        )
        return NicheScoreResponse(
            niche=data.get("niche", req.niche),
            keywords=data.get("keywords", req.keywords or [req.niche]),
            demand=data.get("demand", "Medium"),
            competition=data.get("competition", "Medium"),
            recommendation=data.get("recommendation", ""),
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(exc)) from exc