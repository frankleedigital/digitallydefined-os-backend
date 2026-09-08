"""Aged Domain Analyzer request/response models."""
from pydantic import BaseModel, Field


class DomainAnalyzeRequest(BaseModel):
    domain: str = Field(..., min_length=3, description="Domain name to analyze (with or without protocol/path).")
    include_history: bool = True


class DomainAnalyzeResponse(BaseModel):
    domain: str
    age_days: int | None
    age_readable: str | None
    expiry: str | None
    registrar: str | None
    seo_metrics: dict = {}
    recommendation: str