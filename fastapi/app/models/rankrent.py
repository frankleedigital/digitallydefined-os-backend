"""Rank-and-Rent Analyzer request/response models."""
from pydantic import BaseModel, Field


class RankRentRequest(BaseModel):
    niche: str = Field(..., min_length=1, description="Local-intent niche/geo to analyze.")
    keywords: list[str] = Field(default_factory=list)
    competition_level: str = Field("medium", pattern="^(low|medium|high)$")


class RankRentResponse(BaseModel):
    niche: str
    keyword_clusters: list[dict]
    content_plan: dict
    monetization_strategy: dict
    recommendation: str