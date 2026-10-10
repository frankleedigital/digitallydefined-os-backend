"""Affiliate Market Flipper request/response models."""
from pydantic import BaseModel, Field


class AffiliateFlipRequest(BaseModel):
    product: str = Field(..., min_length=1, description="Affiliate product to promote.")
    product_name: str = Field("", min_length=1, description="Specific product or program name (auto-filled or user-provided).")
    niche: str = Field(..., min_length=1, description="Niche the product targets.")
    commission_percent: float = Field(..., ge=0, le=100, description="Commission rate (percent).")
    product_price: float = Field(..., ge=0, description="Retail price of the product.")
    epc: float = Field(0.0, ge=0, description="Estimated earnings per click (EPC). If 0, service estimates it.")
    recurring: bool = Field(False, description="Whether the affiliate program is recurring revenue.")
    network: str = Field("", description="Affiliate network (Impact, ShareASale, Amazon, etc.).")


class AffiliateProductData(BaseModel):
    product: str
    category: str
    price: float
    commission_rate: float
    epc: float
    network: str
    recurring: bool


class AffiliateFlipResponse(BaseModel):
    product: str
    niche: str
    flip_score: float = Field(..., ge=0, le=100, description="Overall flip score (0-100).")
    difficulty_score: float = Field(..., ge=0, le=100, description="Difficulty to rank/convert (0-100).")
    roi: float = Field(..., ge=0, description="Estimated ROI (1 = break-even, higher = better).")
    revenue_projection: dict = Field(default_factory=dict, description="Revenue projection: {monthly_clicks, epc, estimated_revenue, roi, commission_per_sale}.")
    recommended_keywords: list = Field(default_factory=list, description="Recommended target keywords.")
    recommended_niche_angles: list = Field(default_factory=list, description="Recommended niche angles/sub-topics.")
    page_outline: list = Field(default_factory=list, description="Recommended page outline sections.")
    monetization_plan: list = Field(default_factory=list, description="Monetization plan steps.")
    seven_day_action_plan: list = Field(default_factory=list, description="7-day action plan.")
    verdict: str = Field(..., description="Should you promote this?")
    product_data: AffiliateProductData = Field(default_factory=AffiliateProductData, description="Resolved affiliate product data (from catalog or LLM estimate).")
    usage_source: str = Field("api", description="Whether data came from known catalog or LLM estimation.")
