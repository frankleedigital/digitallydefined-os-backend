"""Offer Architect (schema-driven offer architecture) request/response models."""
from pydantic import BaseModel, Field


class OfferArchitectRequest(BaseModel):
    funnel_stage: str = Field(
        ...,
        pattern="^(lead_magnet|core_offer|authority_bundle|community|recurring_revenue)$",
        description="Funnel stage to architect an offer for.",
    )
    niche: str = Field(..., min_length=1, description="Niche the offer targets.")
    audience: str = Field(default="", description="Target audience description.")
    price: float = Field(default=0.0, ge=0, description="Proposed price point.")
    description: str = Field(default="", description="Brief description of the offer or transformation.")


class OfferArchitectResponse(BaseModel):
    funnel_stage: str
    offer: dict
    validation_checklist: list[str]
    next_action: str