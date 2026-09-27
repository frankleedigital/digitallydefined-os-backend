"""Offer Architect router — POST /offer-architect/generate.

Schema-driven funnel-stage offer generator. Produces a validated offer
object plus a checklist and next action.
"""
import logging

from fastapi import APIRouter, HTTPException

from ..models import OfferArchitectRequest, OfferArchitectResponse
from ..services.offer_architect_service import offer_architect

logger = logging.getLogger("digitallydefined.fastapi.routers.offer_architect")

router = APIRouter(prefix="/offer-architect", tags=["offer-architect"])


@router.post("/generate", response_model=OfferArchitectResponse)
async def generate(req: OfferArchitectRequest) -> OfferArchitectResponse:
    try:
        return await offer_architect(req)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(exc)) from exc