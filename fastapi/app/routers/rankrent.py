"""Rank-and-Rent Analyzer router — POST /rank-rent/analyze."""
from fastapi import APIRouter, HTTPException

from ..models import RankRentRequest, RankRentResponse
from ..services.rankrent_service import analyze_rank_rent

router = APIRouter(prefix="/rank-rent", tags=["rank-rent"])


@router.post("/analyze", response_model=RankRentResponse)
async def analyze(req: RankRentRequest) -> RankRentResponse:
    try:
        return await analyze_rank_rent(req)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(exc)) from exc