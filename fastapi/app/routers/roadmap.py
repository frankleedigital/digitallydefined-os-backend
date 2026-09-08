"""Personalized Roadmap Generator router — POST /roadmap/generate.

Matches the live Supabase `agent.roadmap` system prompt
(`supabase/functions/hermes/index.ts`) with a deterministic fallback.
"""
from fastapi import APIRouter, HTTPException

from ..llm import build_llm
from ..models import RoadmapRequest, RoadmapResponse

router = APIRouter(prefix="/roadmap", tags=["roadmap"])

_SYSTEM = """You create practical DigitallyDefined build roadmaps for Gen X women.
Use a calm, direct tone. Avoid income promises. Give concrete, sequential actions.
Return only JSON:
{"steps":["...","...","...","..."],"estimatedTime":"...","tools":["..."],"nextAction":"..."}"""


@router.post("/generate", response_model=RoadmapResponse)
async def generate(req: RoadmapRequest) -> RoadmapResponse:
    llm = build_llm()
    if not llm.available:
        return RoadmapResponse(
            steps=[
                "Define your niche",
                "Validate demand with the scorecard",
                "Build one small asset",
            ],
            estimated_time="3-5 days to start",
            tools=["Scorecard", "Notion template pair"],
            next_action="Run the niche scorecard",
        )
    try:
        user = f"Create a personalized roadmap from this profile:\n{req.model_dump_json()}"
        data = await llm.call_json(_SYSTEM, user)
        return RoadmapResponse(
            steps=data.get("steps", []),
            estimated_time=data.get("estimatedTime", ""),
            tools=data.get("tools", []),
            next_action=data.get("nextAction", ""),
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(exc)) from exc