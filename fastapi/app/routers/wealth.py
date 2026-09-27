"""Digital Wealth Calculator router — POST /wealth/calculate.

Revenue projection from audience size, product type and pricing.
Deterministic conversion-math with optional LLM narrative.
"""
import logging

from fastapi import APIRouter, HTTPException

from ..models import WealthRequest, WealthResponse
from ..services.wealth_service import wealth_calculation

logger = logging.getLogger("digitallydefined.fastapi.routers.wealth")

router = APIRouter(prefix="/wealth", tags=["wealth"])


@router.post("/calculate", response_model=WealthResponse)
async def calculate(req: WealthRequest) -> WealthResponse:
    try:
        return await wealth_calculation(req)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(exc)) from exc