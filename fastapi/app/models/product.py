"""Digital Product Generator request/response models."""
from pydantic import BaseModel, Field


class ProductRequest(BaseModel):
    keyword: str = Field(..., min_length=1, max_length=200, description="Core keyword/topic for the product")
    goal: str | None = Field(default=None, description="End goal the product serves.")
    audience: str | None = Field(default=None, description="Target audience.")
    monetization: str | None = Field(default=None, description="Monetization type (template, course, bundle...).")
    content_style: str | None = Field(default=None, description="Content style preference (faceless, written...).")
    persist: bool = True


class ProductResponse(BaseModel):
    keyword: str
    product_type: str
    status: str
    brand_tone: str
    archetypes: list[str]
    features: list[str]
    trend_insights: dict = {}
    trend_narrative: str
    persistence: dict | None = None