"""Asset Plan (Freedom Number / 10x ROI) request/response models."""
from pydantic import BaseModel, Field


class AssetPlanRequest(BaseModel):
    niche: str = Field(..., min_length=1, description="Niche to build assets for.")
    audience_size: int = Field(default=10000, ge=0, description="Estimated addressable audience.")
    product_type: str = Field(default="digital", description="Product type (template, course, bundle, SaaS).")
    pricing: float = Field(default=49.0, ge=0, description="Average price point.")
    current_age: int = Field(default=52, ge=18, le=120, description="Current age for retirement framing.")
    retire_age: int = Field(default=67, ge=18, le=120, description="Target retirement age.")
    months_to_live: int = Field(default=30, ge=1, description="Months of expenses to cover (freedom number).")
    monthly_expenses: float = Field(default=4000.0, ge=0, description="Monthly expense baseline.")


class AssetPlanResponse(BaseModel):
    niche: str
    portfolio_summary: str
    assumptions: list[str]
    concentration_risks: list[str]
    build_order: list[str]
    next_action: str
    disclaimer: str