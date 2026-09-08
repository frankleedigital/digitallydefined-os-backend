"""Trends request/response models (wraps the orphaned trends_api.py logic)."""
from pydantic import BaseModel, Field


class TrendRequest(BaseModel):
    keyword: str = Field(..., min_length=1)
    geo: str = "US"
    timeframe: str = "today 5-y"


class TrendResponse(BaseModel):
    keyword: str
    geo: str
    timeframe: str
    interest_over_time: dict = {}
    interest_by_region: dict = {}
    related_queries: list = []
    related_topics: list = []
    provider: str = "local"