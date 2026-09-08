"""Aged Domain Analyzer router — POST /domain/analyze."""
from fastapi import APIRouter, HTTPException

from ..models import DomainAnalyzeRequest, DomainAnalyzeResponse
from ..services.domain_whois import analyze_domain

router = APIRouter(prefix="/domain", tags=["domain"])


@router.post("/analyze", response_model=DomainAnalyzeResponse)
async def analyze(req: DomainAnalyzeRequest) -> DomainAnalyzeResponse:
    try:
        return await analyze_domain(req)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=str(exc)) from exc