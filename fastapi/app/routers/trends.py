"""Trends router — GET /trends and POST /trends.

Wraps `trend_service.fetch_trends`, which ports the orphaned
`digitallydefined-os-backend/scripts/trends_api.py` / archived
`tools/trends.py` logic (pytrends).
"""
from fastapi import APIRouter, HTTPException

from ..models import TrendRequest, TrendResponse
from ..services.trend_service import fetch_trends

router = APIRouter(prefix="/trends", tags=["trends"])


@router.get("", response_model=TrendResponse)
async def get_trends(keyword: str, geo: str = "US", timeframe: str = "today 5-y") -> TrendResponse:
    return await fetch_trends(TrendRequest(keyword=keyword, geo=geo, timeframe=timeframe))


@router.post("", response_model=TrendResponse)
async def post_trends(req: TrendRequest) -> TrendResponse:
    try:
        return await fetch_trends(req)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(exc)) from exc