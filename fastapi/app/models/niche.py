"""Niche Demand Scoring request/response models."""
from pydantic import BaseModel, Field


class NicheScoreRequest(BaseModel):
    niche: str = Field(..., min_length=1, description="Niche/topic to score for faceless digital real estate.")
    keywords: list[str] = Field(default_factory=list)
    evidence: dict = Field(default_factory=dict, description="Optional user-supplied market evidence.")


class NicheScoreResponse(BaseModel):
    niche: str
    keywords: list[str]
    demand: str
    competition: str
    recommendation: str