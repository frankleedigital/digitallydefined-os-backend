"""Affiliate Market Flipper request/response models."""
from pydantic import BaseModel, Field


class AffiliateFlipRequest(BaseModel):
    product: str = Field(..., min_length=1, description="Affiliate product to promote.")
    niche: str = Field(..., min_length=1, description="Niche the product targets.")
    commission_percent: float = Field(..., ge=0, le=100, description="Commission rate (percent).")
    product_price: float = Field(..., ge=0, description="Retail price of the product.")


class AffiliateFlipResponse(BaseModel):
    product: str
    niche: str
    commission_per_sale: float
    expected_conversion_rate: float
    breakeven_list_size: int
    risk_label: str
    strategy: str