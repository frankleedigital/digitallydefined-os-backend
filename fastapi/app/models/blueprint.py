"""Automation Blueprint Generator request/response models."""
from pydantic import BaseModel, Field


class BlueprintRequest(BaseModel):
    keyword: str = Field(..., min_length=1, description="Topic/keyword the authority blueprint targets.")
    stage: str | None = Field(default=None, description="Optional funnel stage focus.")


class BlueprintResponse(BaseModel):
    keyword: str
    blueprint_type: str
    pillars: list[dict]
    components: list[dict]
    trend_narrative: str
    schema_doc: dict | None = None
    package: dict | None = None
    persistence: dict | None = None