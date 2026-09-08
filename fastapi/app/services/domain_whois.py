# app/services/domain_whois.py
"""Aged Domain Analyzer — NEW microservice (previously missing).

Attempts live WHOIS via `python-whois`. When offline/data unavailable it
degrades gracefully to a deterministic "verify manually" recommendation.
"""
import logging
import re
from datetime import datetime, timezone

from ..models import DomainAnalyzeRequest, DomainAnalyzeResponse

logger = logging.getLogger("digitallydefined.fastapi.domain_whois")


def _normalize(domain: str) -> str:
    d = domain.strip().lower()
    d = re.sub(r"^https?://", "", d)
    d = d.split("/", 1)[0]
    d = d.split("?", 1)[0]
    return d.rstrip(".")


def _fmt_age(days: int | None) -> str:
    if days is None:
        return "unknown"
    years, rem = divmod(days, 365)
    return f"{years}y {rem}d" if years else f"{days}d"


async def analyze_domain(req: DomainAnalyzeRequest) -> DomainAnalyzeResponse:
    domain = _normalize(req.domain)
    age_days: int | None = None
    expiry = None
    registrar: str | None = None

    try:
        import whois

        data = whois.whois(domain)
        if data is not None and data.creation_date:
            creation = data.creation_date
            if isinstance(creation, list):
                creation = creation[0]
            if creation is not None and getattr(creation, "year", 0) > 1:
                created = creation if creation.tzinfo else creation.replace(tzinfo=timezone.utc)
                age_days = (datetime.now(timezone.utc) - created).days
        if data is not None and data.expiration_date:
            ex = data.expiration_date
            expiry = ex[0] if isinstance(ex, list) else ex
        if data is not None and data.registrar:
            registrar = data.registrar if isinstance(data.registrar, str) else str(data.registrar)
    except Exception as exc:  # noqa: BLE001
        logger.warning("WHOIS lookup unavailable for %s: %s", domain, exc)
        age_days = None

    if age_days is None:
        recommendation = (
            f"{domain} registry data unavailable online. Confirm creation date / age "
            "via a WHOIS or registry lookup before relying on its age."
        )
    else:
        recommendation = (
            f"{domain} is ~{_fmt_age(age_days)} old. A representative aged-domain "
            "profile is a positive trust signal; still verify history, spam score, and backlinks."
        )

    return DomainAnalyzeResponse(
        domain=domain,
        age_days=age_days,
        age_readable=_fmt_age(age_days),
        expiry=str(expiry) if expiry else None,
        registrar=registrar,
        recommendation=recommendation,
    )