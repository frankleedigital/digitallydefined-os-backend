"""Affiliate Market Flipper router — POST /affiliate/flip."""
from fastapi import APIRouter

from ..models import AffiliateFlipRequest, AffiliateFlipResponse
from ..services.affiliate_service import flip_analysis

router = APIRouter(prefix="/affiliate", tags=["affiliate"])


@router.post("/flip", response_model=AffiliateFlipResponse)
async def flip(req: AffiliateFlipRequest) -> AffiliateFlipResponse:
    return await flip_analysis(req)