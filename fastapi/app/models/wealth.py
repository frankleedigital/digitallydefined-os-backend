"""Digital Wealth Calculator request/response models."""
from pydantic import BaseModel, Field


class WealthRequest(BaseModel):
    niche: str = Field(..., min_length=1, description="Niche to calculate wealth potential for.")
    audience_size: int = Field(default=10000, ge=0, description="Estimated reachable audience.")
    product_type: str = Field(default="digital", description="Product type (template, course, bundle, SaaS).")
    pricing: float = Field(default=49.0, ge=0, description="Average price point per sale.")


class RevenueProjection(BaseModel):
    year1: float = 0.0
    year2: float = 0.0
    year3: float = 0.0
    breakout_note: str = ""


class WealthResponse(BaseModel):
    niche: str
    revenue_projection: RevenueProjection
    growth_model: str
    recommended_pricing: list[str]