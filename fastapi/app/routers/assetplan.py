"""Asset Plan router — POST /asset-plan/calculate.

Freedom Number + 10x ROI calculator for faceless digital asset portfolios.
Deterministic math with optional LLM narrative enrichment.
"""
import logging

from fastapi import APIRouter, HTTPException

from ..models import AssetPlanRequest, AssetPlanResponse
from ..services.asset_plan_service import asset_plan

logger = logging.getLogger("digitallydefined.fastapi.routers.asset_plan")

router = APIRouter(prefix="/asset-plan", tags=["asset-plan"])


@router.post("/calculate", response_model=AssetPlanResponse)
async def calculate(req: AssetPlanRequest) -> AssetPlanResponse:
    try:
        return await asset_plan(req)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(exc)) from exc