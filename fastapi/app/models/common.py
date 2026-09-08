"""Shared response envelopes."""
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    checks: dict[str, str] = {}


class ApiError(BaseModel):
    error: str
    details: str | None = None