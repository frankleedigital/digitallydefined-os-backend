"""Personalized Roadmap Generator request/response models."""
from pydantic import BaseModel, Field


class RoadmapRequest(BaseModel):
    superpower: str = Field(..., min_length=1, description="Superpower classification (Builder, Creator, Educator, Strategist, Connector).")
    profile: dict = Field(default_factory=dict, description="Optional user profile/strengths/blindspots.")
    goal: str | None = Field(default=None, description="User's stated goal.")
    answers: dict = Field(default_factory=dict, description="Raw quiz answers, if available.")


class RoadmapResponse(BaseModel):
    steps: list[str]
    estimated_time: str
    tools: list[str]
    next_action: str